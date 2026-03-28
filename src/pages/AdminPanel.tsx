import { useState } from "react";
import { motion } from "framer-motion";
import {
    Upload,
    Search,
    Database,
    AlertTriangle,
    CheckCircle2,
    Filter,
    Edit3,
    Trash2,
    FileSearch,
    Zap,
    LayoutGrid,
    Settings as SettingsIcon,
    Plus
} from "lucide-react";
import { Link } from "react-router-dom";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";

const MAPPING_REVIEW = [
    { id: 1, question: "Who was the first speaker of...", subject: "History", year: "2018", confidence: 92, status: "Mapped" },
    { id: 2, question: "Which Article deals with...", subject: "Polity", year: "2024", confidence: 64, status: "Review Required" },
    { id: 3, question: "The mountain range of...", subject: "Geography", year: "2021", confidence: 88, status: "Mapped" },
    { id: 4, question: "What is the unit of...", subject: "Science", year: "2022", confidence: 45, status: "Low Confidence" },
    { id: 5, question: "The budget of 2024...", subject: "Economy", year: "2024", confidence: 98, status: "Mapped" },
];

const AdminPanel = () => {
    return (
        <div className="flex min-h-screen bg-[#0a0a0c] text-white">
            {/* Mini Sidebar */}
            <aside className="w-20 border-r border-white/5 bg-[#0d0d0f] flex flex-col items-center py-8 gap-10 fixed h-full z-50">
                <div className="h-10 w-10 bg-primary/20 rounded-xl flex items-center justify-center border border-primary/30">
                    <Zap className="h-6 w-6 text-primary fill-primary/20" />
                </div>
                <nav className="flex flex-col gap-8">
                    <LayoutGrid className="h-5 w-5 text-white/30 cursor-pointer hover:text-white transition-all" />
                    <Database className="h-5 w-5 text-primary cursor-pointer transition-all" />
                    <SettingsIcon className="h-5 w-5 text-white/30 cursor-pointer hover:text-white transition-all" />
                </nav>
            </aside>

            {/* Admin Content */}
            <main className="ml-20 flex-1 p-10">
                <header className="flex items-center justify-between mb-12">
                    <div>
                        <h1 className="text-3xl font-black uppercase tracking-tighter mb-2">Internal Admin Hub</h1>
                        <p className="text-white/30 font-bold text-xs uppercase tracking-widest">Management & Quality Control for PYQ Engine</p>
                    </div>
                    <div className="flex gap-4">
                        <Button className="bg-primary text-white font-black uppercase tracking-widest text-[10px] h-12 px-8 rounded-2xl flex items-center gap-2 hover:scale-105 transition-all shadow-xl shadow-primary/20">
                            <Plus className="h-4 w-4" /> Add Question
                        </Button>
                    </div>
                </header>

                <section className="grid grid-cols-4 gap-6 mb-12">
                    <Card className="bg-[#121214] border-white/5 p-6 rounded-3xl">
                        <div className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-2">Total Volume</div>
                        <div className="text-3xl font-black mb-1">12,450</div>
                        <div className="text-[10px] font-bold text-emerald-500 uppercase flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" /> 100% Ingested
                        </div>
                    </Card>
                    <Card className="bg-[#121214] border-white/5 p-6 rounded-3xl border-orange-500/20">
                        <div className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-2">Pending Review</div>
                        <div className="text-3xl font-black text-orange-500 mb-1">156</div>
                        <div className="text-[10px] font-bold text-white/20 uppercase tracking-tighter">Requires Manual Map</div>
                    </Card>
                    <Card className="bg-[#121214] border-white/5 p-6 rounded-3xl border-rose-500/20">
                        <div className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-2">Orphans</div>
                        <div className="text-3xl font-black text-rose-500 mb-1">42</div>
                        <div className="text-[10px] font-bold text-white/20 uppercase tracking-tighter">No concept mapping</div>
                    </Card>
                    <Card className="bg-[#121214] border-white/5 p-6 rounded-3xl">
                        <div className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-2">Ingestion Slots</div>
                        <div className="text-3xl font-black mb-1">Unlimited</div>
                        <div className="text-[10px] font-bold text-primary uppercase tracking-tighter">Scale Factor: Auto</div>
                    </Card>
                </section>

                <Tabs defaultValue="review" className="w-full">
                    <TabsList className="bg-transparent h-14 w-full justify-start p-0 mb-8 border-b border-white/5 rounded-none gap-8">
                        <TabsTrigger value="upload" className="bg-transparent border-none p-0 text-sm font-black uppercase tracking-widest text-white/30 data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary h-full rounded-none shadow-none">
                            <Upload className="mr-2 h-4 w-4" /> Bulk Upload
                        </TabsTrigger>
                        <TabsTrigger value="review" className="bg-transparent border-none p-0 text-sm font-black uppercase tracking-widest text-white/30 data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary h-full rounded-none shadow-none">
                            <FileSearch className="mr-2 h-4 w-4" /> Mapping Review
                        </TabsTrigger>
                        <TabsTrigger value="duplicates" className="bg-transparent border-none p-0 text-sm font-black uppercase tracking-widest text-white/30 data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary h-full rounded-none shadow-none">
                            <Trash2 className="mr-2 h-4 w-4" /> Duplicate Detector
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="upload">
                        <Card className="bg-[#121214] border-white/5 p-20 rounded-[3rem] border-dashed border-2 flex flex-col items-center justify-center text-center">
                            <div className="h-24 w-24 bg-primary/10 rounded-full flex items-center justify-center mb-8 border border-white/5">
                                <Upload className="h-10 w-10 text-primary" />
                            </div>
                            <h2 className="text-2xl font-black uppercase tracking-tighter mb-4">Ingest New PYQ Records</h2>
                            <p className="max-w-md text-white/30 font-medium mb-10 leading-relaxed">
                                Drop your CSV or Excel file here. The system will automatically run through the Llama 3.1 Structurer for mapping.
                            </p>
                            <Button className="h-14 px-12 rounded-[2rem] bg-white text-black font-black uppercase tracking-widest hover:bg-white/90">
                                Select File
                            </Button>
                        </Card>
                    </TabsContent>

                    <TabsContent value="review" className="space-y-6">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="relative flex-1">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
                                <Input className="bg-[#121214] border-white/5 h-12 pl-12 rounded-2xl" placeholder="Search by content or year..." />
                            </div>
                            <Button variant="outline" className="border-white/5 h-12 px-6 rounded-2xl bg-[#121214] font-black uppercase tracking-widest text-[11px] flex items-center gap-2">
                                <Filter className="h-4 w-4" /> Filter
                            </Button>
                        </div>

                        <Card className="bg-[#121214] border-white/5 overflow-hidden rounded-3xl">
                            <Table>
                                <TableHeader className="bg-white/[0.02]">
                                    <TableRow className="border-white/5 hover:bg-transparent">
                                        <TableHead className="text-[10px] font-black uppercase tracking-widest text-white/40 pl-8 h-12">Question Segment</TableHead>
                                        <TableHead className="text-[10px] font-black uppercase tracking-widest text-white/40 h-12">Subject</TableHead>
                                        <TableHead className="text-[10px] font-black uppercase tracking-widest text-white/40 h-12">Year</TableHead>
                                        <TableHead className="text-[10px] font-black uppercase tracking-widest text-white/40 h-12">Confidence</TableHead>
                                        <TableHead className="text-[10px] font-black uppercase tracking-widest text-white/40 h-12">Status</TableHead>
                                        <TableHead className="text-[10px] font-black uppercase tracking-widest text-white/40 pr-8 h-12 text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {MAPPING_REVIEW.map((row) => (
                                        <TableRow key={row.id} className="border-white/5 hover:bg-white/[0.02] transition-colors group">
                                            <TableCell className="font-black text-sm pl-8 py-6 tracking-tight max-w-md truncate">{row.question}</TableCell>
                                            <TableCell className="font-bold text-white/40 uppercase text-xs">{row.subject}</TableCell>
                                            <TableCell className="font-bold text-white">{row.year}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <div className={`h-1.5 w-1.5 rounded-full ${row.confidence > 80 ? 'bg-emerald-500' : 'bg-orange-500'}`} />
                                                    <span className="font-black text-xs">{row.confidence}%</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className={`text-[9px] font-black uppercase px-2 h-5 border-white/10 ${row.status === 'Mapped' ? 'text-emerald-500' : 'text-orange-500'
                                                    }`}>
                                                    {row.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="pr-8 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button size="icon" variant="ghost" className="h-9 w-9 border border-white/5 hover:bg-primary/10 hover:text-primary rounded-xl">
                                                        <Edit3 className="h-4 w-4" />
                                                    </Button>
                                                    <Button size="icon" variant="ghost" className="h-9 w-9 border border-white/5 hover:bg-rose-500/10 hover:text-rose-500 rounded-xl">
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </Card>
                    </TabsContent>
                </Tabs>
            </main>
        </div>
    );
};

export default AdminPanel;
