"use client";

import { useAuthActions, useConvexAuth } from "@convex-dev/auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function AuthForm() {
    const router = useRouter();
    const { signIn } = useAuthActions();
    const { isAuthenticated, isLoading } = useConvexAuth();
    const [step, setStep] = useState<"signIn" | "signUp">("signIn");
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (!isLoading && isAuthenticated) { router.replace("/"); }
    }, [isAuthenticated, isLoading, router]);

    if (isLoading || isSubmitting) {
        return (
            <main className="loading-main">
                <h1 className="loading-h1">
                    {isSubmitting ? "Signing you in..." : "Checking session..."}
                </h1>
            </main>
        );
    }

    return (
        <main className="justify-center">
            <h1 className="!text-5xl mb-4 sm:text-6xl sm:mb-12">Busdriver</h1>
            <form
                className="main-div grid gap-3 sm:p-8 sm:gap-4"
                onSubmit={async (e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);

                    setErrorMessage(null);
                    setIsSubmitting(true);

                    try {
                        const result = await signIn("password", formData);

                        if (result.signingIn) {
                            router.replace("/");
                        } else {
                            setErrorMessage("Authentication failed.");
                        }
                    } catch {
                        setErrorMessage("Authentication failed. Check your credentials and try again.");
                    } finally {
                        setIsSubmitting(false);
                    }
                }}
            >
                <h2 className="text-center py-1">{step === "signIn" ? "Sign in" : "Sign up"}</h2>
                
                <input name="email" type="email" placeholder="Email" required />
                {step === "signUp" && (
                    <input name="username" type="text" placeholder="Username" required />
                )}
                <input name="password" type="password" placeholder="Password" required />
                <input name="flow" type="hidden" value={step} />
                
                <button
                    className="mt-3 sm:mt-5"
                    type="submit"
                    disabled={isSubmitting}
                >
                    {isSubmitting ? "Submitting..." : "Continue"}
                </button>
                <button
                    className="!bg-transparent !text-zinc-500 !text-sm !font-medium hover:!text-green-600 !shadow-transparent !transition-colors"
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => setStep(step === "signIn" ? "signUp" : "signIn")}
                >
                    {step === "signIn" ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
                </button>

                {errorMessage && (
                    <p className="text-center text-sm font-semibold text-red-600 mt-2">{errorMessage}</p>
                )}
            </form>
        </main>
    )
}