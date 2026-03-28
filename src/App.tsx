import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Shield, Loader2 } from "lucide-react";
import { AuthProvider, ProtectedRoute } from "./components/AuthProvider";
import { useAuth } from "./components/AuthProvider";
import { SettingsProvider, useSettings } from "./components/SettingsProvider";
import { FocusProvider } from "./components/FocusProvider";

import ReloadPrompt from "./components/ReloadPrompt";

const Auth = lazy(() => import("./pages/Auth"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const DailyQuiz = lazy(() => import("./pages/DailyQuiz"));
const MockTest = lazy(() => import("./pages/MockTest"));
const Analytics = lazy(() => import("./pages/Analytics"));
const Profile = lazy(() => import("./pages/Profile"));
const Settings = lazy(() => import("./pages/Settings"));
const Review = lazy(() => import("./pages/Review"));
const Admin = lazy(() => import("./pages/Admin"));
const CustomTest = lazy(() => import("./pages/CustomTest"));
const NotFound = lazy(() => import("./pages/NotFound"));
const ExamArena = lazy(() => import("./pages/ExamArena"));
const ExamSession = lazy(() => import("./pages/ExamSession"));
const ExamResults = lazy(() => import("./pages/ExamResults"));
const PYQDashboard = lazy(() => import("./pages/PYQDashboard"));
const SubjectDrilldown = lazy(() => import("./pages/SubjectDrilldown"));
const ConceptDetail = lazy(() => import("./pages/ConceptDetail"));
const QuestionDetail = lazy(() => import("./pages/QuestionDetail"));
const AdminPanel = lazy(() => import("./pages/AdminPanel"));
const AdvancedAnalytics = lazy(() => import("./pages/AdvancedAnalytics"));
const PYQIntelligence = lazy(() => import("./pages/PYQIntelligence"));
const LeaderboardPage = lazy(() => import("./pages/Leaderboard"));
const ReviewCenter = lazy(() => import("./pages/ReviewCenter"));

const queryClient = new QueryClient();

const MaintenanceGuard = ({ children }: { children: React.ReactNode }) => {
  const { settings } = useSettings();
  const { role, user } = useAuth();

  if (settings.maintenance_mode && role !== "admin" && user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 text-center">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
          <Shield className="h-10 w-10 text-destructive animate-pulse" />
        </div>
        <h1 className="mb-2 text-4xl font-black uppercase tracking-tighter">Platform Lockdown</h1>
        <p className="max-w-md text-muted-foreground">
          The அறிவு engine is currently undergoing a scheduled God-Mode upgrade.
          Please check back in a few minutes.
        </p>
        <div className="mt-8 text-[10px] font-black uppercase tracking-[0.3em] text-destructive/40">
          Admin Override Required
        </div>
      </div>
    );
  }
  return <>{children}</>;
};

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ReloadPrompt />
    <TooltipProvider>
      <AuthProvider>
        <SettingsProvider>
          <FocusProvider>
            <MaintenanceGuard>
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route
                    path="/dashboard"
                    element={
                      <ProtectedRoute>
                        <Dashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/quiz"
                    element={
                      <ProtectedRoute>
                        <DailyQuiz />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/mock-test"
                    element={
                      <ProtectedRoute>
                        <MockTest />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/exam-arena"
                    element={
                      <ProtectedRoute>
                        <ExamArena />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/exam-session"
                    element={
                      <ProtectedRoute>
                        <ExamSession />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/exam-results"
                    element={
                      <ProtectedRoute>
                        <ExamResults />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/custom-test"
                    element={
                      <ProtectedRoute>
                        <CustomTest />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/review-center"
                    element={
                      <ProtectedRoute>
                        <ReviewCenter />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/review"
                    element={
                      <ProtectedRoute>
                        <Review />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/analytics"
                    element={
                      <ProtectedRoute>
                        <Analytics />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/profile"
                    element={
                      <ProtectedRoute>
                        <Profile />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/settings"
                    element={
                      <ProtectedRoute>
                        <Settings />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin"
                    element={
                      <ProtectedRoute>
                        <Admin />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/pyq-intelligence"
                    element={
                      <ProtectedRoute>
                        <PYQDashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/subject-drilldown/:subjectName"
                    element={
                      <ProtectedRoute>
                        <SubjectDrilldown />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/concept-detail/:conceptId"
                    element={
                      <ProtectedRoute>
                        <ConceptDetail />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/question-detail/:questionId"
                    element={
                      <ProtectedRoute>
                        <QuestionDetail />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin-panel"
                    element={
                      <ProtectedRoute>
                        <AdminPanel />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/advanced-analytics"
                    element={
                      <ProtectedRoute>
                        <AdvancedAnalytics />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/pyq-legacy"
                    element={
                      <ProtectedRoute>
                        <PYQIntelligence />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/leaderboard"
                    element={
                      <ProtectedRoute>
                        <LeaderboardPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </MaintenanceGuard>
            <Toaster />
          </FocusProvider>
        </SettingsProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
