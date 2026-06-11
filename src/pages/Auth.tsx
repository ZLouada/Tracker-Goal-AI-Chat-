import { SignIn, SignUp } from "@clerk/react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";

const Auth = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");

  useEffect(() => {
    if (user) navigate("/dashboard", { replace: true });
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 relative overflow-hidden">
      {/* Subtle decorative shapes like the landing page confetti */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[10%] left-[8%] w-16 h-16 rounded-full bg-primary/10 blur-sm" />
        <div className="absolute top-[20%] right-[12%] w-12 h-12 rounded-lg bg-primary/8 rotate-12 blur-sm" />
        <div className="absolute bottom-[15%] left-[15%] w-10 h-10 rounded-full bg-primary/10 blur-sm" />
        <div className="absolute bottom-[25%] right-[8%] w-14 h-14 rounded-lg bg-primary/6 -rotate-12 blur-sm" />
        <div className="absolute top-[50%] left-[5%] w-8 h-8 rounded-full bg-muted-foreground/5 blur-sm" />
        <div className="absolute top-[40%] right-[5%] w-20 h-20 rounded-full bg-primary/5 blur-md" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-block">
            <Logo size="lg" />
          </Link>
          <p className="text-muted-foreground mt-2 text-sm font-body">
            Track your goals, measure your progress
          </p>
        </div>

        {/* Mode toggle */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <button
            onClick={() => setMode("signin")}
            className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${
              mode === "signin"
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            Sign in
          </button>
          <button
            onClick={() => setMode("signup")}
            className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${
              mode === "signup"
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            Sign up
          </button>
        </div>

        {/* Clerk auth components */}
        <div className="flex justify-center">
          {mode === "signin" ? (
            <SignIn
              routing="hash"
              signUpUrl="/auth"
              forceRedirectUrl="/dashboard"
              appearance={{
                layout: {
                  logoImageUrl: "/logo.svg",
                },
                elements: {
                  rootBox: "w-full",
                  card: "shadow-none border border-border bg-card rounded-2xl",
                  headerTitle: "font-display",
                  headerSubtitle: "text-muted-foreground",
                  formButtonPrimary:
                    "bg-foreground text-background hover:bg-foreground/90 rounded-full h-11",
                  formFieldInput:
                    "rounded-full h-11 px-4 border-input",
                  footerActionLink: "text-primary hover:text-primary/80",
                  socialButtonsBlockButton:
                    "rounded-full h-11 border-input hover:bg-muted",
                  dividerLine: "bg-border",
                  dividerText: "text-muted-foreground",
                },
              }}
            />
          ) : (
            <SignUp
              routing="hash"
              signInUrl="/auth"
              forceRedirectUrl="/dashboard"
              appearance={{
                layout: {
                  logoImageUrl: "/logo.svg",
                },
                elements: {
                  rootBox: "w-full",
                  card: "shadow-none border border-border bg-card rounded-2xl",
                  headerTitle: "font-display",
                  headerSubtitle: "text-muted-foreground",
                  formButtonPrimary:
                    "bg-foreground text-background hover:bg-foreground/90 rounded-full h-11",
                  formFieldInput:
                    "rounded-full h-11 px-4 border-input",
                  footerActionLink: "text-primary hover:text-primary/80",
                  socialButtonsBlockButton:
                    "rounded-full h-11 border-input hover:bg-muted",
                  dividerLine: "bg-border",
                  dividerText: "text-muted-foreground",
                },
              }}
            />
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </p>
      </motion.div>
    </div>
  );
};

export default Auth;
