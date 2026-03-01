import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, Flag, ChevronLeft, ChevronRight, AlertTriangle, Loader2, BookOpen, Circle, CheckCircle2 } from "lucide-react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { type Question } from "@/data/sampleQuestions";
import { fetchWeightedExamQuestions, saveQuizSession, updateQuestionMastery } from "@/lib/questions";
import { EXAM_CONFIGS, formatExamTime, calculateExamScore, getSectionForQuestion, type ExamGroup } from "@/lib/examConfig";
import { cn } from "@/lib/utils";

export default function ExamSession() {
    const navigate = useNavigate();
    const location = useLocation();
    const examGroup = (location.state?.examGroup as ExamGroup) || "G4";
    const config = EXAM_CONFIGS[examGroup];

    const [questions, setQuestions] = useState<Question[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadingStatus, setLoadingStatus] = useState("Preparing your exam...");
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState<(number | null)[]>([]);
    const [flagged, setFlagged] = useState<Set<number>>(new Set());
    const [timeLeft, setTimeLeft] = useState(config.durationSeconds);
    const [submitted, setSubmitted] = useState(false);
    const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const isSubmittedRef = useRef(false);

    // Load questions
    useEffect(() => {
        const load = async () => {
            try {
                setLoadingStatus("Fetching Tamil section questions...");
                const data = await fetchWeightedExamQuestions(config, "en");
                if (data.length === 0) {
                    toast.error("No questions found. Please ensure questions are loaded in the database.");
                    navigate("/exam-arena");
                    return;
                }
                setLoadingStatus(`Loaded ${data.length} questions. Starting exam...`);
                setQuestions(data);
                setAnswers(new Array(data.length).fill(null));
            } catch (err) {
                console.error("Failed to load exam questions:", err);
                toast.error("Failed to load exam. Please try again.");
                navigate("/exam-arena");
            } finally {
                setIsLoading(false);
            }
        };
        load();
    }, [config, navigate]);

    // Countdown timer
    useEffect(() => {
        if (submitted || isLoading) return;
        const timer = setInterval(() => {
            setTimeLeft(t => {
                if (t <= 1) {
                    handleAutoSubmit();
                    return 0;
                }
                return t - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [submitted, isLoading]);

    const handleAutoSubmit = useCallback(() => {
        if (isSubmittedRef.current) return;
        isSubmittedRef.current = true;
        toast.warning("Time's up! Exam auto-submitted.");
        setSubmitted(true);
        navigateToResults();
    }, []);

    const navigateToResults = useCallback(async () => {
        setIsSubmitting(true);
        const correctAnswers = questions.map(q => q.correctAnswer);
        const { score } = calculateExamScore(answers, correctAnswers, config.negativeMarkFraction);

        try {
            toast.loading("Analyzing performance & updating spaced repetition...", { id: "saving-exam" });

            await saveQuizSession({
                quiz_title: config.displayName,
                total_questions: questions.length,
                score: score,
                potential_score: questions.length,
                subject: "Full Exam",
                quiz_snapshot: questions,
                answers_snapshot: answers
            });

            // Process answered questions for spaced repetition (SM-2)
            const updatePromises = [];
            for (let i = 0; i < questions.length; i++) {
                if (answers[i] !== null) {
                    const isCorrect = answers[i] === questions[i].correctAnswer;
                    updatePromises.push(updateQuestionMastery(Number(questions[i].id), isCorrect, 'mock'));
                }
            }
            // Execute in batches of 20 to avoid overwhelming the database
            for (let i = 0; i < updatePromises.length; i += 20) {
                await Promise.all(updatePromises.slice(i, i + 20));
            }

            toast.dismiss("saving-exam");
            toast.success("Exam results saved and SR updated!");
        } catch (error) {
            console.error("Error saving exam session:", error);
            toast.dismiss("saving-exam");
            toast.error("Analysis completed. Progress saving failed.");
        } finally {
            setIsSubmitting(false);
            navigate("/exam-results", {
                state: {
                    examGroup,
                    config,
                    questions,
                    answers,
                    correctAnswers,
                    timeTaken: config.durationSeconds - timeLeft,
                }
            });
        }
    }, [answers, config, examGroup, navigate, questions, timeLeft]);

    const handleManualSubmit = () => {
        if (isSubmittedRef.current) return;
        isSubmittedRef.current = true;
        setSubmitted(true);
        navigateToResults();
    };

    const selectAnswer = (optionIndex: number) => {
        const newAnswers = [...answers];
        newAnswers[currentIndex] = optionIndex;
        setAnswers(newAnswers);
    };

    const toggleFlag = () => {
        const newFlags = new Set(flagged);
        if (newFlags.has(currentIndex)) newFlags.delete(currentIndex);
        else newFlags.add(currentIndex);
        setFlagged(newFlags);
    };

    const currentSection = questions.length > 0
        ? getSectionForQuestion(config, currentIndex)
        : config.sections[0];

    const answered = answers.filter(a => a !== null).length;
    const skipped = questions.length - answered;

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background">
                <Header />
                <main className="container flex h-[70vh] items-center justify-center">
                    <div className="flex flex-col items-center gap-5 text-center">
                        <div className="relative">
                            <Loader2 className="h-14 w-14 animate-spin text-primary" />
                            <BookOpen className="h-6 w-6 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary" />
                        </div>
                        <div>
                            <p className="text-lg font-bold text-foreground">{loadingStatus}</p>
                            <p className="text-sm text-muted-foreground mt-1">
                                Preparing {config.totalQuestions} questions for {config.displayName}...
                            </p>
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    const question = questions[currentIndex];

    return (
        <div className="min-h-screen bg-background flex flex-col">
            {/* ── Top Bar ── */}
            <div className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur">
                <div className="container flex h-14 items-center justify-between gap-4">
                    {/* Exam label */}
                    <div className="flex items-center gap-2 shrink-0">
                        <BookOpen className="h-4 w-4 text-primary" />
                        <span className="text-sm font-black text-foreground">{config.displayName}</span>
                        <span className="rounded bg-secondary px-2 py-0.5 text-[10px] font-bold uppercase text-muted-foreground">
                            {currentSection.name}
                        </span>
                    </div>

                    {/* Timer */}
                    <div className={cn(
                        "flex items-center gap-2 rounded-xl px-4 py-1.5 font-black tabular-nums text-lg transition-all",
                        timeLeft <= 600
                            ? "bg-destructive/10 text-destructive border border-destructive/30 animate-pulse"
                            : timeLeft <= 1800
                                ? "bg-warning/10 text-warning border border-warning/30"
                                : "bg-secondary/80 text-foreground"
                    )}>
                        <Clock className="h-4 w-4" />
                        {formatExamTime(timeLeft)}
                    </div>

                    {/* Submit */}
                    <Button
                        variant="destructive"
                        size="sm"
                        className="font-bold uppercase tracking-wide"
                        onClick={() => setShowSubmitConfirm(true)}
                    >
                        Submit Exam
                    </Button>
                </div>

                {/* Progress bar */}
                <div className="h-1 bg-border">
                    <div
                        className="h-full bg-primary transition-all duration-300"
                        style={{ width: `${(answered / questions.length) * 100}%` }}
                    />
                </div>
            </div>

            {/* ── Main Content: Split Panel ── */}
            <div className="flex flex-1 container gap-0 px-0 max-w-none">

                {/* LEFT: Question Booklet */}
                <div className="flex-1 min-w-0 border-r border-border overflow-y-auto px-8 py-6">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentIndex}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 10 }}
                            transition={{ duration: 0.15 }}
                        >
                            {/* Question meta */}
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
                                <span className="rounded bg-primary/10 text-primary px-2 py-0.5 font-bold">Q.{currentIndex + 1}</span>
                                <span className="rounded bg-secondary px-2 py-0.5">{currentSection.name}</span>
                                <span>{question.source} · {question.examYear}</span>
                                {flagged.has(currentIndex) && (
                                    <span className="rounded bg-warning/10 text-warning px-2 py-0.5 font-bold">🚩 Flagged</span>
                                )}
                            </div>

                            {/* Question text */}
                            <h2 className="text-lg font-semibold text-foreground leading-relaxed mb-6 whitespace-pre-line">
                                {question.text}
                            </h2>

                            {/* Options — styled like question paper */}
                            <div className="space-y-3">
                                {question.options.map((option, i) => {
                                    const label = String.fromCharCode(65 + i); // A, B, C, D
                                    const isSelected = answers[currentIndex] === i;
                                    return (
                                        <button
                                            key={i}
                                            onClick={() => selectAnswer(i)}
                                            className={cn(
                                                "flex w-full items-center gap-4 rounded-xl border p-4 text-left transition-all duration-150 active:scale-[0.99]",
                                                isSelected
                                                    ? "border-primary bg-primary/10 ring-1 ring-primary"
                                                    : "border-border bg-card hover:border-primary/40 hover:bg-primary/5"
                                            )}
                                        >
                                            <span className={cn(
                                                "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg font-black text-sm transition-colors",
                                                isSelected ? "bg-primary text-primary-foreground" : "bg-secondary/80 text-foreground"
                                            )}>
                                                {label}
                                            </span>
                                            <span className="text-base text-foreground leading-relaxed">{option}</span>
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Navigation */}
                            <div className="mt-8 flex items-center justify-between">
                                <Button
                                    variant="outline"
                                    onClick={() => setCurrentIndex(i => Math.max(0, i - 1))}
                                    disabled={currentIndex === 0}
                                    className="gap-1"
                                >
                                    <ChevronLeft className="h-4 w-4" /> Previous
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={toggleFlag}
                                    className={flagged.has(currentIndex)
                                        ? "border-warning text-warning bg-warning/10 gap-1"
                                        : "gap-1 text-muted-foreground"
                                    }
                                >
                                    <Flag className="h-4 w-4" />
                                    {flagged.has(currentIndex) ? "Unflag" : "Flag for Review"}
                                </Button>
                                <Button
                                    onClick={() => setCurrentIndex(i => Math.min(questions.length - 1, i + 1))}
                                    disabled={currentIndex === questions.length - 1}
                                    className="gap-1 bg-primary text-primary-foreground"
                                >
                                    Next <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* RIGHT: OMR Answer Sheet */}
                <div className="w-72 shrink-0 overflow-y-auto border-l border-border bg-card/30 px-4 py-5">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-1">OMR Answer Sheet</p>
                    <h2 className="text-sm font-bold text-foreground mb-4">
                        Q {currentIndex + 1} / {questions.length}
                    </h2>

                    {/* Section labels */}
                    {config.sections.map(section => {
                        const sectionOffset = config.sections.slice(0, config.sections.indexOf(section)).reduce((acc, s) => acc + s.questionCount, 0);
                        return (
                            <div key={section.id} className="mb-2">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className={cn(
                                        "text-[9px] font-black uppercase px-2 py-0.5 rounded",
                                        section.isQualifying ? "bg-warning/10 text-warning" : "bg-primary/10 text-primary"
                                    )}>
                                        {section.name} {section.isQualifying ? "(Q)" : ""}
                                    </span>
                                </div>
                                <div className="grid grid-cols-5 gap-1.5 mb-3">
                                    {Array.from({ length: section.questionCount }, (_, i) => {
                                        const qIdx = sectionOffset + i;
                                        const ans = answers[qIdx];
                                        const isCurrent = qIdx === currentIndex;
                                        const isFlagged = flagged.has(qIdx);
                                        return (
                                            <button
                                                key={qIdx}
                                                onClick={() => setCurrentIndex(qIdx)}
                                                title={`Q${qIdx + 1}`}
                                                className={cn(
                                                    "h-7 w-full rounded text-[9px] font-black transition-all hover:scale-110",
                                                    isCurrent
                                                        ? "bg-primary text-primary-foreground shadow-md shadow-primary/30"
                                                        : ans !== null
                                                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                                            : isFlagged
                                                                ? "bg-warning/20 text-warning border border-warning/30"
                                                                : "bg-secondary/50 text-muted-foreground hover:bg-secondary"
                                                )}
                                            >
                                                {qIdx + 1}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}

                    {/* Legend */}
                    <div className="border-t border-border pt-3 space-y-1.5 text-[9px] font-bold uppercase tracking-wider text-muted-foreground mt-2">
                        <div className="flex items-center gap-2">
                            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/60" /> Answered ({answered})
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="h-2.5 w-2.5 rounded-full bg-warning/60" /> Flagged ({flagged.size})
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="h-2.5 w-2.5 rounded-full bg-secondary" /> Not Answered ({skipped})
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Submit Confirmation Dialog ── */}
            <AnimatePresence>
                {showSubmitConfirm && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ scale: 0.95 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.95 }}
                            className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl"
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <AlertTriangle className="h-6 w-6 text-warning" />
                                <h3 className="text-lg font-bold text-foreground">Submit Exam?</h3>
                            </div>
                            <div className="grid grid-cols-3 gap-3 mb-5">
                                <div className="rounded-lg bg-emerald-500/10 p-3 text-center">
                                    <CheckCircle2 className="h-4 w-4 text-emerald-400 mx-auto mb-1" />
                                    <p className="text-xl font-black text-emerald-400">{answered}</p>
                                    <p className="text-[9px] text-muted-foreground uppercase tracking-wide">Answered</p>
                                </div>
                                <div className="rounded-lg bg-secondary p-3 text-center">
                                    <Circle className="h-4 w-4 text-muted-foreground mx-auto mb-1" />
                                    <p className="text-xl font-black text-foreground">{skipped}</p>
                                    <p className="text-[9px] text-muted-foreground uppercase tracking-wide">Skipped</p>
                                </div>
                                <div className="rounded-lg bg-warning/10 p-3 text-center">
                                    <Flag className="h-4 w-4 text-warning mx-auto mb-1" />
                                    <p className="text-xl font-black text-warning">{flagged.size}</p>
                                    <p className="text-[9px] text-muted-foreground uppercase tracking-wide">Flagged</p>
                                </div>
                            </div>
                            <p className="text-sm text-muted-foreground mb-5">
                                You have <strong className="text-foreground">{formatExamTime(timeLeft)}</strong> remaining.
                                Once submitted, you cannot change your answers.
                            </p>
                            <div className="flex gap-3">
                                <Button variant="outline" className="flex-1" onClick={() => setShowSubmitConfirm(false)} disabled={isSubmitting}>
                                    Back to Exam
                                </Button>
                                <Button variant="destructive" className="flex-1 font-bold" onClick={handleManualSubmit} disabled={isSubmitting}>
                                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                    {isSubmitting ? "Submitting..." : "Confirm Submit"}
                                </Button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
