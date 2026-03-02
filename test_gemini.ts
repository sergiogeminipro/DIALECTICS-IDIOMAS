import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = "AIzaSyArHuY8mgtnZ7afAhAvWwMmEitsRjxz_k4";
const genAI = new GoogleGenerativeAI(apiKey);

async function test() {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const result = await model.generateContent("Hello!");
        console.log("SUCCESS:", result.response.text());
    } catch (e) {
        console.error("ERROR 2.5-flash:", e);
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        const result = await model.generateContent("Hello!");
        console.log("SUCCESS 2.0-flash:", result.response.text());
    } catch (e) {
        console.error("ERROR 2.0-flash:", e);
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent("Hello!");
        console.log("SUCCESS 1.5-flash:", result.response.text());
    } catch (e) {
        console.error("ERROR 1.5-flash:", e);
    }
}

test();
