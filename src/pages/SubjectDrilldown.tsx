import { useState } from "react";
import { motion } from "framer-motion";
import {
    ArrowLeft,
    Search,
    Filter,
    TrendingUp,
    Target,
    Calendar,
    Clock,
    ArrowRight
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";

const TOPICS = [
    { name: "Preamble & Salient Features", total: 124, probability: "High" },
    { name: "Fundamental Rights", total: 215, probability: "Critical" },
    { name: "Directive Principles", total: 98, probability: "Medium" },
    { name: "Union Executive", total: 156, probability: "High" },
    { name: "State Executive", total: 88, probability: "Medium" },
    { name: "Local Government", total: 112, probability: "High" },
    { name: "Judiciary", total: 76, probability: "Low" },
];

const SUBTOPICS = [
    { name: "Article 32 & Writs", count: 42, lastAsked: "2024", score: 92 },
    { name: "Right to Equality", count: 38, lastAsked: "2022", score: 85 },
    { name: "Freedom of Speech", count: 31, lastAsked: "2024", score: 88 },
    { name: "Cultural Rights", count: 18, lastAsked: "2021", score: 65 },
    { name: "Constitutional Remedies", count: 25, lastAsked: "2023", score: 78 },
];

const TREND_DATA = [
    { year: 2018, count: 12 },
    { year: 2019, count: 15 },
    { year: 2020, count: 8 },
    { year: 2021, count: 18 },
    { year: 2022, count: 22 },
    { year: 2024, count: 25 },
];

const SubjectDrilldown = () => {
    const { subjectName } = useParams();
    const [selectedTopic, setSelectedTopic] = useState(TOPICS[1]);

    return (
        <div className="flex min-h-screen bg-[#0a0a0c] text-white">
            {/* Sidebar - Topics List */}
            <aside className="w-80 border-r border-white/5 bg-[#0d0d0f] flex flex-col fixed h-full z-50 overflow-hidden">
                <div className="p-6 border-b border-white/5">
                    <Link to="/pyq-intelligence" className="flex items-center gap-2 text-white/40 hover:text-white transition-all text-xs font-black uppercase tracking-widest mb-6">
                        <ArrowLeft className="h-4 w-4" /> பின்செல் (Back to Plan)
                    </Link>
                    <h2 className="text-xl font-black uppercase tracking-tighter mb-4">Indian Polity</h2>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/30" />
                        <input
                            className="w-full bg-[#121214] border border-white/5 rounded-xl py-2.5 pl-9 pr-4 text-xs font-bold text-white focus:outline-none focus:border-primary/30 transition-all"
                            placeholder="Search topics..."
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                    {TOPICS.map((topic) => (
                        <button
                            key={topic.name}
                            onClick={() => setSelectedTopic(topic)}
                            className={`w-full text-left p-4 rounded-2xl transition-all border ${selectedTopic.name === topic.name
                                ? 'bg-primary/10 border-primary/20 ring-1 ring-primary/30'
                                : 'border-transparent hover:bg-white/5'
                                }`}
                        >
                            <div className="flex justify-between items-start mb-1">
                                <span className={`text-sm font-black ${selectedTopic.name === topic.name ? 'text-white' : 'text-white/70'}`}>
                                    {topic.name}
                                </span>
                                <Badge className={`text-[9px] font-black uppercase px-2 h-5 ${topic.probability === 'Critical' ? 'bg-rose-500 hover:bg-rose-600' :
                                    topic.probability === 'High' ? 'bg-orange-500 hover:bg-orange-600' :
                                        'bg-white/10 text-white/50'
                                    }`}>
                                    {topic.probability}
                                </Badge>
                            </div>
                            <div className="text-[10px] font-bold text-white/30 uppercase tracking-tighter">
                                {topic.total} Questions Found
                            </div>
                        </button>
                    ))}
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="ml-80 flex-1 p-10 bg-[#0a0a0c]">
                {/* Topic Header & Quick Stats */}
                <header className="mb-10 flex items-end justify-between">
                    <div>
                        <div className="text-xs font-black uppercase tracking-[0.2em] text-primary mb-2">Topic Intelligence</div>
                        <h1 className="text-4xl font-black uppercase tracking-tighter">{selectedTopic.name}</h1>
                    </div>
                    <div className="flex gap-4">
                        <Card className="bg-[#121214] border-white/5 h-20 px-6 flex flex-col justify-center min-w-[140px]">
                            <div className="text-[10px] font-black uppercase text-white/30 tracking-widest mb-1">Recurrence</div>
                            <div className="text-xl font-black">1.2 Years</div>
                        </Card>
                        <Card className="bg-[#121214] border-white/5 h-20 px-6 flex flex-col justify-center min-w-[140px]">
                            <div className="text-[10px] font-black uppercase text-white/30 tracking-widest mb-1">Success Prob</div>
                            <div className="text-xl font-black text-emerald-500">84%</div>
                        </Card>
                    </div>
                </header>

                <div className="grid grid-cols-12 gap-6">
                    {/* Topic Trend Graph */}
                    <Card className="col-span-8 bg-[#121214] border-white/5 p-8 rounded-3xl">
                        <div className="flex items-center justify-between mb-8">
                            <CardTitle className="text-lg font-black uppercase tracking-tighter">Topic Frequency Analysis</CardTitle>
                            <div className="flex items-center gap-2 text-xs font-bold text-white/30">
                                <Calendar className="h-4 w-4" /> Last Asked: 2024 (Group 4)
                            </div>
                        </div>
                        <div className="h-[280px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={TREND_DATA}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                                    <XAxis
                                        dataKey="year"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#ffffff30', fontSize: 10, fontWeight: 700 }}
                                        dy={10}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#ffffff30', fontSize: 10, fontWeight: 700 }}
                                    />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1a1a1c', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px' }}
                                        labelStyle={{ display: 'none' }}
                                    />
                                    <Line
                                        type="stepBefore"
                                        dataKey="count"
                                        stroke="#f59e0b"
                                        strokeWidth={3}
                                        dot={{ fill: '#f59e0b', strokeWidth: 0, r: 4 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>

                    {/* Topic Statistics */}
                    <Card className="col-span-4 bg-[#121214] border-white/5 p-8 rounded-3xl flex flex-col">
                        <CardTitle className="text-lg font-black uppercase tracking-tighter mb-6">Topic Stats</CardTitle>
                        <div className="space-y-6 flex-1">
                            <div className="flex justify-between items-center border-b border-white/5 pb-4">
                                <span className="text-xs font-bold text-white/40 uppercase tracking-widest">Total PYQs</span>
                                <span className="text-xl font-black">215</span>
                            </div>
                            <div className="flex justify-between items-center border-b border-white/5 pb-4">
                                <span className="text-xs font-bold text-white/40 uppercase tracking-widest">First Appearance</span>
                                <span className="text-xl font-black">2008</span>
                            </div>
                            <div className="flex justify-between items-center border-b border-white/5 pb-4">
                                <span className="text-xs font-bold text-white/40 uppercase tracking-widest">Most Frequent Group</span>
                                <span className="text-xl font-black">Group 4</span>
                            </div>
                            <div className="flex justify-between items-center mt-auto">
                                <span className="text-xs font-bold text-white/40 uppercase tracking-widest">Priority Score</span>
                                <span className="text-2xl font-black text-primary">9.4/10</span>
                            </div>
                        </div>
                    </Card>

                    {/* Subtopic Table */}
                    <Card className="col-span-12 bg-[#121214] border-white/5 overflow-hidden rounded-3xl">
                        <div className="p-8 border-b border-white/5 flex items-center justify-between">
                            <CardTitle className="text-lg font-black uppercase tracking-tighter">Micro-Concept Drilldown</CardTitle>
                            <Button variant="outline" className="text-xs font-black uppercase tracking-widest border-white/10 hover:bg-white/5 h-10 px-6">
                                <Filter className="mr-2 h-3.5 w-3.5" /> Sort by Probability
                            </Button>
                        </div>
                        <Table>
                            <TableHeader className="bg-white/[0.02]">
                                <TableRow className="border-white/5 hover:bg-transparent">
                                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-white/40 pl-8 h-12">Subtopic Name</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-white/40 h-12">PYQ Count</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-white/40 h-12">Last Asked</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-white/40 h-12">Prob Score</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-white/40 pr-8 h-12 text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {SUBTOPICS.map((subtopic) => (
                                    <TableRow key={subtopic.name} className="border-white/5 hover:bg-white/[0.02] transition-colors group">
                                        <TableCell className="font-black text-sm pl-8 py-5 tracking-tight">{subtopic.name}</TableCell>
                                        <TableCell className="font-bold text-white/60">{subtopic.count} Questions</TableCell>
                                        <TableCell className="font-bold text-white/60">
                                            <Badge variant="outline" className="border-white/10 text-[10px] font-black px-2">{subtopic.lastAsked}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="w-20 h-1.5 bg-white/5 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-primary"
                                                        style={{ width: `${subtopic.score}%` }}
                                                    />
                                                </div>
                                                <span className="text-xs font-black text-primary">{subtopic.score}%</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="pr-8 text-right">
                                            <Link to={`/concept-detail/${encodeURIComponent(subtopic.name)}`}>
                                                <Button size="sm" className="h-9 px-4 bg-primary text-white font-black uppercase tracking-widest text-[9px] hover:scale-105 transition-all shadow-lg shadow-primary/20">
                                                    View Concept <ArrowRight className="ml-2 h-3 w-3" />
                                                </Button>
                                            </Link>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </Card>
                </div>
            </main>
        </div>
    );
};

export default SubjectDrilldown;
