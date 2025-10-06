
import { GoogleGenAI } from "@google/genai";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.error("API_KEY is not set. Please set the API_KEY environment variable.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

export const getTermDefinition = async (term: string, context: string): Promise<string> => {
  if (!API_KEY) {
    return "API Key not configured. Please set up your environment variables.";
  }

  const prompt = `
    Based on the following context, provide a short, one-paragraph definition for the term "${term}". 
    The definition should be insightful and relevant to the context provided. Do not just give a generic dictionary definition.

    Context:
    ---
    ${context}
    ---

    Term: "${term}"

    Short Definition:`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Error fetching definition from Gemini API:", error);
    return "Sorry, I couldn't fetch a definition at this moment.";
  }
};
