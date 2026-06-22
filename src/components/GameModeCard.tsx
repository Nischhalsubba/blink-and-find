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
  focus: "border-blue-200/80 bg-white text-slate-950 before:bg-blue-600",
  calm: "border-teal-200/80 bg-white text-slate-950 before:bg-teal-500",
  speed: "border-amber-200/80 bg-white text-slate-950 before:bg-amber-500",
  social: "border-indigo-200/80 bg-white text-slate-950 before:bg-indigo-500",
  progress: "border-emerald-200/80 bg-white text-slate-950 before:bg-emerald-500",
};

function ModeCardShell({ title, description, eyebrow, actionLabel, tone }: ModeCardShellProps) {
  return (
    <Card className={cn("group relative h-full overflow-hidden border shadow-sm transition-all before:absolute before:inset-x-0 before:top-0 before:h-1 hover:-translate-y-0.5 hover:shadow-lg", toneClasses[tone])}>
      <CardContent className="flex h-full flex-col gap-5 p-5 sm:p-6">
        <div className="flex items-center justify-between gap-4">
          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-slate-600">{eyebrow}</span>
          <span aria-hidden="true" className="h-2 w-2 rounded-full bg-current opacity-30" />
        </div>
        <div className="grid gap-2">
          <h3 className="text-2xl font-black tracking-[-0.04em]">{title}</h3>
          <p className="text-sm leading-6 text-slate-600">{description}</p>
        </div>
        <span className="mt-auto inline-flex h-11 w-full items-center justify-center rounded-2xl border border-slate-200 bg-slate-950 px-4 text-sm font-bold text-white transition-colors group-hover:bg-blue-700">
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
