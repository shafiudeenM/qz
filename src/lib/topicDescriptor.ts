/**
 * TNPSCAce Topic Descriptor Utility
 * Maps internal Canonical IDs to Human-Readable names and Subject-Domain metadata.
 */

export interface TopicMetadata {
    id: string;
    displayName: string;
    domain: string;
    color: string;
}

const TOPIC_MAP: Record<string, { name: string; domain: string }> = {
    // Tamil
    "TAM_01": { name: "Tamil Grammar", domain: "Tamil" },
    "TAM_02": { name: "Tamil Vocabulary", domain: "Tamil" },
    "TAM_03": { name: "Sangam Literature", domain: "Tamil" },
    "TAM_04": { name: "Medieval Literature", domain: "Tamil" },
    "TAM_05": { name: "Ethical Literature", domain: "Tamil" },
    "TAM_06": { name: "Modern Tamil", domain: "Tamil" },
    "TAM_07": { name: "Tamil Poets", domain: "Tamil" },
    "TAM_08": { name: "Tamil Proverbs", domain: "Tamil" },

    // History
    "HIS_01": { name: "Ancient India", domain: "History" },
    "HIS_02": { name: "Medieval India", domain: "History" },
    "HIS_03": { name: "Modern India", domain: "History" },
    "HIS_04": { name: "Tamil Nadu History", domain: "History" },
    "HIS_05": { name: "TN Social Reformers", domain: "History" },
    "HIS_06": { name: "World History", domain: "History" },

    // Geography
    "GEO_01": { name: "Indian Geography", domain: "Geography" },
    "GEO_02": { name: "TN Geography", domain: "Geography" },
    "GEO_03": { name: "World Geography", domain: "Geography" },
    "GEO_04": { name: "Environment & Ecology", domain: "Geography" },

    // Polity
    "POL_01": { name: "Indian Constitution", domain: "Polity" },
    "POL_02": { name: "Fundamental Rights", domain: "Polity" },
    "POL_03": { name: "Parliament", domain: "Polity" },
    "POL_04": { name: "Executive & Judiciary", domain: "Polity" },
    "POL_05": { name: "State Govt", domain: "Polity" },
    "POL_06": { name: "Centre-State Relations", domain: "Polity" },
    "POL_07": { name: "Elections", domain: "Polity" },
    "POL_08": { name: "Govt Schemes", domain: "Polity" },

    // Aptitude
    "APT_01": { name: "Arithmetic", domain: "Aptitude" },
    "APT_02": { name: "Mensuration", domain: "Aptitude" },
    "APT_03": { name: "Logical Reasoning", domain: "Aptitude" },
    "APT_04": { name: "Data Interpretation", domain: "Aptitude" },

    // Economy
    "ECO_01": { name: "Indian Economy Basics", domain: "Economy" },
    "ECO_02": { name: "Agri & Rural Dev", domain: "Economy" },
    "ECO_03": { name: "Industry & Trade", domain: "Economy" },
    "ECO_04": { name: "Banking & Finance", domain: "Economy" },
    "ECO_05": { name: "Budget & Fiscal Policy", domain: "Economy" },
    "ECO_06": { name: "TN Economy", domain: "Economy" },

    // Science
    "SCI_01": { name: "Physics", domain: "Science" },
    "SCI_02": { name: "Chemistry", domain: "Science" },
    "SCI_03": { name: "Botany", domain: "Science" },
    "SCI_04": { name: "Zoology", domain: "Science" },
    "SCI_05": { name: "Computer Science", domain: "Science" },
    "SCI_06": { name: "Space & Defence", domain: "Science" },
    "SCI_07": { name: "Health & Nutrition", domain: "Science" },

    // Current Affairs
    "CUR_01": { name: "National Current Affairs", domain: "Current Affairs" },
    "CUR_02": { name: "TN Current Affairs", domain: "Current Affairs" },
    "CUR_03": { name: "International Affairs", domain: "Current Affairs" },
    "CUR_04": { name: "Sports & Awards", domain: "Current Affairs" },

    // English
    "ENG_01": { name: "English Grammar", domain: "English" },
    "ENG_02": { name: "English Vocabulary", domain: "English" },
    "ENG_03": { name: "English Comprehension", domain: "English" },

    // Fallbacks for legacy data
    "Polity": { name: "Polity", domain: "Polity" },
    "History": { name: "History", domain: "History" },
    "Geography": { name: "Geography", domain: "Geography" },
    "Science": { name: "Science", domain: "Science" },
    "Economics": { name: "Economics", domain: "Economics" }
};

const DOMAIN_COLORS: Record<string, string> = {
    "Tamil": "text-pink-400",
    "History": "text-amber-400",
    "Geography": "text-emerald-400",
    "Polity": "text-indigo-400",
    "Aptitude": "text-violet-400",
    "Science": "text-blue-400",
    "Economics": "text-cyan-400",
    "General": "text-slate-400"
};

export const getTopicDisplayName = (id: string): string => {
    return TOPIC_MAP[id]?.name || id;
};

export const getTopicDomain = (id: string): string => {
    return TOPIC_MAP[id]?.domain || "General";
};

export const getTopicColor = (id: string): string => {
    const domain = getTopicDomain(id);
    return DOMAIN_COLORS[domain] || DOMAIN_COLORS["General"];
};
