"use client";

import { useCallback, useEffect, useState } from "react";
import Pusher from "pusher-js";

export type GameEmote = {
    id: string;
    userId: string;
    emoji: string;
};

export function useGameEmotes(
    pin: string,
    currentUserId?: string
) {
    const [emotes, setEmotes] = useState<GameEmote[]>([]);

    useEffect(() => {
        if (!pin) {
            return;
        }

        const pusher = new Pusher(
            process.env.NEXT_PUBLIC_PUSHER_KEY!,
            {
                cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
                forceTLS: true,
            }
        );

        const channel = pusher.subscribe(`game-${pin}-emotes`);

        const handleEmote = (emote: GameEmote) => {
            setEmotes((current) => [...current, emote]);

            window.setTimeout(() => {
                setEmotes((current) =>
                    current.filter((item) => item.id !== emote.id)
                );
            }, 10000);
        };

        channel.bind("game-emote", handleEmote);

        return () => {
            channel.unbind("game-emote", handleEmote);
            pusher.unsubscribe(`game-${pin}-emotes`);
            pusher.disconnect();
        };
    }, [pin]);

    const sendEmote = useCallback(
        async (emoji: string) => {
            if (!currentUserId) {
                return;
            }

            const response = await fetch("/api/pusher", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    pin,
                    userId: currentUserId,
                    emoji,
                }),
            });

            if (!response.ok) {
                console.error("Failed to send emote", await response.text());
            }
        },
        [pin, currentUserId]
    );

    return {
        emotes,
        sendEmote,
    };
}