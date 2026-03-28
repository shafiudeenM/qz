import { useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
    CheckCircle2, XCircle, MinusCircle, RotateCcw,
    ChevronDown, ChevronUp, Trophy, TrendingUp, AlertTriangle, Printer
} from "lucide-react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { type Question } from "@/data/sampleQuestions";
import {
    EXAM_CONFIGS, calculateExamScore, getSectionForQuestion,
    type ExamGroup, type ExamConfig
} from "@/lib/examConfig";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { translations } from "@/lib/translations";

function formatTime(secs: number) {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${h}h ${m}m ${s}s`;
}

export default function ExamResults() {
    const navigate = useNavigate();
    const location = useLocation();
    const {
        examGroup,
        config: cfgFromState,
        questions,
        answers,
        timeTaken,
    }: {
        examGroup: ExamGroup;
        config: ExamConfig;
        questions: Question[];
        answers: (number | null)[];
        timeTaken: number;
    } = location.state || {};

    const config = cfgFromState || EXAM_CONFIGS[examGroup || "G4"];
    const { language, isDualMode, setDualMode } = useAuth();
    const t = translations[language];
    const [expandedSection, setExpandedSection] = useState<string | null>(null);
    const [showAllQuestions, setShowAllQuestions] = useState(false);

    // Overall score
    const overall = useMemo(() => {
        if (!questions || !answers) return null;
        const correctAnswers = questions.map(q => q.correctAnswer);
        return calculateExamScore(answers, correctAnswers, config.negativeMarkFraction);
    }, [answers, config, questions]);

    // Section-wise breakdown
    const sectionBreakdown = useMemo(() => {
        if (!questions || !answers) return [];
        return config.sections.map(section => {
            const sectionOffset = config.sections.slice(0, config.sections.indexOf(section))
                .reduce((acc, s) => acc + s.questionCount, 0);
            const sectionAnswers = answers.slice(sectionOffset, sectionOffset + section.questionCount);
            const sectionCorrect = questions.slice(sectionOffset, sectionOffset + section.questionCount)
                .map(q => q.correctAnswer);
            const stats = calculateExamScore(sectionAnswers, sectionCorrect, config.negativeMarkFraction);
            return { section, ...stats };
        });
    }, [answers, config, questions]);

    if (!questions || !overall) {
        return (
            <div className="min-h-screen bg-background">
                <Header />
                <main className="container flex h-[60vh] items-center justify-center">
                    <div className="text-center">
                        <h2 className="text-xl font-bold">No results found</h2>
                        <Button className="mt-4" onClick={() => navigate("/exam-arena")}>Back to Exam Arena</Button>
                    </div>
                </main>
            </div>
        );
    }

    const cutoffs = config.historicalCutoffs;
    const qualifyingSection = config.sections.find(s => s.isQualifying);
    const qualifyingSectionBreakdown = qualifyingSection
        ? sectionBreakdown.find(s => s.section.id === qualifyingSection.id)
        : null;

    return (
        <div className="min-h-screen bg-background">
            <Header />
            <main className="container py-10 max-w-4xl">
                {/* Header */}
                <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="mb-8 text-center">
                    <Trophy className="h-12 w-12 text-primary mx-auto mb-3" />
                    <h1 className="text-3xl font-black text-foreground">{config.displayName} — Results</h1>
                    <p className="text-muted-foreground mt-1">Time taken: {formatTime(timeTaken)}</p>
                </motion.div>

                {/* Overall Score Card */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="rounded-2xl border border-border bg-gradient-to-br from-primary/10 to-primary/5 p-6 mb-6"
                >
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center">
                            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Score</p>
                            <p className="text-3xl font-black text-primary mt-1">{overall.score}</p>
                            <p className="text-xs text-muted-foreground">/ {questions.length}</p>
                        </div>
                        <div className="text-center">
                            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Correct</p>
                            <p className="text-3xl font-black text-emerald-400 mt-1">{overall.correct}</p>
                            <p className="text-xs text-muted-foreground">+{overall.correct}</p>
                        </div>
                        <div className="text-center">
                            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Wrong</p>
                            <p className="text-3xl font-black text-destructive mt-1">{overall.wrong}</p>
                            <p className="text-xs text-muted-foreground">−{(overall.wrong * config.negativeMarkFraction).toFixed(2)}</p>
                        </div>
                        <div className="text-center">
                            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Skipped</p>
                            <p className="text-3xl font-black text-muted-foreground mt-1">{overall.skipped}</p>
                            <p className="text-xs text-muted-foreground">0 marks</p>
                        </div>
                    </div>
                    {/* Percentage bar */}
                    <div className="mt-5">
                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                            <span>Your Score: {overall.percentage}%</span>
                            {cutoffs && <span>Est. Cutoff (Gen): ~{Math.round((cutoffs.general / questions.length) * 100)}%</span>}
                        </div>
                        <div className="h-2.5 rounded-full bg-secondary overflow-hidden">
                            <div className="h-full bg-primary rounded-full transition-all duration-700" style={{ width: `${overall.percentage}%` }} />
                        </div>
                        {cutoffs && (
                            <div className="mt-1 text-xs text-center">
                                {overall.score >= cutoffs.general
                                    ? <span className="text-emerald-400 font-bold">✅ Above General Cutoff ({cutoffs.general})</span>
                                    : overall.score >= cutoffs.sc
                                        ? <span className="text-warning font-bold">⚠️ Above SC/ST Cutoff ({cutoffs.sc})</span>
                                        : <span className="text-destructive font-bold">❌ Below Cutoffs — Keep Practicing</span>
                                }
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* Qualifying section status */}
                {qualifyingSection && qualifyingSectionBreakdown && (
                    <div className={cn(
                        "rounded-xl border p-4 mb-5 flex items-center gap-3",
                        qualifyingSectionBreakdown.percentage >= 40
                            ? "border-emerald-500/30 bg-emerald-500/5"
                            : "border-destructive/30 bg-destructive/5"
                    )}>
                        {qualifyingSectionBreakdown.percentage >= 40
                            ? <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
                            : <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
                        }
                        <div>
                            <p className="font-bold text-foreground text-sm">
                                {qualifyingSection.name} (Qualifying): {qualifyingSectionBreakdown.score} / {qualifyingSection.questionCount}
                                {" "}— {qualifyingSectionBreakdown.percentage}%
                            </p>
                            <p className="text-xs text-muted-foreground">
                                {qualifyingSectionBreakdown.percentage >= 40
                                    ? "Qualifying section passed. Score contributes to merit."
                                    : "⚠️ Qualifying section not passed (min. ~40%). Section score not counted in merit."}
                            </p>
                        </div>
                    </div>
                )}

                {/* Subject-wise Breakdown */}
                <h2 className="text-lg font-black text-foreground mb-3 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" /> Subject-Wise Analysis
                </h2>
                <div className="space-y-3 mb-8">
                    {sectionBreakdown.map(({ section, correct, wrong, skipped, score, percentage }) => (
                        <div key={section.id} className="rounded-xl border border-border bg-card overflow-hidden">
                            <button
                                className="w-full flex items-center justify-between p-4 text-left hover:bg-secondary/30 transition-colors"
                                onClick={() => setExpandedSection(expandedSection === section.id ? null : section.id)}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={cn(
                                        "h-2 w-2 rounded-full",
                                        percentage >= 60 ? "bg-emerald-400" : percentage >= 40 ? "bg-warning" : "bg-destructive"
                                    )} />
                                    <span className="font-bold text-foreground">
                                        {section.name}
                                        {section.isQualifying && <span className="ml-1 text-xs text-warning">(Qualifying)</span>}
                                    </span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="text-sm font-black text-primary">{score} / {section.questionCount}</span>
                                    <span className="text-xs text-muted-foreground">{percentage}%</span>
                                    {expandedSection === section.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                </div>
                            </button>
                            {expandedSection === section.id && (
                                <div className="border-t border-border/50 px-4 pb-3 pt-3 grid grid-cols-3 gap-3 text-sm">
                                    <div className="text-center">
                                        <CheckCircle2 className="h-4 w-4 text-emerald-400 mx-auto mb-1" />
                                        <p className="font-bold text-emerald-400">{correct}</p>
                                        <p className="text-[10px] text-muted-foreground">Correct</p>
                                    </div>
                                    <div className="text-center">
                                        <XCircle className="h-4 w-4 text-destructive mx-auto mb-1" />
                                        <p className="font-bold text-destructive">{wrong}</p>
                                        <p className="text-[10px] text-muted-foreground">Wrong (−{(wrong * config.negativeMarkFraction).toFixed(2)})</p>
                                    </div>
                                    <div className="text-center">
                                        <MinusCircle className="h-4 w-4 text-muted-foreground mx-auto mb-1" />
                                        <p className="font-bold text-muted-foreground">{skipped}</p>
                                        <p className="text-[10px] text-muted-foreground">Skipped</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Historical Cutoffs */}
                {cutoffs && (
                    <div className="rounded-xl border border-border bg-card p-5 mb-8">
                        <h3 className="font-black text-foreground mb-3">Historical Cutoffs ({cutoffs.year})</h3>
                        <div className="grid grid-cols-3 gap-3 text-center text-sm">
                            {[
                                { label: "General", value: cutoffs.general, color: "text-primary" },
                                { label: "OBC", value: cutoffs.obc, color: "text-amber-400" },
                                { label: "SC/ST", value: cutoffs.sc, color: "text-purple-400" },
                            ].map(c => (
                                <div key={c.label} className="rounded-lg bg-secondary/50 p-3">
                                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{c.label}</p>
                                    <p className={`text-xl font-black mt-1 ${c.color}`}>{c.value}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Question Review */}
                <div className="mb-6">
                    <Button
                        variant="outline"
                        className="w-full gap-2"
                        onClick={() => setShowAllQuestions(v => !v)}
                    >
                        {showAllQuestions ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        {showAllQuestions ? "Hide" : "Show"} All Questions with Answers
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className={cn(
                            "mt-3 w-full text-[10px] font-black uppercase tracking-widest transition-all",
                            isDualMode
                                ? "bg-primary/10 text-primary border-primary/40 shadow-[0_0_10px_rgba(var(--primary),0.1)]"
                                : "text-muted-foreground border-transparent hover:border-primary/20"
                        )}
                        onClick={() => setDualMode(!isDualMode)}
                    >
                        {t.dual_mode}
                    </Button>
                </div>

                {showAllQuestions && (
                    <div className="space-y-3 mb-8">
                        {questions.map((q, i) => {
                            const userAns = answers[i];
                            const isCorrect = userAns === q.correctAnswer;
                            const isSkipped = userAns === null;
                            return (
                                <div key={q.id} className={cn(
                                    "rounded-lg border p-4 text-sm",
                                    isSkipped ? "border-border bg-card"
                                        : isCorrect ? "border-emerald-500/30 bg-emerald-500/5"
                                            : "border-destructive/30 bg-destructive/5"
                                )}>
                                    <div className="flex items-start gap-2 mb-2">
                                        <span className="text-[10px] font-bold text-muted-foreground shrink-0 mt-0.5">Q{i + 1}</span>
                                        {isSkipped ? <MinusCircle className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                                            : isCorrect ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                                                : <XCircle className="h-3.5 w-3.5 text-destructive shrink-0 mt-0.5" />}
                                        <div className="flex flex-col">
                                            <p className="text-foreground">{q.text}</p>
                                            {isDualMode && q.text_ta && (
                                                <p className="text-primary font-medium mt-1 text-xs">{q.text_ta}</p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="ml-7 space-y-1">
                                        <p className="text-xs text-emerald-400 font-medium">
                                            Correct: {q.options[q.correctAnswer]}
                                            {isDualMode && q.options_ta && q.options_ta[q.correctAnswer] && (
                                                <span className="ml-2 italic opacity-80">({q.options_ta[q.correctAnswer]})</span>
                                            )}
                                        </p>
                                        {!isSkipped && !isCorrect && (
                                            <p className="text-xs text-destructive font-medium">
                                                Your answer: {q.options[userAns]}
                                                {isDualMode && q.options_ta && q.options_ta[userAns!] && (
                                                    <span className="ml-2 italic opacity-80">({q.options_ta[userAns!]})</span>
                                                )}
                                            </p>
                                        )}
                                        {q.explanation && (
                                            <div className="text-xs text-muted-foreground mt-2 italic border-l-2 border-muted pl-2 space-y-1">
                                                <p>{q.explanation}</p>
                                                {isDualMode && q.explanation_ta && (
                                                    <p className="text-primary/70">{q.explanation_ta}</p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center gap-4 justify-center flex-wrap no-print">
                    <Button variant="outline" className="gap-2" onClick={() => window.print()}>
                        <Printer className="h-4 w-4" /> Download Report
                    </Button>
                    <Button variant="outline" className="gap-2" onClick={() => navigate("/exam-arena")}>
                        <RotateCcw className="h-4 w-4" /> Try Another Exam
                    </Button>
                    <Button className="gap-2 bg-primary text-primary-foreground" onClick={() => navigate("/dashboard")}>
                        Back to Dashboard
                    </Button>
                </div>
            </main>
        </div>
    );
}
