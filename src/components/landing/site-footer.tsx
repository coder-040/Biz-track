import Link from "next/link";
import { Brand } from "@/components/landing/brand";

const PRODUCT_LINKS = [
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Benefits", href: "#benefits" },
  { label: "FAQ", href: "#faq" },
];

const ACCOUNT_LINKS = [
  { label: "Login", href: "/login" },
  { label: "Register", href: "/register" },
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms of Service", href: "/terms" },
];

export function SiteFooter() {
  return (
    <footer className="bg-[#0C3B37] text-emerald-50">
      <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr] lg:px-8">
        <div>
          <Brand tone="light" />
          <p className="mt-4 max-w-sm text-sm leading-6 text-emerald-100/75">
            BizTrack helps small businesses keep money, inventory, and daily
            records in one simple workspace.
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-200/60">
            Product
          </p>
          <ul className="mt-4 space-y-2">
            {PRODUCT_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-sm text-emerald-50/90 transition-colors hover:text-white"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-200/60">
            Account
          </p>
          <ul className="mt-4 space-y-2">
            {ACCOUNT_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-sm text-emerald-50/90 transition-colors hover:text-white"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <p className="mx-auto w-full max-w-7xl px-4 py-5 text-xs text-emerald-100/60 sm:px-6 lg:px-8">
          © {new Date().getFullYear()} BizTrack. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
