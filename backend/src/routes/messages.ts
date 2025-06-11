import { Router } from "express";
import db from "../config/db";

const router = Router();

// Δημιουργία νέου μηνύματος
router.post("/", async (req, res) => {
    const { chat_id, text, sender } = req.body;

    if (!chat_id || !text) {
        res.status(400).json({ error: "chat_id, text and sender are required." });
        return;
    }

    try {
        const newMessage = await db.one(
            `INSERT INTO messages (chat_id, text, sender, created_at)
             VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
             RETURNING *`,
            [chat_id, text, sender]
        );
        res.status(201).json(newMessage);
    } catch (error) {
        console.error("Error creating message:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Λήψη όλων των μηνυμάτων ενός chat
router.get("/:chat_id", async (req, res) => {
    const { chat_id } = req.params;
    try {
        const messages = await db.any(
            `SELECT * FROM messages
             WHERE chat_id = $1
             ORDER BY created_at ASC`,
            [chat_id]
        );
        res.json(messages);
    } catch (error) {
        console.error("Error fetching messages:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

export default router;
