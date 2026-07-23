import { cn } from "@/lib/utils";

export function Logo({
  className,
  withText = true,
  glow = false,
}: {
  className?: string;
  withText?: boolean;
  glow?: boolean;
}) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div
        className={cn(
          "grid h-9 w-9 place-items-center rounded-xl bg-volt-gradient text-ink-950",
          glow && "shadow-glow"
        )}
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
          <path d="M13.5 2 4 13.5h6L9 22l10.5-12.5h-6L13.5 2Z" />
        </svg>
      </div>
      {withText && (
        <div className="leading-none">
          <div className="text-[15px] font-bold tracking-tight">
            JM <span className="text-volt-500">Electric</span>
          </div>
          <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-slate-400">
            Gestión eléctrica
          </div>
        </div>
      )}
    </div>
  );
}
