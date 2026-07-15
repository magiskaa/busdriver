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

export const update = mutation({
    args: {
        userId: v.id("users"),
        games: v.number(),
        lostGames: v.number(),
        sipsReceived: v.number(),
        sipsGiven: v.number(),
        drivingSips: v.number(),
    },
    handler: async (ctx, args) => {
        const stats = await ctx.db
            .query("stats")
            .withIndex("by_userId", (query) => query.eq("userId", args.userId))
            .unique();

        if (!stats) {
            await ctx.db.insert("stats", {
                userId: args.userId,
                games: args.games,
                lostGames: args.lostGames,
                sipsReceived: args.sipsReceived,
                sipsGiven: args.sipsGiven,
                drivingSips: args.drivingSips,
            });
            return;
        }

        await ctx.db.patch(stats._id, {
            games: stats.games + args.games,
            lostGames: stats.lostGames + args.lostGames,
            sipsReceived: stats.sipsReceived + args.sipsReceived,
            sipsGiven: stats.sipsGiven + args.sipsGiven,
            drivingSips: stats.drivingSips + args.drivingSips,
        });
    },
});

export const getGames = query({
    args: {
        userId: v.id("users")
    },
    handler: async (ctx, args) => {
        const games = await ctx.db
            .query("games")
            .collect();

        return games
            .filter((g) => g.status === "finished" && g.players.includes(args.userId))
            .sort((a, b) => b._creationTime - a._creationTime);
    },
});
