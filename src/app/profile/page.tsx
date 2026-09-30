"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { useMutation, useQuery } from "convex/react";
import { useConvexAuth, useAuthActions } from "@convex-dev/auth/react";
import { useEffect, useState, useRef } from "react";
import { api } from "../../../convex/_generated/api";
import { IoPerson, IoArrowBack, IoWalk } from "react-icons/io5";
import { GiCardAceSpades } from "react-icons/gi";
import { CiMenuKebab } from "react-icons/ci";

export default function ProfilePage() {
    const router = useRouter();
    const { isAuthenticated, isLoading } = useConvexAuth();
    const { signOut } = useAuthActions();
    
    useEffect(() => {
        if (!isLoading && !isAuthenticated) { router.replace("/auth"); }
    }, [isAuthenticated, isLoading, router]);
    
    const userId = useQuery(api.users.getUserId);
    const user = useQuery(api.users.getUser);
    const stats = useQuery(api.stats.getStats, userId ? { userId: userId } : "skip");
    const games = useQuery(api.stats.getGames, userId ? { userId: userId } : "skip");
    const achievementProgress = useQuery(api.achievements.getAchievements);
    
    const updateUser = useMutation(api.users.update);
    const generateUploadUrl = useMutation(api.users.generateUploadUrl);
    const cards = useMutation(api.cards.getCards);
    const updateCards = useMutation(api.cards.updateCards);

    const [isMenu, setIsMenu] = useState<boolean>(false);
    
    const [isEditProfile, setIsEditProfile] = useState<boolean>(false);
    const [username, setUsername] = useState<string>("");
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const [isModify, setIsModify] = useState<boolean>(false);
    const [backColor, setBackColor] = useState<string>("bg-blue-600");
    const [faceColor, setFaceColor] = useState<string>("bg-white");
    const [unlockedColors, setUnlockedColors] = useState<string[]>([]);
    const cardColors = ["bg-blue-600", "bg-white", ...unlockedColors];

    const [isShowAchievements, setIsShowAchievements] = useState<boolean>(false);
    const rankMaterials = [
        { name: "Wood", background: "linear-gradient(135deg, #d4a373 0%, #8b5a2b 45%, #5c371d 100%)" },
        { name: "Iron", background: "linear-gradient(135deg, #87939b 0%, #4b5563 48%, #252b32 100%)" },
        { name: "Bronze", background: "linear-gradient(135deg, #f0b477 0%, #b87333 48%, #75421f 100%)" },
        { name: "Silver", background: "linear-gradient(135deg, #ffffff 0%, #cbd5e1 45%, #7c8794 100%)" },
        { name: "Gold", background: "linear-gradient(135deg, #fff1a8 0%, #eab308 48%, #a16207 100%)" },
        { name: "Platinum", background: "linear-gradient(135deg, #f8fafc 0%, #d5d9de 48%, #929ba5 100%)" },
        { name: "Diamond", background: "linear-gradient(135deg, #ecfeff 0%, #67e8f9 45%, #0891b2 100%)" },
    ];


    const handleDone = async () => {
        let imageId = user?.image;

        if (selectedImage) {
            const postUrl = await generateUploadUrl();
            const result = await fetch(postUrl, {
                method: "POST",
                headers: { "Content-Type": selectedImage.type },
                body: selectedImage,
            });
            const { storageId } = await result.json();
            imageId = storageId;
        }

        await updateUser({
            username: username,
            image: imageId,
        });

        setIsEditProfile(false);
        setSelectedImage(null);
        setImagePreview(null);
    };

    const handleCancel = () => {
        setIsEditProfile(false);
        setUsername(user?.username || "");
        setSelectedImage(null);
        setImagePreview(null);
    };

    const onImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedImage(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    if (isLoading) {
		return (
			<main className="loading-main">
				<h1 className="loading-h1">Loading...</h1>
			</main>
		)
	}

    if (!isAuthenticated) {
        return null;
    }
    
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

            <div className="back-arrow-div !right-3 !left-auto">
            </div>

            <div className="main-div flex flex-col">
                <div className="flex items-center justify-start gap-6 relative">
                    <div className="profile-pic-div-non-absolute relative !w-[80px] !h-[80px] sm:!w-[100px] sm:!h-[100px]">
                        {user?.imageUrl ? (
                            <Image 
                            src={user.imageUrl} 
                            alt="Avatar" 
                            fill
                            className="object-cover"
                            />
                        ) : (
                            <IoPerson className="profile-pic-icon !w-[70px] !h-[70px] sm:!w-[84px] sm:!h-[84px]" />
                        )}
                    </div>
                    
                    <div className="overflow-hidden">
                        <h2 className="!text-2xl truncate max-w-[200px]">{user?.username || "Username"}</h2>
                    </div>

                    <CiMenuKebab 
                        className="menu-icon" 
                        onClick={() => setIsMenu(!isMenu)}
                    />

                    {isMenu && (
                        <div className="main-div absolute !bg-zinc-800 top-10 right-3 !w-[160px]">
                            <div 
                                className="border-b-1 border-zinc-500"
                                onClick={() => {
                                    signOut();
                                    setIsMenu(false);
                                }}
                            >
                                <p className="pb-1 px-0.5 font-bold">Sign Out</p>
                            </div>

                            <div
                                className="border-b-1 border-zinc-500"
                                onClick={() => {
                                    setUsername(user?.username || "");
                                    setIsEditProfile(true);
                                    setIsMenu(false);
                                }}
                            >
                                <p className="py-1 px-0.5 font-bold">Edit profile</p>
                            </div>
                            
                            <div
                                className=""
                                onClick={async () => {
                                    if (userId) {
                                        const current = await cards({ userId });
                                        setBackColor(current.backColor ?? "bg-blue-600");
                                        setFaceColor(current.faceColor ?? "bg-white");
                                        setUnlockedColors(current.colors ?? []);
                                    }
                                    setIsModify(true);
                                    setIsMenu(false);
                                }}
                            >
                                <p className="pt-1 px-0.5 font-bold">Modify Cards</p>
                            </div>


                            
                        </div>
                    )}

                </div>

                <div className="border-t border-zinc-700 py-2.5 mt-3 sm:py-4">
                    <div
                        className="text-zinc-500 text-[11px] -mt-2.5 mb-0.5 font-medium text-right hover:!text-green-600 transition-colors"
                        onClick={() => setIsShowAchievements(true)}
                    >
                        See all achievements
                    </div>

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
                
                <div className="grid grid-cols-2 gap-y-2 border-t border-zinc-700 py-2.5 sm:gap-y-3 sm:py-4">
                    <p className="profile-stats-p">
                        GAMES: <strong className="profile-stats-strong">{stats?.games?.toString() || 0}</strong>
                    </p>
                    <p className="profile-stats-p">
                        L%: <strong className="profile-stats-strong">{stats ? ((stats.lostGames * 100) / (stats.games || 1)).toFixed(1) : 0}%</strong>
                    </p>
                    <p className="profile-stats-p">
                        LOST GAMES: <strong className="profile-stats-strong">{stats?.lostGames?.toString() || 0}</strong>
                    </p>
                    <p className="profile-stats-p">
                        SIPS GIVEN: <strong className="profile-stats-strong">{stats?.sipsGiven?.toString() || 0}</strong>
                    </p>
                    <p className="profile-stats-p">
                        DRIVING SIPS: <strong className="profile-stats-strong">{stats?.drivingSips?.toString() || 0}</strong>
                    </p>
                    <p className="profile-stats-p">
                        SIPS RECEIVED: <strong className="profile-stats-strong">{stats?.sipsReceived?.toString() || 0}</strong>
                    </p>
                    <p className="profile-stats-p">
                        DRIVING RECORD: <strong className="profile-stats-strong">{stats?.drivingRecord?.toString() || 0}</strong>
                    </p>
                </div>

                <div className="flex flex-col items-center justify-start h-[185px] overflow-y-auto border-t border-zinc-700 pt-0 mt-0 sm:h-[350px]">
                    {games ? (games.map((game, idx) => (
                        <div key={idx} className="flex flex-row items-center justify-between gap-2 p-2 w-full border-b border-zinc-800">
                            <p className="text-zinc-400 font-medium text-base sm:text-lg">
                                {new Date(game._creationTime).toLocaleDateString()} <br /> 
                                {new Date(game._creationTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>

                            <div>
                                {game.drive.loser === userId ? (<strong className="text-red-700">LOST</strong>) : ""}
                                {game.drive.loser === userId ? (<strong className="ml-2">({game.drive.sips})</strong>) : ""}
                            </div>

                            <div className="flex flex-row items-center justify-center gap-4 sm:gap-12">
                                <div className="flex items-baseline justify-end w-[40px]">
                                    <span className="text-xl font-bold mr-2 sm:text-3xl">{game.base.sips?.find(entry => entry.userId === userId)?.sipsGiven ?? 0}</span>
                                    <span className="text-xs font-medium text-zinc-400 uppercase sm:text-base">G</span>
                                </div>
                                <div className="flex items-baseline justify-end w-[40px]">
                                    <span className="text-xl font-bold mr-2 sm:text-3xl">{game.base.sips?.find(entry => entry.userId === userId)?.sipsReceived ?? 0}</span>
                                    <span className="text-xs font-medium text-zinc-400 uppercase sm:text-base">R</span>
                                </div>
                            </div>
                        </div>
                    ))) : (
                        <p className="italic-text p-2">No games played.</p>
                    )}
                </div>
            </div>

            {isEditProfile && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
                    <div className="main-div max-w-md !p-2 relative">
                        <h2 className="text-center pt-2 mb-4">Edit Profile</h2>

                        <div className="back-arrow-div !m-0 !absolute top-4 left-4">
                            <IoArrowBack className="back-arrow-icon" onClick={handleCancel} />
                        </div>
                        
                        <div className="flex flex-col gap-6 mb-6">
                            <div className="flex flex-col items-center gap-4">
                                <div className="w-[120px] h-[120px] bg-zinc-600 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden relative sm:w-[144px] sm:h-[144px]">
                                    {imagePreview || user?.imageUrl ? (
                                        <Image 
                                            src={imagePreview || user?.imageUrl || ""} 
                                            alt="Avatar" 
                                            fill
                                            className="object-cover"
                                        />
                                    ) : (
                                        <IoPerson className="text-zinc-300 w-[84px] h-[84px] sm:w-[101px] sm:h-[101px]" />
                                    )}
                                </div>
                                
                                <input 
                                    type="file" 
                                    accept="image/*" 
                                    onChange={onImageChange} 
                                    className="hidden" 
                                    ref={fileInputRef} 
                                />
                                <button 
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="!bg-zinc-800 hover:!bg-zinc-700 !text-sm !py-1.5 px-4 !shadow-none border border-zinc-700"
                                >
                                    Change Avatar
                                </button>
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-sm text-zinc-400">Username</label>
                                <input 
                                    type="text" 
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="Enter username"
                                />
                            </div>
                        </div>
                        
                        <button
                            onClick={handleDone}
                        >
                            Done
                        </button>

                    </div>
                </div>
            )}

            {isModify && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
                    <div className="main-div max-w-md !p-2 relative">
                        <h2 className="text-center pt-2 mb-4">Modify your cards</h2>

                        <div className="back-arrow-div !m-0 !absolute top-4 left-4">
                            <IoArrowBack className="back-arrow-icon" onClick={() => setIsModify(false)} />
                        </div>

                        <div className="flex flex-col items-center justify-between gap-5 mb-6">
                            <div className="flex flex-col items-center gap-1.5">
                                <p className="font-bold">The back</p>
                                <div className="flex flex-row items-center justify-center flex-wrap gap-2">
                                    {cardColors.map((color, idx) => (
                                        <div
                                            key={idx}
                                            onClick={() => setBackColor(color)}
                                            className={`${color.startsWith("#") ? "" : color} rounded-md cursor-pointer transition-all ${
                                                backColor === color
                                                    ? "w-[38px] h-[38px] outline outline-2 outline-offset-2 outline-white"
                                                    : "w-[30px] h-[30px]"
                                            }`}
                                            style={color.startsWith("#") ? { backgroundColor: color } : undefined}
                                        ></div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex flex-col items-center gap-1.5">
                                <p className="font-bold">The face</p>
                                <div className="flex flex-row items-center justify-center flex-wrap gap-2">
                                    {cardColors.map((color, idx) => (
                                        <div
                                            key={idx}
                                            onClick={() => setFaceColor(color)}
                                            className={`${color.startsWith("#") ? "" : color} rounded-md cursor-pointer transition-all ${
                                                faceColor === color
                                                    ? "w-[38px] h-[38px] outline outline-2 outline-offset-2 outline-white"
                                                    : "w-[30px] h-[30px]"
                                            }`}
                                            style={color.startsWith("#") ? { backgroundColor: color } : undefined}
                                        ></div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={async () => {
                                if (userId) {
                                    await updateCards({ userId, backColor, faceColor });
                                }
                                setIsModify(false);
                            }}
                        >
                            Save
                        </button>
                    </div>
                </div>
            )}

            {isShowAchievements && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
                    <div className="main-div max-w-md !p-2 relative">
                        <h2 className="text-center pt-2 mb-4">Achievements</h2>

                        <div className="mb-4 flex flex-wrap justify-center gap-x-3 gap-y-2">
                            {rankMaterials.map(({ name, background }) => (
                                <div 
                                    key={name} 
                                    className="flex items-center gap-1.5"
                                >
                                    <span
                                        className="h-4 w-4 rounded border border-white/20 shadow-inner shadow-black/30"
                                        style={{ background }}
                                    />
                                    <span className="text-xs text-zinc-300">{name}</span>
                                </div>
                            ))}
                        </div>

                        <div className="flex max-h-[60vh] flex-col gap-4 overflow-y-auto mb-6">
                            {achievementProgress?.map(({ category, label, achievements: categoryAchievements }) => (
                                <div key={category} className="flex flex-row items-start gap-1">
                                    <h3 className="w-26 shrink-0 text-sm font-semibold">{label}</h3>
                                    <div className="flex flex-row items-center justify-start flex-wrap gap-2">
                                        {categoryAchievements.map((achievement) => {
                                            const material = rankMaterials[achievement.rank - 1];

                                            return (
                                                <div
                                                    key={achievement.name}
                                                    className={`w-[60px] h-[60px] flex items-center justify-center rounded-md border border-white/20 font-bold shadow-inner shadow-black/30 ${achievement.earned ? "" : "grayscale opacity-35"}`}
                                                    style={{ background: material.background }}
                                                >
                                                    <p className="text-[10px] text-zinc-900 text-center">{achievement.text}</p>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <button
                            onClick={async () => setIsShowAchievements(false)}
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </main>
    );
}