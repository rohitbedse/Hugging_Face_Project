import { GoogleGenerativeAI } from '@google/generative-ai';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { materialName, basePrompt } = req.body;
    // Use custom API key if provided, else use environment variable
    // (Assuming customApiKey might be needed here too, like in other endpoints)
    const apiKey = req.body.customApiKey || process.env.GEMINI_API_KEY;
    const genAI = new GoogleGenerativeAI(apiKey);

    // Use the specified flash model, configured for text-only output
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-exp-image-generation", // Use the required model
      generationConfig: {
        // Configuration similar to generate.js's text-only mode
        temperature: 0.8, // Adjust temperature for creativity if needed
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 8192, // Keep sufficient tokens for text
        responseModalities: ["text"] // Explicitly request only text output
      }
    });

    // --- Updated prompt with Simplified Classification (Material vs Style) ---
    const enhancementPrompt = `CONTEXT: You are an expert AI assisting with 3D prompt generation. Your task is to analyze a user's input term, classify it as either MATERIAL or STYLE, and then generate an enhanced 3D rendering prompt for Cinema 4D and Octane based ONLY on that classification, rewriting the provided base prompt.

USER INPUT TERM: "${materialName}"
BASE PROMPT TO REWRITE: "${basePrompt}" // (Note: C4D/Octane, black background, studio lighting should generally be maintained unless STYLE dictates otherwise).

DEFINITIONS:
- MATERIAL: Describes the substance, texture, surface properties, or *essence* of a thing (e.g., 'chrome', 'bubbly glass', 'liquid honey', 'fur', 'horse', 'fish scales'). Applying this means rendering the sketch *as if made of* this substance or capturing its defining visual characteristics on the surface.
- STYLE: Describes the overall artistic aesthetic or rendering technique (e.g., 'Studio Ghibli', 'cyberpunk', 'art deco', 'sketch'). Applying this means rendering the sketch *in* this aesthetic.

TASK:
1.  **Classify** the USER INPUT TERM ("${materialName}") into ONE category: MATERIAL or STYLE based on the DEFINITIONS. If it doesn't clearly fit STYLE, classify it as MATERIAL.
2.  **Based ONLY on the category you chose**, follow the corresponding instructions below to rewrite the BASE PROMPT. Integrate the specific details smoothly.
3.  **Generate a simple, descriptive 'suggestedName'**:
    *   Capitalize the main words of the USER INPUT TERM ("${materialName}").
    *   Keep it short and representative (usually 1-3 words).
    *   If the input is complex (e.g., "plants made of copper beads"), simplify it concisely (e.g., "Copper Plants").
    *   Examples: "fish" -> "Fish", "liquid honey" -> "Liquid Honey", "studio ghibli" -> "Studio Ghibli", "plants made of copper beads" -> "Copper Plants".
4.  Output ONLY a single valid JSON object: {"enhancedPrompt": "...", "suggestedName": "..."}. Do not include your classification reasoning or any other text outside the JSON.

--- CONDITIONAL INSTRUCTIONS ---

➡️ IF CLASSIFIED AS **MATERIAL**:
   Rewrite the base prompt to apply the characteristics or substance of '${materialName}' TO the sketched shape. Emphasize unique physical properties (texture, reflectivity, translucency, pattern, finish, etc.) and how they interact with professional studio lighting against a black background. Ensure the Cinema 4D / Octane rendering highlights these specific visual characteristics.
   **Use these examples for inspiration on detail and phrasing (DO NOT COPY VERBATIM):**
   *   *Chrome:* "Recreate this sketch as a physical chrome sculpture... highly reflective surfaces and sharp highlights characteristic of polished chrome."
   *   *Liquid Honey:* "Transform this sketch... rendered as if made entirely of thick, viscous, translucent liquid honey... highlight the honey's golden color, internal light scattering, and glossy surface sheen."
   *   *Soft Body:* "Convert this sketch into a soft body physics render made of a translucent, jelly-like material... highlight the material's subsurface scattering and wobbly surface properties."
   *   *(Implicit Horse/Fish Example):* For terms like 'horse' or 'fish', focus on applying their characteristic textures (e.g., 'short dense hair', 'overlapping scales') or essence to the existing shape, rather than modeling the animal itself.

➡️ IF CLASSIFIED AS **STYLE**:
   Rewrite the base prompt to render the sketch IN the style of '${materialName}'. Follow this structure:
   1.  **Interpretation:** State that the core elements from the sketch should be faithfully interpreted.
   2.  **Style Application:** Detail how the '${materialName}' aesthetic should be applied (linework, color palette, mood, rendering techniques). Adapt lighting/background if the style requires. Use C4D/Octane techniques adapted to the style.
   3.  **Goal:** The final image should clearly look like the '${materialName}' style applied to the specific sketch.
   **Use this 'Studio Ghibli' example for structure/depth inspiration (DO NOT COPY VERBATIM):**
   *   *Studio Ghibli Example Structure:* "First, faithfully interpret the core elements... Then, apply the following Studio Ghibli stylistic treatment: Aesthetic: Convert... Backgrounds: Use... Linework: Employ... Color: Utilize... Atmosphere: Infuse... Details: Add... Lighting: Implement... Goal: The final image must look like a high-quality Ghibli keyframe... Render using Cinema 4D and Octane..."

--- END OF CONDITIONAL INSTRUCTIONS ---

NOW, perform the classification for "${materialName}" (defaulting to MATERIAL if not clearly STYLE) and generate the required JSON output. Remember, ONLY the JSON.`;
    // --- End of updated prompt ---

    console.log(`Calling ${model.model} for simplified conditional prompt enhancement...`);
    const result = await model.generateContent(enhancementPrompt);
    const response = await result.response;
    const responseText = response.text();
    // --- Log the raw response ---
    console.log("Raw AI response text:", responseText);
    // ---

    try {
      let jsonResponse;
      // --- Attempt to extract JSON more robustly ---
      // 1. Look for JSON within ```json ... ``` markdown
      const markdownMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/);
      if (markdownMatch && markdownMatch[1]) {
        try {
          jsonResponse = JSON.parse(markdownMatch[1]);
          console.log("Parsed JSON from markdown block.");
        } catch (e) {
          console.warn("Failed to parse JSON from markdown block, trying direct parse.");
          jsonResponse = JSON.parse(responseText); // Fallback to direct parse
        }
      } else {
         // 2. If no markdown, try direct parse (might work if AI behaved)
        jsonResponse = JSON.parse(responseText);
        console.log("Parsed JSON directly.");
      }
      // --- End of robust extraction ---

      // Basic validation
      if (!jsonResponse || typeof jsonResponse.enhancedPrompt !== 'string' || typeof jsonResponse.suggestedName !== 'string') {
        // Ensure fields exist and are strings
        throw new Error("AI response missing required fields or fields are not strings.");
      }
      return res.status(200).json(jsonResponse);
    } catch (e) {
      console.error("Error parsing AI JSON response or invalid format:", e.message);
      console.error("Original AI text that failed parsing:", responseText); // Log the text again on error
      // Fallback if response isn't valid JSON after attempts
      return res.status(200).json({
        enhancedPrompt: basePrompt, // Use original base prompt
        suggestedName: materialName // Use original material name
      });
    }
  } catch (error) {
    console.error('Error enhancing prompt:', error);
    // Send 500 if anything in the main try block fails (API key, model call, etc.)
    return res.status(500).json({ error: 'Failed to enhance prompt' });
  }
} 