import { GoogleGenAI, Type, Schema } from "@google/genai";
import { ExamType, TimeFrame, QuizQuestion, Flashcard, ExamStrategy, Chapter, Formula } from "../types";

// Initialize the client. 
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

const MODEL_FAST = 'gemini-2.5-flash';
const MODEL_SMART = 'gemini-2.5-flash'; 

export const generateSummary = async (text: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: MODEL_FAST,
      contents: `You are an expert academic tutor. Summarize the following lecture transcript. 
      Structure the summary with:
      1. A brief overview.
      2. Key Concepts (bullet points).
      3. Important Definitions.
      
      Keep it clear, concise, and academic.
      
      Lecture Text:
      ${text.substring(0, 30000)}`,
    });
    return response.text || "Failed to generate summary.";
  } catch (error) {
    console.error("Summary Gen Error:", error);
    throw new Error("Could not generate summary.");
  }
};

export const generateChapters = async (text: string): Promise<Chapter[]> => {
  const schema: Schema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        timestamp: { type: Type.STRING, description: "Time format MM:SS" },
        title: { type: Type.STRING },
        summary: { type: Type.STRING },
      },
      required: ["timestamp", "title", "summary"],
    },
  };

  try {
    const response = await ai.models.generateContent({
      model: MODEL_FAST,
      contents: `Analyze this lecture transcript. Divide it into logical "Chapters" or segments.
      For each segment, estimate a timestamp (assume the lecture is about 60 minutes long if no timestamps are present in text) where this topic likely starts.
      Provide a title and a very brief 1-sentence summary for each chapter.
      
      Lecture Text:
      ${text.substring(0, 30000)}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
      },
    });

    return JSON.parse(response.text || "[]") as Chapter[];
  } catch (error) {
    console.error("Chapters Gen Error:", error);
    return [];
  }
};

export const extractFormulas = async (text: string): Promise<Formula[]> => {
  const schema: Schema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        expression: { type: Type.STRING, description: "The formula or equation" },
        description: { type: Type.STRING, description: "What this formula calculates" },
      },
      required: ["expression", "description"],
    },
  };

  try {
    const response = await ai.models.generateContent({
      model: MODEL_FAST,
      contents: `Identify all important mathematical formulas, scientific equations, or key structural arguments in this lecture.
      If it's a non-math lecture, identify key "Rules" or "Laws".
      Return them as a list.
      
      Lecture Text:
      ${text.substring(0, 30000)}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
      },
    });

    return JSON.parse(response.text || "[]") as Formula[];
  } catch (error) {
    console.error("Formula Gen Error:", error);
    return [];
  }
};

export const chatWithLecture = async (transcript: string, history: {role: string, content: string}[], message: string): Promise<string> => {
  try {
    // Construct a prompt with context
    const context = `You are a helpful AI tutor for a specific lecture. 
    Use ONLY the provided transcript to answer the student's question. 
    If the answer is not in the transcript, say "I couldn't find that in the lecture."
    
    If the student says they have no more questions or "I'm done", suggest they take the Quiz to test their knowledge.
    
    Transcript Context:
    ${transcript.substring(0, 20000)}
    `;
    
    const response = await ai.models.generateContent({
      model: MODEL_SMART,
      contents: `${context}
      
      Student Question: ${message}`,
    });

    return response.text || "I'm having trouble thinking right now.";
  } catch (error) {
    console.error("Chat Error:", error);
    return "Sorry, I encountered an error answering that.";
  }
};

export const generateExamStrategy = async (
  text: string, 
  type: ExamType, 
  time: TimeFrame
): Promise<ExamStrategy> => {
  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      priorityTopics: { type: Type.ARRAY, items: { type: Type.STRING } },
      skipTopics: { type: Type.ARRAY, items: { type: Type.STRING } },
      focusAdvice: { type: Type.STRING },
    },
    required: ["priorityTopics", "skipTopics", "focusAdvice"],
  };

  try {
    const response = await ai.models.generateContent({
      model: MODEL_FAST,
      contents: `Analyze this lecture for a student preparing for a "${type}" in "${time}".
      Identify high-yield topics.
      Identify lower probability topics.
      Give 2 sentences of strategic advice.
      
      Lecture Text:
      ${text.substring(0, 20000)}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
      },
    });

    const json = JSON.parse(response.text || "{}");
    return json as ExamStrategy;
  } catch (error) {
    console.error("Strategy Gen Error:", error);
    return {
      priorityTopics: ["Core Concepts"],
      skipTopics: ["Detailed derivations"],
      focusAdvice: "Focus on the main summary points.",
    };
  }
};

export const generateQuiz = async (text: string): Promise<QuizQuestion[]> => {
  const schema: Schema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        id: { type: Type.INTEGER },
        question: { type: Type.STRING },
        options: { type: Type.ARRAY, items: { type: Type.STRING } },
        correctAnswerIndex: { type: Type.INTEGER },
        explanation: { type: Type.STRING },
      },
      required: ["id", "question", "options", "correctAnswerIndex", "explanation"],
    },
  };

  try {
    const response = await ai.models.generateContent({
      model: MODEL_FAST,
      contents: `Create a multiple-choice quiz with EXACTLY 10 questions based on the lecture.
      Strict Requirement: The output array MUST contain 10 items.
      Test conceptual understanding and key details. 
      Provide 4 options per question.
      
      Lecture Text:
      ${text.substring(0, 20000)}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
      },
    });

    return JSON.parse(response.text || "[]") as QuizQuestion[];
  } catch (error) {
    console.error("Quiz Gen Error:", error);
    return [];
  }
};

export const generateFlashcards = async (text: string): Promise<Flashcard[]> => {
  const schema: Schema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        id: { type: Type.INTEGER },
        front: { type: Type.STRING },
        back: { type: Type.STRING },
      },
      required: ["id", "front", "back"],
    },
  };

  try {
    const response = await ai.models.generateContent({
      model: MODEL_FAST,
      contents: `Create 6 active-recall flashcards from this lecture.
      
      Lecture Text:
      ${text.substring(0, 20000)}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
      },
    });

    return JSON.parse(response.text || "[]") as Flashcard[];
  } catch (error) {
    console.error("Flashcard Gen Error:", error);
    return [];
  }
};

export const generateCheatSheet = async (text: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: MODEL_SMART,
      contents: `Create a "Cheat Sheet" for this lecture. 
      Condensed, Markdown format, tables for comparisons, bold keywords, short formulas.
      
      Lecture Text:
      ${text.substring(0, 30000)}`,
    });
    return response.text || "";
  } catch (error) {
    console.error("CheatSheet Gen Error:", error);
    return "Could not generate cheat sheet.";
  }
};

export const generateYouTubeTranscript = async (url: string, title?: string): Promise<string> => {
  try {
    const titleContext = title ? `The video title is: "${title}".` : "";
    const response = await ai.models.generateContent({
      model: MODEL_FAST,
      contents: `I have a YouTube video link: ${url}. ${titleContext}
      Use Google Search to find the actual content, transcript, or a very detailed summary of this specific video.
      Then, generate a realistic lecture transcript (approx 800-1000 words) that accurately reflects the ACTUAL content of the video found via search.
      If you cannot find the specific transcript, find a high-quality summary of this specific video topic and format it as a lecture transcript.
      Include [MM:SS] timestamps occasionally.
      Start with "Welcome..."`,
      config: {
        tools: [{googleSearch: {}}],
        // Note: responseMimeType is not allowed with googleSearch
      }
    });
    return response.text || "Failed to generate transcript.";
  } catch (error) {
    console.error("YouTube Transcript Gen Error:", error);
    return "Error processing YouTube video. The AI could not access the video content directly.";
  }
};
