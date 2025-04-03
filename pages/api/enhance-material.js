import { GoogleGenerativeAI } from '@google/generative-ai';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Extract material description from request body
    const { materialDescription } = req.body;
    
    if (!materialDescription) {
      return res.status(200).json({ 
        name: 'Unknown Material',
        details: 'Add standard material properties with accurate surface texturing.' 
      });
    }
    
    // Initialize the Google Generative AI with API key
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("Missing GEMINI_API_KEY");
      // Return a 200 with fallback data instead of error
      return res.status(200).json({ 
        name: materialDescription,
        details: `Emphasize the characteristic properties of ${materialDescription.toLowerCase()} with accurate surface texturing.` 
      });
    }
    
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: "gemini-pro",
        generationConfig: {
          temperature: 0.7,
          topP: 0.8,
          topK: 40
        }
      });

      // Create prompt for material enhancement
      const prompt = `Given the material description "${materialDescription}", provide:
      1. A concise material name (2-3 words maximum, keep original name if simple enough)
      2. Please provide contextual, specific material properties to enhance the existing prompt:
      "Transform this sketch into a [material] material. Render it in a high-end 3D visualization style with professional studio lighting against a pure black background. Make it look like an elegant Cinema 4D and Octane rendering with detailed material properties and characteristics. The final result should be a premium product visualization with perfect studio lighting, crisp shadows, and high-end material definition."

      Format response STRICTLY as JSON:
      {
        "name": "Material Name",
        "details": "Only additional material properties,"
      }

      Requirements:
      - Keep name simple if input is already concise (e.g., "rusted iron" stays as "Rusted Iron")
      - Simplify complex descriptions (e.g., "glass beads made of fire" becomes "Molten Glass")
      - Details should focus on physical properties, visual characteristics, and rendering techniques. Feel free to be creative! :)
      - Do not repeat what's already in the base prompt (black background, lighting, etc)
      - Keep details concise and technical`;

      // Generate content with the model
      const result = await model.generateContent(prompt);
      const response = result.response;
      const responseText = response.text();

      try {
        // Try to parse the response as JSON
        const jsonResponse = JSON.parse(responseText);
        
        // Validate the response format
        if (!jsonResponse.name || !jsonResponse.details) {
          throw new Error('Invalid response format from AI');
        }

        return res.status(200).json(jsonResponse);
      } catch (error) {
        console.error('Error parsing AI response or invalid format:', error.message);
        
        // Fallback: Use the original description, capitalized, and provide empty details.
        // This keeps the JSON structure consistent for the frontend.
        const capitalizedName = materialDescription
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(' ');
        
        return res.status(200).json({
          name: capitalizedName,
          details: ""
        });
      }
    } catch (aiError) {
      console.error('Error calling Generative AI Model:', aiError);
      // Fallback if the AI call itself fails
      const capitalizedName = materialDescription
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
      
      return res.status(500).json({
        name: capitalizedName,
        details: ""
      });
    }
  } catch (error) {
    // Catch errors before AI initialization (e.g., API key issue)
    console.error('API handler setup error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 