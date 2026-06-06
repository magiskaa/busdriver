"use client";

import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
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
		<main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-6 p-8">
			<header className="space-y-2">
				<h1 className="text-4xl font-bold text-center mt-1.5">Bussikuski</h1>
				<p className="max-w-1xl text-sm text-zinc-500 text-center">
					Jägershotti on 12
				</p>
			</header>

			<div className="absolute w-[50] h-[50] bg-white right-8 rounded-full">
				<IoPerson color="gray" size={45} className="m-auto" onClick={() => router.push("/profile")} />
			</div>

			<div className="rounded-2xl bg-white py-4 px-8 mt-4 text-black shadow-sm">
				<h2 className="text-2xl font-semibold">Join Game</h2>
				<p className="mt-1 text-sm">
					Join a game that your friend created by entering it&apos;s PIN code, or create a new game below.
				</p>

				<form className="mt-4 flex flex-col gap-3 sm:flex-row" onSubmit={handleJoining}>
					<input
						className="min-w-0 flex-1 rounded-xl border border-zinc-300 px-4 py-3 outline-none transition focus:border-zinc-900"
						name="text"
						placeholder="PIN code"
						value={pin}
						onChange={(event) => setPin(event.target.value)}
						disabled={isJoining}
					/>
					<button
						className="rounded-xl bg-black py-2 px-10 font-semibold text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:bg-zinc-400"
						type="submit"
						disabled={isJoining}
					>
						{isJoining ? "Joining..." : "Join"}
					</button>
				</form>

				{errorMessage && <p className="mt-3 text-sm text-red-600">{errorMessage}</p>}
			</div>

			<button
				className="w-full rounded-2xl bg-white py-4 px-8 text-black text-2xl font-semibold transition hover:bg-zinc-300"
				onClick={handleCreating}
			>
				Create Game
			</button>
		</main>
	);
}