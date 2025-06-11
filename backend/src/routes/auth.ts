import express from "express";
import bcrypt from "bcrypt";
import db from "../config/db";
import type { Request, Response } from "express";

const authRoutes = express.Router();

authRoutes.post("/register", async (req: Request, res: Response) => {
    const { username, password } = req.body;
    if (!username || !password) {
        res.status(400).json({ error: "Username and password required" });
        return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        await db.query(
            "INSERT INTO users (username, password) VALUES ($1, $2)",
            [username, hashedPassword]
        );
        res.status(201).json({ message: "User registered successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "User already exists or DB error" });
    }
});

authRoutes.post("/login", async (req, res) => {
    const { username, password } = req.body;

    const users = await db.any("SELECT * FROM users WHERE username = $1", [username]);


    if (!users) {
        res.status(401).json({ error: "Invalid credentials 1" });
        return;
    }

    const user = users[0];

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
        res.status(401).json({ error: "Invalid credentials 2" });
        return;
    }

    if (req.session) {
        req.session.user = { username: user.username };
    }

    res.json({ message: "Login successful", username: user.username });
});


authRoutes.post("/logout", (req: Request, res: Response) => {
    req.session = null;
    res.json({ message: "Logged out" });
});

authRoutes.get("/me", (req, res) => {
    if (!req.session || !req.session.user) {
        res.status(401).json({ error: "Unauthorized" });
        return;
    }

    if (!req.session.user) {
        res.status(401).json({ error: "Not logged in" });
        return;
    }
    res.json({ user: req.session.user });
});

export default authRoutes;
