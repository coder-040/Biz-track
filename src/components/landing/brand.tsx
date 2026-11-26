import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface BrandProps {
  href?: string;
  className?: string;
  wordmarkClassName?: string;
  tone?: "default" | "light";
}

export function Brand({
  href = "/",
  className,
  wordmarkClassName,
  tone = "default",
}: BrandProps) {
  return (
    <Link
      href={href}
      aria-label="BizTrack home"
      className={cn("inline-flex items-center gap-2.5", className)}
    >
      <Image
        src="/icon.svg"
        width={36}
        height={36}
        alt=""
        aria-hidden="true"
        className="h-9 w-9 rounded-[10px]"
      />
      <span
        className={cn(
          "text-lg font-extrabold tracking-tight",
          tone === "light" ? "text-white" : "text-[#0C3B37]",
          wordmarkClassName,
        )}
      >
        BizTrack
      </span>
    </Link>
  );
}
