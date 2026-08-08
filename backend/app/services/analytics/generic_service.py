import io
import uuid
import pandas as pd
import httpx
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException

from app.core.logging import get_logger
from app.models.dataset import Dataset, EntityType
from app.repositories.dataset import DatasetRepository
from app.core.config import settings

logger = get_logger(__name__)

class GenericAnalyticsService:
    def __init__(self, session: AsyncSession, organization_id: uuid.UUID):
        self.session = session
        self.organization_id = organization_id
        self.datasets = DatasetRepository(session, organization_id)

    async def analyze_and_generate(self, dataset_id: uuid.UUID) -> dict:
        dataset = await self.datasets.get(dataset_id)
        if not dataset:
            raise HTTPException(status_code=404, detail="Dataset not found")
        if dataset.entity_type != EntityType.GENERIC:
            raise HTTPException(status_code=400, detail="Not a generic dataset")
        if not dataset.raw_content:
            raise HTTPException(status_code=400, detail="No raw content available for this dataset")

        # Load into Pandas
        try:
            df = pd.read_csv(io.BytesIO(dataset.raw_content))
        except Exception as e:
            logger.exception("Failed to parse CSV for generic analysis")
            raise HTTPException(status_code=400, detail="Failed to parse CSV")

        # Basic Stats
        columns = df.columns.tolist()
        num_rows = len(df)
        numeric_cols = df.select_dtypes(include=["number"]).columns.tolist()
        
        stats = []
        for col in numeric_cols:
            stats.append({
                "column": col,
                "mean": float(df[col].mean()) if pd.notnull(df[col].mean()) else 0,
                "min": float(df[col].min()) if pd.notnull(df[col].min()) else 0,
                "max": float(df[col].max()) if pd.notnull(df[col].max()) else 0,
                "missing": int(df[col].isnull().sum()),
            })

        # Generate dynamic charts
        charts = []
        
        # Chart 1: Top 10 categories of the most suitable categorical column
        categorical_cols = df.select_dtypes(include=["object", "category"]).columns.tolist()
        if categorical_cols:
            cat_col = categorical_cols[0] # Pick the first categorical column
            top_cats = df[cat_col].value_counts().head(10)
            chart_data = [{"name": str(idx), "value": int(val)} for idx, val in top_cats.items()]
            charts.append({
                "id": "chart_1",
                "title": f"Top 10 {cat_col}",
                "type": "bar",
                "data": chart_data
            })
            
        # Chart 2: Distribution or top values of the first numeric column
        if numeric_cols:
            num_col = numeric_cols[0]
            # Since histograms are complex to render without binning, we can just show top 10 rows for a quick line/bar chart if data is small, or bin it
            # Binning for distribution
            try:
                import numpy as np
                hist, bin_edges = np.histogram(df[num_col].dropna(), bins=10)
                chart_data = [{"name": f"{bin_edges[i]:.1f}-{bin_edges[i+1]:.1f}", "value": int(hist[i])} for i in range(len(hist))]
                charts.append({
                    "id": "chart_2",
                    "title": f"Distribution of {num_col}",
                    "type": "bar", # Render as bar for distribution
                    "data": chart_data
                })
            except Exception as e:
                logger.error(f"Failed to build histogram chart: {e}")

        # Build prompt payload
        prompt = (
            f"Please analyze this generic dataset named '{dataset.original_filename}'.\n"
            f"It has {num_rows} rows and the following columns: {', '.join(columns)}.\n\n"
            f"Here are the statistical summaries of the numeric columns:\n{stats}\n\n"
            "Based on these headers and statistics, provide an executive summary of what this dataset "
            "likely represents and any key anomalies or insights you can detect."
        )

        narrative = "AI summary not available (API key missing or request failed)."
        if settings.openai_api_key:
            try:
                async with httpx.AsyncClient() as client:
                    response = await client.post(
                        f"{settings.openai_base_url}/chat/completions",
                        headers={
                            "Authorization": f"Bearer {settings.openai_api_key}",
                            "Content-Type": "application/json",
                        },
                        json={
                            "model": settings.openai_model,
                            "messages": [
                                {"role": "system", "content": "You are an expert data analyst."},
                                {"role": "user", "content": prompt}
                            ],
                            "max_tokens": 800,
                        },
                        timeout=30.0,
                    )
                    if response.status_code == 200:
                        narrative = response.json()["choices"][0]["message"]["content"]
                    else:
                        logger.error(f"OpenAI error: {response.text}")
            except Exception as e:
                logger.exception("Failed to call OpenAI for generic analysis")

        return {
            "dataset_id": str(dataset_id),
            "filename": dataset.original_filename,
            "rows": num_rows,
            "columns": columns,
            "stats": stats,
            "charts": charts,
            "narrative": narrative,
        }

    async def chat(self, dataset_id: uuid.UUID, message: str, history: list[dict] = None) -> str:
        """Chat with the AI about a specific dataset."""
        if not settings.openai_api_key:
            return "AI chat is currently unavailable (API key missing)."
            
        dataset = await self.datasets.get(dataset_id)
        if not dataset or dataset.entity_type != EntityType.GENERIC or not dataset.raw_content:
            raise HTTPException(status_code=404, detail="Generic dataset not found")
            
        try:
            df = pd.read_csv(io.BytesIO(dataset.raw_content))
            columns = df.columns.tolist()
            num_rows = len(df)
            context = f"The dataset '{dataset.original_filename}' has {num_rows} rows and columns: {', '.join(columns)}. It contains generic business data."
        except Exception:
            context = "Failed to load dataset structure."
            
        messages = [
            {"role": "system", "content": f"You are a helpful data assistant. Context: {context}"},
        ]
        if history:
            messages.extend(history)
            
        messages.append({"role": "user", "content": message})
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{settings.openai_base_url}/chat/completions",
                    headers={
                        "Authorization": f"Bearer {settings.openai_api_key}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "model": settings.openai_model,
                        "messages": messages,
                        "max_tokens": 500,
                    },
                    timeout=30.0,
                )
                if response.status_code == 200:
                    return response.json()["choices"][0]["message"]["content"]
                else:
                    logger.error(f"OpenAI chat error: {response.text}")
                    return "Sorry, I encountered an error communicating with the AI service."
        except Exception as e:
            logger.exception("Failed to call OpenAI for generic chat")
            return "Sorry, an internal error occurred while processing your message."
