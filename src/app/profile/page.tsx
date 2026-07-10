"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { useMutation, useQuery } from "convex/react";
import { useConvexAuth, useAuthActions } from "@convex-dev/auth/react";
import { useEffect, useState, useRef } from "react";
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
    const stats = useQuery(api.stats.get, userId ? { userId: userId } : "skip");

    const updateUser = useMutation(api.users.update);
    const generateUploadUrl = useMutation(api.users.generateUploadUrl);

    const [isEditProfile, setIsEditProfile] = useState<boolean>(false);
    const [username, setUsername] = useState<string>("");
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

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

            <div className="main-div flex flex-col gap-4 sm:gap-8">
                <div className="flex items-center justify-start gap-8">
                    <div className="profile-pic-div-non-absolute relative !w-[100px] !h-[100px] sm:!w-[120px] sm:!h-[120px]">
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
                        <h2 className="!text-2xl truncate max-w-[180px]">{user?.username || "Username"}</h2>
                        <button
                            className="max-w-fit border border-zinc-700 px-2 mt-4 !bg-zinc-800 hover:!bg-zinc-700 !text-sm !text-zinc-300 !py-1 !shadow-zinc-800/20 sm:px-4 sm:!mt-6 sm:!text-xl"
                            onClick={() => {
                                setUsername(user?.username || "");
                                setIsEditProfile(true);
                            }}
                        >
                            Edit profile
                        </button>
                    </div>
                </div>
                
                <div className="grid grid-cols-2 gap-y-4 border-t border-zinc-700 pt-4 sm:pt-8">
                    <p className="profile-stats-p">
                        GAMES: <strong className="profile-stats-strong">{stats?.games?.toString() || 0}</strong>
                    </p>
                    <p className="profile-stats-p">
                        SIPS GIVEN: <strong className="profile-stats-strong">{stats?.sipsGiven?.toString() || 0}</strong>
                    </p>
                    <p className="profile-stats-p">
                        LOST GAMES: <strong className="profile-stats-strong">{stats?.lostGames?.toString() || 0}</strong>
                    </p>
                    <p className="profile-stats-p">
                        SIPS RECEIVED: <strong className="profile-stats-strong">{stats?.sipsReceived?.toString() || 0}</strong>
                    </p>
                    <p className="profile-stats-p">
                        L%: <strong className="profile-stats-strong">{stats ? ((stats.lostGames * 100) / (stats.games || 1)).toFixed(1) : 0}%</strong>
                    </p>
                    <p className="profile-stats-p">
                        DRIVING SIPS: <strong className="profile-stats-strong">{stats?.drivingSips?.toString() || 0}</strong>
                    </p>
                </div>
            </div>

            <div className="bottom-button-div">
                <button
                    className="!bg-red-700 hover:!bg-red-600 !shadow-red-700/20"
                    onClick={() => signOut()}
                >
                    Sign out
                </button>
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

                        <div className="flex justify-end gap-4">
                            <button
                                onClick={handleDone}
                            >
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}