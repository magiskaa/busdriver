import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    games: defineTable({
        pin: v.string(),
        status: v.union(v.literal("active"), v.literal("finished")),
    }).index("by_pin", ["pin"]),
});