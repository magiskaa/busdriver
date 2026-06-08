import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

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
		ids: v.array(v.id("users")) 
	},
	handler: async (ctx, args) => {
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
