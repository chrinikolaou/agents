import { useState } from "react";
import api from "../axios.ts";
import type { Chat } from "../models/Chat.ts";

export default function useChats(username?: string) {
    const [chats, setChats] = useState<Chat[] | null>(null);
    const [loading, setLoading] = useState<boolean>(false);

    async function fetchChats() {
        if (!username) return;
        setLoading(true);
        try {
            const response = await api.get(`/chat/user/${username}`);
            setChats(response.data);
        } catch (err) {
            console.error("Failed to fetch user's chats.", err);
        } finally {
            setLoading(false);
        }
    }

    return { chats, loading, fetchChats };
}
