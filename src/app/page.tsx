
import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import {
  Boxes,
  CircleCheck,
  ClipboardList,
  FolderOpen,
  LayoutDashboard,
  Receipt,
  Store,
  Activity,
  Wallet,
} from "lucide-react";
import { CtaLink } from "@/components/landing/cta";
import { FaqList } from "@/components/landing/faq";
import {
  BenefitsPreview,
  HeroPreview,
  ShowcasePreview,
} from "@/components/landing/product-preview";
import { Reveal } from "@/components/landing/reveal";
import { SiteFooter } from "@/components/landing/site-footer";
import { SiteHeader } from "@/components/landing/site-header";
import { DEMO_LABEL } from "@/components/landing/sample-data";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: {
    absolute: "BizTrack — Know your business. Track every move.",
  },
  description:
    "Keep money and inventory organized in one simple place. BizTrack gives small businesses a clear view of cash movement, stock, and daily records.",
};

const TRUST = [
  {
    icon: CircleCheck,
    title: "Simple to Use",
    text: "A workspace you can learn without a manual.",
  },
  {
    icon: Activity,
    title: "Real-Time Business Overview",
    text: "Money and stock, visible together.",
  },
  {
    icon: FolderOpen,
    title: "Organized Records",
    text: "Transactions and products in one ledger.",
  },
  {
    icon: Store,
    title: "Built for Small Businesses",
    text: "Made for shops, not enterprise software.",
  },
];

const FEATURES = [
  {
    icon: Wallet,
    title: "Money In & Out",
    points: [
      "Record every incoming and outgoing transaction.",
      "Understand where your money goes.",
      "Keep financial records organized.",
    ],
  },
  {
    icon: Boxes,
    title: "Smart Inventory Tracking",
    points: [
      "Manage your products and stock quantities.",
      "Monitor inventory value.",
      "Know what is available in your business.",
    ],
  },
  {
    icon: LayoutDashboard,
    title: "Business Overview",
    points: [
      "See important business information in one dashboard.",
      "Understand your financial position.",
      "Monitor inventory and transactions.",
    ],
  },
  {
    icon: Receipt,
    title: "Transaction History",
    points: [
      "Review previous financial activities.",
      "Keep a clear record of business movements.",
      "Find important transactions easily.",
    ],
  },
];

const STEPS = [
  {
    step: "01",
    title: "Create Your Business",
    text: "Set up your business profile.",
  },
  {
    step: "02",
    title: "Add Your Products",
    text: "Organize your inventory and starting stock.",
  },
  {
    step: "03",
    title: "Track Your Business",
    text: "Record money movements and monitor your business overview.",
  },
];

const BENEFITS = [
  "Stop relying on scattered notebooks and spreadsheets.",
  "Keep your business records organized.",
  "Understand your cash movements.",
  "Stay informed about your inventory.",
  "Make decisions with better visibility.",
];

// Authentication and request-time logic belong inside Suspense.
async function LandingContent() {
  await connection();

  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Redirect authenticated users to their dashboard.
  if (user) {
    redirect("/dashboard");
  }

  // Show the landing page to logged-out visitors.
  return (
    <div className="bg-[#F8FAFC] text-slate-950">
      <SiteHeader />

      <main>
        <section className="relative overflow-hidden">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-[radial-gradient(ellipse_at_top_right,rgba(12,59,55,0.08),transparent_58%)]"
          />

          <div className="relative mx-auto grid w-full max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[0.92fr_1.08fr] lg:gap-14 lg:px-8 lg:py-24">
            <div className="landing-fade-up max-w-xl">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-800">
                Know your business. Track every move.
              </p>

              <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-slate-950 sm:text-5xl sm:leading-[1.05]">
                Run your business. Not your spreadsheets.
              </h1>

              <p className="mt-5 text-base leading-7 text-slate-600 sm:text-lg">
                Keep your money and inventory organized in one simple place.
                BizTrack gives you the clarity you need to understand your
                business and make smarter decisions.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <CtaLink href="/register">Get Started Free</CtaLink>
                <CtaLink href="#features" variant="secondary">
                  Explore Features
                </CtaLink>
              </div>

              <p className="mt-5 text-sm text-slate-500">
                Simple business management. No complicated setup.
              </p>
            </div>

            <HeroPreview />
          </div>
        </section>

        <section
          aria-label="Product benefits"
          className="border-y border-slate-200 bg-white"
        >
          <ul className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-8 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
            {TRUST.map((item) => {
              const Icon = item.icon;

              return (
                <li key={item.title} className="flex gap-3">
                  <Icon
                    className="mt-0.5 size-4 shrink-0 text-emerald-700"
                    aria-hidden="true"
                  />

                  <div>
                    <p className="text-sm font-semibold text-slate-950">
                      {item.title}
                    </p>

                    <p className="mt-1 text-sm leading-6 text-slate-500">
                      {item.text}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        <section
          id="features"
          className="scroll-mt-20 mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28"
        >
          <Reveal>
            <div className="max-w-2xl">
              <h2 className="text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
                Everything your business needs to stay organized.
              </h2>

              <p className="mt-4 text-base leading-7 text-slate-600">
                Manage the essential parts of your business without unnecessary
                complexity.
              </p>
            </div>
          </Reveal>

          <div className="mt-12 grid gap-4 md:grid-cols-2">
            {FEATURES.map((feature, index) => {
              const Icon = feature.icon;

              return (
                <Reveal key={feature.title} delay={index * 70}>
                  <article className="h-full rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-[0_18px_40px_-28px_rgba(4,120,87,0.55)] motion-reduce:transition-none motion-reduce:hover:translate-y-0">
                    <span className="flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800">
                      <Icon className="size-5" aria-hidden="true" />
                    </span>

                    <h3 className="mt-5 text-lg font-semibold tracking-tight text-slate-950">
                      {feature.title}
                    </h3>

                    <ul className="mt-3 space-y-2">
                      {feature.points.map((point) => (
                        <li
                          key={point}
                          className="text-sm leading-6 text-slate-600"
                        >
                          {point}
                        </li>
                      ))}
                    </ul>
                  </article>
                </Reveal>
              );
            })}
          </div>
        </section>

        <section className="bg-white py-20 lg:py-28">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
            <Reveal>
              <div className="max-w-2xl">
                <h2 className="text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
                  A clearer picture of your business.
                </h2>

                <p className="mt-4 text-sm text-slate-500">
                  {DEMO_LABEL}. Amounts are in NPR.
                </p>
              </div>
            </Reveal>

            <div className="mt-10">
              <ShowcasePreview />
            </div>
          </div>
        </section>

        <section
          id="how-it-works"
          className="scroll-mt-20 mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28"
        >
          <Reveal>
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
              Get started in minutes.
            </h2>
          </Reveal>

          <ol className="mt-12 grid gap-8 md:grid-cols-3 md:gap-6">
            {STEPS.map((item, index) => (
              <li key={item.step} className="relative">
                {index < STEPS.length - 1 && (
                  <span
                    aria-hidden="true"
                    className="absolute left-8 top-5 hidden h-px w-[calc(100%-1rem)] bg-slate-200 md:block"
                  />
                )}

                <Reveal delay={index * 80}>
                  <div className="relative flex gap-4 md:block">
                    <span className="relative z-10 flex size-10 shrink-0 items-center justify-center rounded-full bg-[#0C3B37] text-xs font-semibold text-white">
                      {item.step}
                    </span>

                    <div className="md:mt-5">
                      <h3 className="text-lg font-semibold text-slate-950">
                        {item.title}
                      </h3>

                      <p className="mt-2 max-w-xs text-sm leading-6 text-slate-600">
                        {item.text}
                      </p>
                    </div>
                  </div>
                </Reveal>
              </li>
            ))}
          </ol>
        </section>

        <section
          id="benefits"
          className="scroll-mt-20 bg-white py-20 lg:py-28"
        >
          <div className="mx-auto grid w-full max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
            <Reveal>
              <h2 className="text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
                Less confusion. More control.
              </h2>

              <ul className="mt-8 space-y-4">
                {BENEFITS.map((benefit) => (
                  <li
                    key={benefit}
                    className="flex gap-3 text-base leading-7 text-slate-700"
                  >
                    <CircleCheck
                      className="mt-1 size-4 shrink-0 text-emerald-700"
                      aria-hidden="true"
                    />

                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            </Reveal>

            <Reveal delay={80}>
              <BenefitsPreview />
            </Reveal>
          </div>
        </section>

        <section
          id="faq"
          className="scroll-mt-20 mx-auto w-full max-w-3xl px-4 py-20 sm:px-6 lg:py-28"
        >
          <Reveal>
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
              Questions, answered plainly.
            </h2>

            <p className="mt-4 text-base leading-7 text-slate-600">
              A short guide to what BizTrack does today.
            </p>
          </Reveal>

          <div className="mt-8">
            <FaqList />
          </div>
        </section>

        <section className="px-4 pb-20 sm:px-6 lg:px-8 lg:pb-28">
          <div className="mx-auto flex w-full max-w-7xl flex-col items-start justify-between gap-8 rounded-3xl bg-[#0C3B37] px-6 py-12 text-white sm:px-10 lg:flex-row lg:items-center">
            <div className="max-w-xl">
              <ClipboardList
                className="size-5 text-[#F4C44E]"
                aria-hidden="true"
              />

              <h2 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">
                Your business deserves better tracking.
              </h2>

              <p className="mt-4 text-base leading-7 text-emerald-50/80">
                Start organizing your money and inventory with BizTrack. Keep
                everything clear, simple, and under control.
              </p>
            </div>

            <CtaLink
              href="/register"
              className="bg-white text-[#0C3B37] shadow-none hover:bg-emerald-50 hover:text-[#0C3B37]"
            >
              Get Started Free
            </CtaLink>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

// Keep the page component synchronous and render dynamic content under Suspense.
export default function LandingPage() {
  return (
    <Suspense
      fallback={<div className="min-h-screen bg-[#F8FAFC]" />}
    >
      <LandingContent />
    </Suspense>
  );
}
