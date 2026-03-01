import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Settings, Play, ArrowLeft, Loader2, Sparkles } from "lucide-react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { fetchFilterMetadata, fetchCustomQuestions } from "@/lib/questions";
import { useAuth } from "@/components/AuthProvider";
import { translations } from "@/lib/translations";
import { toast } from "sonner";

const CustomTest = () => {
    const navigate = useNavigate();
    const { language } = useAuth();
    const [isLoading, setIsLoading] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const [metadata, setMetadata] = useState<{ topics: string[]; years: number[] }>({ topics: [], years: [] });
    const t = translations[language];

    const [filters, setFilters] = useState({
        topic: "All",
        year: 0,
        difficulty: 0,
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

    const handleGenerate = async () => {
        setIsGenerating(true);
        try {
            const questions = await fetchCustomQuestions({
                ...filters,
                lang: language
            });

            if (questions.length === 0) {
                toast.error("No questions found with these filters. Try broadening your criteria.");
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
            <main className="container py-8">
                <div className="mx-auto max-w-2xl">
                    <Button
                        variant="ghost"
                        className="mb-6 gap-2 text-muted-foreground hover:text-foreground"
                        onClick={() => navigate("/dashboard")}
                    >
                        <ArrowLeft className="h-4 w-4" /> {t.back_to_dashboard}
                    </Button>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-2xl border border-border bg-card p-8 shadow-xl"
                    >
                        <div className="mb-8 flex items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/20 text-primary">
                                <Sparkles className="h-6 w-6" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold">{t.build_test}</h1>
                                <p className="text-sm text-muted-foreground">{t.customize_desc}</p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            {/* Topic Select */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium">{t.select_topic}</label>
                                <select
                                    className="w-full rounded-lg border border-border bg-background p-3 text-sm focus:ring-2 focus:ring-primary outline-none"
                                    value={filters.topic}
                                    onChange={(e) => setFilters({ ...filters, topic: e.target.value })}
                                >
                                    <option value="All">{t.all_topics}</option>
                                    {metadata.topics.map(t_item => (
                                        <option key={t_item} value={t_item}>{t_item}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid gap-6 md:grid-cols-2">
                                {/* Year Select */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">{t.exam_year}</label>
                                    <select
                                        className="w-full rounded-lg border border-border bg-background p-3 text-sm focus:ring-2 focus:ring-primary outline-none"
                                        value={filters.year}
                                        onChange={(e) => setFilters({ ...filters, year: parseInt(e.target.value) })}
                                    >
                                        <option value={0}>{t.any_year}</option>
                                        {metadata.years.map(y => (
                                            <option key={y} value={y}>{y}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Difficulty Select */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">{t.difficulty_level}</label>
                                    <select
                                        className="w-full rounded-lg border border-border bg-background p-3 text-sm focus:ring-2 focus:ring-primary outline-none"
                                        value={filters.difficulty}
                                        onChange={(e) => setFilters({ ...filters, difficulty: parseInt(e.target.value) })}
                                    >
                                        <option value={0}>{t.mix_all}</option>
                                        <option value={1}>{t.easy}</option>
                                        <option value={2}>{t.medium}</option>
                                        <option value={3}>{t.hard}</option>
                                    </select>
                                </div>
                            </div>

                            {/* Question Count */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-medium">{t.num_questions}</label>
                                    <span className="text-lg font-bold text-primary">{filters.limit}</span>
                                </div>
                                <div className="flex gap-2">
                                    {[5, 10, 20, 50, 100].map(count => (
                                        <button
                                            key={count}
                                            onClick={() => setFilters({ ...filters, limit: count })}
                                            className={`flex-1 rounded-lg border py-2 text-sm font-medium transition-all ${filters.limit === count
                                                ? "border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                                                : "border-border bg-secondary/50 text-muted-foreground hover:border-primary/50"
                                                }`}
                                        >
                                            {count}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <Button
                                className="mt-8 h-14 w-full gap-2 text-lg font-bold shadow-lg shadow-primary/20"
                                onClick={handleGenerate}
                                disabled={isGenerating}
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
