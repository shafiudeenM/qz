import { cn } from "@/lib/utils";

interface TopicBadgeProps {
  topic: string;
  accuracy: number;
  priority: "high" | "medium" | "low";
  trend: "improving" | "declining" | "stable";
  className?: string;
}

const TopicBadge = ({ topic, accuracy, priority, trend, className }: TopicBadgeProps) => {
  const statusConfig = {
    improving: {
      color: "text-emerald-400",
      bar: "bg-emerald-400",
      border: "border-l-emerald-400",
      bg: "bg-emerald-400/5",
      pill: "bg-emerald-400/10 text-emerald-400 border-emerald-400/20",
      label: "Mastered",
      icon: "↑",
    },
    stable: {
      color: "text-amber-400",
      bar: "bg-amber-400",
      border: "border-l-amber-400",
      bg: "bg-amber-400/5",
      pill: "bg-amber-400/10 text-amber-400 border-amber-400/20",
      label: "Growing",
      icon: "→",
    },
    declining: {
      color: "text-rose-400",
      bar: "bg-rose-400",
      border: "border-l-rose-400",
      bg: "bg-rose-400/5",
      pill: "bg-rose-400/10 text-rose-400 border-rose-400/20",
      label: "Critical",
      icon: "↓",
    },
  };

  const config = statusConfig[trend];

  return (
    <div
      className={cn(
        "bg-card group rounded-2xl border-l-4 border-border/50 transition-all duration-300 hover:translate-x-1 hover-glow overflow-hidden shadow-sm",
        config.border,
        config.bg,
        className
      )}
    >
      <div className="px-5 py-4">
        {/* Top Row: Topic Name + Accuracy */}
        <div className="flex items-start justify-between gap-4 mb-3">
          <p className="font-bold text-foreground leading-snug text-sm flex-1 min-w-0 line-clamp-2 group-hover:text-primary transition-colors">
            {topic}
          </p>
          <span className={cn("text-2xl font-black tabular-nums shrink-0 leading-none", config.color)}>
            {accuracy}%
          </span>
        </div>

        {/* Progress Bar */}
        <div className="h-1.5 w-full rounded-full bg-border/50 overflow-hidden mb-3">
          <div
            className={cn("h-full rounded-full transition-all duration-700", config.bar)}
            style={{ width: `${accuracy}%` }}
          />
        </div>

        {/* Bottom Row: Status Pill */}
        <div className="flex items-center justify-between">
          <span className={cn(
            "inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md border",
            config.pill
          )}>
            <span>{config.icon}</span>
            {config.label}
          </span>
          <span className="text-[10px] font-medium text-muted-foreground/50 uppercase tracking-widest">
            {priority === "high" ? "High Priority" : priority === "medium" ? "Med Priority" : "On Track"}
          </span>
        </div>
      </div>
    </div>
  );
};

export default TopicBadge;
