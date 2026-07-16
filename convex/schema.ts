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
        games: v.number(),
        lostGames: v.number(),
        sipsReceived: v.number(),
        sipsGiven: v.number(),
        drivingSips: v.number(),
    }).index("by_userId", ["userId"]),
    reports: defineTable({
        userId: v.id("users"),
        text: v.string(),
    }).index("by_userId", ["userId"]),
    games: defineTable({
        pin: v.string(),
        status: v.union(v.literal("waiting"), v.literal("active"), v.literal("tied"), v.literal("driving"), v.literal("finished")),
        host: v.id("users"),
        players: v.array(v.id("users")),
        base: v.object({
            ready: v.array(v.id("users")),
            cardCount: v.optional(v.number()),
            deck: v.optional(v.array(v.string())),
            board: v.optional(v.array(v.string())),
            revealed: v.optional(v.array(v.number())),
            playerHands: v.optional(v.array(v.object({
                userId: v.id("users"),
                cards: v.array(v.string()),
                counter: v.optional(v.number()),
            }))),
            sips: v.optional(v.array(v.object({
                userId: v.id("users"),
                sipsReceived: v.number(),
                sipsGiven: v.number(),
            }))),
        }),
        tie: v.optional(v.object({
            isTied: v.boolean(),
            cards: v.array(v.string()),
            picked: v.array(v.number()),
            tiedPlayers: v.array(v.object({
                userId: v.id("users"),
                cardPicked: v.optional(v.number()),
                revealed: v.optional(v.boolean()),
            })),
        })),
        drive: v.object({
            ready: v.array(v.id("users")),
            loser: v.optional(v.id("users")),
            sips: v.optional(v.number()),
            deck: v.optional(v.array(v.string())),
            board: v.optional(v.array(v.string())),
            revealed: v.optional(v.array(v.number())),
            dealNewRoundAt: v.optional(v.number()),
            lastRevealedIndex: v.optional(v.number()),
            finishAt: v.optional(v.number()),
        }),
    }).index("by_pin", ["pin"]),
});