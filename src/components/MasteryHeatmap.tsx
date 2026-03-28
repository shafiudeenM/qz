import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { getTopicDisplayName } from "@/lib/questions";

interface HeatmapData {
    topic_id: string;
    avg_mastery_level: number;
    avg_ease_factor: number;
    due_count: number;
    total_count: number;
}

interface MasteryHeatmapProps {
    data: HeatmapData[];
    className?: string;
}

const MasteryHeatmap = ({ data, className }: MasteryHeatmapProps) => {
    // Sort by mastery level (lowest first to highlight trouble areas)
    const sortedData = [...data].sort((a, b) => a.avg_mastery_level - b.avg_mastery_level);

    const getHeatColor = (level: number) => {
        if (level >= 90) return "bg-green-500";
        if (level >= 75) return "bg-green-400";
        if (level >= 60) return "bg-yellow-400";
        if (level >= 40) return "bg-orange-400";
        return "bg-red-500";
    };

    return (
        <div className={cn("p-5 md:p-8 bg-card border border-border/50 rounded-[1.5rem] md:rounded-[2rem] shadow-sm", className)}>
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h3 className="text-base md:text-lg font-black tracking-tight">Memory Heatmap</h3>
                    <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest leading-none mt-1">Topic Retention Status</p>
                </div>
                <div className="flex gap-1">
                    {[0, 1, 2, 3, 4].map(i => (
                        <div key={i} className={cn("w-1.5 h-1.5 md:w-2 md:h-2 rounded-sm",
                            i === 0 ? "bg-red-500" :
                                i === 1 ? "bg-orange-400" :
                                    i === 2 ? "bg-yellow-400" :
                                        i === 3 ? "bg-green-400" : "bg-green-500"
                        )} />
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {sortedData.map((topic, index) => (
                    <motion.div
                        key={topic.topic_id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.03 }}
                        className="relative group p-4 rounded-2xl bg-muted/30 border border-border/50 overflow-hidden"
                    >
                        <div className={cn(
                            "absolute top-0 right-0 w-16 h-16 -mr-8 -mt-8 rounded-full blur-2xl opacity-20",
                            getHeatColor(topic.avg_mastery_level)
                        )} />

                        <div className="relative z-10">
                            <h4 className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1 truncate">
                                {getTopicDisplayName(topic.topic_id)}
                            </h4>
                            <div className="flex items-end justify-between">
                                <span className="text-xl font-black leading-none">
                                    {Math.round(topic.avg_mastery_level)}%
                                </span>
                                {topic.due_count > 0 && (
                                    <span className="flex h-4 items-center rounded-full bg-red-500/10 px-1.5 text-[8px] font-black text-red-500 uppercase">
                                        {topic.due_count} Due
                                    </span>
                                )}
                            </div>
                            <div className="mt-3 h-1.5 w-full bg-muted rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${topic.avg_mastery_level}%` }}
                                    className={cn("h-full", getHeatColor(topic.avg_mastery_level))}
                                />
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

export default MasteryHeatmap;
