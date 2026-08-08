"""OpenAI provider implementation.

Talks to OpenAI's chat-completions endpoint (e.g. gpt-4o, gpt-4o-mini).
Requires ``OPENAI_API_KEY``; without it the factory falls back to ``MockProvider``.
"""

from __future__ import annotations

import json
import re
import time
from typing import Any

import httpx

from app.core.config import settings
from app.core.exceptions import AIProviderError
from app.core.logging import get_logger
from app.schemas.ai import AIPayload
from app.services.ai.prompts import loader
from app.services.ai.provider import AIResponse

logger = get_logger(__name__)

_RETRYABLE_STATUS = {408, 409, 425, 429, 500, 502, 503, 504}
_MAX_ATTEMPTS = 2
_FENCE = re.compile(r"^```(?:json)?\s*(.*?)\s*```$", re.DOTALL)


class OpenAIProvider:
    """:class:`~app.services.ai.provider.AIProvider` implementation for OpenAI."""

    name = "openai"

    def __init__(
        self,
        *,
        api_key: str | None = None,
        base_url: str | None = None,
        model: str | None = None,
        timeout: float | None = None,
        client: httpx.AsyncClient | None = None,
    ) -> None:
        self.api_key = api_key if api_key is not None else settings.openai_api_key
        self.base_url = (base_url or settings.openai_base_url).rstrip("/")
        self.model = model or settings.openai_model
        self.timeout = timeout if timeout is not None else settings.openai_timeout_seconds
        self._client = client
        self._owns_client = client is None

    @property
    def is_mock(self) -> bool:
        return False

    @property
    def configured(self) -> bool:
        return bool(self.api_key)

    def _get_client(self) -> httpx.AsyncClient:
        if self._client is None:
            self._client = httpx.AsyncClient(
                base_url=self.base_url,
                timeout=httpx.Timeout(self.timeout),
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                },
            )
        return self._client

    async def aclose(self) -> None:
        if self._client is not None and self._owns_client:
            await self._client.aclose()
            self._client = None

    async def _chat(self, user_prompt: str, *, json_mode: bool) -> tuple[str, dict[str, Any]]:
        if not self.configured:
            raise AIProviderError(
                "OPENAI_API_KEY is not set.",
                code="ai_provider_unconfigured",
            )

        body: dict[str, Any] = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": loader.system_prompt()},
                {"role": "user", "content": user_prompt},
            ],
            "temperature": 0.3,
            "max_tokens": settings.openai_max_tokens,
        }
        if json_mode:
            body["response_format"] = {"type": "json_object"}

        client = self._get_client()
        start = time.perf_counter()
        response_json: dict[str, Any] | None = None

        for attempt in range(1, _MAX_ATTEMPTS + 1):
            try:
                res = await client.post("/chat/completions", json=body)
                if res.status_code == 200:
                    response_json = res.json()
                    break

                error_body = res.text
                if res.status_code in _RETRYABLE_STATUS and attempt < _MAX_ATTEMPTS:
                    logger.warning(
                        "openai_transient_failure_retrying",
                        extra={"status": res.status_code, "attempt": attempt},
                    )
                    continue

                raise AIProviderError(
                    f"OpenAI returned HTTP {res.status_code}: {error_body[:200]}",
                    status_code=502 if res.status_code >= 500 else 400,
                    code=f"openai_http_{res.status_code}",
                )
            except httpx.TimeoutException as exc:
                if attempt < _MAX_ATTEMPTS:
                    continue
                raise AIProviderError(
                    f"OpenAI request timed out after {self.timeout}s.",
                    status_code=504,
                    code="openai_timeout",
                ) from exc
            except httpx.RequestError as exc:
                if attempt < _MAX_ATTEMPTS:
                    continue
                raise AIProviderError(
                    f"Network error talking to OpenAI: {exc}",
                    status_code=502,
                    code="openai_network_error",
                ) from exc

        if response_json is None:
            raise AIProviderError("OpenAI returned no response.", code="openai_empty_response")

        latency_ms = int((time.perf_counter() - start) * 1000)
        try:
            choice = response_json["choices"][0]
            content = choice["message"]["content"] or ""
        except (KeyError, IndexingError, TypeError) as exc:
            raise AIProviderError("Malformed response structure from OpenAI.", code="openai_parse_error") from exc

        usage = response_json.get("usage", {})
        meta = {
            "prompt_tokens": usage.get("prompt_tokens"),
            "completion_tokens": usage.get("completion_tokens"),
            "total_tokens": usage.get("total_tokens"),
            "latency_ms": latency_ms,
        }
        return content, meta

    async def _generate_section(
        self, prompt_name: str, payload: AIPayload, *, json_mode: bool = False
    ) -> AIResponse:
        user_prompt, version = loader.render_prompt(prompt_name, payload)
        raw_text, meta = await self._chat(user_prompt, json_mode=json_mode)

        structured: dict[str, object] | None = None
        if json_mode:
            clean = raw_text.strip()
            match = _FENCE.match(clean)
            if match:
                clean = match.group(1).strip()

            try:
                parsed = json.loads(clean)
                if isinstance(parsed, dict):
                    structured = parsed
                else:
                    logger.warning("openai_json_not_object", extra={"type": type(parsed).__name__})
            except json.JSONDecodeError as exc:
                logger.warning("openai_json_parse_failed", extra={"raw": clean[:200], "err": str(exc)})

        return AIResponse(
            content=raw_text,
            structured=structured,
            provider=self.name,
            model=self.model,
            prompt_version=version,
            is_fallback=False,
            tokens_prompt=meta.get("prompt_tokens"),
            tokens_completion=meta.get("completion_tokens"),
            latency_ms=meta.get("latency_ms"),
            meta={"provider_model": self.model},
        )

    async def generate_summary(self, payload: AIPayload) -> AIResponse:
        return await self._generate_section("summary", payload, json_mode=False)

    async def generate_root_cause(self, payload: AIPayload) -> AIResponse:
        return await self._generate_section("root_cause", payload, json_mode=True)

    async def generate_recommendations(self, payload: AIPayload) -> AIResponse:
        return await self._generate_section("recommendations", payload, json_mode=True)

    async def generate_risks(self, payload: AIPayload) -> AIResponse:
        return await self._generate_section("risks", payload, json_mode=True)


__all__ = ["OpenAIProvider"]
