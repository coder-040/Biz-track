import { cn } from "@/lib/utils";
import { getInitials } from "@/lib/format";

const TONES = [
  "bg-brand-sage text-brand-sage-strong",
  "bg-brand-orange-soft text-brand-orange-strong",
  "bg-brand-pink text-brand-pink-strong",
  "bg-muted text-foreground",
] as const;

const SIZES = {
  sm: "size-8 text-[10px]",
  md: "size-10 text-xs",
  lg: "size-12 text-sm",
} as const;

function toneFor(name: string): string {
  let total = 0;

  for (const character of name) {
    total += character.charCodeAt(0);
  }

  return TONES[total % TONES.length];
}

interface PartyAvatarProps {
  name: string;
  size?: keyof typeof SIZES;
  className?: string;
}

export function PartyAvatar({
  name,
  size = "md",
  className,
}: PartyAvatarProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "grid shrink-0 place-items-center rounded-full font-bold tracking-wide ring-1 ring-inset ring-black/[0.03]",
        SIZES[size],
        toneFor(name),
        className,
      )}
    >
      {getInitials(name)}
    </span>
  );
}
