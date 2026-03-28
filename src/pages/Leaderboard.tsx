import React, { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { TrendingUp, Loader2 } from "lucide-react";
import Header from "@/components/Header";
import { fetchLeaderboard } from "@/lib/questions";
import { useAuth } from "@/components/AuthProvider";
import { useSettings } from "@/components/SettingsProvider";
import { supabase } from "@/lib/supabase";
import { translations } from "@/lib/translations";

export default function LeaderboardPage() {
    const [leaderboard, setLeaderboard] = useState<any[]>([]);
    const [leaderboardMode, setLeaderboardMode] = useState<"global" | "district">("global");
    const [userDistrict, setUserDistrict] = useState<string>("");
    const [isLoading, setIsLoading] = useState(true);

    const { language, user } = useAuth();
    const { settings } = useSettings();
    const t = translations[language];

    useEffect(() => {
        const loadData = async () => {
            try {
                const board = await fetchLeaderboard();
                setLeaderboard(board);

                if (user) {
                    const { data, error } = await supabase.from("profiles").select("district").eq("id", user.id).single();
                    if (!error && data) {
                        setUserDistrict(data.district || "");
                    }
                }
            } catch (err) {
                console.error("Leaderboard fetch error:", err);
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, [user]);

    const displayedLeaderboard = useMemo(() => {
        return leaderboardMode === "district" && userDistrict
            ? leaderboard.filter(u => u.district === userDistrict)
            : leaderboard;
    }, [leaderboard, leaderboardMode, userDistrict]);

    return (
        <div className="min-h-screen bg-background">
            <Header />
            <main className="container py-8 max-w-4xl mx-auto">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                    <h1 className="text-2xl font-bold text-foreground">{settings.feature_names.leaderboard || t.leaderboard || "Leaderboard"}</h1>
                    <p className="text-muted-foreground">See how you rank against other aspirants.</p>
                </motion.div>

                <div className="bg-card rounded-[2.5rem] p-8 border border-border/50 shadow-xl">
                    <h3 className="mb-8 text-xs font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-primary" />
                            Top Aspirants
                        </div>
                        <div className="flex items-center gap-1 bg-secondary/30 p-1 rounded-xl border border-border">
                            <button
                                onClick={() => setLeaderboardMode("global")}
                                className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all ${leaderboardMode === "global" ? "bg-background shadow-sm text-primary" : "text-muted-foreground"}`}
                            >
                                GLOBAL
                            </button>
                            <button
                                onClick={() => setLeaderboardMode("district")}
                                className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all ${leaderboardMode === "district" ? "bg-background shadow-sm text-primary" : "text-muted-foreground"}`}
                                disabled={!userDistrict}
                                title={!userDistrict ? "Set your district in Profile to see local rankings" : ""}
                            >
                                {userDistrict ? userDistrict.toUpperCase() : "DISTRICT"}
                            </button>
                        </div>
                    </h3>

                    {isLoading ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {displayedLeaderboard.length > 0 ? displayedLeaderboard.map((user_row, i) => (
                                <div key={i} className="flex items-center justify-between group">
                                    <div className="flex items-center gap-4">
                                        <span className="text-[10px] font-black text-muted-foreground/30 w-4">{i + 1}</span>
                                        <div className="h-10 w-10 rounded-xl bg-primary/5 border border-primary/10 flex items-center justify-center text-sm font-black text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                                            {user_row.name?.charAt(0) || "?"}
                                        </div>
                                        <span className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">{user_row.name}</span>
                                    </div>
                                    <span className="text-[10px] font-black text-primary bg-primary/10 px-3 py-1.5 rounded-lg border border-primary/20">{user_row.score} XP</span>
                                </div>
                            )) : (
                                <div className="text-center text-muted-foreground py-8">No aspirants found in this category.</div>
                            )}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
