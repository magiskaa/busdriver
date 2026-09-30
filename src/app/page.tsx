"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { useConvexAuth } from "@convex-dev/auth/react";
import { SubmitEvent, useEffect, useState } from "react";
import { api } from "../../convex/_generated/api";
import { IoPerson, IoBug, IoArrowBack, IoSend, IoThumbsUpSharp, IoThumbsDownSharp, IoCheckboxOutline, IoCheckbox } from "react-icons/io5";
import Image from "next/image";
import { ToastContainer, toast, Slide } from 'react-toastify';

export default function Home() {
	const router = useRouter();
	const { isAuthenticated, isLoading } = useConvexAuth();

	useEffect(() => {
		if (!isLoading && !isAuthenticated) { router.replace("/auth"); }
	}, [isAuthenticated, isLoading, router]);

	const userId = useQuery(api.users.getUserId);
    const user = useQuery(api.users.getUser);
	const ongoingGame = useQuery(api.games.getOngoing, userId ? { userId: userId } : "skip");
	
	const createGame = useMutation(api.games.create);
	const joinGame = useMutation(api.games.join);
    const users = useQuery(api.users.getUsers);
    const reports = useQuery(api.reports.get);
	const addReport = useMutation(api.reports.add);
	const like = useMutation(api.reports.like);
	const dislike = useMutation(api.reports.dislike);
	const fixed = useMutation(api.reports.fixed);

	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	
	const [pin, setPin] = useState<string>("");
	const [isJoining, setIsJoining] = useState<boolean>(false);
    const [isBugReportList, setIsBugReportList] = useState<boolean>(false);
	const [isBugReport, setIsBugReport] = useState<boolean>(false);
	const [text, setText] = useState<string>("");

	if (isLoading) {
		return (
			<main className="loading-main">
				<h1 className="loading-h1">Loading...</h1>
			</main>
		);
	}

	if (!isAuthenticated) {
		return null;
	}
	
	const handleJoining = async (event: SubmitEvent<HTMLFormElement>) => {
		event.preventDefault();
		
		if (!userId) {
			setErrorMessage("Joining the game failed. Sign out and log in again.");
			return;
		}
		if (ongoingGame) {
			setErrorMessage("You can't join another game, join to the ongoing game from below.");
			return;
		}

		const trimmedPin = pin.trim();
		if (!trimmedPin) {
			setErrorMessage("Enter a PIN code before joining.");
			return;
		}
		if (trimmedPin.length != 4) {
			setErrorMessage("Enter a PIN code that is 4 characters long.");
			return;
		}
		
		setIsJoining(true);
		setErrorMessage(null);
		
		try {
			await joinGame({ pin: trimmedPin, player: userId });
			router.push(`/game/${trimmedPin}`);
		} catch {
			setErrorMessage("Joining the game failed. Check that you have the right PIN.");
		} finally {
			setIsJoining(false);
		}
	}
	
	if (isJoining) {
		return (
			<main className="loading-main">
				<h1 className="loading-h1">Joining Game...</h1>
			</main>
		)
	}
	
	const handleCreating = async () => {
		if (!userId) {
			setErrorMessage("Creating the game failed. Sign out and log in again.");
			return;
		}
		if (ongoingGame) {
			setErrorMessage("You can't create a game, join to the ongoing game from below.");
			return;
		}

		try {
			const res = await createGame({ userId: userId });
			router.push(`/game/${res.pin}`);
		} catch {
			setErrorMessage("Creating the game failed. Try again.");
		}
	}

	const handleOngoing = async () => {
		if (ongoingGame) {
			router.push(`/game/${ongoingGame}`);
		}
	};

    const handleSend = async () => {
		if (!userId) {
			setErrorMessage("Sending bug report failed. Sign out and log in again.");
			return;
		}
		if (!text || text.length < 3) {
			return;
		}

		try {
			await addReport({ userId: userId, text });
		} catch {
			setErrorMessage("Sending bug report failed. Try again.");
		} finally {
			toast('🪲 Bug report sent successfully!', {
                position: "top-right",
                autoClose: 3000,
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
		setIsBugReport(false);
    };

	return (
		<main>
			<ToastContainer
				newestOnTop={false}
				className="!rounded-sm !left-auto !right-8 !w-[calc(100vw-4rem)] sm:!right-0 sm:!w-[320px]"
				progressClassName="!rounded-xl !bg-green-800"
				toastClassName="!rounded-sm !bg-green-600 !text-white"
			/>

			<header>
				<h1>Busdriver</h1>
				<p className="header-p">
					Jägershot is 12
				</p>
			</header>

			<div 
				className="w-[40px] h-[40px] flex items-center justify-center absolute left-3 top-3 bg-zinc-800/70 rounded-full active:scale-[0.95] sm:w-[60px] sm:h-[60px] sm:left-12 sm:top-8"
				onClick={() => setIsBugReportList(true)}
			>
				<IoBug className="bug-icon" />
			</div>

			<div className="profile-pic-div !fixed active:scale-[0.95]">
				{user?.imageUrl ? (
					<Image
						src={user?.imageUrl || ""} 
						alt="Avatar" 
						fill
						className="object-cover"
						onClick={() => router.push("/profile")}
					/>
				) : (
					<IoPerson className="profile-pic-icon" onClick={() => router.push("/profile")} />
				)}
			</div>

			{errorMessage && <p className="error-p">{errorMessage ?? "Error occurred. Please try again."}</p>}

			<div className="main-div">
				<h2 className="-mt-1">Play</h2>

				{ongoingGame ? (
					<div>
						<p className="main-p !mt-3">
							Join back to a game that is not yet finished.
						</p>
						<button
							className="mt-2 sm:mt-4 sm:py-4"
							disabled={!ongoingGame}
							onClick={handleOngoing}
							>
							{ongoingGame ? "Join" : "No ongoing game"}
						</button>
					</div>
				) : (
					<div>
						<p className="main-p">
							Join a game by entering it&apos;s 4 character PIN code.
						</p>
						<form className="mt-2 flex flex-col gap-3 sm:mt-4 sm:gap-4" onSubmit={handleJoining}>
							<div className="grid grid-cols-2 gap-x-3">
								<input
									className="uppercase"
									name="text"
									placeholder="PIN"
									value={pin}
									onChange={(event) => setPin(event.target.value.toUpperCase())}
									disabled={isJoining}
								/>

								<button
									className=""
									type="submit"
									disabled={isJoining || ongoingGame ? true : false || pin.length !== 4}
								>
									{isJoining ? "Joining..." : "Join"}
								</button>
							</div>
						</form>
					</div>
				)}
				
				<p className="main-p !mt-3">
					Create a new game and share the generated PIN code to your friends.
				</p>
				<button
					className="mt-2 sm:mt-4 sm:py-4"
					disabled={ongoingGame ? true : false}
					onClick={handleCreating}
					>
					Create
				</button>
			</div>

			<div className="main-div">
				<h2 className="-mt-1">News and updates</h2>

				<div className="flex flex-col items-center justify-start h-[160px] overflow-y-auto border-t border-zinc-700 pt-0 mt-1.5 sm:h-[350px]">
					<p className="main-p !mt-0 !border-0">
						30.9.2026 - Added achievements and rewards, added driving record stat, modified home screen and profile screen, optimized database calls, added card color customization (accessible from profile).
					</p>
					<p className="main-p">
						29.9.2026 - Added a password reset form into the sign in page, added a bug report list for everyone to see along with a voting system and a &quot;fixed&quot; checkmark for every report, added &quot;News and updates&quot;, modified profile page and home page. 
					</p>
					<p className="main-p">
						28.9.2026 - Added the ability to inspect anyones profile and their stats in game lobby.
					</p>
					<p className="main-p">
						25.9.2026 - Added emotes to driving, added a check to prevent players accessing games they are not a part of (Thank you Veeti!).
					</p>
					<p className="main-p">
						22.9.2026 - Added received sips to sip distribution screen, added emotes and updated in-game player cards, updated toast notification when receiving sips.
					</p>
				</div>
			</div>

			{isBugReportList && (
				<div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
					<div className="main-div max-w-xl !p-2 relative">
						<h2 className="text-center pt-2 mb-4">Bug Reports <br/> & Suggestions</h2>

						<div 
							className="w-[50px] h-[50px] flex items-center justify-center absolute right-3 top-3 bg-zinc-800/70 rounded-full active:scale-[0.95]"
							onClick={() => setIsBugReport(true)}
						>
							<IoSend className="bug-icon !w-[28px] !h-[28px]" />
						</div>
						
						<div className="flex flex-col items-center justify-start h-[70vh] overflow-y-auto border-t border-zinc-700 pt-0.5 mt-2.5">
							{reports ? (reports.map((report, idx) => (
								<div key={idx} className="flex flex-col items-top justify-between gap-2 p-2 w-full border-b border-zinc-800">
									<div className="flex flex-row items-center justify-start gap-2 mt-1">
										<div className="profile-pic-div-non-absolute relative">
											{users?.find(user => user._id === report.userId)?.imageUrl ? (
												<Image
													src={users?.find(user => user._id === report.userId)?.imageUrl || ""} 
													alt="Avatar" 
													fill
													className="object-cover"
												/>
											) : (
												<IoPerson className="profile-pic-icon" />
											)}
										</div>
										<p className="px-1.5 flex-1 text-lg sm:text-xl">{users?.find(user => user._id === report.userId)?.username}</p>
										<p className="text-zinc-400 font-medium text-sm sm:text-lg">
											{new Date(report._creationTime).toLocaleDateString()} <br /> 
											{new Date(report._creationTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
										</p>
									</div>
									
									<p className="my-1">{report.text}</p>

									<div className="flex flex-row items-center justify-between mb-1">
										<div className="flex flex-row items-center justify-between gap-10">
											<div className="flex flex-row items-center justify-between gap-4 active:scale-[0.95]">
												<IoThumbsUpSharp 
													className={`thumbs-up-icon ${userId && report.details?.likes.includes(userId) ? "!text-green-600" : ""}`}
													onClick={() => userId && like({ userId, reportId: report._id })} 
												/>
												<p>{report.details?.likes.length || 0}</p>
											</div>

											<div className="flex flex-row items-center justify-between gap-4 active:scale-[0.95]">
												<IoThumbsDownSharp 
													className={`thumbs-down-icon ${userId && report.details?.dislikes.includes(userId) ? "!text-red-600" : ""}`} 
													onClick={() => userId && dislike({ userId, reportId: report._id })}
												/>
												<p>{report.details?.dislikes.length || 0}</p>
											</div>

										</div>
										{report.details?.fixed ? (
											<IoCheckbox 
												className="thumbs-up-icon mr-4 sm:mr-7 !text-green-600 active:scale-[0.95]" 
												onClick={() => userId && fixed({ userId, reportId: report._id })}
											/>
										) : (
											<IoCheckboxOutline 
												className="thumbs-up-icon mr-4 sm:mr-7 active:scale-[0.95]" 
												onClick={() => userId && fixed({ userId, reportId: report._id })}
											/>
										)}
									</div>
								</div>
							))) : (
								<p className="italic-text p-2">No bug reports or suggestions.</p>
							)}
						</div>

						<button
							onClick={() => setIsBugReportList(false)}
						>
							Close
						</button>
					</div>
				</div>
			)}

			{isBugReport && (
				<div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
					<div className="main-div max-w-lg !p-2 relative">
						<h2 className="text-center pt-2 mb-4">Write a new Bug <br/> Report or Suggestion</h2>

						<div className="back-arrow-div !m-0 !absolute top-4 left-4">
							<IoArrowBack className="back-arrow-icon" onClick={() => setIsBugReport(false)} />
						</div>
						
						<textarea 
							name="report" 
							id="reportText" 
							className="h-[200px] bg-zinc-100 text-black px-2.5 py-1.5 mt-1.5 mb-3 rounded-xl border border-zinc-200 outline-none transition-all w-full focus:ring-2 focus:ring-green-600 sm:px-4 sm:py-3"
							onChange={(event) => setText(event.target.value)}
						/>

						<button
							onClick={handleSend}
						>
							Send
						</button>
					</div>
				</div>
			)}
		</main>
	);
}