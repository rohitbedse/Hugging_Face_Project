import { GoogleGenerativeAI } from '@google/generative-ai';

// Configure API route options
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb' // Increase the body size limit to 10MB for larger images
    }
  }
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { image, basePrompt } = req.body;
    if (!image) {
      return res.status(400).json({ error: 'Image is required' });
    }

    // Extract base64 data
    const base64Data = image.split(',')[1];
    if (!base64Data) {
      return res.status(400).json({ error: 'Invalid image format' });
    }

    // Use custom API key if provided, else use environment variable
    const apiKey = req.body.customApiKey || process.env.GEMINI_API_KEY;
    const genAI = new GoogleGenerativeAI(apiKey);

    // Use the image-capable model with text output configuration
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-exp-image-generation", // Use the required model with image capabilities
      generationConfig: {
        temperature: 0.8,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 8192,
        responseModalities: ["text"] // Explicitly request only text output
      }
    });

    // Prepare the image parts
    const imageParts = [
      {
        inlineData: {
          data: base64Data,
          mimeType: "image/jpeg"
        }
      }
    ];

    // Create the prompt for analyzing the image and generating material details
    const defaultBasePrompt = "Transform this sketch into a material with professional studio lighting against a pure black background. Render it in Cinema 4D with Octane for a high-end 3D visualization.";
    const enhancementPrompt = `CONTEXT: You are an expert AI assisting with 3D prompt generation. Your task is to analyze the uploaded reference image, extract its key visual qualities, and generate an enhanced 3D rendering prompt for Cinema 4D and Octane based on these visual qualities.

BASE PROMPT TO REWRITE: "${basePrompt || defaultBasePrompt}" // (Note: C4D/Octane, black background, studio lighting should generally be maintained unless the image style dictates otherwise).

TASK:
1. **Analyze the image** to identify its dominant visual characteristics:
   * Material properties
   * Texture patterns and surface details
   * Color schemes and visual style
   * Lighting and mood
   * Any special effects or unique visual elements

2. **Generate an enhanced prompt** that:
   * Accurately captures the essence of the reference image's material/style
   * Provides clear direction for a 3D artist to recreate similar visual qualities
   * Includes specific details about textures, lighting, rendering techniques
   * Maintains the Cinema 4D/Octane rendering requirements with studio lighting and black background (unless style requires otherwise)

3. **Generate a simple, descriptive 'suggestedName'**:
   * Create a concise, memorable name (1-3 words) that captures the essence of the material/style
   * Capitalize main words
   * Examples: "Liquid Gold", "Frosted Glass", "Neon Wire", "Velvet Fabric"

4. Output ONLY a single valid JSON object: {"enhancedPrompt": "...", "suggestedName": "..."}. Do not include your analysis reasoning or any other text outside the JSON.

EXAMPLES OF GOOD RESPONSES:
* For a chrome metal image: {"enhancedPrompt": "Recreate this sketch as a physical chrome sculpture with highly reflective surfaces that catch and distort reflections. Render it in Cinema 4D with Octane, using professional studio lighting against a pure black background to highlight the mirror-like finish and metallic sheen.", "suggestedName": "Chrome Metal"}
* For a honey-like substance: {"enhancedPrompt": "Transform this sketch into a form made of translucent amber honey with thick, viscous properties. Capture the way light penetrates and scatters within the golden material, creating rich internal glow. Render in Cinema 4D with Octane against a black background with dramatic studio lighting to emphasize the material's refraction, high-gloss surface, and organic flowing behavior.", "suggestedName": "Liquid Honey"}`;

    console.log('Calling Gemini Vision API for image analysis and prompt enhancement...');
    
    // Generate content by sending both the text prompt and image
    const result = await model.generateContent([enhancementPrompt, ...imageParts]);
    const response = await result.response;
    const responseText = response.text();
    
    console.log('Received response from Gemini');
    console.log("Raw AI response text:", responseText);

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
        try {
          jsonResponse = JSON.parse(responseText);
          console.log("Parsed JSON directly.");
        } catch (e) {
          console.log('Response not in JSON format, attempting to extract JSON');
          
          // Try to extract JSON from text response
          const jsonMatch = responseText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            jsonResponse = JSON.parse(jsonMatch[0]);
            console.log("Extracted JSON using regex.");
          } else {
            throw new Error("Could not extract JSON from response");
          }
        }
      }
      // --- End of robust extraction ---

      // Basic validation
      if (!jsonResponse || typeof jsonResponse.enhancedPrompt !== 'string' || typeof jsonResponse.suggestedName !== 'string') {
        // Ensure fields exist and are strings
        throw new Error("AI response missing required fields or fields are not strings.");
      }

      // Now let's generate a thumbnail using the enhanced prompt
      console.log("Generating thumbnail with enhanced prompt");
      
      // Variable to store the thumbnail image data
      let thumbnailImageData = null;
      
      try {
        // Create a new model instance configured for image generation
        const thumbnailModel = genAI.getGenerativeModel({
          model: "gemini-2.0-flash-exp-image-generation",
          generationConfig: {
            temperature: 0.8,
            topP: 0.9,
            topK: 40,
            maxOutputTokens: 8192,
            responseModalities: ["image", "text"] // Include both image and text modalities
          }
        });

        // Create a thumbnail generation prompt that applies the material to a sphere
        const thumbnailPrompt = `Using this uploaded reference image only as visual inspiration for material properties, create a clean isolated 3D sphere with the following material applied to it:

Material Description: "${jsonResponse.enhancedPrompt}"

Requirements:
- Create a simple 3D sphere (like a white ball) against a pure black background
- Apply only the material described above to the sphere
- Use professional studio lighting to showcase the material properties
- The sphere should take up most of the frame
- The final result should be a clean, professional material preview
- Do NOT maintain the original shape or content of the reference image
- Focus ONLY on accurately representing the material properties on a sphere`;

        // Prepare the generation content - order is important!
        const generationContent = [
          {
            inlineData: {
              data: base64Data,
              mimeType: "image/jpeg"
            }
          },
          { text: thumbnailPrompt }
        ];

        // Generate content
        const thumbnailResult = await thumbnailModel.generateContent(generationContent);
        const thumbnailResponse = await thumbnailResult.response;
        
        // Extract the image data from the response
        for (const part of thumbnailResponse.candidates[0].content.parts) {
          if (part.inlineData) {
            thumbnailImageData = part.inlineData.data;
            break;
          }
        }

        // Check if we got image data back
        if (!thumbnailImageData) {
          console.error('No image data received from the Gemini API for thumbnail generation');
          // Continue without thumbnail but don't fail the whole request
        }
      } catch (thumbnailError) {
        console.error('Error generating thumbnail:', thumbnailError);
        // Continue without failing the whole request
        // thumbnailImageData remains null
      }

      // Return the complete response with both text and image data
      return res.status(200).json({
        enhancedPrompt: jsonResponse.enhancedPrompt,
        suggestedName: jsonResponse.suggestedName,
        imageData: thumbnailImageData
      });
      
    } catch (e) {
      console.error("Error processing AI response:", e.message);
      console.error("Original AI text that failed processing:", responseText);
      
      // Create a fallback response
      const fallbackName = "Custom Material";
      const fallbackPrompt = basePrompt || defaultBasePrompt;
      
      return res.status(200).json({
        enhancedPrompt: fallbackPrompt,
        suggestedName: fallbackName,
        imageData: null // No thumbnail in fallback case
      });
    }
  } catch (error) {
    console.error('Error in visual-enhance-prompt:', error);
    
    // Check for quota exceeded errors
    if (error.message?.includes('quota') || error.message?.includes('Resource has been exhausted')) {
      return res.status(429).json({
        error: 'API quota exceeded. Please try again later or use your own API key.'
      });
    }
    
    return res.status(500).json({ 
      error: 'Failed to process image',
      details: error.message 
    });
  }
} 