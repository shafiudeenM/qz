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

const TOPIC_MAP: Record<string, { name: string; name_ta: string; domain: string }> = {
    // Tamil
    "TAM_01": { name: "Tamil Grammar", name_ta: "தமிழ் இலக்கணம்", domain: "Tamil" },
    "TAM_02": { name: "Tamil Vocabulary", name_ta: "தமிழ் அறிவும் சொற்பொருளும்", domain: "Tamil" },
    "TAM_03": { name: "Sangam Literature", name_ta: "சங்க இலக்கியம்", domain: "Tamil" },
    "TAM_04": { name: "Medieval Literature", name_ta: "அறநூல்கள் மற்றும் காப்பியங்கள்", domain: "Tamil" },
    "TAM_05": { name: "Ethical Literature", name_ta: "நீதி இலக்கியம்", domain: "Tamil" },
    "TAM_06": { name: "Modern Tamil", name_ta: "தற்காலத் தமிழ்", domain: "Tamil" },
    "TAM_07": { name: "Tamil Poets", name_ta: "தமிழ் அறிஞர்களும் தமிழ்த் தொண்டும்", domain: "Tamil" },
    "TAM_08": { name: "Tamil Proverbs", name_ta: "தமிழ் பழமொழிகள்", domain: "Tamil" },

    // History
    "HIS_01": { name: "Ancient India", name_ta: "பண்டைய கால இந்தியா", domain: "History" },
    "HIS_02": { name: "Medieval India", name_ta: "இடைக்கால இந்தியா", domain: "History" },
    "HIS_03": { name: "Modern India", name_ta: "தற்கால இந்தியா", domain: "History" },
    "HIS_04": { name: "Tamil Nadu History", name_ta: "தமிழ்நாட்டு வரலாறு", domain: "History" },
    "HIS_05": { name: "TN Social Reformers", name_ta: "தமிழக சமூக சீர்திருத்தவாதிகள்", domain: "History" },
    "HIS_06": { name: "World History", name_ta: "உலக வரலாறு", domain: "History" },

    // Geography
    "GEO_01": { name: "Indian Geography", name_ta: "இந்தியப் புவியியல்", domain: "Geography" },
    "GEO_02": { name: "TN Geography", name_ta: "தமிழகப் புவியியல்", domain: "Geography" },
    "GEO_03": { name: "World Geography", name_ta: "உலகப் புவியியல்", domain: "Geography" },
    "GEO_04": { name: "Environment & Ecology", name_ta: "சுற்றுச்சூழல் மற்றும் சூழலியல்", domain: "Geography" },

    // Polity
    "POL_01": { name: "Indian Constitution", name_ta: "இந்திய அரசியலமைப்பு", domain: "Polity" },
    "POL_02": { name: "Fundamental Rights", name_ta: "அடிப்படை உரிமைகள்", domain: "Polity" },
    "POL_03": { name: "Parliament", name_ta: "நாடாளுமன்றம்", domain: "Polity" },
    "POL_04": { name: "Executive & Judiciary", name_ta: "நிர்வாகம் மற்றும் நீதித்துறை", domain: "Polity" },
    "POL_05": { name: "State Govt", name_ta: "மாநில அரசு", domain: "Polity" },
    "POL_06": { name: "Centre-State Relations", name_ta: "மத்திய-மாநில உறவுகள்", domain: "Polity" },
    "POL_07": { name: "Elections", name_ta: "தேர்தல்கள்", domain: "Polity" },
    "POL_08": { name: "Govt Schemes", name_ta: "அரசுத் திட்டங்கள்", domain: "Polity" },

    // Aptitude
    "APT_01": { name: "Arithmetic", name_ta: "கணிதம்", domain: "Aptitude" },
    "APT_02": { name: "Mensuration", name_ta: "அளவியல்", domain: "Aptitude" },
    "APT_03": { name: "Logical Reasoning", name_ta: "தர்க்கரீதியான பகுத்தறிவு", domain: "Aptitude" },
    "APT_04": { name: "Data Interpretation", name_ta: "தரவு விளக்கம்", domain: "Aptitude" },

    // Economy
    "ECO_01": { name: "Indian Economy Basics", name_ta: "இந்தியப் பொருளாதாரம்", domain: "Economy" },
    "ECO_02": { name: "Agri & Rural Dev", name_ta: "வேளாண்மை மற்றும் ஊரக வளர்ச்சி", domain: "Economy" },
    "ECO_03": { name: "Industry & Trade", name_ta: "தொழில் மற்றும் வர்த்தகம்", domain: "Economy" },
    "ECO_04": { name: "Banking & Finance", name_ta: "வங்கி மற்றும் நிதி", domain: "Economy" },
    "ECO_05": { name: "Budget & Fiscal Policy", name_ta: "பட்ஜெட் மற்றும் நிதிக் கொள்கை", domain: "Economy" },
    "ECO_06": { name: "TN Economy", name_ta: "தமிழகப் பொருளாதாரம்", domain: "Economy" },

    // Science
    "SCI_01": { name: "Physics", name_ta: "இயற்பியல்", domain: "Science" },
    "SCI_02": { name: "Chemistry", name_ta: "வேதியியல்", domain: "Science" },
    "SCI_03": { name: "Botany", name_ta: "தாவரவியல்", domain: "Science" },
    "SCI_04": { name: "Zoology", name_ta: "விலங்கியல்", domain: "Science" },
    "SCI_05": { name: "Computer Science", name_ta: "கணினி அறிவியல்", domain: "Science" },
    "SCI_06": { name: "Space & Defence", name_ta: "விண்வெளி மற்றும் பாதுகாப்பு", domain: "Science" },
    "SCI_07": { name: "Health & Nutrition", name_ta: "சுகாதாரம் மற்றும் ஊட்டச்சத்து", domain: "Science" },

    // Current Affairs
    "CUR_01": { name: "National Current Affairs", name_ta: "தேசிய நடப்பு நிகழ்வுகள்", domain: "Current Affairs" },
    "CUR_02": { name: "TN Current Affairs", name_ta: "தமிழக நடப்பு நிகழ்வுகள்", domain: "Current Affairs" },
    "CUR_03": { name: "International Affairs", name_ta: "சர்வதேச உறவுகள்", domain: "Current Affairs" },
    "CUR_04": { name: "Sports & Awards", name_ta: "விளையாட்டு மற்றும் விருதுகள்", domain: "Current Affairs" },

    // English
    "ENG_01": { name: "English Grammar", name_ta: "ஆங்கில இலக்கணம்", domain: "English" },
    "ENG_02": { name: "English Vocabulary", name_ta: "ஆங்கிலச் சொல்லகராதி", domain: "English" },
    "ENG_03": { name: "English Comprehension", name_ta: "ஆங்கிலப் புரிதல்", domain: "English" },

    // Fallbacks for legacy data
    "Polity": { name: "Polity", name_ta: "அரசியல்", domain: "Polity" },
    "History": { name: "History", name_ta: "வரலாறு", domain: "History" },
    "Geography": { name: "Geography", name_ta: "புவியியல்", domain: "Geography" },
    "Science": { name: "Science", name_ta: "அறிவியல்", domain: "Science" },
    "Economics": { name: "Economics", name_ta: "பொருளாதாரம்", domain: "Economics" }
};

const DOMAIN_COLORS: Record<string, string> = {
    "Tamil": "text-pink-400",
    "History": "text-amber-400",
    "Geography": "text-emerald-400",
    "Polity": "text-violet-400",
    "Aptitude": "text-fuchsia-400",
    "Science": "text-teal-400",
    "Economics": "text-cyan-400",
    "General": "text-slate-400"
};

export const getTopicDisplayName = (id: string): string => {
    return TOPIC_MAP[id]?.name || id;
};

export const getTopicTamilName = (id: string): string => {
    return TOPIC_MAP[id]?.name_ta || id;
};

export const getTopicDomain = (id: string): string => {
    return TOPIC_MAP[id]?.domain || "General";
};

export const getTopicColor = (id: string): string => {
    const domain = getTopicDomain(id);
    return DOMAIN_COLORS[domain] || DOMAIN_COLORS["General"];
};
