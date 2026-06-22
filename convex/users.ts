import { getAuthUserId } from "@convex-dev/auth/server";
import { query } from "./_generated/server";

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
        return await ctx.db.get(userId);
    },
});
