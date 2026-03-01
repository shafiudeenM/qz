export interface TopicMasteryStats {
    topic: string;
    masteryScore: number; // 0 to 100
    level: "Novice" | "Intermediate" | "Advanced" | "Expert";
    readiness: number; // 0 to 100
    priority: "High" | "Medium" | "Low";
}

export const calculateTopicMastery = (sessions: any[], topic: string): TopicMasteryStats => {
    // Filter sessions for the specific topic
    const topicSessions = sessions.filter(s => s.subject === topic || s.topic === topic);

    if (topicSessions.length === 0) {
        return {
            topic,
            masteryScore: 0,
            level: "Novice",
            readiness: 0,
            priority: "High"
        };
    }

    // Sort by recency (descending)
    const sortedSessions = [...topicSessions].sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    let totalWeightedScore = 0;
    let totalPossibleWeightedScore = 0;

    // Weighting parameters
    // Difficulty Weights: Easy=1, Medium=1.5, Hard=2
    // Recency Weights: Last 5 sessions = 2.0x, older sessions = 1.0x

    sortedSessions.forEach((session, index) => {
        const recencyWeight = index < 5 ? 2.0 : 1.0;
        const totalQ = session.total_questions || 5;
        const score = session.score || 0;

        // We estimate difficulty based on quiz_title or assume Medium (2) if not stored
        // In this app, many sessions are from Daily Quiz which is adaptive
        const difficultyWeight = session.difficulty === 1 ? 1.0 : session.difficulty === 3 ? 2.0 : 1.5;

        totalWeightedScore += (score * difficultyWeight * recencyWeight);
        totalPossibleWeightedScore += (totalQ * difficultyWeight * recencyWeight);
    });

    const masteryScore = Math.min(100, Math.round((totalWeightedScore / totalPossibleWeightedScore) * 100));

    // Determine Level
    let level: TopicMasteryStats["level"] = "Novice";
    if (masteryScore >= 85) level = "Expert";
    else if (masteryScore >= 70) level = "Advanced";
    else if (masteryScore >= 45) level = "Intermediate";

    // Readiness considers recency decay (if hasn't practiced for a while)
    const lastSessionDate = new Date(sortedSessions[0].created_at);
    const daysSinceLastSession = Math.floor((new Date().getTime() - lastSessionDate.getTime()) / 86400000);
    const decayFactor = Math.max(0.5, 1 - (daysSinceLastSession * 0.05)); // 5% decay per day after first day

    const readiness = Math.round(masteryScore * decayFactor);

    // Priority
    let priority: TopicMasteryStats["priority"] = "Low";
    if (readiness < 50) priority = "High";
    else if (readiness < 75) priority = "Medium";

    return {
        topic,
        masteryScore,
        level,
        readiness,
        priority
    };
};
