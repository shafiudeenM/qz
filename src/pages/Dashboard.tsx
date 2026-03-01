import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Zap, Brain, BookOpen, TrendingUp, Calendar, Loader2, Sparkles, Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import Header from "@/components/Header";
import StatsCard from "@/components/StatsCard";
import TopicBadge from "@/components/TopicBadge";
import ProgressRing from "@/components/ProgressRing";
import { Button } from "@/components/ui/button";
import { type TopicScore } from "@/data/sampleQuestions";
import { fetchUserSessions, calculateStreak, fetchLeaderboard } from "@/lib/questions";
import { useSettings } from "@/components/SettingsProvider";
import { useAuth } from "@/components/AuthProvider";
import { translations } from "@/lib/translations";
import { supabase } from "@/lib/supabase";
import { calculateTopicMastery, TopicMasteryStats } from "@/lib/mastery";
import { generateDailyStudyPlan, StudyPlanItem } from "@/lib/StudyPlanGenerator";
import { getTopicDisplayName } from "@/lib/topicDescriptor";

const getTimeGreeting = (t: any) => {
  const hour = new Date().getHours();
  if (hour < 12) return t.good_morning;
  if (hour < 17) return t.good_afternoon;
  if (hour < 21) return t.good_evening;
  return t.good_night;
};

// Leveling logic: Lvl 1: 0-100, Lvl 2: 101-300, Lvl 3: 301-600, etc. (Triangular numbers)
const getLevelFromXP = (xp: number) => {
  let level = 1;
  while (xp >= level * 50 * level) {
    level++;
  }
  return level;
};

const getXPToNextLevel = (xp: number) => {
  const currentLevel = getLevelFromXP(xp);
  const nextLevelThreshold = currentLevel * 50 * currentLevel;
  return nextLevelThreshold - xp;
};

const Dashboard = () => {
  const [sessions, setSessions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    accuracy: 0,
    totalQuestions: 0,
    mockTests: 0,
    streak: 0,
    xp: 0,
    level: 1,
    xpToNext: 50,
    dailyQuestions: 0,
    percentile: 0,
    readiness: 0,
    focusTopic: "General"
  });

  const [topicScores, setTopicScores] = useState<TopicScore[]>([]);
  const [masteryData, setMasteryData] = useState<TopicMasteryStats[]>([]);
  const [studyPlan, setStudyPlan] = useState<StudyPlanItem[]>([]);
  const [reviewCount, setReviewCount] = useState(0);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [userExams, setUserExams] = useState<any[]>([]);
  const [userDistrict, setUserDistrict] = useState<string>("");
  const [leaderboardMode, setLeaderboardMode] = useState<"global" | "district">("global");
  const { settings } = useSettings();
  const { language, user } = useAuth();
  const t = translations[language];

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        // Parallelize all initial fetches for "Instant Load" feel
        const [history, streakCount, board, allExamsResponse] = await Promise.all([
          fetchUserSessions(50),
          calculateStreak(),
          fetchLeaderboard(),
          supabase.from("system_exams").select("*").eq("is_active", true)
        ]);

        // Separate profile fetch for defensive handling of potential 400s (missing columns)
        let profileData = null;
        if (user) {
          const { data, error } = await supabase.from("profiles").select("xp, target_exams, district").eq("id", user.id).single();
          if (!error) {
            profileData = data;
            setUserDistrict(data.district || "");
          }
        }

        setSessions(history);
        setLeaderboard(board);

        const now = new Date();
        const localTodayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        const dailyQCount = history.filter(s => {
          if (!s.created_at) return false;
          const sDate = new Date(s.created_at);
          const sLocalToday = `${sDate.getFullYear()}-${String(sDate.getMonth() + 1).padStart(2, '0')}-${String(sDate.getDate()).padStart(2, '0')}`;
          return sLocalToday === localTodayStr;
        }).reduce((acc, s) => acc + (s.total_questions || 0), 0);

        let avgAccuracy = 0;
        let totalQ = 0;
        let mocks = 0;
        let masteryStats: TopicMasteryStats[] = [];
        let avgReadiness = 0;
        let lowestTopic = "General";
        let percentile = 0;

        if (history.length > 0) {
          totalQ = history.reduce((acc, s) => acc + (s.total_questions || 0), 0);
          const totalCorrect = history.reduce((acc, s) => acc + (s.score || 0), 0);
          avgAccuracy = Math.round((totalCorrect / totalQ) * 100) || 0;
          mocks = history.filter(s => s.quiz_title === "Mock Test").length;

          const availableTopics = Array.from(new Set(history.map(s => s.subject || "General")));
          masteryStats = availableTopics.map(topic => calculateTopicMastery(history, topic));
          setMasteryData(masteryStats);
          setStudyPlan(generateDailyStudyPlan(masteryStats));

          // State will be consolidated after all calculations

          const scores: TopicScore[] = masteryStats.map(m => ({
            topic: getTopicDisplayName(m.topic),
            accuracy: m.masteryScore,
            totalQuestions: history.filter(s => s.subject === m.topic || s.topic === m.topic).reduce((acc, s) => acc + (s.total_questions || 0), 0),
            correctAnswers: history.filter(s => s.subject === m.topic || s.topic === m.topic).reduce((acc, s) => acc + (s.score || 0), 0),
            trend: m.readiness > 70 ? "improving" : "stable",
            priority: m.priority.toLowerCase() as any
          }));
          setTopicScores(scores.sort((a, b) => a.accuracy - b.accuracy));

          avgReadiness = masteryStats.length > 0
            ? Math.round(masteryStats.reduce((acc, m) => acc + m.masteryScore, 0) / masteryStats.length)
            : 0;

          const lowestStat = masteryStats.reduce((prev, curr) => (prev.masteryScore < curr.masteryScore ? prev : curr));
          lowestTopic = getTopicDisplayName(lowestStat.topic);

          // 3. Calculate Percentile
          const { count: totalUsers } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
          const currentXP = profileData?.xp || 0;
          const { count: countBelow } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).lt('xp', currentXP);

          percentile = totalUsers && totalUsers > 1
            ? Math.min(99, Math.round(((countBelow || 0) / (totalUsers - 1)) * 100))
            : 0;

          // State will be consolidated after all calculations
        } else {
          setStudyPlan(generateDailyStudyPlan([]));
          setStats(prev => ({ ...prev, streak: streakCount }));
        }

        // Fetch review count separately if needed (count only)
        const { count } = await supabase
          .from("user_question_stats")
          .select("*", { count: 'exact', head: true })
          .lte("next_review", new Date().toISOString());

        setReviewCount(count || 0);

        // Update stats once with all consolidated values
        setStats({
          accuracy: avgAccuracy,
          totalQuestions: totalQ,
          mockTests: mocks,
          streak: streakCount,
          xp: profileData?.xp || 0,
          level: getLevelFromXP(profileData?.xp || 0),
          xpToNext: getXPToNextLevel(profileData?.xp || 0),
          dailyQuestions: dailyQCount,
          percentile: percentile,
          readiness: avgReadiness,
          focusTopic: lowestTopic
        });

        // 7. Update exams separately as it has its own state
        if (allExamsResponse.data && profileData?.target_exams) {
          const preferred = allExamsResponse.data.filter((e: any) =>
            profileData.target_exams.includes(e.id)
          );
          setUserExams(preferred);
        }
      } catch (error) {
        console.error("Error loading dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadDashboardData();
  }, [user]);

  const [resetTimer, setResetTimer] = useState("");

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
      const tomorrow = new Date();
      tomorrow.setHours(24, 0, 0, 0);
      const diff = tomorrow.getTime() - now.getTime();
      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      setResetTimer(`${h}h ${m}m`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-background pb-12">
      <Header />
      <main className="container pb-20 pt-8">
        {/* Welcome Section */}
        <section className="relative mb-12 overflow-hidden rounded-[3rem] bg-foreground p-12 text-background shadow-2xl">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="relative z-10"
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              <span className="text-xs font-black uppercase tracking-[0.3em] text-primary/80">Mission Active</span>
            </div>
            <h1 className="max-w-2xl text-5xl font-black leading-tight tracking-tighter md:text-7xl">
              {getTimeGreeting(t)}, <br />
              <span className="bg-gradient-to-r from-primary to-primary-foreground bg-clip-text text-transparent">
                Professional.
              </span>
            </h1>
            <p className="mt-6 text-xl text-muted-foreground/80 font-medium">
              You are ahead of <span className="text-primary font-bold">{stats.percentile}%</span> of aspirants. <br />
              Maintain your <span className="font-bold underline decoration-primary/30 decoration-4 underline-offset-4">consistency</span>.
            </p>

            {/* Level Progress Bar */}
            <div className="mt-10 max-w-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-primary">Mastery Level {stats.level}</span>
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{stats.xp} XP (Next: {stats.xpToNext} XP)</span>
              </div>
              <div className="h-2 w-full bg-primary/10 rounded-full overflow-hidden border border-primary/10">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min((stats.xp / (stats.xp + stats.xpToNext)) * 100, 100)}%` }}
                  className="h-full bg-primary shadow-[0_0_10px_rgba(var(--primary),0.5)]"
                />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute right-12 top-12 hidden md:block"
          >
            <div className="flex flex-col gap-4">
              {userExams.length > 0 ? (
                <div className="flex flex-col gap-4">
                  {userExams.slice(0, 2).map((exam, idx) => {
                    const days = Math.ceil((new Date(exam.exam_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                    const isUrgent = days < 30;

                    return (
                      <motion.div
                        key={exam.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        whileHover={{ scale: 1.05, x: -5 }}
                        className={`relative group overflow-hidden rounded-[2rem] p-5 shadow-2xl transition-all duration-300 border ${idx === 0
                          ? "bg-slate-900/90 border-primary/40"
                          : "bg-slate-900/70 border-white/10"
                          }`}
                      >
                        <div className="relative z-10 flex items-center justify-between gap-6">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1.5">
                              <div className={`h-1.5 w-1.5 rounded-full ${isUrgent ? "bg-red-400 animate-pulse" : "bg-primary"}`} />
                              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
                                {isUrgent ? "⚠ Critical" : "Active Target"}
                              </span>
                            </div>
                            <h4 className="text-sm font-bold text-white max-w-[130px] leading-snug">
                              {exam.name}
                            </h4>
                          </div>

                          <div className="flex flex-col items-end shrink-0">
                            <div className="flex items-baseline gap-0.5">
                              <span className="text-4xl font-black text-white tracking-tighter tabular-nums">
                                {days}
                              </span>
                              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-0.5">d</span>
                            </div>
                            <div className="mt-1.5 h-1 w-14 bg-white/10 rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: "65%" }}
                                className={`h-full ${isUrgent ? "bg-red-400" : "bg-primary"}`}
                              />
                            </div>
                          </div>
                        </div>
                        <div className="absolute -right-4 -bottom-4 h-16 w-16 rounded-full blur-2xl opacity-30 group-hover:opacity-60 transition-opacity bg-primary" />
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="glass-card flex flex-col items-center rounded-[2.5rem] bg-white/5 p-8 backdrop-blur-2xl border-white/10 shadow-2xl relative overflow-hidden group"
                >
                  <div className="relative z-10 flex flex-col items-center">
                    <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 group-hover:rotate-12 transition-transform">
                      <Calendar className="h-6 w-6 text-primary" />
                    </div>
                    <span className="text-[10px] uppercase font-black tracking-widest text-muted-foreground mb-1">Target Mission</span>
                    <span className="text-4xl font-black text-primary/40 tabular-nums">--</span>
                    <Link to="/profile" className="mt-4 flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-[10px] font-black uppercase tracking-widest text-primary-foreground hover:scale-105 active:scale-95 transition-all">
                      Set Target
                    </Link>
                  </div>
                  <div className="absolute -right-10 -bottom-10 h-32 w-32 bg-primary/5 rounded-full blur-3xl" />
                </motion.div>
              )}
            </div>
          </motion.div>

          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/20 blur-[100px] opacity-50" />
          <div className="absolute -bottom-20 left-20 h-48 w-48 rounded-full bg-primary/10 blur-[80px] opacity-30" />
        </section>

        {/* Today's Mission Center */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-primary" />
              Today's Mission
            </h2>
            <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-widest bg-secondary/30 px-3 py-1.5 rounded-lg border">
              <Clock className="h-3 w-3" />
              Reset in {resetTimer}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 glass-card rounded-[2.5rem] p-8 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent relative overflow-hidden group">
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-lg font-bold text-foreground mb-1">Daily Question Goal</h3>
                    <p className="text-sm text-muted-foreground">Complete 20 practice questions to maintain your rank.</p>
                  </div>
                  <div className="text-right">
                    <span className="text-3xl font-black text-primary">{Math.min(stats.dailyQuestions, 20)}/20</span>
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Target Today</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="h-4 w-full bg-secondary rotate-1 rounded-full overflow-hidden border shadow-inner">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min((stats.dailyQuestions / 20) * 100, 100)}%` }}
                      className="h-full bg-gradient-to-r from-primary to-primary-foreground relative"
                    >
                      <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.2)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.2)_50%,rgba(255,255,255,0.2)_75%,transparent_75%,transparent)] bg-[length:20px_20px] animate-[pulse_2s_linear_infinite]" />
                    </motion.div>
                  </div>

                  <div className="flex flex-wrap gap-4 pt-4">
                    <Link to="/quiz" className="flex-1 min-w-[200px]">
                      <Button className="w-full h-14 text-lg font-black uppercase tracking-widest bg-primary text-primary-foreground hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-primary/20 rounded-2xl group">
                        <Zap className="mr-2 h-5 w-5 fill-current group-hover:animate-pulse" />
                        Execute Mission
                      </Button>
                    </Link>
                    <Link to="/exam-arena">
                      <Button variant="outline" className="h-14 px-8 border-primary/20 text-foreground rounded-2xl font-bold hover:bg-primary/5">
                        <Brain className="mr-2 h-5 w-5" />
                        Full Mock
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
              <div className="absolute -right-10 -bottom-10 h-40 w-40 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors" />
            </div>

            <div className="space-y-4">
              <div className="glass-card rounded-3xl p-6 border-info/20 hover-glow group transition-all">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-info/10 flex items-center justify-center text-info group-hover:scale-110 transition-transform">
                    <TrendingUp className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black uppercase tracking-widest text-foreground">Next Milestone</h4>
                    <p className="text-xs text-muted-foreground">
                      {stats.streak < 7 ? `${7 - stats.streak} more days for Weekly Streak` : "Weekly Streak Achieved!"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="glass-card rounded-3xl p-6 border-success/20 hover-glow group transition-all">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-success/10 flex items-center justify-center text-success group-hover:scale-110 transition-transform">
                    <BookOpen className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black uppercase tracking-widest text-foreground">Review Due</h4>
                    <p className="text-xs text-muted-foreground">{reviewCount} questions pending</p>
                  </div>
                </div>
              </div>

              <Link to="/custom-test" className="block">
                <div className="glass-card rounded-3xl p-6 border-primary/10 hover:border-primary/40 group transition-all cursor-pointer bg-primary/5">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:rotate-12 transition-transform">
                      <Sparkles className="h-6 w-6" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black uppercase tracking-widest text-foreground">Custom Mission</h4>
                      <p className="text-xs text-muted-foreground">Build specific training</p>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </section>

        {/* Stats Grid */}
        <div className="mb-8 grid gap-4 md:grid-cols-5">
          {isLoading ? (
            Array(5).fill(0).map((_, i) => (
              <div key={i} className="glass-card rounded-2xl p-6">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-16 mb-1" />
                <Skeleton className="h-3 w-32" />
              </div>
            ))
          ) : (
            <>
              <StatsCard
                label={t.overall_accuracy}
                value={`${stats.accuracy}%`}
                subtitle={`Overall Performance`}
                icon={<TrendingUp className="h-5 w-5" />}
                trend={stats.accuracy > 70 ? "up" : "stable"}
              />
              <StatsCard
                label={t.questions_attempted}
                value={stats.totalQuestions}
                subtitle={`Questions Executed`}
                icon={<Zap className="h-5 w-5" />}
              />
              <StatsCard
                label={t.mock_tests_taken}
                value={stats.mockTests}
                subtitle={`Full Length Tests`}
                icon={<Brain className="h-5 w-5" />}
              />
              <StatsCard
                label={t.current_streak}
                value={stats.streak}
                subtitle={`🔥 ${t.day_streak}`}
                icon={<Calendar className="h-5 w-5" />}
                trend="up"
              />
              <StatsCard
                label="Aspirant Level"
                value={`Lvl ${stats.level}`}
                subtitle={`${stats.xp} Total XP`}
                icon={<Sparkles className="h-5 w-5 text-yellow-500" />}
                trend="up"
              />
            </>
          )}
        </div>

        {/* Main Content: Mastery & Community */}
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <section className="mb-12">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
                    <Brain className="h-6 w-6 text-primary" />
                    Mastery Map
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">Syllabus coverage and proficiency tracking</p>
                </div>
                <div className="hidden md:flex items-center gap-4 bg-secondary/20 p-2 rounded-2xl border">
                  <div className="flex items-center gap-2 px-3 py-1 bg-background rounded-xl border shadow-sm">
                    <div className="h-2 w-2 rounded-full bg-success" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Mastered</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1">
                    <div className="h-2 w-2 rounded-full bg-warning" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Growing</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1">
                    <div className="h-2 w-2 rounded-full bg-destructive" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Critical</span>
                  </div>
                </div>
              </div>

              <div className="max-h-[600px] overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-primary/10 hover:scrollbar-thumb-primary/20 transition-colors">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {isLoading ? (
                    Array(6).fill(0).map((_, i) => (
                      <Skeleton key={i} className="h-32 rounded-[2rem]" />
                    ))
                  ) : masteryData.length > 0 ? (
                    masteryData.map((topic) => (
                      <TopicBadge
                        key={topic.topic}
                        topic={topic.topic}
                        accuracy={topic.masteryScore}
                        priority={(topic.priority || "Low").toLowerCase() as any}
                        trend={topic.masteryScore > 70 ? "improving" : topic.masteryScore < 40 ? "declining" : "stable"}
                      />
                    ))
                  ) : (
                    <div className="col-span-full py-20 text-center glass-card rounded-[3rem] border-dashed border-2">
                      <div className="mx-auto w-20 h-20 rounded-full bg-secondary/50 flex items-center justify-center mb-6">
                        <BookOpen className="h-10 w-10 text-muted-foreground/40" />
                      </div>
                      <h3 className="text-xl font-bold text-foreground">No Mastery Data Yet</h3>
                      <p className="text-muted-foreground mt-2 max-w-xs mx-auto">Complete your first practice session to generate your syllabus mastery map.</p>
                      <Link to="/quiz">
                        <Button className="mt-8 rounded-2xl font-black uppercase tracking-widest px-8">Start Now</Button>
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </section>
          </div>

          <div className="space-y-6">
            <div className="glass-card rounded-[2.5rem] p-8 border-primary/10">
              <h3 className="mb-6 text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">{t.overall_readiness}</h3>
              <div className="flex justify-center mb-8">
                <ProgressRing value={stats.readiness || 0} label={t.aspirant} />
              </div>
              <div className="space-y-2 rounded-2xl bg-primary/5 p-6 border border-primary/10">
                <p className="text-center text-xs font-medium leading-relaxed text-muted-foreground">
                  Current exam readiness is <span className="text-primary font-bold text-sm">{stats.readiness}%</span>. <br />
                  Focus on <span className="font-bold text-destructive underline underline-offset-2">{stats.focusTopic}</span> to reach 75%.
                </p>
              </div>
            </div>

            {settings.enabled_features.includes("leaderboard") && (
              <div className="glass-card rounded-[2.5rem] p-8 border-primary/10">
                <h3 className="mb-8 text-xs font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    {settings.feature_names.leaderboard || t.leaderboard}
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
                <div className="space-y-6">
                  {leaderboard.map((user_row, i) => (
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
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
