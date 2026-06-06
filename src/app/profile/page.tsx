"use client";

import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { useConvexAuth } from "@convex-dev/auth/react";
import { SubmitEvent, useEffect, useState } from "react";
import { api } from "../../convex/_generated/api";
import { IoPerson } from "react-icons/io5";

export default function Home() {
    const router = useRouter();
    const { isAuthenticated, isLoading } = useConvexAuth();

    useEffect(() => {
        if (!isLoading && !isAuthenticated) { router.replace("/auth"); }
    }, [isAuthenticated, isLoading, router]);

    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    if (isLoading) {
        return (
            <main className="flex min-h-screen w-full flex-col p-8">
                <h1 className="my-auto text-center text-2xl font-bold">Checking session...</h1>
            </main>
        );
    }

    if (!isAuthenticated) {
        return null;
    }

    
    return (
        <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-6 p-8">
            <header className="space-y-2">
                <h1 className="text-4xl font-bold text-center mt-1.5">Profile</h1>
                <p className="max-w-1xl text-sm text-zinc-500 text-center">
                    Observe your stats or modify your profile
                </p>
            </header>

            <div className="rounded-2xl bg-white py-4 px-8 mt-4 text-black shadow-sm grid grid-cols-2 gap-y-8">    
                <div className="w-[100] h-[100] bg-gray-300 rounded-full">
                    <IoPerson color="gray" size={90} className="m-auto" onClick={() => router.push("/profile")} />
                </div>
                <h2 className="text-3xl font-semibold my-auto">Username</h2>
                <p className="mt-1 text-sm col-span-2">
                    Here will be your stats one day.
                </p>

                {errorMessage && <p className="mt-3 text-sm text-red-600">{errorMessage}</p>}
            </div>

            <button
                className="w-full rounded-2xl bg-red-700 py-4 px-8 text-black text-2xl font-semibold transition hover:bg-red-800"
            >
                Sign out
            </button>
        </main>
    );
}