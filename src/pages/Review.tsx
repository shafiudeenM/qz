import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
    ChevronRight,
    CheckCircle2,
    XCircle,
    Clock,
    Brain,
    Loader2,
    ChevronLeft
} from "lucide-react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { type Question } from "@/data/sampleQuestions";
import { fetchReviewQuestions, saveQuizSession, updateQuestionMastery, fetchSavedQuestions } from "@/lib/questions";
import { useAuth } from "@/components/AuthProvider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bookmark, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const Review = () => {
    const navigate = useNavigate();
    const { language, user } = useAuth();
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
                const data = await fetchReviewQuestions(10, language);
                setQuestions(data);
            } catch (error) {
                console.error("Failed to load review questions:", error);
            } finally {
                setIsLoading(false);
            }
        };
        loadQuestions();
    }, [language]);

    const handleSubmit = () => {
        if (isRevealed) return;
        setIsRevealed(true);
        const isCorrect = selectedAnswer === question.correctAnswer;
        if (isCorrect) setScore((s) => s + 1);
        setAnswers((a) => [...a, selectedAnswer]);

        // Update mastery
        updateQuestionMastery(Number(question.id), isCorrect, 'review');
    };

    const handleNext = async () => {
        if (currentIndex < questions.length - 1) {
            setCurrentIndex((i) => i + 1);
            setSelectedAnswer(null);
            setIsRevealed(false);
        } else {
            setFinished(true);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background">
                <Header />
                <main className="container flex h-[60vh] items-center justify-center">
                    <div className="flex flex-col items-center gap-4">
                        <Loader2 className="h-12 w-12 animate-spin text-primary" />
                        <p className="text-muted-foreground">Fetching your review questions...</p>
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
                        <h1 className="text-2xl font-bold">All Caught Up!</h1>
                        <p className="mt-2 text-muted-foreground">You have no questions scheduled for review at the moment. Great job maintaining your mastery!</p>
                        <Button onClick={() => navigate("/dashboard")} className="mt-6">
                            Back to Dashboard
                        </Button>
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
                        <h1 className="text-2xl font-bold">Review Complete!</h1>
                        <p className="mt-2 text-muted-foreground">You've successfully reviewed {questions.length} questions.</p>
                        <div className="mt-8">
                            <Button onClick={() => navigate("/dashboard")}>Back to Dashboard</Button>
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    const question = questions[currentIndex];

    return (
        <div className="min-h-screen bg-background pb-12 transition-colors">
            <Header />
            <main className="container max-w-3xl py-8">
                <div className="mb-8 items-center justify-between">
                    <div className="flex items-center justify-between mb-6">
                        <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")} className="gap-2">
                            <ChevronLeft className="h-4 w-4" /> Exit
                        </Button>
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-[300px]">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="review">Smart Review</TabsTrigger>
                                <TabsTrigger value="saved">Saved</TabsTrigger>
                            </TabsList>
                        </Tabs>
                        <div className="w-20" /> {/* Spacer */}
                    </div>

                    {activeTab === "review" ? (
                        <div className="flex items-center justify-end">
                            <span className="text-sm font-medium text-muted-foreground tracking-tight">Question {currentIndex + 1} of {questions.length}</span>
                        </div>
                    ) : (
                        <div className="flex items-center justify-end">
                            <span className="text-sm font-medium text-muted-foreground tracking-tight">{savedList.length} bookmarked items</span>
                        </div>
                    )}
                </div>

                {activeTab === "saved" ? (
                    <div className="space-y-6">
                        {savedList.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center glass-card rounded-2xl">
                                <Bookmark className="h-12 w-12 text-muted-foreground/30 mb-4" />
                                <h3 className="text-lg font-bold">No Saved Questions</h3>
                                <p className="text-sm text-muted-foreground mt-1">Questions you bookmark during quizzes will appear here.</p>
                            </div>
                        ) : (
                            savedList.map((q, i) => (
                                <motion.div
                                    key={q.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    className="p-6 glass-card rounded-2xl border border-border/50 hover:border-primary/30 transition-all group"
                                >
                                    <div className="flex items-center gap-2 mb-3">
                                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary uppercase">
                                            {q.topic}
                                        </span>
                                        <span className="text-[10px] text-muted-foreground">{q.source} {q.examYear}</span>
                                    </div>
                                    <h3 className="font-bold text-foreground mb-4 leading-relaxed">{q.text}</h3>
                                    <div className="grid gap-2 mb-4">
                                        {q.options.map((opt, idx) => (
                                            <div
                                                key={idx}
                                                className={cn(
                                                    "text-sm p-3 rounded-xl border",
                                                    idx === q.correctAnswer
                                                        ? "border-success/30 bg-success/5 text-success font-medium"
                                                        : "border-border/50 bg-secondary/30 text-muted-foreground"
                                                )}
                                            >
                                                {String.fromCharCode(65 + idx)}. {opt}
                                            </div>
                                        ))}
                                    </div>
                                    <div className="p-4 rounded-xl bg-info/5 border border-info/20">
                                        <p className="text-xs font-bold text-info flex items-center gap-1 mb-1">
                                            <Sparkles className="h-3 w-3" /> Explanation
                                        </p>
                                        <p className="text-xs text-foreground/70 leading-relaxed">{q.explanation}</p>
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                                    {question.topic}
                                </span>
                                <span className="text-xs text-muted-foreground">{question.source} {question.examYear}</span>
                            </div>
                            <h2 className="text-xl font-bold leading-tight md:text-2xl">{question.text}</h2>
                        </div>

                        <div className="grid gap-3">
                            {question.options.map((option, index) => (
                                <button
                                    key={index}
                                    disabled={isRevealed}
                                    onClick={() => setSelectedAnswer(index)}
                                    className={`relative flex items-center gap-4 rounded-xl border p-4 text-left transition-all hover:border-primary/50 ${selectedAnswer === index
                                        ? "border-primary bg-primary/5 ring-1 ring-primary"
                                        : "bg-card"
                                        } ${isRevealed && index === question.correctAnswer
                                            ? "border-green-500 bg-green-50/50"
                                            : isRevealed && selectedAnswer === index && index !== question.correctAnswer
                                                ? "border-red-500 bg-red-50/50"
                                                : ""
                                        }`}
                                >
                                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border text-sm font-bold ${selectedAnswer === index ? "bg-primary text-primary-foreground border-primary" : "bg-muted/50"
                                        }`}>
                                        {String.fromCharCode(65 + index)}
                                    </div>
                                    <span className="text-sm font-medium md:text-base">{option}</span>
                                    {isRevealed && index === question.correctAnswer && (
                                        <CheckCircle2 className="ml-auto h-5 w-5 text-green-500" />
                                    )}
                                    {isRevealed && selectedAnswer === index && index !== question.correctAnswer && (
                                        <XCircle className="ml-auto h-5 w-5 text-red-500" />
                                    )}
                                </button>
                            ))}
                        </div>

                        <div className="mt-8 flex justify-end gap-3">
                            {!isRevealed ? (
                                <Button
                                    onClick={handleSubmit}
                                    disabled={selectedAnswer === null}
                                    className="px-8"
                                >
                                    Submit Answer
                                </Button>
                            ) : (
                                <Button onClick={handleNext} className="gap-2 px-8">
                                    {currentIndex === questions.length - 1 ? "Finish Review" : "Next Question"} <ChevronRight className="h-4 w-4" />
                                </Button>
                            )}
                        </div>

                        <AnimatePresence>
                            {isRevealed && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`rounded-xl p-6 ${selectedAnswer === question.correctAnswer
                                        ? "bg-green-50/50 border border-green-200"
                                        : "bg-red-50/50 border border-red-200"
                                        }`}
                                >
                                    <h3 className={`font-bold ${selectedAnswer === question.correctAnswer ? "text-green-800" : "text-red-800"}`}>
                                        {selectedAnswer === question.correctAnswer ? "Correct!" : "Incorrect"}
                                    </h3>
                                    <p className="mt-2 text-sm text-foreground/80 leading-relaxed">
                                        {question.explanation}
                                    </p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                )}
            </main>
        </div>
    );
};

export default Review;
