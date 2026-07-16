"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { useConvexAuth } from "@convex-dev/auth/react";
import { SubmitEvent, useEffect, useState } from "react";
import { api } from "../../convex/_generated/api";
import { IoPerson, IoBug, IoArrowBack } from "react-icons/io5";
import Image from "next/image";
import { showToast } from "nextjs-toast-notify";

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
	const addReport = useMutation(api.reports.add);

	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	
	const [pin, setPin] = useState<string>("");
	const [isJoining, setIsJoining] = useState<boolean>(false);
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
			setErrorMessage("Enter a PIN code that is 6 characters long.");
			return;
		}
		
		setIsJoining(true);
		setErrorMessage(null);
		
		try {
			await joinGame({ pin: trimmedPin, player: userId });
			router.push(`/game/${trimmedPin}`);
		} catch {
			setErrorMessage("Joining the game failed. Try again.");
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
			showToast.success("Bug report sent successfully!", {
				duration: 3000,
				position: "top-center",
				transition: "bounceIn",
				icon: "🪲",
				sound: true,
				progress: true
			});
		}
		setIsBugReport(false);
    };

	return (
		<main>
			<header>
				<h1>Busdriver</h1>
				<p className="header-p">
					Jägershot is 12
				</p>
			</header>

			<div className="profile-pic-div !fixed active:scale-[1.1]">
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
				<h2>Join Game</h2>
				<p className="main-p">
					Join a game that your friend created by entering it&apos;s PIN code, or create a new game below.
				</p>

				<form className="mt-2 flex flex-col gap-3 sm:mt-4 sm:gap-4" onSubmit={handleJoining}>
					<input
						className="uppercase"
						name="text"
						placeholder="PIN"
						value={pin}
						onChange={(event) => setPin(event.target.value.toUpperCase())}
						disabled={isJoining}
					/>
					<button
						type="submit"
						disabled={isJoining || ongoingGame ? true : false}
					>
						{isJoining ? "Joining..." : "Join"}
					</button>
				</form>
			</div>

			<div className="main-div">
				<h2>Create Game</h2>
				<p className="main-p">
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
				<h2>Ongoing Game</h2>
				<p className="main-p">
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

			<div 
				className="main-div flex flex-row items-center gap-2 !bg-zinc-800/90 text-xs !border-zinc-700 !py-1 !rounded-full !w-fit absolute right-3 bottom-3 active:scale-[1.05]"
				onClick={() => setIsBugReport(true)}
			>
				<IoBug className="bug-icon" />
				<p className="text-zinc-400">Report a bug, or <br /> make a suggestion.</p>
			</div>

			{isBugReport && (
				<div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
					<div className="main-div max-w-md !p-2 relative">
						<h2 className="text-center pt-2 mb-4">Bug Report</h2>

						<div className="back-arrow-div !m-0 !absolute top-4 left-4">
							<IoArrowBack className="back-arrow-icon" onClick={() => setIsBugReport(false)} />
						</div>
						
						<textarea 
							name="report" 
							id="reportText" 
							className="bg-zinc-100 text-black px-2.5 py-1.5 mt-1.5 mb-3 rounded-xl border border-zinc-200 outline-none transition-all w-full focus:ring-2 focus:ring-green-600 sm:px-4 sm:py-3"
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