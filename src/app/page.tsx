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
	useQuery(api.users.get, !isLoading && isAuthenticated ? {} : "skip");

	useEffect(() => {
		if (!isLoading && !isAuthenticated) { router.replace("/auth"); }
	}, [isAuthenticated, isLoading, router]);

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
			const res = await joinGame({ pin: trimmedPin });
			router.push(`/game/${res.pin}`);
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
		try {
			const res = await createGame();
			router.push(`/game/${res.pin}`);
		} catch {
			setErrorMessage("Creating the game failed. Try again.");
		}
	}

	return (
		<main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-8 p-8">
			<header className="space-y-2">
				<h1 className="text-5xl font-bold text-center mt-1.5">Busdriver</h1>
				<p className="max-w-1xl text-sm text-zinc-500 text-center">
					Jägershot is 12
				</p>
			</header>

			<div className="absolute w-[50px] h-[50px] bg-white right-8 rounded-full flex">
				<IoPerson color="gray" size={42} className="m-auto" onClick={() => router.push("/profile")} />
			</div>

			<div className="rounded-xl bg-white py-4 px-8 mt-4 text-black shadow-sm">
				<h2 className="text-3xl font-bold">Join Game</h2>
				<p className="mt-3 mb-6 text-sm">
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

			<button
				className="bg-green-600 text-white px-4 py-3 mt-2 rounded-xl font-bold text-2xl shadow-lg shadow-green-900/60 transition-all hover:bg-green-700 active:scale-[0.98]"
				onClick={handleCreating}
			>
				Create Game
			</button>
		</main>
	);
}