import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const get = query({
    handler: async (ctx) => {
        const reports = await ctx.db
            .query("reports")
            .order("desc")
            .take(100);

        return reports;
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
            details: {
                likes: [],
                dislikes: [],
                fixed: false,
            }
        });
    },
});

export const like = mutation({
    args: {
        userId: v.id("users"),
        reportId: v.id("reports"),
    },
    handler: async (ctx, args) => {
        const report = await ctx.db.get("reports", args.reportId);

        if (!report?.details) {
            await ctx.db.patch(args.reportId, {
                details: {
                    likes: [args.userId],
                    dislikes: [],
                    fixed: false,
                },
            });
        } else {
            const listLike = report.details.likes;
            const includesLike = listLike.includes(args.userId);

            const listDislike = report.details.dislikes;
            const includesDislike = listDislike.includes(args.userId);

            await ctx.db.patch(args.reportId, {
                details: {
                    ...report.details,
                    likes: includesLike ? listLike.filter((id) => id !== args.userId) : [...listLike, args.userId],
                    dislikes: includesDislike ? listDislike.filter((id) => id !== args.userId) : [...listDislike],
                },
            });
        }

    },
});

export const dislike = mutation({
    args: {
        userId: v.id("users"),
        reportId: v.id("reports"),
    },
    handler: async (ctx, args) => {
        const report = await ctx.db.get("reports", args.reportId);

        if (!report?.details) {
            await ctx.db.patch(args.reportId, {
                details: {
                    likes: [],
                    dislikes: [args.userId],
                    fixed: false,
                },
            });
        } else {
            const listLike = report.details.likes;
            const includesLike = listLike.includes(args.userId);

            const listDislike = report.details.dislikes;
            const includesDislike = listDislike.includes(args.userId);
    
            await ctx.db.patch(args.reportId, {
                details: {
                    ...report.details,
                    likes: includesLike ? listLike.filter((id) => id !== args.userId) : [...listLike],
                    dislikes: includesDislike ? listDislike.filter((id) => id !== args.userId) : [...listDislike, args.userId],
                },
            });
        }

    },
});

export const fixed = mutation({
    args: {
        userId: v.id("users"),
        reportId: v.id("reports"),
    },
    handler: async (ctx, args) => {
        const callerId = await getAuthUserId(ctx);
        const devId = process.env.DEV_ID;
        if (!devId || callerId !== devId) return;

        const report = await ctx.db.get("reports", args.reportId);

        if (!report?.details) {
            await ctx.db.patch(args.reportId, {
                details: {
                    likes: [],
                    dislikes: [],
                    fixed: true,
                },
            });
        } else if (report.details.fixed === true) {
            await ctx.db.patch(args.reportId, {
                details: {
                    ...report.details,
                    fixed: false,
                },
            });
        } else {
            await ctx.db.patch(args.reportId, {
                details: {
                    ...report.details,
                    fixed: true,
                },
            });
        }

    },
});
