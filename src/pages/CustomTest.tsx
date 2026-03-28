import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Settings, Play, ArrowLeft, Loader2, Sparkles, AlertTriangle, CheckCircle2 } from "lucide-react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { fetchFilterMetadata, fetchCustomQuestions, fetchCustomQuestionCount } from "@/lib/questions";
import { useAuth } from "@/components/AuthProvider";
import { translations } from "@/lib/translations";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const CustomTest = () => {
    const navigate = useNavigate();
    const { language } = useAuth();
    const [isLoading, setIsLoading] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isCheckingCount, setIsCheckingCount] = useState(false);
    const [matchingCount, setMatchingCount] = useState<number | null>(null);
    const [metadata, setMetadata] = useState<{ topics: string[]; years: number[] }>({ topics: [], years: [] });
    const t = translations[language];

    const [filters, setFilters] = useState({
        topics: [] as string[],
        years: [] as number[],
        difficulties: [] as number[],
        limit: 10
    });

    useEffect(() => {
        const loadMetadata = async () => {
            try {
                const data = await fetchFilterMetadata();
                setMetadata(data);
            } catch (error) {
                console.error("Failed to load metadata:", error);
                toast.error("Failed to load topics and years");
            } finally {
                setIsLoading(false);
            }
        };
        loadMetadata();
    }, []);

    // Proactive count check
    useEffect(() => {
        const checkCount = async () => {
            setIsCheckingCount(true);
            try {
                const count = await fetchCustomQuestionCount({
                    topics: filters.topics.length > 0 ? filters.topics : null,
                    years: filters.years.length > 0 ? filters.years : null,
                    difficulties: filters.difficulties.length > 0 ? filters.difficulties : null,
                    limit: 10
                });
                setMatchingCount(count);
            } catch (error) {
                console.error("Failed to check question count:", error);
                setMatchingCount(null);
            } finally {
                setIsCheckingCount(false);
            }
        };

        const debounce = setTimeout(checkCount, 300);
        return () => clearTimeout(debounce);
    }, [filters.topics, filters.years, filters.difficulties]);

    const handleGenerate = async () => {
        setIsGenerating(true);
        try {
            const questions = await fetchCustomQuestions({
                topics: filters.topics.length > 0 ? filters.topics : null,
                years: filters.years.length > 0 ? filters.years : null,
                difficulties: filters.difficulties.length > 0 ? filters.difficulties : null,
                limit: filters.limit,
                lang: language
            });

            if (questions.length === 0) {
                toast.error(t.narrow_filters_warning);
                return;
            }

            // Navigate to mock test with pre-loaded questions
            navigate("/mock-test", { state: { customQuestions: questions } });
        } catch (error) {
            console.error("Failed to generate test:", error);
            toast.error("Failed to generate custom test");
        } finally {
            setIsGenerating(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background">
                <Header />
                <main className="container flex h-[60vh] items-center justify-center">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <Header />
            <main className="container px-4 py-6 md:py-8">
                <div className="mx-auto max-w-2xl">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="mb-4 md:mb-6 gap-2 text-muted-foreground hover:text-foreground -ml-2 rounded-full"
                        onClick={() => navigate("/dashboard")}
                    >
                        <ArrowLeft className="h-4 w-4" /> {t.back_to_dashboard}
                    </Button>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-[1.5rem] md:rounded-2xl border border-border bg-card p-5 md:p-8 shadow-xl"
                    >
                        <div className="mb-6 md:mb-8 flex items-center gap-3">
                            <div className="flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-xl bg-primary/20 text-primary">
                                <Sparkles className="h-5 w-5 md:h-6 md:w-6" />
                            </div>
                            <div>
                                <h1 className="text-xl md:text-2xl font-black tracking-tight">{t.build_test}</h1>
                                <p className="text-xs md:text-sm text-muted-foreground leading-snug">{t.customize_desc}</p>
                            </div>
                        </div>

                        <div className="space-y-8">
                            {/* Topic Multi-Select */}
                            <div className="space-y-3">
                                <label className="text-sm font-semibold flex items-center justify-between">
                                    <span>{t.select_topic}</span>
                                    <span className="text-xs text-muted-foreground uppercase tracking-widest">
                                        {filters.topics.length === 0 ? "All Topics Selected" : `${filters.topics.length} Selected`}
                                    </span>
                                </label>
                                <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-1 scrollbar-none">
                                    {metadata.topics.map(t_id => {
                                        const isSelected = filters.topics.includes(t_id);
                                        return (
                                            <button
                                                key={t_id}
                                                onClick={() => {
                                                    setFilters(prev => ({
                                                        ...prev,
                                                        topics: isSelected
                                                            ? prev.topics.filter(id => id !== t_id)
                                                            : [...prev.topics, t_id]
                                                    }));
                                                }}
                                                className={`rounded-full px-3 md:px-4 py-1.5 text-[11px] md:text-xs font-bold border transition-all ${isSelected
                                                    ? "bg-primary border-primary text-primary-foreground shadow-sm"
                                                    : "bg-secondary/30 border-border text-muted-foreground hover:border-primary/50"
                                                    }`}
                                            >
                                                {t_id}
                                            </button>
                                        );
                                    })}
                                </div>
                                {metadata.topics.length > 5 && (
                                    <button
                                        onClick={() => setFilters(prev => ({ ...prev, topics: [] }))}
                                        className="text-xs text-primary font-medium hover:underline px-1"
                                    >
                                        Clear and Select All
                                    </button>
                                )}
                            </div>

                            <div className="grid gap-6 md:gap-8 grid-cols-1 md:grid-cols-2">
                                {/* Year Multi-Select */}
                                <div className="space-y-3">
                                    <label className="text-sm font-semibold">{t.exam_year}</label>
                                    <div className="grid grid-cols-3 sm:flex sm:flex-wrap gap-2">
                                        {metadata.years.map(y => {
                                            const isSelected = filters.years.includes(y);
                                            return (
                                                <button
                                                    key={y}
                                                    onClick={() => {
                                                        setFilters(prev => ({
                                                            ...prev,
                                                            years: isSelected
                                                                ? prev.years.filter(year => year !== y)
                                                                : [...prev.years, y]
                                                        }));
                                                    }}
                                                    className={`h-9 md:h-10 w-full sm:w-16 rounded-xl border text-xs md:text-sm font-bold transition-all ${isSelected
                                                        ? "bg-primary border-primary text-primary-foreground shadow-md"
                                                        : "bg-secondary/30 border-border text-muted-foreground hover:border-primary/50"
                                                        }`}
                                                >
                                                    {y}
                                                </button>
                                            );
                                        })}
                                        {metadata.years.length > 0 && (
                                            <button
                                                onClick={() => setFilters(prev => ({ ...prev, years: [] }))}
                                                className={`col-span-2 sm:col-auto h-9 md:h-10 px-4 rounded-xl border text-[10px] md:text-xs font-bold transition-all ${filters.years.length === 0
                                                    ? "bg-primary border-primary text-primary-foreground shadow-md"
                                                    : "bg-secondary/30 border-border text-muted-foreground hover:border-primary/50"
                                                    }`}
                                            >
                                                {t.any_year}
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Difficulty Multi-Select */}
                                <div className="space-y-3">
                                    <label className="text-sm font-semibold">{t.difficulty_level}</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {[
                                            { val: 1, label: t.easy },
                                            { val: 2, label: t.medium },
                                            { val: 3, label: t.hard }
                                        ].map(d => {
                                            const isSelected = filters.difficulties.includes(d.val);
                                            return (
                                                <button
                                                    key={d.val}
                                                    onClick={() => {
                                                        setFilters(prev => ({
                                                            ...prev,
                                                            difficulties: isSelected
                                                                ? prev.difficulties.filter(v => v !== d.val)
                                                                : [...prev.difficulties, d.val]
                                                        }));
                                                    }}
                                                    className={`h-9 md:h-10 px-2 rounded-xl border text-[10px] md:text-xs font-bold transition-all ${isSelected
                                                        ? "bg-primary border-primary text-primary-foreground shadow-md"
                                                        : "bg-secondary/30 border-border text-muted-foreground hover:border-primary/50"
                                                        }`}
                                                >
                                                    {d.label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <button
                                        onClick={() => setFilters(prev => ({ ...prev, difficulties: [] }))}
                                        className="text-[9px] md:text-[10px] text-muted-foreground font-bold uppercase tracking-wider hover:text-primary transition-colors block mt-2"
                                    >
                                        {filters.difficulties.length === 0 ? "⚡ Filtering: Mixed (All Levels)" : "Reset to Mixed Level"}
                                    </button>
                                </div>
                            </div>

                            {/* Question Count */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-bold">{t.num_questions}</label>
                                    <span className="text-xl font-black text-primary">{filters.limit}</span>
                                </div>
                                <div className="grid grid-cols-5 gap-1.5 md:gap-2">
                                    {[5, 10, 20, 50, 100].map(count => (
                                        <button
                                            key={count}
                                            onClick={() => setFilters({ ...filters, limit: count })}
                                            className={`rounded-xl border py-2.5 text-xs md:text-sm font-black transition-all ${filters.limit === count
                                                ? "border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                                                : "border-border bg-secondary/50 text-muted-foreground hover:border-primary/50"
                                                }`}
                                        >
                                            {count}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Proactive Alert Banner */}
                            {!isCheckingCount && matchingCount === 0 && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    className="pt-4"
                                >
                                    <Alert variant="destructive" className="border-destructive/50 bg-destructive/5">
                                        <AlertTriangle className="h-4 w-4" />
                                        <AlertTitle className="font-bold">No Questions Found</AlertTitle>
                                        <AlertDescription>
                                            {t.narrow_filters_warning}
                                        </AlertDescription>
                                    </Alert>
                                </motion.div>
                            )}

                            {!isCheckingCount && matchingCount !== null && matchingCount > 0 && matchingCount < filters.limit && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    className="pt-4"
                                >
                                    <Alert className="border-warning/50 bg-warning/5 text-warning-foreground">
                                        <AlertTriangle className="h-4 w-4 text-warning" />
                                        <AlertDescription className="text-sm">
                                            Only <span className="font-bold">{matchingCount}</span> questions match your criteria. The test will be shorter than requested.
                                        </AlertDescription>
                                    </Alert>
                                </motion.div>
                            )}

                            {isCheckingCount && (
                                <div className="flex items-center gap-2 px-2 py-1 text-xs text-muted-foreground italic">
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                    Checking question availability...
                                </div>
                            )}

                            {!isCheckingCount && matchingCount !== null && matchingCount >= filters.limit && (
                                <div className="flex items-center gap-2 px-2 py-1 text-xs text-success font-medium">
                                    <CheckCircle2 className="h-3 w-3" />
                                    {matchingCount}+ questions available for this combination.
                                </div>
                            )}

                            <Button
                                className="mt-8 h-14 w-full gap-2 text-lg font-bold shadow-lg shadow-primary/20"
                                onClick={handleGenerate}
                                disabled={isGenerating || isCheckingCount || matchingCount === 0}
                            >
                                {isGenerating ? (
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                ) : (
                                    <>
                                        <Play className="h-5 w-5 fill-current" /> {t.start_test}
                                    </>
                                )}
                            </Button>
                        </div>
                    </motion.div>
                </div>
            </main>
        </div>
    );
};

export default CustomTest;
