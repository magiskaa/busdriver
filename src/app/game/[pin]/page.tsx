"use client";

import { use } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { IoPerson, IoArrowBack, IoCheckmark, IoClose } from "react-icons/io5";
import { useRouter } from "next/navigation";

export default function GamePage({ params }: { params: Promise<{ pin: string }>; }) {
    const router = useRouter();
    const { pin: gamePin } = use(params);
    const getUserId = useQuery(api.users.userId);
    const getGame = useQuery(api.games.getGame, gamePin ? { pin: gamePin } : "skip");
    const players = useQuery(api.games.getPlayers, getGame?.players ? { pin: gamePin, ids: getGame.players } : "skip");
    const readyUp = useMutation(api.games.ready);
    const updateStatus = useMutation(api.games.status);

    const allPlayersReady = getGame && getGame.players && getGame.ready ? getGame.players.every((player) => getGame.ready.includes(player)) : false;
 
    const handleStartGame = async () => {

    };

    if (getGame === null) {
        return (
            <main className="flex min-h-screen w-full flex-col items-center justify-center p-8">
                <h1 className="text-2xl font-bold">Game not found</h1>
                <button 
                    className="mt-4 text-blue-600 hover:underline"
                    onClick={() => router.push("/")}
                >
                    Return home
                </button>
            </main>
        );
    }

    return (
        <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-8 p-8">
            <div>
                <p className="text-center text-lg mb-2">Game PIN:</p>
                <h1 className="text-5xl font-black text-center">{gamePin}</h1>
            </div>

            <div className="absolute w-[50px] h-[50px] bg-white left-8 top-9 rounded-full shadow-sm hover:bg-zinc-100 transition-colors flex items-center justify-center cursor-pointer">
                <IoArrowBack color="black" size={30} onClick={() => router.push("/")} />
            </div>

            <div className="bg-white text-black p-8 mt-4 rounded-xl">
                <h2 className="font-bold text-3xl">Joined Players</h2>
                <div className="border-t-3 mt-4 flex flex-col divide-y">
                    {players ? players.map((player, index) => (
                        <div key={player._id} className="py-4 flex items-center gap-5">
                            <div className="w-[65px] h-[65px] bg-gray-300 rounded-full flex shrink-0">
                                <IoPerson color="gray" size={52} className="m-auto" />
                            </div>
                            
                            <h3 className="text-2xl font-semibold truncate">{player.username || `Player ${index}`}</h3>
                            
                            {player.ready ? (
                                <div className="flex-1 ml-[-12px]">
                                    <IoCheckmark size={32} color="green" />
                                </div>
                            ) : (
                                <div className="flex-1 ml-[-12px]">
                                    <IoClose size={32} color="red" />
                                </div>
                            )}

                            <div className="flex flex-col text-xl font-bold bg-zinc-100 px-3 py-1 rounded-lg border border-zinc-200 flex gap-1 min-w-[100px] justify-between">
                                <div className="flex items-baseline justify-between">
                                    <span>{player.games.toString()}</span>
                                    <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Games</span>
                                </div>
                                <div className="flex items-baseline justify-between">
                                    <span>{Number((player.lostGames * 100n) / (player.games || 1n))}%</span>
                                    <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">L%</span>
                                </div>
                            </div>
                        </div>
                    )) : (<p className="text-zinc-500 text-2xl font-bold italic">No players joined</p>)}
                </div>
            </div>

            <div className="flex-1 flex flex-col justify-end gap-8">
                <button
					className="bg-blue-600 w-full text-white px-4 py-2 rounded-xl font-bold text-2xl shadow-lg shadow-blue-900/60 transition-all hover:bg-blue-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-zinc-400"
					disabled={!getUserId}
                    onClick={() => getUserId && readyUp({ pin: gamePin, id: getUserId })}
				>
					Ready Up
				</button>
                <button
					className="bg-green-600 w-full text-white px-4 py-2 mb-6 rounded-xl font-bold text-2xl shadow-lg shadow-green-900/60 transition-all hover:bg-green-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-zinc-400"
					disabled={!allPlayersReady}
					onClick={handleStartGame}
				>
					{allPlayersReady ? "Start" : "Everyone needs to be ready"}
				</button>
            </div>
        </main>
    );
}