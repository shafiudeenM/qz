/**
 * SuperMemo-2 (SM-2) Algorithm implementation
 * 
 * q: quality of response [0-5]
 *   5: perfect response
 *   4: correct response after a hesitation
 *   3: correct response recalled with serious difficulty
 *   2: incorrect response; where the correct one seemed easy to recall
 *   1: incorrect response; the correct one remembered
 *   0: complete blackout.
 */

export interface SRState {
    interval: number;
    ease_factor: number;
    repetitions: number;
}

export const calculateNextReview = (
    q: number,
    prevInterval: number,
    prevEaseFactor: number,
    prevRepetitions: number
): SRState => {
    let interval: number;
    let ease_factor: number;
    let repetitions: number;

    if (q >= 3) {
        // Correct response
        if (prevRepetitions === 0) {
            interval = 1;
        } else if (prevRepetitions === 1) {
            interval = 6;
        } else {
            interval = Math.round(prevInterval * prevEaseFactor);
        }

        repetitions = prevRepetitions + 1;
        ease_factor = prevEaseFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
    } else {
        // Incorrect response
        repetitions = 0;
        interval = 1;
        ease_factor = prevEaseFactor;
    }

    if (ease_factor < 1.3) {
        ease_factor = 1.3;
    }

    return {
        interval,
        ease_factor,
        repetitions,
    };
};

// Application-specific mapping for binary correct/incorrect
export const processAnswer = (
    isCorrect: boolean,
    prevStats?: {
        interval: number;
        ease_factor: number;
        repetitions: number;
        total_attempts?: number;
        total_correct?: number;
    }
): SRState & { total_attempts: number; total_correct: number } => {
    const q = isCorrect ? 5 : 0;
    const interval = prevStats?.interval ?? 0;
    const easeFactor = prevStats?.ease_factor ?? 2.5;
    const repetitions = prevStats?.repetitions ?? 0;

    const nextSR = calculateNextReview(q, interval, easeFactor, repetitions);

    return {
        ...nextSR,
        total_attempts: (prevStats?.total_attempts || 0) + 1,
        total_correct: (prevStats?.total_correct || 0) + (isCorrect ? 1 : 0)
    };
};
