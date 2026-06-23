import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type ModeCardTone = "focus" | "calm" | "speed" | "social" | "progress";

interface GameModeCardProps {
  title: string;
  description: string;
  eyebrow: string;
  href?: string;
  actionLabel?: string;
  tone?: ModeCardTone;
  onClick?: () => void;
}

interface ModeCardShellProps {
  title: string;
  description: string;
  eyebrow: string;
  actionLabel: string;
  tone: ModeCardTone;
}

const toneClasses: Record<ModeCardTone, string> = {
  focus: "border-blue-200/80 bg-gradient-to-br from-white via-blue-50 to-cyan-100 text-slate-950 before:bg-blue-600",
  calm: "border-teal-200/80 bg-gradient-to-br from-white via-teal-50 to-emerald-100 text-slate-950 before:bg-teal-500",
  speed: "border-amber-200/80 bg-gradient-to-br from-white via-amber-50 to-orange-100 text-slate-950 before:bg-amber-500",
  social: "border-fuchsia-200/80 bg-gradient-to-br from-white via-fuchsia-50 to-violet-100 text-slate-950 before:bg-fuchsia-500",
  progress: "border-emerald-200/80 bg-gradient-to-br from-white via-lime-50 to-emerald-100 text-slate-950 before:bg-emerald-500",
};

const actionClasses: Record<ModeCardTone, string> = {
  focus: "bg-blue-700 group-hover:bg-blue-800",
  calm: "bg-teal-700 group-hover:bg-teal-800",
  speed: "bg-orange-600 group-hover:bg-orange-700",
  social: "bg-fuchsia-700 group-hover:bg-fuchsia-800",
  progress: "bg-emerald-700 group-hover:bg-emerald-800",
};

function ModeCardShell({ title, description, eyebrow, actionLabel, tone }: ModeCardShellProps) {
  return (
    <Card className={cn("group relative h-full overflow-hidden border shadow-sm transition-all before:absolute before:inset-x-0 before:top-0 before:h-1.5 hover:-translate-y-0.5 hover:shadow-xl", toneClasses[tone])}>
      <CardContent className="flex h-full flex-col gap-5 p-5 sm:p-6">
        <div className="flex items-center justify-between gap-4">
          <span className="rounded-full border border-white/80 bg-white/80 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-slate-700 shadow-xs">{eyebrow}</span>
          <span aria-hidden="true" className="h-3 w-3 rounded-full bg-current opacity-40" />
        </div>
        <div className="grid gap-2">
          <h3 className="text-2xl font-black tracking-[-0.04em]">{title}</h3>
          <p className="text-sm leading-6 text-slate-700">{description}</p>
        </div>
        <span className={cn("mt-auto inline-flex h-11 w-full items-center justify-center rounded-2xl px-4 text-sm font-black text-white shadow-sm transition-colors", actionClasses[tone])}>
          {actionLabel}
        </span>
      </CardContent>
    </Card>
  );
}

export default function GameModeCard({ title, description, eyebrow, href, actionLabel = "Open", tone = "focus", onClick }: GameModeCardProps) {
  if (href) {
    return (
      <Link href={href} className="block h-full rounded-[1.35rem] focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-ring">
        <ModeCardShell title={title} description={description} eyebrow={eyebrow} actionLabel={actionLabel} tone={tone} />
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className="block h-full w-full rounded-[1.35rem] text-left focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-ring">
      <ModeCardShell title={title} description={description} eyebrow={eyebrow} actionLabel={actionLabel} tone={tone} />
    </button>
  );
}
