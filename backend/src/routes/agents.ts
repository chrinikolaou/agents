import express, { Router } from "express";
import db from "../config/db";

const router = Router();

router.post("/", async (req, res) => {
    try {
        const { name, role } = req.body;

        if (!name || !role) {
            res.status(400).json({ error: "Απαιτείται ένα όνομα και ένας ρόλος." });
            return;
        }

        const newAgent = await db.one(
            "INSERT INTO agents (name, role, availability) VALUES ($1, $2, TRUE) RETURNING *",
            [name, role]
        );

        res.status(201).json(newAgent);
    } catch (error) {
        console.error("Error creating the agent:", error);
        res.status(500).json({ error: "Server Internal Error" });
    }
});

router.get("/available", async (req, res) => {
    try {
        const availableAgents = await db.any("SELECT * FROM agents WHERE availability = TRUE ORDER BY created_at DESC");
        res.json(availableAgents);
    } catch (error) {
        console.error("Error fetching available agents:", error);
        res.status(500).json({ error: "Server Internal Error" });
    }
});

router.put("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { name, role, availability } = req.body;

        if (!name || !role || availability === undefined) {
            res.status(400).json({ error: "Απαιτείται ένα όνομα, ρόλος και διαθεσιμότητα!" });
            return;
        }

        const updatedAgent = await db.one(
            "UPDATE agents SET name = $1, role = $2, availability = $3 WHERE id = $4 RETURNING *",
            [name, role, availability, id]
        );

        res.json(updatedAgent);
    } catch (error) {
        console.error("Error updating agent:", error);
        res.status(500).json({ error: "Server Internal Error" });
    }
});

router.delete("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        await db.none("DELETE FROM agents WHERE id = $1", [id]);
        res.json({ message: `Agent ${id} has been deleted successfully.` });
    } catch (error) {
        console.error("Error deleting agent:", error);
        res.status(500).json({ error: "Server Internal Error" });
    }
});

export default router;