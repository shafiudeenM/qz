/**
 * This interface matches the 'final_questions' table in your Supabase schema.
 * Use this when fetching raw data from the database.
 */
export interface DatabaseQuestion {
  id: number;
  question_text: string;
  question_text_ta?: string;
  question_text_hi?: string;
  topic: string;
  options: any; // jsonb in DB, usually string[]
  options_ta?: any;
  options_hi?: any;
  correct_option_index: number;
  explanation?: string;
  explanation_ta?: string;
  explanation_hi?: string;
  difficulty_level: number;
  year: number;
  exam: string;
  subject: string;
}

export interface Question {
  id: string;
  text: string;
  topic: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  difficulty: number;
  examYear: string;
  source: string;
}

export interface UserProgress {
  questionId: string;
  isCorrect: boolean;
  timeTaken: number;
  attemptDate: string;
}

export interface TopicScore {
  topic: string;
  accuracy: number;
  totalQuestions: number;
  correctAnswers: number;
  trend: "improving" | "declining" | "stable";
  priority: "high" | "medium" | "low";
}

export const sampleQuestions: Question[] = [
  {
    id: "q1",
    text: "Who was the first Chief Minister of Tamil Nadu?",
    topic: "Polity",
    options: ["C. Rajagopalachari", "K. Kamaraj", "P.S. Kumaraswamy Raja", "O.P. Ramaswamy Reddiyar"],
    correctAnswer: 2,
    explanation: "P.S. Kumaraswamy Raja served as the first Chief Minister of Tamil Nadu (then Madras State) from 1952 to 1954.",
    difficulty: 3,
    examYear: "2023",
    source: "Group 2",
  },
  {
    id: "q2",
    text: "The Palk Strait separates India from which country?",
    topic: "Geography",
    options: ["Myanmar", "Sri Lanka", "Bangladesh", "Maldives"],
    correctAnswer: 1,
    explanation: "The Palk Strait is a strait between the Tamil Nadu state of India and the Mannar district of the Northern Province of Sri Lanka.",
    difficulty: 1,
    examYear: "2022",
    source: "Group 4",
  },
  {
    id: "q3",
    text: "The Sangam literature was composed in which language?",
    topic: "History",
    options: ["Sanskrit", "Pali", "Tamil", "Prakrit"],
    correctAnswer: 2,
    explanation: "Sangam literature refers to the earliest available Tamil literature, composed between 300 BCE and 300 CE.",
    difficulty: 2,
    examYear: "2023",
    source: "Group 1",
  },
  {
    id: "q4",
    text: "Which Article of the Indian Constitution deals with the Right to Equality?",
    topic: "Polity",
    options: ["Article 12", "Article 14", "Article 19", "Article 21"],
    correctAnswer: 1,
    explanation: "Article 14 guarantees equality before the law and equal protection of the laws within the territory of India.",
    difficulty: 2,
    examYear: "2024",
    source: "Group 2",
  },
  {
    id: "q5",
    text: "The fiscal deficit in the Union Budget means?",
    topic: "Economics",
    options: [
      "Total expenditure – Total receipts",
      "Total expenditure – Total receipts excluding borrowings",
      "Revenue expenditure – Revenue receipts",
      "Capital expenditure – Capital receipts",
    ],
    correctAnswer: 1,
    explanation: "Fiscal deficit = Total expenditure - Total receipts (excluding borrowings). It indicates the total borrowing needs of the government.",
    difficulty: 3,
    examYear: "2023",
    source: "Group 1",
  },
  {
    id: "q6",
    text: "Which river is known as the 'Ganges of the South'?",
    topic: "Geography",
    options: ["Krishna", "Godavari", "Kaveri", "Tungabhadra"],
    correctAnswer: 1,
    explanation: "The Godavari river is often referred to as the 'Ganges of the South' or 'Dakshin Ganga' due to its length and cultural significance.",
    difficulty: 2,
    examYear: "2022",
    source: "Group 4",
  },
  {
    id: "q7",
    text: "The Chola dynasty's greatest contribution to Indian culture was in the field of?",
    topic: "History",
    options: ["Literature", "Temple architecture", "Painting", "Music"],
    correctAnswer: 1,
    explanation: "The Chola dynasty made remarkable contributions in temple architecture, with the Brihadeeswarar Temple being a UNESCO World Heritage Site.",
    difficulty: 2,
    examYear: "2023",
    source: "Group 2",
  },
  {
    id: "q8",
    text: "Photosynthesis takes place in which part of the plant cell?",
    topic: "Science",
    options: ["Mitochondria", "Chloroplast", "Nucleus", "Ribosome"],
    correctAnswer: 1,
    explanation: "Chloroplasts contain chlorophyll which captures sunlight and converts CO₂ and water into glucose and oxygen.",
    difficulty: 1,
    examYear: "2024",
    source: "Group 4",
  },
  {
    id: "q9",
    text: "Which Five-Year Plan introduced the concept of 'inclusive growth'?",
    topic: "Economics",
    options: ["9th Plan", "10th Plan", "11th Plan", "12th Plan"],
    correctAnswer: 2,
    explanation: "The 11th Five-Year Plan (2007-2012) was titled 'Towards Faster and More Inclusive Growth'.",
    difficulty: 3,
    examYear: "2023",
    source: "Group 1",
  },
  {
    id: "q10",
    text: "The 73rd Constitutional Amendment Act deals with?",
    topic: "Polity",
    options: ["Panchayati Raj", "Municipalities", "Cooperative Societies", "Scheduled Areas"],
    correctAnswer: 0,
    explanation: "The 73rd Amendment Act of 1992 gave constitutional status to Panchayati Raj institutions in India.",
    difficulty: 2,
    examYear: "2024",
    source: "Group 2",
  },
];

export const sampleTopicScores: TopicScore[] = [
  { topic: "Polity", accuracy: 45, totalQuestions: 20, correctAnswers: 9, trend: "declining", priority: "high" },
  { topic: "History", accuracy: 72, totalQuestions: 25, correctAnswers: 18, trend: "improving", priority: "medium" },
  { topic: "Geography", accuracy: 88, totalQuestions: 17, correctAnswers: 15, trend: "stable", priority: "low" },
  { topic: "Economics", accuracy: 50, totalQuestions: 15, correctAnswers: 7, trend: "stable", priority: "high" },
  { topic: "Science", accuracy: 65, totalQuestions: 18, correctAnswers: 12, trend: "improving", priority: "medium" },
];

export const topics = ["Polity", "History", "Geography", "Economics", "Science"] as const;
