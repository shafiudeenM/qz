import { supabase } from "./supabase";
import { toast } from "sonner";
import { type Question, type DatabaseQuestion } from "@/data/sampleQuestions";
import { processAnswer } from "./sr";

const ONBOARDING_QUESTION_THRESHOLD = 20;
const ONBOARDING_DAYS_THRESHOLD = 3;

export interface FilterOptions {
    topic?: string | string[];
    topics?: string[]; // Consistency
    difficulty?: number | number[];
    difficulties?: number[]; // Consistency
    year?: number | number[];
    years?: number[]; // Consistency
    limit?: number;
    lang?: "en" | "ta" | "hi";
}

export const getTopicDisplayName = (topicId: string) => {
    if (!topicId) return "General";
    return topicId
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};

export const mapDatabaseQuestionToApp = (dbQ: any, lang: "en" | "ta" | "hi" = "en"): Question => {
    // Determine which fields to use based on primary language
    const isTamil = lang === "ta";
    const isHindi = lang === "hi";

    let rawOptions = dbQ.options || dbQ.res_options;
    if (isTamil && (dbQ.options_ta || dbQ.res_options_ta)) rawOptions = dbQ.options_ta || dbQ.res_options_ta;
    if (isHindi && (dbQ.options_hi || dbQ.res_options_hi)) rawOptions = dbQ.options_hi || dbQ.res_options_hi;

    let questionText = dbQ.question_text || dbQ.res_question_text;
    if (isTamil && (dbQ.question_text_ta || dbQ.res_question_text_ta)) questionText = dbQ.question_text_ta || dbQ.res_question_text_ta;
    if (isHindi && (dbQ.question_text_hi || dbQ.res_question_text_hi)) questionText = dbQ.question_text_hi || dbQ.res_question_text_hi;

    let explanation = dbQ.explanation || dbQ.res_explanation;
    if (isTamil && (dbQ.explanation_ta || dbQ.res_explanation_ta)) explanation = dbQ.explanation_ta || dbQ.res_explanation_ta;
    if (isHindi && (dbQ.explanation_hi || dbQ.res_explanation_hi)) explanation = dbQ.explanation_hi || dbQ.res_explanation_hi;

    // Helper to process options from JSONB
    const processOptions = (raw: any): string[] => {
        if (Array.isArray(raw)) return raw;
        if (typeof raw === 'object' && raw !== null) return Object.values(raw) as string[];
        return [];
    };

    return {
        id: (dbQ.id || dbQ.res_id || 0).toString(),
        text: questionText || "No question text.",
        text_ta: dbQ.question_text_ta || dbQ.res_question_text_ta, // Preserve for Dual Mode
        topic: dbQ.topic_id || dbQ.res_topic_id || dbQ.topic || "General",
        options: processOptions(rawOptions),
        options_ta: processOptions(dbQ.options_ta || dbQ.res_options_ta), // Preserve for Dual Mode
        correctAnswer: dbQ.correct_option_index !== undefined ? dbQ.correct_option_index : dbQ.res_correct_option_index,
        explanation: explanation || "No explanation provided.",
        explanation_ta: dbQ.explanation_ta || dbQ.res_explanation_ta, // Preserve for Dual Mode
        difficulty: dbQ.difficulty_weight || dbQ.res_difficulty_weight || dbQ.difficulty_level || 2,
        examYear: dbQ.exam_year?.toString() || dbQ.res_exam_year?.toString() || dbQ.year?.toString() || "N/A",
        source: dbQ.exam_name || dbQ.res_exam_name || dbQ.exam || "TNPSC",
    };
};

export const fetchDailyQuestions = async (limit: number = 5, lang: "en" | "ta" | "hi" = "en"): Promise<Question[]> => {
    const { data, error } = await supabase
        .from("final_questions_v2")
        .select("*")
        .limit(limit);

    if (error) {
        console.error("Error fetching questions:", error);
        throw error;
    }

    return (data as DatabaseQuestion[]).map(q => mapDatabaseQuestionToApp(q, lang));
};

// ✅ FIX 4: Mock Test is now FULLY SEPARATED from adaptive/SR logic.
// Rules: Exclude ALL questions attempted in last 24h (correct OR incorrect).
// No SM-2 priority. Pure random simulation to replicate real exam conditions.
import { RANDOM_MOCK_CONFIG, type ExamConfig, type ExamSection } from "./examConfig";

export const fetchMockTestQuestions = async (limit: number = 20, lang: "en" | "ta" | "hi" = "en"): Promise<Question[]> => {
    // ✅ V5: Now follows official syllabus weightage even for "Random" mock
    // Using RANDOM_MOCK_CONFIG (10 Tamil, 7 GS, 3 Aptitude)
    return fetchWeightedExamQuestions(RANDOM_MOCK_CONFIG, lang);
};

export interface QuizSessionData {
    quiz_title: string;
    total_questions: number;
    score: number;
    potential_score: number;
    subject?: string;
    quiz_snapshot: any;
    answers_snapshot: any;
    user_id?: string;
    average_response_time?: number; // In ms
    time_snapshot?: number[]; // In ms, per question
}

export const saveQuizSession = async (sessionData: QuizSessionData) => {
    const { data: { user } } = await supabase.auth.getUser();
    const finalUserId = sessionData.user_id || user?.id;

    if (!finalUserId) {
        console.warn("No user ID found, quiz session will not be saved.");
        return null;
    }

    const { data, error } = await supabase
        .from("quiz_sessions")
        .insert([{
            ...sessionData,
            user_id: finalUserId,
            created_at: new Date().toISOString(),
        }])
        .select()
        .single();

    if (error) {
        console.error("Error saving quiz session:", error);
        throw error;
    }
    return data;
};

export const fetchUserSessions = async (limit: number = 20) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
        .from("quiz_sessions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(limit);

    if (error) {
        console.error("Error fetching user sessions:", error);
        throw error;
    }

    return data;
};

export const updateQuestionMastery = async (
    questionId: number,
    isCorrect: boolean,
    lastMode: 'daily' | 'mock' | 'review' | 'custom' | 'urgent' | 'weak' | 'power' = 'daily',
    responseTimeMs?: number
) => {
    // ✅ V6: Unified, Resilient RPC with partition support and optimized SM-2.
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            console.error("Mastery Update: Not authenticated");
            toast.error("Not logged in. Progress won't be saved.");
            return;
        }

        console.log(`📡 Syncing Q#${questionId} as User: ${user.id}`);

        const { error } = await supabase.rpc('update_question_mastery_v6', {
            p_question_id: questionId,
            p_is_correct: isCorrect,
            p_mode: lastMode,
            p_response_time: responseTimeMs
        });

        if (error) {
            console.warn("Mastery RPC v6 Failed, trying v5 fallback...", error);
            const { error: v5Error } = await supabase.rpc('update_question_mastery_v5', {
                p_question_id: questionId,
                p_is_correct: isCorrect,
                p_mode: lastMode,
                p_response_time: responseTimeMs
            });

            if (v5Error) {
                console.error("Mastery RPC Fallback also failed:", v5Error);
                toast.error(`Sync Failed: ${v5Error.message}`);
                return;
            }
        }
        
        toast.info(isCorrect ? "✅ Mastery Boosted" : "📉 Mastery Adjusted");
        console.log(`✅ Mastery updated for Q#${questionId}`);
    } catch (err: any) {
        console.error("Mastery Update Exception:", err);
        toast.error(`Sync Error: ${err.message}`);
    }
};

export const fetchReviewQuestions = async (limit: number = 10, lang: "en" | "ta" | "hi" = "en", mode: "review" | "urgent" | "weak" | "power" = "review") => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    let query = supabase
        .from("user_question_stats")
        .select("question_id")
        .eq("user_id", user.id);

    if (mode === 'urgent') {
        // ✅ NEW: Show ALL questions failed in the last 24 hours immediately.
        // Bypassing next_review constraint for Urgent mode so users can fix mistakes right away.
        query = query
            .gte("last_attempt", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
            .lt("ease_factor", 2.5); // 2.5 is default. Any failure drops it below this.
    } else if (mode === 'weak') {
        // Lowest ease factors
        query = query.order("ease_factor", { ascending: true });
    } else if (mode === 'power') {
        // Random reviews (regardless of next_review) or very soon due
        query = query.order("last_attempt", { ascending: true });
    } else {
        // Standard review
        query = query.lte("next_review", new Date().toISOString());
    }

    const { data: stats, error: statsError } = await query.limit(limit);

    if (statsError || !stats || stats.length === 0) return [];

    const questionIds = stats.map(s => s.question_id);

    // Fetch the actual questions
    const { data: questions, error: qError } = await supabase
        .from("final_questions_v2")
        .select("*")
        .in("id", questionIds);

    if (qError) {
        console.error("Error fetching review questions:", qError);
        throw qError;
    }

    const mapped = (questions as DatabaseQuestion[]).map(q => mapDatabaseQuestionToApp(q, lang));
    // Shuffle if it's power mode or standard
    if (mode === 'power' || mode === 'review') {
        return mapped.sort(() => Math.random() - 0.5);
    }
    return mapped;
};

export const bulkIngestQuestions = async (questions: any[]) => {
    const { data, error } = await supabase
        .from("final_questions_v2")
        .insert(questions);

    if (error) {
        console.error("Error batch ingesting questions:", error);
        throw error;
    }

    return data;
};

export const calculateStreak = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return 0;

    const { data: sessions, error } = await supabase
        .from("quiz_sessions")
        .select("created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

    if (error || !sessions || sessions.length === 0) return 0;

    // Get unique dates in local format (YYYY-MM-DD)
    const uniqueDays = Array.from(new Set(sessions.map(s => {
        const date = new Date(s.created_at);
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    })));

    if (uniqueDays.length === 0) return 0;

    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterday = `${yesterdayDate.getFullYear()}-${String(yesterdayDate.getMonth() + 1).padStart(2, '0')}-${String(yesterdayDate.getDate()).padStart(2, '0')}`;

    // If latest session is not today AND not yesterday, streak is broken
    if (uniqueDays[0] !== today && uniqueDays[0] !== yesterday) {
        return 0;
    }

    let streak = 0;
    let expectedDate = new Date(uniqueDays[0]);

    for (let i = 0; i < uniqueDays.length; i++) {
        const sessionDate = new Date(uniqueDays[i]);

        // Check if this date matches the expected date in the sequence
        const expectedDateStr = `${expectedDate.getFullYear()}-${String(expectedDate.getMonth() + 1).padStart(2, '0')}-${String(expectedDate.getDate()).padStart(2, '0')}`;

        if (uniqueDays[i] === expectedDateStr) {
            streak++;
            // Move expected date back by 1 day
            expectedDate.setDate(expectedDate.getDate() - 1);
        } else {
            // Gap found
            break;
        }
    }

    return streak;
};

export const toggleSaveQuestion = async (questionId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;
    const qId = parseInt(questionId);

    const { data } = await supabase
        .from("saved_questions")
        .select("id")
        .eq("user_id", user.id)
        .eq("question_id", qId)
        .maybeSingle();

    if (data) {
        await supabase
            .from("saved_questions")
            .delete()
            .eq("user_id", user.id)
            .eq("question_id", qId);
        return false;
    } else {
        await supabase
            .from("saved_questions")
            .insert([{ user_id: user.id, question_id: qId }]);
        return true;
    }
};

export const fetchSavedQuestions = async (lang: "en" | "ta" | "hi" = "en") => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
        .from("saved_questions")
        .select(`
            question_id,
            final_questions_v2 (*)
        `)
        .eq("user_id", user.id);

    if (error) {
        console.error("Error fetching saved questions:", error);
        return [];
    }

    return (data.map(item => item.final_questions_v2) as any as DatabaseQuestion[])
        .filter(Boolean)
        .map(q => mapDatabaseQuestionToApp(q, lang));
};

export const reportQuestion = async (questionId: string, reason: string, details: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase
        .from("question_reports")
        .insert([{
            user_id: user?.id,
            question_id: parseInt(questionId),
            reason,
            details
        }]);

    if (error) {
        console.error("Error reporting question:", error);
        throw error;
    }
};

// ✅ FIX 3: Topic density cap — max 2 questions from same topic per session
// Added Thin Pool Guard: If total candidates < 15, ignore the cap to prevent empty sessions.
const enforceTopicDensityCap = (questions: any[], limit: number, maxPerTopic = 2): any[] => {
    if (questions.length < 15) return questions.slice(0, limit);

    const topicCount: Record<string, number> = {};
    return questions.filter(q => {
        const topic = q.topic || 'unknown';
        topicCount[topic] = (topicCount[topic] || 0) + 1;
        return topicCount[topic] <= maxPerTopic;
    }).slice(0, limit);
};

export const fetchLeaderboard = async (district?: string) => {
    // Upgraded: Rank by Total XP (Profile) instead of single session score
    let query = supabase
        .from("profiles")
        .select(`
            full_name,
            avatar_url,
            xp,
            district
        `);

    if (district) {
        query = query.eq("district", district);
    }

    const { data, error } = await query
        .order("xp", { ascending: false })
        .limit(10);

    if (error) {
        console.error("Error fetching leaderboard:", error);
        return [];
    }

    return data.map((item: any) => ({
        name: item.full_name || "Anonymous",
        score: item.xp || 0,
        avatar: item.avatar_url,
        district: item.district
    }));
};

export const fetchCustomQuestions = async (options: FilterOptions): Promise<Question[]> => {
    try {
        // ✅ V5: Support arrays for multi-select
        const p_topics = Array.isArray(options.topics) ? options.topics :
            (options.topic && options.topic !== "All" ? [options.topic] : null);

        const p_years = Array.isArray(options.years) ? options.years :
            (typeof options.year === 'number' && options.year > 0 ? [options.year] : null);

        const p_difficulties = Array.isArray(options.difficulties) ? options.difficulties :
            (typeof options.difficulty === 'number' && options.difficulty > 0 ? [options.difficulty] : null);

        const { data, error } = await supabase.rpc('get_random_questions_v5', {
            p_limit: options.limit || 10,
            p_topics,
            p_years,
            p_difficulties,
            p_excluded_uids: []
        });

        if (error || !data) {
            console.error("Error fetching custom questions (RPC V5):", error);
            throw error;
        }

        return (data as any[]).map(q => mapDatabaseQuestionToApp(q, options.lang || "en"));
    } catch (err) {
        console.error("fetchCustomQuestions failed:", err);
        throw err;
    }
};

export const fetchCustomQuestionCount = async (options: FilterOptions) => {
    try {
        const p_topics = Array.isArray(options.topics) ? options.topics :
            (options.topic && options.topic !== "All" ? [options.topic] : null);

        const p_years = Array.isArray(options.years) ? options.years :
            (typeof options.year === 'number' && options.year > 0 ? [options.year] : null);

        const p_difficulties = Array.isArray(options.difficulties) ? options.difficulties :
            (typeof options.difficulty === 'number' && options.difficulty > 0 ? [options.difficulty] : null);

        const { data, error } = await supabase.rpc('get_custom_question_count_v2', {
            p_topics,
            p_years,
            p_difficulties
        });

        if (error) {
            console.error("Error fetching custom question count (V2):", error);
            return 0;
        }

        return data as number;
    } catch (err) {
        console.error("fetchCustomQuestionCount failed:", err);
        return 0;
    }
};

export const fetchFilterMetadata = async () => {
    const { data, error } = await supabase.rpc('get_custom_filter_metadata');

    if (error || !data) {
        console.error("Error fetching filter metadata:", error);
        return { topics: [], years: [] };
    }

    return {
        topics: data.topics || [],
        years: data.years || []
    };
};

export const fetchReviewForecast = async () => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return [];

        const { data, error } = await supabase.rpc('get_review_forecast', {
            p_user_id: user.id
        });

        if (error) {
            console.error("Error fetching review forecast:", error);
            return [];
        }

        return data as { review_date: string; question_count: number }[];
    } catch (err) {
        console.error("fetchReviewForecast failed:", err);
        return [];
    }
};

export const fetchUrgentCount = async () => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return 0;

        const { count, error } = await supabase
            .from("user_question_stats")
            .select("*", { count: 'exact', head: true })
            .eq("user_id", user.id)
            .gte("last_attempt", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
            .lt("ease_factor", 2.5);

        if (error) throw error;
        return count || 0;
    } catch (err) {
        console.error("fetchUrgentCount failed:", err);
        return 0;
    }
};

/**
 * Fetches total unique questions needing attention (Due OR Urgent)
 */
export const fetchTotalReviewCount = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return 0;

    const now = new Date().toISOString();
    const urgentThreshold = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    try {
        const { count, error } = await supabase
            .from("user_question_stats")
            .select("*", { count: 'exact', head: true })
            .eq("user_id", user.id)
            .or(`next_review.lte.${now},and(last_attempt.gte.${urgentThreshold},ease_factor.lt.2.5)`);

        if (error) throw error;
        return count || 0;
    } catch (error) {
        console.error("Error fetching total review count:", error);
        return 0;
    }
};

export const fetchMasteryHeatmap = async () => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return [];

        const { data, error } = await supabase.rpc('get_topic_mastery_heatmap', {
            p_user_id: user.id
        });

        if (error) {
            console.error("Error fetching mastery heatmap:", error);
            return [];
        }

        return data as {
            topic_id: string;
            avg_mastery_level: number;
            avg_ease_factor: number;
            due_count: number;
            total_count: number;
        }[];
    } catch (err) {
        console.error("fetchMasteryHeatmap failed:", err);
        return [];
    }
};

export const updateMasteryStatus = async (questionId: number, status: { is_retired?: boolean; is_pinned?: boolean }) => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { error } = await supabase
            .from('user_question_stats')
            .update(status)
            .eq('user_id', user.id)
            .eq('question_id', questionId);

        if (error) throw error;
    } catch (err) {
        console.error("updateMasteryStatus failed:", err);
        throw err;
    }
};

export const fetchDiagnosticQuestions = async (limit: number = 10, lang: "en" | "ta" | "hi" = "en"): Promise<Question[]> => {
    // Force Level 1 (Easy) for diagnostic phase
    const { data, error } = await supabase
        .from("final_questions_v2")
        .select("*")
        .eq("difficulty_weight", 1)
        .limit(limit);

    if (error) {
        console.error("Error fetching diagnostic questions:", error);
        return fetchDailyQuestions(limit, lang);
    }

    return (data as DatabaseQuestion[]).map(q => mapDatabaseQuestionToApp(q, lang));
};

// ✅ FIX 5: Repetition rate metric — warns if >20% of selected questions were seen in last 5 days
const logRepetitionRate = (selectedIds: number[], recentIds: Set<number>) => {
    const repeated = selectedIds.filter(id => recentIds.has(id)).length;
    const rate = Math.round((repeated / selectedIds.length) * 100);
    if (rate > 20) {
        console.warn(`[SR Warning] High repetition rate: ${rate}% of session questions seen in last 5 days.`);
    }
};

// ✅ V4 (PRODUCT-2): Uses SETOF final_questions_v2 RPC — zero type mismatch possible.
// Parameters: user_uuid, limit_count (matches PRODUCT2_HARDENING.sql exactly).
export const fetchAdaptiveQuestions = async (limit: number = 5, lang: "en" | "ta" | "hi" = "en"): Promise<Question[]> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return fetchDiagnosticQuestions(limit, lang);

    try {
        // SETOF RPC: now v3 using optimized sampling
        const { data: rpcData, error: rpcError } = await supabase.rpc('fetch_adaptive_questions_v2', {
            u_id: user.id,
            q_limit: limit
        });

        if (rpcError) {
            console.warn("[Adaptive] RPC failed, falling back to simple random fetch.", rpcError);
            throw rpcError;
        }

        // SETOF returns actual column names directly — no res_* remapping needed
        return (rpcData as any[]).map(q => mapDatabaseQuestionToApp(q, lang));

    } catch (err) {
        // Fallback: simple anti-repeat random fetch
        const twentyFourHoursAgo = new Date();
        twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

        const { data: recentStats } = await supabase
            .from("user_question_stats")
            .select("question_id")
            .eq("user_id", user.id)
            .gte("last_attempt", twentyFourHoursAgo.toISOString());

        const excludedIds = recentStats?.map(s => s.question_id) || [];

        const { data: fallbackQuestions } = await supabase
            .from("final_questions_v2")
            .select("*")
            .eq("is_active", true)
            .not("id", "in", `(${excludedIds.join(",") || "0"})`)
            .limit(limit);

        return (fallbackQuestions as any[] || []).map(q => mapDatabaseQuestionToApp(q, lang));
    }
};



// ─── Exam Arena: Weighted Question Fetcher ────────────────────────────────────

/**
 * Fetch weighted questions for a full TNPSC exam from final_questions_v2.
 * Fetches each section's count using topic_id and exam_applicable filters.
 */
export const fetchWeightedExamQuestions = async (
    config: ExamConfig,
    lang: "en" | "ta" | "hi" = "en"
): Promise<Question[]> => {
    const allQuestions: Question[] = [];

    for (const section of config.sections) {
        const sectionQuestions = await fetchSectionQuestions(
            section,
            config.group,
            lang
        );
        allQuestions.push(...sectionQuestions);
    }

    return allQuestions;
};

const fetchSectionQuestions = async (
    section: ExamSection,
    examGroup: string,
    lang: "en" | "ta" | "hi"
): Promise<Question[]> => {
    try {
        // Map examGroup to database exam_pattern
        const patternMap: Record<string, string> = {
            'G4': 'TNPSC_GROUP4',
            'G2': 'TNPSC_GROUP2',
            'G1': 'TNPSC_GROUP1'
        };

        const pattern = patternMap[examGroup] || 'TNPSC_GROUP4';

        // ✅ V4: Optimized ID-range sampling with dynamic pattern
        const { data, error } = await supabase.rpc('get_random_questions_v4', {
            p_limit: section.questionCount,
            p_topics: section.topicIds,
            p_exam_pattern: pattern
        });

        if (error || !data || data.length === 0) {
            console.warn(`[ExamArena] No questions for section "${section.name}" (${section.id}) using pattern ${pattern}. Error:`, error);

            // Fallback: Try without pattern if pattern-specific fetch fails
            const { data: fallback } = await supabase.rpc('get_random_questions_v4', {
                p_limit: section.questionCount,
                p_topics: section.topicIds,
                p_exam_pattern: null
            });

            if (fallback && fallback.length > 0) {
                return (fallback as any[]).map(q => mapDatabaseQuestionToApp(q, lang));
            }

            return [];
        }

        return (data as any[]).map(q => mapDatabaseQuestionToApp(q, lang));
    } catch (err) {
        console.error(`[ExamArena] Failed to fetch section "${section.id}":`, err);
        return [];
    }
};

// ─── PYQ Intelligence Engine ──────────────────────────────────────────────────

export const fetchTopicWeightage = async (examGroup: string = 'G4') => {
    const { data, error } = await supabase.rpc('get_topic_weightage', {
        target_exam: examGroup
    });
    if (error) {
        console.error("Error fetching topic weightage:", error);
        return [];
    }
    return data;
};

export const fetchTopicTrends = async () => {
    const { data, error } = await supabase.rpc('get_topic_trends');
    if (error) {
        console.error("Error fetching topic trends:", error);
        return [];
    }
    return data;
};

export const fetchProbabilityHeatmap = async () => {
    const { data, error } = await supabase.rpc('get_probability_heatmap');
    if (error) {
        console.error("Error fetching probability heatmap:", error);
        return [];
    }
    return data;
};

/**
 * Fetch questions for a custom syllabus-based test.
 * Randomly picks from specified topics across any exam group.
 */
export const fetchCustomSyllabusQuestions = async (
    topicIds: string[],
    limit: number = 20,
    lang: "en" | "ta" | "hi" = "en"
): Promise<Question[]> => {
    try {
        const { data, error } = await supabase.rpc('get_random_questions_v3', {
            p_limit: limit,
            p_topics: topicIds,
            p_exam: 'ANY' // Backend should handle 'ANY' as ignoring the exam filter
        });

        if (error || !data) {
            console.error("Error fetching custom syllabus questions:", error);
            return [];
        }

        let questions = (data as any[]).map(q => mapDatabaseQuestionToApp(q, lang));

        // ✅ Robustness: If selected topics have < limit questions, backfill from the global pool
        if (questions.length < limit) {
            const { data: extraData } = await supabase.rpc('get_random_questions_v3', {
                p_limit: limit - questions.length,
                p_excluded_ids: questions.map(q => parseInt(q.id)),
                p_exam: 'ANY'
            });
            if (extraData) {
                questions.push(...(extraData as any[]).map(q => mapDatabaseQuestionToApp(q, lang)));
            }
        }

        return questions;
    } catch (err) {
        console.error("Failed to fetch custom syllabus questions:", err);
        return [];
    }
};

/**
 * Fetch personalized weakness radar data for the current user.
 * Combines user mastery with global selection probability.
 */
export const fetchUserWeaknessRadar = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
        .from('user_weakness_radar')
        .select('*')
        .eq('user_id', user.id)
        .limit(6);

    if (error) {
        console.error("Error fetching weakness radar:", error);
        return [];
    }
    return data;
};
