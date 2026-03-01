import { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { translations } from "@/lib/translations";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { Loader2, User, Mail, Calendar, Target, Award } from "lucide-react";

export default function Profile() {
    const { user, language } = useAuth();
    const t = translations[language];
    const [isLoading, setIsLoading] = useState(false);
    const [fullName, setFullName] = useState("");
    const [xp, setXp] = useState(0);
    const [level, setLevel] = useState(1);
    const [availableExams, setAvailableExams] = useState<any[]>([]);
    const [selectedExams, setSelectedExams] = useState<string[]>([]);
    const [totalQuestions, setTotalQuestions] = useState(0);
    const [perfectScores, setPerfectScores] = useState(0);
    const [district, setDistrict] = useState("");

    const TN_DISTRICTS = [
        "Ariyalur", "Chengalpattu", "Chennai", "Coimbatore", "Cuddalore", "Dharmapuri", "Dindigul",
        "Erode", "Kallakurichi", "Kanchipuram", "Kanyakumari", "Karur", "Krishnagiri", "Madurai",
        "Mayiladuthurai", "Nagapattinam", "Namakkal", "Nilgiris", "Perambalur", "Pudukkottai",
        "Ramanathapuram", "Ranipet", "Salem", "Sivaganga", "Tenkasi", "Thanjavur", "Theni",
        "Thoothukudi", "Tiruchirappalli", "Tirunelveli", "Tirupathur", "Tiruppur", "Tiruvallur",
        "Tiruvannamalai", "Tiruvarur", "Vellore", "Viluppuram", "Virudhunagar"
    ].sort();

    useEffect(() => {
        if (user?.user_metadata?.full_name) {
            setFullName(user.user_metadata.full_name);
        }

        const fetchUserData = async () => {
            if (!user) return;
            try {
                // 1. Fetch sessions and exams in parallel
                const [sessionsRes, examsRes] = await Promise.all([
                    supabase.from("quiz_sessions").select("total_questions, score").eq("user_id", user.id),
                    supabase.from("system_exams").select("*").eq("is_active", true).order("name", { ascending: true })
                ]);

                // 2. Try to fetch profile with advanced fields (XP, Target Exams)
                // We do this separately to catch 400 errors (missing columns) gracefully
                const { data: profile, error: profileErr } = await supabase
                    .from("profiles")
                    .select("xp, target_exams, district")
                    .eq("id", user.id)
                    .single();

                if (profile) {
                    const currentXp = profile.xp || 0;
                    setXp(currentXp);
                    setLevel(Math.floor(Math.sqrt(currentXp / 50)) + 1);
                    setSelectedExams(profile.target_exams || []);
                    setDistrict(profile.district || "");
                } else if (profileErr) {
                    // Fallback to basic profile fetch if target_exams is missing from the table
                    const { data: fallback } = await supabase.from("profiles").select("xp, district").eq("id", user.id).single();
                    if (fallback) {
                        setXp(fallback.xp || 0);
                        setLevel(Math.floor(Math.sqrt(fallback.xp / 50)) + 1);
                        setDistrict(fallback.district || "");
                    }
                }

                if (sessionsRes.data) {
                    const total = sessionsRes.data.reduce((acc, s) => acc + (s.total_questions || 0), 0);
                    setTotalQuestions(total);

                    const perfect = sessionsRes.data.filter(s => s.score === s.total_questions && (s.total_questions || 0) > 0).length;
                    setPerfectScores(perfect);
                }

                if (examsRes.data) setAvailableExams(examsRes.data);
            } catch (err) {
                console.error("Profile fetch error:", err);
            }
        };
        fetchUserData();
    }, [user]);

    const handleUpdateProfile = async () => {
        setIsLoading(true);
        try {
            // 1. Update Auth Metadata
            const { error: authError } = await supabase.auth.updateUser({
                data: { full_name: fullName },
            });
            if (authError) throw authError;

            // 2. Update Profiles table
            const { error: profileError } = await supabase
                .from("profiles")
                .update({
                    full_name: fullName,
                    district: district
                })
                .eq("id", user?.id);

            if (profileError) {
                console.error("Error updating profile table:", profileError);
                // We don't necessarily throw here if auth succeeded, but it's good to know
            }

            toast.success("Profile updated successfully!");
        } catch (error: any) {
            toast.error(error.message || "Failed to update profile");
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdatePreferences = async () => {
        setIsLoading(true);
        try {
            const { error } = await supabase
                .from("profiles")
                .update({ target_exams: selectedExams })
                .eq("id", user?.id);
            if (error) throw error;
            toast.success("Exam preferences updated!");
        } catch (error: any) {
            toast.error(error.message || "Update failed");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background">
            <Header />
            <main className="container py-8">
                <div className="mx-auto max-w-4xl">
                    <div className="mb-8 flex items-center gap-6">
                        <Avatar className="h-20 w-20 border-2 border-primary/20">
                            <AvatarImage src={user?.user_metadata?.avatar_url} />
                            <AvatarFallback className="bg-primary/10 text-xl font-bold text-primary">
                                {fullName ? fullName.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <h1 className="text-3xl font-bold text-foreground">{fullName || t.aspirant}</h1>
                            <div className="flex items-center gap-3 mt-1">
                                <p className="text-muted-foreground">{user?.email}</p>
                                <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">
                                    Level {level}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="grid gap-8 md:grid-cols-3">
                        <div className="md:col-span-2 space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>{t.personal_info}</CardTitle>
                                    <CardDescription>Update your personal details below.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="full-name">{t.full_name}</Label>
                                        <div className="relative">
                                            <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                id="full-name"
                                                value={fullName}
                                                onChange={(e) => setFullName(e.target.value)}
                                                className="pl-10"
                                                placeholder="Your full name"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="email">{t.email_address}</Label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                id="email"
                                                value={user?.email}
                                                className="pl-10"
                                                disabled
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="district">Home District (for Local Rankings)</Label>
                                        <select
                                            id="district"
                                            value={district}
                                            onChange={(e) => setDistrict(e.target.value)}
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            <option value="">Select District</option>
                                            {TN_DISTRICTS.map(d => (
                                                <option key={d} value={d}>{d}</option>
                                            ))}
                                        </select>
                                    </div>
                                </CardContent>
                                <CardFooter>
                                    <Button onClick={handleUpdateProfile} disabled={isLoading}>
                                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        {t.save_changes}
                                    </Button>
                                </CardFooter>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>{t.target_exams}</CardTitle>
                                    <CardDescription>Which exams are you preparing for?</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-2 gap-4">
                                        {availableExams.map((exam) => (
                                            <div key={exam.id} className="flex items-center gap-2 rounded-lg border p-3 hover:bg-secondary/20 transition-colors">
                                                <input
                                                    type="checkbox"
                                                    id={exam.id}
                                                    checked={selectedExams.includes(exam.id)}
                                                    onChange={(e) => {
                                                        if (e.target.checked) setSelectedExams(prev => [...prev, exam.id]);
                                                        else setSelectedExams(prev => prev.filter(id => id !== exam.id));
                                                    }}
                                                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                                                />
                                                <label htmlFor={exam.id} className="text-sm font-medium cursor-pointer flex-1">{exam.name}</label>
                                            </div>
                                        ))}
                                        {availableExams.length === 0 && (
                                            <p className="col-span-2 text-sm text-muted-foreground italic">No active exams found.</p>
                                        )}
                                    </div>
                                </CardContent>
                                <CardFooter>
                                    <Button variant="outline" onClick={handleUpdatePreferences} disabled={isLoading}>
                                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Update Preferences
                                    </Button>
                                </CardFooter>
                            </Card>
                        </div>

                        <div className="space-y-6">
                            <Card className="bg-primary/5 border-primary/20">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Award className="h-5 w-5 text-primary" />
                                        {t.achievements}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                                            <Award className="h-5 w-5 text-primary" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold">Elite Aspirant</p>
                                            <p className="text-xs text-muted-foreground">Reached Level {level}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary">
                                            <Target className="h-5 w-5 text-muted-foreground" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold">Precision Striker</p>
                                            <p className="text-xs text-muted-foreground">{perfectScores} Perfect sessions</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/5">
                                            <Calendar className="h-5 w-5 text-primary/40" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold">Syllabus Master</p>
                                            <p className="text-xs text-muted-foreground">{totalQuestions} Questions completed</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>{t.quick_links}</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2 p-0 px-6 pb-6 text-sm">
                                    <a href="/analytics" className="block text-primary hover:underline">{t.analytics}</a>
                                    <a href="/quiz" className="block text-primary hover:underline">{t.daily_quiz}</a>
                                    <a href="/mock-test" className="block text-primary hover:underline">{t.mock_test}</a>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
