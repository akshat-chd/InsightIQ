"use client";

import { useState } from "react";
import Link from "next/link";

interface UploadAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UploadAuthModal({ isOpen, onClose }: UploadAuthModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="cartoon-card-yellow w-full max-w-md p-6 text-center shadow-[8px_8px_0px_0px_#0f172a] animate-in fade-in zoom-in duration-200">
        <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-300 border-2 border-slate-900 shadow-[3px_3px_0px_0px_#0f172a] text-3xl">
          🔒
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900 mb-2">Account Required to Upload Datasets</h2>
        <p className="text-slate-700 text-sm mb-6 leading-relaxed">
          You are currently exploring in <span className="font-bold text-amber-900">Demo Mode</span>! To upload your custom CSV sales files and build tailored analytics, please sign in or create an account.
        </p>

        <div className="flex flex-col gap-3">
          <Link
            href="/login"
            onClick={onClose}
            className="cartoon-btn-purple w-full py-3 text-base"
          >
            🔑 Log In to Upload
          </Link>
          <Link
            href="/signup"
            onClick={onClose}
            className="cartoon-btn w-full py-3 text-base"
          >
            ✨ Create Free Account
          </Link>
          <button
            onClick={onClose}
            className="mt-2 text-xs font-bold text-slate-600 hover:text-slate-900 underline"
          >
            Continue Browsing Demo Mode
          </button>
        </div>
      </div>
    </div>
  );
}
