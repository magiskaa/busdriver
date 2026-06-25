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
    
    const userId = useQuery(api.users.getUserId);
    const user = useQuery(api.users.getUser);
    const getStats = useQuery(api.stats.get, userId ? { userId: userId } : "skip");

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
        <main>
            <header>
                <h1>Profile</h1>
                <p className="header-p">
                    Observe your stats or edit your profile
                </p>
            </header>

            <div className="back-arrow-div">
                <IoArrowBack className="back-arrow-icon" onClick={() => router.push("/")} />
            </div>

            <div className="main-div flex flex-col gap-4 sm:gap-8">
                <div className="flex items-center justify-start gap-8">
                    <div className="w-[100px] h-[100px] bg-zinc-600 rounded-full flex items-center justify-center flex-shrink-0 sm:w-[120px] sm:h-[120px]">
                        <IoPerson className="text-zinc-300 w-[70px] h-[70px] sm:w-[84px] sm:h-[84px]" />
                    </div>
                    <div className="overflow-hidden">
                        <h2 className="truncate max-w-[200px]">{user?.username || "Username"}</h2>
                        <button
                            className="max-w-fit border border-zinc-700 px-2 mt-4 !bg-zinc-800 hover:!bg-zinc-700 !text-sm !text-zinc-300 !py-1 !shadow-zinc-800/20 sm:px-4 sm:!mt-6 sm:!text-xl"
                            onClick={editProfile}
                        >
                            Edit profile
                        </button>
                    </div>
                </div>
                
                <div className="grid grid-cols-2 gap-y-4 border-t border-zinc-700 pt-4 sm:pt-8">
                    <p className="profile-stats-p">
                        GAMES: <strong className="profile-stats-strong">{getStats?.games?.toString() || 0}</strong>
                    </p>
                    <p className="profile-stats-p">
                        SIPS GIVEN: <strong className="profile-stats-strong">{getStats?.sipsGiven?.toString() || 0}</strong>
                    </p>
                    <p className="profile-stats-p">
                        LOST GAMES: <strong className="profile-stats-strong">{getStats?.lostGames?.toString() || 0}</strong>
                    </p>
                    <p className="profile-stats-p">
                        SIPS RECEIVED: <strong className="profile-stats-strong">{getStats?.sipsReceived?.toString() || 0}</strong>
                    </p>
                    <p className="profile-stats-p">
                        L%: <strong className="profile-stats-strong">{getStats ? (getStats.lostGames * 100) / (getStats.games || 1) : 0}%</strong>
                    </p>
                    <p className="profile-stats-p">
                        DRIVING SIPS: <strong className="profile-stats-strong">{getStats?.drivingSips?.toString() || 0}</strong>
                    </p>
                </div>
            </div>

            <button
                className="!bg-red-700 hover:!bg-red-600 !shadow-red-700/20"
                onClick={() => signOut()}
            >
                Sign out
            </button>
        </main>
    );
}