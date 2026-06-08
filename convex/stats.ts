import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const get = query({
    args: {
        userId: v.id("users")
    },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("stats")
            .filter((query) => query.eq(query.field("userId"), args.userId))
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
            .filter((query) => query.eq(query.field("userId"), args.userId))
            .unique();

        if (!statsDoc) { throw new Error("Stats not found."); }

        await ctx.db.patch(statsDoc._id, {
            games: statsDoc.games + args.games,
            lostGames: statsDoc.lostGames + args.lostGames,
            sipsRecieved: statsDoc.sipsRecieved + args.sipsRecieved,
            sipsGiven: statsDoc.sipsGiven + args.sipsGiven,
            drivingSips: statsDoc.drivingSips + args.drivingSips,
        });
    },
});
