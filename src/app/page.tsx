"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { useConvexAuth } from "@convex-dev/auth/react";
import { SubmitEvent, useEffect, useState } from "react";
import { api } from "../../convex/_generated/api";
import { IoPerson } from "react-icons/io5";
import Image from "next/image";

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

	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	
	const [pin, setPin] = useState<string>("");
	const [isJoining, setIsJoining] = useState<boolean>(false);

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

	return (
		<main>
			<header>
				<h1>Busdriver</h1>
				<p className="header-p">
					Jägershot is 12
				</p>
			</header>

			<div className="profile-pic-div !fixed">
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
		</main>
	);
}