import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getUserId = query({
    args: {},
    handler: async (ctx) => {
        return await getAuthUserId(ctx);
    },
});

export const getUser = query({
    args: {},
    handler: async (ctx) => {
        const userId = await getAuthUserId(ctx);
        if (userId === null) { return null; }
        const user = await ctx.db.get(userId);
        if (!user) return null;
        return {
            ...user,
            imageUrl: user.image ? await ctx.storage.getUrl(user.image) : null,
        };
    },
});

export const update = mutation({
    args: {
        username: v.optional(v.string()),
        image: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (userId === null) {
            throw new Error("Not authenticated");
        }

        const updates: { username?: string; image?: string } = {};
        if (args.username !== undefined) updates.username = args.username;
        if (args.image !== undefined) updates.image = args.image;

        await ctx.db.patch(userId, updates);
    },
});

export const generateUploadUrl = mutation(async (ctx) => {
    return await ctx.storage.generateUploadUrl();
});
