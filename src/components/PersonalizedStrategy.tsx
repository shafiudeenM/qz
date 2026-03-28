import React from "react";
import { motion } from "framer-motion";
import { Target, AlertTriangle, ArrowUpRight, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface WeaknessData {
    topic_id: string;
    topic_name: string;
    topic_name_ta: string;
    mastery_level: number;
    global_importance: number;
}

interface PersonalizedStrategyProps {
    weaknesses: WeaknessData[];
}

const PersonalizedStrategy: React.FC<PersonalizedStrategyProps> = ({ weaknesses }) => {
    if (!weaknesses || weaknesses.length === 0) {
        return (
            <Card className="bg-emerald-500/5 border-emerald-500/10 p-6 rounded-2xl">
                <div className="flex items-center gap-4 text-emerald-500">
                    <CheckCircle2 className="h-8 w-8" />
                    <div>
                        <h3 className="font-black uppercase tracking-tight">Mastery Achieved</h3>
                        <p className="text-sm opacity-80 font-bold">No high-risk blind spots detected. Keep practicing to maintain your edge.</p>
                    </div>
                </div>
            </Card>
        );
    }

    return (
        <Card className="bg-[#121214] border-white/5 p-6 rounded-2xl overflow-hidden relative">
            <div className="absolute top-0 right-0 p-6 opacity-10">
                <Target className="h-24 w-24 text-primary" />
            </div>

            <div className="mb-6 relative z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-500 text-[10px] font-black uppercase tracking-widest mb-3">
                    <AlertTriangle className="h-3 w-3" /> Risk-Adjusted Priority
                </div>
                <CardTitle className="text-2xl font-black uppercase tracking-tighter">Your Personalized Strategy</CardTitle>
                <p className="text-white/30 text-xs font-bold uppercase mt-1">Focusing on high-weightage topics where your mastery is below 50%</p>
            </div>

            <div className="space-y-3 relative z-10">
                {weaknesses.slice(0, 3).map((item, i) => (
                    <motion.div
                        key={item.topic_id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 hover:border-primary/30 transition-all group"
                    >
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-black text-white uppercase">{item.topic_name_ta}</span>
                                <span className="text-[10px] text-primary font-black uppercase">Weight: {item.global_importance}%</span>
                            </div>
                            <div className="w-full max-w-[200px] h-1.5 bg-white/5 rounded-full overflow-hidden mt-2">
                                <div
                                    className="h-full bg-rose-500"
                                    style={{ width: `${item.mastery_level * 10}%` }}
                                />
                            </div>
                            <span className="text-[9px] text-white/20 font-bold uppercase mt-1 block">Mastery: {item.mastery_level}/10</span>
                        </div>
                        <Link to={`/subject-drilldown/${item.topic_id}`}>
                            <Button size="sm" variant="ghost" className="h-10 w-10 p-0 rounded-xl group-hover:bg-primary group-hover:text-white transition-all">
                                <ArrowUpRight className="h-5 w-5" />
                            </Button>
                        </Link>
                    </motion.div>
                ))}
            </div>

            <Button className="w-full mt-6 h-12 bg-white text-black font-black uppercase tracking-widest hover:bg-white/90 transition-all">
                Generate Targeted Practice
            </Button>
        </Card>
    );
};

export default PersonalizedStrategy;
