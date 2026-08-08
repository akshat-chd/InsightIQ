"use client";

import { useState } from "react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useAuth } from "@/lib/auth-context";
import { ApiError } from "@/lib/api-client";

const schema = z.object({
  organizationName: z.string().min(2, "Workspace name must be at least 2 characters."),
  fullName: z.string().min(1, "Your name is required."),
  email: z.string().email("Enter a valid email address."),
  password: z
    .string()
    .min(10, "Password must be at least 10 characters.")
    .regex(/[A-Za-z]/, "Password must contain a letter.")
    .regex(/\d/, "Password must contain a digit."),
});
type FormValues = z.infer<typeof schema>;

export default function SignupPage() {
  const { signup } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    setError(null);
    setIsSubmitting(true);
    try {
      await signup(values.email, values.password, values.fullName, values.organizationName);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-yellow-100 p-4 py-8">
      <div className="cartoon-card-yellow w-full max-w-md p-8 shadow-[8px_8px_0px_0px_#0f172a]">
        <div className="text-center mb-6">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-400 border-2 border-slate-900 shadow-[3px_3px_0px_0px_#0f172a] text-3xl">
            ✨
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900">BizToon Analytics</h1>
          <p className="text-sm font-semibold text-slate-700 mt-1">
            Create your workspace to upload custom datasets
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-xs font-extrabold text-slate-900 uppercase tracking-wide mb-1">Organization Name</label>
            <input
              type="text"
              placeholder="Acme Retail Ltd"
              {...register("organizationName")}
              className="w-full rounded-xl border-2 border-slate-900 bg-white p-3 text-sm font-bold shadow-[2px_2px_0px_0px_#0f172a] focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
            {errors.organizationName && <p className="mt-1 text-xs font-bold text-rose-600">{errors.organizationName.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-extrabold text-slate-900 uppercase tracking-wide mb-1">Your Full Name</label>
            <input
              type="text"
              placeholder="Jane Doe"
              {...register("fullName")}
              className="w-full rounded-xl border-2 border-slate-900 bg-white p-3 text-sm font-bold shadow-[2px_2px_0px_0px_#0f172a] focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
            {errors.fullName && <p className="mt-1 text-xs font-bold text-rose-600">{errors.fullName.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-extrabold text-slate-900 uppercase tracking-wide mb-1">Email</label>
            <input
              type="email"
              placeholder="you@company.com"
              {...register("email")}
              className="w-full rounded-xl border-2 border-slate-900 bg-white p-3 text-sm font-bold shadow-[2px_2px_0px_0px_#0f172a] focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
            {errors.email && <p className="mt-1 text-xs font-bold text-rose-600">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-extrabold text-slate-900 uppercase tracking-wide mb-1">Password</label>
            <input
              type="password"
              placeholder="At least 10 characters (letters & numbers)"
              {...register("password")}
              className="w-full rounded-xl border-2 border-slate-900 bg-white p-3 text-sm font-bold shadow-[2px_2px_0px_0px_#0f172a] focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
            {errors.password && <p className="mt-1 text-xs font-bold text-rose-600">{errors.password.message}</p>}
          </div>

          {error && (
            <div className="rounded-xl border-2 border-slate-900 bg-rose-200 p-3 text-xs font-bold text-slate-900 shadow-[2px_2px_0px_0px_#0f172a]">
              ⚠️ {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="cartoon-btn-purple w-full py-3 text-base font-extrabold mt-2 shadow-[4px_4px_0px_0px_#0f172a]"
          >
            {isSubmitting ? "Creating workspace..." : "✨ Create Free Workspace"}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t-2 border-slate-900 flex flex-col gap-2 text-center text-xs font-extrabold">
          <p className="text-slate-700">
            Already have a workspace?{" "}
            <Link href="/login" className="text-purple-700 underline hover:text-purple-900">
              Sign in
            </Link>
          </p>
          <p className="text-slate-600">
            Or return to{" "}
            <Link href="/" className="text-amber-800 underline hover:text-amber-950">
              🎮 Live Demo Mode
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
