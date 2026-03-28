import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: "up" | "down" | "stable";
  className?: string;
}

const StatsCard = ({ label, value, subtitle, icon, trend, className }: StatsCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "bg-card rounded-2xl p-5 transition-all border border-border/50 hover:border-primary/40 hover:bg-slate-900/50 hover:translate-x-1",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">{label}</p>
          <p className="mt-2 text-3xl font-black tracking-tight text-foreground">{value}</p>
          {subtitle && (
            <p className="mt-1.5 text-[10px] font-medium text-muted-foreground bg-secondary/30 w-fit px-2 py-0.5 rounded-md border border-border/50">{subtitle}</p>
          )}
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20 shadow-[0_0_15px_rgba(var(--primary),0.1)] group-hover:scale-110 transition-transform">
          {icon}
        </div>
      </div>
      {trend && (
        <div className="mt-4 flex items-center gap-1.5">
          <div className={cn(
            "flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
            trend === "up" && "bg-success/10 text-success border border-success/20",
            trend === "down" && "bg-destructive/10 text-destructive border border-destructive/20",
            trend === "stable" && "bg-muted/10 text-muted-foreground border border-border"
          )}>
            {trend === "up" ? "↑ Progress" : trend === "down" ? "↓ Attention" : "→ Stable"}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default StatsCard;
