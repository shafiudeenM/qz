import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Brain, Zap, Target, BarChart3, CheckCircle, Clock, TrendingUp, Users, Star, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: <Zap className="h-6 w-6" />,
    title: "Daily Adaptive Quiz",
    description: "AI identifies your weak areas and generates personalized 10-minute quizzes every day from previous TNPSC papers.",
  },
  {
    icon: <Brain className="h-6 w-6" />,
    title: "Spaced Repetition",
    description: "Science-backed FSRS algorithm ensures you never forget what you've learned. Review at the perfect intervals.",
  },
  {
    icon: <Target className="h-6 w-6" />,
    title: "Mock Tests",
    description: "Full exam simulation with timer, negative marking, and question navigation — just like the real TNPSC exam.",
  },
  {
    icon: <BarChart3 className="h-6 w-6" />,
    title: "Deep Analytics",
    description: "See exactly which topics need work, your time per question, accuracy trends, and a priority-based study plan.",
  },
];

const stats = [
  { value: "5,000+", label: "Questions from past papers" },
  { value: "85%", label: "Average score improvement" },
  { value: "10 min", label: "Daily study time needed" },
  { value: "₹299", label: "Per month — cancel anytime" },
];

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 },
};

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl">
              <img src="/pwa-192.png" alt="அறிவு Logo" className="h-full w-full object-contain" />
            </div>
            <span className="text-xl font-black tracking-tighter text-foreground">
              அறிவு
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/dashboard">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                Login
              </Button>
            </Link>
            <Link to="/dashboard">
              <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
                Start Free
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden py-20 md:py-32">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(33_100%_50%/0.08),transparent_60%)]" />
        <div className="container relative">
          <motion.div {...fadeUp} className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm text-primary">
              <Star className="h-4 w-4" />
              Trusted by 3,000+ TNPSC aspirants
            </div>
            <h1 className="text-4xl font-extrabold leading-tight tracking-tight md:text-6xl lg:text-7xl">
              Stop Studying
              <span className="text-gradient-primary"> Everything.</span>
              <br />
              Study What
              <span className="text-gradient-primary"> Matters.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">
              The adaptive quiz app that identifies your weak areas and builds a personalized study plan from real TNPSC exam papers. 10 minutes a day. 85% score improvement.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link to="/dashboard">
                <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 glow-primary px-8 text-base">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/quiz">
                <Button variant="outline" size="lg" className="border-border text-foreground hover:bg-secondary px-8 text-base">
                  Try a Sample Quiz
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats strip */}
      <section className="border-y border-border bg-secondary/50 py-8">
        <div className="container grid grid-cols-2 gap-6 md:grid-cols-4">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <p className="text-2xl font-bold text-primary md:text-3xl">{stat.value}</p>
              <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="container">
          <motion.div {...fadeUp} className="mx-auto mb-16 max-w-2xl text-center">
            <h2 className="text-3xl font-bold md:text-4xl">
              Your <span className="text-primary">3 biggest problems</span>, solved.
            </h2>
            <p className="mt-4 text-muted-foreground">
              "What should I study?" "I keep forgetting!" "I panic during exams." — Sound familiar?
            </p>
          </motion.div>

          <div className="grid gap-6 md:grid-cols-2">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="group rounded-xl border border-border bg-card p-6 transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold text-foreground">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-border bg-secondary/30 py-20">
        <div className="container">
          <motion.div {...fadeUp} className="mx-auto mb-16 max-w-2xl text-center">
            <h2 className="text-3xl font-bold md:text-4xl">How it works</h2>
          </motion.div>

          <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-3">
            {[
              { step: "01", icon: <CheckCircle className="h-5 w-5" />, title: "Take Diagnostic Test", desc: "100 questions across all topics to find your baseline." },
              { step: "02", icon: <Clock className="h-5 w-5" />, title: "10-Min Daily Quiz", desc: "AI serves questions only from your weak areas. Every day." },
              { step: "03", icon: <TrendingUp className="h-5 w-5" />, title: "Watch Scores Climb", desc: "Track improvement across topics. Adjust strategy with analytics." },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.15 }}
                viewport={{ once: true }}
                className="relative text-center"
              >
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border-2 border-primary bg-primary/10 text-primary">
                  {item.icon}
                </div>
                <span className="text-xs font-bold tracking-widest text-primary">{item.step}</span>
                <h3 className="mt-2 text-lg font-semibold text-foreground">{item.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20">
        <div className="container">
          <motion.div {...fadeUp} className="mx-auto mb-16 max-w-2xl text-center">
            <h2 className="text-3xl font-bold md:text-4xl">Simple pricing</h2>
            <p className="mt-4 text-muted-foreground">Start free, upgrade when you're serious.</p>
          </motion.div>

          <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-2">
            {/* Free */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="rounded-xl border border-border bg-card p-8"
            >
              <h3 className="text-lg font-semibold text-foreground">Free</h3>
              <p className="mt-1 text-sm text-muted-foreground">Get started</p>
              <p className="mt-6 text-4xl font-bold text-foreground">₹0<span className="text-base font-normal text-muted-foreground">/month</span></p>
              <ul className="mt-6 space-y-3 text-sm text-muted-foreground">
                {["1 daily quiz per week", "1 mock test per month", "Basic analytics", "Ad-supported"].map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-muted-foreground" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link to="/dashboard" className="mt-8 block">
                <Button variant="outline" className="w-full border-border text-foreground">
                  Get Started
                </Button>
              </Link>
            </motion.div>

            {/* Premium */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative rounded-xl border-2 border-primary bg-card p-8 glow-primary"
            >
              <div className="absolute -top-3 right-6 rounded-full bg-primary px-3 py-0.5 text-xs font-bold text-primary-foreground">
                POPULAR
              </div>
              <h3 className="text-lg font-semibold text-foreground">Premium</h3>
              <p className="mt-1 text-sm text-muted-foreground">Serious aspirants</p>
              <p className="mt-6 text-4xl font-bold text-foreground">
                ₹299<span className="text-base font-normal text-muted-foreground">/month</span>
              </p>
              <p className="mt-1 text-xs text-primary">or ₹2,499/year (save 17%)</p>
              <ul className="mt-6 space-y-3 text-sm text-foreground">
                {["Unlimited daily quizzes", "Unlimited mock tests", "Advanced analytics & heatmap", "Ad-free experience", "Weekly progress report", "Priority support"].map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link to="/dashboard" className="mt-8 block">
                <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                  Start Free Trial
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border py-20">
        <div className="container">
          <motion.div {...fadeUp} className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold md:text-4xl">
              Ready to gain <span className="text-primary">அறிவு</span>?
            </h2>
            <p className="mt-4 text-muted-foreground">
              Join 3,000+ aspirants already studying smarter, not harder.
            </p>
            <Link to="/dashboard" className="mt-8 inline-block">
              <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 glow-primary px-8">
                Start Free — No Credit Card
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container flex flex-col items-center justify-between gap-4 text-sm text-muted-foreground md:flex-row">
          <div className="flex items-center gap-2">
            <Brain className="h-4 w-4 text-primary" />
            <span className="font-semibold text-foreground">அறிவு</span>
          </div>
          <p>© 2026 அறிவு. Built for TNPSC aspirants.</p>
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            3,000+ aspirants
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
