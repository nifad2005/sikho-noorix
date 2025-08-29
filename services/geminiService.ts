

import { GoogleGenAI, Type } from "@google/genai";
import { LearningMaterial, RoadmapModule, LearningContent, ChatMessage, RoadmapTopic } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

function formatMaterialsForPrompt(materials: LearningMaterial[]): string {
  return materials.map(m => {
    switch(m.type) {
      case 'topic':
        return `The user wants to learn about: "${m.content}".`;
      case 'text':
        return `The user provided the following text:\n---\n${m.content}\n---`;
      case 'file':
        return `The user uploaded a file named "${m.content}". Its content is provided as inline data.`;
      default:
        return '';
    }
  }).join('\n\n');
}

export const generateRoadmap = async (materials: LearningMaterial[]): Promise<RoadmapModule[]> => {
  const prompt = `You are an expert curriculum designer. Based on the provided learning materials, create a comprehensive, step-by-step learning roadmap. The roadmap should be broken down into logical modules, and each module should contain several focused topics. For each topic, provide a brief, one-sentence description.

Learning Materials:
${formatMaterialsForPrompt(materials)}

Respond ONLY with a valid JSON array that adheres to the provided schema. Do not include any introductory text or markdown formatting.
`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING, description: "The title of the module." },
              topics: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING, description: "The title of the topic." },
                    description: { type: Type.STRING, description: "A short, one-sentence description of the topic." }
                  },
                  required: ["title", "description"]
                }
              }
            },
            required: ["title", "topics"]
          }
        },
      }
    });

    const jsonText = response.text.trim();
    const roadmapData: (Omit<RoadmapModule, 'topics'> & { topics: Omit<RoadmapTopic, 'completed'>[] })[] = JSON.parse(jsonText);
    
    return roadmapData.map((module: any) => ({
        ...module,
        topics: module.topics.map((topic: any) => ({
            ...topic,
            completed: false
        }))
    }));

  } catch (error) {
    console.error("Gemini API Error (generateRoadmap):", error);
    throw new Error("Failed to generate a learning roadmap from the AI. Please check the provided materials and try again.");
  }
};


export const generateLearningContent = async (topicTitle: string, materials: LearningMaterial[]): Promise<LearningContent> => {
    const prompt = `You are an expert educator. Your task is to generate detailed learning content for a specific topic, using the provided context materials.

Context Materials:
${formatMaterialsForPrompt(materials)}

Current Topic to Explain: "${topicTitle}"

Please provide:
1. A clear, in-depth explanation of the topic.
2. At least two distinct and helpful examples to illustrate the concept.
3. A list of key terms (glossary) found within the explanation, along with their simple definitions.

Format your response as a JSON object with 'explanation', 'examples', and 'glossary' keys. The glossary should be an array of objects, each with 'term' and 'definition' properties.
`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        explanation: { type: Type.STRING, description: "A detailed explanation of the topic." },
                        examples: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING },
                            description: "An array of strings, each containing a relevant example."
                        },
                        glossary: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    term: { type: Type.STRING, description: "A key term from the explanation." },
                                    definition: { type: Type.STRING, description: "The definition of the key term." }
                                },
                                required: ["term", "definition"]
                            }
                        }
                    },
                    required: ["explanation", "examples", "glossary"]
                }
            }
        });

        const jsonText = response.text.trim();
        // FIX: Corrected typo from `jsontext` to `jsonText`.
        const content = JSON.parse(jsonText);

        if (!content.glossary) {
            content.glossary = [];
        }
        
        return content;
    } catch (error) {
        console.error("Gemini API Error (generateLearningContent):", error);
        throw new Error(`Failed to generate content for "${topicTitle}".`);
    }
};

export const generatePracticeExamples = async (topicTitle: string, materials: LearningMaterial[], existingExamples: string[] = []): Promise<string[]> => {
    const existingExamplesPrompt = existingExamples.length > 0 
        ? `The student has already seen these examples, so provide different ones:\n- ${existingExamples.join('\n- ')}`
        : '';

    const prompt = `You are a creative educator. Your task is to generate a few (2 or 3) new, helpful, and distinct examples to help a student understand a topic. The examples should be diverse—they could be short stories, real-world analogies, code snippets, or simple comparisons, depending on what's most effective for the topic.

Context Materials:
${formatMaterialsForPrompt(materials)}

Topic to Illustrate: "${topicTitle}"

${existingExamplesPrompt}

Please provide new examples to deepen the student's understanding. Respond with ONLY a valid JSON array of strings.
`;
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "An array of 2-3 new example strings."
                }
            }
        });
        const jsonText = response.text.trim();
        return JSON.parse(jsonText);
    } catch (error) {
        console.error("Gemini API Error (generatePracticeExamples):", error);
        throw new Error(`Failed to generate practice examples for "${topicTitle}".`);
    }
};

export const answerDoubt = async (doubt: string, history: ChatMessage[], materials: LearningMaterial[], topicTitle: string, context: string | null): Promise<string> => {
    const chatHistory = history.map(msg => `${msg.role === 'user' ? 'Student' : 'Assistant'}: ${msg.text}`).join('\n');
    
    const contextPrompt = context 
        ? `The student has highlighted the following text for additional context:\n---\n${context}\n---\n`
        : '';

    const prompt = `You are a friendly and knowledgeable teaching assistant. A student has a question related to their learning materials. Help them by providing a clear and concise answer.

Learning Materials Context:
${formatMaterialsForPrompt(materials)}

Current Topic Context: The student is currently studying "${topicTitle}".

${contextPrompt}

Conversation History:
${chatHistory}

Student's new question: "${doubt}"

Your task is to answer the student's new question based on all the context provided. If the question is blank, assume they are asking for an explanation of the provided context. Be helpful and encouraging.
`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });
        return response.text.trim();
    } catch (error) {
        console.error("Gemini API Error (answerDoubt):", error);
        throw new Error("Failed to get an answer from the AI assistant.");
    }
};