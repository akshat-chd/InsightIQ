"use client";

import { useState } from "react";
import Link from "next/link";

interface StepperGuideProps {
  onOpenUploadModal?: () => void;
}

export function StepperGuide({ onOpenUploadModal }: StepperGuideProps) {
  const [activeStep, setActiveStep] = useState(1);

  const steps = [
    {
      num: 1,
      title: "Explore Live Demo",
      icon: "🎨",
      badge: "Active Now",
      color: "cartoon-card-yellow",
      desc: "Interact with real-time sales metrics, RFM customer clusters, and AI narrative below without logging in.",
      actionText: "Viewing Live Demo",
      action: null,
    },
    {
      num: 2,
      title: "Upload Your Dataset",
      icon: "🚀",
      badge: "Login Needed",
      color: "cartoon-card-blue",
      desc: "Upload custom retail Orders, Customers, Products & Returns CSV files to run tailored analytics.",
      actionText: "Upload Custom CSV",
      action: onOpenUploadModal,
    },
    {
      num: 3,
      title: "AI & Anomaly Insights",
      icon: "🤖",
      badge: "Powered by OpenAI",
      color: "cartoon-card-purple",
      desc: "Isolation Forest + z-score algorithms detect outliers while OpenAI GPT writes executive summaries over exact numbers.",
      actionText: "Learn AI Privacy",
      action: null,
    },
    {
      num: 4,
      title: "Export Presentation Decks",
      icon: "📊",
      badge: "PDF & PPTX",
      color: "cartoon-card-green",
      desc: "Export styled executive slide decks (PPTX) or formatted PDF briefs with 1-click server-side rendering.",
      actionText: "Download Sample Brief",
      action: null,
    },
  ];

  return (
    <div className="cartoon-card bg-white p-5 mb-6 border-slate-900 shadow-[5px_5px_0px_0px_#0f172a]">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 pb-3 border-b-2 border-slate-900">
        <div>
          <div className="flex items-center gap-2">
            <span className="cartoon-badge bg-amber-300">✨ Easy 4-Step Workflow</span>
            <span className="cartoon-badge bg-purple-300">BizToon Quick Start</span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 mt-1">How BizToon Analytics Works</h2>
        </div>
        <p className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-900">
          Click any step to view details 💡
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {steps.map((step) => {
          const isActive = activeStep === step.num;
          return (
            <div
              key={step.num}
              onClick={() => setActiveStep(step.num)}
              className={`cursor-pointer p-4 rounded-2xl border-2 border-slate-900 transition-all duration-200 ${
                step.color
              } ${isActive ? "shadow-[5px_5px_0px_0px_#0f172a] -translate-y-1 ring-2 ring-slate-900" : "shadow-[2px_2px_0px_0px_#0f172a] opacity-90 hover:opacity-100"}`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-900 text-white font-extrabold text-sm shadow-[2px_2px_0px_0px_#ffffff]">
                  {step.num}
                </span>
                <span className="text-2xl">{step.icon}</span>
              </div>
              <h3 className="font-extrabold text-slate-900 text-sm mb-1">{step.title}</h3>
              <p className="text-slate-700 text-xs leading-relaxed mb-3">{step.desc}</p>
              {step.action ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    step.action?.();
                  }}
                  className="cartoon-btn-purple w-full text-xs py-1.5 px-2"
                >
                  {step.actionText} ➔
                </button>
              ) : (
                <span className="inline-block text-[11px] font-bold text-slate-800 bg-white/70 px-2 py-1 rounded-lg border border-slate-900">
                  {step.badge}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
