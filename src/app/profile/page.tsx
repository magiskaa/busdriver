"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { useConvexAuth, useAuthActions } from "@convex-dev/auth/react";
import { useEffect } from "react";
import { api } from "../../../convex/_generated/api";
import { IoPerson, IoArrowBack } from "react-icons/io5";

export default function Home() {
    const router = useRouter();
    const { isAuthenticated, isLoading } = useConvexAuth();
    const { signOut } = useAuthActions();
    
    useEffect(() => {
        if (!isLoading && !isAuthenticated) { router.replace("/auth"); }
    }, [isAuthenticated, isLoading, router]);
    
    const getUserId = useQuery(api.users.userId, !isLoading && isAuthenticated ? {} : "skip");
    const getUser = useQuery(api.users.get, !isLoading && isAuthenticated ? {} : "skip");
    const getStats = useQuery(api.stats.get, getUserId ? { userId: getUserId } : "skip");
    const updateStats = useMutation(api.stats.update);

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

    const editProfile = async () => {};
    
    return (
        <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-8 p-8">
            <header className="space-y-2">
                <h1 className="text-5xl font-bold text-center mt-1.5">Profile</h1>
                <p className="max-w-1xl text-sm text-zinc-500 text-center">
                    Observe your stats or edit your profile
                </p>
            </header>

            <div className="absolute w-[50px] h-[50px] bg-white left-8 top-9 rounded-full">
                <IoArrowBack color="black" size={50} className="m-auto" onClick={() => router.push("/")} />
            </div>

            <div className="rounded-xl bg-white p-8 mt-2 text-black flex flex-col gap-8">
                <div className="flex items-center gap-8">
                    <div className="w-[120px] h-[120px] bg-gray-300 rounded-full flex">
                        <IoPerson color="gray" size={100} className="m-auto" onClick={() => router.push("/profile")} />
                    </div>
                    <div>
                        <h2 className="text-4xl font-semibold">{getUser?.username || "Username"}</h2>
                        <button
                            className="bg-zinc-100 text-zinc-500 px-8 py-1.5 mt-5 mb-[-6px] border border-zinc-300 rounded-xl shadow-lg shadow-zinc-900/10 transition-all hover:bg-zinc-200 active:scale-[0.98]"
                            onClick={editProfile}
                        >
                            Edit profile
                        </button>
                    </div>
                </div>
                
                <div className="grid grid-cols-2 gap-y-4 border-t pt-8">
                    <p className="text-xl">
                        Games: <strong>{getStats?.games?.toString() || 0}</strong>
                    </p>
                    <p className="text-xl">
                        Sips given: <strong>{getStats?.sipsGiven?.toString() || 0}</strong>
                    </p>
                    <p className="text-xl">
                        Lost games: <strong>{getStats?.lostGames?.toString() || 0}</strong>
                    </p>
                    <p className="text-xl">
                        Sips recieved: <strong>{getStats?.sipsRecieved?.toString() || 0}</strong>
                    </p>
                    <p className="text-xl">
                        L%: <strong>{getStats ? Number((getStats.lostGames * 100n) / (getStats.games || 1n)) : 0}%</strong>
                    </p>
                    <p className="text-xl">
                        Driving sips: <strong>{getStats?.drivingSips?.toString() || 0}</strong>
                    </p>
                </div>
            </div>

            <button
                className="bg-red-600 text-white px-4 py-3 rounded-xl font-bold text-2xl shadow-lg shadow-red-900/60 transition-all hover:bg-red-700 active:scale-[0.98]"
                onClick={() => signOut()}
            >
                Sign out
            </button>
        </main>
    );
}