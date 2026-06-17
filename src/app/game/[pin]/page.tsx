"use client";

import { use, useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { IoPerson, IoArrowBack, IoCheckmark, IoClose, IoAdd, IoRemove } from "react-icons/io5";
import { useRouter } from "next/navigation";

export default function GamePage({ params }: { params: Promise<{ pin: string }>; }) {
    const router = useRouter();
    const { pin: gamePin } = use(params);
    const [nowTs, setNowTs] = useState(0);
    const isResolvingDriveRef = useRef(false);

    const getUserId = useQuery(api.users.userId);
    const getGame = useQuery(api.games.getGame, gamePin ? { pin: gamePin } : "skip");
    const players = useQuery(api.games.getPlayers, getGame?.players ? { pin: gamePin, ids: getGame.players } : "skip");
    
    const readyUp = useMutation(api.games.ready);
    const startGame = useMutation(api.games.start);
    const revealCard = useMutation(api.games.revealCard);
    const playCard = useMutation(api.games.playCard);
    const distributeSips = useMutation(api.games.distributeSips);
    const tied = useMutation(api.games.tied);
    const pickCard = useMutation(api.games.pickCard);
    const revealTieBreaker = useMutation(api.games.revealTieBreaker);
    const updateLoser = useMutation(api.games.updateLoser);
    const startDrive = useMutation(api.games.startDrive);
    const revealDriveCard = useMutation(api.games.revealDriveCard);
    const resolveDriveRound = useMutation(api.games.resolveDriveRound);
    const finalizeDrive = useMutation(api.games.finalizeDrive);

    const [sipDistribution, setSipDistribution] = useState<{
        total: number;
        assignments: Record<string, number>;
    } | null>(null);
    const isFinalizingDriveRef = useRef(false);

    const rowOfIndex = (idx: number) => {
        if (idx >= 10) return 5;
        if (idx >= 6) return 4;
        if (idx >= 3) return 3;
        if (idx >= 1) return 2;
        return 1;
    };

    const playersReadyStart = getGame && getGame.players && getGame.startReady ? getGame.players.every(player => getGame.startReady.includes(player)) : false;
    const myHand = getGame?.playerHands?.find(h => h.userId === getUserId)?.cards;
    const board = getGame?.board;
    const revealedCards = getGame?.revealed || [];
    const lastRevealedIdx = revealedCards[revealedCards.length - 1];
    const activeRow = lastRevealedIdx !== undefined ? rowOfIndex(lastRevealedIdx) : 5;
    const mySips = getGame?.sips?.find(user => user.userId === getUserId);
    const isBaseGameDone = board && revealedCards.length === board.length;
    const playersReadyDrive = getGame && getGame.players && getGame.drive.ready ? getGame.players.every(player => getGame.drive.ready.includes(player)) : false;
    const tieBreakersRevealed = getGame && getGame.tie?.tiedPlayers.every(player => player.revealed === true);

    useEffect(() => {
        const intervalId = setInterval(() => setNowTs(Date.now()), 500);
        return () => clearInterval(intervalId);
    }, []);
    

    useEffect(() => {
        if (playersReadyDrive && getGame?.status === "active") {
            const hands = getGame?.playerHands ? [...getGame.playerHands] : [];
            hands.sort((a, b) => b.cards.length - a.cards.length);
            const mostCards = hands[0].cards.length;
            const tiedPlayers = hands?.filter(hand => hand.cards.length === mostCards).map(hand => hand.userId);

            tied({ pin: gamePin, tiedPlayers })
        }
    }, [getGame, playersReadyDrive, gamePin, tied])

    useEffect(() => {
        if (tieBreakersRevealed && getGame?.status === "tied") {
            const getCardRank = (rank: string) => {
                switch (rank) {
                    case "A":
                        return 1;
                    case "J":
                        return 11;
                    case "Q":
                        return 12;
                    case "K":
                        return 13;
                    default:
                        return Number(rank);
                }
            }

            const tiedPlayers = getGame.tie?.tiedPlayers ?? [];
            const tieCards = getGame.tie?.cards ?? [];
            const ranked = tiedPlayers.map((player) => {
                const p = players?.find(p => p._id === player.userId);
                const games = p?.games || 1;
                const lostGames = p?.lostGames || 0;

                return {
                    userId: player.userId,
                    rank: getCardRank(tieCards[player.cardPicked ?? 0].replace(/[♠♣♡♢]/g, "")),
                    ratio: lostGames / games * 100,
                }
            });

            ranked.sort((a, b) => a.rank - b.rank || a.ratio - b.ratio);
            const loser = ranked[0].userId;
            updateLoser({ pin: gamePin, loser });

            setTimeout(() => {
                startDrive({ pin: gamePin });
            }, 5000);
        }
    }, [getGame, tieBreakersRevealed, gamePin, players, startDrive, updateLoser]);

    useEffect(() => {
        if (
            getGame?.status !== "driving" ||
            !getUserId ||
            getGame.drive.loser !== getUserId ||
            !getGame.drive.dealNewRoundAt ||
            isResolvingDriveRef.current
        ) {
            return;
        }

        isResolvingDriveRef.current = true;
        resolveDriveRound({ pin: gamePin, userId: getUserId })
            .finally(() => {
                isResolvingDriveRef.current = false;
            });
    }, [getGame, getUserId, gamePin, nowTs, resolveDriveRound]);

    useEffect(() => {
        if (
            getGame?.status !== "driving" ||
            !getGame.drive.finishAt ||
            isFinalizingDriveRef.current
        ) {
            return;
        }

        isFinalizingDriveRef.current = true;
        finalizeDrive({ pin: gamePin }).finally(() => {
            isFinalizingDriveRef.current = false;
        });
    }, [getGame, gamePin, nowTs, finalizeDrive]);

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

    if (getGame?.status === "finished") {
        return (
            <main className="flex min-h-screen w-full flex-col items-center justify-center gap-6 p-8">
                <h1 className="text-4xl font-black">Game Finished</h1>
                <button
                    className="rounded-xl bg-blue-700 px-6 py-3 text-xl font-black text-white hover:bg-blue-600"
                    onClick={() => router.replace("/")}
                >
                    Return Home
                </button>
            </main>
        );
    }
    
    if (getGame?.status === "driving") {
        const renderBoardCard = (index: number) => {
            const board = getGame?.drive.board;
            const revealedCards = getGame?.drive.revealed || [];
            
            const loser = getGame?.drive.loser;
            const isLoser = getUserId && loser === getUserId;

            const waitingForReplace = Boolean(getGame?.drive.dealNewRoundAt);
            const waitingForFinish = Boolean(getGame?.drive.finishAt);
            const cardsLocked = waitingForReplace || waitingForFinish;

            const card = board?.[index];
            const cardRow = rowOfIndex(index);
            const isRevealed = revealedCards.includes(index);
            const rowAlreadyRevealed = revealedCards.some(idx => rowOfIndex(idx) === cardRow);
            const expectedRow = Math.max(1, 5 - revealedCards.length);
            const isExpectedRow = cardRow === expectedRow;
            const canReveal = isLoser && !waitingForReplace && !waitingForFinish && !isRevealed && !rowAlreadyRevealed && isExpectedRow;
            
            const rank = card?.replace(/[♠♣♡♢]/g, "");
            const isPenaltyRank = rank === "J" || rank === "Q" || rank === "K" || rank === "A";
            const isRed = card?.includes("♡") || card?.includes("♢");
            
            if (!isRevealed) {
                return (
                    <div 
                        key={index} 
                        onClick={() => canReveal && getUserId && revealDriveCard({ pin: gamePin, userId: getUserId, index })}
                        className={`bg-blue-800 rounded-lg w-[80px] h-[110px] flex items-center justify-center shadow-md shrink-0 border-2 transition-all ${canReveal ? "border-white cursor-pointer hover:bg-blue-700 shadow-white/20 opacity-100" : cardsLocked ? "opacity-50 border-zinc-600 cursor-not-allowed" : "opacity-80 border-zinc-500"}`}
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
                    className={`bg-white text-black rounded-lg w-[80px] h-[110px] flex items-center justify-center shadow-md shrink-0 border-2 select-none transition-all ${isPenaltyRank ? "border-red-500 ring-3 ring-red-500 shadow-red-500/50" : cardsLocked ? "border-zinc-400 opacity-55" : "border-yellow-200"}`}
                >
                    <p className={`text-4xl font-bold ${isRed ? "text-red-600" : "text-black"}`}>
                        {card}
                    </p>
                </div>
            );
        };

        const loser = getGame.drive.loser;

        return (
            <main className="mx-auto min-h-screen w-full max-w-3xl flex flex-col px-8 gap-4">
                <div className="flex flex-row wrap gap-4 overflow-x-auto w-full justify-center pt-8 pb-4">
                    {players?.map((player, idx) => {
                        if (player._id === loser) return null;
                        const playerSips = getGame.sips?.find(user => user.userId === player._id);
                        return (
                            <div key={idx} className="relative flex flex-col items-center justify-center gap-3 p-2 bg-zinc-800 rounded-lg border border-zinc-700 w-[150px]">
                                {playerSips && playerSips.sipsReceived > 0n && (
                                    <div className="absolute -top-4 -right-3 bg-red-600 text-white font-black px-2 py-0.5 rounded-full shadow-xl">
                                        +{playerSips.sipsReceived.toString()}
                                    </div>
                                )}
                                <p className="text-lg font-semibold truncate max-w-[135px]">{player.username}</p>
                            </div>
                        );
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
                    {getGame.drive.finishAt && (
                        <p className="text-center text-2xl font-black text-blue-400 mt-4">Game Finished!</p>
                    )}
                </div>

                <div className="flex flex-col items-center justify-center gap-2 pt-4 pb-10 border-t border-zinc-700 mt-auto">
                    <p className="flex-1 text-zinc-400">LOSER</p>
                    <p className="text-3xl font-semibold mb-4">{players?.find(player => player._id === loser)?.username ?? "Username"}</p>
                    <strong className="relative text-5xl text-white">{getGame.drive.sips}
                        <span className="absolute -right-7 text-zinc-400 text-base">
                            ({getGame?.sips?.find(user => user.userId === getGame.drive.loser)?.sipsReceived ?? 0})
                        </span>
                    </strong>
                </div>
            </main>
        );
    }


    if (getGame?.status === "tied") {
        const renderBoardCard = (index: number) => {
            const isPicked = getGame.tie?.picked.includes(index);

            if (!isPicked) {
                return (
                    <div 
                        key={index} 
                        onClick={() => getUserId && pickCard({ pin: gamePin, userId: getUserId, index })}
                        className={"bg-blue-800 rounded-lg w-[80px] h-[110px] flex items-center justify-center shadow-md shrink-0 border-2 transition-all border-white cursor-pointer hover:bg-blue-700 shadow-white/20"}
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
                    className={"bg-blue-800 rounded-lg w-[80px] h-[110px] flex items-center justify-center shadow-md shrink-0 border-2 transition-all border-white shadow-white/20 border-yellow-400 ring-3 ring-yellow-400"}
                >
                    <div className="w-12 h-16 border border-white/20 rounded-sm flex items-center justify-center">
                        <span className="text-white/20 font-black text-xl">?</span>
                    </div>
                </div>
            );
        };

        return (
            <main className="mx-auto min-h-screen w-full max-w-3xl flex flex-col p-8 gap-8">
                <header className="space-y-2 mx-auto">
                    <h1 className="text-5xl font-black text-center mt-1.5">Game Tied</h1>
                    <p className="text-sm text-zinc-500 text-center max-w-sm">
                        If you are tied with someone, please pick a card. Once you have picked a card, you can reveal it by pressing on it.
                    </p>
                </header>

                <div className="w-full flex flex-col p-4 gap-8">
                    <div className="flex flex-row gap-8 justify-center">
                        {[0, 1, 2].map(renderBoardCard)}
                    </div>
                    <div className="flex flex-row gap-8 justify-center">
                        {[3, 4, 5].map(renderBoardCard)}
                    </div>
                </div>

                <div className="flex flex-row flex-wrap items-center justify-center gap-4">
                    {players?.map((player, idx) => {
                        if (!getGame.tie?.tiedPlayers.map(p => p.userId).includes(player._id)) { return null; }
                        const tiedPlayer = getGame.tie?.tiedPlayers.find(p => p.userId === player._id);
                        const card = tiedPlayer?.cardPicked !== undefined ? getGame.tie.cards[tiedPlayer.cardPicked] : undefined;
                        const isRed = card?.toString().includes("♡") || card?.toString().includes("♢");
                        const revealed = tiedPlayer?.revealed;

                        return (
                            <div key={idx} className="flex flex-col items-center justify-center gap-3 p-3 bg-zinc-800 rounded-lg border border-zinc-700 w-[130px]">
                                <p className="text-lg font-semibold truncate max-w-[115px]">{player.username}</p>
                                {card && revealed ? (
                                    <div className={"bg-white text-black rounded-lg w-[64px] h-[88px] flex items-center justify-center shadow-md shrink-0 border-2 select-none transition-all"}>
                                        <p className={`text-4xl font-bold ${isRed ? "text-red-600" : "text-black"}`}>
                                            {card}
                                        </p>
                                    </div>
                                ) : card ? (
                                    <div 
                                        className={"bg-blue-800 rounded-lg w-[64px] h-[88px] flex items-center justify-center shadow-md shrink-0 border-2 transition-all border-white cursor-pointer hover:bg-blue-700 shadow-white/20"}
                                        onClick={() => getUserId && tiedPlayer?.cardPicked !== undefined && revealTieBreaker({ pin: gamePin, userId: getUserId })}
                                    >
                                        <div className="w-9 h-12 border border-white/20 rounded-sm flex items-center justify-center">
                                            <span className="text-white/20 font-black text-xl">?</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className={"rounded-lg w-[64px] h-[88px] shadow-md shrink-0 border-2 transition-all border-zinc-500 shadow-white/10"}></div>
                                )}
                            </div>
                        )
                    })}
                </div>

                {tieBreakersRevealed && (
                    <div className="flex flex-col items-center justify-center mt-2">
                        <p className="flex-1 text-zinc-400">LOSER</p>
                        <p className="text-3xl font-semibold mb-10">{players?.find(p => p._id === getGame.drive.loser)?.username || ""}</p>
                        <p className="text-2xl font-bold text-blue-500">The driving will begin in 5 seconds...</p>
                    </div>
                )}
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
                    className={`bg-white text-black rounded-lg w-[80px] h-[110px] flex items-center justify-center shadow-md shrink-0 border-2 select-none transition-all ${isActiveRow ? "border-yellow-400 ring-1 ring-yellow-400" : "opacity-80 border-zinc-300"}`}
                >
                    <p className={`text-4xl font-bold ${isRed ? "text-red-600" : "text-black"}`}>
                        {card}
                    </p>
                </div>
            );
        };

        return (
            <main className="mx-auto min-h-screen w-full max-w-3xl flex flex-col px-8 gap-4">
                <div className="flex flex-row gap-4 overflow-x-auto w-full justify-center pt-8 pb-4">
                    {players?.map((player, idx) => {
                        if (player._id === getUserId) return null;
                        const hand = getGame.playerHands?.find(hand => hand.userId === player._id);
                        const playerSips = getGame.sips?.find(user => user.userId === player._id);
                        return (
                            <div key={idx} className="relative flex flex-col items-center justify-center gap-3 p-2 bg-zinc-800 rounded-lg border border-zinc-700 w-[105px]">
                                {playerSips && playerSips.sipsReceived > 0n && (
                                    <div className="absolute -top-4 -right-3 bg-red-600 text-white font-black px-2 py-0.5 rounded-full shadow-xl">
                                        +{playerSips.sipsReceived.toString()}
                                    </div>
                                )}
                                <p className="text-lg font-semibold truncate max-w-[90px]">{player.username}</p>
                                <div className="flex flex-row -space-x-0.5">
                                    {hand?.cards.map((_, idx) => (
                                        <div key={idx} className="bg-blue-800 rounded-sm w-[15px] h-[24px] border border-white/30 shadow-sm shadow-black/50"></div>
                                    ))}
                                </div>
                            </div>
                        )
                    })}
                </div>
                
                <div className="relative flex flex-col gap-3 py-4">
                    {isBaseGameDone && (
                        <button
                            className="flex flex-col items-center justify-center gap-1 absolute right-0 top-8 bg-blue-700 hover:bg-blue-600 text-white font-black p-4 rounded-xl text-xl transition-all shadow-lg shadow-blue-700/20 active:scale-[0.95]"
                            onClick={() => getUserId && readyUp({ id: getUserId, pin: gamePin, isStart: false })}
                        >
                            Ready
                            <span>{getGame?.drive?.ready?.length ?? 0} / {getGame.players.length}</span>
                        </button>
                    )}
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


                <div className="flex flex-col items-center justify-center gap-3 pt-3 pb-2 border-t border-zinc-700 mt-auto">
                    <div className="flex flex-row items-center justify-center gap-16 w-full">
                        <span className="flex-1 text-right text-zinc-400">
                            GIVEN
                            <strong className="ml-4 text-3xl text-white">{mySips?.sipsGiven?.toString() ?? 0}</strong>
                        </span>
                        <p className="text-xl font-bold text-blue-500">Your Hand</p>    
                        <span className="flex-1 text-zinc-400">
                            <strong className="mr-4 text-3xl text-white">{mySips?.sipsReceived?.toString() ?? 0}</strong>
                            RECEIVED
                        </span>
                    </div>

                    <div className="flex justify-center gap-2.5 overflow-x-auto w-full px-4 pt-2.5 pb-8">
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
                                    className={`bg-white text-black rounded-lg w-[75px] h-[105px] flex items-center justify-center shadow-lg shrink-0 border-2 select-none transition-all ${canPlay ? "cursor-pointer border-yellow-400 ring-2 ring-yellow-400 hover:-translate-y-2 hover:shadow-yellow-500/50" : "opacity-90 border-zinc-300"}`}
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
                            <p className="text-blue-500 text-center font-bold mb-6">
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
                                                className="w-[38px] h-[38px] rounded-full bg-zinc-700 flex items-center justify-center hover:bg-zinc-600 active:scale-[0.9] transition-all"
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
                                                className="w-[38px] h-[38px] rounded-full bg-blue-600 flex items-center justify-center hover:bg-blue-500 active:scale-[0.9] transition-all text-white"
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
                                            total: sipDistribution.total,
                                            assignments: Object.entries(sipDistribution.assignments).map(([userId, sips]) => ({
                                                userId: userId as Id<"users">,
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

    if (getGame?.status === "waiting") {
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
                    <div className="flex flex-row items-center justify-between">
                        <h2 className="text-3xl font-black">Joined Players</h2>
                        <span className="text-3xl font-black">{players?.length} / 6</span>
                    </div>

                    <div className="pt-4 mt-4 border-t border-zinc-700 flex flex-col gap-3">
                        {players ? players.map((player, index) => (
                            <div key={player._id} className="flex items-center justify-between bg-zinc-800/50 px-4 py-1.5 rounded-xl border border-zinc-700/50">
                                <div className="flex items-center gap-3 flex-1">
                                    <div className="w-[50px] h-[50px] bg-zinc-600 rounded-full flex items-center justify-center flex-shrink-0">
                                        <IoPerson size={35} className="text-zinc-300" />
                                    </div>
                                    <span className="flex-1 font-bold text-xl truncate max-w-[140px]">
                                        {player.username || `Player ${index}`}
                                    </span>
                                </div>
                                
                                <div className="flex flex-col text-xl font-bold bg-zinc-700/50 px-3 py-0.5 rounded-lg border border-zinc-700 min-w-[100px] justify-between">
                                    <div className="flex items-baseline justify-between">
                                        <span>{player.games.toString()}</span>
                                        <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Games</span>
                                    </div>
                                    <div className="flex items-baseline justify-between">
                                        <span>{player.lostGames * 100 / player.games || 1}%</span>
                                        <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">L%</span>
                                    </div>
                                </div>

                                {player.ready ? (
                                    <div className="flex justify-end">
                                        <IoCheckmark size={40} className="text-green-600 ml-4" />
                                    </div>
                                ) : (
                                    <div className="flex justify-end">
                                        <IoClose size={40} className="text-red-600 ml-4" />
                                    </div>
                                )}
                            </div>
                        )) : (<p className="text-zinc-500 text-2xl text-center py-8 font-bold italic">No players joined</p>)}
                    </div>
                </div>

                <div className="flex-1 flex flex-col justify-end gap-8">
                    <button
                        className="w-full bg-blue-700 hover:bg-blue-600 text-white font-black py-4 rounded-xl text-xl transition-all shadow-lg shadow-blue-700/20 active:scale-[0.98]"
                        disabled={!getUserId}
                        onClick={() => getUserId && readyUp({ pin: gamePin, id: getUserId, isStart: true })}
                    >
                        Ready Up
                    </button>
                    <button
                        className="mb-4 w-full bg-green-600 hover:bg-green-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white font-black py-4 rounded-xl text-xl transition-all shadow-lg shadow-green-600/20 disabled:shadow-zinc-500/20 active:scale-[0.98] disabled:cursor-not-allowed"
                        disabled={!playersReadyStart}
                        onClick={() => startGame({ pin: gamePin })}
                    >
                        {playersReadyStart ? "Start" : `Everyone needs to be ready (${getGame?.startReady.length} / ${players?.length})`}
                    </button>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen w-full max-w-3xl flex flex-col items-center justify-center">
            <h1 className="text-2xl font-black">Loading...</h1>
        </main>
    );
}