import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getCardColors = query({
    args: {
        userId: v.id("users")
    },
    handler: async (ctx, args) => {
        const cards = await ctx.db
            .query("cards")
            .withIndex("by_userId", (q) => q.eq("userId", args.userId))
            .unique();

        return {
            backColor: cards?.backColor ?? "bg-blue-600",
            faceColor: cards?.faceColor ?? "bg-white",
        };
    },
});

export const getCards = mutation({
    args: {
        userId: v.id("users")
    },
    handler: async (ctx, args) => {
        const cards = await ctx.db
            .query("cards")
            .withIndex("by_userId", (query) => query.eq("userId", args.userId))
            .unique();

        if (!cards) {
            await ctx.db.insert("cards", {
                userId: args.userId,
                backColor: "bg-blue-600",
                faceColor: "bg-white",
            });

            return {
                userId: args.userId,
                backColor: "bg-blue-600",
                faceColor: "bg-white",
            };
        } else return cards;
    },
});

export const updateCards = mutation({
    args: {
        userId: v.id("users"),
        backColor: v.string(),
        faceColor: v.string(),
    },
    handler: async (ctx, args) => {
        const cards = await ctx.db
            .query("cards")
            .withIndex("by_userId", (q) => q.eq("userId", args.userId))
            .unique();

        if (!cards) {
            await ctx.db.insert("cards", {
                userId: args.userId,
                backColor: args.backColor,
                faceColor: args.faceColor,
            });
            return;
        }

        await ctx.db.patch(cards._id, {
            backColor: args.backColor,
            faceColor: args.faceColor,
        });
    },
});