import { useAuth } from "@/components/AuthProvider";
import { useSettings } from "@/components/SettingsProvider";
import Header from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { translations } from "@/lib/translations";
import { Moon, Sun, Languages, Bell, Shield } from "lucide-react";

export default function Settings() {
    const { language, setLanguage } = useAuth();
    const { settings, updateSettings } = useSettings();
    const t = translations[language];

    const toggleTheme = () => {
        const newTheme = settings.theme_mode === "light" ? "dark" : "light";
        updateSettings({ theme_mode: newTheme });
    };

    return (
        <div className="min-h-screen bg-background text-foreground">
            <Header />
            <main className="container py-8 max-w-2xl">
                <h1 className="text-3xl font-bold mb-8">{t.settings}</h1>

                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Sun className="h-5 w-5" />
                                {t.appearance || "Appearance"}
                            </CardTitle>
                            <CardDescription>Tailor the app's visual experience to your preference.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>{t.dark_mode || "Dark Mode"}</Label>
                                    <p className="text-xs text-muted-foreground">Switch between light and dark themes.</p>
                                </div>
                                <Switch
                                    checked={settings.theme_mode === "dark"}
                                    onCheckedChange={toggleTheme}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Languages className="h-5 w-5" />
                                {t.language || "Language"}
                            </CardTitle>
                            <CardDescription>Select your preferred language for questions and interface.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-3 gap-3">
                                {[
                                    { code: 'en', label: 'English' },
                                    { code: 'ta', label: 'தமிழ்' },
                                    { code: 'hi', label: 'हिन्दी' }
                                ].map((lang) => (
                                    <button
                                        key={lang.code}
                                        onClick={() => setLanguage(lang.code as any)}
                                        className={`px-4 py-2 rounded-lg border text-sm font-bold transition-all ${language === lang.code
                                                ? "bg-primary text-primary-foreground border-primary"
                                                : "bg-secondary text-muted-foreground hover:text-foreground border-border"
                                            }`}
                                    >
                                        {lang.label}
                                    </button>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="opacity-50 grayscale cursor-not-allowed">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Bell className="h-5 w-5" />
                                {t.notifications || "Notifications"}
                            </CardTitle>
                            <CardDescription>Configure study reminders and exam alerts.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-xs text-center text-muted-foreground py-2 italic font-medium tracking-wide">Mobile app integration pending.</p>
                        </CardContent>
                    </Card>

                    <Card className="border-destructive/20 bg-destructive/5">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-destructive">
                                <Shield className="h-5 w-5" />
                                {t.privacy_security || "Account & Privacy"}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-xs text-muted-foreground">Manage your session data and account security.</p>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
}
