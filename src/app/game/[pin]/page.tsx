"use client";

import { use, useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { IoPerson, IoArrowBack, IoCheckmark, IoClose, IoAdd, IoRemove, IoBus, IoCog, IoTrash, IoExitOutline, IoPersonAdd } from "react-icons/io5";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ToastContainer, toast, Slide } from 'react-toastify';
import { useGameEmotes } from "@/hooks/useGameEmotes";
import { BiWinkSmile } from "react-icons/bi";


export default function GamePage({ params }: { params: Promise<{ pin: string }>; }) {
    const router = useRouter();
    const { pin: gamePin } = use(params);
    const [nowTs, setNowTs] = useState(0);
    
    const userId = useQuery(api.users.getUserId);
    const user = useQuery(api.users.getUser);
    const game = useQuery(api.games.getGame, gamePin ? { pin: gamePin } : "skip");
    const players = useQuery(api.games.getPlayers, game?.players ? { pin: gamePin, ids: game.players } : "skip");
    const ongoingGame = useQuery(api.games.getOngoing, userId ? { userId: userId } : "skip");
    const cardColors = useQuery(api.cards.getCardColors, userId ? { userId } : "skip");
    
    const leaveGame = useMutation(api.games.leave);
    const readyUp = useMutation(api.games.ready);
    const startGame = useMutation(api.games.start);
    const discardGame = useMutation(api.games.discard);
    const rematch = useMutation(api.games.rematch);
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
    const [isEmote, setIsEmote] = useState<boolean>(false);
    const [isProfile, setIsProfile] = useState<boolean>(false);
    const [profileId, setProfileId] = useState<Id<"users"> | undefined>(undefined);
    const achievementProgress = useQuery(
        api.achievements.getAchievements,
        profileId ? { userId: profileId } : "skip"
    );
    const [sipDistribution, setSipDistribution] = useState<{
        total: number;
        assignments: Record<string, number>;
    } | null>(null);
    const [playingCardIndex, setPlayingCardIndex] = useState<number | null>(null);
    const isResolvingDriveRef = useRef(false);
    const isFinalizingDriveRef = useRef(false);
    const { emotes, sendEmote } = useGameEmotes(
        gamePin,
        userId ?? undefined
    );
    const availableEmotes = [
        "😂",
        "😀",
        "😎",
        "🥱",
        "😭",
        "🤡",
        "😈",
        "🍺",
        "🔥",
        "❤️",
        "👏",
        "💀",
    ];

    const rankMaterials = [
        { name: "Wood", background: "linear-gradient(135deg, #d4a373 0%, #8b5a2b 45%, #5c371d 100%)" },
        { name: "Iron", background: "linear-gradient(135deg, #87939b 0%, #4b5563 48%, #252b32 100%)" },
        { name: "Bronze", background: "linear-gradient(135deg, #f0b477 0%, #b87333 48%, #75421f 100%)" },
        { name: "Silver", background: "linear-gradient(135deg, #ffffff 0%, #cbd5e1 45%, #7c8794 100%)" },
        { name: "Gold", background: "linear-gradient(135deg, #fff1a8 0%, #eab308 48%, #a16207 100%)" },
        { name: "Platinum", background: "linear-gradient(135deg, #f8fafc 0%, #d5d9de 48%, #929ba5 100%)" },
        { name: "Diamond", background: "linear-gradient(135deg, #ecfeff 0%, #67e8f9 45%, #0891b2 100%)" },
    ];
        
    const rowOfIndex = (idx: number) => {
        if (idx >= 10) return 5;
        if (idx >= 6) return 4;
        if (idx >= 3) return 3;
        if (idx >= 1) return 2;
        return 1;
    };
    
    const getCardColorClass = (color?: string) => {
        if (color === "bg-blue-600") return "!bg-blue-600";
        if (color === "bg-white") return "!bg-white";
        return "";
    };

    const getCardColorTextClass = (color?: string) => {
        if (color === "bg-blue-600") return "!text-blue-600";
        if (color === "bg-white") return "!text-white";
        return "";
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
            toast('Drink up!🍺 You got some sips!', {
                position: "top-right",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: false,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                pauseOnFocusLoss: true,
                rtl: false,
                theme: "dark",
                transition: Slide,
            });
        }
    }, [game?.status, mySips?.sipsReceived]);

    useEffect(() => {
        if (game?.status === "finished" && !isHost && ongoingGame) {
            if (ongoingGame) {
                router.push(`/game/${ongoingGame}`);
            }
        }
    }, [game?.status, isHost, ongoingGame, router]);


    const handleRematch = async () => {
		if (!userId || !players) {
			return;
		}

		try {
            const res =  await rematch({ host: userId, players: players.map(p => p._id) });
			router.push(`/game/${res.pin}`);
		} catch {
            throw new Error("Rematch failed. Try again.")
		}
	}

    if (game === null) {
        return (
            <main className="loading-main">
                <h1 className="loading-h1 mb-2">Game not found</h1>
                <button onClick={() => router.replace("/")}>Return home</button>
            </main>
        );
    }

    if (!game?.players.find(p => p === userId)) {
        return (
            <main className="loading-main">
                <h1 className="loading-h1 mb-2">You are not welcome in this game, please leave.</h1>
                <button onClick={() => router.replace("/")}>Take me home</button>
            </main>
        )
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
                                    <div className="flex items-baseline justify-end w-[40px]">
                                        <span className="text-xl font-bold mr-2 sm:text-3xl">{game.base.sips?.find(entry => entry.userId === player._id)?.sipsGiven ?? 0}</span>
                                        <span className="text-xs font-medium text-zinc-400 uppercase sm:text-base">G</span>
                                    </div>
                                    <div className="flex items-baseline justify-end w-[40px]">
                                        <span className="text-xl font-bold mr-2 sm:text-3xl">{game.base.sips?.find(entry => entry.userId === player._id)?.sipsReceived ?? 0}</span>
                                        <span className="text-xs font-medium text-zinc-400 uppercase sm:text-base">R</span>
                                    </div>
                                </div>
                            </div>
                        )) : (<p className="text-zinc-500 text-2xl text-center py-8 font-bold italic">No players joined</p>)}
                    </div>
                </div>

                <div className="bottom-button-div">
                    {isHost &&
                        <button
                            className="!bg-orange-600 !shadow-orange-500/20 hover:!bg-orange-500"
                            onClick={handleRematch}
                        >
                            Play Again
                        </button>
                    }

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
                        className={`card ${getCardColorClass(cardColors?.backColor)} ${canReveal ? "border-white cursor-pointer hover:bg-blue-700 shadow-white/20" : cardsLocked ? "opacity-60 border-zinc-600 cursor-not-allowed" : "opacity-70 border-zinc-500"}`}
                        style={cardColors?.backColor.startsWith("#") ? { backgroundColor: cardColors.backColor } : undefined}
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
                    className={`card-revealed card-flip-in ${getCardColorClass(cardColors?.faceColor)} ${isPenaltyRank ? "border-red-500 ring-2 ring-red-500 shadow-red-500/50" : cardsLocked ? "opacity-80 border-zinc-400" : "border-yellow-400 shadow-yellow-400/40"}`}
                    style={cardColors?.faceColor.startsWith("#") ? { backgroundColor: cardColors.faceColor } : undefined}
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
                <div className="players-hands-div wrap !overflow-visible">
                    {players?.map((player, idx) => {
                        if (player._id === loser) return null;
                        const playerSips = game.base.sips?.find(user => user.userId === player._id);
                        return (
                            <div key={idx} className="players-hand-div relative">
                                {playerSips && playerSips.sipsReceived > 0n && (
                                    <div className="sipcounter">
                                        +{playerSips.sipsReceived.toString()}
                                    </div>
                                )}
                     
                                <div className="profile-pic-div-non-absolute relative !w-[32px] !h-[32px] sm:!w-[50px] sm:!h-[50px]">
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
                     
                                {emotes
                                    .filter((emote) => emote.userId === player._id)
                                    .map((emote) => (
                                        <div
                                            key={emote.id}
                                            className="pointer-events-none absolute left-4 -bottom-13 z-30 text-6xl animate-emote-pop"
                                        >
                                            {emote.emoji}
                                        </div>
                                    ))
                                }
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
                        <div className="fixed inset-0 bg-black/30 backdrop-blur-xs z-50 flex items-center justify-center p-4">
                            <p className="text-center mt-2 text-3xl font-black sm:mt-4 sm:text-4xl">Game Finished!</p>
                        </div>
                    )}

                    <div 
                        className="absolute w-[50px] h-[50px] flex items-center justify-center bg-zinc-800/70 right-0 rounded-full shadow-md shadow-zinc-600/30 active:scale-[0.95] sm:w-[70px] sm:h-[70px]"
                        onClick={() => setIsEmote(true)}
                    >
                        <BiWinkSmile className="bug-icon" />
                    </div>
                </div>

                <div className="player-cards-div !gap-0 relative">
                    {emotes
                        .filter((emote) => emote.userId === game.drive.loser)
                        .map((emote) => (
                            <div
                                key={emote.id}
                                className="pointer-events-none absolute bottom-full z-30 -translate-x-1/2 pb-3 text-6xl animate-emote-pop"
                            >
                                {emote.emoji}
                            </div>
                        ))
                    }

                    <p className="flex-1 text-zinc-400 text-xs sm:text-base">LOSER</p>
                    <p className={`text-2xl font-bold mb-2 sm:text-3xl ${getCardColorTextClass(cardColors?.backColor)}`} style={cardColors?.backColor.startsWith("#") ? { color: cardColors.backColor } : undefined}>{players?.find(player => player._id === loser)?.username ?? "Username"}</p>
                    
                    <strong className="relative text-4xl text-white sm:text-5xl">{game.drive.sips}
                        <span className="absolute -right-9 text-zinc-400 text-sm sm:text-base">
                            ({game?.base.sips?.find(user => user.userId === loser)?.sipsReceived ?? 0})
                        </span>
                    </strong>
                </div>

                {isEmote && (
                    <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
                        <div className="main-div max-w-md !p-2 sm:!p-3">
                            <h2 className="text-center py-1">Emote</h2>
                            <p 
                                className={`text-center font-bold mb-3 ${getCardColorTextClass(cardColors?.backColor)}`}
                                style={cardColors?.backColor.startsWith("#") ? { color: cardColors.backColor } : undefined}
                            >
                                Choose your emote
                            </p>
                            
                            <div className="flex flex-wrap justify-center gap-2 pb-4">
                                {availableEmotes.map((emoji) => (
                                    <div
                                        key={emoji}
                                        onClick={() => {
                                            sendEmote(emoji);
                                            setIsEmote(false);
                                        }}
                                        className="flex items-center justify-center w-12 h-12 rounded-full bg-zinc-800 text-2xl"
                                    >
                                        {emoji}
                                    </div>
                                ))}
                            </div>
                            
                            <button 
                                onClick={() => setIsEmote(false)}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                )}
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
                        className={`card ${getCardColorClass(cardColors?.backColor)}`}
                        style={cardColors?.backColor.startsWith("#") ? { backgroundColor: cardColors.backColor } : undefined}
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
                    className={`bg-blue-800 rounded-lg w-[56px] h-[77px] flex items-center justify-center shadow-md shrink-0 border-2 transition-all border-white shadow-white/20 border-yellow-400 ring-3 ring-yellow-400 sm:w-[80px] sm:h-[110px] ${getCardColorClass(cardColors?.backColor)}`}
                    style={cardColors?.backColor.startsWith("#") ? { backgroundColor: cardColors.backColor } : undefined}
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
                            <div key={idx} className="flex flex-col items-center justify-center gap-2 p-2 w-[115px] bg-zinc-800 rounded-lg border border-zinc-700 sm:w-[130px] sm:gap-3 sm:p-3">
                                <p className="text-base font-semibold truncate max-w-[95px] sm:text-lg sm:max-w-[115px]">{player.username}</p>
                                {card && revealed ? (
                                    <div 
                                        className={`card-revealed card-flip-in ${getCardColorClass(cardColors?.faceColor)} ${isLoser ? "border-red-500 ring-3 ring-red-500 shadow-red-500/50" : ""}`}
                                        style={cardColors?.faceColor.startsWith("#") ? { backgroundColor: cardColors.faceColor } : undefined}
                                    >
                                        <p className={`card-revealed-p ${isRed ? "text-red-600" : "text-black"}`}>
                                            {card}
                                        </p>
                                    </div>
                                ) : card ? (
                                    <div 
                                        className={`card ${getCardColorClass(cardColors?.backColor)}`}
                                        onClick={() => userId && tiedPlayer?.cardPicked !== undefined && revealTieBreaker({ pin: gamePin, userId: userId })}
                                        style={cardColors?.backColor.startsWith("#") ? { backgroundColor: cardColors.backColor } : undefined}
                                    >
                                        <div className="card-middle">
                                            <p className="card-middle-p">?</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="rounded-lg w-[56px] h-[77px] shadow-md shrink-0 border-2 transition-all border-zinc-500 shadow-white/10 sm:w-[80px] sm:h-[110px]"></div>
                                )}
                            </div>
                        )
                    })}
                </div>

                {!tieBreakersRevealed && (
                    <div className="flex flex-col items-center justify-center sm:mt-2">
                        <p className="text-sm flex-1 text-zinc-400 sm:text-lg">LOSER</p>
                        <p className="text-2xl font-semibold mb-6 sm:text-3xl sm:mb-8">{players?.find(p => p._id === game.drive.loser)?.username || "Username"}</p>
                        <p className={`text-xl font-bold text-center ${getCardColorTextClass(cardColors?.backColor)} sm:text-2xl`} style={cardColors?.backColor.startsWith("#") ? { color: cardColors.backColor } : undefined}>The driving will begin in 5 seconds...</p>
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
                        className={`card ${getCardColorClass(cardColors?.backColor)} ${isActiveRow ? "card-active" : "card-inactive"}`}
                        style={cardColors?.backColor.startsWith("#") ? { backgroundColor: cardColors.backColor } : undefined}
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
                    className={`card-revealed card-flip-in ${getCardColorClass(cardColors?.faceColor)} ${isActiveRow ? "card-revealed-active" : "card-inactive"}`}
                    style={cardColors?.faceColor.startsWith("#") ? { backgroundColor: cardColors.faceColor } : undefined}
                >
                    <p className={`card-revealed-p ${isRed ? "text-red-600" : "text-black"}`}>
                        {card}
                    </p>
                </div>
            );
        };

        return (
            <main className="!py-0 !gap-1.5 sm:!gap-4">
                <ToastContainer
                    newestOnTop={false}
                    className="!rounded-sm !left-auto !right-8 !w-[calc(100vw-4rem)] sm:!right-0 sm:!w-[320px]"
                    progressClassName="!rounded-xl !bg-green-800"
                    toastClassName="!rounded-sm !bg-green-600 !text-white"
                />

                <div className="players-hands-div wrap !overflow-visible">
                    {players?.map((player, idx) => {
                        if (player._id === userId) return null;
                        const hand = game.base.playerHands?.find(hand => hand.userId === player._id);
                        const playerSips = game.base.sips?.find(user => user.userId === player._id);
                        return (
                            <div key={idx} className="players-hand-div relative">
                                {playerSips && playerSips.sipsReceived > 0 && (
                                    <div className="sipcounter">
                                        +{playerSips.sipsReceived.toString()}
                                    </div>
                                )}
                                
                                <div className="profile-pic-div-non-absolute relative !w-[32px] !h-[32px] sm:!w-[50px] sm:!h-[50px]">
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
                                
                                <div className="flex flex-row -space-x-0.75">
                                    {hand && hand.cards.length ? (
                                        hand?.cards.map((_, idx) => (
                                            <div 
                                                key={idx} 
                                                className={`rounded-sm w-[12px] h-[19px] border border-white/60 shadow-sm shadow-black/50 sm:w-[15px] sm:h-[24px] ${getCardColorClass(cardColors?.backColor)}`}
                                                style={cardColors?.backColor.startsWith("#") ? { backgroundColor: cardColors.backColor } : undefined}
                                            ></div>
                                        ))
                                    ) : (
                                        <p className=""></p>
                                    )}
                                </div>

                                {emotes
                                    .filter((emote) => emote.userId === player._id)
                                    .map((emote) => (
                                        <div
                                            key={emote.id}
                                            className="pointer-events-none absolute left-4 -bottom-13 z-30 text-6xl animate-emote-pop"
                                        >
                                            {emote.emoji}
                                        </div>
                                    ))
                                }
                            </div>
                        )
                    })}
                </div>
                
                <div className="flex-1 relative flex flex-col items-center justify-center gap-1.5 py-0 sm:gap-3 sm:py-2">
                    {isBaseGameDone && (
                        <button
                            className={`!w-[100px] flex flex-col items-center justify-center gap-1 absolute right-0 top-4 !p-1 !text-base sm:!text-xl sm:!w-[120px] ${userId && game.drive.ready.includes(userId) ? "!bg-green-600 hover:!bg-green-500 !shadow-green-600/20" : "!bg-red-700 hover:!bg-red-600 !shadow-red-700/20"}`}
                            onClick={() => userId && readyUp({ id: userId, pin: gamePin, isStart: false })}
                        >
                            Ready Up
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
                    
                    <div 
                        className="absolute w-[50px] h-[50px] flex items-center justify-center bg-zinc-800/70 right-0 rounded-full active:scale-[0.95] sm:w-[70px] sm:h-[70px]"
                        onClick={() => setIsEmote(true)}
                    >
                        <BiWinkSmile className="bug-icon" />
                    </div>
                </div>


                {isEmote && (
                    <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
                        <div className="main-div max-w-md !p-2 sm:!p-3">
                            <h2 className="text-center py-1">Emote</h2>
                            <p 
                                className={`text-center font-bold mb-3 ${getCardColorTextClass(cardColors?.backColor)}`}
                                style={cardColors?.backColor.startsWith("#") ? { color: cardColors.backColor } : undefined}
                            >
                                Choose your emote
                            </p>
                            
                            <div className="flex flex-wrap justify-center gap-2 pt-1 pb-6">
                                {availableEmotes.map((emoji) => (
                                    <div
                                        key={emoji}
                                        onClick={() => {
                                            sendEmote(emoji);
                                            setIsEmote(false);
                                        }}
                                        className="flex items-center justify-center w-12 h-12 rounded-full bg-zinc-800 text-2xl"
                                    >
                                        {emoji}
                                    </div>
                                ))}
                            </div>
                            
                            <button 
                                onClick={() => setIsEmote(false)}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                )}

                <div className="player-cards-div relative">
                    {emotes
                        .filter((emote) => emote.userId === userId)
                        .map((emote) => (
                            <div
                                key={emote.id}
                                className="pointer-events-none absolute bottom-full z-30 translate-x-2 pb-3 text-8xl animate-emote-pop"
                            >
                                {emote.emoji}
                            </div>
                        ))
                    }

                    <div className="player-stats-div">
                        <div className="w-[50vw] flex items-baseline justify-center">
                            <span className="text-zinc-400 text-xs sm:text-base">
                                RECEIVED
                                <strong className="player-stats-strong">{mySips?.sipsReceived?.toString() ?? 0}</strong>
                            </span>
                        </div>

                        <div 
                            className="w-[50vw] flex items-baseline justify-center bg-zinc-800/70 rounded-xl shadow-md shadow-zinc-600/30 active:scale-[0.95]"
                            onClick={() => userId && updateCounter({ pin: gamePin, userId: userId })}
                        >
                            <strong className="player-stats-strong">{(mySips?.sipsReceived || 0) - (game.base.playerHands?.find(hand => hand.userId === userId)?.counter || 0)}</strong>

                            <span className="text-zinc-400 text-xs sm:text-base ml-2 sm:ml-4">SIPS TO DRINK</span>
                        </div>
                    </div>

                    <div className="flex flex-row justify-center gap-2.5 overflow-visible w-full pt-2.5">
                        {myHand?.map((card, idx) => {
                            const isRed = card.includes("♡") || card.includes("♢");
                            const playerCardRank = card.replace(/[♠♣♡♢]/g, "");
                            const isPlayingCard = playingCardIndex === idx;
                            
                            const canPlay = revealedCards.some(idx => {
                                if (rowOfIndex(idx) !== lastRevealedRow) return false;
                                return board![idx].replace(/[♠♣♡♢]/g, "") === playerCardRank;
                            });

                            return (
                                <div 
                                    key={idx} 
                                    onClick={async () => {
                                        if (!canPlay || !userId || playingCardIndex !== null) return;

                                        setPlayingCardIndex(idx);
                                        try {
                                            if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
                                                await new Promise(resolve => setTimeout(resolve, 400));
                                            }
                                            await playCard({ pin: gamePin, userId: userId, card });
                                            const sips = (6 - lastRevealedRow) * 2;
                                            const initialAssignments: Record<string, number> = {};
                                            players?.forEach(p => initialAssignments[p._id] = 0);
                                            setSipDistribution({
                                                total: sips,
                                                assignments: initialAssignments
                                            });
                                        } finally {
                                            setPlayingCardIndex(null);
                                        }
                                    }}
                                    className={`card-revealed ${getCardColorClass(cardColors?.faceColor)} ${isPlayingCard ? "card-play-out" : canPlay && playingCardIndex === null ? "cursor-pointer border-yellow-400 ring-2 ring-yellow-400 -translate-y-1.5 shadow-yellow-400/40" : "opacity-85 border-zinc-300"}`}
                                    style={cardColors?.faceColor.startsWith("#") ? { backgroundColor: cardColors.faceColor } : undefined}
                                >
                                    <p className={`card-revealed-p ${isRed ? "text-red-600" : "text-black"}`}>
                                        {card}
                                    </p>
                                </div>
                            );
                        })}
                        {myHand?.length === 0 && (
                            <p className="italic-text mt-4">Well played! Remember, you can still get more sips.</p>
                        )}
                    </div>
                </div>

                {sipDistribution && (
                    <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
                        <div className="main-div max-w-md !p-2 sm:!p-3">
                            <h2 className="text-center py-1">Distribute Sips</h2>
                            <p 
                                className={`text-blue-500 text-center font-bold mb-3 ${getCardColorTextClass(cardColors?.backColor)}`}
                                style={cardColors?.backColor.startsWith("#") ? { color: cardColors.backColor } : undefined}
                            >
                                Sips: {Object.values(sipDistribution.assignments).reduce((a, b) => a + b, 0)} / {sipDistribution.total}
                            </p>
                            
                            <div className="flex flex-col gap-2 max-h-[80vh] overflow-y-auto mb-4">
                                {players?.map(player => {
                                    const playerSips = game.base.sips?.find(user => user.userId === player._id);

                                    return (
                                        <div key={player._id} className="player-div !p-2.5">
                                            <div className="flex items-center gap-3 relative">
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

                                                {playerSips && playerSips.sipsReceived > 0 && (
                                                    <div className="sipcounter !-top-2.5 !-left-2.5 !right-auto sm:!-top-4">
                                                        +{playerSips.sipsReceived.toString()}
                                                    </div>
                                                )}
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
                                                    className={`!w-[40px] !h-[40px] !rounded-full flex items-center justify-center ${getCardColorClass(cardColors?.backColor)} sm:!w-[50px] sm:!h-[50px]`}
                                                    style={cardColors?.backColor.startsWith("#") ? { backgroundColor: cardColors.backColor } : undefined}
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
                                                    className={`!w-[40px] !h-[40px] !rounded-full flex items-center justify-center ${getCardColorClass(cardColors?.backColor)} sm:!w-[50px] sm:!h-[50px]`}
                                                    style={cardColors?.backColor.startsWith("#") ? { backgroundColor: cardColors.backColor } : undefined}
                                                >
                                                    <IoAdd size={25} />
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                )}
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
        const profilePlayer = players?.find(p => p._id === profileId);
        const profileImageUrl = profilePlayer?.imageUrl;
        const profileStats = {
            games: profilePlayer?.games,
            lostGames: profilePlayer?.lostGames ?? 0,
            received: profilePlayer?.sipsReceived,
            given: profilePlayer?.sipsGiven,
            drivingSips: profilePlayer?.drivingSips,
            drivingRecord: profilePlayer?.drivingRecord,
        }

        return (
            <main>
                <header>
                    <p className="header-p !text-base !-mb-0.75 sm:!text-lg">Game PIN:</p>
                    <h1 className="text-5xl font-black text-center">{gamePin}</h1>
                </header>

                <div className="back-arrow-div">
                    <IoArrowBack className="back-arrow-icon" onClick={() => router.push("/")} />
                </div>

                {isHost ? (
                    <div className="settings-div">
                        <IoCog className="back-arrow-icon" onClick={() => setIsSettings(true)} />
                    </div>
                ) : (
                    <div className="settings-div">
                        <IoExitOutline className="back-arrow-icon" onClick={() => {
                            if (userId) {
                                leaveGame({ pin: gamePin, player: userId });
                                router.replace("/");
                            }
                        }} />
                    </div>
                )}

                <div className="main-div">
                    <div className="flex flex-row items-center justify-between">
                        <h2>Joined Players</h2>
                        <h2>{players?.length} / 6</h2>
                        <div className="flex flex-row items-center justify-center -space-x-0.5 w-[60px]">
                            {Array.from({ length: cardCount || 5 }).map((_, idx) => (
                                <div 
                                    key={idx} 
                                    className={`rounded-sm w-[12px] h-[19px] border border-white/60 shadow-sm shadow-black/50 sm:w-[15px] sm:h-[24px] ${getCardColorClass(cardColors?.backColor)}`}
                                    style={cardColors?.backColor.startsWith("#") ? { backgroundColor: cardColors.backColor } : undefined}
                                ></div>
                            ))}
                        </div>
                    </div>

                    <div className="players-list-div">
                        {players ? players.map((player, index) => (
                            <div key={player._id} className="player-div">
                                <div 
                                    className="player-name-div"
                                    onClick={() => {
                                        setIsProfile(true);
                                        setProfileId(player._id);
                                    }}
                                >
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

                                {game.base.ready.includes(player._id) ? (
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

                <div className="bottom-button-div">
                    <button
                        className={`${userId && game.base.ready.includes(userId) ? "!bg-green-600 hover:!bg-green-500 !shadow-green-600/20" : "!bg-red-700 hover:!bg-red-600 !shadow-red-700/20"}`} 
                        disabled={!userId}
                        onClick={() => userId && readyUp({ pin: gamePin, id: userId, isStart: true })}
                    >
                        Ready Up
                    </button>

                    <button
                        className={playersReadyStart ? "!bg-orange-600 !shadow-orange-500/20 hover:!bg-orange-500" : ""}
                        disabled={!playersReadyStart}
                        onClick={() => startGame({ pin: gamePin })}
                    >
                        {playersReadyStart ? "Start" : `Players ready ${game?.base.ready.length} / ${players?.length}`}
                    </button>
                </div>

                {isProfile && profileId && (
                    <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
                        <div className="main-div max-w-md !p-2 relative sm:!p-3">
                            <div className="player-name-div pt-1.25 !pb-3 px-2">
                                <div className="profile-pic-div-non-absolute relative !w-[72px] !h-[72px]">
                                    {profileImageUrl ? (
                                        <Image 
                                            src={profileImageUrl} 
                                            alt="Avatar" 
                                            fill
                                            className="object-cover"
                                        />
                                    ) : (
                                        <IoPerson className="profile-pic-icon" />
                                    )}
                                </div>
                                <p className="player-p !text-xl px-4 !max-w-[300px]">
                                    {profilePlayer?.username || `Player X`}
                                </p>
                            </div>

                            <div className="border-t border-zinc-700 py-2.5 mt-3 sm:py-4">
                                <div className="flex flex-row items-start justify-between gap-2">
                                    {achievementProgress?.map(({ category, label, best }) => {
                                        const material = best ? rankMaterials[best.rank - 1] : null;

                                        return (
                                            <div key={category} className="flex w-[65px] flex-col items-center gap-1">
                                                <div
                                                    className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/20 text-sm font-bold shadow-inner shadow-black/30"
                                                    style={{ background: material?.background ?? "#27272a" }}
                                                >
                                                    {best ? best.required : "—"}
                                                </div>
                                                <span className="text-center text-[9px] leading-tight text-zinc-400">{label}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-y-2 border-t border-zinc-700 pt-2 pb-4">
                                <p className="profile-stats-p">
                                    GAMES: <strong className="profile-stats-strong">{profileStats.games}</strong>
                                </p>
                                <p className="profile-stats-p">
                                    L%: <strong className="profile-stats-strong">{profileStats ? ((profileStats.lostGames * 100) / (profileStats.games || 1)).toFixed(1) : 0}%</strong>
                                </p>
                                <p className="profile-stats-p">
                                    LOST GAMES: <strong className="profile-stats-strong">{profileStats.lostGames}</strong>
                                </p>
                                <p className="profile-stats-p">
                                    SIPS GIVEN: <strong className="profile-stats-strong">{profileStats.given}</strong>
                                </p>
                                <p className="profile-stats-p">
                                    DRIVING SIPS: <strong className="profile-stats-strong">{profileStats.drivingSips}</strong>
                                </p>
                                <p className="profile-stats-p">
                                    SIPS RECEIVED: <strong className="profile-stats-strong">{profileStats.received}</strong>
                                </p>
                                <p className="profile-stats-p">
                                    DRIVING RECORD: <strong className="profile-stats-strong">{profileStats.drivingRecord}</strong>
                                </p>
                            </div>

                            <div className="settings-div sm:!right-3 sm:!top-3">
                                <IoPersonAdd 
                                    className="add-friend-icon" 
                                    onClick={() => {
                                        
                                    }}
                                />
                            </div>

                            <button 
                                onClick={async () => {
                                    setIsProfile(false);
                                    setProfileId(undefined);
                                }}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                )}

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