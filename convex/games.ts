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

export const create = mutation({
	args: {},
	handler: async (ctx) => {
		let pin = generatePin();

		while (await ctx.db
			.query("games")
			.withIndex("by_pin", (query) => query.eq("pin", pin))
			.unique()) {
			pin = generatePin()
		}

		await ctx.db.insert("games", {
			pin,
			status: "active",
		});

		return { pin };
	},
});

export const join = mutation({
	args: {
		pin: v.string()
	},
	handler: async (ctx, args) => {
		const game = await ctx.db
			.query("games")
			.withIndex("by_pin", (query) => query.eq("pin", args.pin))
			.unique();

		if (!game) { throw new Error("Game not found."); }

		return { pin: game.pin };
	}
})