import { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
    ChevronRight,
    CheckCircle2,
    XCircle,
    Clock,
    Brain,
    Loader2,
    ChevronLeft,
    Zap,
    History,
    Timer,
    Sparkles,
    Trash2,
    Bookmark
} from "lucide-react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { type Question } from "@/data/sampleQuestions";
import {
    fetchReviewQuestions,
    saveQuizSession,
    updateQuestionMastery,
    fetchSavedQuestions,
    updateMasteryStatus
} from "@/lib/questions";
import { useAuth } from "@/components/AuthProvider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const Review = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { language, user } = useAuth();

    // Get mode from router state (passed from ReviewCenter)
    const mode = (location.state?.mode as "review" | "urgent" | "weak" | "power") || "review";
    const isPowerMode = mode === 'power';

    const [questions, setQuestions] = useState<Question[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
    const [isRevealed, setIsRevealed] = useState(false);
    const [score, setScore] = useState(0);
    const [answers, setAnswers] = useState<(number | null)[]>([]);
    const [finished, setFinished] = useState(false);
    const [savedList, setSavedList] = useState<Question[]>([]);
    const [activeTab, setActiveTab] = useState("review");

    // Timer for Power Mode
    const [timeLeft, setTimeLeft] = useState(5);

    useEffect(() => {
        const loadSaved = async () => {
            const data = await fetchSavedQuestions(language);
            setSavedList(data);
        };
        if (user) loadSaved();
    }, [user, language]);

    useEffect(() => {
        const loadQuestions = async () => {
            try {
                const data = await fetchReviewQuestions(10, language, mode);
                setQuestions(data);
            } catch (error) {
                console.error("Failed to load review questions:", error);
            } finally {
                setIsLoading(false);
            }
        };
        loadQuestions();
    }, [language, mode]);

    // Power Mode Timer Logic
    useEffect(() => {
        if (isPowerMode && !isRevealed && !finished && !isLoading && questions.length > 0) {
            if (timeLeft <= 0) {
                handleSubmit(true);
                return;
            }
            const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
            return () => clearInterval(timer);
        }
    }, [timeLeft, isPowerMode, isRevealed, finished, isLoading, questions]);

    const handleNext = () => {
        if (currentIndex < questions.length - 1) {
            setCurrentIndex((i) => i + 1);
            setSelectedAnswer(null);
            setIsRevealed(false);
            setTimeLeft(5); // Reset timer
        } else {
            setFinished(true);
        }
    };

    const handleSubmit = (isTimeout = false) => {
        if (isRevealed) return;
        setIsRevealed(true);
        const isCorrect = !isTimeout && selectedAnswer === question.correctAnswer;
        if (isCorrect) setScore((s) => s + 1);
        setAnswers((a) => [...a, selectedAnswer]);

        // Update mastery
        updateQuestionMastery(Number(question.id), isCorrect, mode);
    };

    const handleRetire = async () => {
        if (!question) return;
        try {
            await updateMasteryStatus(Number(question.id), { is_retired: true });
            toast.success("Question retired. It won't appear in reviews again.");
            handleNext();
        } catch (error) {
            toast.error("Failed to retire question");
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background">
                <Header />
                <main className="container flex h-[60vh] items-center justify-center">
                    <div className="flex flex-col items-center gap-4">
                        <Loader2 className="h-12 w-12 animate-spin text-primary" />
                        <p className="text-muted-foreground">Fetching your {mode} questions...</p>
                    </div>
                </main>
            </div>
        );
    }

    if (!isLoading && questions.length === 0) {
        return (
            <div className="min-h-screen bg-background">
                <Header />
                <main className="container flex h-[60vh] items-center justify-center text-center">
                    <div className="max-w-md">
                        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                            <CheckCircle2 className="h-10 w-10 text-primary" />
                        </div>
                        <h1 className="text-2xl font-bold uppercase tracking-tighter">Memory Bank Empty</h1>
                        <p className="mt-2 text-muted-foreground">The Spaced Repetition engine needs data to work. Complete a <b>Daily Quiz</b> or <b>Mock Test</b> first. Correct answers will be scheduled for review starting tomorrow!</p>
                        <div className="mt-8 flex flex-col gap-3">
                            <Button onClick={() => navigate("/quiz")} className="rounded-xl font-bold uppercase tracking-widest text-[10px] h-12">
                                Start Daily Quiz
                            </Button>
                            <Button variant="ghost" onClick={() => navigate("/review-center")} className="rounded-xl font-bold uppercase tracking-widest text-[10px]">
                                Back to Hub
                            </Button>
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    if (finished) {
        return (
            <div className="min-h-screen bg-background">
                <Header />
                <main className="container py-12">
                    <div className="mx-auto max-w-lg text-center">
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="bg-card border border-border p-8 md:p-12 rounded-[2rem] md:rounded-[3rem] shadow-xl"
                        >
                            <h1 className="text-2xl md:text-3xl font-black tracking-tighter mb-2 uppercase">Mission Complete!</h1>
                            <p className="text-sm md:text-base text-muted-foreground mb-8">You've successfully reviewed {questions.length} questions in {mode} mode.</p>

                            <div className="grid grid-cols-2 gap-4 mb-8">
                                <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10">
                                    <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Accuracy</p>
                                    <p className="text-2xl font-black">{Math.round((score / questions.length) * 100)}%</p>
                                </div>
                                <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10">
                                    <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Correct</p>
                                    <p className="text-2xl font-black">{score}/{questions.length}</p>
                                </div>
                            </div>

                            <Button onClick={() => navigate("/review-center")} className="w-full h-12 rounded-xl font-bold uppercase tracking-widest">
                                Return to Hub
                            </Button>
                        </motion.div>
                    </div>
                </main>
            </div>
        );
    }

    const question = questions[currentIndex];

    return (
        <div className="min-h-screen bg-background pb-12 transition-colors">
            <Header />
            <main className="container max-w-4xl px-4 py-6 md:py-8">
                {/* Review Header */}
                <div className="mb-6 md:mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6">
                    <div className="flex items-center gap-3 md:gap-4">
                        <Button variant="ghost" size="sm" onClick={() => navigate("/review-center")} className="rounded-full h-9 w-9 md:h-10 md:w-10 p-0 hover:bg-muted shrink-0">
                            <ChevronLeft className="h-5 w-5" />
                        </Button>
                        <div>
                            <div className="flex items-center gap-2 mb-0.5 md:mb-1">
                                <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-primary">{mode} session</span>
                                {isPowerMode && (
                                    <div className={cn(
                                        "flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] font-black uppercase animate-pulse",
                                        timeLeft <= 2 ? "bg-red-500 text-white" : "bg-orange-500/10 text-orange-500 border border-orange-500/20"
                                    )}>
                                        <Timer className="h-2 w-2" /> {timeLeft}s Left
                                    </div>
                                )}
                            </div>
                            <h2 className="text-[10px] md:text-xs font-black uppercase tracking-widest opacity-60">Question {currentIndex + 1} of {questions.length}</h2>
                        </div>
                    </div>

                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full md:w-[300px]">
                        <TabsList className="grid w-full grid-cols-2 rounded-xl bg-muted/50 p-1">
                            <TabsTrigger value="review" className="rounded-lg font-bold text-xs">Review</TabsTrigger>
                            <TabsTrigger value="saved" className="rounded-lg font-bold text-xs">Saved Items</TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>

                <AnimatePresence mode="wait">
                    {activeTab === "saved" ? (
                        <motion.div
                            key="saved-tab"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-4"
                        >
                            {savedList.length === 0 ? (
                                <div className="py-20 text-center">
                                    <Bookmark className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
                                    <p className="text-muted-foreground font-medium">No saved questions found.</p>
                                </div>
                            ) : (
                                savedList.map((sq, i) => (
                                    <div key={sq.id} className="p-6 bg-card border border-border rounded-2xl">
                                        <h3 className="font-bold mb-4">{sq.text}</h3>
                                        {/* Simplified card for saved */}
                                    </div>
                                ))
                            )}
                        </motion.div>
                    ) : (
                        <motion.div
                            key={currentIndex}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-8"
                        >
                            <div className="p-6 md:p-12 rounded-[1.5rem] md:rounded-[2.5rem] bg-card border border-border/50 shadow-sm relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-8 opacity-5">
                                    <Brain className="h-16 w-16 md:h-24 md:w-24" />
                                </div>

                                <div className="space-y-6 relative z-10">
                                    <div className="flex items-center flex-wrap gap-2">
                                        <span className="rounded-full bg-primary/10 px-3 py-1 text-[9px] md:text-[10px] font-black uppercase tracking-widest text-primary">
                                            {question.topic}
                                        </span>
                                        <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">{question.source} {question.examYear}</span>
                                    </div>
                                    <h2 className="text-xl md:text-3xl font-bold leading-tight tracking-tight text-foreground">{question.text}</h2>

                                    <div className="grid gap-3 pt-4">
                                        {question.options.map((option, index) => (
                                            <button
                                                key={index}
                                                disabled={isRevealed}
                                                onClick={() => setSelectedAnswer(index)}
                                                className={cn(
                                                    "relative flex items-center gap-3 md:gap-4 rounded-xl md:rounded-2xl border p-4 md:p-5 text-left transition-all",
                                                    selectedAnswer === index
                                                        ? "border-primary bg-primary/5 ring-1 ring-primary"
                                                        : "bg-muted/30 border-transparent hover:border-border",
                                                    isRevealed && index === question.correctAnswer
                                                        ? "border-green-500 bg-green-500/10 text-green-700"
                                                        : isRevealed && selectedAnswer === index && index !== question.correctAnswer
                                                            ? "border-red-500 bg-red-500/10 text-red-700"
                                                            : ""
                                                )}
                                            >
                                                <div className={cn(
                                                    "flex h-7 w-7 md:h-8 md:w-8 shrink-0 items-center justify-center rounded-lg border text-xs md:text-sm font-black",
                                                    selectedAnswer === index ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border"
                                                )}>
                                                    {String.fromCharCode(65 + index)}
                                                </div>
                                                <span className="text-sm md:text-base font-bold leading-snug">{option}</span>
                                                {isRevealed && index === question.correctAnswer && (
                                                    <CheckCircle2 className="ml-auto h-5 w-5 text-green-500 shrink-0" />
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col md:flex-row items-center justify-between gap-4 md:gap-6 bg-muted/20 p-5 md:p-6 rounded-[1.5rem] md:rounded-[2rem] border border-border/50">
                                <div className="flex items-center gap-2 w-full md:w-auto">
                                    {!isRevealed && (
                                        <Button variant="ghost" size="sm" onClick={handleRetire} className="w-full md:w-auto text-red-500 hover:text-red-600 hover:bg-red-50 rounded-xl gap-2 font-black uppercase tracking-widest text-[9px] md:text-[10px] h-11 md:h-10">
                                            <Trash2 className="h-4 w-4" /> Retire Question
                                        </Button>
                                    )}
                                </div>

                                <div className="flex gap-3 w-full md:w-auto">
                                    {!isRevealed ? (
                                        <Button
                                            onClick={() => handleSubmit()}
                                            disabled={selectedAnswer === null}
                                            className="grow md:grow-0 md:w-48 h-12 rounded-xl font-black uppercase tracking-widest shadow-lg shadow-primary/20"
                                        >
                                            Submit Answer
                                        </Button>
                                    ) : (
                                        <Button onClick={handleNext} className="grow md:grow-0 md:w-48 h-12 rounded-xl font-black uppercase tracking-widest shadow-lg shadow-primary/20 group">
                                            {currentIndex === questions.length - 1 ? "Finish Mission" : "Secure Next"} <ChevronRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                                        </Button>
                                    )}
                                </div>
                            </div>

                            <AnimatePresence>
                                {isRevealed && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className={cn(
                                            "rounded-[2rem] p-8 border",
                                            selectedAnswer === question.correctAnswer
                                                ? "bg-green-500/5 border-green-500/20"
                                                : "bg-red-500/5 border-red-500/20"
                                        )}
                                    >
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className={cn(
                                                "h-10 w-10 rounded-2xl flex items-center justify-center",
                                                selectedAnswer === question.correctAnswer ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
                                            )}>
                                                {selectedAnswer === question.correctAnswer ? <CheckCircle2 className="h-6 w-6" /> : <XCircle className="h-6 w-6" />}
                                            </div>
                                            <h3 className={cn("text-lg font-black uppercase tracking-tighter", selectedAnswer === question.correctAnswer ? "text-green-700" : "text-red-700")}>
                                                {selectedAnswer === question.correctAnswer ? "Strategic Success" : "Analysis Required"}
                                            </h3>
                                        </div>
                                        <div className="space-y-4">
                                            <div className="p-4 rounded-2xl bg-background/50 border border-border/50">
                                                <p className="text-xs font-black uppercase text-muted-foreground mb-2 flex items-center gap-2">
                                                    <Sparkles className="h-3 w-3 text-primary" /> Intelligence Brief
                                                </p>
                                                <p className="text-sm font-medium leading-relaxed text-foreground/80">
                                                    {question.explanation}
                                                </p>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
};

export default Review;
