"use client";

import { use } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";

export default function GamePage({ params }: { params: Promise<{ pin: string }>; }) {
    const { pin: gamePin } = use(params);

    if (gamePin === undefined || gamePin === null) {
        return <p>Game not found</p>;
    }

    return (
        <main className="p-8">
            <div>
                <p className="text-center text-sm mb-2">Game PIN:</p>
                <h1 className="text-3xl font-bold text-center">{gamePin}</h1>
            </div>

            <div className="bg-gray-900 mt-12 rounded-xl">
                <h2 className="font-bold p-4">Joined Players</h2>
            </div>
        </main>
    );
}