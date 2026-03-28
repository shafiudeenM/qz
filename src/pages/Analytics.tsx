import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Header from "@/components/Header";
import ProgressRing from "@/components/ProgressRing";
import { type TopicScore } from "@/data/sampleQuestions";
import { TrendingUp, TrendingDown, Minus, Loader2, Clock, ChevronDown, ChevronUp } from "lucide-react";
import { fetchUserSessions } from "@/lib/questions";
import { useAuth } from "@/components/AuthProvider";
import { translations } from "@/lib/translations";
import { calculateTopicMastery } from "@/lib/mastery";

const Analytics = () => {
  const [sessions, setSessions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [topicScores, setTopicScores] = useState<TopicScore[]>([]);
  const [mockTests, setMockTests] = useState<any[]>([]);
  const [overallTrend, setOverallTrend] = useState<{ message: string, color: string, icon: any } | null>(null);
  const [showAllDetailed, setShowAllDetailed] = useState(false);
  const [showAllMocks, setShowAllMocks] = useState(false);
  const [showAllHeatmap, setShowAllHeatmap] = useState(false);
  const { language } = useAuth();
  const t = translations[language];

  useEffect(() => {
    const loadAnalyticsData = async () => {
      try {
        const history = await fetchUserSessions(100);
        setSessions(history);

        if (history.length > 0) {
          // Process Advanced Topic Mastery
          const availableTopics = Array.from(new Set(history.map(s => s.subject || "General")));
          const masteryStats = availableTopics.map(topic => calculateTopicMastery(history, topic));

          const scores: TopicScore[] = masteryStats.map(m => {
            const topicSessions = history.filter(s => s.subject === m.topic || s.topic === m.topic);
            const totalTime = topicSessions.reduce((acc, s) => acc + (s.average_response_time || 0), 0);
            const avgSpeed = topicSessions.length > 0 ? totalTime / topicSessions.length : 0;

            return {
              topic: m.topic,
              accuracy: m.masteryScore,
              totalQuestions: topicSessions.reduce((acc, s) => acc + (s.total_questions || 0), 0),
              correctAnswers: topicSessions.reduce((acc, s) => acc + (s.score || 0), 0),
              trend: m.readiness > 70 ? "improving" : "stable",
              priority: m.priority.toLowerCase() as any,
              avgSpeed: Math.round(avgSpeed / 1000) // Convert to seconds
            };
          });
          setTopicScores(scores.sort((a, b) => a.accuracy - b.accuracy));

          // Process Mock Test History
          const exams = history
            .filter(s => s.quiz_title === "Mock Test" || s.quiz_title === "Full Exam" || s.quiz_title.includes("Group") || s.quiz_title.includes("Syllabus") || s.total_questions >= 20)
            .map(s => ({
              date: new Date(s.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
              score: Math.round(s.score),
              total: s.total_questions,
              title: s.quiz_title
            }));
          setMockTests(exams);

          // 📈 Calculate Overall Trend
          if (history.length >= 2) {
            const recentSessions = history.slice(0, Math.min(5, Math.ceil(history.length / 2)));
            const olderSessions = history.slice(recentSessions.length, recentSessions.length + 5);

            const recentAvg = recentSessions.reduce((acc, s) => acc + (s.score / (s.total_questions || 5)), 0) / recentSessions.length;
            const olderAvg = olderSessions.length > 0
              ? olderSessions.reduce((acc, s) => acc + (s.score / (s.total_questions || 5)), 0) / olderSessions.length
              : recentAvg;

            const delta = Math.round((recentAvg - olderAvg) * 100);

            if (delta > 2) {
              setOverallTrend({
                message: `Improving (+${delta}% over last ${recentSessions.length} sessions)`,
                color: "text-success",
                icon: TrendingUp
              });
            } else if (delta < -2) {
              setOverallTrend({
                message: `Declining (${delta}% over last ${recentSessions.length} sessions)`,
                color: "text-destructive",
                icon: TrendingDown
              });
            } else {
              setOverallTrend({
                message: "Stable performance over recent sessions",
                color: "text-muted-foreground",
                icon: Minus
              });
            }
          }
        }
      } catch (error) {
        console.error("Error loading analytics data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadAnalyticsData();
  }, []);
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2 flex-wrap">
            {t.heatmap_desc}
          </h1>
        </motion.div>

        {/* Study recommendation Banner */}
        <div className="mb-8 rounded-xl border border-primary/30 bg-primary/5 p-6 shadow-sm">
          <h3 className="mb-3 text-base font-bold text-primary flex items-center gap-2">
            <TrendingUp className="h-5 w-5" /> {t.ai_recommendation}
          </h3>
          {topicScores.length > 0 ? (
            <div className="flex flex-col md:flex-row md:items-center gap-4 text-sm text-foreground">
              <div className="flex-1">
                <p className="leading-relaxed">
                  Your <span className="font-bold text-destructive">{topicScores[0].topic}</span> scores are the lowest ({topicScores[0].accuracy}%). Spend 20 mins daily on this topic for the next 2 weeks to reach exam readiness.
                </p>
              </div>
              {topicScores.length > 1 && (
                <div className="flex-1 md:border-l md:border-primary/20 md:pl-4">
                  <p className="leading-relaxed">
                    <span className="font-bold text-success">{topicScores[topicScores.length - 1].topic}</span> is your strongest area — maintain with weekly review.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground leading-relaxed">
              Start practicing to get personalized AI study recommendations based on your performance.
            </p>
          )}
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Topic heatmap */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">{t.performance_heatmap}</h2>
              {topicScores.length > 5 && (
                <button
                  onClick={() => setShowAllHeatmap(!showAllHeatmap)}
                  className="text-xs font-semibold text-primary flex items-center gap-1 hover:underline focus:outline-none"
                >
                  {showAllHeatmap ? (
                    <>Collapse <ChevronUp className="h-3 w-3" /></>
                  ) : (
                    <>See All ({topicScores.length}) <ChevronDown className="h-3 w-3" /></>
                  )}
                </button>
              )}
            </div>
            <div className="rounded-xl border border-border bg-card p-6">
              {isLoading ? (
                <div className="flex h-60 items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : topicScores.length > 0 ? (
                <div className="grid gap-4 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin">
                  {(showAllHeatmap ? topicScores : topicScores.slice(0, 5)).map((topic) => (
                    <div key={topic.topic} className="flex items-center gap-4">
                      <span className="w-24 text-sm font-medium text-foreground">{topic.topic}</span>
                      <div className="flex-1">
                        <div className="h-8 rounded-lg bg-secondary overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${topic.accuracy}%` }}
                            transition={{ duration: 1, delay: 0.2 }}
                            className={`h-full rounded-lg ${topic.accuracy >= 70
                              ? "bg-success"
                              : topic.accuracy >= 50
                                ? "bg-warning"
                                : "bg-destructive"
                              }`}
                          />
                        </div>
                      </div>
                      <div className="flex w-32 items-center gap-3 text-sm">
                        <span className="font-semibold text-foreground whitespace-nowrap">{topic.accuracy}%</span>
                        <div className="flex items-center gap-1 text-[10px] bg-secondary/80 rounded px-1.5 py-0.5 text-muted-foreground whitespace-nowrap">
                          <Clock className="h-2.5 w-2.5" />
                          <span>{(topic as any).avgSpeed}s</span>
                        </div>
                        {topic.trend === "improving" ? (
                          <TrendingUp className="h-3 w-3 text-success" />
                        ) : topic.trend === "declining" ? (
                          <TrendingDown className="h-3 w-3 text-destructive" />
                        ) : (
                          <Minus className="h-3 w-3 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-muted-foreground">
                  No data points yet. Complete a quiz to see your performance heatmap.
                </div>
              )}

              <div className="mt-6 flex items-center gap-6 text-xs text-muted-foreground border-t border-border pt-4">
                <div className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded bg-destructive" /> Needs Work (&lt;50%)
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded bg-warning" /> Improving (50-70%)
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded bg-success" /> Strong (&gt;70%)
                </div>
              </div>
            </div>

            {/* Detailed breakdown */}
            <div className="flex items-center justify-between mb-4 mt-8">
              <h2 className="text-lg font-semibold text-foreground">{t.detailed_breakdown}</h2>
              {topicScores.length > 2 && (
                <button
                  onClick={() => setShowAllDetailed(!showAllDetailed)}
                  className="text-xs font-semibold text-primary flex items-center gap-1 hover:underline focus:outline-none"
                >
                  {showAllDetailed ? (
                    <>Show Less <ChevronUp className="h-3 w-3" /></>
                  ) : (
                    <>View All ({topicScores.length}) <ChevronDown className="h-3 w-3" /></>
                  )}
                </button>
              )}
            </div>
            <div className="grid gap-4 md:grid-cols-2 max-h-[500px] overflow-y-auto pr-2 scrollbar-thin">
              {!isLoading && (showAllDetailed ? topicScores : topicScores.slice(0, 2)).map((topic) => (
                <div key={topic.topic} className="rounded-xl border border-border bg-card p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-foreground">{topic.topic}</h3>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${topic.priority === "high" ? "bg-destructive/10 text-destructive" :
                      topic.priority === "medium" ? "bg-warning/10 text-warning" :
                        "bg-success/10 text-success"
                      }`}>
                      {topic.priority} {t.priority}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold text-foreground">{topic.accuracy}%</p>
                      <p className="text-xs text-muted-foreground">{t.accuracy}</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">{topic.totalQuestions}</p>
                      <p className="text-xs text-muted-foreground">{t.attempted}</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-success">{topic.correctAnswers}</p>
                      <p className="text-xs text-muted-foreground">{t.correct}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Overall readiness */}
            <div className="rounded-xl border border-border bg-card p-6">
              <h3 className="mb-4 text-sm font-semibold text-foreground">{t.overall_readiness}</h3>
              <div className="flex justify-center">
                <ProgressRing
                  value={topicScores.length > 0
                    ? Math.round(topicScores.reduce((acc, t_sum) => acc + t_sum.accuracy, 0) / topicScores.length)
                    : 0
                  }
                  size={140}
                  label={t.aspirant}
                />
              </div>
              <p className="mt-4 text-center text-sm text-muted-foreground">
                You need 70%+ to be exam-ready. Focus on weak areas!
              </p>
            </div>

            {/* Mock test history */}
            <div className="rounded-xl border border-border bg-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-foreground">Exam & Mock History</h3>
                {mockTests.length > 3 && (
                  <button
                    onClick={() => setShowAllMocks(!showAllMocks)}
                    className="text-[10px] uppercase font-bold text-primary flex items-center gap-1 hover:underline focus:outline-none bg-primary/10 px-2 py-1 rounded"
                  >
                    {showAllMocks ? "Collapse" : `See All (${mockTests.length})`}
                  </button>
                )}
              </div>
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin">
                {!isLoading && mockTests.length > 0 ? (
                  (showAllMocks ? mockTests : mockTests.slice(0, 3)).map((test, i) => (
                    <div key={i} className="flex items-center justify-between rounded-lg bg-secondary px-3 py-2">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-foreground">{test.title === "Mock Test" ? t.mock_test : test.title}</span>
                        <span className="text-[10px] text-muted-foreground">{test.date}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-semibold ${test.score / test.total >= 0.7 ? "text-success" : test.score / test.total >= 0.5 ? "text-warning" : "text-destructive"
                          }`}>
                          {test.score}/{test.total}
                        </span>
                        <span className="text-xs text-muted-foreground">{Math.round((test.score / test.total) * 100)}%</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-sm text-muted-foreground py-4">{t.no_tests}</p>
                )}
              </div>
              {overallTrend && (
                <p className={`mt-4 text-xs text-center flex items-center justify-center gap-1 ${overallTrend.color}`}>
                  <overallTrend.icon className="h-3 w-3" />
                  Overall trend: {overallTrend.message}
                </p>
              )}
            </div>

          </div>
        </div>
      </main>
    </div>
  );
};

export default Analytics;
