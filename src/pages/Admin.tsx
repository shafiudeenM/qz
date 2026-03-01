import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    Plus,
    Search,
    Filter,
    MoreVertical,
    Edit2,
    Trash2,
    Upload,
    Download,
    CheckCircle2,
    AlertCircle,
    Loader2,
    Settings,
    Zap,
    Shield
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/components/AuthProvider";
import { useSettings } from "@/components/SettingsProvider";
import { toast } from "sonner";

import { bulkIngestQuestions } from "@/lib/questions";

const Admin = () => {
    const { user, role, isLoading: authLoading, setProxyUserId, proxyUserId } = useAuth();
    const { settings, updateSettings } = useSettings();
    const navigate = useNavigate();
    const [questions, setQuestions] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [isUploadLoading, setIsUploadLoading] = useState(false);
    const [exams, setExams] = useState<any[]>([]);
    const [isExamModalOpen, setIsExamModalOpen] = useState(false);
    const [editingExam, setEditingExam] = useState<any>(null);
    const [newExam, setNewExam] = useState({
        name: "",
        exam_date: new Date().toISOString(),
        is_active: true
    });
    const [users, setUsers] = useState<any[]>([]);
    const [reports, setReports] = useState<any[]>([]);
    const [isUsersLoading, setIsUsersLoading] = useState(false);

    useEffect(() => {
        if (!authLoading && (!user || role !== "admin")) {
            toast.error("Access denied. Admin privileges required.");
            navigate("/dashboard");
        }
    }, [user, role, authLoading, navigate]);

    useEffect(() => {
        fetchQuestions();
        fetchExams();
        fetchUsers();
        fetchReports();
    }, []);

    const fetchUsers = async () => {
        setIsUsersLoading(true);
        const { data } = await supabase
            .from("profiles")
            .select("*")
            .order("xp", { ascending: false })
            .limit(50);
        if (data) setUsers(data);
        setIsUsersLoading(false);
    };

    const fetchReports = async () => {
        const { data } = await supabase
            .from("reported_questions")
            .select(`
                *,
                final_questions (
                    question_text,
                    topic
                )
            `)
            .order("created_at", { ascending: false });
        if (data) setReports(data);
    };

    const handleResetXP = async (id: string) => {
        if (!confirm("Are you sure you want to reset this user's XP to 0?")) return;
        const { error } = await supabase.from("profiles").update({ xp: 0 }).eq("id", id);
        if (error) toast.error("Reset failed");
        else {
            toast.success("XP reset");
            fetchUsers();
        }
    };

    const fetchExams = async () => {
        const { data } = await supabase
            .from("system_exams")
            .select("*")
            .order("exam_date", { ascending: true });
        if (data) setExams(data);
    };

    const handleSaveExam = async () => {
        try {
            const { error } = await supabase
                .from("system_exams")
                .upsert(editingExam ? { ...newExam, id: editingExam.id } : newExam);

            if (error) throw error;
            toast.success(editingExam ? "Exam updated" : "Exam added");
            setIsExamModalOpen(false);
            setEditingExam(null);
            fetchExams();
        } catch (error) {
            console.error("Save exam error:", error);
            toast.error("Failed to save exam");
        }
    };

    const handleDeleteExam = async (id: string) => {
        if (!confirm("Are you sure?")) return;
        const { error } = await supabase.from("system_exams").delete().eq("id", id);
        if (error) toast.error("Delete failed");
        else fetchExams();
    };

    const fetchQuestions = async () => {
        setIsLoading(true);
        const { data, error } = await supabase
            .from("final_questions")
            .select("*")
            .order("created_at", { ascending: false });

        if (data) setQuestions(data);
        setIsLoading(false);
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to delete this question?")) return;

        const { error } = await supabase
            .from("final_questions")
            .delete()
            .eq("id", id);

        if (error) {
            toast.error("Failed to delete question");
        } else {
            toast.success("Question deleted successfully");
            fetchQuestions();
        }
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsUploadLoading(true);
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const text = e.target?.result as string;
                const lines = text.split("\n");
                const headers = lines[0].split(",").map(h => h.trim());

                const data = lines.slice(1).filter(line => line.trim()).map(line => {
                    const values = line.split(",").map(v => v.trim());
                    const obj: any = {};
                    headers.forEach((header, i) => {
                        if (header === "options" || header === "options_ta" || header === "options_hi") {
                            obj[header] = values[i] ? values[i].split("|") : [];
                        } else if (header === "correct_option_index" || header === "year" || header === "difficulty_level") {
                            obj[header] = parseInt(values[i]);
                        } else {
                            obj[header] = values[i];
                        }
                    });
                    return obj;
                });

                await bulkIngestQuestions(data);
                toast.success(`Successfully uploaded ${data.length} questions`);
                fetchQuestions();
            } catch (error) {
                console.error("Bulk upload error:", error);
                toast.error("Failed to parse or upload CSV. Ensure format is correct.");
            } finally {
                setIsUploadLoading(false);
            }
        };
        reader.readAsText(file);
    };

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingQuestion, setEditingQuestion] = useState<any>(null);
    const [newQuestion, setNewQuestion] = useState({
        question_text: "",
        question_text_ta: "",
        question_text_hi: "",
        options: ["", "", "", ""],
        options_ta: ["", "", "", ""],
        options_hi: ["", "", "", ""],
        correct_option_index: 0,
        topic: "",
        exam: "TNPSC",
        year: new Date().getFullYear(),
        difficulty_level: 2,
        explanation: "",
        explanation_ta: "",
        explanation_hi: ""
    });

    const handleSaveQuestion = async () => {
        try {
            const questionToSave = editingQuestion ? { ...newQuestion, id: editingQuestion.id } : newQuestion;

            const { error } = await supabase
                .from("final_questions")
                .upsert(questionToSave);

            if (error) throw error;

            toast.success(editingQuestion ? "Question updated" : "Question added");
            setIsModalOpen(false);
            setEditingQuestion(null);
            fetchQuestions();
        } catch (error) {
            console.error("Save error:", error);
            toast.error("Failed to save question");
        }
    };

    const filteredQuestions = questions.filter(q =>
        q.question_text?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.topic?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (authLoading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="min-h-screen bg-background">
            <Header />
            <main className="container py-8">
                <Tabs defaultValue="questions" className="space-y-6">
                    <TabsList className="bg-secondary/50 p-1">
                        <TabsTrigger value="questions" className="data-[state=active]:bg-background">Questions</TabsTrigger>
                        <TabsTrigger value="exams" className="data-[state=active]:bg-background">Exams</TabsTrigger>
                        <TabsTrigger value="users" className="data-[state=active]:bg-background">Users</TabsTrigger>
                        <TabsTrigger value="reports" className="data-[state=active]:bg-background flex items-center gap-2">
                            Feedback {reports.length > 0 && <span className="flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] text-white">{reports.length}</span>}
                        </TabsTrigger>
                        <TabsTrigger value="settings" className="data-[state=active]:bg-background font-bold text-primary">
                            <Settings className="mr-2 h-4 w-4" /> Site Settings
                        </TabsTrigger>
                        <TabsTrigger value="god_mode" className="data-[state=active]:bg-background font-black text-destructive flex items-center gap-2">
                            <Shield className="h-4 w-4" /> GOD MODE
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="questions" className="space-y-6">
                        {/* Modal Overlay */}
                        {isModalOpen && (
                            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                                <div className="mx-auto max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-background p-6 shadow-2xl">
                                    <h2 className="mb-6 text-2xl font-bold">{editingQuestion ? "Edit Question" : "Add New Question"}</h2>

                                    <div className="space-y-4">
                                        <div className="grid gap-4 md:grid-cols-2">
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium">Question (EN)</label>
                                                <textarea
                                                    className="w-full rounded-md border p-2 text-sm"
                                                    rows={3}
                                                    value={newQuestion.question_text}
                                                    onChange={(e) => setNewQuestion({ ...newQuestion, question_text: e.target.value })}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium">Question (தமிழ்)</label>
                                                <textarea
                                                    className="w-full rounded-md border p-2 text-sm"
                                                    rows={3}
                                                    value={newQuestion.question_text_ta}
                                                    onChange={(e) => setNewQuestion({ ...newQuestion, question_text_ta: e.target.value })}
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <label className="text-sm font-medium">Options (EN)</label>
                                            {newQuestion.options.map((opt, i) => (
                                                <div key={i} className="flex items-center gap-2">
                                                    <input
                                                        type="radio"
                                                        name="correct"
                                                        checked={newQuestion.correct_option_index === i}
                                                        onChange={() => setNewQuestion({ ...newQuestion, correct_option_index: i })}
                                                    />
                                                    <input
                                                        className="flex-1 rounded-md border p-2 text-sm"
                                                        value={opt}
                                                        onChange={(e) => {
                                                            const updated = [...newQuestion.options];
                                                            updated[i] = e.target.value;
                                                            setNewQuestion({ ...newQuestion, options: updated });
                                                        }}
                                                        placeholder={`Option ${i + 1}`}
                                                    />
                                                </div>
                                            ))}
                                        </div>

                                        <div className="space-y-3">
                                            <label className="text-sm font-medium">Options (தமிழ்)</label>
                                            {newQuestion.options_ta.map((opt, i) => (
                                                <div key={i} className="flex items-center gap-2">
                                                    {/* Radio button for correct option is already handled by EN options */}
                                                    <div className="w-4 h-4" /> {/* Placeholder to align with EN options */}
                                                    <input
                                                        className="flex-1 rounded-md border p-2 text-sm"
                                                        value={opt}
                                                        onChange={(e) => {
                                                            const updated = [...newQuestion.options_ta];
                                                            updated[i] = e.target.value;
                                                            setNewQuestion({ ...newQuestion, options_ta: updated });
                                                        }}
                                                        placeholder={`விருப்பம் ${i + 1}`}
                                                    />
                                                </div>
                                            ))}
                                        </div>

                                        <div className="grid gap-4 md:grid-cols-2">
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium">Explanation (EN)</label>
                                                <textarea
                                                    className="w-full rounded-md border p-2 text-sm"
                                                    rows={3}
                                                    value={newQuestion.explanation}
                                                    onChange={(e) => setNewQuestion({ ...newQuestion, explanation: e.target.value })}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-primary">Explanation (தமிழ்)</label>
                                                <textarea
                                                    className="w-full rounded-md border p-2 text-sm"
                                                    rows={3}
                                                    value={newQuestion.explanation_ta}
                                                    onChange={(e) => setNewQuestion({ ...newQuestion, explanation_ta: e.target.value })}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-orange-600">Question (हिन्दी)</label>
                                                <textarea
                                                    className="w-full rounded-md border p-2 text-sm"
                                                    rows={3}
                                                    value={newQuestion.question_text_hi}
                                                    onChange={(e) => setNewQuestion({ ...newQuestion, question_text_hi: e.target.value })}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-orange-600">Explanation (हिन्दी)</label>
                                                <textarea
                                                    className="w-full rounded-md border p-2 text-sm"
                                                    rows={3}
                                                    value={newQuestion.explanation_hi}
                                                    onChange={(e) => setNewQuestion({ ...newQuestion, explanation_hi: e.target.value })}
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <label className="text-sm font-medium text-orange-600">Options (हिन्दी)</label>
                                            {newQuestion.options_hi.map((opt, i) => (
                                                <div key={i} className="flex items-center gap-2">
                                                    <div className="w-4 h-4" />
                                                    <input
                                                        className="flex-1 rounded-md border p-2 text-sm"
                                                        value={opt}
                                                        onChange={(e) => {
                                                            const updated = [...newQuestion.options_hi];
                                                            updated[i] = e.target.value;
                                                            setNewQuestion({ ...newQuestion, options_hi: updated });
                                                        }}
                                                        placeholder={`विकल्प ${i + 1}`}
                                                    />
                                                </div>
                                            ))}
                                        </div>

                                        <div className="grid gap-4 md:grid-cols-3">
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium">Topic</label>
                                                <input
                                                    className="w-full rounded-md border p-2 text-sm"
                                                    value={newQuestion.topic}
                                                    onChange={(e) => setNewQuestion({ ...newQuestion, topic: e.target.value })}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium">Exam</label>
                                                <input
                                                    className="w-full rounded-md border p-2 text-sm"
                                                    value={newQuestion.exam}
                                                    onChange={(e) => setNewQuestion({ ...newQuestion, exam: e.target.value })}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium">Year</label>
                                                <input
                                                    type="number"
                                                    className="w-full rounded-md border p-2 text-sm"
                                                    value={newQuestion.year}
                                                    onChange={(e) => setNewQuestion({ ...newQuestion, year: parseInt(e.target.value) })}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-8 flex justify-end gap-3">
                                        <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                                        <Button onClick={handleSaveQuestion}>Save Question</Button>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
                            <div>
                                <h1 className="text-3xl font-bold">Content Management</h1>
                                <p className="text-muted-foreground">Manage TNPSC questions and study material</p>
                            </div>
                            <div className="flex gap-2">
                                <input
                                    type="file"
                                    id="csv-upload"
                                    className="hidden"
                                    accept=".csv"
                                    onChange={handleFileUpload}
                                />
                                <Button
                                    variant="outline"
                                    className="gap-2 focus:ring-2 focus:ring-offset-2"
                                    onClick={() => document.getElementById("csv-upload")?.click()}
                                    disabled={isUploadLoading}
                                >
                                    {isUploadLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                                    {isUploadLoading ? "Uploading..." : "Bulk Upload"}
                                </Button>
                                <Button
                                    className="gap-2"
                                    onClick={() => {
                                        setEditingQuestion(null);
                                        setNewQuestion({
                                            question_text: "",
                                            question_text_ta: "",
                                            question_text_hi: "",
                                            options: ["", "", "", ""],
                                            options_ta: ["", "", "", ""],
                                            options_hi: ["", "", "", ""],
                                            correct_option_index: 0,
                                            topic: "",
                                            exam: "TNPSC",
                                            year: new Date().getFullYear(),
                                            difficulty_level: 2,
                                            explanation: "",
                                            explanation_ta: "",
                                            explanation_hi: ""
                                        });
                                        setIsModalOpen(true);
                                    }}
                                >
                                    <Plus className="h-4 w-4" /> Add Question
                                </Button>
                            </div>
                        </div>

                        <div className="mb-6 flex items-center gap-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <input
                                    type="text"
                                    placeholder="Search questions or topics..."
                                    className="w-full rounded-md border border-input bg-background py-2 pl-10 pr-4 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <Button variant="outline" size="icon">
                                <Filter className="h-4 w-4" />
                            </Button>
                        </div>

                        <div className="rounded-md border bg-card">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[400px]">Question</TableHead>
                                        <TableHead>Topic</TableHead>
                                        <TableHead>Exam</TableHead>
                                        <TableHead>Year</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoading ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="h-24 text-center">
                                                <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
                                            </TableCell>
                                        </TableRow>
                                    ) : filteredQuestions.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                                No questions found.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredQuestions.map((q) => (
                                            <TableRow key={q.id}>
                                                <TableCell className="font-medium">
                                                    <div className="line-clamp-2">{q.question_text}</div>
                                                </TableCell>
                                                <TableCell>{q.topic}</TableCell>
                                                <TableCell>{q.exam}</TableCell>
                                                <TableCell>{q.year}</TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8"
                                                            onClick={() => {
                                                                setEditingQuestion(q);
                                                                setNewQuestion({
                                                                    question_text: q.question_text || "",
                                                                    question_text_ta: q.question_text_ta || "",
                                                                    question_text_hi: q.question_text_hi || "",
                                                                    options: q.options || ["", "", "", ""],
                                                                    options_ta: q.options_ta || ["", "", "", ""],
                                                                    options_hi: q.options_hi || ["", "", "", ""],
                                                                    correct_option_index: q.correct_option_index || 0,
                                                                    topic: q.topic || "",
                                                                    exam: q.exam || "TNPSC",
                                                                    year: q.year || new Date().getFullYear(),
                                                                    difficulty_level: q.difficulty_level || 2,
                                                                    explanation: q.explanation || "",
                                                                    explanation_ta: q.explanation_ta || "",
                                                                    explanation_hi: q.explanation_hi || ""
                                                                });
                                                                setIsModalOpen(true);
                                                            }}
                                                        >
                                                            <Edit2 className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                                                            onClick={() => handleDelete(q.id)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </TabsContent>

                    <TabsContent value="exams" className="space-y-6">
                        <div className="flex justify-between items-center">
                            <div>
                                <h1 className="text-3xl font-bold">Exam Management</h1>
                                <p className="text-muted-foreground">Configure global target exam dates</p>
                            </div>
                            <Button onClick={() => {
                                setEditingExam(null);
                                setNewExam({ name: "", exam_date: new Date().toISOString(), is_active: true });
                                setIsExamModalOpen(true);
                            }}>
                                <Plus className="mr-2 h-4 w-4" /> Add Exam
                            </Button>
                        </div>

                        {isExamModalOpen && (
                            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                                <div className="mx-auto w-full max-w-md rounded-xl bg-card p-6 shadow-2xl border">
                                    <h2 className="mb-6 text-xl font-bold">{editingExam ? "Edit Exam" : "New Exam Target"}</h2>
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Exam Name</label>
                                            <Input
                                                value={newExam.name}
                                                onChange={(e) => setNewExam({ ...newExam, name: e.target.value })}
                                                placeholder="e.g. Group 4 / VAO 2024"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Target Date</label>
                                            <Input
                                                type="datetime-local"
                                                value={newExam.exam_date.substring(0, 16)}
                                                onChange={(e) => setNewExam({ ...newExam, exam_date: new Date(e.target.value).toISOString() })}
                                            />
                                        </div>
                                    </div>
                                    <div className="mt-8 flex justify-end gap-3">
                                        <Button variant="ghost" onClick={() => setIsExamModalOpen(false)}>Cancel</Button>
                                        <Button onClick={handleSaveExam}>Save Target</Button>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="rounded-md border bg-card">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Exam Name</TableHead>
                                        <TableHead>Target Date</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {exams.map((exam) => (
                                        <TableRow key={exam.id}>
                                            <TableCell className="font-bold">{exam.name}</TableCell>
                                            <TableCell>{new Date(exam.exam_date).toLocaleDateString()}</TableCell>
                                            <TableCell>
                                                <span className={`px-2 py-1 rounded-full text-xs font-bold ${exam.is_active ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'}`}>
                                                    {exam.is_active ? 'Active' : 'Inactive'}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button variant="ghost" size="icon" onClick={() => {
                                                        setEditingExam(exam);
                                                        setNewExam(exam);
                                                        setIsExamModalOpen(true);
                                                    }}>
                                                        <Edit2 className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDeleteExam(exam.id)}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </TabsContent>

                    <TabsContent value="users" className="space-y-6">
                        <div className="flex justify-between items-center">
                            <div>
                                <h1 className="text-3xl font-bold">User Management</h1>
                                <p className="text-muted-foreground">Monitor aspirant progress and engagement</p>
                            </div>
                        </div>

                        <div className="rounded-md border bg-card">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Aspirant</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>District</TableHead>
                                        <TableHead>XP / Level</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isUsersLoading ? (
                                        <TableRow><TableCell colSpan={5} className="text-center py-10"><Loader2 className="animate-spin mx-auto" /></TableCell></TableRow>
                                    ) : users.map((u) => (
                                        <TableRow key={u.id}>
                                            <TableCell className="font-bold">{u.full_name || "Anonymous"}</TableCell>
                                            <TableCell className="text-muted-foreground text-xs">{u.email || "—"}</TableCell>
                                            <TableCell>{u.district || "—"}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-black text-primary">{u.xp || 0}</span>
                                                    <span className="text-[10px] bg-secondary px-1.5 py-0.5 rounded text-muted-foreground">Lvl {Math.floor(Math.sqrt((u.xp || 0) / 50)) + 1}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button size="sm" variant="ghost" onClick={() => handleResetXP(u.id)} className="text-xs text-destructive hover:bg-destructive/10">Reset XP</Button>
                                                    <Button
                                                        size="sm"
                                                        variant={proxyUserId === u.id ? "destructive" : "outline"}
                                                        onClick={() => setProxyUserId(proxyUserId === u.id ? null : u.id)}
                                                        className="text-xs border-primary/20 hover:bg-primary/5"
                                                    >
                                                        {proxyUserId === u.id ? "Stop Shadow" : "Shadow"}
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </TabsContent>

                    <TabsContent value="reports" className="space-y-6">
                        <div>
                            <h1 className="text-3xl font-bold">Question Reports & Feedback</h1>
                            <p className="text-muted-foreground">Issues flagged by the community</p>
                        </div>

                        <div className="grid gap-4">
                            {reports.length === 0 ? (
                                <div className="text-center py-20 border rounded-xl bg-muted/20">
                                    <CheckCircle2 className="mx-auto h-12 w-12 text-muted-foreground/20 mb-4" />
                                    <p className="font-medium text-muted-foreground">No open reports. Great job!</p>
                                </div>
                            ) : reports.map((r) => (
                                <div key={r.id} className="border rounded-xl p-4 bg-card flex items-start justify-between gap-4">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-black uppercase text-destructive tracking-widest">{r.reason}</span>
                                            <span className="text-[10px] text-muted-foreground">• {new Date(r.created_at).toLocaleDateString()}</span>
                                        </div>
                                        <p className="font-bold text-sm">"{r.final_questions?.question_text}"</p>
                                        <p className="text-xs text-muted-foreground">Details: {r.details || "No details provided"}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button size="sm" variant="outline" className="text-xs">Direct Edit</Button>
                                        <Button size="sm" variant="ghost" className="text-xs text-secondary-foreground">Dismiss</Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </TabsContent>

                    <TabsContent value="settings">
                        <div className="grid gap-8 md:grid-cols-2">
                            <div className="space-y-6 rounded-xl border bg-card p-6 shadow-sm">
                                <h2 className="text-xl font-bold flex items-center gap-2">
                                    <Settings className="h-5 w-5 text-primary" /> Branding & Identity
                                </h2>

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-muted-foreground">Application Name</label>
                                        <Input
                                            value={settings.app_name}
                                            onChange={(e) => updateSettings({ app_name: e.target.value })}
                                            className="font-bold text-lg"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-muted-foreground">Primary Color</label>
                                            <div className="flex gap-2 items-center">
                                                <input
                                                    type="color"
                                                    value={settings.primary_color}
                                                    onChange={(e) => updateSettings({ primary_color: e.target.value })}
                                                    className="h-10 w-10 cursor-pointer rounded-lg border-none"
                                                />
                                                <code className="text-xs">{settings.primary_color}</code>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6 rounded-xl border bg-card p-6 shadow-sm">
                                <h2 className="text-xl font-bold flex items-center gap-2">
                                    <Zap className="h-5 w-5 text-yellow-500" /> Feature Management
                                </h2>

                                <div className="space-y-4">
                                    {Object.keys(settings.feature_names).map((key) => (
                                        <div key={key} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                                            <div className="space-y-1 flex-1">
                                                <div className="flex items-center gap-2">
                                                    <Input
                                                        className="h-8 font-medium border-none p-0 focus-visible:ring-0 w-full"
                                                        value={settings.feature_names[key]}
                                                        onChange={(e) => {
                                                            const names = { ...settings.feature_names, [key]: e.target.value };
                                                            updateSettings({ feature_names: names });
                                                        }}
                                                    />
                                                </div>
                                                <p className="text-xs text-muted-foreground italic">
                                                    ID: {key} {key === 'announcement' && "• This text displays in the app banner"}
                                                </p>
                                            </div>
                                            <Switch
                                                checked={settings.enabled_features.includes(key)}
                                                onCheckedChange={(checked) => {
                                                    const features = checked
                                                        ? [...settings.enabled_features, key]
                                                        : settings.enabled_features.filter(f => f !== key);
                                                    updateSettings({ enabled_features: features });
                                                }}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </TabsContent>
                    <TabsContent value="god_mode" className="space-y-8 animate-in fade-in zoom-in duration-300">
                        <div className="rounded-2xl border-2 border-destructive/20 bg-destructive/5 p-8 shadow-2xl">
                            <div className="mb-8 flex items-center justify-between">
                                <div>
                                    <h1 className="text-4xl font-black uppercase tracking-tighter text-destructive">Absolute Authority</h1>
                                    <p className="text-muted-foreground">Modify reality across the அறிவு engine</p>
                                </div>
                                <Shield className="h-12 w-12 text-destructive" />
                            </div>

                            <div className="grid gap-6 md:grid-cols-2">
                                {/* Maintenance Kill Switch */}
                                <div className="space-y-4 rounded-xl border-2 border-destructive/10 bg-card p-6">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-1">
                                            <h3 className="text-lg font-black uppercase tracking-tight">The Kill Switch</h3>
                                            <p className="text-xs text-muted-foreground">Instantly lock all aspirants out of the platform.</p>
                                        </div>
                                        <Switch
                                            checked={settings.maintenance_mode}
                                            onCheckedChange={(checked) => updateSettings({ maintenance_mode: checked })}
                                            className="data-[state=checked]:bg-destructive"
                                        />
                                    </div>
                                    <div className={`mt-2 rounded-lg p-2 text-center text-[10px] font-bold ${settings.maintenance_mode ? 'bg-destructive/20 text-destructive' : 'bg-muted text-muted-foreground'}`}>
                                        STATUS: {settings.maintenance_mode ? "PLATFORM LOCKED" : "PLATFORM OPERATIONAL"}
                                    </div>
                                </div>

                                {/* XP Overdrive */}
                                <div className="space-y-4 rounded-xl border-2 border-yellow-500/10 bg-card p-6">
                                    <div className="space-y-1">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-lg font-black uppercase tracking-tight">System Overdrive</h3>
                                            <Zap className="h-5 w-5 text-yellow-500" />
                                        </div>
                                        <p className="text-xs text-muted-foreground">Adjust global XP multiplier for all activities.</p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <Input
                                            type="number"
                                            step="0.1"
                                            min="0"
                                            value={settings.xp_multiplier}
                                            onChange={(e) => updateSettings({ xp_multiplier: parseFloat(e.target.value) })}
                                            className="h-10 text-xl font-black"
                                        />
                                        <div className="text-sm font-bold text-yellow-600">X GAIN</div>
                                    </div>
                                </div>
                            </div>

                            {/* Live Pulse Feed Placeholder */}
                            <div className="mt-8 rounded-xl border border-border bg-black/10 p-4">
                                <h3 className="mb-4 text-xs font-black uppercase tracking-widest text-muted-foreground">Live Pulse (Real-time Feed)</h3>
                                <div className="space-y-2 h-40 overflow-y-auto font-mono text-[10px] text-destructive/60 italic">
                                    <p>{"[SECURE_SHELL] God mode session initialized at " + new Date().toISOString()}</p>
                                    <p>{"[SYSTEM] Global multiplier set to " + settings.xp_multiplier}</p>
                                    {settings.maintenance_mode && <p className="text-destructive font-bold animate-pulse">{"[WARNING] PLATFORM LOCKDOWN ACTIVE"}</p>}
                                    <p>{"[PULSE] Waiting for aspirant activity..."}</p>
                                </div>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </main>
        </div>
    );
};

export default Admin;
