import { GoogleGenerativeAI } from "@google/generative-ai";

// Configure API route options
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb' // Increase the body size limit to 10MB
    }
  }
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { prompt, imageData, customApiKey } = req.body;

    // Use custom API key if provided
    const apiKey = customApiKey || process.env.GEMINI_API_KEY;
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Configure the model with the correct settings
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-exp-image-generation",
      generationConfig: {
        temperature: 1,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 8192,
        responseModalities: ["image", "text"]
      }
    });

    // Prepare a more specific prompt for the refinement
    const refinementPrompt = `Please refine this image according to the following instruction: "${prompt}". 
    Maintain the artistic quality and style while applying the requested changes.
    Ensure the output is a high-quality image that preserves the original intent while incorporating the refinement.`;

    // Prepare the generation content with both image and prompt
    const generationContent = [
      {
        inlineData: {
          data: imageData,
          mimeType: "image/png"
        }
      },
      { text: refinementPrompt }
    ];

    // Generate content with the image and prompt
    const result = await model.generateContent(generationContent);
    const response = await result.response;
    
    // Process the response to extract image data
    let refinedImageData = null;
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        refinedImageData = part.inlineData.data;
        break;
      }
    }

    if (!refinedImageData) {
      throw new Error('No image data received from the API');
    }

    // Return the refined image data
    return res.status(200).json({
      success: true,
      imageData: refinedImageData
    });
  } catch (error) {
    console.error('Error in /api/refine:', error);
    
    // Check for specific error types
    if (error.message?.includes('quota') || error.message?.includes('Resource has been exhausted')) {
      return res.status(429).json({
        error: 'API quota exceeded. Please try again later or use your own API key.'
      });
    }
    
    return res.status(500).json({
      error: 'An error occurred during image refinement.'
    });
  }
} 