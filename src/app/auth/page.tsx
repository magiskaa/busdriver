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
        if (!isLoading && isAuthenticated) {
            router.replace("/");
        }
    }, [isAuthenticated, isLoading, router]);

    if (isLoading || isSubmitting) {
        return (
            <main className="flex min-h-screen w-full flex-col p-8">
                <h1 className="my-auto text-center text-2xl font-bold">
                    {isSubmitting ? "Signing you in..." : "Checking session..."}
                </h1>
            </main>
        );
    }

    return (
        <div className="flex min-h-screen w-full flex-col p-8">
            <form
                className="bg-white my-auto min-h-[300] grid gap-2 rounded-2xl"
                onSubmit={async (e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);

                    setErrorMessage(null);
                    setIsSubmitting(true);

                    try {
                        const result = await signIn("password", formData);

                        if (!result.signingIn) {
                            setErrorMessage("Authentication failed.");
                        }
                    } catch {
                        setErrorMessage("Authentication failed. Check your credentials and try again.");
                    } finally {
                        setIsSubmitting(false);
                    }
                }}
            >
                <h1 className="text-black text-center mt-8 my-auto text-4xl font-bold">{step === "signIn" ? "Sign in" : "Sign up"}</h1>
                
                <input className="bg-black px-4 py-2 mx-8 mt-4 rounded-lg" name="email" type="text" placeholder="Email" />
                {step === "signUp" ? (
                    <input className="bg-black px-4 py-2 mx-8 rounded-lg" name="username" type="text" placeholder="Username" />
                ) : (null)}
                <input className="bg-black px-4 py-2 mx-8 rounded-lg" name="password" type="password" placeholder="password" />
                <input name="flow" type="hidden" value={step} />
                
                <button
                    className="bg-green-700 px-4 py-2 mx-8 mt-4 rounded-lg"
                    type="submit"
                    disabled={isSubmitting}
                >
                    {isSubmitting ? "Submitting..." : "Submit"}
                </button>
                <button
                    className="text-blue-700 px-4 py-2 mx-8 mt-2 mb-4"
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => setStep(step === "signIn" ? "signUp" : "signIn")}
                >
                    {step === "signIn" ? "Sign up instead" : "Sign in instead"}
                </button>

                {errorMessage && (
                    <p className="mx-8 mb-6 text-sm text-red-600">{errorMessage}</p>
                )}
            </form>
        </div>
    )
}