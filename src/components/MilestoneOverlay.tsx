import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Star, Zap, CheckCircle2 } from "lucide-react";
import confetti from "canvas-confetti";

interface MilestoneOverlayProps {
    type: "first_correct" | "daily_complete" | "streak_3" | "level_up";
    onClose: () => void;
}

const milestones = {
    first_correct: {
        title: "First Step Forward!",
        desc: "You've answered your first question correctly. The journey of a thousand miles begins with a single step.",
        icon: <CheckCircle2 className="h-12 w-12 text-success" />,
        color: "text-success",
        bgColor: "bg-success/20",
    },
    daily_complete: {
        title: "Mission Accomplished!",
        desc: "Daily quiz complete. You're building a powerful learning habit.",
        icon: <Zap className="h-12 w-12 text-primary" />,
        color: "text-primary",
        bgColor: "bg-primary/20",
    },
    streak_3: {
        title: "3-Day Fire!",
        desc: "You're consistent! Keeping the flame alive for 3 days straight.",
        icon: <Star className="h-12 w-12 text-yellow-500" />,
        color: "text-yellow-500",
        bgColor: "bg-yellow-500/20",
    },
    level_up: {
        title: "Level Up!",
        desc: "Your knowledge is growing. You've reached a new Aspirant Level!",
        icon: <Trophy className="h-12 w-12 text-warning" />,
        color: "text-warning",
        bgColor: "bg-warning/20",
    }
};

const MilestoneOverlay = ({ type, onClose }: MilestoneOverlayProps) => {
    const [isVisible, setIsVisible] = useState(true);
    const milestone = milestones[type];

    useEffect(() => {
        if (isVisible) {
            confetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#3b82f6', '#10b981', '#f59e0b']
            });

            const timer = setTimeout(() => {
                handleClose();
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [isVisible]);

    const handleClose = () => {
        setIsVisible(false);
        setTimeout(onClose, 500); // Allow exit animation
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: 20 }}
                        className="relative max-w-sm w-full bg-card border border-border rounded-3xl p-8 shadow-2xl text-center"
                    >
                        <div className={`mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full ${milestone.bgColor}`}>
                            {milestone.icon}
                        </div>

                        <h2 className={`text-3xl font-black mb-3 ${milestone.color}`}>
                            {milestone.title}
                        </h2>

                        <p className="text-muted-foreground leading-relaxed mb-8">
                            {milestone.desc}
                        </p>

                        <button
                            onClick={handleClose}
                            className="w-full py-4 rounded-xl bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform active:scale-95"
                        >
                            Continue my Journey
                        </button>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default MilestoneOverlay;
