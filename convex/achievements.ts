import { getAuthUserId } from "@convex-dev/auth/server";
import { query } from "./_generated/server";
import { v } from "convex/values";

export const achievementCategories = {
	gamesPlayed: {
		label: "Games Played",
		metric: "games",
		milestones: [
			{ name: "gp10", required: 10, text: "10 Games Played", color: "#e63946", colorName: "Crimson" },
			{ name: "gp25", required: 25, text: "25 Games Played", color: "#457b9d", colorName: "Steel Blue" },
			{ name: "gp50", required: 50, text: "50 Games Played", color: "#2a9d8f", colorName: "Teal" },
			{ name: "gp100", required: 100, text: "100 Games Played", color: "", colorName: "" },
			{ name: "gp200", required: 200, text: "200 Games Played", color: "", colorName: "" },
			{ name: "gp500", required: 500, text: "500 Games Played", color: "", colorName: "" },
			{ name: "gp1000", required: 1000, text: "1000 Games Played", color: "", colorName: "" },
		],
	},
	gamesLost: {
		label: "Games Lost",
		metric: "lostGames",
		milestones: [
			{ name: "gl1", required: 1, text: "First Loss", color: "#f4a261", colorName: "Sandy Orange" },
			{ name: "gl5", required: 5, text: "5 Games Lost", color: "#6d597a", colorName: "Dusty Plum" },
			{ name: "gl10", required: 10, text: "10 Games Lost", color: "#00a6a6", colorName: "Turquoise" },
			{ name: "gl25", required: 25, text: "25 Games Lost", color: "", colorName: "" },
			{ name: "gl50", required: 50, text: "50 Games Lost", color: "", colorName: "" },
			{ name: "gl100", required: 100, text: "100 Games Lost", color: "", colorName: "" },
			{ name: "gl250", required: 250, text: "250 Games Lost", color: "", colorName: "" },
		],
	},
	losingStreak: {
		label: "Losing Streak",
		metric: "currentLosingStreak",
		milestones: [
			{ name: "ls2", required: 2, text: "2 Game Losing Streak", color: "#bc6c25", colorName: "Burnt Orange" },
			{ name: "ls3", required: 3, text: "3 Game Losing Streak", color: "#5e60ce", colorName: "Indigo" },
			{ name: "ls4", required: 4, text: "4 Game Losing Streak", color: "#588157", colorName: "Forest Green" },
			{ name: "ls5", required: 5, text: "5 Game Losing Streak", color: "", colorName: "" },
			{ name: "ls6", required: 6, text: "6 Game Losing Streak", color: "", colorName: "" },
			{ name: "ls7", required: 7, text: "7 Game Losing Streak", color: "", colorName: "" },
			{ name: "ls8", required: 8, text: "8 Game Losing Streak", color: "", colorName: "" },
		],
	},
	sipsGiven: {
		label: "Sips Given",
		metric: "sipsGiven",
		milestones: [
			{ name: "sg100", required: 100, text: "100 Sips Given", color: "#e76f51", colorName: "Coral" },
			{ name: "sg250", required: 250, text: "250 Sips Given", color: "#4361ee", colorName: "Royal Blue" },
			{ name: "sg1000", required: 1000, text: "1000 Sips Given", color: "#8ac926", colorName: "Lime" },
			{ name: "sg2500", required: 2500, text: "2500 Sips Given", color: "", colorName: "" },
			{ name: "sg10000", required: 10000, text: "10000 Sips Given", color: "", colorName: "" },
			{ name: "sg25000", required: 25000, text: "25000 Sips Given", color: "", colorName: "" },
			{ name: "sg50000", required: 50000, text: "50000 Sips Given", color: "", colorName: "" },
		],
	},
	sipsReceived: {
		label: "Sips Received",
		metric: "sipsReceived",
		milestones: [
			{ name: "sr100", required: 100, text: "100 Sips Received", color: "#ff006e", colorName: "Hot Pink" },
			{ name: "sr250", required: 250, text: "250 Sips Received", color: "#8338ec", colorName: "Violet" },
			{ name: "sr1000", required: 1000, text: "1000 Sips Received", color: "#06d6a0", colorName: "Mint" },
			{ name: "sr2500", required: 2500, text: "2500 Sips Received", color: "", colorName: "" },
			{ name: "sr10000", required: 10000, text: "10000 Sips Received", color: "", colorName: "" },
			{ name: "sr25000", required: 25000, text: "25000 Sips Received", color: "", colorName: "" },
			{ name: "sr50000", required: 50000, text: "50000 Sips Received", color: "", colorName: "" },
		],
	},
	drivingRecord: {
		label: "Driving Record",
		metric: "drivingRecord",
		milestones: [
			{ name: "dr20", required: 20, text: "20 Driving Record", color: "#d00000", colorName: "Dark Red" },
			{ name: "dr40", required: 40, text: "40 Driving Record", color: "#7209b7", colorName: "Purple" },
			{ name: "dr60", required: 60, text: "60 Driving Record", color: "#007f5f", colorName: "Emerald" },
			{ name: "dr70", required: 70, text: "70 Driving Record", color: "", colorName: "" },
			{ name: "dr80", required: 80, text: "80 Driving Record", color: "", colorName: "" },
			{ name: "dr90", required: 90, text: "90 Driving Record", color: "", colorName: "" },
			{ name: "dr100", required: 100, text: "100 Driving Record", color: "", colorName: "" },
		],
	},
} as const;

export const getAchievements = query({
	args: {
		userId: v.optional(v.id("users")),
	},
	handler: async (ctx, args) => {
		const userId = args.userId ?? await getAuthUserId(ctx);
		if (!userId) return null;

		const record = await ctx.db
			.query("achievements")
			.withIndex("by_userId", (q) => q.eq("userId", userId))
			.unique();
		const earned = record?.achieved ?? [];

		const categories = Object.entries(achievementCategories).map(([category, definition]) => {
			const categoryEarned = earned
				.filter((entry) => entry.category === category)
				.map((entry) => {
					const milestone = definition.milestones.find((item) => item.name === entry.name);
					const rank = definition.milestones.findIndex((item) => item.name === entry.name) + 1;
					return milestone ? { ...entry, ...milestone, category, rank } : null;
				})
				.filter((entry) => entry !== null)
				.sort((a, b) => b.rank - a.rank);

			return {
				category,
				label: definition.label,
				best: categoryEarned[0] ?? null,
				achievements: definition.milestones.map((milestone, index) => ({
					...milestone,
					rank: index + 1,
					earned: categoryEarned.some((entry) => entry.name === milestone.name),
				})),
			};
		});

		return categories;
	},
});
