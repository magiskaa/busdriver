"use client";

import { use, useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { IoPerson, IoArrowBack, IoCheckmark, IoClose, IoAdd, IoRemove, IoBus, IoCog, IoTrash } from "react-icons/io5";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { showToast } from "nextjs-toast-notify";

export default function GamePage({ params }: { params: Promise<{ pin: string }>; }) {
    const router = useRouter();
    const { pin: gamePin } = use(params);
    const [nowTs, setNowTs] = useState(0);
    
    const userId = useQuery(api.users.getUserId);
    const user = useQuery(api.users.getUser);
    const game = useQuery(api.games.getGame, gamePin ? { pin: gamePin } : "skip");
    const players = useQuery(api.games.getPlayers, game?.players ? { pin: gamePin, ids: game.players } : "skip");
    
    const readyUp = useMutation(api.games.ready);
    const startGame = useMutation(api.games.start);
    const discardGame = useMutation(api.games.discard);
    const updateCardCount = useMutation(api.games.updateCardCount);
    const revealCard = useMutation(api.games.revealCard);
    const playCard = useMutation(api.games.playCard);
    const distributeSips = useMutation(api.games.distributeSips);
    const updateCounter = useMutation(api.games.updateCounter);
    const tied = useMutation(api.games.tied);
    const pickCard = useMutation(api.games.pickCard);
    const revealTieBreaker = useMutation(api.games.revealTieBreaker);
    const updateLoser = useMutation(api.games.updateLoser);
    const startDrive = useMutation(api.games.startDrive);
    const revealDriveCard = useMutation(api.games.revealDriveCard);
    const resolveDriveRound = useMutation(api.games.resolveDriveRound);
    const finalizeDrive = useMutation(api.games.finalizeDrive);
    
    const [isSettings, setIsSettings] = useState<boolean>(false);
    const [sipDistribution, setSipDistribution] = useState<{
        total: number;
        assignments: Record<string, number>;
    } | null>(null);
    const isResolvingDriveRef = useRef(false);
    const isFinalizingDriveRef = useRef(false);

    const rowOfIndex = (idx: number) => {
        if (idx >= 10) return 5;
        if (idx >= 6) return 4;
        if (idx >= 3) return 3;
        if (idx >= 1) return 2;
        return 1;
    };

    const isHost = game?.host === user?._id;
    const cardCount = game?.base.cardCount;
    const playersReadyStart = game && game.players && game.base.ready ? game.players.every(player => game.base.ready.includes(player)) : false;
    const myHand = game?.base.playerHands?.find(h => h.userId === userId)?.cards;
    const board = game?.base.board;
    const revealedCards = game?.base.revealed || [];
    const lastRevealedIdx = revealedCards[revealedCards.length - 1];
    const lastRevealedRow = lastRevealedIdx !== undefined ? rowOfIndex(lastRevealedIdx) : 5;
    const mySips = game?.base.sips?.find(user => user.userId === userId);
    const isBaseGameDone = board && revealedCards.length === board.length;
    const playersReadyDrive = game && game.players && game.drive.ready ? game.players.every(player => game.drive.ready.includes(player)) : false;
    const tieBreakersRevealed = game && game.tie?.tiedPlayers.every(player => player.revealed === true);

    useEffect(() => {
        const intervalId = setInterval(() => setNowTs(Date.now()), 500);
        return () => clearInterval(intervalId);
    }, []);

    useEffect(() => {
        if (playersReadyDrive && 
            game?.status === "active" &&
            userId &&
            game.host === userId
        ) {
            const hands = game?.base.playerHands ? [...game.base.playerHands] : [];
            hands.sort((a, b) => b.cards.length - a.cards.length);
            const mostCards = hands[0].cards.length;
            const tiedPlayers = hands?.filter(hand => hand.cards.length === mostCards).map(hand => hand.userId);

            if (tiedPlayers.length <= 1) {
                updateLoser({ pin: gamePin, loser: tiedPlayers[0] });
                startDrive({ pin: gamePin });
                return;
            };

            tied({ pin: gamePin, tiedPlayers })
        }
    }, [game, playersReadyDrive, gamePin, tied, startDrive, userId, updateLoser]);

    useEffect(() => {
        if (tieBreakersRevealed && 
            game?.status === "tied" &&
            userId &&
            game.host === userId
        ) {
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

            const tiedPlayers = game.tie?.tiedPlayers ?? [];
            const tieCards = game.tie?.cards ?? [];
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
    }, [game, tieBreakersRevealed, gamePin, players, startDrive, updateLoser, userId]);

    useEffect(() => {
        if (game?.status === "driving" &&
            userId &&
            game.drive.loser === userId &&
            game.drive.dealNewRoundAt &&
            !isResolvingDriveRef.current
        ) {
            isResolvingDriveRef.current = true;
            resolveDriveRound({ pin: gamePin, userId: userId })
                .finally(() => {
                    isResolvingDriveRef.current = false;
                });
        }
    }, [game, userId, gamePin, nowTs, resolveDriveRound]);

    useEffect(() => {
        if (game?.status === "driving" &&
            userId &&
            game.host === userId &&
            game.drive.finishAt &&
            !isFinalizingDriveRef.current &&
            players &&
            Date.now() > game.drive.finishAt
        ) {
            isFinalizingDriveRef.current = true;
            finalizeDrive({ pin: gamePin }).finally(() => {
                isFinalizingDriveRef.current = false;
            });
        }
    }, [game, gamePin, nowTs, finalizeDrive, userId, players]);

    useEffect(() => {
        if (game?.status === "active" && mySips?.sipsReceived && mySips?.sipsReceived !== 0) {
            showToast.success("Drink up, you got some sips!", {
                duration: 5000,
                position: "top-center",
                transition: "bounceIn",
                icon: "🍺",
                sound: true,
                progress: true
            });
        }
    }, [game?.status, mySips?.sipsReceived]);


    if (game === null) {
        return (
            <main className="loading-main">
                <h1 className="loading-h1 mb-2">Game not found</h1>
                <button onClick={() => router.replace("/")}>Return home</button>
            </main>
        );
    }

    if (game?.status === "finished") {
        return (
            <main>
                <header>
                    <h1>Game Finished</h1>
                    <p className="header-p">
                        Congrats! Y&apos;all survived the busdriver!
                    </p>
                </header>

                <div className="main-div">
                    <div className="flex flex-row items-center justify-between">
                        <h2>Players</h2>
                        <h2>{players?.length} / 6</h2>
                    </div>

                    <div className="players-list-div">
                        {players ? players.map((player, index) => (
                            <div key={player._id} className="player-div">
                                <div className="player-name-div">
                                    <div className="profile-pic-div-non-absolute relative">
                                        {player?.imageUrl ? (
                                            <Image 
                                                src={player.imageUrl} 
                                                alt="Avatar" 
                                                fill
                                                className="object-cover"
                                            />
                                        ) : (
                                            <IoPerson className="profile-pic-icon" />
                                        )}
                                    </div>

                                    <span className="font-bold text-base truncate max-w-[100px] sm:text-xl sm:max-w-[230px]">
                                        {player.username || `Player ${index}`}
                                    </span>
                                    
                                    {game.drive.loser === player._id &&
                                        <div className="flex flex-col items-center justify-center ml-2">
                                            <IoBus size={16} className="text-white" />
                                            <p className="text-base font-bold sm:text-lg">{game.drive.sips ?? 0}</p>
                                        </div>
                                    }
                                </div>
                                
                                <div className="flex flex-row items-center justify-center gap-4 sm:gap-8">
                                    <div className="flex items-baseline justify-between">
                                        <span className="text-xl font-bold mr-2 sm:text-3xl">{game.base.sips?.find(entry => entry.userId === player._id)?.sipsGiven ?? 0}</span>
                                        <span className="text-xs font-medium text-zinc-400 uppercase sm:text-base">G</span>
                                    </div>
                                    <div className="flex items-baseline justify-between">
                                        <span className="text-xl font-bold mr-2 sm:text-3xl">{game.base.sips?.find(entry => entry.userId === player._id)?.sipsReceived ?? 0}</span>
                                        <span className="text-xs font-medium text-zinc-400 uppercase sm:text-base">R</span>
                                    </div>
                                </div>
                            </div>
                        )) : (<p className="text-zinc-500 text-2xl text-center py-8 font-bold italic">No players joined</p>)}
                    </div>
                </div>

                <div className="bottom-button-div">
                    <button
                        onClick={() => router.replace("/")}
                    >
                        Return Home
                    </button>
                </div>
            </main>
        );
    }
    
    if (game?.status === "driving") {
        const renderBoardCard = (index: number) => {
            const board = game?.drive.board;
            const revealedCards = game?.drive.revealed || [];
            
            const loser = game?.drive.loser;
            const isLoser = userId && loser === userId;

            const waitingForReplace = Boolean(game?.drive.dealNewRoundAt);
            const waitingForFinish = Boolean(game?.drive.finishAt);
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
                        onClick={() => canReveal && userId && revealDriveCard({ pin: gamePin, userId: userId, index })}
                        className={`card ${canReveal ? "border-white cursor-pointer hover:bg-blue-700 shadow-white/20" : cardsLocked ? "opacity-60 border-zinc-600 cursor-not-allowed" : "opacity-70 border-zinc-500"}`}
                    >
                        <div className="card-middle">
                            <p className="card-middle-p">?</p>
                        </div>
                    </div>
                );
            }

            return (
                <div 
                    key={index} 
                    className={`card-revealed ${isPenaltyRank ? "border-red-500 ring-2 ring-red-500 shadow-red-500/50" : cardsLocked ? "opacity-80 border-zinc-400" : "border-yellow-400 shadow-yellow-400/40"}`}
                >
                    <p className={`card-revealed-p ${isRed ? "text-red-600" : "text-black"}`}>
                        {card}
                    </p>
                </div>
            );
        };

        const loser = game.drive.loser;

        return (
            <main className="!py-0">
                <div className="players-hands-div wrap">
                    {players?.map((player, idx) => {
                        if (player._id === loser) return null;
                        const playerSips = game.base.sips?.find(user => user.userId === player._id);
                        return (
                            <div key={idx} className="players-hand-div !w-[110px] sm:!w-[135px]">
                                {playerSips && playerSips.sipsReceived > 0n && (
                                    <div className="sipcounter">
                                        +{playerSips.sipsReceived.toString()}
                                    </div>
                                )}
                                <p className="players-name-p !max-w-[105px] sm:!max-w-[135px]">{player.username}</p>
                            </div>
                        );
                    })}
                </div>

                <div className="flex-1 flex flex-col items-center justify-center gap-2.5 py-1 sm:gap-3 sm:py-2">
                    <div className="pyramid-row-div">
                        {[0].map(renderBoardCard)}
                    </div>
                    <div className="pyramid-row-div">
                        {[1, 2].map(renderBoardCard)}
                    </div>
                    <div className="pyramid-row-div">
                        {[3, 4, 5].map(renderBoardCard)}
                    </div>
                    <div className="pyramid-row-div">
                        {[6, 7, 8, 9].map(renderBoardCard)}
                    </div>
                    <div className="pyramid-row-div">
                        {[10, 11, 12, 13, 14].map(renderBoardCard)}
                    </div>
                    {game.drive.finishAt && (
                        <p className="text-center mt-2 text-3xl font-black sm:mt-4 sm:text-4xl">Game Finished!</p>
                    )}
                </div>

                <div className="player-cards-div !gap-0">
                    <p className="flex-1 text-zinc-400 text-xs sm:text-base">LOSER</p>
                    <p className="text-2xl font-bold text-blue-500 mb-2 sm:text-3xl">{players?.find(player => player._id === loser)?.username ?? "Username"}</p>
                    <strong className="relative text-4xl text-white sm:text-5xl">{game.drive.sips}
                        <span className="absolute -right-9 text-zinc-400 text-sm sm:text-base">
                            ({game?.base.sips?.find(user => user.userId === loser)?.sipsReceived ?? 0})
                        </span>
                    </strong>
                </div>
            </main>
        );
    }

    if (game?.status === "tied") {
        const renderBoardCard = (index: number) => {
            const isPicked = game.tie?.picked.includes(index);

            if (!isPicked) {
                return (
                    <div 
                        key={index} 
                        onClick={() => userId && pickCard({ pin: gamePin, userId: userId, index })}
                        className="card"
                    >
                        <div className="card-middle">
                            <p className="card-middle-p">?</p>
                        </div>
                    </div>
                );
            }

            return (
                <div 
                    key={index}
                    className="bg-blue-800 rounded-lg w-[56px] h-[77px] flex items-center justify-center shadow-md shrink-0 border-2 transition-all border-white shadow-white/20 border-yellow-400 ring-3 ring-yellow-400 sm:w-[80px] sm:h-[110px]"
                >
                    <div className="card-middle">
                        <p className="card-middle-p">?</p>
                    </div>
                </div>
            );
        };

        return (
            <main>
                <header>
                    <h1>Game Tied</h1>
                    <p className="header-p">
                        If you are tied with someone, please pick a card. Once you have picked a card, you can reveal it by pressing on it.
                    </p>
                </header>

                <div className="w-full flex flex-col p-2 gap-5 sm:p-4 sm:gap-8">
                    <div className="flex flex-row gap-5 justify-center sm:gap-8">
                        {[0, 1, 2].map(renderBoardCard)}
                    </div>
                    <div className="flex flex-row gap-5 justify-center sm:gap-8">
                        {[3, 4, 5].map(renderBoardCard)}
                    </div>
                </div>

                <div className="flex flex-row flex-wrap overflow-y-auto items-center justify-center gap-2.5 sm:gap-4">
                    {players?.map((player, idx) => {
                        if (!game.tie?.tiedPlayers.map(p => p.userId).includes(player._id)) { return null; }
                        const tiedPlayer = game.tie?.tiedPlayers.find(p => p.userId === player._id);
                        const card = tiedPlayer?.cardPicked !== undefined ? game.tie.cards[tiedPlayer.cardPicked] : undefined;
                        const isRed = card?.toString().includes("♡") || card?.toString().includes("♢");
                        const revealed = tiedPlayer?.revealed;
                        const isLoser = game.drive.loser === player._id;

                        return (
                            <div key={idx} className="flex flex-col items-center justify-center gap-1.5 p-1.5 w-[110px] bg-zinc-800 rounded-lg border border-zinc-700 sm:w-[130px] sm:gap-3 sm:p-3">
                                <p className="text-base font-semibold truncate max-w-[95px] sm:text-lg sm:max-w-[115px]">{player.username}</p>
                                {card && revealed ? (
                                    <div className={`card-revealed ${isLoser ? "border-red-500 ring-3 ring-red-500 shadow-red-500/50" : ""}`}>
                                        <p className={`card-revealed-p ${isRed ? "text-red-600" : "text-black"}`}>
                                            {card}
                                        </p>
                                    </div>
                                ) : card ? (
                                    <div 
                                        className="card"
                                        onClick={() => userId && tiedPlayer?.cardPicked !== undefined && revealTieBreaker({ pin: gamePin, userId: userId })}
                                    >
                                        <div className="card-middle">
                                            <p className="card-middle-p">?</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="rounded-lg w-[60px] h-[83px] shadow-md shrink-0 border-2 transition-all border-zinc-500 shadow-white/10"></div>
                                )}
                            </div>
                        )
                    })}
                </div>

                {tieBreakersRevealed && (
                    <div className="flex flex-col items-center justify-center sm:mt-2">
                        <p className="text-sm flex-1 text-zinc-400 sm:text-lg">LOSER</p>
                        <p className="text-2xl font-semibold mb-3 sm:text-3xl sm:mb-6">{players?.find(p => p._id === game.drive.loser)?.username || "magiskaa"}</p>
                        <p className="text-xl font-bold text-center text-blue-500 sm:text-2xl">The driving will begin in 5 seconds...</p>
                    </div>
                )}
            </main>
        );
    }

    if (game?.status === "active") {
        const expectedRow = (revealedLength: number) => {
            switch (revealedLength) {
                case 5:
                    return 4;
                case 9:
                    return 3;
                case 12:
                    return 2;
                case 14:
                    return 1;
                default:
                    return 0;
            }
        };

        const renderBoardCard = (index: number) => {
            const card = board?.[index];
            const isRevealed = revealedCards.includes(index);
            const cardRow = rowOfIndex(index);
            const expected = expectedRow(revealedCards.length)
            const activeRow = expected === 0 ? lastRevealedRow : expected;
            const isActiveRow = activeRow === cardRow || lastRevealedRow === cardRow;
            const isRed = card?.includes("♡") || card?.includes("♢");

            if (!isRevealed) {
                return (
                    <div 
                        key={index} 
                        onClick={() => revealCard({ pin: gamePin, index })}
                        className={`card ${isActiveRow ? "card-active" : "card-inactive"}`}
                    >
                        <div className="card-middle">
                            <p className="card-middle-p">?</p>
                        </div>
                    </div>
                );
            }

            return (
                <div 
                    key={index} 
                    className={`card-revealed ${isActiveRow ? "card-revealed-active" : "card-inactive"}`}
                >
                    <p className={`card-revealed-p ${isRed ? "text-red-600" : "text-black"}`}>
                        {card}
                    </p>
                </div>
            );
        };

        return (
            <main className="!py-0 !gap-1.5 sm:!gap-4">
                <div className="players-hands-div">
                    {players?.map((player, idx) => {
                        if (player._id === userId) return null;
                        const hand = game.base.playerHands?.find(hand => hand.userId === player._id);
                        const playerSips = game.base.sips?.find(user => user.userId === player._id);
                        return (
                            <div key={idx} className="players-hand-div">
                                {playerSips && playerSips.sipsReceived > 0 && (
                                    <div className="sipcounter">
                                        +{playerSips.sipsReceived.toString()}
                                    </div>
                                )}
                                <p className="players-name-p">{player.username}</p>
                                <div className="flex flex-row -space-x-0.5">
                                    {hand?.cards.map((_, idx) => (
                                        <div key={idx} className="bg-blue-800 rounded-sm w-[12px] h-[19px] border border-white/30 shadow-sm shadow-black/50 sm:w-[15px] sm:h-[24px]"></div>
                                    ))}
                                </div>
                            </div>
                        )
                    })}
                </div>
                
                <div className="flex-1 relative flex flex-col items-center justify-center gap-1.5 py-0 sm:gap-3 sm:py-2">
                    {isBaseGameDone && (
                        <button
                            className={`!w-[90px] flex flex-col items-center justify-center gap-1 absolute right-0 top-4 !p-1 !text-base sm:!text-xl sm:!w-[120px] ${userId && game.drive.ready.includes(userId) ? "!bg-green-600 hover:!bg-green-500 !shadow-green-600/20" : "!bg-red-700 hover:!bg-red-600 !shadow-red-700/20"}`}
                            onClick={() => userId && readyUp({ id: userId, pin: gamePin, isStart: false })}
                        >
                            Ready
                            <span>{game?.drive?.ready?.length ?? 0} / {game.players.length}</span>
                        </button>
                    )}
                    {isHost &&
                        <div className="back-arrow-div !top-6">
                            <IoTrash className="trash-can-icon" onClick={() => {
                                discardGame({ pin: gamePin });
                                router.replace("/");
                            }} />
                        </div>
                    }
                    <div className="pyramid-row-div">
                        {[0].map(renderBoardCard)}
                    </div>
                    <div className="pyramid-row-div">
                        {[1, 2].map(renderBoardCard)}
                    </div>
                    <div className="pyramid-row-div">
                        {[3, 4, 5].map(renderBoardCard)}
                    </div>
                    <div className="pyramid-row-div">
                        {[6, 7, 8, 9].map(renderBoardCard)}
                    </div>
                    <div className="pyramid-row-div">
                        {[10, 11, 12, 13, 14].map(renderBoardCard)}
                    </div>
                </div>


                <div className="player-cards-div">
                    <div className="player-stats-div">
                        <div className="w-[50vw] flex items-baseline justify-center">
                            <span className="text-zinc-400 text-xs sm:text-base">
                                RECEIVED
                                <strong className="player-stats-strong">{mySips?.sipsReceived?.toString() ?? 0}</strong>
                            </span>
                        </div>

                        <div 
                            className="w-[50vw] flex items-baseline justify-center"
                            onClick={() => userId && updateCounter({ pin: gamePin, userId: userId })}
                        >
                            <strong className="player-stats-strong">{game.base.playerHands?.find(hand => hand.userId === userId)?.counter || 0}</strong>

                            <span className="text-zinc-400 text-xs sm:text-base ml-2 sm:ml-4">CONSUMED</span>
                        </div>
                    </div>

                    <div className="flex flex-row justify-center gap-2.5 overflow-x-auto w-full pt-2.5">
                        {myHand?.map((card, idx) => {
                            const isRed = card.includes("♡") || card.includes("♢");
                            const playerCardRank = card.replace(/[♠♣♡♢]/g, "");
                            
                            const canPlay = revealedCards.some(idx => {
                                if (rowOfIndex(idx) !== lastRevealedRow) return false;
                                return board![idx].replace(/[♠♣♡♢]/g, "") === playerCardRank;
                            });

                            return (
                                <div 
                                    key={idx} 
                                    onClick={async () => {
                                        if (canPlay && userId) {
                                            await playCard({ pin: gamePin, userId: userId, card });
                                            const sips = (6 - lastRevealedRow) * 2;
                                            const initialAssignments: Record<string, number> = {};
                                            players?.forEach(p => initialAssignments[p._id] = 0);
                                            setSipDistribution({
                                                total: sips,
                                                assignments: initialAssignments
                                            });
                                        }
                                    }}
                                    className={`card-revealed ${canPlay ? "cursor-pointer border-yellow-400 ring-2 ring-yellow-400 -translate-y-1.5 shadow-yellow-400/40" : "opacity-85 border-zinc-300"}`}
                                >
                                    <p className={`card-revealed-p ${isRed ? "text-red-600" : "text-black"}`}>
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
                        <div className="main-div max-w-md !p-2">
                            <h2 className="text-center py-1">Distribute Sips</h2>
                            <p className="text-blue-500 text-center font-bold mb-3">
                                Sips: {Object.values(sipDistribution.assignments).reduce((a, b) => a + b, 0)} / {sipDistribution.total}
                            </p>
                            
                            <div className="flex flex-col gap-2 max-h-[80vh] overflow-y-auto mb-4">
                                {players?.map(player => (
                                    <div key={player._id} className="player-div !p-2.5">
                                        <div className="flex items-center gap-3">
                                            <div className="profile-pic-div-non-absolute relative">
                                                {player?.imageUrl ? (
                                                    <Image 
                                                        src={player.imageUrl} 
                                                        alt="Avatar" 
                                                        fill
                                                        className="object-cover"
                                                    />
                                                ) : (
                                                    <IoPerson className="profile-pic-icon" />
                                                )}
                                            </div>
                                            <span className="player-p">
                                                {player.username}
                                            </span>
                                        </div>
                                        
                                        <div className="flex items-center gap-3">
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
                                                className="!w-[40px] !h-[40px] !rounded-full !bg-blue-700 flex items-center justify-center !shadow-blue-600/20 hover:!bg-blue-600 sm:!w-[50px] sm:!h-[50px]"
                                            >
                                                <IoRemove size={25} />
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
                                                className="!w-[40px] !h-[40px] !rounded-full !bg-blue-700 flex items-center justify-center !shadow-blue-600/20 hover:!bg-blue-600 sm:!w-[50px] sm:!h-[50px]"
                                            >
                                                <IoAdd size={25} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            
                            <button 
                                onClick={async () => {
                                    const totalAssigned = Object.values(sipDistribution.assignments).reduce((a, b) => a + b, 0);
                                    if (totalAssigned === sipDistribution.total && userId) {
                                        await distributeSips({
                                            pin: gamePin,
                                            giverId: userId,
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
                            >
                                Done
                            </button>
                        </div>
                    </div>
                )}
            </main>
        );
    }

    if (game?.status === "waiting") {
        return (
            <main>
                <header>
                    <p className="header-p !text-base sm:!text-lg">Game PIN:</p>
                    <h1 className="text-5xl font-black text-center">{gamePin}</h1>
                </header>

                <div className="back-arrow-div">
                    <IoArrowBack className="back-arrow-icon" onClick={() => router.push("/")} />
                </div>

                {isHost &&
                    <div className="settings-div">
                        <IoCog className="back-arrow-icon" onClick={() => setIsSettings(true)} />
                    </div>
                }

                <div className="main-div">
                    <div className="flex flex-row items-center justify-between">
                        <h2>Joined Players</h2>
                        <h2>{players?.length} / 6</h2>
                        <div className="flex flex-row items-center justify-center -space-x-0.5 w-[60px]">
                            {Array.from({ length: cardCount || 5 }).map((_, idx) => (
                                <div key={idx} className="bg-blue-800 rounded-sm w-[12px] h-[19px] border border-white/30 shadow-sm shadow-black/50 sm:w-[15px] sm:h-[24px]"></div>
                            ))}
                        </div>
                    </div>

                    <div className="players-list-div">
                        {players ? players.map((player, index) => (
                            <div key={player._id} className="player-div">
                                <div className="player-name-div">
                                    <div className="profile-pic-div-non-absolute relative">
                                        {player?.imageUrl ? (
                                            <Image 
                                                src={player.imageUrl} 
                                                alt="Avatar" 
                                                fill
                                                className="object-cover"
                                            />
                                        ) : (
                                            <IoPerson className="profile-pic-icon" />
                                        )}
                                    </div>
                                    <p className="player-p">
                                        {player.username || `Player ${index}`}
                                    </p>
                                </div>
                                
                                <div className="player-gamestats-div">
                                    <div className="flex items-baseline justify-between">
                                        <span>{player.games.toString()}</span>
                                        <span className="text-xs font-medium text-zinc-400 uppercase tracking-narrow sm:tracking-wider">Games</span>
                                    </div>
                                    <div className="flex items-baseline justify-between">
                                        <span>{((player.lostGames * 100) / (player.games || 1)).toFixed(1)}%</span>
                                        <span className="text-xs font-medium text-zinc-400 uppercase tracking-narrow sm:tracking-wider">L%</span>
                                    </div>
                                </div>

                                {player.ready ? (
                                    <div className="flex justify-end">
                                        <IoCheckmark size={38} className="text-green-600 ml-2 sm:ml-4" />
                                    </div>
                                ) : (
                                    <div className="flex justify-end">
                                        <IoClose size={38} className="text-red-700 ml-2 sm:ml-4" />
                                    </div>
                                )}
                            </div>
                        )) : (<p className="text-zinc-500 text-2xl text-center py-8 font-bold italic">No players joined</p>)}
                    </div>
                </div>

                <div className="flex-1 flex flex-col justify-end gap-4 sm:gap-6">
                    <button
                        className={`${players?.find(player => player._id === userId)?.ready === true ? "!bg-green-600 hover:!bg-green-500 !shadow-green-600/20" : "!bg-red-700 hover:!bg-red-600 !shadow-red-700/20"}`} 
                        disabled={!userId}
                        onClick={() => userId && readyUp({ pin: gamePin, id: userId, isStart: true })}
                    >
                        {players?.find(player => player._id === userId)?.ready === true ? "Ready" : "Not Ready"}
                    </button>
                    <button
                        className="mb-2 sm:mb-4"
                        disabled={!playersReadyStart}
                        onClick={() => startGame({ pin: gamePin })}
                    >
                        {playersReadyStart ? "Start" : `Players ready ${game?.base.ready.length} / ${players?.length}`}
                    </button>
                </div>

                {isSettings && (
                    <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
                        <div className="main-div max-w-md !p-2 relative sm:!p-3">
                            <h2 className="text-center py-1">Game Settings</h2>
                            <p className="text-blue-500 text-center font-bold mb-3">
                                Card Count
                            </p>

                            <div className="settings-div sm:!right-3 sm:!top-3">
                                <IoTrash 
                                    className="trash-can-icon" 
                                    onClick={() => {
                                        discardGame({ pin: gamePin });
                                        router.replace("/");
                                    }}
                                />
                            </div>
                            
                            <div className="flex flex-row items-center justify-center gap-5 mt-6 mb-8">
                                <div className={`card-count-div ${cardCount === 1 ? "active-card-count" : ""}`} onClick={() => updateCardCount({ pin: gamePin, cardCount: 1 })}>
                                    <strong>1</strong>
                                </div>
                                <div className={`card-count-div ${cardCount === 2 ? "active-card-count" : ""}`} onClick={() => updateCardCount({ pin: gamePin, cardCount: 2 })}>
                                    <strong>2</strong>
                                </div>
                                <div className={`card-count-div ${cardCount === 3 ? "active-card-count" : ""}`} onClick={() => updateCardCount({ pin: gamePin, cardCount: 3 })}>
                                    <strong>3</strong>
                                </div>
                                <div className={`card-count-div ${cardCount === 4 ? "active-card-count" : ""}`} onClick={() => updateCardCount({ pin: gamePin, cardCount: 4 })}>
                                    <strong>4</strong>
                                </div>
                                <div className={`card-count-div ${cardCount === 5 ? "active-card-count" : ""}`} onClick={() => updateCardCount({ pin: gamePin, cardCount: 5 })}>
                                    <strong>5</strong>
                                </div>
                            </div>

                            <button 
                                onClick={async () => {
                                    setIsSettings(false);
                                }}
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
        <main className="loading-main">
            <h1 className="loading-h1">Loading...</h1>
        </main>
    );
}