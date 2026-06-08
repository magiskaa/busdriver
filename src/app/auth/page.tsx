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
            <main className="flex min-h-screen w-full flex-col items-center justify-center p-8">
                <h1 className="text-2xl font-bold">
                    {isSubmitting ? "Signing you in..." : "Checking session..."}
                </h1>
            </main>
        );
    }

    return (
        <main className="flex min-h-screen w-full flex-col items-center justify-center p-8">
            <h1 className="text-6xl font-black text-center mb-12">Busdriver</h1>
            <form
                className="bg-white w-full max-w-md p-8 grid gap-4 rounded-xl shadow-xl"
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
                <h2 className="text-black text-center text-3xl font-bold mb-4">{step === "signIn" ? "Sign in" : "Sign up"}</h2>
                
                <input className="bg-zinc-100 text-black px-4 py-3 rounded-xl border border-zinc-200 outline-none focus:ring-2 focus:ring-green-500 transition-all" name="email" type="email" placeholder="Email" required />
                {step === "signUp" && (
                    <input className="bg-zinc-100 text-black px-4 py-3 rounded-xl border border-zinc-200 outline-none focus:ring-2 focus:ring-green-500 transition-all" name="username" type="text" placeholder="Username" required />
                )}
                <input className="bg-zinc-100 text-black px-4 py-3 rounded-xl border border-zinc-200 outline-none focus:ring-2 focus:ring-green-500 transition-all" name="password" type="password" placeholder="Password" required />
                <input name="flow" type="hidden" value={step} />
                
                <button
                    className="bg-green-600 text-white px-4 py-3 mt-2 rounded-xl font-bold text-lg shadow-lg shadow-green-900/30 transition-all hover:bg-green-700 active:scale-[0.98] disabled:opacity-50"
                    type="submit"
                    disabled={isSubmitting}
                >
                    {isSubmitting ? "Submitting..." : "Continue"}
                </button>
                <button
                    className="text-zinc-500 text-sm font-medium hover:text-green-600 transition-colors"
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => setStep(step === "signIn" ? "signUp" : "signIn")}
                >
                    {step === "signIn" ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
                </button>

                {errorMessage && (
                    <p className="text-center text-sm font-semibold text-red-500 mt-2">{errorMessage}</p>
                )}
            </form>
        </main>
    )
}