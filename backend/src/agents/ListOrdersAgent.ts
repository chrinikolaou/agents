import {HumanMessage, SystemMessage} from "@langchain/core/messages";
import {ChatGoogleGenerativeAI} from "@langchain/google-genai";

const ordersAgentModel = new ChatGoogleGenerativeAI({
    model: "gemini-2.0-flash-lite",
    temperature: 0.3,
    apiKey: process.env.GEMINI_API_KEY,
    maxOutputTokens: 500,
});

async function handleOrdersListAgent(userMessage: string, userId: string) {
    const systemPrompt = new SystemMessage(
        "Είσαι βοηθός που επιστρέφει μόνο τις παραγγελίες του χρήστη. Δεν γνωρίζεις κάτι άλλο πέρα από τις παραγγελίες του χρήστη. Δηλαδή ποια προιόντα έχει παραγγείλει και " +
        "την ποσότητα αυτών."
    );
    const humanPrompt = new HumanMessage(userMessage);

    const response = await ordersAgentModel.call([systemPrompt, humanPrompt]);
    return response.content;
}
