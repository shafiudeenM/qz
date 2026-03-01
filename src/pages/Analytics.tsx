import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Header from "@/components/Header";
import ProgressRing from "@/components/ProgressRing";
import { type TopicScore } from "@/data/sampleQuestions";
import { TrendingUp, TrendingDown, Minus, Loader2 } from "lucide-react";
import { fetchUserSessions } from "@/lib/questions";
import { useAuth } from "@/components/AuthProvider";
import { translations } from "@/lib/translations";
import { calculateTopicMastery } from "@/lib/mastery";

const Analytics = () => {
  const [sessions, setSessions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [topicScores, setTopicScores] = useState<TopicScore[]>([]);
  const [mockTests, setMockTests] = useState<any[]>([]);
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

          const scores: TopicScore[] = masteryStats.map(m => ({
            topic: m.topic,
            accuracy: m.masteryScore,
            totalQuestions: history.filter(s => s.subject === m.topic || s.topic === m.topic).reduce((acc, s) => acc + (s.total_questions || 0), 0),
            correctAnswers: history.filter(s => s.subject === m.topic || s.topic === m.topic).reduce((acc, s) => acc + (s.score || 0), 0),
            trend: m.readiness > 70 ? "improving" : "stable",
            priority: m.priority.toLowerCase() as any
          }));
          setTopicScores(scores.sort((a, b) => a.accuracy - b.accuracy));

          // Process Mock Test History
          const mocks = history
            .filter(s => s.quiz_title === "Mock Test")
            .map(s => ({
              date: new Date(s.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
              score: Math.round(s.score),
              total: s.total_questions
            }));
          setMockTests(mocks);
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
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="mb-2 text-2xl font-bold text-foreground">{t.analytics}</h1>
          <p className="mb-8 text-muted-foreground">{t.heatmap_desc}</p>
        </motion.div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Topic heatmap */}
          <div className="lg:col-span-2">
            <h2 className="mb-4 text-lg font-semibold text-foreground">{t.performance_heatmap}</h2>
            <div className="rounded-xl border border-border bg-card p-6">
              {isLoading ? (
                <div className="flex h-60 items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : topicScores.length > 0 ? (
                <div className="grid gap-4">
                  {topicScores.map((topic) => (
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
                      <div className="flex w-20 items-center gap-1 text-sm">
                        <span className="font-semibold text-foreground">{topic.accuracy}%</span>
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
            <h2 className="mb-4 mt-8 text-lg font-semibold text-foreground">{t.detailed_breakdown}</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {!isLoading && topicScores.map((topic) => (
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
              <h3 className="mb-4 text-sm font-semibold text-foreground">{t.mock_history}</h3>
              <div className="space-y-3">
                {!isLoading && mockTests.length > 0 ? (
                  mockTests.map((test, i) => (
                    <div key={i} className="flex items-center justify-between rounded-lg bg-secondary px-3 py-2">
                      <span className="text-sm text-muted-foreground">{test.date}</span>
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
              <p className="mt-4 text-xs text-center text-success">
                ↑ Overall trend: Improving (+20% over 5 tests)
              </p>
            </div>

            {/* Study recommendation */}
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-6">
              <h3 className="mb-3 text-sm font-semibold text-primary">🎯 {t.ai_recommendation}</h3>
              {topicScores.length > 0 ? (
                <>
                  <p className="text-sm text-foreground leading-relaxed">
                    Your <span className="font-semibold text-destructive">{topicScores[0].topic}</span> scores are the lowest ({topicScores[0].accuracy}%).
                    Spend 20 mins daily on this topic for the next 2 weeks to reach exam readiness.
                  </p>
                  {topicScores.length > 1 && (
                    <p className="mt-3 text-sm text-foreground leading-relaxed">
                      <span className="font-semibold text-success">{topicScores[topicScores.length - 1].topic}</span> is your strongest area — maintain with weekly review.
                    </p>
                  )}
                </>
              ) : (
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Start practicing to get personalized AI study recommendations based on your performance.
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
