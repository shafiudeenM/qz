import { motion } from "framer-motion";
import { useMemo } from "react";
import { cn } from "@/lib/utils";

interface ForecastData {
    review_date: string;
    question_count: number;
}

interface ReviewForecastProps {
    data: ForecastData[];
    className?: string;
}

const ReviewForecast = ({ data, className }: ReviewForecastProps) => {
    const maxCount = useMemo(() => Math.max(...data.map(d => d.question_count), 5), [data]);

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const today = new Date();
        if (date.toDateString() === today.toDateString()) return "Today";
        return date.toLocaleDateString('en-US', { weekday: 'short' });
    };

    return (
        <div className={cn("p-5 md:p-8 bg-card border border-border/50 rounded-[1.5rem] md:rounded-[2rem] shadow-sm", className)}>
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h3 className="text-base md:text-lg font-black tracking-tight">Review Forecast</h3>
                    <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest leading-none mt-1">Next 7 Days</p>
                </div>
                <div className="text-right">
                    <span className="text-xl md:text-2xl font-black text-primary leading-none">
                        {data.reduce((acc, curr) => acc + curr.question_count, 0)}
                    </span>
                    <p className="text-[9px] md:text-[10px] text-muted-foreground font-black uppercase">Pending</p>
                </div>
            </div>

            <div className="flex items-end justify-between h-32 md:h-40 gap-1.5 md:gap-2 mb-4 overflow-x-auto pb-2 scrollbar-none">
                {data.map((item, index) => {
                    const height = (item.question_count / maxCount) * 100;
                    return (
                        <div key={item.review_date} className="flex-1 min-w-[32px] md:min-w-0 flex flex-col items-center gap-2 group">
                            <div className="relative w-full flex flex-col items-center group">
                                <motion.div
                                    initial={{ height: 0 }}
                                    animate={{ height: `${height}%` }}
                                    transition={{ delay: index * 0.05, duration: 0.5, ease: "easeOut" }}
                                    className={cn(
                                        "w-full max-w-[28px] md:max-w-[32px] rounded-t-lg transition-colors",
                                        index === 0 ? "bg-primary" : "bg-primary/20 group-hover:bg-primary/40",
                                        item.question_count === 0 && "bg-muted/20"
                                    )}
                                />
                                {item.question_count > 0 && (
                                    <span className="absolute -top-6 text-[10px] font-black opacity-0 group-hover:opacity-100 transition-opacity">
                                        {item.question_count}
                                    </span>
                                )}
                            </div>
                            <span className={cn(
                                "text-[9px] md:text-[10px] font-black uppercase tracking-tighter",
                                index === 0 ? "text-primary" : "text-muted-foreground"
                            )}>
                                {formatDate(item.review_date)}
                            </span>
                        </div>
                    );
                })}
            </div>

            <div className="pt-4 border-t border-border/10">
                <p className="text-[9px] md:text-[10px] text-muted-foreground text-center font-medium leading-relaxed italic opacity-70">
                    "Daily review prevents memory decay and workload spikes."
                </p>
            </div>
        </div>
    );
};

export default ReviewForecast;
