import { TopicMasteryStats } from "./mastery";

export interface StudyPlanItem {
    id: string;
    task: string;
    type: "Practice" | "Review" | "Mock" | "Focus";
    topic: string;
    duration: string;
    completed: boolean;
}

export const generateDailyStudyPlan = (masteryStats: TopicMasteryStats[]): StudyPlanItem[] => {
    const plan: StudyPlanItem[] = [];

    // 1. Sort masteryStats by Priority (High first), then by Readiness (Lowest first)
    const sortedStats = [...masteryStats].sort((a, b) => {
        const priorityScore = { "High": 3, "Medium": 2, "Low": 1 };
        if (priorityScore[a.priority] !== priorityScore[b.priority]) {
            return priorityScore[b.priority] - priorityScore[a.priority];
        }
        return a.readiness - b.readiness;
    });

    if (sortedStats.length === 0) {
        // Fallback for new users
        return [
            { id: "1", task: "Complete Diagnostic Quiz", type: "Focus", topic: "General", duration: "10 min", completed: false },
            { id: "2", task: "Review 5 Sample Questions", type: "Review", topic: "Mixed", duration: "5 min", completed: false },
            { id: "3", task: "Set a Study Goal", type: "Focus", topic: "Planning", duration: "2 min", completed: false },
        ];
    }

    // Rule-Based Selection

    // Item 1: Critical Focus (Highest priority weakness)
    const critical = sortedStats[0];
    plan.push({
        id: "1",
        task: `Practice: ${critical.topic}`,
        type: "Practice",
        topic: critical.topic,
        duration: "15 min",
        completed: false
    });

    // Item 2: Review (Weakest readiness if different from critical, otherwise 2nd focus)
    const reviewTopic = sortedStats.length > 1 ? sortedStats[1] : critical;
    plan.push({
        id: "2",
        task: `Review ${reviewTopic.topic} notes`,
        type: "Review",
        topic: reviewTopic.topic,
        duration: "10 min",
        completed: false
    });

    // Item 3: Varied Practice or Mock (Every 3rd day logic simulated or just mixed)
    const mixedTopic = sortedStats.length > 2 ? sortedStats[2] : (sortedStats.length > 1 ? sortedStats[0] : critical);
    const dayOfYear = Math.floor((new Date().getTime() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);

    if (dayOfYear % 3 === 0) {
        plan.push({
            id: "3",
            task: "Full Mock Test Simulation",
            type: "Mock",
            topic: "All subjects",
            duration: "30+ min",
            completed: false
        });
    } else {
        plan.push({
            id: "3",
            task: `Challenge: ${mixedTopic.topic}`,
            type: "Practice",
            topic: mixedTopic.topic,
            duration: "10 min",
            completed: false
        });
    }

    return plan;
};
