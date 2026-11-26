import type { Metadata } from "next";
import Link from "next/link";
import { Brand } from "@/components/landing/brand";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How BizTrack handles the business information you enter.",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#F8FAFC] text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 w-full max-w-3xl items-center px-4 sm:px-6">
          <Brand />
        </div>
      </header>
      <article className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6">
        <h1 className="text-3xl font-extrabold tracking-tight">Privacy Policy</h1>
        <p className="mt-4 text-sm leading-7 text-slate-600">
          BizTrack stores the business records you add so you can track money
          and inventory. You sign in to open a workspace, and records are kept
          with that business. Changes to financial and inventory records are
          written to an audit history.
        </p>
        <p className="mt-4 text-sm leading-7 text-slate-600">
          This page describes the current product behavior. It is not a
          complete legal notice, and BizTrack does not claim a third-party
          security certification.
        </p>
        <p className="mt-8 text-sm">
          <Link href="/" className="font-semibold text-emerald-800 hover:text-emerald-700">
            Back to BizTrack
          </Link>
        </p>
      </article>
    </main>
  );
}
