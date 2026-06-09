"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { useConvexAuth, useAuthActions } from "@convex-dev/auth/react";
import { useEffect } from "react";
import { api } from "../../../convex/_generated/api";
import { IoPerson, IoArrowBack } from "react-icons/io5";

export default function ProfilePage() {
    const router = useRouter();
    const { isAuthenticated, isLoading } = useConvexAuth();
    const { signOut } = useAuthActions();
    
    useEffect(() => {
        if (!isLoading && !isAuthenticated) { router.replace("/auth"); }
    }, [isAuthenticated, isLoading, router]);
    
    const getUserId = useQuery(api.users.userId);
    const getUser = useQuery(api.users.get);
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
                <h1 className="text-5xl font-black text-center mt-1.5">Profile</h1>
                <p className="text-sm text-zinc-500 text-center">
                    Observe your stats or edit your profile
                </p>
            </header>

            <div className="absolute left-8 top-9 w-[50px] h-[50px] rounded-full flex items-center justify-center">
                <IoArrowBack size={50} className="text-zinc-100 hover:text-zinc-400" onClick={() => router.push("/")} />
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full p-6 shadow-lg shadow-zinc-800/90 flex flex-col gap-8">
                <div className="flex items-center justify-start gap-8">
                    <div className="w-[120px] h-[120px] bg-zinc-600 rounded-full flex items-center justify-center">
                        <IoPerson size={84} className="text-zinc-300" onClick={() => router.push("/profile")} />
                    </div>
                    <div>
                        <h2 className="text-4xl font-bold">{getUser?.username || "Username"}</h2>
                        <button
                            className="border border-zinc-700 px-4 mt-6 mb-[-10px] mt-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-black py-1 rounded-xl transition-all shadow-lg shadow-zinc-800/20 active:scale-[0.98]"
                            onClick={editProfile}
                        >
                            Edit profile
                        </button>
                    </div>
                </div>
                
                <div className="grid grid-cols-2 gap-y-4 border-t border-zinc-700 pt-8">
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
                className="w-full bg-red-700 hover:bg-red-600 text-white font-black py-4 rounded-xl text-xl transition-all shadow-lg shadow-red-700/20 active:scale-[0.98]"
                onClick={() => signOut()}
            >
                Sign out
            </button>
        </main>
    );
}