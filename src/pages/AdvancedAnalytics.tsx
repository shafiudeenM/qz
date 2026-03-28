import { motion } from "framer-motion";
import {
    BarChart2, PieChart as PieIcon, TrendingUp, Download,
    ArrowLeft, Layers, Target
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
    PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
    CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";

const SUBJECT_DIST = [
    { name: "Polity", value: 32 },
    { name: "History", value: 24 },
    { name: "Geography", value: 16 },
    { name: "Economy", value: 18 },
    { name: "Science", value: 10 },
];

const COLORS = ["#f59e0b", "#10b981", "#3b82f6", "#ef4444", "#8b5cf6"];

const TOPIC_TRENDS = [
    { topic: "Local Govt", volume: 45, prob: 92 },
    { topic: "Union Exec", volume: 38, prob: 85 },
    { topic: "Elections", volume: 32, prob: 78 },
    { topic: "Judiciary", volume: 28, prob: 72 },
    { topic: "Preamble", volume: 22, prob: 65 },
];

const HIGH_PROB = [
    { rank: 1, title: "Writs Jurisdiction (Art 32)", score: 98, subject: "Polity" },
    { rank: 2, title: "Buddhist Councils", score: 95, subject: "History" },
    { rank: 3, title: "Five Year Plans", score: 92, subject: "Economy" },
    { rank: 4, title: "Emergency Provisions", score: 88, subject: "Polity" },
    { rank: 5, title: "River Brahamaputra", score: 85, subject: "Geography" },
];

const DECLINING = [
    { title: "Medieval Kingdoms", status: "-42%" },
    { title: "Statutory Bodies", status: "-28%" },
    { title: "Bio-Diversity Park", status: "-32%" },
];

// Custom tooltip for charts — always white text
const ChartTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-[#1a1a1c] border border-white/10 rounded-xl p-3">
            <p className="text-white font-black text-xs uppercase tracking-widest mb-1">{label}</p>
            {payload.map((p: any) => (
                <p key={p.dataKey} className="text-sm font-bold" style={{ color: p.fill || p.stroke || '#fff' }}>
                    {p.name}: {p.value}
                </p>
            ))}
        </div>
    );
};

// Custom legend — always white
const renderLegend = (props: any) => {
    const { payload } = props;
    return (
        <div className="flex flex-wrap justify-center gap-4 mt-4">
            {payload.map((entry: any, i: number) => (
                <div key={i} className="flex items-center gap-1.5">
                    <div className="h-2.5 w-2.5 rounded-full" style={{ background: entry.color }} />
                    <span className="text-xs font-bold text-white/70">{entry.value}</span>
                </div>
            ))}
        </div>
    );
};

const AdvancedAnalytics = () => {
    return (
        <div className="min-h-screen bg-[#0a0a0c] p-10" style={{ fontFamily: "'Inter', sans-serif" }}>
            <div className="max-w-7xl mx-auto">

                {/* ── Header ─────────────────────────────────── */}
                <header className="flex items-center justify-between mb-12">
                    <div className="flex gap-4 items-center">
                        <Link
                            to="/pyq-intelligence"
                            className="h-12 w-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center hover:bg-white/10 transition-all"
                        >
                            <ArrowLeft className="h-5 w-5 text-white/60" />
                        </Link>
                        <div>
                            <h1 className="text-3xl font-black uppercase tracking-tighter text-white mb-1 leading-none">
                                Advanced Pattern Lab
                            </h1>
                            <p className="text-white/40 font-bold text-xs uppercase tracking-widest leading-none">
                                Statistical Deep-Dive &amp; Recurrence Analysis
                            </p>
                        </div>
                    </div>
                    <Button
                        variant="outline"
                        className="bg-[#121214] border-white/10 h-12 px-6 rounded-2xl text-[11px] font-black uppercase tracking-widest text-white hover:text-white hover:bg-white/10"
                    >
                        <Download className="mr-2 h-4 w-4" /> Export (PDF/CSV)
                    </Button>
                </header>

                <div className="grid grid-cols-12 gap-8">

                    {/* ── Subject Distribution Pie ───────────── */}
                    <div className="col-span-12 lg:col-span-5 bg-[#121214] border border-white/5 p-8 rounded-[3rem]">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h2 className="text-lg font-black uppercase tracking-tighter text-white">Subject Distribution</h2>
                                <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mt-1">Historical Volume %</p>
                            </div>
                            <PieIcon className="h-5 w-5 text-primary" />
                        </div>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={SUBJECT_DIST}
                                        cx="50%" cy="43%"
                                        innerRadius={65} outerRadius={90}
                                        paddingAngle={4}
                                        dataKey="value"
                                    >
                                        {SUBJECT_DIST.map((_, i) => (
                                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<ChartTooltip />} />
                                    <Legend content={renderLegend} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* ── Topic Performance Index Bar ────────── */}
                    <div className="col-span-12 lg:col-span-7 bg-[#121214] border border-white/5 p-8 rounded-[3rem]">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h2 className="text-lg font-black uppercase tracking-tighter text-white">Topic Performance Index</h2>
                                <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mt-1">Volume vs Probability Score</p>
                            </div>
                            <TrendingUp className="h-5 w-5 text-emerald-400" />
                        </div>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={TOPIC_TRENDS}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff06" vertical={false} />
                                    <XAxis
                                        dataKey="topic"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#ffffff60', fontSize: 10, fontWeight: 800 }}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#ffffff60', fontSize: 10, fontWeight: 800 }}
                                    />
                                    <Tooltip content={<ChartTooltip />} />
                                    <Bar dataKey="volume" name="Volume" fill="#f59e0b" radius={[6, 6, 0, 0]} barSize={36} />
                                    <Bar dataKey="prob" name="Probability" fill="#ef4444" radius={[6, 6, 0, 0]} barSize={36} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* ── High Probability Concepts List ──────── */}
                    <div className="col-span-12 lg:col-span-8 space-y-4">
                        <p className="text-xs font-black uppercase tracking-[0.2em] text-white/40 pl-2">High Probability Concepts (Ranked)</p>
                        {HIGH_PROB.map((item, i) => (
                            <motion.div
                                key={item.title}
                                initial={{ opacity: 0, x: -12 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.07 }}
                                className="bg-[#121214] border border-white/5 p-5 rounded-2xl flex items-center justify-between hover:border-primary/20 transition-all group"
                            >
                                <div className="flex items-center gap-5">
                                    <span className="h-10 w-10 bg-white/5 rounded-xl border border-white/10 flex items-center justify-center font-black text-primary text-xs flex-shrink-0">
                                        #{item.rank}
                                    </span>
                                    <div>
                                        <h4 className="font-black text-sm uppercase tracking-tight text-white mb-1">{item.title}</h4>
                                        <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{item.subject}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-8">
                                    <div className="text-right">
                                        <div className="text-[10px] font-black uppercase text-white/30 mb-1">Probability</div>
                                        <div className="text-xl font-black text-emerald-400">{item.score}%</div>
                                    </div>
                                    <Link to={`/concept-detail/${encodeURIComponent(item.title)}`}>
                                        <button className="h-10 w-10 border border-white/10 rounded-xl hover:bg-primary/20 hover:border-primary/30 transition-all flex items-center justify-center">
                                            <Target className="h-4 w-4 text-white/50 group-hover:text-primary" />
                                        </button>
                                    </Link>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* ── Declining Momentum ───────────────────── */}
                    <div className="col-span-12 lg:col-span-4 space-y-4">
                        <p className="text-xs font-black uppercase tracking-[0.2em] text-white/40 pl-2">Declining Momentum</p>
                        <div className="bg-[#121214] border border-white/5 border-rose-500/10 p-8 rounded-[3rem]">
                            <div className="flex items-center gap-3 mb-8">
                                <Layers className="h-5 w-5 text-rose-400" />
                                <h3 className="text-lg font-black uppercase tracking-tighter text-white">Low Focus Zone</h3>
                            </div>
                            <div className="space-y-1">
                                {DECLINING.map(dec => (
                                    <div key={dec.title} className="flex justify-between items-center py-4 border-b border-white/5 last:border-0">
                                        <span className="text-sm font-black text-white">{dec.title}</span>
                                        <span className="text-sm font-black text-rose-400">{dec.status}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-8 p-4 rounded-xl bg-primary/5 border border-primary/10 text-[9px] font-black uppercase tracking-widest text-primary text-center">
                                Recommendation: Deprioritize for T-minus 30 days
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default AdvancedAnalytics;
