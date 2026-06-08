import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const get = query({
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
        games: v.int64(),
        lostGames: v.int64(),
        sipsRecieved: v.int64(),
        sipsGiven: v.int64(),
        drivingSips: v.int64(),
    },
    handler: async (ctx, args) => {
        const statsDoc = await ctx.db
            .query("stats")
            .withIndex("by_userId", (query) => query.eq("userId", args.userId))
            .unique();

        if (!statsDoc) {
            await ctx.db.insert("stats", {
                userId: args.userId,
                games: args.games,
                lostGames: args.lostGames,
                sipsRecieved: args.sipsRecieved,
                sipsGiven: args.sipsGiven,
                drivingSips: args.drivingSips,
            });
            return;
        }

        await ctx.db.patch(statsDoc._id, {
            games: statsDoc.games + args.games,
            lostGames: statsDoc.lostGames + args.lostGames,
            sipsRecieved: statsDoc.sipsRecieved + args.sipsRecieved,
            sipsGiven: statsDoc.sipsGiven + args.sipsGiven,
            drivingSips: statsDoc.drivingSips + args.drivingSips,
        });
    },
});
