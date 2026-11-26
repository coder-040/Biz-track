import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

export function AuthPage({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F8F6F2] px-4 py-10">
      <section className="w-full max-w-md">
        <Link href="/" className="mb-6 flex items-center justify-center gap-2.5">
          <Image
            src="/icon.svg"
            width={42}
            height={42}
            alt=""
            aria-hidden="true"
          />
          <span className="text-xl font-extrabold tracking-tight text-[#0C3B37]">
            BizTrack
          </span>
        </Link>
        <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
          <h1 className="text-2xl font-bold tracking-tight text-stone-950">
            {title}
          </h1>
          <p className="mt-1.5 text-sm leading-6 text-stone-600">
            {description}
          </p>
          <div className="mt-6">{children}</div>
        </div>
      </section>
    </main>
  );
}
