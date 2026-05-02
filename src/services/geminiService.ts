import { GoogleGenAI } from "@google/genai";

export async function askGemini(prompt: string, history: { role: 'user' | 'model', content: string }[] = []) {
  try {
    const apiKey = typeof process !== 'undefined' ? process.env.GEMINI_API_KEY : undefined;
    
    if (!apiKey) {
      console.error("GEMINI_API_KEY is missing in environment");
      return "I'm sorry, I'm currently unable to connect to my AI brain. Please check the configuration.";
    }

    const ai = new GoogleGenAI({ apiKey });
    
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        ...history.map(h => ({
          role: h.role,
          parts: [{ text: h.content }]
        })),
        { role: 'user', parts: [{ text: prompt }] }
      ],
      config: {
        systemInstruction: `You are helpful AI assistant for RoomZy, a premium property rental and management platform in India. 
        Your goal is to help users find properties, understand the booking process, and answer questions about rentals.
        The platform offers:
        - Daily and Monthly rentals (Monthly rates are displayed per day by dividing the monthly rate by 30).
        - Property types: PG, Flat, Independent House.
        - Locations: Major Indian cities.
        - Features: Instant booking, Chat with owners, Reviews & Ratings.
        
        Keep your responses concise, professional, and friendly. If you don't know something specific about a property, suggest them to view the property details or contact the owner.`,
      },
    });

    return response.text || "I couldn't generate a response. Please try again.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
}
