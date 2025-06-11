import express, { Router } from "express";
import db from "../config/db";

const router = Router();

router.get("/", async (req, res) => {
    try {
        const orders = await db.any(
            "SELECT orders.id, agents.name AS agent_name, product, quantity, status, order_date FROM orders LEFT JOIN agents ON orders.agent_id = agents.id"
        );
        res.json(orders);
    } catch (error) {
        console.error("Error fetching orders:", error);
        res.status(500).json({ error: "Server Internal Error" });
    }
});

router.get("/user/:username", async (req, res) => {
    const { username } = req.params;
    console.log(username);
    try {
        const orders = await db.any(
            `SELECT 
                orders.id, 
                agent_name, 
                product, 
                quantity, 
                status, 
                order_date 
            FROM orders 
            WHERE orders.username = $1`,
            [username]
        );

        res.json(orders);
    } catch (error) {
        console.error("Error fetching orders for user:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});


router.post("/", async (req, res) => {
    try {
        let { agent_id, product, quantity, username } = req.body;

        if (!product || !quantity) {
            res.status(400).json({ error: "Απαιτείται ένα προϊόν και μία ποσότητα." });
            return;
        }

        if (!agent_id) {
            const availableAgent = await db.oneOrNone("SELECT id FROM agents WHERE availability = TRUE LIMIT 1");
            if (!availableAgent) {
                res.status(400).json({ error: "Δεν υπάρχουν διαθέσιμοι agents!" });
                return;
            }
            agent_id = availableAgent.id;
        }

        const newOrder = await db.one(
            "INSERT INTO orders (agent_id, product, quantity, status, username) VALUES ($1, $2, $3, 'pending', $4) RETURNING *",
            [agent_id, product, quantity, username]
        );

        await db.none("UPDATE agents SET availability = FALSE WHERE id = $1", [agent_id]);

        res.status(201).json(newOrder);
    } catch (error) {
        console.error("Error creating order:", error);
        res.status(500).json({ error: "Server Internal Error" });
    }
});

router.put("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!status) {
            res.status(400).json({ error: "Το status της παραγγελίας είναι υποχρεωτικό!" });
            return;
        }

        const updatedOrder = await db.one(
            "UPDATE orders SET status = $1 WHERE id = $2 RETURNING *",
            [status, id]
        );

        if (status === "completed" || status === "canceled") {
            await db.none("UPDATE agents SET availability = TRUE WHERE id = $1", [updatedOrder.agent_id]);
        }

        res.json(updatedOrder);
    } catch (error) {
        console.error("Error updating order:", error);
        res.status(500).json({ error: "Server Internal Error" });
    }
});

router.delete("/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const order = await db.oneOrNone("SELECT agent_id FROM orders WHERE id = $1", [id]);

        if (order) {
            await db.none("UPDATE agents SET availability = TRUE WHERE id = $1", [order.agent_id]);
        }

        await db.none("DELETE FROM orders WHERE id = $1", [id]);

        res.json({ message: `Order with ID ${id} deleted successfully` });
    } catch (error) {
        console.error("Error deleting order:", error);
        res.status(500).json({ error: "Server Internal Error" });
    }
});

export default router;