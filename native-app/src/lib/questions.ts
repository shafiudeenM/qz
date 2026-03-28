import { supabase } from "./supabase";

export interface Question {
    id: string;
    text: string;
    text_ta?: string;
    topic: string;
    options: string[];
    options_ta?: string[];
    correctAnswer: number;
    explanation: string;
    explanation_ta?: string;
    difficulty: number;
    examYear: string;
    source: string;
}

export const mapDatabaseQuestionToApp = (dbQ: any, lang: "en" | "ta" | "hi" = "en"): Question => {
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

    const processOptions = (raw: any): string[] => {
        if (Array.isArray(raw)) return raw;
        if (typeof raw === 'object' && raw !== null) return Object.values(raw) as string[];
        return [];
    };

    return {
        id: dbQ.id.toString(),
        text: questionText || "No question text.",
        text_ta: dbQ.question_text_ta,
        topic: dbQ.topic_id || dbQ.topic || "General",
        options: processOptions(rawOptions),
        options_ta: processOptions(dbQ.options_ta),
        correctAnswer: dbQ.correct_option_index,
        explanation: explanation || "No explanation provided.",
        explanation_ta: dbQ.explanation_ta,
        difficulty: dbQ.difficulty_weight || dbQ.difficulty_level || 2,
        examYear: dbQ.exam_year?.toString() || dbQ.year?.toString() || "N/A",
        source: dbQ.exam_name || dbQ.exam || "TNPSC",
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

    return (data as any[]).map(q => mapDatabaseQuestionToApp(q, lang));
};

export const fetchAdaptiveQuestions = async (limit: number = 5, lang: "en" | "ta" | "hi" = "en"): Promise<Question[]> => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return fetchDailyQuestions(limit, lang);

        const { data: rpcData, error: rpcError } = await supabase.rpc('fetch_adaptive_questions_v2', {
            u_id: user.id,
            q_limit: limit
        });

        if (rpcError) throw rpcError;
        return (rpcData as any[]).map(q => mapDatabaseQuestionToApp(q, lang));

    } catch (err) {
        console.warn("[Adaptive Fallback]", err);
        return fetchDailyQuestions(limit, lang);
    }
};
