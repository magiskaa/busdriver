import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getStats = query({
    args: {
        userId: v.id("users")
    },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("stats")
            .withIndex("by_userId", (query) => query.eq("userId", args.userId))
            .unique();
    },
});

export const getGames = query({
    args: {
        userId: v.id("users")
    },
    handler: async (ctx, args) => {
        const games = await ctx.db
            .query("games")
            .withIndex("by_status", (query) => query.eq("status", "finished"))
            .collect();

        return games
            .filter((g) => g.players.includes(args.userId))
            .sort((a, b) => b._creationTime - a._creationTime);
    },
});
