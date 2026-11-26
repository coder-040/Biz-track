import type { Metadata } from "next";
import Link from "next/link";
import { Brand } from "@/components/landing/brand";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The current terms for using the BizTrack workspace.",
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#F8FAFC] text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 w-full max-w-3xl items-center px-4 sm:px-6">
          <Brand />
        </div>
      </header>
      <article className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6">
        <h1 className="text-3xl font-extrabold tracking-tight">Terms of Service</h1>
        <p className="mt-4 text-sm leading-7 text-slate-600">
          BizTrack is a workspace for recording your business money and
          inventory. You are responsible for the accuracy of the records you
          enter and for keeping your account access private.
        </p>
        <p className="mt-4 text-sm leading-7 text-slate-600">
          Features such as managing more than one business are available only
          when the current product plan and implementation include them.
          Sample figures shown on the public site are fictional demonstration
          data.
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