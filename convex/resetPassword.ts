import { ConvexCredentials } from "@convex-dev/auth/providers/ConvexCredentials";
import { ConvexCredentialsConfig, modifyAccountCredentials } from "@convex-dev/auth/server";
import { ConvexError } from "convex/values";
import { internal } from "./_generated/api";
import { DataModel } from "./_generated/dataModel";
import { validatePasswordRequirements } from "./passwordRequirements";

export const ResetPassword: ConvexCredentialsConfig = ConvexCredentials<DataModel>({
    id: "reset-password",
    authorize: async (params, ctx) => {
        const email = params.email as string;
        const username = params.username as string;
        const newPassword = params.newPassword as string;

        if (!email || !username || !newPassword) {
            throw new ConvexError("Missing fields.");
        }
        
        validatePasswordRequirements(newPassword);

        const user = await ctx.runQuery(internal.users.getByEmail, { email });

        if (!user || user.username !== username) {
            throw new ConvexError("No matching account found.");
        }

        await modifyAccountCredentials(ctx, {
            provider: "password",
            account: { id: email, secret: newPassword },
        });

        return { userId: user._id };
    },
});