import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
    Brain,
    Zap,
    Target,
    Flame,
    ArrowLeft,
    Loader2,
    TrendingUp,
    ShieldAlert,
    CalendarDays,
    Settings2
} from "lucide-react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bookmark, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { fetchReviewForecast, fetchMasteryHeatmap, fetchUrgentCount } from "@/lib/questions";
import { useAuth } from "@/components/AuthProvider";
import { translations } from "@/lib/translations";
import ReviewForecast from "@/components/ReviewForecast";
import MasteryHeatmap from "@/components/MasteryHeatmap";

const ReviewCenter = () => {
    const navigate = useNavigate();
    const { language, user } = useAuth();
    const t = translations[language];

    const [isLoading, setIsLoading] = useState(true);
    const [forecast, setForecast] = useState<any[]>([]);
    const [heatmap, setHeatmap] = useState<any[]>([]);
    const [urgentCount, setUrgentCount] = useState(0);

    useEffect(() => {
        const loadData = async () => {
            try {
                const [forecastData, heatmapData, uCount] = await Promise.all([
                    fetchReviewForecast(),
                    fetchMasteryHeatmap(),
                    fetchUrgentCount()
                ]);
                setForecast(forecastData);
                setHeatmap(heatmapData);
                setUrgentCount(uCount);
            } catch (error) {
                console.error("Failed to load review center data:", error);
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, []);

    const startReview = (mode: string) => {
        navigate("/review", { state: { mode } });
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background">
                <Header />
                <main className="container flex h-[80vh] items-center justify-center">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background pb-20">
            <Header />

            <main className="container max-w-6xl px-4 py-6 md:py-12">
                {/* Back Link */}
                <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="mb-6 md:mb-8"
                >
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate("/dashboard")}
                        className="gap-2 text-muted-foreground hover:text-foreground -ml-2"
                    >
                        <ArrowLeft className="h-4 w-4" /> Back to Base
                    </Button>
                </motion.div>

                {/* Hero / Header Section */}
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-10 md:mb-16">
                    <div className="max-w-2xl">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
                                <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-primary">Mastery Intelligence</span>
                            </div>
                            <div className="flex -space-x-1">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="w-3 h-3 md:w-4 md:h-4 rounded-full border-2 border-background bg-muted" />
                                ))}
                            </div>
                        </div>
                        <h1 className="text-3xl sm:text-4xl md:text-6xl font-black tracking-tighter leading-[1.1] mb-4">
                            Your <span className="text-primary italic">Memory Engine</span> <br className="hidden sm:block" />
                            Requires Maintenance.
                        </h1>
                        <p className="text-muted-foreground text-base md:text-lg max-w-lg leading-relaxed">
                            Track your learning retention, forecast upcoming workloads, and stabilize your "Weak Spots" before the exam.
                        </p>
                    </div>



                    {/* Briefing Box */}
                    <div className="lg:w-1/3 p-6 rounded-[2rem] bg-primary/5 border border-primary/10">
                        <div className="flex items-center gap-2 mb-3">
                            <Sparkles className="h-4 w-4 text-primary" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-primary">Intelligence Brief</span>
                        </div>
                        <p className="text-xs font-medium leading-[1.6] text-foreground/80">
                            The <b>Memory Engine</b> uses the <b>SM-2 Algorithm</b>. It tracks every answer you give and determines the exact moment you are likely to forget it. 
                            <br /><br />
                            Reviewing questions just before forgetting them (the <b>Spaced Repetition</b> method) is the fastest way to lock information into long-term memory.
                        </p>
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">

                    {/* Left Column: Review Deck & Modes */}
                    <div className="lg:col-span-8 space-y-10">

                        {/* Power Hour Grid */}
                        <section>
                            <div className="flex items-center justify-between mb-6 px-2">
                                <h2 className="text-[10px] md:text-sm font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                                    <Zap className="h-4 w-4 text-amber-400" /> Specialized Missions
                                </h2>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                                <ReviewModeCard
                                    title="Urgent Recovery"
                                    desc="Focus on questions you failed today to lock them in."
                                    icon={<ShieldAlert className="h-6 w-6 text-red-500" />}
                                    count={urgentCount}
                                    color="text-red-500"
                                    onClick={() => startReview('urgent')}
                                />
                                <ReviewModeCard
                                    title="Power Hour"
                                    desc="High-speed session with a 5-second timer per question."
                                    icon={<Flame className="h-6 w-6 text-orange-500" />}
                                    count={15}
                                    color="text-orange-500"
                                    onClick={() => startReview('power')}
                                />
                                <ReviewModeCard
                                    title="Weak Spots"
                                    desc="Exclusively targets questions with your lowest ease factors."
                                    icon={<Target className="h-6 w-6 text-primary" />}
                                    count={heatmap.reduce((acc, curr) => acc + (curr.avg_mastery_level < 60 ? 1 : 0), 0)}
                                    color="text-primary"
                                    onClick={() => startReview('weak')}
                                />
                                <ReviewModeCard
                                    title="Full Recap"
                                    desc="Complete cycle of all questions due for review today."
                                    icon={<CalendarDays className="h-6 w-6 text-green-500" />}
                                    count={forecast[0]?.question_count || 0}
                                    color="text-green-500"
                                    onClick={() => startReview('review')}
                                />
                            </div>
                        </section>

                        {/* Mastery Heatmap */}
                        <MasteryHeatmap data={heatmap} />
                    </div>

                    {/* Right Column: Analytics & Forecast */}
                    <div className="lg:col-span-4 space-y-8">
                        <ReviewForecast data={forecast} />

                        {/* Mastery Tools */}
                        <section className="p-6 md:p-8 rounded-[1.5rem] md:rounded-[2rem] bg-muted/20 border border-border/50">
                            <h3 className="text-[10px] md:text-xs font-black uppercase tracking-[0.2em] text-muted-foreground mb-6 flex items-center gap-2">
                                <Settings2 className="h-4 w-4" /> Mastery Tools
                            </h3>
                            <div className="space-y-4">
                                <ToolItem
                                    title="Mastery Reset"
                                    desc="Restart learning for a specific subject."
                                    variant="secondary"
                                />
                                <ToolItem
                                    title="Review Retirement"
                                    desc="Manage your 'Retired' question list."
                                    variant="outline"
                                />
                                <div className="mt-8 pt-6 border-t border-border/10">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                            <Sparkles className="h-5 w-5 text-primary" />
                                        </div>
                                        <div>
                                            <p className="text-[9px] md:text-[10px] font-black uppercase text-muted-foreground">Expert Advice</p>
                                            <p className="text-xs font-medium italic leading-relaxed">"Your Tamil retention is at 94%. Focus on History today."</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>
                </div>
            </main>
        </div>
    );
};

const ReviewModeCard = ({ title, desc, icon, count, color, onClick }: any) => (
    <motion.button
        whileHover={{ y: -5 }}
        whileTap={{ scale: 0.98 }}
        onClick={onClick}
        className="group relative flex text-left p-6 rounded-[2rem] bg-card border border-border/50 shadow-sm hover:shadow-xl hover:border-primary/30 transition-all overflow-hidden"
    >
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-125 transition-transform duration-500">
            {icon}
        </div>
        <div className="flex flex-col h-full relative z-10">
            <div className="mb-4">
                {icon}
            </div>
            <h3 className="text-lg font-black tracking-tight mb-2 group-hover:text-primary transition-colors">{title}</h3>
            <p className="text-xs text-muted-foreground font-medium mb-6 line-clamp-2 leading-relaxed">
                {desc}
            </p>
            <div className="mt-auto flex items-center gap-3">
                <span className={cn("text-2xl font-black", color)}>{count}</span>
                <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">Queued</span>
            </div>
        </div>
    </motion.button>
);

const ToolItem = ({ title, desc, variant }: any) => (
    <div className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-card border border-border/30">
        <div>
            <h4 className="text-xs font-black tracking-tight">{title}</h4>
            <p className="text-[10px] text-muted-foreground">{desc}</p>
        </div>
        <Button size="sm" variant={variant} className="h-8 text-[10px] rounded-full font-black uppercase tracking-widest">
            Open
        </Button>
    </div>
);

export default ReviewCenter;
