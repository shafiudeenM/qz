import { useState } from "react";
import { motion } from "framer-motion";
import {
    ArrowLeft,
    Target,
    BarChart,
    Clock,
    Award,
    Share2,
    Bookmark,
    CheckCircle2,
    AlertCircle,
    HelpCircle,
    TrendingUp,
    History
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
import {
    BarChart as RechartBar,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell
} from "recharts";

const YEAR_DISTRIBUTION = [
    { year: "2018", count: 4, color: "#3b82f6" },
    { year: "2019", count: 6, color: "#10b981" },
    { year: "2020", count: 3, color: "#f59e0b" },
    { year: "2021", count: 8, color: "#ef4444" },
    { year: "2022", count: 5, color: "#8b5cf6" },
    { year: "2024", count: 12, color: "#ec4899" },
];

const QuestionDetailView = () => {
    return (
        <div className="min-h-screen bg-[#0a0a0c] text-white p-10">
            <div className="max-w-7xl mx-auto">
                {/* Navigation Top Bar */}
                <div className="flex items-center justify-between mb-12">
                    <Link to="/concept-detail" className="flex items-center gap-2 text-white/40 hover:text-white transition-all text-xs font-black uppercase tracking-widest">
                        <ArrowLeft className="h-4 w-4" /> Back to MCQ Library
                    </Link>
                    <div className="flex gap-4">
                        <Button variant="outline" size="sm" className="bg-[#121214] border-white/5 h-10 px-4 rounded-xl text-xs font-black uppercase tracking-widest text-white/60">
                            <Bookmark className="mr-2 h-4 w-4" /> Save
                        </Button>
                        <Button variant="outline" size="sm" className="bg-[#121214] border-white/5 h-10 px-4 rounded-xl text-xs font-black uppercase tracking-widest text-white/60">
                            <Share2 className="mr-2 h-4 w-4" /> Share
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-12 gap-12">
                    {/* Left Column: Full Question & Explanation */}
                    <div className="col-span-12 lg:col-span-7 space-y-10">
                        <section>
                            <div className="flex items-center gap-3 mb-6">
                                <div className="h-2 w-10 bg-primary rounded-full" />
                                <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Official PYQ — Group 4 (2024)</h2>
                            </div>
                            <h1 className="text-3xl font-black tracking-tight leading-tight mb-10">
                                Which Article of the Indian Constitution empowers the Supreme Court to issue writs for the enforcement of fundamental rights?
                            </h1>

                            <div className="space-y-4">
                                {[
                                    { label: "A", text: "Article 226" },
                                    { label: "B", text: "Article 32", correct: true },
                                    { label: "C", text: "Article 13" },
                                    { label: "D", text: "Article 14" }
                                ].map((opt) => (
                                    <div
                                        key={opt.label}
                                        className={`p-6 rounded-3xl border transition-all flex items-center justify-between ${opt.correct
                                            ? 'bg-emerald-500/10 border-emerald-500/30 ring-1 ring-emerald-500/20'
                                            : 'bg-[#121214] border-white/5 opacity-60'
                                            }`}
                                    >
                                        <div className="flex items-center gap-6">
                                            <span className={`h-10 w-10 rounded-xl flex items-center justify-center font-black text-sm border ${opt.correct ? 'bg-emerald-500 text-white border-transparent' : 'bg-white/5 border-white/10 text-white/40'
                                                }`}>
                                                {opt.label}
                                            </span>
                                            <span className="font-bold text-lg">{opt.text}</span>
                                        </div>
                                        {opt.correct && <CheckCircle2 className="h-6 w-6 text-emerald-500" />}
                                    </div>
                                ))}
                            </div>
                        </section>

                        <Card className="bg-primary/5 border-primary/10 rounded-[3rem] p-10">
                            <div className="flex items-center gap-3 mb-8">
                                <HelpCircle className="h-6 w-6 text-primary" />
                                <h3 className="text-xl font-black uppercase tracking-tighter">Deep Logical Explanation</h3>
                            </div>
                            <p className="text-lg font-medium text-white/70 leading-relaxed mb-8">
                                Article 32 is known as the "Right to Constitutional Remedies." Dr. B.R. Ambedkar called it the "Heart and Soul" of the Constitution. It guarantees the right to move the Supreme Court for the enforcement of the Fundamental Rights.
                            </p>
                            <div className="p-6 rounded-2xl bg-[#0a0a0c] border border-white/5 space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-1 w-1 bg-primary rounded-full shrink-0" />
                                    <p className="text-sm font-bold text-white/50 lowercase"><span className="text-white">Writs included:</span> Habeas Corpus, Mandamus, Prohibition, Certiorari, and Quo-Warranto.</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="h-1 w-1 bg-primary rounded-full shrink-0" />
                                    <p className="text-sm font-bold text-white/50 lowercase"><span className="text-white">Note:</span> High Courts have similar powers under Article 226, which is wider in scope than Article 32.</p>
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* Right Column: Metadata & Stats */}
                    <aside className="col-span-12 lg:col-span-5 space-y-8">
                        <Card className="bg-[#121214] border-white/5 rounded-[3rem] p-8">
                            <CardTitle className="text-lg font-black uppercase tracking-tighter mb-8 flex items-center gap-3">
                                <Target className="h-5 w-5 text-rose-500" /> Concept Evolution
                            </CardTitle>
                            <div className="space-y-6 mb-10">
                                <div className="flex justify-between items-center py-4 border-b border-white/5">
                                    <span className="text-xs font-black uppercase tracking-widest text-white/30">Subject</span>
                                    <span className="text-sm font-black">Indian Polity</span>
                                </div>
                                <div className="flex justify-between items-center py-4 border-b border-white/5">
                                    <span className="text-xs font-black uppercase tracking-widest text-white/30">Topic</span>
                                    <span className="text-sm font-black">Fundamental Rights</span>
                                </div>
                                <div className="flex justify-between items-center py-4 border-b border-white/5">
                                    <span className="text-xs font-black uppercase tracking-widest text-white/30">Micro-Concept</span>
                                    <span className="text-sm font-black text-primary">Article 32</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-8">
                                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-center">
                                    <div className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-1">Difficulty</div>
                                    <div className="text-lg font-black text-rose-500">Expert</div>
                                </div>
                                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-center">
                                    <div className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-1">Bloom Level</div>
                                    <div className="text-lg font-black text-primary">Evaluation</div>
                                </div>
                            </div>
                        </Card>

                        <Card className="bg-[#121214] border-white/5 rounded-[3rem] p-8">
                            <CardTitle className="text-lg font-black uppercase tracking-tighter mb-8 flex items-center gap-3">
                                <History className="h-5 w-5 text-primary" /> Year Distribution
                            </CardTitle>
                            <div className="h-[200px] w-full mb-6">
                                <ResponsiveContainer width="100%" height="100%">
                                    <RechartBar data={YEAR_DISTRIBUTION}>
                                        <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fill: '#ffffff20', fontSize: 10, fontWeight: 800 }} />
                                        <Tooltip cursor={{ fill: '#ffffff05' }} contentStyle={{ backgroundColor: '#1a1a1c', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px' }} />
                                        <Bar dataKey="count" radius={[4, 4, 4, 4]} barSize={25}>
                                            {YEAR_DISTRIBUTION.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Bar>
                                    </RechartBar>
                                </ResponsiveContainer>
                            </div>
                            <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 flex items-center justify-between">
                                <div className="text-[10px] font-black uppercase tracking-widest text-primary">Frequency Note</div>
                                <span className="text-xs font-bold text-white/50">Recurred twice in last 2 years</span>
                            </div>
                        </Card>

                        <section className="space-y-4">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 pl-4">Pattern Connections</h3>
                            <div className="grid gap-4">
                                {[
                                    { title: "Article 226 Scope", frequency: "High" },
                                    { title: "Nature of Writs", frequency: "Medium" }
                                ].map(rel => (
                                    <Card key={rel.title} className="bg-[#121214] border-white/5 p-5 rounded-2xl flex items-center justify-between group cursor-pointer hover:border-white/10 transition-all">
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 bg-white/5 rounded-xl flex items-center justify-center font-black text-sm border border-white/10 text-white/40">
                                                PYQ
                                            </div>
                                            <span className="font-black text-sm text-white/70 group-hover:text-white transition-colors uppercase tracking-tight">{rel.title}</span>
                                        </div>
                                        <Badge className="bg-white/10 text-white/40 text-[9px] font-black uppercase tracking-widest">{rel.frequency}</Badge>
                                    </Card>
                                ))}
                            </div>
                        </section>
                    </aside>
                </div>
            </div>
        </div>
    );
};

export default QuestionDetailView;
