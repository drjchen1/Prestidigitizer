
import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";
import { GeminiPageResponse, LanguageLevel, BatchResponse, ModelType } from "../types";

const getSystemInstruction = (level: LanguageLevel) => {
  let adaptationInstruction = "";
  
  if (level === 'faithful') {
    adaptationInstruction = "FAITHFULNESS: Transcribe every word and symbol exactly as written. Preserve the logical flow and hierarchy.";
  } else if (level === 'natural') {
    adaptationInstruction = "NATURAL ADAPTATION: Convert the notes into natural, complete sentences using simple English. Ensure the flow is smooth while maintaining the original meaning and mathematical rigor.";
  } else if (level === 'fleshed_out') {
    adaptationInstruction = "FLESHED OUT ADAPTATION: Expand on the notes. Provide more context, explain steps more thoroughly, and complete any shorthand into full, detailed explanations. Act as a helpful tutor expanding on the lecture.";
  }

  return `
You are a world-class specialist in mathematics education and web accessibility (WCAG 2.2 AA). 
Your task is to convert scanned handwritten mathematics lecture notes into a high-fidelity, accessible HTML document.

Rules:
1. ${adaptationInstruction}
2. ACCESSIBILITY: Use semantic HTML5 elements (<article>, <section>, <h1>-<h6>, <p>, <ul>, <ol>). 
    - HEADING HIERARCHY (CRITICAL A11Y): You are FORBIDDEN from skipping heading levels. Always start with an <h1> for the main title. You MUST use <h2> for major sections and <h3> for sub-sections. NEVER use <h4>, <h5>, or <h6> unless you have explicitly used the preceding level on the exact same page. Do not use headings purely for visual sizing.
    - COLOR CONTRAST (STRICT): You are FORBIDDEN from using light gray text colors (e.g., text-slate-300, text-gray-300, text-zinc-300, text-slate-400). You are FORBIDDEN from using the "style" attribute for colors or backgrounds (e.g., style="color:..."). Use high-contrast text colors to ensure WCAG 2.2 AA compliance. 
      - APPROVED COLORS: For emphasis, you MAY use high-contrast Tailwind classes: 'text-slate-900', 'text-blue-900', 'text-red-900', 'text-emerald-900', 'text-indigo-900'.
3. UNIVERSAL DESIGN & AESTHETICS (BEAUTIFUL & ACCESSIBLE):
   - Use Tailwind CSS classes to create a visually pleasing, modern academic look.
   - TYPOGRAPHY: Use 'font-sans' for a clean, readable look. For headings, use 'font-black tracking-tight text-slate-900'.
   - SPACING: Use 'mb-6' for paragraphs and 'mt-10 mb-4' for headings to create a clear visual rhythm.
   - VISUAL HIERARCHY: Use 'border-l-4 border-purdue pl-6 my-8 italic text-slate-700' for important theorems or definitions.
   - MATHEMATICS: Ensure block math '\\[ ... \\]' is wrapped in a '<div class="my-8 overflow-x-auto py-4 bg-slate-50 rounded-xl px-6 border border-slate-200 shadow-sm">' to make it stand out and be readable. Use a neutral, muted stone/slate palette. NEVER use green (e.g., bg-green-50, border-green-200) for any boxes or backgrounds.
   - LISTS: Use 'list-disc list-inside space-y-2 ml-4 mb-6' for unordered lists.
   - NOTEPADS/BOXES: For boxed annotations or important notes, use '<div class="notebox">'. Ensure these boxes use the 'notebox' class and NEVER use green backgrounds or borders.
4. MATHEMATICS (CRITICAL): Convert all mathematical expressions into LaTeX. 
   - Use \\( ... \\) for inline math.
   - Use \\[ ... \\] for block/display math.
   - Ensure backslashes are present for all functions (e.g., \\sin, \\cos, \\log, \\sqrt, \\times).
   - Double check that delimiters are NOT missing.

4. DISTINGUISH ANNOTATIONS VS. FIGURES (STRICT ENFORCEMENT):
   - ANNOTATIONS (NOT FIGURES): Hand-drawn circles around text, arrows pointing to variables, large curly brackets used for grouping, and labels in boxes (e.g., "Option 2", "Important!") are NOT FIGURES.
     - Transcribe the text/math inside or pointed to by these markers as standard HTML. 
     - Use <div class="notebox"> for boxed items.
     - Use standard text flow for bracketed groups.
     - IGNORE the visual circle/arrow itself if it serves only to highlight text; focus on the text content.
   - ACTUAL FIGURES: Only capture visual representations as figures if they represent:
     - Coordinate systems/graphs with axes and curves.
     - Geometric shapes (circles, triangles, etc.) that are part of a problem, not just highlights.
     - Physics diagrams or complex flowcharts.
   - CRITICAL: If a box contains "option 2 integral property", it is TEXT. Transcribe it as <h2> or a styled <div>. Do NOT create an image figure for it.

5. GRAPHS & DIAGRAMS (FIGURES ONLY):
   - Identify every actual drawing (axes, curves, sketches).
   - Determine its exact bounding box in [ymin, xmin, ymax, xmax] format (normalized 0-1000).
   - Generate a HIGHLY CONCISE alt text description (1-2 sentences, max 125 characters).
   - NO ABRUPT CUTOFFS: Ensure the description is a complete, well-formed thought that ends naturally.
   - BEST FIT: Do not assume a fixed orientation (portrait/landscape). Focus on logical content and let the layout handle the visual flow.
   - MATHEMATICAL PRECISION: Use LaTeX (wrapped in \\( ... \\)) for complex mathematical expressions.
   - ACCESSIBILITY: Provide a clear, spoken-word description of the math.
   - In the HTML, place an <img> tag with a matching ID: <img id="fig_ID" alt="[CONCISE DESCRIPTION]">.
   - DO NOT wrap the <img> tag in a <figure>, <div>, or <p> tag. Just return the raw <img> tag at the block level. The system will automatically wrap it in a styled <figure> container.

6. OUTPUT FORMAT: Return ONLY a JSON object:
   {
     "html": "The full semantic HTML string",
     "figures": [
       { "id": "fig_1", "box_2d": [ymin, xmin, ymax, xmax], "alt": "Detailed visual description" }
     ]
   }

CRITICAL: Do not include any internal monologue, reasoning, or "thinking" process in the output. Return ONLY the JSON object.
`;
};

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function callBatchGeminiWithRetry(images: { base64: string, pageNumber: number }[], level: LanguageLevel = 'faithful', model: ModelType = 'gemini-3-flash-preview', retries = 3): Promise<{text: string, tokenCount: number}> {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  
  for (let i = 0; i < retries; i++) {
    try {
      // Tweak 5: Adaptive Thinking Levels
      // Start with LOW to minimize latency. If it's a retry, we might want to increase it, 
      // but for now we'll stick to the user's request of "adaptive" based on complexity.
      // Since we can't pre-detect, we'll use LOW for the first attempt and HIGH for retries 
      // if the error suggests complexity issues.
      const currentThinkingLevel = i === 0 ? ThinkingLevel.LOW : ThinkingLevel.HIGH;

      const parts = images.flatMap(img => [
        { inlineData: { mimeType: 'image/jpeg', data: img.base64 } },
        { text: `This is page ${img.pageNumber}.` }
      ]);

      parts.push({ text: `Analyze these ${images.length} pages in order. 
      CRITICAL: Hand-drawn circles, arrows, and grouping brackets are annotations, NOT figures. 
      Labels like "Option 2" in boxes are text content and must be transcribed directly into HTML. 
      Only extract coordinate graphs or scientific drawings as figures. 
      Return a JSON object with a 'pages' property containing exactly ${images.length} page results in the same order as provided.
      Ensure the output is complete and does not cut off.` });

      const response = await ai.models.generateContent({
        model: model,
        contents: { parts },
        config: {
          systemInstruction: getSystemInstruction(level) + "\nIMPORTANT: Return a JSON object with a 'pages' property containing an array of page results. Each page result must have 'html' and 'figures' properties.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              pages: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    html: { type: Type.STRING },
                    figures: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          id: { type: Type.STRING },
                          box_2d: { 
                            type: Type.ARRAY, 
                            items: { type: Type.NUMBER },
                            minItems: 4,
                            maxItems: 4
                          },
                          alt: { type: Type.STRING }
                        },
                        required: ["id", "box_2d", "alt"]
                      }
                    }
                  },
                  required: ["html", "figures"]
                }
              }
            },
            required: ["pages"]
          },
          temperature: 0.1,
          maxOutputTokens: 65536,
          thinkingConfig: { thinkingLevel: currentThinkingLevel }
        }
      });

      if (!response.text) throw new Error("Empty response from Gemini");
      
      let cleanJson = response.text.trim();
      if (cleanJson.startsWith('```')) {
        cleanJson = cleanJson.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
      }
      
      return { text: cleanJson, tokenCount: response.usageMetadata?.totalTokenCount || 0 };
    } catch (error: any) {
      const isRateLimit = error.message?.includes('429') || error.message?.toLowerCase().includes('rate limit');
      
      if (isRateLimit && i < retries - 1) {
        const waitTime = Math.pow(2, i + 1) * 1000;
        console.warn(`Rate limit hit on batch. Retrying in ${waitTime}ms...`);
        await sleep(waitTime);
        continue;
      }
      throw error;
    }
  }
  throw new Error("Max retries exceeded");
}

export const convertBatchToHtml = async (images: { base64: string, pageNumber: number }[], level: LanguageLevel = 'faithful', model: ModelType = 'gemini-3-flash-preview'): Promise<BatchResponse> => {
  let result = { text: "", tokenCount: 0 };
  try {
    result = await callBatchGeminiWithRetry(images, level, model);
    const parsed = JSON.parse(result.text);
    return { pages: parsed.pages as GeminiPageResponse[], tokenCount: result.tokenCount };
  } catch (error: any) {
    console.error('Gemini Batch API Error:', error);
    throw new Error(`Failed to process batch: ${error.message}`);
  }
};

export const describeFigure = async (base64Image: string, model: ModelType = 'gemini-3-flash-preview'): Promise<{result: string, tokenCount: number}> => {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/png', data: base64Image.split(',')[1] || base64Image } },
          { text: `Generate a highly accessible, extremely concise description (1-2 sentences, max 125 characters) of this mathematical figure for a blind student.
          
          RULES:
          1. CONCISENESS: Limit to 1-2 sentences and ensure the total length is under 125 characters.
          2. NO ABRUPT CUTOFFS: Ensure the description is a complete, well-formed thought that ends naturally.
          3. BEST FIT: Do not assume fixed orientation; describe the logical mathematical content.
          4. MATHEMATICAL PRECISION: Use LaTeX (wrapped in \\( ... \\)) for all mathematical expressions.
          5. SPOKEN MATH: Immediately following any LaTeX, provide a clear spoken-word equivalent in parentheses.
          
          Return ONLY the description text.` }
        ]
      },
      config: {
        temperature: 0.2,
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW }
      }
    });

    return { result: response.text?.trim() || "", tokenCount: response.usageMetadata?.totalTokenCount || 0 };
  } catch (error: any) {
    console.error('Description error:', error);
    throw error;
  }
};
