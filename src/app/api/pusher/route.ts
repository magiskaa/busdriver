import { pusherServer } from "@/lib/pusherServer";

const allowedEmotes = [
    "😂",
    "😀",
    "😎",
    "🥱",
    "🤡",
    "😈",
    "🍺",
    "🔥",
    "❤️",
    "👏",
    "💀",
];

export async function POST(request: Request) {
    try {
        const body = await request.json();

        const {
            pin,
            userId,
            emoji,
        }: {
            pin?: string;
            userId?: string;
            emoji?: string;
        } = body;

        if (!pin || !userId || !emoji) {
            return Response.json(
                { error: "Missing pin, userId, or emoji" },
                { status: 400 }
            );
        }

        if (!allowedEmotes.includes(emoji)) {
            return Response.json(
                { error: "Invalid emote" },
                { status: 400 }
            );
        }

        await pusherServer.trigger(
            `game-${pin}-emotes`,
            "game-emote",
            {
                id: crypto.randomUUID(),
                userId,
                emoji,
            }
        );

        return Response.json({ success: true });
    } catch {
        return Response.json(
            { error: "Failed to publish emote" },
            { status: 500 }
        );
    }
}