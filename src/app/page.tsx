"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { useConvexAuth } from "@convex-dev/auth/react";
import { SubmitEvent, useEffect, useState } from "react";
import { api } from "../../convex/_generated/api";
import { IoPerson } from "react-icons/io5";

export default function Home() {
	const router = useRouter();
	const { isAuthenticated, isLoading } = useConvexAuth();

	useEffect(() => {
		if (!isLoading && !isAuthenticated) { router.replace("/auth"); }
	}, [isAuthenticated, isLoading, router]);

	const getUserId = useQuery(api.users.userId);
	const ongoingGame = useQuery(api.games.getOngoing, getUserId ? { userId: getUserId } : "skip");
	
	const createGame = useMutation(api.games.create);
	const joinGame = useMutation(api.games.join);

	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	
	const [pin, setPin] = useState<string>("");
	const [isJoining, setIsJoining] = useState<boolean>(false);

	if (isLoading) {
		return (
			<main className="flex min-h-screen w-full flex-col p-8">
				<h1 className="my-auto text-center text-2xl font-bold">Checking session...</h1>
			</main>
		);
	}

	if (!isAuthenticated) {
		return null;
	}

	
	const handleJoining = async (event: SubmitEvent<HTMLFormElement>) => {
		event.preventDefault();
		
		if (!getUserId) {
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
		if (trimmedPin.length != 6) {
			setErrorMessage("Enter a PIN code that is 6 characters long.");
			return;
		}
		
		setIsJoining(true);
		setErrorMessage(null);
		
		try {
			await joinGame({ pin: trimmedPin, player: getUserId });
			router.push(`/game/${trimmedPin}`);
		} catch {
			setErrorMessage("Joining the game failed. Try again.");
		} finally {
			setIsJoining(false);
		}
	}
	
	if (isJoining) {
		return (
			<main className="flex min-h-screen w-full flex-col p-8">
				<h1 className="my-auto text-center text-2xl font-bold">Joining game...</h1>
			</main>
		)
	}
	
	const handleCreating = async () => {
		if (!getUserId) {
			setErrorMessage("Creating the game failed. Sign out and log in again.");
			return;
		}
		if (ongoingGame) {
			setErrorMessage("You can't create a game, join to the ongoing game from below.");
			return;
		}

		try {
			const res = await createGame({ userId: getUserId });
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
		<main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-8 p-8">
			<header className="space-y-2">
				<h1 className="text-5xl font-black text-center mt-1.5">Busdriver</h1>
				<p className="text-sm text-zinc-500 text-center">
					Jägershot is 12
				</p>
			</header>

			<div className="absolute right-8 top-9 w-[50px] h-[50px] bg-zinc-600 rounded-full flex items-center justify-center">
				<IoPerson size={35} className="text-zinc-300" onClick={() => router.push("/profile")} />
			</div>

			<div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full p-6 shadow-lg shadow-zinc-800/90">
				<h2 className="text-3xl font-black">Join Game</h2>
				<p className="text-zinc-300 pt-3 mt-3 border-t border-zinc-700">
					Join a game that your friend created by entering it&apos;s PIN code, or create a new game below.
				</p>

				<form className="mt-4 flex flex-col gap-4" onSubmit={handleJoining}>
					<input
						className="bg-zinc-100 text-black px-4 py-3 rounded-xl border border-zinc-200 outline-none focus:ring-2 focus:ring-green-600 transition-all"
						name="text"
						placeholder="PIN code"
						value={pin}
						onChange={(event) => setPin(event.target.value)}
						disabled={isJoining}
					/>
					<button
						className="mt-2 w-full bg-green-600 hover:bg-green-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white font-black py-4 rounded-xl text-xl transition-all shadow-lg shadow-green-600/20 disabled:shadow-zinc-500/20 active:scale-[0.98] disabled:cursor-not-allowed"
						type="submit"
						disabled={isJoining || ongoingGame ? true : false}
					>
						{isJoining ? "Joining..." : "Join"}
					</button>
				</form>

				{errorMessage && <p className="mt-3 text-sm text-red-600">{errorMessage}</p>}
			</div>

			<div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full p-6 shadow-lg shadow-zinc-800/90">
				<h2 className="text-3xl font-black">Create Game</h2>
				<p className="text-zinc-300 pt-3 mt-3 border-t border-zinc-700">
					Create a new game and share the generated PIN code to your friends.
				</p>
				<button
					className="mt-4 w-full bg-green-600 hover:bg-green-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white font-black py-4 rounded-xl text-xl transition-all shadow-lg shadow-green-600/20 disabled:shadow-zinc-500/20 active:scale-[0.98] disabled:cursor-not-allowed"
					disabled={ongoingGame ? true : false}
					onClick={handleCreating}
				>
					Create
				</button>
			</div>

			<div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full p-6 shadow-lg shadow-zinc-800/90">
				<h2 className="text-3xl font-black">Ongoing Game</h2>
				<p className="text-zinc-300 pt-3 mt-3 border-t border-zinc-700">
					Join back to a game that is not yet finished.
				</p>
				<button
					className="mt-4 w-full bg-green-600 hover:bg-green-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white font-black py-4 rounded-xl text-xl transition-all shadow-lg shadow-green-600/20 disabled:shadow-zinc-500/20 active:scale-[0.98] disabled:cursor-not-allowed"
					disabled={!ongoingGame}
					onClick={handleOngoing}
				>
					{ongoingGame ? "Join" : "No ongoing game"}
				</button>
			</div>
		</main>
	);
}