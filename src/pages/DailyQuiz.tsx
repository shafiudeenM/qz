import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { CheckCircle, XCircle, ArrowRight, Clock, Zap, Loader2, Printer, Sparkles, Bookmark, Flag, Info } from "lucide-react";
import confetti from "canvas-confetti";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { type Question } from "@/data/sampleQuestions";
import { fetchAdaptiveQuestions, saveQuizSession, updateQuestionMastery, toggleSaveQuestion, reportQuestion } from "@/lib/questions";
import { useAuth } from "@/components/AuthProvider";
import { useFocus } from "@/components/FocusProvider";
import { toast } from "sonner";
import { translations } from "@/lib/translations";
import { cn } from "@/lib/utils";
import MilestoneOverlay from "@/components/MilestoneOverlay";
import { logFrictionEvent, checkTimeFatigue } from "@/lib/FrictionTracker";

const DailyQuiz = () => {
  const navigate = useNavigate();
  const { language, isGuest, guestQuizCount, incrementGuestCount } = useAuth();
  const { isFocusMode } = useFocus();
  const t = translations[language];
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [timeLeft, setTimeLeft] = useState(60);
  const [finished, setFinished] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeMilestone, setActiveMilestone] = useState<"first_correct" | "daily_complete" | "streak_3" | "level_up" | null>(null);

  useEffect(() => {
    if (isGuest && guestQuizCount >= 2) {
      toast.error("Guest limit reached! Sign up to continue learning.");
      navigate("/auth");
      return;
    }
    const loadQuestions = async () => {
      try {
        const data = await fetchAdaptiveQuestions(5, language);
        setQuestions(data);
      } catch (error) {
        console.error("Failed to load questions:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadQuestions();
  }, [language]);

  const question = questions[currentIndex];

  useEffect(() => {
    if (finished || isRevealed || isLoading || !question) return;
    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          handleSubmit();
          return 60;
        }
        return t - 1;
      });
    }, 1000);
    return () => {
      clearInterval(timer);
      if (!finished && currentIndex > 0) {
        logFrictionEvent({
          event_type: "QUIZ_ABANDONED",
          metadata: {
            currentIndex,
            totalQuestions: questions.length,
            score
          }
        });
      }
    };
  }, [currentIndex, finished, isRevealed, isLoading, question, questions.length, score]);

  const handleSubmit = async () => {
    if (isRevealed || isSubmitting) return;
    setIsSubmitting(true);

    // Add artificial delay to build anticipation (Dopamine Trigger)
    await new Promise(resolve => setTimeout(resolve, 600));

    setIsRevealed(true);
    setIsSubmitting(false);

    const isCorrect = selectedAnswer === question.correctAnswer;
    if (isCorrect) setScore((s) => s + 1);
    setAnswers((a) => [...a, selectedAnswer]);

    // Update Spaced Repetition mastery
    updateQuestionMastery(Number(question.id), isCorrect, 'daily');

    // Track Time Fatigue
    checkTimeFatigue(60 - timeLeft);

    // Trigger First Correct Milestone
    if (isCorrect && score === 0 && !localStorage.getItem("milestone_first_correct")) {
      setActiveMilestone("first_correct");
      localStorage.setItem("milestone_first_correct", "true");
    }
  };

  const handleNext = async () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((i) => i + 1);
      setSelectedAnswer(null);
      setIsRevealed(false);
      setTimeLeft(60);
    } else {
      try {
        await saveQuizSession({
          quiz_title: "Daily Quiz",
          total_questions: questions.length,
          score: score,
          potential_score: questions.length,
          subject: questions[0]?.topic || "General",
          quiz_snapshot: questions,
          answers_snapshot: answers
        });
        if (isGuest) {
          incrementGuestCount();
        }
      } catch (error) {
        console.error("Error saving quiz session:", error);
      }

      if (score >= questions.length * 0.8) {
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#3b82f6', '#8b5cf6', '#10b981']
        });
      }

      // Trigger Daily Complete Milestone
      if (score >= questions.length * 0.6) {
        setActiveMilestone("daily_complete");
      }

      setFinished(true);
    }
  };

  const handleToggleSave = async () => {
    if (isGuest) {
      toast.error("Sign in to save questions for later review!");
      return;
    }
    const saved = await toggleSaveQuestion(question.id);
    setIsSaved(saved);
    toast.success(saved ? "Question saved!" : "Question removed from saved");
  };

  const handleReport = () => {
    if (isGuest) {
      toast.error("Sign in to report errors!");
      return;
    }
    const reason = window.prompt("Why are you reporting this question? (e.g., Incorrect Answer, Typo)");
    if (!reason) return;

    toast.promise(reportQuestion(question.id, reason, "User reported from Daily Quiz"), {
      loading: "Submitting report...",
      success: "Thank you! Our admins will review this.",
      error: "Failed to submit report."
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container flex h-[60vh] items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-muted-foreground">{t.loading_questions}</p>
          </div>
        </main>
      </div>
    );
  }

  if (!isLoading && questions.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container flex h-[60vh] items-center justify-center text-center">
          <div className="max-w-md">
            <h1 className="text-2xl font-bold">{t.no_questions_found}</h1>
            <p className="mt-2 text-muted-foreground">We couldn't find any questions in your "final_questions" table.</p>
            <Button onClick={() => navigate("/dashboard")} className="mt-6">
              {t.back_to_dashboard}
            </Button>
          </div>
        </main>
      </div>
    );
  }

  if (finished) {
    const percentage = Math.round((score / questions.length) * 100);
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-12">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mx-auto max-w-lg text-center"
          >
            <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-primary/10">
              <span className="text-4xl font-bold text-primary">{score}/{questions.length}</span>
            </div>
            <h1 className="text-2xl font-bold text-foreground">{t.quiz_complete}</h1>
            <p className="mt-2 text-muted-foreground">
              {percentage}% — {percentage >= 70 ? t.great_job : percentage >= 50 ? t.good_effort : t.keep_practicing}
            </p>

            <div className="mt-8 space-y-3">
              {questions.map((q, i) => (
                <div
                  key={q.id}
                  className={`flex items-center gap-3 rounded-lg p-3 text-left text-sm ${answers[i] === q.correctAnswer
                    ? "bg-success/10 text-success"
                    : "bg-destructive/10 text-destructive"
                    }`}
                >
                  {answers[i] === q.correctAnswer ? (
                    <CheckCircle className="h-4 w-4 shrink-0" />
                  ) : (
                    <XCircle className="h-4 w-4 shrink-0" />
                  )}
                  <span className="text-foreground">{q.text}</span>
                </div>
              ))}
            </div>

            <div className="mt-8 flex gap-4 justify-center no-print">
              <Button
                variant="outline"
                className="gap-2 border-border text-foreground"
                onClick={() => window.print()}
              >
                <Printer className="h-4 w-4" /> {t.download_report}
              </Button>
              <Button
                variant="outline"
                className="border-border text-foreground"
                onClick={() => navigate("/dashboard")}
              >
                {t.back_to_dashboard}
              </Button>
              <Button
                className="bg-primary text-primary-foreground"
                onClick={() => {
                  setCurrentIndex(0);
                  setSelectedAnswer(null);
                  setIsRevealed(false);
                  setScore(0);
                  setAnswers([]);
                  setTimeLeft(60);
                  setFinished(false);
                }}
              >
                {t.try_again}
              </Button>
            </div>

            <style dangerouslySetInnerHTML={{
              __html: `
              @media print {
                .no-print, header, nav { display: none !important; }
                .container { max-width: 100% !important; padding: 0 !important; margin: 0 !important; }
                body { background-color: white !important; color: black !important; }
                .grid { display: block !important; }
                .rounded-xl { border: 1px solid #e2e8f0 !important; margin-bottom: 1rem !important; }
                .text-primary, .text-success, .text-destructive { color: black !important; font-weight: bold !important; }
              }
            `}} />
          </motion.div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-8 max-w-4xl">
        {/* Progress bar */}
        <div className="mx-auto mb-8 max-w-2xl no-print">
          <div className="mb-4 flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <Zap className="h-4 w-4 text-primary" />
              </div>
              <span className="font-black uppercase tracking-tight">Practice Session</span> — <span className="font-medium text-foreground">{question.topic}</span>
            </div>
            <span className="text-muted-foreground">
              {currentIndex + 1} / {questions.length}
            </span>
          </div>
          <div className="h-2 rounded-full bg-secondary">
            <motion.div
              className="h-2 rounded-full bg-primary"
              initial={{ width: 0 }}
              animate={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Timer */}
        <div className="mx-auto mb-8 max-w-2xl no-print">
          <div className="flex items-center justify-end gap-2 text-sm">
            <div className={`flex items-center gap-2 rounded-full px-4 py-1.5 glass-card ${timeLeft <= 10 ? "border-destructive text-destructive animate-pulse" : "border-primary/20 text-muted-foreground"}`}>
              <Clock className="h-4 w-4" />
              <span className="font-black tabular-nums">{timeLeft}s</span>
            </div>
          </div>
        </div>

        {/* Question */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="mx-auto max-w-2xl"
          >
            <div className="mb-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-primary/60">
              <span className="rounded bg-primary/10 px-2 py-0.5">{question.source}</span>
              <span>{question.examYear}</span>
              <span className="flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                {t.difficulty_label}: {question.difficulty}
              </span>
              <div className="ml-auto flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn("h-8 w-8", isSaved && "text-primary fill-primary")}
                  onClick={handleToggleSave}
                >
                  <Bookmark className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={handleReport}
                >
                  <Flag className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <h2 className="mb-8 text-2xl font-black leading-tight tracking-tight text-foreground md:text-3xl">
              {question.text}
            </h2>

            <div className="space-y-3">
              {question.options.map((option, i) => {
                let optionStyle = "border-border bg-card hover:border-primary/50 cursor-pointer";
                if (isRevealed) {
                  if (i === question.correctAnswer) {
                    optionStyle = "border-success bg-success/10 shadow-[0_0_20px_rgba(16,185,129,0.2)]";
                  } else if (i === selectedAnswer && i !== question.correctAnswer) {
                    optionStyle = "border-destructive bg-destructive/10";
                  } else {
                    optionStyle = "border-border bg-card opacity-50";
                  }
                } else if (selectedAnswer === i) {
                  optionStyle = "border-primary bg-primary/10 ring-2 ring-primary ring-offset-2 scale-[1.02] shadow-lg shadow-primary/20";
                }

                return (
                  <button
                    key={i}
                    onClick={() => !isRevealed && setSelectedAnswer(i)}
                    className={`flex w-full items-center gap-4 rounded-2xl glass-card p-5 text-left transition-all active:scale-[0.98] ${optionStyle}`}
                    disabled={isRevealed}
                  >
                    <span className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-black transition-colors",
                      selectedAnswer === i ? "bg-primary text-primary-foreground" : "bg-secondary/50 text-foreground"
                    )}>
                      {String.fromCharCode(65 + i)}
                    </span>
                    <span className="text-base font-medium text-foreground leading-relaxed">{option}</span>
                    {isRevealed && i === question.correctAnswer && (
                      <CheckCircle className="ml-auto h-5 w-5 text-success" />
                    )}
                    {isRevealed && i === selectedAnswer && i !== question.correctAnswer && (
                      <XCircle className="ml-auto h-5 w-5 text-destructive" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Explanation */}
            {isRevealed && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 rounded-xl border border-info/30 bg-info/10 p-4"
              >
                <p className="text-sm font-semibold text-info">{t.explanation}</p>
                <p className="mt-1 text-sm text-foreground">{question.explanation}</p>
              </motion.div>
            )}

            {/* Actions */}
            <div className="mt-8 flex justify-end gap-3">
              {!isRevealed ? (
                <Button
                  onClick={handleSubmit}
                  disabled={selectedAnswer === null || isSubmitting}
                  className={cn(
                    "bg-primary text-primary-foreground hover:bg-primary/90 min-w-[160px] h-12 text-sm font-bold uppercase tracking-widest transition-all",
                    isSubmitting && "opacity-90 scale-[0.98]"
                  )}
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {t.checking || "Validating..."}
                    </span>
                  ) : (
                    t.submit_answer || "Submit Answer"
                  )}
                </Button>
              ) : (
                <Button onClick={handleNext} className="bg-primary text-primary-foreground hover:bg-primary/90">
                  {currentIndex < questions.length - 1 ? t.next_question : t.see_results}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}
            </div>
          </motion.div>
        </AnimatePresence>

        {activeMilestone && (
          <MilestoneOverlay
            type={activeMilestone}
            onClose={() => setActiveMilestone(null)}
          />
        )}
      </main>
    </div>
  );
};

export default DailyQuiz;
