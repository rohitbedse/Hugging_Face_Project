import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini API with error handling
const initializeGeminiAI = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set in environment variables');
  }
  return new GoogleGenerativeAI(apiKey);
};

// Configure API route options
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb' // Increase the body size limit to 10MB for larger images
    }
  }
};

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  try {
    const { image, customApiKey } = req.body;
    if (!image) {
      return res.status(400).json({ error: 'Image is required' });
    }

    // Extract base64 data
    const base64Data = image.split(',')[1];
    if (!base64Data) {
      return res.status(400).json({ error: 'Invalid image format' });
    }

    // Initialize Gemini with the appropriate API key
    const apiKey = customApiKey || process.env.GEMINI_API_KEY;
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    // Prepare the image parts
    const imageParts = [
      {
        inlineData: {
          data: base64Data,
          mimeType: "image/jpeg"
        }
      }
    ];

    // Create the prompt - Updated for clarity and better results
    const prompt = `Analyze this reference image/moodboard and create a detailed material prompt for a 3D rendering that captures its essence and visual qualities.
    The prompt should follow this format and style, but be unique and creative:
    
    Example 1: "Recreate this doodle as a physical chrome sculpture made of chromium metal tubes or pipes in a professional studio setting. If it is typography, render it accordingly, but always have a black background and studio lighting. Render it in Cinema 4D with Octane, using studio lighting against a pure black background. Make it look like a high-end product rendering of a sculptural piece."
    
    Example 2: "Convert this drawing / text into a soft body physics render. Render it as if made of a soft, jelly-like material that responds to gravity and motion. Add realistic deformation, bounce, and squash effects typical of soft body dynamics. Use dramatic lighting against a black background to emphasize the material's translucency and surface properties. Make it look like a high-end 3D animation frame"
    
    Create a new, unique prompt based on the visual qualities of the uploaded image that follows a similar style but is completely different from the examples.
    Focus on:
    1. Material properties (metallic, glass, fabric, liquid, etc.)
    2. Lighting and environment (studio, dramatic, moody, etc.)
    3. Visual style (high-end, realistic, stylized, etc.)
    4. Rendering technique (Cinema 4D, Octane, etc.)
    
    Also suggest a short, memorable name for this material style (1-2 words) based on the key visual characteristics.
    
    Format the response as JSON with 'prompt' and 'suggestedName' fields.`;

    console.log('Calling Gemini Vision API for image analysis...');
    
    // Generate content
    const result = await model.generateContent([prompt, ...imageParts]);
    const response = result.response;
    const responseText = response.text();
    
    console.log('Received response from Gemini');

    // Try to parse as JSON, fallback to text if needed
    try {
      // First try direct parse
      const jsonResponse = JSON.parse(responseText);
      return res.status(200).json(jsonResponse);
    } catch (e) {
      console.log('Response not in JSON format, attempting to extract JSON');
      
      // Try to extract JSON from text response
      try {
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const extractedJson = JSON.parse(jsonMatch[0]);
          return res.status(200).json(extractedJson);
        }
      } catch (extractError) {
        console.error('Failed to extract JSON from response:', extractError);
      }
      
      // If all parsing attempts fail, create structured response from text
      const lines = responseText.split('\n');
      let suggestedName = 'Custom Material';
      
      // Try to find a name in the response
      for (const line of lines) {
        if (line.toLowerCase().includes('name:') || line.toLowerCase().includes('suggested name:')) {
          const namePart = line.split(':')[1];
          if (namePart && namePart.trim()) {
            suggestedName = namePart.trim();
            // Remove quotes if present
            suggestedName = suggestedName.replace(/^["'](.*)["']$/, '$1');
            break;
          }
        }
      }
      
      return res.status(200).json({
        prompt: responseText,
        suggestedName
      });
    }
  } catch (error) {
    console.error('Error in analyze-image:', error);
    
    // Check for quota exceeded errors
    if (error.message?.includes('quota') || error.message?.includes('Resource has been exhausted')) {
      return res.status(429).json({
        error: 'API quota exceeded. Please try again later or use your own API key.'
      });
    }
    
    return res.status(500).json({ 
      error: 'Failed to analyze image',
      details: error.message 
    });
  }
} 