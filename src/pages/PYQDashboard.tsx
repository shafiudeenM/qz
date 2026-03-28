import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
    Zap, Search, ChevronDown, TrendingUp, ArrowRight,
    LayoutDashboard, BookOpen, PieChart as PieChartIcon,
    Settings, Database, Languages, Loader2, Target, Info
} from "lucide-react";
import { Link } from "react-router-dom";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { fetchTopicWeightage, fetchTopicTrends, fetchProbabilityHeatmap, fetchUserWeaknessRadar } from "@/lib/questions";
import IntelligenceExplainer from "@/components/IntelligenceExplainer";
import PersonalizedStrategy from "@/components/PersonalizedStrategy";

const COLORS = ['#F59E0B', '#10B981', '#3b82f6', '#EF4444', '#8B5CF6', '#EC4899'];

const getRiskColor = (level: string) => {
    switch (level) {
        case 'CRITICAL': return { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30', bar: 'bg-red-500' };
        case 'HIGH': return { bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500/30', bar: 'bg-orange-500' };
        case 'MEDIUM': return { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/30', bar: 'bg-yellow-500' };
        default: return { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/30', bar: 'bg-blue-500' };
    }
};

const PYQDashboard = () => {
    const [loading, setLoading] = useState(true);
    const [selectedExam, setSelectedExam] = useState("G4");
    const [weightage, setWeightage] = useState<any[]>([]);
    const [trends, setTrends] = useState<any[]>([]);
    const [heatmap, setHeatmap] = useState<any[]>([]);
    const [weaknesses, setWeaknesses] = useState<any[]>([]);

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                const [wData, tData, hData, rData] = await Promise.all([
                    fetchTopicWeightage(selectedExam),
                    fetchTopicTrends(),
                    fetchProbabilityHeatmap(),
                    fetchUserWeaknessRadar()
                ]);
                setWeightage(wData || []);
                setTrends(tData || []);
                setHeatmap(hData || []);
                setWeaknesses(rData || []);
            } catch (error) {
                console.error("Error loading intelligence data:", error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [selectedExam]);

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-[#0a0a0c]">
                <div className="text-center">
                    <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
                    <p className="text-white/40 font-bold uppercase tracking-widest text-sm">Loading Intelligence...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-[#0a0a0c]">

            {/* ─── Sidebar ───────────────────────────────────────────── */}
            <aside className="w-64 border-r border-white/5 bg-[#0d0d0f] flex flex-col p-6 fixed h-full z-50">
                <div className="flex items-center gap-3 mb-10">
                    <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20">
                        <Zap className="h-6 w-6 text-primary" />
                    </div>
                    <span className="text-xl font-black tracking-tighter text-white">TNPSC OS</span>
                </div>

                <nav className="flex-1 space-y-1.5">
                    {[
                        { to: "/pyq-intelligence", icon: <LayoutDashboard className="h-4 w-4" />, label: "வெற்றியாளர் திட்டம்", active: true },
                        { to: "/subject-drilldown/browse", icon: <BookOpen className="h-4 w-4" />, label: "Subjects" },
                        { to: "/advanced-analytics", icon: <PieChartIcon className="h-4 w-4" />, label: "Analytics" },
                        { to: "/admin-panel", icon: <Database className="h-4 w-4" />, label: "Admin" },
                    ].map(link => (
                        <Link
                            key={link.to}
                            to={link.to}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${link.active
                                ? 'bg-primary/20 text-primary border border-primary/30 shadow-sm'
                                : 'text-white/40 hover:bg-white/5 hover:text-white'
                                }`}
                        >
                            {link.icon} {link.label}
                        </Link>
                    ))}
                </nav>

                <div className="mt-auto">
                    <Link to="/settings" className="flex items-center gap-3 px-4 py-3 rounded-xl text-white/40 hover:bg-white/5 hover:text-white transition-all text-sm font-bold">
                        <Settings className="h-4 w-4" /> Settings
                    </Link>
                </div>
            </aside>

            {/* ─── Main Content ──────────────────────────────────────── */}
            <main className="ml-64 flex-1 p-8 pb-20">

                {/* Top Bar */}
                <header className="flex items-center justify-between mb-10 gap-6">
                    <div className="flex items-center gap-4 flex-1 max-w-2xl">
                        <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-primary border border-primary/20 whitespace-nowrap">
                            <Languages className="h-3 w-3" /> Tamil Priority Analytics
                        </div>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="bg-[#0d0d0f] border-white/10 hover:bg-white/5 h-12 px-6 rounded-xl min-w-[140px] justify-between font-bold text-white shadow-none">
                                    {selectedExam === 'G4' ? 'Group 4' : selectedExam === 'G2' ? 'Group 2' : 'Group 1'}
                                    <ChevronDown className="ml-2 h-4 w-4 text-white/40" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="bg-[#0d0d0f] border-white/10 shadow-2xl w-[140px] rounded-xl font-medium text-white">
                                {['G1', 'G2', 'G4'].map(g => (
                                    <DropdownMenuItem key={g} onClick={() => setSelectedExam(g)} className="cursor-pointer hover:bg-white/5 text-white/80 focus:bg-white/5 focus:text-white">
                                        Group {g.slice(1)}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/40" />
                            <Input
                                className="bg-[#0d0d0f] border-white/10 h-12 pl-12 rounded-xl text-white placeholder:text-white/30 w-full focus-visible:ring-primary/30"
                                placeholder="Search by topic..."
                            />
                        </div>
                    </div>

                    <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center font-black text-white shadow-[0_0_15px_rgba(245,158,11,0.4)] text-lg flex-shrink-0">
                        S
                    </div>
                </header>

                {/* ── AI Explainer ─────────────────────────────────── */}
                <div className="mb-10">
                    <IntelligenceExplainer weightage={weightage} trends={trends} heatmap={heatmap} />
                </div>

                {/* ── Subject Weightage Grid ────────────────────────── */}
                <section className="mb-10">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-2xl font-black text-white tracking-tight">Subject Weightage</h2>
                            <p className="text-white/50 font-medium text-sm mt-1">Recency-weighted selection probability per topic</p>
                        </div>
                        <Link to="/advanced-analytics" className="text-primary text-sm font-bold flex items-center gap-2 hover:text-primary/80 transition-colors">
                            Full Distribution <ArrowRight className="h-4 w-4" />
                        </Link>
                    </div>

                    {weightage.length === 0 ? (
                        <div className="bg-[#0d0d0f] border border-white/10 rounded-2xl p-10 text-center">
                            <p className="text-white/40 font-bold uppercase tracking-widest text-sm">No data yet — add questions to see weightage.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-5 gap-4">
                            {weightage.slice(0, 5).map((subject, i) => (
                                <motion.div
                                    key={subject.topic_id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.08 }}
                                    className="bg-[#0d0d0f] border border-white/10 transition-all hover:border-primary/30 hover:shadow-[0_0_15px_rgba(245,158,11,0.15)] rounded-2xl p-5 group relative overflow-hidden cursor-pointer flex flex-col"
                                >
                                    <div className="absolute top-4 right-4">
                                        <TrendingUp className="h-4 w-4 text-emerald-400" />
                                    </div>
                                    <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1.5 pr-6 truncate">{subject.topic_name}</p>
                                    <h3 className="text-base font-black text-white mb-4 leading-tight">{subject.topic_name_ta || subject.topic_name}</h3>
                                    <div className="mt-auto">
                                        <p className="text-3xl font-black text-white group-hover:text-primary transition-colors">
                                            {subject.selection_probability}<span className="text-lg text-white/40 font-bold ml-1">%</span>
                                        </p>
                                        <p className="text-[10px] font-bold text-white/40 uppercase mt-1 mb-4 hidden">Probability</p>
                                    </div>
                                    <Link to={`/subject-drilldown/${encodeURIComponent(subject.topic_id)}`} className="mt-auto pt-4">
                                        <button className="w-full h-8 text-[11px] font-bold text-primary bg-primary/10 border border-primary/20 rounded-lg group-hover:bg-primary group-hover:text-white transition-all text-center">
                                            Analyze Trend
                                        </button>
                                    </Link>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </section>

                {/* ── Pattern Distribution + Personalized Strategy ──── */}
                <div className="grid grid-cols-7 gap-6 mb-10">

                    {/* Bar Chart */}
                    <div className="col-span-4 bg-[#0d0d0f] border border-white/10 p-6 rounded-2xl">
                        <h3 className="text-xl font-black text-white tracking-tight mb-1">Pattern Distribution</h3>
                        <p className="text-white/50 font-medium text-sm mb-6">Recency-weighted question density across syllabus</p>
                        <div className="h-[300px] w-full">
                            {weightage.length === 0 ? (
                                <div className="flex items-center justify-center h-full">
                                    <p className="text-white/40 font-bold uppercase tracking-widest text-xs">No data available</p>
                                </div>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={weightage.slice(0, 8)}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                        <XAxis
                                            dataKey="topic_id"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }}
                                            dy={10}
                                            interval={0}
                                        />
                                        <YAxis
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }}
                                        />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#0d0d0f', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#ffffff', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.5)' }}
                                            labelStyle={{ color: '#f59e0b', fontWeight: '800', marginBottom: '4px' }}
                                            itemStyle={{ color: '#cbd5e1', fontWeight: '600' }}
                                        />
                                        <Bar dataKey="selection_probability" radius={[4, 4, 0, 0]} barSize={35}>
                                            {weightage.slice(0, 8).map((_, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </div>

                    {/* Personalized Strategy Aside */}
                    <aside className="col-span-3 space-y-5">
                        <PersonalizedStrategy weaknesses={weaknesses} />

                        <div className="p-6 rounded-2xl bg-primary/10 border border-primary/20">
                            <p className="text-xs font-black uppercase tracking-widest text-primary mb-2">Next Exam Prediction</p>
                            <p className="text-sm text-white/80 leading-relaxed font-medium mb-5">
                                Our models indicate a <strong className="text-white font-black">72% likelihood</strong> of increased focus on Modern Indian History in the upcoming Group 4 notification.
                            </p>
                            <button className="w-full h-11 rounded-xl bg-white/10 text-primary border border-white/10 text-xs font-bold hover:bg-primary hover:text-white transition-all">
                                Download Analysis (PDF)
                            </button>
                        </div>
                    </aside>
                </div>

                {/* ── Probability Heatmap ───────────────────────────── */}
                <section className="bg-[#0d0d0f] border border-white/10 p-8 rounded-3xl">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-2xl font-black text-white tracking-tight mb-1">Probability Heatmap</h2>
                            <p className="text-white/50 font-medium text-sm">Topics ranked by likelihood of appearing in upcoming notification</p>
                        </div>
                        <HoverCard>
                            <HoverCardTrigger asChild>
                                <button className="text-primary hover:text-primary/80 flex items-center gap-1.5 text-xs font-bold border border-primary/20 bg-primary/10 px-3 py-2 rounded-xl transition-all">
                                    <Info className="h-4 w-4" /> Algorithm
                                </button>
                            </HoverCardTrigger>
                            <HoverCardContent className="w-80 bg-[#0d0d0f] border-white/10 shadow-2xl rounded-xl">
                                <h4 className="text-sm font-black text-white mb-2">Predictive Priority (V1.2)</h4>
                                <p className="text-xs text-white/60 font-medium">
                                    Weight = 1 / (current_yr − exam_yr + 1). Recent questions count more. Score = normalized weighted frequency.
                                </p>
                            </HoverCardContent>
                        </HoverCard>
                    </div>

                    {heatmap.length === 0 ? (
                        <div className="text-center py-10 bg-[#0a0a0c] rounded-2xl border border-white/5">
                            <p className="text-white/40 font-bold uppercase tracking-widest text-sm">No heatmap data — questions needed.</p>
                        </div>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                            {heatmap.slice(0, 8).map((item) => {
                                const c = getRiskColor(item.risk_level);
                                return (
                                    <div key={item.topic_id} className={`flex flex-col border rounded-xl overflow-hidden bg-[#0a0a0c] hover:border-primary/30 hover:shadow-[0_0_15px_rgba(245,158,11,0.1)] transition-all ${c.border}`}>
                                        <div className={`px-4 py-2 flex items-center justify-between font-black text-[10px] tracking-widest uppercase ${c.bg} ${c.text}`}>
                                            <span>{item.risk_level} PRIORITY</span>
                                        </div>
                                        <div className="p-4 flex-1 flex flex-col">
                                            <p className="text-xs font-bold text-white/40 uppercase mb-1">{item.topic_id}</p>
                                            <h3 className="text-sm font-bold text-white mb-3">{item.topic_name_ta || item.topic_name}</h3>
                                            <div className="mt-auto space-y-1">
                                                <div className="flex items-center justify-between text-xs">
                                                    <span className="text-white/50 font-medium">Score</span>
                                                    <span className="font-bold text-white">{item.score}</span>
                                                </div>
                                                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                                    <div className={`h-full ${c.bar}`} style={{ width: `${Math.min(100, item.score * 10)}%` }} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
}

export default PYQDashboard;
