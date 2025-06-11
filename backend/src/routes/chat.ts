import { Router } from "express";
import db from "../config/db";
import {ChatGoogleGenerativeAI} from "@langchain/google-genai";
import {ChatMessageHistory} from "langchain/memory";
import {AIMessage, HumanMessage, SystemMessage} from "@langchain/core/messages";
import * as repl from "node:repl";

const router = Router();

function cleanJsonString(text: string): string {
    return text.trim()
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/```$/, '')
        .trim();
}


const masterAgentModel = new ChatGoogleGenerativeAI({
    model: "gemini-2.0-flash-lite",
    temperature: 0.6,
    apiKey: process.env.GEMINI_API_KEY,
    maxOutputTokens: 500,
});

const orderAgentModel = new ChatGoogleGenerativeAI({
    model: "gemini-2.0-flash-lite",
    temperature: 0.6,
    apiKey: process.env.GEMINI_API_KEY,
    maxOutputTokens: 500,
});

const listOrdersAgentModel = new ChatGoogleGenerativeAI({
    model: "gemini-2.0-flash-lite",
    temperature: 0.6,
    apiKey: process.env.GEMINI_API_KEY,
    maxOutputTokens: 500,
});

const complaintsAgentModel = new ChatGoogleGenerativeAI({
    model: "gemini-2.0-flash-lite",
    temperature: 0.6,
    apiKey: process.env.GEMINI_API_KEY,
    maxOutputTokens: 500,
});

const listComplaintsAgentModel = new ChatGoogleGenerativeAI({
    model: "gemini-2.0-flash-lite",
    temperature: 0.6,
    apiKey: process.env.GEMINI_API_KEY,
    maxOutputTokens: 500,
});

async function handleComplaintAgent(history: ChatMessageHistory, userMessage: string, username: string) {
    const systemPrompt = new SystemMessage(
        `Είσαι βοηθός στον οποίο ο χρήστης σου λέει το παράπονο του σχετικά με τις παραγγελίες και έχεις μνήμη της συνομιλίας. Αν δεν έχεις στη μνήμη σου τα παράπονα, τότε πρέπει να τα ζητήσεις τότε απάντα κανονικά και ζήτα ποια είναι. 
Αν θέλει να κάνει παράπονο, πρέπει να τον ρωτήσεις ποιο είναι το παράπονο. Το παράπονο πρέπει να σχετίζεται με τις παραγγελίες, εάν δεν σχετίζεται το παράπονο με τις παραγγελίες πες του ότι δεν μπορείς να καταχωρίσεις άσχετα παράπονα. Το παράπονο που θα σου πει πρέπει να απαντήσεις στο JSON αυτούσια!
Όταν σου πει το παράπονο του, απαντάς μόνο με JSON: 
{ "agent_name": "complaintAgent", "username": "${username}", "complaint": "<το παράπονο του χρήστη>" }`
    );

    const humanPrompt = new HumanMessage(userMessage);
    await history.addMessage(humanPrompt);

    const response = await complaintsAgentModel.call([systemPrompt, ...await history.getMessages()]);

    const replyText =
        typeof response.content === "string"
            ? response.content
            : response.content.map((p) => ("text" in p ? p.text : "")).join("");

    console.log("replyText:", replyText);

    try {
        const cleaned = cleanJsonString(replyText);
        const data = JSON.parse(cleaned);
        console.log("parsed data:", data);

        await db.query(
            `INSERT INTO complaints (agent_name, username, complaint) VALUES ($1, $2, $3)`,
            ["complaintsAgent", data.username, data.complaint]
        );

        return `Το παράπονο καταχωρήθηκε. ${data.complaint}`;
    } catch (error) {
        console.error("Error:", error);
        return replyText;
    }
}

async function handleListComplaintsAgent(userMessage: string, username: string) {
    const complaints = await db.any("SELECT * FROM complaints WHERE username = $1 ORDER BY created_at DESC", [username]);

    if (complaints.length === 0) {
        return "Δεν έχεις καταχωρημένες παραγγελίες.";
    }

    const complaintsList = complaints.map((complaint, index) => {
        return `#${index + 1}
- Παράπονο: ${complaint.complaint}
- Ημερομηνία: ${new Date(complaint.created_at).toLocaleString("el-GR")}
`;
    }).join("\n");

    const systemPrompt = new SystemMessage(
        `Είσαι βοηθός που δείχνεις τα παράπονα που εχει κάνει ο χρήστης στον χρήστη. Τα παράπονα είναι τα εξής: ${complaintsList}`
    );

    const humanPrompt = new HumanMessage(userMessage);

    const response = await listComplaintsAgentModel.call([systemPrompt, humanPrompt]);

    return typeof response.content === "string"
        ? response.content
        : "Δεν βρέθηκε κατάλληλη απάντηση για τα παράπονα.";
}

async function handleOrderAgent(history: ChatMessageHistory, userMessage: string, username: string) {
    const systemPrompt = new SystemMessage(
        `Είσαι βοηθός παραγγελιών. Φυσικά μπορείς να βοηθήσεις τον χρήστη στα ερωτήματα περί παραγγελίας και έχεις μνήμη της συνομιλίας. Αν μιλήσει για οτιδηποτε άλλο, με ευγενικό τρόπο απάντα ότι μπορείς να βοηθήσεις μόνο να του δείξεις τις παραγγελίες του ή να παραγγείλει ένα προιόν δίνοντας σου το προιόν και την ποσότητα. Όταν σου δώσει ο χρήστης αυτά τα δεδομένα και είναι σωστά τότε μόνο απάντα με JSON: { product: string, quantity: αριθμός, username: ${username}, status: Ολοκληρώθηκε}.`
    );
    await history.addMessage(new HumanMessage(userMessage));

    const response = await orderAgentModel.call([systemPrompt, ...await history.getMessages()]);
    const replyText =
        typeof response.content === "string"
            ? response.content
            : response.content.map((p) => ("text" in p ? p.text : "")).join("");

    console.log(cleanJsonString(replyText));
    try {
        const orderData = JSON.parse(cleanJsonString(replyText));

        await db.query(
            `INSERT INTO orders (agent_name, username, product, quantity, status) VALUES ($1, $2, $3, $4, $5)`,
            ["orderAgent", username, orderData.product, orderData.quantity, orderData.status]
        );

        return `Παραγγελία καταχωρήθηκε: Προϊόν ${orderData.product}, Ποσότητα ${orderData.quantity}`;
    } catch(error) {
        return replyText;
    }
}

async function handleListOrdersAgent(userMessage: string, username: string) {
    const orders = await db.any("SELECT * FROM orders WHERE username = $1 ORDER BY order_date DESC", [username]);

    if (orders.length === 0) {
        return "Δεν έχεις καταχωρημένες παραγγελίες.";
    }

    const ordersList = orders.map((order, index) => {
        return `#${index + 1}
- Προϊόν: ${order.product}
- Ποσότητα: ${order.quantity}
- Κατάσταση: ${order.status}
- Ημερομηνία: ${new Date(order.order_date).toLocaleString("el-GR")}
`;
    }).join("\n");

    const systemPrompt = new SystemMessage(
        `Είσαι βοηθός που δείχνεις τις παραγγελίες στον χρήστη. Οι Παραγγελίες είναι οι εξής: ${ordersList}`
    );

    const humanPrompt = new HumanMessage(userMessage);

    const response = await listOrdersAgentModel.call([systemPrompt, humanPrompt]);

    return typeof response.content === "string"
        ? response.content
        : "Δεν βρέθηκε κατάλληλη απάντηση για τις παραγγελίες.";
}


router.post("/reply", async (req, res) => {
    const memory = new ChatMessageHistory();

    try {
        const { message, chat_id, username } = req.body;

        if (!message) {
            res.status(400).json({ error: "Το μήνυμα είναι υποχρεωτικό." });
            console.log("δωσε μηνυμα");
            return;
        }

        console.log("Incoming message:", message);

        // Φορτώνουμε το ιστορικό
        const messages = await db.query(
            "SELECT sender, text FROM messages WHERE chat_id = $1 ORDER BY created_at ASC",
            [chat_id]
        );
        console.log("Loaded messages from DB:", messages);

        for (const msg of messages) {
            if (msg.sender === "user") {
                await memory.addMessage(new HumanMessage(msg.text));
            } else {
                await memory.addMessage(new AIMessage(msg.text));
            }
        }

        await memory.addMessage(new HumanMessage(message));

        const masterSystemPrompt = new SystemMessage(
            `Είσαι διαχειριστής βοηθός (masterAgent) που αποφασίζει αν το αίτημα του χρήστη είναι για παραγγελία, για εμφάνιση παραγγελιών, για καταχώρηση παραπόνων ή εμφάνιση των παραπόνων του χρήστη. Αν ο χρήστης σε ρωτήσει οτιδήποτε άλλο απλά κατεύθυνε τον` +
            ` ειτε για παραγγελια προιοντων ειτε για εμφανιση των παραγγελιων του είτε για καταχώρηση παραπόνων είτε για εμφάνιση των παραπόνων του. Άρα αυτές είναι οι επιλογές του χρήστη. Αν δεν βρίσκεις άκρη τότε ο agent εισαι εσυ δηλαδή ο masterAgent αρα γυρνας τον masterAgent και φυσικά απαντάς κανονικά και δεν απαντας με τη μορφη JSON. Απάντησε ΜΟΝΟ με JSON σε αυτή τη μορφή: { "agent": "masterAgent" ή "orderAgent" ή "listOrdersAgent" ή "complaintsAgent" ή "listComplaintsAgent", "input": "<το κείμενο του χρήστη>", "username": "<το ονομα χρηστη του χρηστη>" }.`);

        const fullConversation = [masterSystemPrompt, ...await memory.getMessages()];
        console.log("Master agent prompt messages:", fullConversation);

        let masterResponse;
        try {
            masterResponse = await masterAgentModel.call(fullConversation);
            console.log("Master agent response:", masterResponse);
        } catch (callError) {
            console.error("Error calling masterAgentModel:", callError);

            masterResponse = { content: JSON.stringify({ agent: "masterAgent", input: message, username: username}) };
        }
        const replyText =
            typeof masterResponse.content === "string"
                ? masterResponse.content
                : masterResponse.content.map((p) => ("text" in p ? p.text : "")).join("");
        console.log("Master agent replyText:", replyText);

        let decision;

        try {
            const cleaned = cleanJsonString(replyText);
            decision = JSON.parse(cleaned);
            console.log("Parsed decision:", decision);
        } catch (jsonError) {
            console.error("JSON parse error:", jsonError, "replyText:", replyText);
            res.status(500).json({ error: "Το master agent δεν επέστρεψε έγκυρο JSON." });
            return;
        }

        try {
            if(decision.agent === "masterAgent") {

                const masterSystemPrompt = new SystemMessage(
                    `Είσαι διαχειριστής βοηθός (masterAgent) που αποφασίζει αν το αίτημα του χρήστη είναι για παραγγελία, για εμφάνιση παραγγελιών, για καταχώρηση παραπόνων ή εμφάνιση των παραπόνων του χρήστη στον χρήστη. Αν ο χρήστης σε ρωτήσει οτιδήποτε άλλο απλά κατεύθυνε τον` +
                    ` ειτε για παραγγελια προιοντων ειτε για εμφανιση των παραγγελιων του είτε για καταχώρηση παραπόνων είτε για εμφάνιση των παραπόνων του. Άρα αυτές είναι οι επιλογές του χρήστη. }.`);

                const fullConversation = [masterSystemPrompt, ...await memory.getMessages()];
                console.log("Master agent prompt messages:", fullConversation);

                let masterResponse;
                try {
                    masterResponse = await masterAgentModel.call(fullConversation);
                    const replyText =
                        typeof masterResponse.content === "string"
                            ? masterResponse.content
                            : masterResponse.content.map((p) => ("text" in p ? p.text : "")).join("");
                    console.log("Master agent replyText:", replyText);

                    res.json({reply: replyText});
                    return;
                } catch(error) {

                }
            }

            else if (decision.agent === "orderAgent") {
                const reply = await handleOrderAgent(memory, decision.input, username);
                res.json({ reply });
            } else if (decision.agent === "listOrdersAgent") {
                const reply = await handleListOrdersAgent(decision.input, username);
                res.json({ reply });
            } else if(decision.agent === "complaintsAgent") {
                const reply = await handleComplaintAgent(memory, decision.input, username);
                res.json({ reply });
            } else if(decision.agent === "listComplaintsAgent") {
                const reply = await handleListComplaintsAgent(decision.input, username);
                res.json({ reply });
            }

            else {
                res.json({ reply: "Δεν κατάλαβα το αίτημά σου." });
            }
        } catch (agentError) {
            console.error("Agent processing error:", agentError);
            res.status(500).json({ error: "Σφάλμα κατά την επεξεργασία του agent." });
        }
    } catch (error) {
        console.error("LangChain error:", error);
        res.status(500).json({ error: "Server Internal Error" });
    }
});

// Δημιουργία νέου chat
router.post("/", async (req, res) => {
    const { agent_name, username } = req.body;
    try {
        const newChat = await db.one(
            "INSERT INTO chat (agent_name, username) VALUES ($1, $2) RETURNING *",
            [agent_name, username]
        );
        console.log(newChat);
        res.status(201).json(newChat);
    } catch (error) {
        console.error("Error creating chat:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Λήψη όλων των chats για χρήστη
router.get("/user/:username", async (req, res) => {
    const { username } = req.params;
    try {
        const chats = await db.any(
            "SELECT * FROM chat WHERE username = $1",
            [username]
        );
        res.json(chats);
    } catch (error) {
        console.error("Error fetching chats for user:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Λήψη όλων των chats για agent
router.get("/agent/:agent_id", async (req, res) => {
    const { agent_id } = req.params;
    try {
        const chats = await db.any(
            "SELECT * FROM chat WHERE agent_id = $1",
            [agent_id]
        );
        res.json(chats);
    } catch (error) {
        console.error("Error fetching chats for agent:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Λήψη ενός συγκεκριμένου chat (by id)
router.get("/:id", async (req, res) => {
    const { id } = req.params;
    try {
        const chat = await db.oneOrNone("SELECT * FROM chat WHERE id = $1", [id]);
        if (!chat) {
            res.status(404).json({ error: "Chat not found" });
        } else {
            res.json(chat);
        }
    } catch (error) {
        console.error("Error fetching chat:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

export default router;
