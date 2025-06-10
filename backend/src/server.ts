import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import db from "./config/db";
import agentRoutes from "./routes/agents";
import orderRoutes from "./routes/orders";
import chatRoutes from "./routes/chat";
import session from "cookie-session";
import authRoutes from "./routes/auth";
import messageRoutes from "./routes/messages";

dotenv.config();
const app = express();
const port = process.env.PORT || 5000;

const version = 1;
const path = `/api/v${version}`;
const allowedOrigin = "http://localhost:5173";

app.use(express.json());


app.use(cors({
    origin: allowedOrigin,
    credentials: true,
}));
app.use(
    session({
        name: "session",
        keys: [""],
        maxAge: 24 * 60 * 60 * 1000,
    })
);

app.use(`${path}/agents`, agentRoutes);
app.use(`${path}/orders`, orderRoutes);
app.use(`${path}/chat`, chatRoutes);
app.use(`${path}/messages`, messageRoutes);
app.use(`${path}/auth`, authRoutes);

// Συνδεση στη βάση δεδομένων
db.connect()
    .then(()=>console.log("Connected to the PostgreSQL database successfully!"))
    .catch((e)=>console.log("Failed to establish a connection to the PostgreSQL database.", e));


app.listen(port, () => console.log(`The server is running on localhost:${port}`));
