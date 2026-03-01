/**
 * examConfig.ts — TNPSC Official Exam Configurations
 * 
 * Locked as core system logic. These numbers match the official TNPSC exam pattern.
 * DO NOT change section counts without verifying against official TNPSC notification.
 */

export type ExamGroup = 'G1' | 'G2' | 'G4';

export interface ExamSection {
    id: string;
    name: string;
    nameTa: string;
    questionCount: number;
    topicIds: string[];    // canonical_topics IDs that feed this section
    isQualifying?: boolean; // Tamil sections are qualifying, not counted in merit
}

export interface ExamConfig {
    group: ExamGroup;
    displayName: string;
    displayNameTa: string;
    totalQuestions: number;
    durationSeconds: number;   // 3 hours = 10800
    negativeMarkFraction: number; // 1/3
    sections: ExamSection[];
    historicalCutoffs?: { year: number; general: number; obc: number; sc: number };
}

// ─── Official Exam Configurations ────────────────────────────────────────────

export const EXAM_CONFIGS: Record<ExamGroup, ExamConfig> = {

    // ── Group 4 ──────────────────────────────────────────────────────────────
    G4: {
        group: 'G4',
        displayName: 'Group 4 CCSE',
        displayNameTa: 'குழு 4 (CCSE)',
        totalQuestions: 200,
        durationSeconds: 10800,
        negativeMarkFraction: 1 / 3,
        sections: [
            {
                id: 'tamil',
                name: 'General Tamil',
                nameTa: 'பொது தமிழ்',
                questionCount: 100,
                isQualifying: true,
                topicIds: ['TAM_01', 'TAM_02', 'TAM_03', 'TAM_04', 'TAM_05', 'TAM_06', 'TAM_07', 'TAM_08'],
            },
            {
                id: 'gs',
                name: 'General Studies',
                nameTa: 'பொது அறிவு',
                questionCount: 75,
                topicIds: [
                    'HIS_01', 'HIS_02', 'HIS_03', 'HIS_04', 'HIS_05',
                    'GEO_01', 'GEO_02', 'GEO_04',
                    'POL_01', 'POL_02', 'POL_03', 'POL_04', 'POL_05', 'POL_07', 'POL_08',
                    'ECO_01', 'ECO_02', 'ECO_06',
                    'SCI_01', 'SCI_02', 'SCI_03', 'SCI_04', 'SCI_07',
                    'CUR_01', 'CUR_02',
                ],
            },
            {
                id: 'aptitude',
                name: 'Aptitude & Mental Ability',
                nameTa: 'மனத்திறன் & எண்கணிதம்',
                questionCount: 25,
                topicIds: ['APT_01', 'APT_02', 'APT_03'],
            },
        ],
        historicalCutoffs: { year: 2023, general: 142, obc: 135, sc: 120 },
    },

    // ── Group 2 ──────────────────────────────────────────────────────────────
    G2: {
        group: 'G2',
        displayName: 'Group 2 CCSE (Prelims)',
        displayNameTa: 'குழு 2 (முதல் தேர்வு)',
        totalQuestions: 200,
        durationSeconds: 10800,
        negativeMarkFraction: 1 / 3,
        sections: [
            {
                id: 'tamil',
                name: 'General Tamil',
                nameTa: 'பொது தமிழ்',
                questionCount: 100,
                isQualifying: true,
                topicIds: ['TAM_01', 'TAM_02', 'TAM_03', 'TAM_04', 'TAM_05', 'TAM_06', 'TAM_07', 'TAM_08'],
            },
            {
                id: 'gs',
                name: 'General Studies',
                nameTa: 'பொது அறிவு',
                questionCount: 75,
                topicIds: [
                    'HIS_01', 'HIS_02', 'HIS_03', 'HIS_04', 'HIS_05', 'HIS_06',
                    'GEO_01', 'GEO_02', 'GEO_03', 'GEO_04',
                    'POL_01', 'POL_02', 'POL_03', 'POL_04', 'POL_05', 'POL_06', 'POL_07', 'POL_08',
                    'ECO_01', 'ECO_02', 'ECO_03', 'ECO_04', 'ECO_05', 'ECO_06',
                    'SCI_01', 'SCI_02', 'SCI_03', 'SCI_04', 'SCI_05', 'SCI_06', 'SCI_07',
                    'CUR_01', 'CUR_02', 'CUR_03', 'CUR_04',
                ],
            },
            {
                id: 'aptitude',
                name: 'Aptitude & Mental Ability',
                nameTa: 'மனத்திறன் & எண்கணிதம்',
                questionCount: 25,
                topicIds: ['APT_01', 'APT_02', 'APT_03', 'APT_04'],
            },
        ],
        historicalCutoffs: { year: 2023, general: 148, obc: 140, sc: 128 },
    },

    // ── Group 1 ──────────────────────────────────────────────────────────────
    // IMPORTANT: Group 1 Prelims has NO Tamil paper. Tamil is NOT part of the paper.
    G1: {
        group: 'G1',
        displayName: 'Group 1 CCSE (Prelims)',
        displayNameTa: 'குழு 1 (முதல் தேர்வு)',
        totalQuestions: 200,
        durationSeconds: 10800,
        negativeMarkFraction: 1 / 3,
        sections: [
            {
                id: 'gs',
                name: 'General Studies',
                nameTa: 'பொது அறிவு',
                questionCount: 175,
                topicIds: [
                    'HIS_01', 'HIS_02', 'HIS_03', 'HIS_04', 'HIS_05', 'HIS_06',
                    'GEO_01', 'GEO_02', 'GEO_03', 'GEO_04',
                    'POL_01', 'POL_02', 'POL_03', 'POL_04', 'POL_05', 'POL_06', 'POL_07', 'POL_08',
                    'ECO_01', 'ECO_02', 'ECO_03', 'ECO_04', 'ECO_05', 'ECO_06',
                    'SCI_01', 'SCI_02', 'SCI_03', 'SCI_04', 'SCI_05', 'SCI_06', 'SCI_07',
                    'CUR_01', 'CUR_02', 'CUR_03', 'CUR_04',
                    'ENG_01', 'ENG_02', 'ENG_03',
                ],
            },
            {
                id: 'aptitude',
                name: 'Aptitude & Mental Ability',
                nameTa: 'மனத்திறன் & எண்கணிதம்',
                questionCount: 25,
                topicIds: ['APT_01', 'APT_02', 'APT_03', 'APT_04'],
            },
        ],
        historicalCutoffs: { year: 2023, general: 155, obc: 148, sc: 138 },
    },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Get section for a given question number (1-indexed) */
export function getSectionForQuestion(config: ExamConfig, questionIndex: number): ExamSection {
    let cumulative = 0;
    for (const section of config.sections) {
        cumulative += section.questionCount;
        if (questionIndex < cumulative) return section;
    }
    return config.sections[config.sections.length - 1];
}

/** Format seconds as HH:MM:SS */
export function formatExamTime(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

/** Calculate score with TNPSC negative marking */
export function calculateExamScore(
    answers: (number | null)[],
    correctAnswers: number[],
    negativeMarkFraction = 1 / 3
): { correct: number; wrong: number; skipped: number; score: number; percentage: number } {
    let correct = 0, wrong = 0, skipped = 0;
    answers.forEach((ans, i) => {
        if (ans === null) skipped++;
        else if (ans === correctAnswers[i]) correct++;
        else wrong++;
    });
    const score = Math.max(0, correct - wrong * negativeMarkFraction);
    const total = answers.length;
    const percentage = total > 0 ? Math.round((score / total) * 100) : 0;
    return { correct, wrong, skipped, score: Math.round(score * 100) / 100, percentage };
}
