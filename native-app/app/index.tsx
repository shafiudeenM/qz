import { View, Text, ScrollView, TouchableOpacity, SafeAreaView } from "react-native";
import { Stack } from "expo-router";
import { Sparkles, Play, Award, Zap, History } from "lucide-react-native";
import { useState, useEffect } from "react";
import { supabase } from "../src/lib/supabase";
import { translations } from "../src/lib/translations";

export default function Dashboard() {
    const [session, setSession] = useState(null);
    const t = translations.en;

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
        });
    }, []);

    return (
        <SafeAreaView className="flex-1 bg-white">
            <Stack.Screen options={{ title: "", headerShown: false }} />
            <ScrollView className="flex-1 px-6 pt-12">
                {/* Header Section */}
                <View className="flex-row items-center justify-between mb-8">
                    <View>
                        <Text className="text-gray-500 text-lg font-medium">{t.welcome_back},</Text>
                        <Text className="text-3xl font-black tracking-tight text-gray-900">
                            Aspirant ✨
                        </Text>
                    </View>
                    <View className="h-12 w-12 rounded-full bg-orange-100 items-center justify-center">
                        <Award size={24} color="#ea580c" />
                    </View>
                </View>

                {/* Hero Card */}
                <View className="bg-orange-600 rounded-3xl p-6 shadow-xl shadow-orange-200 mb-8">
                    <View className="flex-row items-center mb-4">
                        <Zap size={20} color="white" fill="white" />
                        <Text className="text-white font-bold ml-2 uppercase tracking-widest text-xs">
                            Today's Challenge
                        </Text>
                    </View>
                    <Text className="text-white text-2xl font-black mb-2">
                        Daily Adaptive Quiz
                    </Text>
                    <Text className="text-orange-100 mb-6 leading-6">
                        Complete your daily mission to keep your {t.current_streak} alive.
                    </Text>
                    <TouchableOpacity
                        className="bg-white rounded-2xl py-4 items-center flex-row justify-center"
                        style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10 }}
                    >
                        <Play size={18} color="#ea580c" fill="#ea580c" />
                        <Text className="text-orange-600 font-bold ml-2 text-lg">Start Session</Text>
                    </TouchableOpacity>
                </View>

                {/* Stats Grid */}
                <View className="flex-row flex-wrap justify-between mb-8">
                    <StatCard title="Accuracy" value="85%" icon={<Award size={20} color="#ea580c" />} />
                    <StatCard title="Streak" value="12 Days" icon={<Sparkles size={20} color="#ea580c" />} />
                </View>

                {/* Quick Actions */}
                <Text className="text-xl font-black text-gray-900 mb-4 px-1">Quick Actions</Text>
                <View className="space-y-4">
                    <ActionItem icon={<History size={20} color="#6b7280" />} title="Mock Test History" />
                    <ActionItem icon={<Sparkles size={20} color="#6b7280" />} title="Power Hour" />
                </View>

                <View className="h-20" />
            </ScrollView>
        </SafeAreaView>
    );
}

function StatCard({ title, value, icon }) {
    return (
        <View className="bg-gray-50 border border-gray-100 rounded-2xl p-4 w-[48%] items-center justify-center">
            <View className="bg-white p-2 rounded-xl border border-gray-100 mb-2">
                {icon}
            </View>
            <Text className="text-gray-500 text-xs font-bold mb-1 uppercase">{title}</Text>
            <Text className="text-xl font-black text-gray-900">{value}</Text>
        </View>
    );
}

function ActionItem({ icon, title }) {
    return (
        <TouchableOpacity className="flex-row items-center bg-gray-50 border border-gray-100 rounded-2xl p-4 mb-3">
            <View className="bg-white p-2 rounded-xl border border-gray-100 mr-4">
                {icon}
            </View>
            <Text className="text-gray-900 font-bold flex-1">{title}</Text>
            <View className="h-2 w-2 rounded-full bg-gray-300" />
        </TouchableOpacity>
    );
}
