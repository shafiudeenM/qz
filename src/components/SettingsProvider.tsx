import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface AppSettings {
    app_name: string;
    primary_color: string;
    secondary_color: string;
    theme_mode: string;
    enabled_features: string[];
    feature_names: Record<string, string>;
    maintenance_mode: boolean;
    xp_multiplier: number;
}

const hexToHsl = (hex: string) => {
    // Remove the hash if it exists
    hex = hex.replace(/^#/, "");

    // Parse r, g, b
    let r = 0, g = 0, b = 0;
    if (hex.length === 3) {
        r = parseInt(hex[0] + hex[0], 16);
        g = parseInt(hex[1] + hex[1], 16);
        b = parseInt(hex[2] + hex[2], 16);
    } else if (hex.length === 6) {
        r = parseInt(hex.substring(0, 2), 16);
        g = parseInt(hex.substring(2, 4), 16);
        b = parseInt(hex.substring(4, 6), 16);
    } else {
        return "221.2 83.2% 53.3%"; // Default blue if invalid
    }

    r /= 255;
    g /= 255;
    b /= 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;

    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }

    return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
};

interface SettingsContextType {
    settings: AppSettings;
    updateSettings: (newSettings: Partial<AppSettings>) => Promise<void>;
    isLoading: boolean;
}

const defaultSettings: AppSettings = {
    app_name: "அறிவு",
    primary_color: "#f59e0b",
    secondary_color: "#64748b",
    theme_mode: "light",
    enabled_features: ["daily_quiz", "mock_test", "review", "leaderboard", "analytics", "pyq_intelligence"],
    feature_names: {
        daily_quiz: "Daily Quiz",
        mock_test: "Mock Test",
        review: "Review",
        leaderboard: "Leaderboard",
        analytics: "Analytics",
        pyq_intelligence: "PYQ Intelligence"
    },
    maintenance_mode: false,
    xp_multiplier: 1.0,
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [settings, setSettings] = useState<AppSettings>(defaultSettings);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const { data, error } = await supabase
                    .from("app_settings")
                    .select("*")
                    .eq("id", "global")
                    .maybeSingle();

                if (!error && data) {
                    setSettings(data);
                    // Apply colors to CSS Variables (Shadcn expects HSL values like "221.2 83.2% 53.3%")
                    document.documentElement.style.setProperty("--primary", hexToHsl(data.primary_color));
                    // Add a muted version for backgrounds
                    document.documentElement.style.setProperty("--primary-muted", `${data.primary_color}20`);
                }
            } catch (err) {
                console.error("Failed to load settings:", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchSettings();

        // Subscribe to changes
        const channel = supabase
            .channel("app_settings_changes")
            .on(
                "postgres_changes",
                { event: "UPDATE", schema: "public", table: "app_settings", filter: "id=eq.global" },
                (payload) => {
                    const newSettings = payload.new as AppSettings;
                    setSettings(newSettings);
                    document.documentElement.style.setProperty("--primary", hexToHsl(newSettings.primary_color));
                    if (newSettings.theme_mode === "dark") {
                        document.documentElement.classList.add("dark");
                    } else {
                        document.documentElement.classList.remove("dark");
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const updateSettings = async (newSettings: Partial<AppSettings>) => {
        const { error } = await supabase
            .from("app_settings")
            .update(newSettings)
            .eq("id", "global");

        if (error) throw error;
        setSettings((prev) => ({ ...prev, ...newSettings }));
    };

    useEffect(() => {
        if (settings.theme_mode === "dark") {
            document.documentElement.classList.add("dark");
        } else {
            document.documentElement.classList.remove("dark");
        }
    }, [settings.theme_mode]);

    return (
        <SettingsContext.Provider value={{ settings, updateSettings, isLoading }}>
            {children}
        </SettingsContext.Provider>
    );
};

export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (context === undefined) {
        throw new Error("useSettings must be used within a SettingsProvider");
    }
    return context;
};
