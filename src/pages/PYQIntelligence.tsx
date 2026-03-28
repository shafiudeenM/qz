import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import IntelligenceExplainer from "@/components/IntelligenceExplainer";
import { fetchTopicWeightage, fetchTopicTrends, fetchProbabilityHeatmap } from "@/lib/questions";
import { Target, Zap, TrendingUp, AlertTriangle, Loader2, Play, Database, PieChart as PieChartIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

const COLORS = ['#f59e0b', '#10B981', '#3B82F6', '#EF4444', '#8B5CF6', '#EC4899'];

const getRiskColor = (level: string) => {
    switch (level) {
        case 'CRITICAL': return { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30', bar: 'bg-red-500' };
        case 'HIGH': return { bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500/30', bar: 'bg-orange-500' };
        case 'MEDIUM': return { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/30', bar: 'bg-yellow-500' };
        default: return { bg: 'bg-primary/20', text: 'text-primary', border: 'border-primary/30', bar: 'bg-primary' };
    }
};

const TNPSCSimplePlan = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'simple' | 'advanced'>('simple');
    const [weightage, setWeightage] = useState<any[]>([]);
    const [trends, setTrends] = useState<any[]>([]);
    const [heatmap, setHeatmap] = useState<any[]>([]);
    const [selectedGroup, setSelectedGroup] = useState('G4');

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                const [wData, tData, hData] = await Promise.all([
                    fetchTopicWeightage(selectedGroup),
                    fetchTopicTrends(),
                    fetchProbabilityHeatmap()
                ]);
                setWeightage(wData);
                setTrends(tData);
                setHeatmap(hData);
            } catch (error) {
                console.error("Error loading plan:", error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [selectedGroup]);

    // Simple Plan Tiers
    const tier1 = weightage.slice(0, 5).map(w => ({
        ...w, reason: "கடந்த காலங்களில் அதிகம் கேட்கப்பட்ட பகுதி (Top Priority)"
    }));

    const top5Ids = new Set(tier1.map(t => t.topic_id));
    const tier2 = trends
        .filter(t => (t.trend_status === 'Emerging' || t.trend_status === 'Rising') && !top5Ids.has(t.topic_id))
        .map(t => ({ ...t, reason: "சமீபத்திய தேர்வுகளில் இதன் முக்கியத்துவம் அதிகரித்துள்ளது" }));

    const activeIds = new Set([...tier1.map(t => t.topic_id), ...tier2.map(t => t.topic_id)]);
    const tier3 = weightage.filter(w => !activeIds.has(w.topic_id)).slice(-5)
        .map(w => ({ ...w, reason: "மிக குறைந்த முன்னுரிமை - நேரம் இருந்தால் மட்டும் படிக்கவும்" }));

    const handleStartPractice = (topicId: string, topicNameTa: string) => {
        const focusTopic = encodeURIComponent(topicNameTa || topicId);
        navigate(`/quiz?focus=${focusTopic}`);
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-[#0a0a0c]">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0a0a0c] pb-12 font-inter">
            <Header />

            <main className="container pt-8 max-w-5xl">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative">
                        <div>
                            <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-primary border border-primary/20 mb-3">
                                <Target className="h-3 w-3" /> TNPSC Intelligence
                            </div>
                            <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3 text-glow">
                                <Zap className="h-8 w-8 text-primary" />
                                வெற்றி திட்டம் (Winner's Plan)
                            </h1>
                            <p className="text-white/60 mt-2 max-w-xl font-medium">
                                20 வருட முந்தைய கேள்வித்தாள்களை (PYQ) பகுப்பாய்வு செய்து உருவாக்கப்பட்ட நேரடி பரிந்துரைகள். என்ன படிக்க வேண்டும் என குழம்ப வேண்டாம்.
                            </p>
                        </div>

                        {/* Toggles */}
                        <div className="flex flex-col gap-3 items-end shrink-0">
                            {/* Group Toggle */}
                            <div className="flex bg-[#0d0d0f] p-1 rounded-xl border border-white/10 shadow-sm">
                                {['G1', 'G2', 'G4'].map((group) => (
                                    <button
                                        key={group}
                                        onClick={() => setSelectedGroup(group)}
                                        className={`px-4 py-2 rounded-lg transition-all text-xs font-bold ${selectedGroup === group
                                            ? 'bg-primary/20 text-primary shadow-sm ring-1 ring-primary/30'
                                            : 'text-white/40 hover:text-white hover:bg-white/5'
                                            }`}
                                    >
                                        Group {group.replace('G', '')}
                                    </button>
                                ))}
                            </div>
                            {/* View Mode Toggle */}
                            <div className="flex bg-[#0d0d0f] p-1 rounded-xl border border-white/10">
                                <button
                                    onClick={() => setViewMode('simple')}
                                    className={`px-4 py-2 rounded-lg transition-all text-xs font-bold flex items-center gap-2 ${viewMode === 'simple'
                                        ? 'bg-white/10 text-white shadow-sm'
                                        : 'text-white/40 hover:text-white hover:bg-white/5'
                                        }`}
                                >
                                    <Target className="h-4 w-4" /> Action Plan
                                </button>
                                <button
                                    onClick={() => setViewMode('advanced')}
                                    className={`px-4 py-2 rounded-lg transition-all text-xs font-bold flex items-center gap-2 ${viewMode === 'advanced'
                                        ? 'bg-white/10 text-primary shadow-sm'
                                        : 'text-white/40 hover:text-white hover:bg-white/5'
                                        }`}
                                >
                                    <Database className="h-4 w-4" /> Advanced Data
                                </button>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* AI Audio Explainer */}
                <div className="mb-10">
                    <IntelligenceExplainer weightage={weightage} trends={trends} heatmap={heatmap} />
                </div>

                <AnimatePresence mode="wait">
                    {viewMode === 'simple' ? (
                        <motion.div key="simple" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                            {/* --- Tier 1: Read First --- */}
                            <div className="mb-12">
                                <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                                    <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                                    முதலில் படிக்க வேண்டியவை (Top Priority)
                                </h2>
                                <p className="text-sm text-white/50 mb-4 font-medium">இந்த தலைப்புகளில் இருந்து அதிக கேள்விகள் வர வாய்ப்புள்ளது. இதை முதலில் படித்து முடிக்கவும்.</p>

                                <div className="space-y-3">
                                    {tier1.map((item, i) => (
                                        <div key={i} className="bg-[#0d0d0f] p-5 rounded-2xl border border-emerald-500/20 shadow-sm hover:shadow-[0_0_15px_rgba(16,185,129,0.15)] hover:border-emerald-500/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                            <div>
                                                <h3 className="text-lg font-bold text-white max-w-2xl">{item.topic_name_ta || item.topic_id}</h3>
                                                <p className="text-xs font-medium text-emerald-400 mt-1 flex items-center gap-1.5">
                                                    <Zap className="h-3.5 w-3.5" /> {item.reason}
                                                </p>
                                            </div>
                                            <Button onClick={() => handleStartPractice(item.topic_id, item.topic_name_ta)} className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl h-10 px-6 shrink-0 shadow-[0_0_10px_rgba(16,185,129,0.3)] hover:shadow-[0_0_15px_rgba(16,185,129,0.5)] transition-all">
                                                பயிற்சி தொடங்கு
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* --- Tier 2: Don't Miss --- */}
                            {tier2.length > 0 && (
                                <div className="mb-12">
                                    <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                                        <div className="h-2.5 w-2.5 rounded-full bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.5)]" />
                                        தவறவிடக் கூடாதவை (Rising Importance)
                                    </h2>
                                    <p className="text-sm text-white/50 mb-4 font-medium">சமீபத்திய தேர்வுகளில் இந்த பகுதிகளில் கவனம் செலுத்துகிறார்கள்.</p>

                                    <div className="grid sm:grid-cols-2 gap-4">
                                        {tier2.slice(0, 4).map((item, i) => (
                                            <div key={i} className="bg-[#0d0d0f] p-5 rounded-2xl border border-orange-500/20 shadow-sm hover:border-orange-500/40 transition-all flex flex-col hover:shadow-[0_0_15px_rgba(249,115,22,0.1)]">
                                                <h3 className="text-base font-bold text-white mb-1">{item.topic_name_ta || item.topic_id}</h3>
                                                <p className="text-[11px] font-medium text-orange-400 mb-4 flex items-center gap-1.5 flex-1 line-clamp-2">
                                                    <TrendingUp className="h-3.5 w-3.5 shrink-0" /> {item.reason}
                                                </p>
                                                <Button variant="outline" size="sm" onClick={() => handleStartPractice(item.topic_id, item.topic_name_ta)} className="w-full font-bold border-orange-500/30 text-orange-400 hover:bg-orange-500/10 hover:border-orange-500/50 rounded-xl bg-transparent transition-all">
                                                    <Play className="h-3.5 w-3.5 mr-2 -ml-1" /> பயிற்சி செய்
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* --- Tier 3: Read Last --- */}
                            <div className="mb-8">
                                <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                                    <div className="h-2.5 w-2.5 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
                                    நேரம் இருந்தால் மட்டும் (Low Priority)
                                </h2>
                                <p className="text-sm text-white/50 mb-4 font-medium">இந்த தலைப்புகளில் கேள்விகள் மிகக்குறைவாகவே வரும். உங்கள் நேரத்தை வீணாக்காமல் கடைசியாக படிக்கவும்.</p>

                                <div className="bg-[#0d0d0f] p-6 rounded-2xl border border-red-500/10 shadow-sm hover:border-red-500/20 transition-all">
                                    <div className="flex flex-wrap gap-2">
                                        {tier3.map((item, i) => (
                                            <div key={i} className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs font-medium text-white/70 flex items-center gap-1.5 hover:bg-white/10 transition-colors">
                                                <AlertTriangle className="h-3.5 w-3.5 text-white/30" />
                                                {item.topic_name_ta || item.topic_id}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div key="advanced" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                            {/* Advanced Data View (Dark Theme) */}
                            <div className="grid gap-6 lg:grid-cols-7 mb-8">
                                {/* Weightage Chart */}
                                <div className="lg:col-span-4 bg-[#0d0d0f] shadow-sm border border-white/10 rounded-3xl p-6">
                                    <div className="mb-6">
                                        <h3 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                                            <PieChartIcon className="h-5 w-5 text-primary" /> Topic Weightage ({selectedGroup})
                                        </h3>
                                        <p className="text-sm font-medium text-white/50 mt-1">Percentage distribution of questions by topic</p>
                                    </div>
                                    <div className="h-[300px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={weightage.slice(0, 8)}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
                                                <XAxis dataKey="topic_name_ta" axisLine={false} tickLine={false} fontSize={10} stroke="#64748B" interval={0} />
                                                <YAxis axisLine={false} tickLine={false} fontSize={11} unit="%" stroke="#64748B" />
                                                <Tooltip
                                                    contentStyle={{ backgroundColor: '#0d0d0f', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.5)' }}
                                                    labelStyle={{ fontWeight: '800', marginBottom: '4px', color: '#ffffff' }}
                                                    itemStyle={{ color: '#f59e0b', fontWeight: 'bold' }}
                                                />
                                                <Bar dataKey="percentage" radius={[4, 4, 0, 0]} barSize={40}>
                                                    {weightage.map((_, index) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                {/* Heatmap */}
                                <div className="lg:col-span-3 bg-[#0d0d0f] shadow-sm border border-white/10 rounded-3xl p-6">
                                    <div className="mb-6 flex justify-between items-start">
                                        <div>
                                            <h3 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                                                <Target className="h-5 w-5 text-primary" /> Probability Heatmap
                                            </h3>
                                            <p className="text-sm font-medium text-white/50 mt-1">High-yield targeting</p>
                                        </div>
                                    </div>
                                    <div className="space-y-3 overflow-y-auto pr-2" style={{ maxHeight: '300px' }}>
                                        {heatmap.map((item, idx) => {
                                            const c = getRiskColor(item.probability_level);
                                            return (
                                                <div key={idx} className={`p-4 rounded-xl border ${c.border} bg-white/5 flex justify-between items-center transition-all hover:bg-white/10`}>
                                                    <div className="max-w-[70%]">
                                                        <p className="text-sm font-bold text-white truncate">{item.topic_name_ta || item.topic_id}</p>
                                                        <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest mt-0.5">{item.topic_name}</p>
                                                    </div>
                                                    <div className={`px-2.5 py-1 rounded-lg text-[10px] uppercase tracking-wider bg-black/50 border ${c.border} ${c.text}`}>
                                                        {item.probability_level}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
};

export default TNPSCSimplePlan;
