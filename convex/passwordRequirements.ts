import { ConvexError } from "convex/values";

export function validatePasswordRequirements(password: string) {
    if (password.length < 2) {
        throw new ConvexError(
            "Password must be at least 2 characters."
        );
    }
}
