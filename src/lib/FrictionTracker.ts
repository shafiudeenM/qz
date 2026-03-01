import { supabase } from "./supabase";

export type FrictionEventType =
    | "MOCK_ABANDONED"
    | "QUIZ_ABANDONED"
    | "TIME_FATIGUE"
    | "ONBOARDING_DROP"
    | "STREAK_LOST_WARNING";

export interface FrictionEvent {
    event_type: FrictionEventType;
    user_id?: string;
    metadata: Record<string, any>;
}

export const logFrictionEvent = async (event: FrictionEvent) => {
    try {
        const { data: { user } } = await supabase.auth.getUser();

        const payload = {
            ...event,
            user_id: user?.id || null,
            created_at: new Date().toISOString()
        };

        // We use a dedicated table for friction events
        // If the table doesn't exist, this will fail gracefully but log to console for dev
        const { error } = await supabase
            .from("friction_analytics")
            .insert(payload);

        if (error) {
            console.warn("Friction tracking error (ignore if table not migrated yet):", error);
            // Fallback: local session storage for offline/temp analysis
            const localEvents = JSON.parse(localStorage.getItem("friction_events") || "[]");
            localEvents.push(payload);
            localStorage.setItem("friction_events", JSON.stringify(localEvents.slice(-50)));
        }
    } catch (err) {
        console.error("Critical error in FrictionTracker:", err);
    }
};

/**
 * Tracks time spent per question to detect fatigue.
 * If time exceeds 3x the median (e.g., > 120s for a standard question), it marks fatigue.
 */
export const checkTimeFatigue = (seconds: number, averageSeconds: number = 30) => {
    if (seconds > averageSeconds * 4) {
        logFrictionEvent({
            event_type: "TIME_FATIGUE",
            metadata: {
                seconds_spent: seconds,
                threshold: averageSeconds * 4,
                timestamp: new Date().toISOString()
            }
        });
        return true;
    }
    return false;
};
