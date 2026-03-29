
import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";
import { GeminiPageResponse, BatchResponse, ModelType } from "../types";

const getSystemInstruction = () => {
  return `
You are a world-class specialist in mathematics education and web accessibility (WCAG 2.2 AA). 
Your task is to convert scanned handwritten mathematics lecture notes into a high-fidelity, accessible HTML document.

Rules:
1. FAITHFULNESS & ADAPTIVE LAYOUT: Transcribe the author's original wording and shorthand as faithfully as possible. Do not rewrite, heavily rephrase, or expand shorthand into full sentences unless fixing an obvious typo. However, you MAY adapt the spatial layout and formatting to enhance web clarity and accessibility.
    - If text and a figure appear side-by-side in the notes, use Tailwind grid classes (e.g., <div class="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">) to replicate this layout.
    - If an equation and an annotation (text with an arrow) appear side-by-side, you may preserve the spatial relationship using a flexbox container OR convert the annotation into a clear text note immediately below the equation if it improves readability on a screen.

2. ACCESSIBILITY: Use semantic HTML5 elements (<article>, <section>, <h1>-<h6>, <p>, <ul>, <ol>, <dl>). 
    - HEADING HIERARCHY (CRITICAL A11Y): You are FORBIDDEN from skipping heading levels. Always start with an <h1> for the main title. You MUST use <h2> for major sections and <h3> for sub-sections. NEVER use <h4>, <h5>, or <h6> unless you have explicitly used the preceding level on the exact same page. Do not use headings purely for visual sizing.
    - COLOR CONTRAST (STRICT): You are FORBIDDEN from using light gray text colors (e.g., text-slate-300, text-gray-300). Use high-contrast text colors to ensure WCAG 2.2 AA compliance. 
      - APPROVED COLORS: For emphasis, you MAY use high-contrast Tailwind classes: 'text-slate-900', 'text-blue-900', 'text-red-900', 'text-emerald-900', 'text-indigo-900'.

3. UNIVERSAL DESIGN & AESTHETICS (BEAUTIFUL & ACCESSIBLE):
   - TYPOGRAPHY: Use 'font-sans' for a clean, readable look. For headings, use 'font-black tracking-tight text-slate-900'.
   - SPACING: Use standard Tailwind spacing (e.g., 'space-y-4', 'mb-6', 'mt-8') to group related concepts logically, matching the visual flow of the handwritten page.
   - VISUAL HIERARCHY: Use 'italic text-slate-700 my-8' for important theorems or definitions. Do NOT use any left borders or gold colors here; reserve the gold bar exclusively for the '<div class="notebox">' used for explicitly boxed notes.
   - LISTS: Use 'list-disc list-outside ml-6 space-y-2 mb-6' for unordered lists to ensure proper text wrapping and readability.
   - NOTEPADS/BOXES: For boxed annotations or important notes, use '<div class="notebox">'. NEVER use green backgrounds or borders.
4. MATHEMATICS (CRITICAL): Convert all mathematical expressions into LaTeX. 
   - PREFER INLINE MATH: Use \\( ... \\) for variables, short expressions, or any math that is part of a sentence to maintain a natural, cohesive flow.
   - BLOCK MATH: Use '\\[ ... \\]' for standalone block math. 
     - If the equation is NOT boxed in the handwritten notes, do not wrap it in any HTML tags. 
     - If the equation IS explicitly boxed or highlighted as a key result in the notes, wrap it in '<div class="notebox">'.
   - UNDERBRACES AND OVERBRACES: Use \\underbrace{...}_{\\text{...}} or \\overbrace{...}^{\\text{...}} in LaTeX to represent curly brackets under or over math expressions. You may adjust the exact grouping slightly if it improves mathematical clarity or fixes an obvious mistake.
   - ARROWS AND LABELS IN EQUATIONS: When handwritten notes use arrows to point to parts of an equation, prioritize clarity and readability over strict spatial replication:
     - You have the freedom to convert messy spatial annotations into clean, structured text immediately below the equation (e.g., "Note: \\(-py\\) acts as reduction to growth rate") using the author's original wording.
     - Alternatively, if it makes the mathematical meaning clearer, use \\overbrace, \\underbrace, \\underset, or \\overset in LaTeX.
     - If preserving the side-by-side layout is best, use HTML flexbox (e.g., <div class="flex items-center gap-4"><div>\\[ math \\]</div><div class="text-sm text-slate-600">\\(\\leftarrow\\) your text</div></div>).
   - Ensure backslashes are present for all functions (e.g., \\sin, \\cos, \\log, \\sqrt, \\times).
   - Double check that delimiters are NOT missing.

5. DISTINGUISH ANNOTATIONS VS. FIGURES (STRICT ENFORCEMENT):
   - ANNOTATIONS (NOT FIGURES): Hand-drawn circles around text, arrows pointing to variables, large curly brackets used for grouping, and labels in boxes (e.g., "Option 2", "Important!") are NOT FIGURES.
     - Transcribe the text/math inside or pointed to by these markers as standard HTML. 
     - Use <div class="notebox"> for boxed items.
     - If curly brackets are used UNDER or OVER math expressions, use \\underbrace or \\overbrace in LaTeX. For other bracketed groups, use standard text flow.
     - IGNORE the visual circle/arrow itself if it serves only to highlight text; focus on the text content.
   - ACTUAL FIGURES: Only capture visual representations as figures if they represent:
     - Coordinate systems/graphs with axes and curves.
     - Geometric shapes (circles, triangles, etc.) that are part of a problem, not just highlights.
     - Physics diagrams or complex flowcharts.
   - CRITICAL: If a box contains "option 2 integral property", it is TEXT. Transcribe it as <h2> or a styled <div>. Do NOT create an image figure for it.

6. GRAPHS & DIAGRAMS (FIGURES ONLY):
   - Identify every actual drawing (axes, curves, sketches).
   - Determine its exact bounding box in [ymin, xmin, ymax, xmax] format (normalized 0-1000).
   - Generate a highly accessible, concise alt text description (1-2 sentences).
   - Generate a short 3-5 word title for the visible caption.
   - NO ABRUPT CUTOFFS: Ensure the description is a complete, well-formed thought that ends naturally.
   - MATHEMATICAL PRECISION: Ensure that any LaTeX expressions are properly enclosed within \\( ... \\) for inline math or \\[ ... \\] for block math.
   - ACCESSIBILITY: Provide a spoken-word equivalent for complex mathematical notation to ensure accessibility for screen readers.
   - In the HTML, place an <img> tag with a matching ID: <img id="fig_ID" alt="[CONCISE DESCRIPTION]">.
   - DO NOT wrap the <img> tag in a <p> tag. You may place it inside layout <div>s (e.g., for side-by-side grid layouts). The system will automatically wrap the <img> in a styled <figure> container.

7. OUTPUT FORMAT: Return ONLY a JSON object:
   {
     "html": "The full semantic HTML string",
     "figures": [
       { "id": "fig_1", "box_2d": [ymin, xmin, ymax, xmax], "alt": "Detailed visual description", "caption": "Short title" }
     ]
   }

CRITICAL: Do not include any internal monologue, reasoning, or "thinking" process in the output. Return ONLY the JSON object.
`;
};

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function callBatchGeminiWithRetry(images: { base64: string, pageNumber: number }[], model: ModelType = 'gemini-3.1-pro-preview', retries = 3): Promise<{text: string, tokenCount: number}> {
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
          systemInstruction: getSystemInstruction() + "\nIMPORTANT: Return a JSON object with a 'pages' property containing an array of page results. Each page result must have 'html' and 'figures' properties.",
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
                          alt: { type: Type.STRING },
                          caption: { type: Type.STRING }
                        },
                        required: ["id", "box_2d", "alt", "caption"]
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

export const convertBatchToHtml = async (images: { base64: string, pageNumber: number }[], model: ModelType = 'gemini-3.1-pro-preview'): Promise<BatchResponse> => {
  let result = { text: "", tokenCount: 0 };
  try {
    result = await callBatchGeminiWithRetry(images, model);
    const parsed = JSON.parse(result.text);
    return { pages: parsed.pages as GeminiPageResponse[], tokenCount: result.tokenCount };
  } catch (error: any) {
    console.error('Gemini Batch API Error:', error);
    throw new Error(`Failed to process batch: ${error.message}`);
  }
};

export const describeFigure = async (base64Image: string, model: ModelType = 'gemini-3-flash-preview'): Promise<{alt: string, caption: string, tokenCount: number}> => {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview', // Hardcoded to flash for cost savings
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/png', data: base64Image.split(',')[1] || base64Image } },
          { text: `Generate a highly accessible, concise description (1-2 sentences) of this mathematical figure for a blind student, AND a short 3-5 word caption for sighted users.
          
          RULES:
          1. CONCISENESS: Limit alt text to 1-2 sentences. Limit caption to 3-5 words.
          2. NO ABRUPT CUTOFFS: Ensure the description is a complete, well-formed thought that ends naturally.
          3. BEST FIT: Do not assume fixed orientation; describe the logical mathematical content.
          4. MATHEMATICAL PRECISION: Ensure that any LaTeX expressions are properly enclosed within \\( ... \\) for inline math or \\[ ... \\] for block math.
          5. SPOKEN MATH: Provide a spoken-word equivalent for complex mathematical notation to ensure accessibility for screen readers.
          
          Return ONLY a JSON object with 'alt' and 'caption' string properties.` }
        ]
      },
      config: {
        temperature: 0.2,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            alt: { type: Type.STRING },
            caption: { type: Type.STRING }
          },
          required: ["alt", "caption"]
        },
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW }
      }
    });

    const parsed = JSON.parse(response.text?.trim() || "{}");
    return { 
      alt: parsed.alt || "", 
      caption: parsed.caption || "", 
      tokenCount: response.usageMetadata?.totalTokenCount || 0 
    };
  } catch (error: any) {
    console.error('Description error:', error);
    throw error;
  }
};
