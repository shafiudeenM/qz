import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Clock, BookOpen, Target, ChevronRight, AlertCircle, Trophy, Users } from "lucide-react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { EXAM_CONFIGS, type ExamGroup } from "@/lib/examConfig";

const groupMeta: Record<ExamGroup, { badge: string; color: string; description: string; eligibility: string }> = {
    G4: {
        badge: "Group 4",
        color: "from-emerald-500/20 to-teal-500/10 border-emerald-500/30",
        description: "Junior Assistant, Village Administrative Officer, Typist",
        eligibility: "10th / 12th Pass",
    },
    G2: {
        badge: "Group 2",
        color: "from-blue-500/20 to-indigo-500/10 border-blue-500/30",
        description: "Sub-Inspector Level, Revenue Inspector, Surveyor",
        eligibility: "Any Degree",
    },
    G1: {
        badge: "Group 1",
        color: "from-purple-500/20 to-violet-500/10 border-purple-500/30",
        description: "Deputy Collector, DSP, Assistant Director",
        eligibility: "Any Degree",
    },
};

export default function ExamArena() {
    const navigate = useNavigate();
    const [selectedGroup, setSelectedGroup] = useState<ExamGroup | null>(null);
    const [showConfirm, setShowConfirm] = useState(false);

    const handleStartExam = () => {
        if (!selectedGroup) return;
        navigate("/exam-session", { state: { examGroup: selectedGroup } });
    };

    const config = selectedGroup ? EXAM_CONFIGS[selectedGroup] : null;
    const meta = selectedGroup ? groupMeta[selectedGroup] : null;

    return (
        <div className="min-h-screen bg-background">
            <Header />
            <main className="container py-10 max-w-5xl">
                {/* Page header */}
                <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="mb-10 text-center">
                    <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-primary mb-4">
                        <Target className="h-3 w-3" /> Proactive Exam Arena
                    </div>
                    <h1 className="text-4xl font-black tracking-tight text-foreground">Choose Your Exam</h1>
                    <p className="mt-2 text-muted-foreground">
                        Full-length mock exam · Official question count · 3-hour timer · Negative marking
                    </p>
                </motion.div>

                {/* Exam cards */}
                <div className="grid gap-5 md:grid-cols-3 mb-10">
                    {(Object.keys(EXAM_CONFIGS) as ExamGroup[]).map((group, i) => {
                        const cfg = EXAM_CONFIGS[group];
                        const m = groupMeta[group];
                        const isSelected = selectedGroup === group;

                        return (
                            <motion.div
                                key={group}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                onClick={() => { setSelectedGroup(group); setShowConfirm(false); }}
                                className={`relative cursor-pointer rounded-2xl border bg-gradient-to-br p-6 transition-all duration-200 ${m.color} ${isSelected ? "ring-2 ring-primary scale-[1.02] shadow-xl shadow-primary/20" : "hover:scale-[1.01] hover:shadow-lg"
                                    }`}
                            >
                                {isSelected && (
                                    <div className="absolute top-3 right-3 h-2.5 w-2.5 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--primary),0.8)]" />
                                )}
                                <div className="mb-3 inline-flex items-center gap-1.5 rounded-lg bg-background/60 px-3 py-1 text-xs font-black uppercase tracking-wider text-foreground">
                                    <Trophy className="h-3 w-3" /> {m.badge}
                                </div>
                                <h2 className="text-xl font-black text-foreground">{cfg.displayName}</h2>
                                <p className="mt-1 text-xs text-muted-foreground">{m.description}</p>

                                <div className="mt-4 space-y-2">
                                    {cfg.sections.map(s => (
                                        <div key={s.id} className="flex items-center justify-between text-xs">
                                            <span className="text-muted-foreground">
                                                {s.name}{s.isQualifying ? " *" : ""}
                                            </span>
                                            <span className="font-bold text-foreground">{s.questionCount} Q</span>
                                        </div>
                                    ))}
                                    <div className="border-t border-border/40 pt-2 flex items-center justify-between text-sm font-black">
                                        <span className="text-foreground">Total</span>
                                        <span className="text-primary">{cfg.totalQuestions} Q</span>
                                    </div>
                                </div>

                                <div className="mt-4 flex items-center gap-4 text-[10px] text-muted-foreground">
                                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> 3 Hours</span>
                                    <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {m.eligibility}</span>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Instructions + Confirm */}
                {selectedGroup && config && meta && (
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-2xl border border-border bg-card p-6"
                    >
                        <div className="flex items-start gap-3 mb-5">
                            <AlertCircle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
                            <div>
                                <h3 className="font-bold text-foreground">Exam Instructions — {config.displayName}</h3>
                                <p className="text-xs text-muted-foreground mt-0.5">Read carefully before starting</p>
                            </div>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2 mb-6">
                            {[
                                { label: "Total Questions", value: `${config.totalQuestions} Questions` },
                                { label: "Duration", value: "3 Hours (180 Minutes)" },
                                { label: "Marks per Question", value: "1 Mark" },
                                { label: "Negative Marking", value: "1/3 Mark deducted per wrong answer" },
                            ].map(item => (
                                <div key={item.label} className="rounded-lg bg-secondary/40 px-4 py-3">
                                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{item.label}</p>
                                    <p className="font-bold text-foreground text-sm mt-0.5">{item.value}</p>
                                </div>
                            ))}
                        </div>

                        <ul className="space-y-1.5 text-sm text-muted-foreground mb-6">
                            <li>• Questions are fetched randomly from past TNPSC papers matching the official pattern.</li>
                            {config.sections.some(s => s.isQualifying) && (
                                <li>• <span className="text-warning font-semibold">Tamil section is qualifying</span> — you must pass it separately from the merit score.</li>
                            )}
                            <li>• You can flag questions for review and navigate freely between them.</li>
                            <li>• The exam auto-submits when time runs out.</li>
                            <li>• Do not refresh or close the tab — your progress will be lost.</li>
                        </ul>

                        <div className="flex items-center gap-4">
                            <Button
                                onClick={handleStartExam}
                                className="gap-2 bg-primary text-primary-foreground px-8 font-black uppercase tracking-wide"
                                size="lg"
                            >
                                <BookOpen className="h-4 w-4" />
                                Start {meta.badge} Exam
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                            <p className="text-xs text-muted-foreground">* Tamil section is qualifying only</p>
                        </div>
                    </motion.div>
                )}
            </main>
        </div>
    );
}
