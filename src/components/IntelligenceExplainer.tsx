import React, { useState, useEffect } from "react";
import { Volume2, VolumeX, MessageSquare, Info } from "lucide-react";
import { Button } from "@/components/ui/button";

interface IntelligenceExplainerProps {
    weightage: any[];
    trends: any[];
    heatmap: any[];
}

// Fallback Tamil explanation shown even when no DB data is available
const FALLBACK_TAMIL = `தமிழ்நாடு அரசுப் பணியாளர் தேர்வாணையம் (TNPSC) நடத்தும் குரூப் 4 தேர்வில் இந்திய அரசியலமைப்பு, வரலாறு மற்றும் புவியியல் பகுதிகள் மிக முக்கியமானவை. கடந்த 20 ஆண்டுகளில் சேகரிக்கப்பட்ட PYQ தரவுகளின் அடிப்படையில், மிகவும் முக்கியத்துவம் வாய்ந்த தலைப்புகளை கவனமாக படியுங்கள். இந்த AI முன்கணிப்பு (Prediction) உங்கள் தயாரிப்பை இலக்கு நோக்கி வழிநடத்தும். தேர்வு தேதிக்கு 30 நாட்களுக்கு முன்பாக Prioritized Topics-ஐ மட்டும் தீவிரமாக திரும்பவும் படியுங்கள்.`;

const IntelligenceExplainer: React.FC<IntelligenceExplainerProps> = ({ weightage, trends, heatmap }) => {
    const [explanation, setExplanation] = useState<string>("");
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [voice, setVoice] = useState<SpeechSynthesisVoice | null>(null);

    useEffect(() => {
        const synth = window.speechSynthesis;
        const loadVoices = () => {
            const voices = synth.getVoices();
            setVoice(voices.find(v => v.lang.includes('ta')) || voices[0] || null);
        };
        if (synth.onvoiceschanged !== undefined) synth.onvoiceschanged = loadVoices;
        loadVoices();
        return () => { synth.cancel(); };
    }, []);

    useEffect(() => {
        // If real data exists, generate dynamic explanation; else use fallback
        if (!weightage.length) {
            setExplanation(FALLBACK_TAMIL);
            return;
        }

        const topTopic = weightage[0];
        const risingTopics = trends
            .filter(t => t.trend_status === 'Emerging' || t.trend_status === 'Rising')
            .slice(0, 2);
        const criticalTopics = heatmap
            .filter(h => h.risk_level === 'CRITICAL' || h.risk_level === 'HIGH')
            .slice(0, 2);

        // Use topic_id as fallback name when topic_name_ta is missing
        const topName = topTopic.topic_name_ta || topTopic.topic_id || 'இந்த பகுதி';

        let text = `புள்ளிவிவரங்களின் அடிப்படையில், ${topName} பகுதியில் இருந்து கேள்வி வர ${topTopic.selection_probability}% வாய்ப்பு உள்ளது. `;

        if (risingTopics.length > 0) {
            const names = risingTopics.map(t => t.topic_name_ta || t.topic_id).join(" மற்றும் ");
            text += `குறிப்பாக, ${names} பகுதிகளில் கேள்விகளின் முக்கியத்துவம் கணிசமாக அதிகரித்து வருகிறது. `;
        }

        if (criticalTopics.length > 0) {
            const names = criticalTopics.map(t => t.topic_name_ta || t.topic_id).join(", ");
            text += `எதிர்வரும் தேர்வில் ${names} பகுதிகள் மிக முக்கியமானவை என வகைப்படுத்தப்பட்டுள்ளன. `;
        }

        text += "இந்த முன்கணிப்பை பயன்படுத்தி உங்கள் பயிற்சியைத் திட்டமிடுங்கள்.";
        setExplanation(text);
    }, [weightage, trends, heatmap]);

    const handleSpeak = () => {
        const synth = window.speechSynthesis;
        if (isSpeaking) {
            synth.cancel();
            setIsSpeaking(false);
            return;
        }
        const utterance = new SpeechSynthesisUtterance(explanation);
        if (voice) utterance.voice = voice;
        utterance.rate = 0.85;
        utterance.pitch = 1;
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);
        setIsSpeaking(true);
        synth.speak(utterance);
    };

    const isDataDriven = weightage.length > 0;

    return (
        <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 to-orange-600/5 overflow-hidden">
            <div className="p-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center flex-shrink-0">
                            <MessageSquare className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <h3 className="font-black text-white uppercase tracking-tight text-sm">
                                AI விளக்கம் — Auto Explanation
                            </h3>
                            <span className="text-[10px] text-primary font-bold uppercase tracking-widest">
                                {isDataDriven ? "Live Predictive Intelligence · Tamil" : "TNPSC Guidance · Tamil"}
                            </span>
                        </div>
                    </div>
                    <Button
                        onClick={handleSpeak}
                        className={`gap-2 text-xs font-black uppercase tracking-widest h-9 px-4 transition-all rounded-xl ${isSpeaking
                            ? 'bg-primary text-white shadow-lg shadow-primary/30'
                            : 'bg-primary/10 text-primary border border-primary/20 hover:bg-primary hover:text-white hover:shadow-lg hover:shadow-primary/30'
                            }`}
                    >
                        {isSpeaking ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                        {isSpeaking ? "நிறுத்து" : "கேளுங்கள்"}
                    </Button>
                </div>

                {/* Explanation Text */}
                <div className="bg-black/40 border border-white/10 rounded-xl p-5">
                    <p className="text-white text-sm leading-loose font-medium">
                        {explanation || "தரவு ஏற்றுகிறது..."}
                    </p>
                </div>

                {/* Footer */}
                <div className="flex items-center gap-2 mt-4">
                    <Info className="h-3.5 w-3.5 text-white/20 flex-shrink-0" />
                    <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest">
                        {isDataDriven
                            ? "Based on recency-weighted analysis of all PYQ data"
                            : "Add questions to your database for personalized AI predictions"}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default IntelligenceExplainer;
