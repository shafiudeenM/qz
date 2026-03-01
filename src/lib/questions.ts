import { supabase } from "./supabase";
import { type Question, type DatabaseQuestion } from "@/data/sampleQuestions";
import { processAnswer } from "./sr";

const ONBOARDING_QUESTION_THRESHOLD = 20;
const ONBOARDING_DAYS_THRESHOLD = 3;

export interface FilterOptions {
    topic?: string;
    difficulty?: number;
    year?: number;
    limit?: number;
    lang?: "en" | "ta" | "hi";
}

export const mapDatabaseQuestionToApp = (dbQ: DatabaseQuestion, lang: "en" | "ta" | "hi" = "en"): Question => {
    // Determine which fields to use based on language
    const isTamil = lang === "ta";
    const isHindi = lang === "hi";

    let rawOptions = dbQ.options;
    if (isTamil && dbQ.options_ta) rawOptions = dbQ.options_ta;
    if (isHindi && dbQ.options_hi) rawOptions = dbQ.options_hi;

    let questionText = dbQ.question_text;
    if (isTamil && dbQ.question_text_ta) questionText = dbQ.question_text_ta;
    if (isHindi && dbQ.question_text_hi) questionText = dbQ.question_text_hi;

    let explanation = dbQ.explanation;
    if (isTamil && dbQ.explanation_ta) explanation = dbQ.explanation_ta;
    if (isHindi && dbQ.explanation_hi) explanation = dbQ.explanation_hi;

    // Handle options which might be stored as a JSON object or string array in JSONB
    let options: string[] = [];
    if (Array.isArray(rawOptions)) {
        options = rawOptions;
    } else if (typeof rawOptions === 'object' && rawOptions !== null) {
        options = Object.values(rawOptions);
    }

    return {
        id: dbQ.id.toString(),
        text: (isTamil && dbQ.question_text_ta) ? dbQ.question_text_ta : dbQ.question_text,
        topic: dbQ.topic,
        options: options,
        correctAnswer: dbQ.correct_option_index,
        explanation: (isTamil && dbQ.explanation_ta) ? dbQ.explanation_ta : (dbQ.explanation || "No explanation provided."),
        difficulty: dbQ.difficulty_level || 1,
        examYear: dbQ.year?.toString() || "N/A",
        source: dbQ.exam || "TNPSC",
    };
};

export const fetchDailyQuestions = async (limit: number = 5, lang: "en" | "ta" | "hi" = "en"): Promise<Question[]> => {
    const { data, error } = await supabase
        .from("final_questions")
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
export const fetchMockTestQuestions = async (limit: number = 20, lang: "en" | "ta" | "hi" = "en"): Promise<Question[]> => {
    const { data: { user } } = await supabase.auth.getUser();

    let excludedIds: number[] = [];

    if (user) {
        // ✅ Exclude ANY question attempted in the last 24 hours (correct or incorrect)
        const twentyFourHoursAgo = new Date();
        twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

        const { data: recentData } = await supabase
            .from("user_question_stats")
            .select("question_id")
            .eq("user_id", user.id)
            .gte("last_attempt", twentyFourHoursAgo.toISOString());

        excludedIds = recentData?.map(d => d.question_id) || [];
    }

    // Pure random selection from full pool (ignoring SM-2 state entirely)
    let query = supabase.from("final_questions").select("*");
    if (excludedIds.length > 0) {
        query = query.not("id", "in", `(${excludedIds.join(',')})`);
    }

    const { data, error } = await query.limit(limit * 3); // fetch wider pool then shuffle
    if (error || !data) {
        console.error("Error fetching mock test questions:", error);
        return fetchDailyQuestions(limit, lang);
    }

    // Full shuffle — no ordering by SM-2 or next_review
    const shuffled = [...data].sort(() => Math.random() - 0.5).slice(0, limit);
    return (shuffled as DatabaseQuestion[]).map(q => mapDatabaseQuestionToApp(q, lang));
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
    lastMode: 'daily' | 'mock' | 'review' | 'custom' = 'daily'
) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // 1. Fetch current stats
    const { data: currentStats } = await supabase
        .from("user_question_stats")
        .select("interval, ease_factor, repetitions, total_attempts, total_correct")
        .eq("user_id", user.id)
        .eq("question_id", questionId)
        .maybeSingle();

    // 2. Calculate new stats
    const { interval, ease_factor, repetitions, total_attempts, total_correct } = processAnswer(isCorrect, currentStats || undefined);

    // 3. Calculate next_review
    const nextReview = new Date();
    if (isCorrect) {
        nextReview.setDate(nextReview.getDate() + interval);
    } else {
        // ✅ FIX 1: Wrong answer → 6-hour delay (not instant)
        nextReview.setHours(nextReview.getHours() + 6);
    }

    // 4. Calculate Cooldown
    let cooldownUntil: string | null = null;
    if (isCorrect) {
        const cooldownDays = lastMode === 'mock' ? 7 : 3;
        const cooldownDate = new Date();
        cooldownDate.setDate(cooldownDate.getDate() + cooldownDays);
        cooldownUntil = cooldownDate.toISOString();
    }

    // 5. Update user_question_stats
    const { error: statsError } = await supabase
        .from("user_question_stats")
        .upsert({
            user_id: user.id,
            question_id: questionId,
            interval,
            ease_factor,
            repetitions,
            total_attempts,
            total_correct,
            last_mode: lastMode === 'daily' ? 'quiz' : lastMode, // Map back to old column constraints if needed
            next_review: nextReview.toISOString(),
            last_attempt: new Date().toISOString(),
            cooldown_until: cooldownUntil
        }, { onConflict: 'user_id,question_id' });

    if (statsError) console.error("Error updating question mastery:", statsError);

    // 6. Fetch Topic & Log Granular Attempt (Product 3 Foundation)
    const { data: qData } = await supabase
        .from('final_questions')
        .select('topic')
        .eq('id', questionId)
        .single();

    if (qData?.topic) {
        // Log to question_attempts table
        await supabase.from('question_attempts').insert({
            user_id: user.id,
            question_id: questionId,
            topic_id: qData.topic,
            session_mode: lastMode,
            is_correct: isCorrect,
            attempted_at: new Date().toISOString()
        });

        // 7. Update topic mastery cache (for Dashboard analytics)
        await supabase.rpc('update_topic_mastery', {
            u_id: user.id,
            topic_name: qData.topic
        });
    }

    // 8. Award XP
    const xpToAdd = isCorrect ? 10 : 2;
    await supabase.rpc('increment_xp', { amount: xpToAdd });
};

export const fetchReviewQuestions = async (limit: number = 10, lang: "en" | "ta" | "hi" = "en") => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    // Fetch question IDs due for review
    const { data: stats, error: statsError } = await supabase
        .from("user_question_stats")
        .select("question_id")
        .eq("user_id", user.id)
        .lte("next_review", new Date().toISOString())
        .limit(limit);

    if (statsError || !stats || stats.length === 0) return [];

    const questionIds = stats.map(s => s.question_id);

    // Fetch the actual questions
    const { data: questions, error: qError } = await supabase
        .from("final_questions")
        .select("*")
        .in("id", questionIds);

    if (qError) {
        console.error("Error fetching review questions:", qError);
        throw qError;
    }

    return (questions as DatabaseQuestion[]).map(q => mapDatabaseQuestionToApp(q, lang));
};

export const bulkIngestQuestions = async (questions: any[]) => {
    const { data, error } = await supabase
        .from("final_questions")
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
            final_questions (*)
        `)
        .eq("user_id", user.id);

    if (error) {
        console.error("Error fetching saved questions:", error);
        return [];
    }

    return (data.map(item => item.final_questions) as any as DatabaseQuestion[])
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
    let query = supabase
        .from("final_questions")
        .select("*");

    if (options.topic && options.topic !== "All") {
        query = query.eq("topic", options.topic);
    }
    if (options.difficulty && options.difficulty > 0) {
        query = query.eq("difficulty_level", options.difficulty);
    }
    if (options.year && options.year > 0) {
        query = query.eq("year", options.year);
    }

    query = query.limit(options.limit || 10);

    const { data, error } = await query;

    if (error) {
        console.error("Error fetching custom questions:", error);
        throw error;
    }

    return (data as DatabaseQuestion[]).map(q => mapDatabaseQuestionToApp(q, options.lang || "en"));
};

export const fetchFilterMetadata = async () => {
    const { data: topicsData } = await supabase
        .from("final_questions")
        .select("topic");

    const { data: yearsData } = await supabase
        .from("final_questions")
        .select("year");

    const topics = Array.from(new Set(topicsData?.map(t => t.topic).filter(Boolean))) as string[];
    const years = Array.from(new Set(yearsData?.map(y => y.year).filter(Boolean))).sort((a: any, b: any) => b - a) as number[];

    return { topics, years };
};

export const fetchDiagnosticQuestions = async (limit: number = 10, lang: "en" | "ta" | "hi" = "en"): Promise<Question[]> => {
    // Force Level 1 (Easy) for diagnostic phase
    const { data, error } = await supabase
        .from("final_questions")
        .select("*")
        .eq("difficulty_level", 1)
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

// ✅ ROADMAP V3: High-Performance Selection Engine (Server-Side)
// Moves the logic from the browser to a Postgres RPC for 10x speed & lower latency.
export const fetchAdaptiveQuestions = async (limit: number = 5, lang: "en" | "ta" | "hi" = "en"): Promise<Question[]> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return fetchDiagnosticQuestions(limit, lang);

    try {
        // 1. Call the server-side selection engine (RPC)
        const { data: rpcData, error: rpcError } = await supabase.rpc('fetch_adaptive_questions_v2', {
            u_id: user.id,
            q_limit: limit
        });

        if (rpcError) {
            console.warn("[Scalability] RPC not found or failed, falling back to legacy client-side selection.", rpcError);
            throw rpcError;
        }

        // 2. Map unique RPC names back to DatabaseQuestion structure
        const mappedData = (rpcData as any[]).map(row => ({
            id: row.res_id,
            topic: row.res_topic,
            question_text: row.res_question_text,
            question_text_ta: row.res_question_text_ta,
            question_text_hi: row.res_question_text_hi,
            options: row.res_options,
            options_ta: row.res_options_ta,
            options_hi: row.res_options_hi,
            correct_option_index: row.res_correct_option_index,
            explanation: row.res_explanation,
            explanation_ta: row.res_explanation_ta,
            explanation_hi: row.res_explanation_hi,
            difficulty_level: row.res_difficulty_level,
            year: row.res_year,
            is_active: row.res_is_active,
            created_at: row.res_created_at,
            updated_at: row.res_updated_at,
            exam: row.res_exam || "TNPSC",
            subject: row.res_subject || ""
        }));

        return (mappedData as unknown as DatabaseQuestion[]).map(q => mapDatabaseQuestionToApp(q, lang));

    } catch (err) {
        // LEGACY FALLBACK: If RPC is not deployed yet, use the code below (client-side)
        const fiveDaysAgo = new Date();
        fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

        const { data: allStats } = await supabase
            .from("user_question_stats")
            .select("question_id, last_attempt")
            .eq("user_id", user.id)
            .gte("last_attempt", fiveDaysAgo.toISOString());

        // Simple random fallback for legacy mode
        const { data: fallbackQuestions } = await supabase
            .from("final_questions")
            .select("*")
            .limit(limit);

        return (fallbackQuestions as DatabaseQuestion[] || []).map(q => mapDatabaseQuestionToApp(q, lang));
    }
};

// ─── Exam Arena: Weighted Question Fetcher ────────────────────────────────────

import { type ExamConfig, type ExamSection } from "./examConfig";

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
        // Fetch more than needed so we can shuffle and pick the right count
        const fetchMultiplier = 3;
        const fetchLimit = section.questionCount * fetchMultiplier;

        const { data, error } = await supabase
            .from("final_questions_v2")
            .select("*")
            .in("topic_id", section.topicIds)
            .contains("exam_applicable", [examGroup])
            .eq("is_active", true)
            .limit(fetchLimit);

        if (error || !data || data.length === 0) {
            console.warn(`[ExamArena] No questions for section "${section.name}" (${section.id}). Error:`, error);
            return [];
        }

        // Shuffle and take exactly the required count
        const shuffled = [...data].sort(() => Math.random() - 0.5);
        const selected = shuffled.slice(0, section.questionCount);

        return selected.map(q => mapV2QuestionToApp(q, lang));
    } catch (err) {
        console.error(`[ExamArena] Failed to fetch section "${section.id}":`, err);
        return [];
    }
};

/** Map final_questions_v2 row to app Question type */
const mapV2QuestionToApp = (
    dbQ: Record<string, unknown>,
    lang: "en" | "ta" | "hi" = "en"
): Question => {
    const isTamil = lang === "ta";

    let rawOptions = dbQ.options as string[] | Record<string, string>;
    if (isTamil && dbQ.options_ta) rawOptions = dbQ.options_ta as string[] | Record<string, string>;

    let questionText = dbQ.question_text as string;
    if (isTamil && dbQ.question_text_ta) questionText = dbQ.question_text_ta as string;

    let explanation = dbQ.explanation as string || "No explanation provided.";
    if (isTamil && dbQ.explanation_ta) explanation = dbQ.explanation_ta as string;

    let options: string[] = [];
    if (Array.isArray(rawOptions)) options = rawOptions;
    else if (rawOptions && typeof rawOptions === "object") options = Object.values(rawOptions);

    return {
        id: String(dbQ.id),
        text: questionText,
        topic: (dbQ.topic_id as string) || "General",
        options,
        correctAnswer: dbQ.correct_option_index as number,
        explanation,
        difficulty: (dbQ.difficulty_weight as number) || 2,
        examYear: String(dbQ.exam_year || "N/A"),
        source: (dbQ.exam_name as string) || "TNPSC",
    };
};
