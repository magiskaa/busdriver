import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    ...authTables,
    users: defineTable({
        email: v.optional(v.string()),
        username: v.optional(v.string()),
        image: v.optional(v.string()),
    }).index("by_username", ["username"]),
    stats: defineTable({
        userId: v.id("users"),
        games: v.int64(),
        lostGames: v.int64(),
        sipsRecieved: v.int64(),
        sipsGiven: v.int64(),
        drivingSips: v.int64(),
    }).index("by_userId", ["userId"]),
    games: defineTable({
        pin: v.string(),
        status: v.union(v.literal("waiting"), v.literal("active"), v.literal("finished")),
        host: v.id("users"),
        players: v.array(v.id("users")),
        ready: v.array(v.id("users")),
        deck: v.optional(v.array(v.string())),
        board: v.optional(v.array(v.string())),
        revealed: v.optional(v.array(v.number())),
        playerHands: v.optional(v.array(v.object({
            userId: v.id("users"),
            cards: v.array(v.string()),
        }))),
        sips: v.optional(v.array(v.object({
            userId: v.id("users"),
            sipsRecieved: v.int64(),
            sipsGiven: v.int64(),
        }))),
        loser: v.optional(v.object({
            userId: v.id("users"),
            drivingSips: v.int64(),
        })),
    }).index("by_pin", ["pin"]),
});