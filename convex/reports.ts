import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const get = query({
    handler: async (ctx) => {
        const reports = await ctx.db
            .query("reports")
            .collect();

        return reports.reverse();
    },
});

export const add = mutation({
    args: {
        userId: v.id("users"),
        text: v.string(),
    },
    handler: async (ctx, args) => {
        await ctx.db.insert("reports", {
            userId: args.userId,
            text: args.text,
        });
    },
});