import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Zap, BarChart3, Brain, User, Settings, LogOut, Shield, Eye, EyeOff, Menu, X, Trophy } from "lucide-react";
import { useState, useEffect } from "react";
import { calculateStreak } from "@/lib/questions";
import { useAuth } from "./AuthProvider";
import { useFocus } from "./FocusProvider";
import { useSettings } from "./SettingsProvider";
import { translations } from "@/lib/translations";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

const navItems = [
  { id: "dashboard", label: "Dashboard", path: "/dashboard", icon: BarChart3 },
  { id: "daily_quiz", label: "Daily Quiz", path: "/quiz", icon: Zap },
  { id: "mock_test", label: "Mock Test", path: "/mock-test", icon: Brain },
  { id: "analytics", label: "Analytics", path: "/analytics", icon: BarChart3 },
  { id: "pyq_intelligence", label: "Intelligence", path: "/pyq-intelligence", icon: Zap },
  { id: "leaderboard", label: "Leaderboard", path: "/leaderboard", icon: Trophy },
];

const Header = () => {
  const { user, signOut, language, setLanguage, role, proxyUserId, setProxyUserId } = useAuth();
  const { settings } = useSettings();
  const { isFocusMode, toggleFocusMode } = useFocus();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [streak, setStreak] = useState(0);
  const t = translations[language];

  useEffect(() => {
    if (user) {
      calculateStreak().then(setStreak);
    }
  }, [user]);

  if (isFocusMode && (location.pathname === "/quiz" || location.pathname === "/mock-test")) {
    return (
      <div className="fixed top-4 right-4 z-[100]">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleFocusMode}
          className="h-12 w-12 rounded-full border border-primary/20 bg-slate-900 shadow-xl hover:bg-slate-800"
        >
          <EyeOff className="h-5 w-5 text-primary" />
        </Button>
      </div>
    );
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
      {settings.enabled_features.includes("announcement") && settings.feature_names.announcement && (
        <div className="bg-primary px-4 py-2 text-center text-[10px] font-black uppercase tracking-[0.2em] text-primary-foreground animate-pulse-subtle">
          {settings.feature_names.announcement}
        </div>
      )}
      {proxyUserId && (
        <div className="bg-destructive px-4 py-2 text-center text-[10px] font-black uppercase tracking-[0.2em] text-destructive-foreground animate-pulse flex items-center justify-center gap-4">
          <span>SHADOWING USER ID: {proxyUserId}</span>
          <button
            onClick={() => setProxyUserId(null)}
            className="rounded border border-white/20 px-2 py-0.5 hover:bg-white/10"
          >
            EXIT SHADOW MODE
          </button>
        </div>
      )}
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl">
            <img src="/pwa-192.png" alt="அறிவு Logo" className="h-full w-full object-contain" />
          </div>
          <span className="text-xl font-black tracking-tighter text-foreground">
            அறிவு
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {navItems.filter(item => settings.enabled_features.includes(item.id)).map((item) => {
            const active = location.pathname === item.path;
            const label = settings.feature_names[item.id] || t[item.id as keyof typeof t] || item.label;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`relative flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${active
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
                  }`}
              >
                <item.icon className="h-4 w-4" />
                {label}
                {active && (
                  <motion.div
                    layoutId="active-nav"
                    className="absolute inset-0 rounded-lg bg-primary/10"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {user && (
            <>
              <div className="flex items-center gap-2 rounded-lg bg-secondary px-3 py-1.5 text-sm mr-2">
                <Zap className="h-4 w-4 text-primary" />
                <span className="font-semibold text-primary">{streak}</span>
                <span className="text-muted-foreground">{t.day_streak}</span>
              </div>
              <div className="flex h-9 items-center rounded-lg border bg-background p-1 mr-2">
                <button
                  onClick={() => setLanguage("en")}
                  className={`px-2 py-1 text-[10px] font-bold rounded-md transition-all ${language === "en" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                    }`}
                >
                  EN
                </button>
                <button
                  onClick={() => setLanguage("ta")}
                  className={`px-2 py-1 text-[10px] font-bold rounded-md transition-all ${language === "ta" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                    }`}
                >
                  தமிழ்
                </button>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleFocusMode}
                title="Toggle Focus Mode"
                className="mr-2"
              >
                {isFocusMode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </>
          )}

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full bg-secondary p-0">
                  <User className="h-4 w-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{t.aspirant}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/profile">
                    <User className="mr-2 h-4 w-4" />
                    <span>{t.profile}</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/settings">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>{t.settings}</span>
                  </Link>
                </DropdownMenuItem>
                {role === "admin" && (
                  <DropdownMenuItem asChild>
                    <Link to="/admin" className="text-primary font-bold">
                      <Shield className="mr-2 h-4 w-4" />
                      <span>{t.admin_portal}</span>
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive focus:bg-destructive focus:text-destructive-foreground" onClick={signOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>{t.logout}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="default" size="sm" asChild>
              <Link to="/auth">Sign In</Link>
            </Button>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          className="flex h-9 w-9 items-center justify-center rounded-lg md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="border-t border-border bg-background p-4 md:hidden"
        >
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${location.pathname === item.path
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground"
                }`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </motion.div>
      )}
    </header>
  );
};

export default Header;
