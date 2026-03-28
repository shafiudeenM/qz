import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { Clock, Flag, ChevronLeft, ChevronRight, CheckCircle, AlertTriangle, Loader2, Printer, Bookmark, Info, Trophy } from "lucide-react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { fetchAdaptiveQuestions, fetchMockTestQuestions, saveQuizSession, updateQuestionMastery, toggleSaveQuestion, reportQuestion } from "@/lib/questions";
import confetti from "canvas-confetti";
import { useAuth } from "@/components/AuthProvider";
import { useFocus } from "@/components/FocusProvider";
import { translations } from "@/lib/translations";
import { type Question } from "@/data/sampleQuestions";
import { cn } from "@/lib/utils";
import { getTopicDisplayName, getTopicTamilName, getTopicColor } from "@/lib/topicDescriptor";
import { BookMarked } from "lucide-react";
import { Sparkles } from "lucide-react";
import { logFrictionEvent } from "@/lib/FrictionTracker";
import { useRef } from "react";

const SYLLABUS_TOPICS = [
  "TAM_01", "TAM_02", "TAM_03", "TAM_07",
  "HIS_01", "HIS_03", "HIS_04",
  "POL_01", "POL_02",
  "GEO_01", "GEO_02",
  "APT_01", "ECO_01", "SCI_01"
];

const MockTest = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { language, isGuest, guestQuizCount, incrementGuestCount, isDualMode, setDualMode } = useAuth();
  const { isFocusMode } = useFocus();
  const t = translations[language];
  const preLoadedQuestions = location.state?.customQuestions as Question[] | undefined;
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [flagged, setFlagged] = useState<Set<number>>(new Set());
  const [timeLeft, setTimeLeft] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [savedQuestions, setSavedQuestions] = useState<Set<number>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [qStartTime, setQStartTime] = useState<number>(Date.now());
  const [questionTimes, setQuestionTimes] = useState<number[]>([]);
  const isSubmittedRef = useRef(false);
  const [hasStarted, setHasStarted] = useState(!!preLoadedQuestions);
  const [selectedSyllabusTopics, setSelectedSyllabusTopics] = useState<string[]>([]);

  useEffect(() => {
    if (isGuest && guestQuizCount >= 2) {
      toast.error("Guest limit reached! Sign up to take full-length mock tests.");
      navigate("/auth");
      return;
    }
    const checkState = async () => {
      if (preLoadedQuestions && preLoadedQuestions.length > 0) {
        setQuestions(preLoadedQuestions);
        setAnswers(new Array(preLoadedQuestions.length).fill(null));
        setTimeLeft(preLoadedQuestions.length * 60);
        setIsLoading(false);
        setHasStarted(true);
        return;
      }
      setIsLoading(false);
    };
    checkState();
  }, [language, preLoadedQuestions, isGuest, guestQuizCount, navigate]);

  const startRandomMock = async () => {
    setIsLoading(true);
    setHasStarted(true);
    try {
      const data = await fetchMockTestQuestions(20, language);
      setQuestions(data);
      setAnswers(new Array(data.length).fill(null));
      setQuestionTimes(new Array(data.length).fill(0));
      setTimeLeft(data.length * 60);
    } catch (error) {
      console.error("Failed to load mock questions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTopic = (tid: string) => {
    setSelectedSyllabusTopics(prev => prev.includes(tid) ? prev.filter(t => t !== tid) : [...prev, tid]);
  };

  const handleStartSyllabusExam = () => {
    if (selectedSyllabusTopics.length === 0) return;
    const customConfig = {
      displayName: 'Syllabus Topic Master Test',
      displayNameTa: 'பாடத்திட்டத் தலைப்புத் தேர்வு',
      group: 'G4',
      totalQuestions: 20,
      durationSeconds: 1200,
      negativeMarkFraction: 0.33,
      sections: [
        { id: 'custom-sec', name: 'Syllabus Focus', nameTa: 'பாடத்திட்டக் கவனம்', questionCount: 20, topicIds: selectedSyllabusTopics }
      ]
    };
    navigate("/exam-session", { state: { customConfig } });
  };

  const question = questions[currentIndex];

  useEffect(() => {
    if (submitted || isLoading || !question) return;
    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          setSubmitted(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [submitted, isLoading, question]);

  // Handle dwell time tracking when navigating
  const handleNavigate = (newIndex: number | ((prev: number) => number)) => {
    const elapsed = Date.now() - qStartTime;
    const currentIdx = typeof currentIndex === 'number' ? currentIndex : 0;

    setQuestionTimes(prev => {
      const updated = [...prev];
      if (updated[currentIdx] !== undefined) {
        updated[currentIdx] += elapsed;
      }
      return updated;
    });

    if (typeof newIndex === 'function') {
      setCurrentIndex(newIndex);
    } else {
      setCurrentIndex(newIndex);
    }
    setQStartTime(Date.now());
  };

  // Track abandonment
  useEffect(() => {
    return () => {
      if (!isSubmittedRef.current && questions.length > 0) {
        const attempted = answers.filter(a => a !== null).length;
        if (attempted > 0) {
          logFrictionEvent({
            event_type: "MOCK_ABANDONED",
            metadata: {
              currentIndex,
              attemptedCount: attempted,
              totalQuestions: questions.length
            }
          });
        }
      }
    };
  }, [questions.length, answers, currentIndex]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const selectAnswer = (optionIndex: number) => {
    const newAnswers = [...answers];
    newAnswers[currentIndex] = optionIndex;
    setAnswers(newAnswers);
  };

  const toggleFlag = () => {
    const newFlags = new Set(flagged);
    if (newFlags.has(currentIndex)) newFlags.delete(currentIndex);
    else newFlags.add(currentIndex);
    setFlagged(newFlags);
  };

  const calculateScore = useCallback(() => {
    let correct = 0, wrong = 0, skipped = 0;
    answers.forEach((ans, i) => {
      if (ans === null) skipped++;
      else if (ans === questions[i].correctAnswer) correct++;
      else wrong++;
    });
    const score = correct - wrong * (1 / 3);
    return { correct, wrong, skipped, score: Math.max(0, Math.round(score * 100) / 100) };
  }, [answers, questions]);

  const handleSubmitTest = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    // Add tactile delay for better perception
    await new Promise(resolve => setTimeout(resolve, 800));

    const { score } = calculateScore();
    try {
      await saveQuizSession({
        quiz_title: "Mock Test",
        total_questions: questions.length,
        score: score,
        potential_score: questions.length,
        subject: questions[0]?.topic || "General",
        quiz_snapshot: questions,
        answers_snapshot: answers,
        average_response_time: questionTimes.reduce((a, b) => a + b, 0) / questionTimes.length,
        time_snapshot: questionTimes
      });

      if (isGuest) {
        incrementGuestCount();
      }

      // Update mastery for each question explicitly in 'mock' mode
      for (let i = 0; i < questions.length; i++) {
        const isCorrect = answers[i] === questions[i].correctAnswer;
        await updateQuestionMastery(Number(questions[i].id), isCorrect, 'mock');
      }
    } catch (error) {
      console.error("Error saving mock test session:", error);
    } finally {
      setIsSubmitting(false);
    }

    if (score >= questions.length * 0.8) {
      confetti({
        particleCount: 200,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b']
      });
    }
    setSubmitted(true);
    isSubmittedRef.current = true;
  };

  const handleToggleSave = async () => {
    if (isGuest) {
      toast.error("Sign in to save questions!");
      return;
    }
    const saved = await toggleSaveQuestion(question.id);
    const newSaved = new Set(savedQuestions);
    if (saved) newSaved.add(currentIndex);
    else newSaved.delete(currentIndex);
    setSavedQuestions(newSaved);
    toast.success(saved ? "Question saved!" : "Question removed");
  };

  const handleReport = () => {
    if (isGuest) {
      toast.error("Sign in to report errors!");
      return;
    }
    const reason = window.prompt("Reason for reporting?");
    if (!reason) return;
    toast.promise(reportQuestion(question.id, reason, "User reported from Mock Test"), {
      loading: "Reporting...",
      success: "Thank you!",
      error: "Error."
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container flex h-[60vh] items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-muted-foreground">Preparing your mock test...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!hasStarted) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="w-full px-4 md:px-8 lg:px-12 py-10 mx-auto max-w-[1600px]">
          <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="mb-10 text-center">
            <h1 className="text-4xl font-black tracking-tight text-foreground">Prepare Your Mock Test</h1>
            <p className="mt-2 text-muted-foreground">Choose a random 20-question mock or customize your own from specific syllabus topics.</p>
          </motion.div>

          <div className="flex flex-col gap-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Random Mock */}
              <div className="rounded-2xl border border-border bg-card p-8 flex flex-col justify-between hover:border-primary/40 transition-colors">
                <div>
                  <h2 className="text-2xl font-black text-foreground flex items-center gap-2 mb-2">
                    <Sparkles className="h-6 w-6 text-primary" /> Random Mock Test
                  </h2>
                  <p className="text-muted-foreground mb-6">A standard 20-question test drawn from all syllabus topics to test your overall readiness.</p>
                </div>
                <Button onClick={startRandomMock} className="w-full text-lg h-14 bg-primary/10 text-primary font-black uppercase tracking-widest rounded-xl hover:bg-primary/20">
                  Start Random Mock
                </Button>
              </div>

              {/* Full Length Mock Link */}
              <div className="rounded-2xl border border-border bg-card p-8 flex flex-col justify-between hover:border-primary/40 transition-colors">
                <div>
                  <h2 className="text-2xl font-black text-foreground flex items-center gap-2 mb-2">
                    <Trophy className="h-6 w-6 text-primary" /> Full Length Mock
                  </h2>
                  <p className="text-muted-foreground mb-6">Take a complete official exam-style mock with actual question counts and section weightage.</p>
                </div>
                <Button onClick={() => navigate("/exam-arena")} className="w-full text-lg h-14 bg-primary text-primary-foreground font-black uppercase tracking-widest rounded-xl">
                  Choose Exam
                </Button>
              </div>
            </div>

            {/* Syllabus Master */}
            <div className="rounded-[2.5rem] border border-primary/20 bg-primary/5 p-10 flex flex-col justify-between shadow-lg">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-3xl font-black text-foreground flex items-center gap-3">
                    <BookMarked className="h-8 w-8 text-primary" /> Syllabus Master
                  </h2>
                  <span className="text-xs bg-primary/20 text-primary px-3 py-1 rounded-full font-bold uppercase tracking-widest">Pro</span>
                </div>
                <p className="text-muted-foreground text-lg mb-8">Target weak areas by selecting specific chapters for a customized mock test.</p>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 mb-8 max-h-[400px] overflow-y-auto pr-4 scrollbar-thin">
                  {SYLLABUS_TOPICS.map(tid => {
                    const isSelected = selectedSyllabusTopics.includes(tid);
                    return (
                      <button
                        key={tid}
                        onClick={() => toggleTopic(tid)}
                        className={cn("flex flex-col items-start p-4 rounded-2xl border text-left transition-all hover:scale-[1.02]", isSelected ? "border-primary bg-primary/10 ring-2 ring-primary shadow-sm" : "border-border hover:border-primary/40 bg-background")}
                      >
                        <div className={cn("px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-widest mb-2", isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>{tid.split('_')[0]}</div>
                        <div className="text-sm font-black text-foreground w-full line-clamp-2 leading-tight mb-1">{getTopicTamilName(tid)}</div>
                        <div className="text-[10px] text-muted-foreground truncate w-full">{getTopicDisplayName(tid)}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <Button
                onClick={handleStartSyllabusExam}
                disabled={selectedSyllabusTopics.length === 0}
                className="w-full text-xl h-16 font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-primary/20"
              >
                {selectedSyllabusTopics.length > 0 ? `Generate from ${selectedSyllabusTopics.length} Topics` : "Select Topics to Begin"}
              </Button>
            </div>
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
            <p className="mt-2 text-muted-foreground mb-6">
              {t.narrow_filters_warning}
            </p>
            <Button className="w-full gap-2" size="lg" onClick={() => navigate("/dashboard")}>
              {t.back_to_dashboard}
            </Button>
          </div>
        </main>
      </div>
    );
  }

  if (submitted) {
    const { correct, wrong, skipped, score } = calculateScore();
    const percentage = Math.round((score / questions.length) * 100);

    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-12">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-2xl">
            <div className="mb-8 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <CheckCircle className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">{t.test_results}</h2>
                  <p className="text-sm text-muted-foreground">{t.summary_desc}</p>
                </div>
              </div>
              <Button variant="outline" size="sm" className="gap-2" onClick={() => window.print()}>
                <Printer className="h-4 w-4" /> {t.download_report}
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-4 md:grid-cols-4 mb-8">
              {[
                { label: "Score", value: `${score}/${questions.length}`, color: "text-primary" },
                { label: "Correct", value: correct, color: "text-success" },
                { label: "Wrong", value: wrong, color: "text-destructive" },
                { label: "Skipped", value: skipped, color: "text-muted-foreground" },
              ].map((s) => (
                <div key={s.label} className="rounded-xl border border-border bg-card p-4 text-center">
                  <p className="text-sm text-muted-foreground">{s.label}</p>
                  <p className={`mt-1 text-2xl font-bold ${s.color}`}>{s.value}</p>
                </div>
              ))}
            </div>

            <div className="rounded-xl border border-border bg-card p-4 mb-8">
              <p className="text-sm text-muted-foreground mb-2">Negative Marking Impact</p>
              <p className="text-foreground text-sm">
                Lost <span className="font-semibold text-destructive">{(wrong * (1 / 3)).toFixed(2)} marks</span> to wrong answers.
                Without penalties, your score would be <span className="font-semibold text-success">{correct}/{questions.length}</span>.
              </p>
            </div>

            {/* Question review */}
            <div className="space-y-3">
              {questions.map((q, i) => (
                <div key={q.id} className={`rounded-lg border p-3 text-sm ${answers[i] === null ? "border-border bg-card" :
                  answers[i] === q.correctAnswer ? "border-success/30 bg-success/5" :
                    "border-destructive/30 bg-destructive/5"
                  }`}>
                  <div className="flex items-start gap-2">
                    {answers[i] === null ? (
                      <span className="text-muted-foreground">—</span>
                    ) : answers[i] === q.correctAnswer ? (
                      <CheckCircle className="h-4 w-4 text-success shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                    )}
                    <div>
                      <p className="text-foreground">{q.text}</p>
                      {isDualMode && q.text_ta && (
                        <p className="mt-1 text-sm font-bold text-muted-foreground/70">{q.text_ta}</p>
                      )}
                      <p className="mt-2 text-xs text-muted-foreground">
                        Correct: {q.options[q.correctAnswer]} {isDualMode && q.options_ta?.[q.correctAnswer] && `(${q.options_ta[q.correctAnswer]})`}
                        {answers[i] !== null && answers[i] !== q.correctAnswer && (
                          <> • Your answer: {q.options[answers[i]!]} {isDualMode && q.options_ta?.[answers[i]!] && `(${q.options_ta[answers[i]!]})`}</>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 flex justify-center gap-4 no-print">
              <Button
                variant="outline"
                className="gap-2 border-border text-foreground"
                onClick={() => window.print()}
              >
                <Printer className="h-4 w-4" /> Download Report
              </Button>
              <Button onClick={() => navigate("/dashboard")} className="bg-primary text-primary-foreground">
                Back to Dashboard
              </Button>
            </div>

            <style dangerouslySetInnerHTML={{
              __html: `
              @media print {
                .no-print, header, nav { display: none !important; }
                .container { max-width: 100% !important; padding: 0 !important; margin: 0 !important; }
                body { background-color: white !important; color: black !important; }
                .grid { display: block !important; }
                .rounded-xl { border: 1px solid #e2e8f0 !important; margin-bottom: 1rem !important; page-break-inside: avoid; }
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
      <main className="container py-6">
        {/* Top bar */}
        <div className="mb-8 flex items-center justify-between bg-card border border-border rounded-2xl px-6 py-4 no-print">
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              Progress
            </span>
            <span className="text-sm font-bold text-foreground">
              {t.question} <span className="text-primary">{currentIndex + 1}</span> / {questions.length}
            </span>
          </div>

          <div className={`flex items-center gap-3 rounded-xl bg-secondary/50 px-4 py-2 text-lg font-black tabular-nums transition-all ${timeLeft <= 60 ? "border border-destructive text-destructive animate-pulse" : "text-foreground"}`}>
            <Clock className="h-5 w-5" />
            {formatTime(timeLeft)}
          </div>

          <Button
            variant="destructive"
            onClick={handleSubmitTest}
            disabled={isSubmitting}
            className="rounded-xl px-6 font-bold uppercase tracking-wide min-w-[140px]"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                {t.validating}
              </span>
            ) : (
              t.submit_test
            )}
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-4">
          {/* Question area */}
          <div className="lg:col-span-3">
            <motion.div key={currentIndex} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
                <span className="rounded bg-secondary px-2 py-0.5">{question.topic}</span>
                <span>{question.source} • {question.examYear}</span>
                <div className="ml-auto flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "h-7 px-2 text-[10px] font-black border transition-all",
                      isDualMode
                        ? "bg-primary/10 text-primary border-primary/40 shadow-[0_0_10px_rgba(var(--primary),0.1)]"
                        : "text-muted-foreground border-transparent hover:border-primary/20"
                    )}
                    onClick={() => setDualMode(!isDualMode)}
                  >
                    {t.dual_mode}
                  </Button>
                </div>
              </div>
              <h2 className="mb-6 text-lg font-semibold text-foreground">
                {question.text}
                {isDualMode && question.text_ta && (
                  <span className="block mt-2 text-base font-bold text-muted-foreground/80 leading-relaxed animate-in fade-in slide-in-from-top-1">
                    {question.text_ta}
                  </span>
                )}
              </h2>

              <div className="space-y-3">
                {question.options.map((option, i) => (
                  <button
                    key={i}
                    onClick={() => selectAnswer(i)}
                    className={`flex w-full items-center gap-4 rounded-2xl bg-card border border-border p-5 text-left transition-all active:scale-[0.98] group ${answers[currentIndex] === i
                      ? "border-primary bg-primary/10 ring-2 ring-primary ring-offset-2 scale-[1.02] shadow-lg shadow-primary/20"
                      : "hover-glow"
                      }`}
                  >
                    <span className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-black transition-colors",
                      answers[currentIndex] === i ? "bg-primary text-primary-foreground" : "bg-secondary/80 text-foreground"
                    )}>
                      {String.fromCharCode(65 + i)}
                    </span>
                    <div className="flex flex-col gap-1">
                      <span className="text-base font-medium text-foreground leading-relaxed">{option}</span>
                      {isDualMode && question.options_ta?.[i] && (
                        <span className="text-sm font-bold text-muted-foreground/70">{question.options_ta[i]}</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>

              {/* Nav buttons */}
              <div className="mt-6 flex items-center justify-between">
                <Button
                  variant="outline"
                  onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
                  disabled={currentIndex === 0}
                  className="border-border text-foreground"
                >
                  <ChevronLeft className="mr-1 h-4 w-4" /> Previous
                </Button>
                <Button
                  variant="outline"
                  onClick={toggleFlag}
                  className={flagged.has(currentIndex) ? "border-warning bg-warning/10 text-warning" : "border-border text-muted-foreground"}
                >
                  <Flag className="mr-1 h-4 w-4" />
                  {flagged.has(currentIndex) ? t.flagged : t.flag_for_review}
                </Button>
                <Button
                  onClick={() => setCurrentIndex((i) => Math.min(questions.length - 1, i + 1))}
                  disabled={currentIndex === questions.length - 1}
                  className="bg-primary text-primary-foreground"
                >
                  Next <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>

              {/* Action bar for save/report */}
              <div className="mt-8 flex items-center gap-4 rounded-xl border border-dashed border-border p-4">
                <span className="text-xs font-medium text-muted-foreground mr-auto">Question Actions</span>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn("gap-2", savedQuestions.has(currentIndex) && "bg-primary/10 border-primary text-primary")}
                  onClick={handleToggleSave}
                >
                  <Bookmark className={cn("h-4 w-4", savedQuestions.has(currentIndex) && "fill-primary")} />
                  {savedQuestions.has(currentIndex) ? "Saved" : "Save Question"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 text-muted-foreground hover:text-destructive"
                  onClick={handleReport}
                >
                  <Flag className="h-4 w-4" />
                  Report Error
                </Button>
              </div>
            </motion.div>
          </div>

          {/* Question navigator */}
          <div className="bg-card border border-border rounded-2xl p-6 no-print">
            <div className="flex flex-col gap-1 mb-6">
              <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">
                {t.question} Navigator
              </span>
              <h1 className="text-xl font-black text-foreground tracking-tight">{t.mock_test}</h1>
            </div>
            <div className="grid grid-cols-5 gap-3 mt-4">
              {questions.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentIndex(i)}
                  className={`flex h-10 w-full items-center justify-center rounded-xl text-xs font-black transition-all hover:scale-110 active:scale-90 ${i === currentIndex
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                    : answers[i] !== null
                      ? "bg-success/20 text-success border border-success/30"
                      : flagged.has(i)
                        ? "bg-warning/20 text-warning border border-warning/30"
                        : "bg-secondary/50 text-muted-foreground hover:bg-secondary"
                    }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            <div className="mt-8 pt-6 border-t border-border/50 space-y-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              <div className="flex items-center gap-3">
                <span className="h-2 w-2 rounded-full bg-success shadow-[0_0_8px_rgba(var(--success),0.5)]" /> Answered ({answers.filter((a) => a !== null).length})
              </div>
              <div className="flex items-center gap-3">
                <span className="h-2 w-2 rounded-full bg-warning shadow-[0_0_8px_rgba(var(--warning),0.5)]" /> Flagged ({flagged.size})
              </div>
              <div className="flex items-center gap-3">
                <span className="h-2 w-2 rounded-full bg-muted-foreground" /> Unanswered ({answers.filter((a) => a === null).length})
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default MockTest;
