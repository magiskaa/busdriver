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
	const createGame = useMutation(api.games.create);
	const joinGame = useMutation(api.games.join);
	const ongoingGame = useQuery(api.games.ongoing, getUserId ? { userId: getUserId } : "skip");

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
				<h1 className="text-5xl font-bold text-center mt-1.5">Busdriver</h1>
				<p className="max-w-1xl text-sm text-zinc-500 text-center">
					Jägershot is 12
				</p>
			</header>

			<div className="absolute w-[50px] h-[50px] bg-gray-300 right-8 top-9 rounded-full flex">
				<IoPerson color="gray" size={40} className="m-auto" onClick={() => router.push("/profile")} />
			</div>

			<div className="rounded-xl bg-white p-8 mt-2 text-black">
				<h2 className="text-3xl font-bold">Join Game</h2>
				<p className="pt-2 mt-2 border-t border-zinc-300">
					Join a game that your friend created by entering it&apos;s PIN code, or create a new game below.
				</p>

				<form className="mt-4 flex flex-col gap-4" onSubmit={handleJoining}>
					<input
						className="bg-zinc-100 text-black px-4 py-3 rounded-xl border border-zinc-200 outline-none focus:ring-2 focus:ring-green-500 transition-all"
						name="text"
						placeholder="PIN code"
						value={pin}
						onChange={(event) => setPin(event.target.value)}
						disabled={isJoining}
					/>
					<button
						className="bg-green-600 text-white px-4 py-2 mt-2 rounded-xl font-bold text-2xl shadow-lg shadow-green-900/30 transition-all hover:bg-green-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-zinc-400"
						type="submit"
						disabled={isJoining}
					>
						{isJoining ? "Joining..." : "Join"}
					</button>
				</form>

				{errorMessage && <p className="mt-3 text-sm text-red-600">{errorMessage}</p>}
			</div>

			<div className="rounded-xl bg-white p-8 text-black">
				<h2 className="text-3xl font-bold">Create Game</h2>
				<p className="pt-2 mt-2 border-t border-zinc-300">
					Create a new game and share the generated PIN code to your friends.
				</p>
				<button
					className="bg-green-600 w-full text-white px-4 py-2 mt-6 rounded-xl font-bold text-2xl shadow-lg shadow-green-900/60 transition-all hover:bg-green-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-zinc-400"
					disabled={ongoingGame ? true : false}
					onClick={handleCreating}
				>
					{ongoingGame ? "Join the ongoing game" : "Create game"}
				</button>
			</div>

			<div className="rounded-xl bg-white p-8 text-black">
				<h2 className="text-3xl font-bold">Ongoing Game</h2>
				<p className="pt-2 mt-2 border-t border-zinc-300">
					Join back to a game that is not yet finished.
				</p>
				<button
					className="bg-green-600 w-full text-white px-4 py-2 mt-6 rounded-xl font-bold text-2xl shadow-lg shadow-green-900/30 transition-all hover:bg-green-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-zinc-400"
					disabled={!ongoingGame}
					onClick={handleOngoing}
				>
					{ongoingGame ? "Join" : "No ongoing game found"}
				</button>
			</div>
		</main>
	);
}