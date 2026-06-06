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
    games: defineTable({
        pin: v.string(),
        status: v.union(v.literal("active"), v.literal("finished")),
    }).index("by_pin", ["pin"]),
});