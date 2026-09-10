import { cn } from "cn";

export function BrandLogo({
  className,
  decorative = false,
}: {
  className?: string;
  decorative?: boolean;
}) {
  return (
    <img
      src="/brand/digipm-logo.png"
      alt={decorative ? "" : "DigiPM"}
      width={32}
      height={32}
      className={cn("brand-mark", className)}
      draggable={false}
    />
  );
}
