import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { userId } from "./users";

function generatePin() {
	const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ23456789";
	let pin = "";
	for (let i = 0; i < 6; i += 1) {
		pin += chars[Math.floor(Math.random() * chars.length)];
	}
	return pin;
}

export const getGame = query({
	args: {
		pin: v.string(),
	},
	handler: async (ctx, args) => {
		return await ctx.db
			.query("games")
			.withIndex("by_pin", (query) => query.eq("pin", args.pin))
			.unique();
	},
});

export const getPlayers = query({
	args: {
		pin: v.string(),
		ids: v.array(v.id("users")),
	},
	handler: async (ctx, args) => {
		const game = await ctx.db
			.query("games")
			.withIndex("by_pin", (query) => query.eq("pin", args.pin))
			.unique();

		const players = await Promise.all(
			args.ids.map(async (id) => {
				const user = await ctx.db.get(id);
				if (!user) return null;
				
				const stats = await ctx.db
					.query("stats")
					.withIndex("by_userId", (query) => query.eq("userId", id))
					.unique();
				
				return {
					...user,
					games: stats?.games ?? 0n,
					lostGames: stats?.lostGames ?? 0n,
					ready: game?.ready.includes(id),
				};
			})
		);
		return players.filter((p) => p !== null);
	},
});

export const create = mutation({
	args: {
		userId: v.id("users"),
	},
	handler: async (ctx, args) => {
		let pin = generatePin();

		while (await ctx.db
			.query("games")
			.withIndex("by_pin", (query) => query.eq("pin", pin))
			.unique()) {
			pin = generatePin()
		}

		await ctx.db.insert("games", {
			pin,
			status: "waiting",
			host: args.userId,
			players: [args.userId],
			ready: [],
		});

		return { pin };
	},
});

export const join = mutation({
	args: {
		pin: v.string(),
		player: v.id("users"),
	},
	handler: async (ctx, args) => {
		const game = await ctx.db
			.query("games")
			.withIndex("by_pin", (query) => query.eq("pin", args.pin))
			.unique();

		if (!game) { throw new Error("Game not found."); }
		if (game.status === "finished" || game.status === "active") { throw new Error("Game is either in progress or finished.") }

		ctx.db.patch(game._id, {
			players: [...game.players, args.player],
		});
	},
});

export const ongoing = query({
	args: { 
		userId: v.id("users"),
	},
	handler: async (ctx, args) => {
		const games = await ctx.db
			.query("games")
			.filter((q) => 
				q.and(
					q.or(
						q.eq(q.field("status"), "waiting"),
						q.eq(q.field("status"), "active")
					),
				)
			)
			.collect();
		
		const game = games.find(g => g.players.includes(args.userId));
		return game ? game.pin : null;
	},
});

export const status = mutation({
	args: {
		pin: v.string(),
		status: v.union(v.literal("waiting"), v.literal("active"), v.literal("finished")),
	},
	handler: async (ctx, args) => {
		const game = await ctx.db
			.query("games")
			.withIndex("by_pin", (query) => query.eq("pin", args.pin))
			.unique();

		if (!game) { throw new Error("Game not found."); }

		ctx.db.patch(game._id, {
			status: args.status,
		});
	},
});

export const ready = mutation({
	args: {
		pin: v.string(),
		id: v.id("users"),
	},
	handler: async (ctx, args) => {
		const game = await ctx.db
			.query("games")
			.withIndex("by_pin", (query) => query.eq("pin", args.pin))
			.unique();

		if (!game) { throw new Error("Game not found."); }

		if (game.ready.includes(args.id)) {
			await ctx.db.patch(game._id, {
				ready: game.ready.filter((id) => id !== args.id),
			});
			return false;
		} else {
			await ctx.db.patch(game._id, {
				ready: [...game.ready, args.id],
			});
			return true;
		}
	},
});

export const start = mutation({
	args: {
		pin: v.string(),
	},
	handler: async (ctx, args) => {
		const game = await ctx.db
			.query("games")
			.withIndex("by_pin", (query) => query.eq("pin", args.pin))
			.unique();

		if (!game) { throw new Error("Game not found."); }

		const fullDeck = [
			"A♠", "A♣", "A♡", "A♢", "2♠", "2♣", "2♡", "2♢", "3♠", "3♣", "3♡", "3♢", "4♠", "4♣", "4♡", "4♢",
			"5♠", "5♣", "5♡", "5♢", "6♠", "6♣", "6♡", "6♢", "7♠", "7♣", "7♡", "7♢", "8♠", "8♣", "8♡", "8♢",
			"9♠", "9♣", "9♡", "9♢", "10♠", "10♣", "10♡", "10♢", "J♠", "J♣", "J♡", "J♢", "Q♠", "Q♣", "Q♡", "Q♢",
			"K♠", "K♣", "K♡", "K♢"
		];

		const shuffled = [...fullDeck];
		for (let i = shuffled.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
		}

		const playerHands = [];
		let deckIdx = 0;
		for (const userId of game.players) {
			playerHands.push({
				userId,
				cards: shuffled.slice(deckIdx, deckIdx + 5),
			});
			deckIdx += 5;
		}

		const board = shuffled.slice(deckIdx, deckIdx + 15);
		deckIdx += 15;

		const remainingDeck = shuffled.slice(deckIdx);

		await ctx.db.patch(game._id, {
			status: "active",
			deck: remainingDeck,
			board: board,
			revealed: [],
			playerHands: playerHands,
			sips: [],
		});
	},
});

export const revealCard = mutation({
	args: {
		pin: v.string(),
		index: v.number(),
	},
	handler: async (ctx, args) => {
		const game = await ctx.db
			.query("games")
			.withIndex("by_pin", (query) => query.eq("pin", args.pin))
			.unique();

		if (!game || !game.board || !game.revealed) return;

		if (game.revealed.includes(args.index)) return;

		const rowOfIndex = (idx: number) => {
			if (idx >= 10) return 5;
			if (idx >= 6) return 4;
			if (idx >= 3) return 3;
			if (idx >= 1) return 2;
			return 1;
		};

		const indexesOfRow = (row: number) => {
			if (row === 5) { return [10, 11, 12, 13, 14]; }
			if (row === 4) { return [6, 7, 8, 9]; }
			if (row === 3) { return [3, 4, 5]; }
			if (row === 2) { return [1, 2]; }
			return [0];
		};

		const targetRow = rowOfIndex(args.index);
		if (targetRow < 5) {
			const rowBelow = targetRow + 1;
			const cardsBelow = indexesOfRow(rowBelow);
			const allRevealedBelow = cardsBelow.every(idx => game.revealed?.includes(idx));
			if (!allRevealedBelow) {
				throw new Error(`Must reveal a card from row ${rowBelow} first.`);
			}
		}

		await ctx.db.patch(game._id, {
			revealed: [...game.revealed, args.index],
		});
	},
});

export const playCard = mutation({
	args: {
		pin: v.string(),
		userId: v.id("users"),
		card: v.string(),
	},
	handler: async (ctx, args) => {
		const game = await ctx.db
			.query("games")
			.withIndex("by_pin", (query) => query.eq("pin", args.pin))
			.unique();

		if (!game || !game.board || !game.revealed || !game.playerHands) return;

		const getRank = (c: string) => c.replace(/[♠♣♡♢]/g, "");
		const playerCardRank = getRank(args.card);

		const lastRevealedIdx = game.revealed[game.revealed.length - 1];
		if (lastRevealedIdx === undefined) throw new Error("No cards revealed on board yet.");

		const rowOfIndex = (idx: number) => {
			if (idx >= 10) return 5;
			if (idx >= 6) return 4;
			if (idx >= 3) return 3;
			if (idx >= 1) return 2;
			return 1;
		};

		const activeRow = rowOfIndex(lastRevealedIdx);

		const isRankOnActiveRow = (rank: string) => {
			return game.revealed?.some(idx => {
				return rowOfIndex(idx) === activeRow && getRank(game.board![idx]) === rank;
			});
		};

		if (!isRankOnActiveRow(playerCardRank)) {
			throw new Error("Card rank does not match any revealed card on the current row.");
		}

		const newHands = game.playerHands.map(hand => {
			if (hand.userId === args.userId) {
				const cardIdx = hand.cards.indexOf(args.card);
				if (cardIdx > -1) {
					const newCards = [...hand.cards];
					newCards.splice(cardIdx, 1);
					return { ...hand, cards: newCards };
				}
			}
			return hand;
		});

		await ctx.db.patch(game._id, {
			playerHands: newHands,
		});
	},
});

export const distributeSips = mutation({
    args: {
		pin: v.string(),
        giverId: v.id("users"),
		total: v.int64(),
        assignments: v.array(v.object({
            userId: v.id("users"),
            sips: v.number(),
        })),
    },
    handler: async (ctx, args) => {
		const game = await ctx.db
			.query("games")
			.withIndex("by_pin", (query) => query.eq("pin", args.pin))
			.unique();
        
		if (!game || !game.sips) return;

		const sips = [];
        for (const assignment of args.assignments) {
			const userSips = game?.sips?.find((entry) => entry.userId === assignment.userId);

			if (assignment.userId === args.giverId) {
				sips.push({
					userId: assignment.userId,
					sipsRecieved: (userSips?.sipsRecieved ?? 0n) + BigInt(assignment.sips),
					sipsGiven: (userSips?.sipsGiven ?? 0n) + BigInt(args.total),
				});
			} else {
				sips.push({
					userId: assignment.userId,
					sipsRecieved: (userSips?.sipsRecieved ?? 0n) + BigInt(assignment.sips),
					sipsGiven: userSips?.sipsGiven ?? 0n,
				});
			}
        }
		
		await ctx.db.patch(game._id, {
			sips,
		});
	},
});
