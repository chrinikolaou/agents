import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { AIMessage, HumanMessage, SystemMessage } from "@langchain/core/messages";

const orderAgentModel = new ChatGoogleGenerativeAI({
    model: "gemini-2.0-flash-lite",
    temperature: 0.3,
    apiKey: process.env.GEMINI_API_KEY,
    maxOutputTokens: 500,
});

async function handleOrderAgent(userMessage: string) {
    // Πες στο agent να καταλάβει το αίτημα παραγγελίας και να απαντήσει με JSON με productId, qty.
    const systemPrompt = new SystemMessage(
        "Είσαι βοηθός παραγγελιών. Όταν ο χρήστης θέλει να παραγγείλει προϊόν, απάντα μόνο με JSON:" +
        "{ productId: αριθμός, quantity: αριθμός }."
    );
    const humanPrompt = new HumanMessage(userMessage);

    const response = await orderAgentModel.call([systemPrompt, humanPrompt]);
    // Υποθέτουμε ότι το περιεχόμενο είναι το JSON
    let contentString: string;

    if (typeof response.content === "string") {
        contentString = response.content;
    } else if (Array.isArray(response.content)) {
        // Συμβολοσειρά από πίνακα κομματιών
        contentString = response.content.map(p => ("text" in p ? p.text : "")).join("");
    } else {
        throw new Error("Unexpected response content type");
    }

    try {
        const orderData = JSON.parse(contentString);
        return orderData;
    } catch {
        throw new Error("Invalid order format from agent.");
    }

}
