import React, { createContext, useContext, useEffect, useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Session, User } from "@supabase/supabase-js";
import { Loader2 } from "lucide-react";

interface AuthContextType {
    session: Session | null;
    user: User | null;
    signOut: () => Promise<void>;
    isLoading: boolean;
    language: "en" | "ta" | "hi";
    setLanguage: (lang: "en" | "ta" | "hi") => Promise<void>;
    role: string | null;
    isGuest: boolean;
    loginAsGuest: () => void;
    guestQuizCount: number;
    incrementGuestCount: () => void;
    proxyUserId: string | null;
    setProxyUserId: (id: string | null) => void;
    isDualMode: boolean;
    setDualMode: (val: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [language, setLanguageState] = useState<"en" | "ta" | "hi">("en");
    const [isLoading, setIsLoading] = useState(true);
    const [role, setRole] = useState<string | null>(null);
    const [isGuest, setIsGuest] = useState(false);
    const [guestQuizCount, setGuestQuizCount] = useState<number>(() => {
        const saved = localStorage.getItem("guest_quiz_count");
        return saved ? parseInt(saved, 10) : 0;
    });
    const [proxyUserId, setProxyUserId] = useState<string | null>(localStorage.getItem("shadow_user_id"));
    const [isDualMode, setIsDualModeState] = useState<boolean>(() => {
        return localStorage.getItem("is_dual_mode") === "true";
    });
    const navigate = useNavigate();

    const fetchProfile = async (userId: string) => {
        const { data, error } = await supabase
            .from("profiles")
            .select("language, role")
            .eq("id", userId)
            .single();

        if (data && !error) {
            setLanguageState(data.language as "en" | "ta" | "hi");
            setRole(data.role);
        }
    };

    useEffect(() => {
        // Check active sessions and sets the user
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user) {
                fetchProfile(session.user.id);
            }
            setIsLoading(false);
        });

        // Listen for changes on auth state (signed in, signed out, etc.)
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user) {
                setIsGuest(false);
                fetchProfile(session.user.id);
            } else {
                setLanguageState("en");
            }
            setIsLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    const signOut = async () => {
        await supabase.auth.signOut();
        setIsGuest(false);
        navigate("/auth");
    };

    const loginAsGuest = () => {
        setIsGuest(true);
        navigate("/dashboard");
    };

    const incrementGuestCount = () => {
        const newCount = guestQuizCount + 1;
        setGuestQuizCount(newCount);
        localStorage.setItem("guest_quiz_count", newCount.toString());
    };

    const setLanguage = async (lang: "en" | "ta" | "hi") => {
        setLanguageState(lang);
        if (user) {
            await supabase
                .from("profiles")
                .update({ language: lang })
                .eq("id", user.id);
        }
    };

    const handleSetProxyUserId = (id: string | null) => {
        if (role !== "admin") return;
        setProxyUserId(id);
        if (id) localStorage.setItem("shadow_user_id", id);
        else localStorage.removeItem("shadow_user_id");
        window.location.reload();
    };

    const setDualMode = (val: boolean) => {
        setIsDualModeState(val);
        localStorage.setItem("is_dual_mode", val.toString());
    };

    return (
        <AuthContext.Provider value={{
            session, user: proxyUserId && role === "admin" ? { ...user, id: proxyUserId } as User : user,
            signOut, isLoading, language, setLanguage, role, isGuest, loginAsGuest,
            guestQuizCount, incrementGuestCount, proxyUserId: role === "admin" ? proxyUserId : null,
            setProxyUserId: handleSetProxyUserId,
            isDualMode, setDualMode
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { session, isLoading, isGuest } = useAuth();

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!session && !isGuest) {
        return <Navigate to="/auth" replace />;
    }

    return <>{children}</>;
};
