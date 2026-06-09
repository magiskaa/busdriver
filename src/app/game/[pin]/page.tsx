"use client";

import { use, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { IoPerson, IoArrowBack, IoCheckmark, IoClose, IoAdd, IoRemove } from "react-icons/io5";
import { useRouter } from "next/navigation";

export default function GamePage({ params }: { params: Promise<{ pin: string }>; }) {
    const router = useRouter();
    const { pin: gamePin } = use(params);

    const getUserId = useQuery(api.users.userId);
    const getGame = useQuery(api.games.getGame, gamePin ? { pin: gamePin } : "skip");
    const players = useQuery(api.games.getPlayers, getGame?.players ? { pin: gamePin, ids: getGame.players } : "skip");
    
    const readyUp = useMutation(api.games.ready);
    const startGame = useMutation(api.games.start);
    const revealCard = useMutation(api.games.revealCard);
    const playCard = useMutation(api.games.playCard);
    const distributeSips = useMutation(api.games.distributeSips);

    const [sipDistribution, setSipDistribution] = useState<{
        total: number;
        assignments: Record<string, number>;
    } | null>(null);

    const rowOfIndex = (idx: number) => {
        if (idx >= 10) return 5;
        if (idx >= 6) return 4;
        if (idx >= 3) return 3;
        if (idx >= 1) return 2;
        return 1;
    };

    const allPlayersReady = getGame && getGame.players && getGame.ready ? getGame.players.every((player) => getGame.ready.includes(player)) : false;
    const myHand = getGame?.playerHands?.find(h => h.userId === getUserId)?.cards;
    const board = getGame?.board;
    const revealedCards = getGame?.revealed || [];
    const lastRevealedIdx = revealedCards[revealedCards.length - 1];
    const activeRow = lastRevealedIdx !== undefined ? rowOfIndex(lastRevealedIdx) : 5;

    if (getGame === null) {
        return (
            <main className="flex min-h-screen w-full flex-col items-center justify-center p-8">
                <h1 className="text-2xl font-bold">Game not found</h1>
                <button 
                    className="mt-4 text-blue-600 hover:underline"
                    onClick={() => router.replace("/")}
                >
                    Return home
                </button>
            </main>
        );
    }

    if (getGame?.status === "active") {
        const renderBoardCard = (index: number) => {
            const card = board?.[index];
            const isRevealed = revealedCards.includes(index);
            const cardRow = rowOfIndex(index);
            const isActiveRow = activeRow === cardRow;
            const isRed = card?.includes("♡") || card?.includes("♢");

            if (!isRevealed) {
                return (
                    <div 
                        key={index} 
                        onClick={() => revealCard({ pin: gamePin, index })}
                        className={`bg-blue-800 rounded-lg w-[80px] h-[110px] flex items-center justify-center shadow-md shrink-0 border-2 transition-all ${isActiveRow ? "border-white cursor-pointer hover:bg-blue-700 shadow-white/20 opacity-100" : "opacity-80"}`}
                    >
                        <div className="w-12 h-16 border border-white/20 rounded-sm flex items-center justify-center">
                            <span className="text-white/20 font-black text-xl">?</span>
                        </div>
                    </div>
                );
            }

            return (
                <div 
                    key={index} 
                    className={`bg-white text-black rounded-lg w-[80px] h-[110px] flex items-center justify-center shadow-md shrink-0 border-2 select-none transition-all ${isActiveRow ? "border-yellow-200 ring-1 ring-yellow-400/80" : "opacity-80 border-zinc-300"}`}
                >
                    <p className={`text-4xl font-bold ${isRed ? "text-red-600" : "text-black"}`}>
                        {card}
                    </p>
                </div>
            );
        };

        return (
            <main className="mx-auto min-h-screen w-full max-w-3xl flex flex-col p-8">
                <div className="flex-1 flex flex-col gap-2 items-center justify-start overflow-y-auto">
                    <div className="flex flex-row gap-4 pb-4 overflow-x-auto w-full justify-center">
                        {players?.map((player, idx) => {
                            if (player._id === getUserId) return null;
                            const hand = getGame.playerHands?.find(hand => hand.userId === player._id);
                            return (
                                <div key={idx} className="flex flex-col items-center justify-center gap-3 p-2 bg-zinc-800 rounded-lg border border-zinc-700">
                                    <p className="text-s font-semibold mb-1 truncate max-w-[90px]">{player.username}</p>
                                    <div className="flex flex-row -space-x-1">
                                        {hand?.cards.map((_, idx) => (
                                            <div key={idx} className="bg-blue-800 rounded-sm w-[15px] h-[24px] border border-white/30 shadow-sm shadow-black/50"></div>
                                        ))}
                                    </div>
                                </div>
                            )
                        })}
                    </div>

                    <div className="flex flex-col gap-3 py-4">
                        <div className="flex flex-row gap-3 justify-center">
                            {[0].map(renderBoardCard)}
                        </div>
                        <div className="flex flex-row gap-3 justify-center">
                            {[1, 2].map(renderBoardCard)}
                        </div>
                        <div className="flex flex-row gap-3 justify-center">
                            {[3, 4, 5].map(renderBoardCard)}
                        </div>
                        <div className="flex flex-row gap-3 justify-center">
                            {[6, 7, 8, 9].map(renderBoardCard)}
                        </div>
                        <div className="flex flex-row gap-3 justify-center">
                            {[10, 11, 12, 13, 14].map(renderBoardCard)}
                        </div>
                    </div>
                </div>

                <div className="flex flex-col items-center justify-center gap-2 pt-4 pb-6 border-t border-zinc-700 mt-auto">
                    <p className="text-xl font-bold text-blue-400">Your Hand</p>
                    <div className="flex justify-center gap-2.5 overflow-x-auto w-full px-4 py-3">
                        {myHand?.map((card, idx) => {
                            const isRed = card.includes("♡") || card.includes("♢");
                            const playerCardRank = card.replace(/[♠♣♡♢]/g, "");
                            
                            const canPlay = revealedCards.some(idx => {
                                if (rowOfIndex(idx) !== activeRow) return false;
                                return board![idx].replace(/[♠♣♡♢]/g, "") === playerCardRank;
                            });

                            return (
                                <div 
                                    key={idx} 
                                    onClick={async () => {
                                        if (canPlay && getUserId) {
                                            await playCard({ pin: gamePin, userId: getUserId, card });
                                            const sips = (6 - activeRow) * 2;
                                            const initialAssignments: Record<string, number> = {};
                                            players?.forEach(p => initialAssignments[p._id] = 0);
                                            setSipDistribution({
                                                total: sips,
                                                assignments: initialAssignments
                                            });
                                        }
                                    }}
                                    className={`bg-white text-black rounded-lg w-[75px] h-[105px] flex items-center justify-center shadow-lg shrink-0 border-2 select-none transition-all ${canPlay ? "cursor-pointer border-yellow-400 ring-2 ring-yellow-400/100 hover:-translate-y-2 hover:shadow-yellow-500/50" : "opacity-90 border-zinc-300"}`}
                                >
                                    <p className={`text-4xl font-bold ${isRed ? "text-red-600" : "text-black"}`}>
                                        {card}
                                    </p>
                                </div>
                            );
                        })}
                        {myHand?.length === 0 && (
                            <p className="text-zinc-500 italic mt-4">Well played! Remember, you can still get more sips.</p>
                        )}
                    </div>
                </div>

                {sipDistribution && (
                    <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
                        <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-md p-6 shadow-lg shadow-zinc-800/90">
                            <h2 className="text-2xl font-black text-center mb-1">Distribute Sips</h2>
                            <p className="text-blue-400 text-center font-bold mb-6">
                                Sips: {Object.values(sipDistribution.assignments).reduce((a, b) => a + b, 0)} / {sipDistribution.total}
                            </p>
                            
                            <div className="flex flex-col gap-4 max-h-[60vh] overflow-y-auto mb-6">
                                {players?.map(player => (
                                    <div key={player._id} className="flex items-center justify-between bg-zinc-800/50 p-4 rounded-xl border border-zinc-700/50">
                                        <div className="flex items-center gap-3">
                                            <div className="w-[50px] h-[50px] bg-zinc-600 rounded-full flex items-center justify-center">
                                                <IoPerson size={35} className="text-zinc-300" />
                                            </div>
                                            <span className="font-bold text-xl truncate max-w-[130px]">
                                                {player._id === getUserId ? "You" : player.username}
                                            </span>
                                        </div>
                                        
                                        <div className="flex items-center gap-4">
                                            <button 
                                                onClick={() => {
                                                    const current = sipDistribution.assignments[player._id] || 0;
                                                    if (current > 0) {
                                                        setSipDistribution({
                                                            ...sipDistribution,
                                                            assignments: { ...sipDistribution.assignments, [player._id]: current - 1 }
                                                        });
                                                    }
                                                }}
                                                className="w-[38px] h-[38px] rounded-full bg-zinc-700 flex items-center justify-center hover:bg-zinc-600 active:scale-95 transition-all"
                                            >
                                                <IoRemove size={20} />
                                            </button>
                                            
                                            <span className="text-2xl font-black w-5 text-center">
                                                {sipDistribution.assignments[player._id] || 0}
                                            </span>
                                            
                                            <button 
                                                onClick={() => {
                                                    const current = sipDistribution.assignments[player._id] || 0;
                                                    const totalAssigned = Object.values(sipDistribution.assignments).reduce((a, b) => a + b, 0);
                                                    if (totalAssigned < sipDistribution.total) {
                                                        setSipDistribution({
                                                            ...sipDistribution,
                                                            assignments: { ...sipDistribution.assignments, [player._id]: current + 1 }
                                                        });
                                                    }
                                                }}
                                                className="w-[38px] h-[38px] rounded-full bg-blue-600 flex items-center justify-center hover:bg-blue-500 active:scale-95 transition-all text-white"
                                            >
                                                <IoAdd size={20} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            
                            <button 
                                onClick={async () => {
                                    const totalAssigned = Object.values(sipDistribution.assignments).reduce((a, b) => a + b, 0);
                                    if (totalAssigned === sipDistribution.total && getUserId) {
                                        await distributeSips({
                                            pin: gamePin,
                                            giverId: getUserId,
                                            total: BigInt(sipDistribution.total),
                                            assignments: Object.entries(sipDistribution.assignments).map(([userId, sips]) => ({
                                                userId: userId as any,
                                                sips
                                            }))
                                        });
                                        setSipDistribution(null);
                                    }
                                }}
                                disabled={Object.values(sipDistribution.assignments).reduce((a, b) => a + b, 0) !== sipDistribution.total}
                                className="w-full bg-green-600 hover:bg-green-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white font-black py-4 rounded-xl text-xl transition-all shadow-lg shadow-green-600/20 disabled:shadow-zinc-500/20 active:scale-[0.98] disabled:cursor-not-allowed"
                            >
                                Done
                            </button>
                        </div>
                    </div>
                )}
            </main>
        );
    }

    return (
        <main className="mx-auto min-h-screen w-full max-w-3xl flex flex-col gap-8 p-8">
            <div>
                <p className="text-center text-lg mb-2">Game PIN:</p>
                <h1 className="text-5xl font-black text-center">{gamePin}</h1>
            </div>

            <div className="absolute left-8 top-9 w-[50px] h-[50px] rounded-full flex items-center justify-center">
                <IoArrowBack size={50} className="text-zinc-100 hover:text-zinc-400" onClick={() => router.push("/")} />
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full p-6 shadow-lg shadow-zinc-800/90">
                <h2 className="text-3xl font-black">Joined Players</h2>
                <div className="pt-4 mt-4 border-t border-zinc-700 flex flex-col ">
                    {players ? players.map((player, index) => (
                        <div key={player._id} className="flex items-center justify-between bg-zinc-800/50 px-4 py-2 rounded-xl border border-zinc-700/50 ">
                            <div className="flex items-center gap-3">
                                <div className="w-[50px] h-[50px] bg-zinc-600 rounded-full flex items-center justify-center flex-shrink-0">
                                    <IoPerson size={35} className="text-zinc-300" />
                                </div>
                                <span className="font-bold text-xl truncate max-w-[140px]">
                                    {player.username || `Player ${index}`}
                                </span>
                            </div>
                            
                            {player.ready ? (
                                <div className="flex-1 flex justify-end">
                                    <IoCheckmark size={35} className="text-green-600 mr-4" />
                                </div>
                            ) : (
                                <div className="flex-1 flex justify-end">
                                    <IoClose size={35} className="text-red-600 mr-4" />
                                </div>
                            )}

                            <div className="flex flex-col text-xl font-bold bg-zinc-700 px-3 py-1 rounded-lg border border-zinc-600 flex gap-1 min-w-[100px] justify-between">
                                <div className="flex items-baseline justify-between">
                                    <span>{player.games.toString()}</span>
                                    <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Games</span>
                                </div>
                                <div className="flex items-baseline justify-between">
                                    <span>{Number((player.lostGames * 100n) / (player.games || 1n))}%</span>
                                    <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">L%</span>
                                </div>
                            </div>
                        </div>
                    )) : (<p className="text-zinc-500 text-2xl font-bold italic">No players joined</p>)}
                </div>
            </div>

            <div className="flex-1 flex flex-col justify-end gap-8">
                <button
                    className="w-full bg-blue-700 hover:bg-blue-600 text-white font-black py-4 rounded-xl text-xl transition-all shadow-lg shadow-blue-700/20 active:scale-[0.98]"
					disabled={!getUserId}
                    onClick={() => getUserId && readyUp({ pin: gamePin, id: getUserId })}
				>
					Ready Up
				</button>
                <button
					className="mb-4 w-full bg-green-600 hover:bg-green-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white font-black py-4 rounded-xl text-xl transition-all shadow-lg shadow-green-600/20 disabled:shadow-zinc-500/20 active:scale-[0.98] disabled:cursor-not-allowed"
					disabled={!allPlayersReady}
					onClick={() => startGame({ pin: gamePin })}
				>
					{allPlayersReady ? "Start" : "Everyone needs to be ready"}
				</button>
            </div>
        </main>
    );
}