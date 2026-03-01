import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/components/AuthProvider";
import { translations } from "@/lib/translations";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2, GraduationCap } from "lucide-react";

export default function Auth() {
    const navigate = useNavigate();
    const { loginAsGuest } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const handleAuth = async (type: "login" | "signup") => {
        setIsLoading(true);
        try {
            if (type === "signup") {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        emailRedirectTo: window.location.origin,
                    },
                });
                if (error) throw error;
                toast.success("Check your email to confirm your account!");
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
                toast.success("Welcome back!");
                navigate("/dashboard");
            }
        } catch (error: any) {
            toast.error(error.message || "An error occurred during authentication");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8 flex items-center gap-2 cursor-pointer"
                onClick={() => navigate("/")}
            >
                <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl">
                    <img src="/pwa-192.png" alt="அறிவு Logo" className="h-full w-full object-contain" />
                </div>
                <span className="text-2xl font-black tracking-tighter text-foreground">
                    அறிவு
                </span>
            </motion.div>

            <Card className="w-full max-w-md border-border bg-card shadow-xl">
                <Tabs defaultValue="login" className="w-full">
                    <CardHeader className="text-center">
                        <CardTitle className="text-2xl font-bold">Welcome</CardTitle>
                        <CardDescription>
                            Sign in to your account or create a new one to track your progress.
                        </CardDescription>
                        <TabsList className="grid w-full grid-cols-2 mt-4">
                            <TabsTrigger value="login">Login</TabsTrigger>
                            <TabsTrigger value="signup">Register</TabsTrigger>
                        </TabsList>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <TabsContent value="login" className="space-y-4 mt-0">
                            <div className="space-y-2">
                                <Label htmlFor="login-email">Email</Label>
                                <Input
                                    id="login-email"
                                    type="email"
                                    placeholder="name@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    disabled={isLoading}
                                />
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="login-password">Password</Label>
                                </div>
                                <Input
                                    id="login-password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    disabled={isLoading}
                                />
                            </div>
                            <Button
                                className="w-full transition-all active:scale-[0.98]"
                                onClick={() => handleAuth("login")}
                                disabled={isLoading}
                            >
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Sign In
                            </Button>
                        </TabsContent>

                        <TabsContent value="signup" className="space-y-4 mt-0">
                            <div className="space-y-2">
                                <Label htmlFor="signup-email">Email</Label>
                                <Input
                                    id="signup-email"
                                    type="email"
                                    placeholder="name@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    disabled={isLoading}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="signup-password">Password</Label>
                                <Input
                                    id="signup-password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    disabled={isLoading}
                                />
                            </div>
                            <Button
                                className="w-full transition-all active:scale-[0.98]"
                                onClick={() => handleAuth("signup")}
                                disabled={isLoading}
                            >
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Create Account
                            </Button>
                        </TabsContent>
                    </CardContent>
                    <CardFooter className="flex flex-col gap-4 text-center">
                        <div className="relative w-full">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-border" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-card px-2 text-muted-foreground font-bold">OR</span>
                            </div>
                        </div>
                        <Button
                            variant="outline"
                            className="w-full border-primary/20 hover:bg-primary/5 active:scale-[0.98]"
                            onClick={() => {
                                loginAsGuest();
                            }}
                        >
                            Continue as Guest
                        </Button>
                        <p className="text-xs text-muted-foreground px-4">
                            By continuing, you agree to our Terms of Service and Privacy Policy.
                        </p>
                    </CardFooter>
                </Tabs>
            </Card>

            <p className="mt-8 text-sm text-muted-foreground">
                Ready to ace your exams? <span className="text-primary font-medium">Join 50,000+ aspirants today.</span>
            </p>
        </div>
    );
}
