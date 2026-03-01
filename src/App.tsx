import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Shield } from "lucide-react";
import { AuthProvider, ProtectedRoute } from "./components/AuthProvider";
import { useAuth } from "./components/AuthProvider";
import { SettingsProvider, useSettings } from "./components/SettingsProvider";
import { FocusProvider } from "./components/FocusProvider";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import DailyQuiz from "./pages/DailyQuiz";
import MockTest from "./pages/MockTest";
import Analytics from "./pages/Analytics";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import Review from "./pages/Review";
import Admin from "./pages/Admin";
import CustomTest from "./pages/CustomTest";
import NotFound from "./pages/NotFound";
import ExamArena from "./pages/ExamArena";
import ExamSession from "./pages/ExamSession";
import ExamResults from "./pages/ExamResults";

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

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <SettingsProvider>
          <FocusProvider>
            <MaintenanceGuard>
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
                <Route path="*" element={<NotFound />} />
              </Routes>
            </MaintenanceGuard>
            <Toaster />
          </FocusProvider>
        </SettingsProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
