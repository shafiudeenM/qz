import { useState } from "react";
import { motion } from "framer-motion";
import {
    ArrowLeft,
    Target,
    Calendar,
    BarChart,
    Eye,
    EyeOff,
    ChevronRight,
    TrendingUp,
    Award
} from "lucide-react";
import { Link } from "react-router-dom";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

const QUESTIONS = [
    {
        id: 1,
        text: "Which Article of the Indian Constitution deals with the Right to Equality?",
        year: "2024",
        exam: "Group 4",
        answer: "Article 14 - 18",
        explanation: "Article 14 ensures equality before law and equal protection of laws within the territory of India.",
        tags: ["Polity", "Fundamental Rights", "Article 14"]
    },
    {
        id: 2,
        text: "The 'Right to Privacy' is a fundamental right under which Article of the Constitution?",
        year: "2023",
        exam: "Group 2",
        answer: "Article 21",
        explanation: "The Supreme Court in Justice K.S. Puttaswamy v. Union of India (2017) declared right to privacy as a fundamental right under Article 21.",
        tags: ["Polity", "Fundamental Rights", "Article 21"]
    },
    {
        id: 3,
        text: "Which of the following Fundamental Rights cannot be suspended even during an Emergency?",
        year: "2022",
        exam: "Group 1",
        answer: "Articles 20 and 21",
        explanation: "The 44th Amendment Act, 1978, restricted the suspension of Articles 20 and 21 during a National Emergency.",
        tags: ["Polity", "Fundamental Rights", "Emergency Provisions"]
    }
];

const ConceptDetail = () => {
    const [showAnswers, setShowAnswers] = useState<Record<number, boolean>>({});

    const toggleAnswer = (id: number) => {
        setShowAnswers(prev => ({ ...prev, [id]: !prev[id] }));
    };

    return (
        <div className="min-h-screen bg-[#0a0a0c] text-white p-10 selection:bg-primary/30">
            <div className="max-w-5xl mx-auto">
                {/* Breadcrumbs */}
                <Link to="/subject-drilldown" className="flex items-center gap-2 text-white/40 hover:text-white transition-all text-xs font-black uppercase tracking-widest mb-10">
                    <ArrowLeft className="h-4 w-4" /> Back to Fundamental Rights
                </Link>

                {/* Top Summary Section */}
                <section className="mb-12">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                        <div className="space-y-4 max-w-2xl">
                            <div className="flex items-center gap-3">
                                <Badge className="bg-primary/10 text-primary border-primary/20 font-black uppercase tracking-widest px-3 h-6">Micro-Concept</Badge>
                                <div className="flex items-center gap-2 text-xs font-bold text-white/30 lowercase italic">
                                    /polity/fundamental-rights/article-32
                                </div>
                            </div>
                            <h1 className="text-5xl font-black uppercase tracking-tighter leading-none">Article 32 & Writs</h1>
                            <p className="text-white/40 text-lg font-medium leading-relaxed">
                                The heart and soul of the Constitution. Deals with constitutional remedies for enforcement of fundamental rights. Extremely critical for Groups 1, 2, and 4.
                            </p>
                        </div>

                        <Card className="bg-[#121214] border-white/5 p-6 min-w-[300px] rounded-3xl self-start">
                            <div className="space-y-6">
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-white/30">Total PYQs</span>
                                    <span className="text-2xl font-black">42</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-white/30">Last Asked</span>
                                    <span className="text-2xl font-black">2024</span>
                                </div>
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-white/30">Probability Score</span>
                                        <span className="text-sm font-black text-rose-500">92%</span>
                                    </div>
                                    <Progress value={92} className="h-2 bg-white/5" />
                                </div>
                            </div>
                        </Card>
                    </div>
                </section>

                <div className="grid grid-cols-12 gap-10">
                    {/* Middle Section — Question List */}
                    <section className="col-span-8 space-y-6">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-2xl font-black uppercase tracking-tighter">Historical Evidence</h2>
                            <div className="text-xs font-black text-white/30 uppercase tracking-widest">{QUESTIONS.length} Questions Displayed</div>
                        </div>

                        {QUESTIONS.map((q, idx) => (
                            <motion.div
                                key={q.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.1 }}
                            >
                                <Card className="bg-[#121214] border-white/5 hover:border-white/10 transition-all rounded-3xl overflow-hidden group">
                                    <div className="p-8">
                                        <div className="flex items-center justify-between mb-4">
                                            <Badge variant="outline" className="border-white/10 text-[10px] font-black uppercase tracking-widest text-white/40 px-3">
                                                {q.exam} — {q.year}
                                            </Badge>
                                            <Link to={`/question-detail/${q.id}`} className="text-[10px] font-black uppercase text-primary tracking-widest flex items-center gap-1 hover:underline">
                                                Full Stats <ChevronRight className="h-3 w-3" />
                                            </Link>
                                        </div>
                                        <h3 className="text-xl font-black tracking-tight mb-8 leading-snug group-hover:text-primary transition-colors cursor-pointer">
                                            {q.text}
                                        </h3>

                                        <div className="flex flex-wrap gap-2 mb-8">
                                            {q.tags.map(tag => (
                                                <span key={tag} className="text-[9px] font-black uppercase tracking-widest px-2 py-1 bg-white/5 text-white/40 rounded-md">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>

                                        <div className="flex gap-3">
                                            <Button
                                                variant="outline"
                                                onClick={() => toggleAnswer(q.id)}
                                                className="bg-transparent border-white/10 text-[10px] font-black uppercase tracking-widest h-10 px-6 rounded-xl hover:bg-white/5"
                                            >
                                                {showAnswers[q.id] ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
                                                {showAnswers[q.id] ? "Hide Answer" : "View Answer"}
                                            </Button>
                                        </div>

                                        {showAnswers[q.id] && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="mt-8 p-6 rounded-2xl bg-primary/5 border border-primary/10"
                                            >
                                                <div className="text-[10px] font-black uppercase tracking-widest text-primary mb-2">Verified Answer</div>
                                                <div className="text-lg font-black text-white mb-4">{q.answer}</div>
                                                <div className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-2">Deep Logic</div>
                                                <p className="text-sm font-medium text-white/60 leading-relaxed">{q.explanation}</p>
                                            </motion.div>
                                        )}
                                    </div>
                                </Card>
                            </motion.div>
                        ))}
                    </section>

                    {/* Bottom/Right Section — Concept Insights */}
                    <aside className="col-span-4 space-y-6">
                        <Card className="bg-[#121214] border-white/5 p-8 rounded-3xl">
                            <div className="flex items-center gap-3 mb-6">
                                <TrendingUp className="h-5 w-5 text-emerald-500" />
                                <CardTitle className="text-lg font-black uppercase tracking-tighter">Trend Summary</CardTitle>
                            </div>
                            <p className="text-sm font-medium text-white/50 leading-relaxed mb-6">
                                Questions on Article 32 are increasing in frequency. Since 2021, the focus has shifted from simple MCQ to multi-statement analytical questions.
                            </p>
                            <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                                <Award className="h-4 w-4" /> High Priority Topic
                            </div>
                        </Card>

                        <Card className="bg-[#121214] border-white/5 p-8 rounded-3xl">
                            <CardTitle className="text-lg font-black uppercase tracking-tighter mb-6">Prob Reasoning</CardTitle>
                            <div className="space-y-4">
                                <div className="flex gap-3 items-start">
                                    <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5" />
                                    <p className="text-xs font-bold text-white/40 leading-relaxed">High historical recurrence in Group 2 exams.</p>
                                </div>
                                <div className="flex gap-3 items-start">
                                    <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5" />
                                    <p className="text-xs font-bold text-white/40 leading-relaxed">Core component of the "Preamble" and "Judiciary" connection.</p>
                                </div>
                                <div className="flex gap-3 items-start">
                                    <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5" />
                                    <p className="text-xs font-bold text-white/40 leading-relaxed">Consistent gap of ~1.2 years between questions.</p>
                                </div>
                            </div>
                        </Card>

                        <Card className="bg-[#121214] border-white/5 p-8 rounded-3xl">
                            <CardTitle className="text-lg font-black uppercase tracking-tighter mb-6">Related Concepts</CardTitle>
                            <div className="flex flex-wrap gap-2">
                                {["Article 226", "Judicial Review", "High Courts", "PIL", "Locus Standi"].map(concept => (
                                    <span key={concept} className="px-3 py-1.5 rounded-xl bg-white/[0.03] text-[10px] font-black uppercase tracking-widest text-white/50 hover:bg-primary/10 hover:text-primary transition-all cursor-pointer">
                                        {concept}
                                    </span>
                                ))}
                            </div>
                        </Card>
                    </aside>
                </div>
            </div>
        </div>
    );
};

export default ConceptDetail;
