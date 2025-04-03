import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Extract API key from request
  const { apiKey } = req.body;

  if (!apiKey) {
    return res.status(400).json({ 
      valid: false,
      error: 'No API key provided'
    });
  }

  try {
    // Initialize the Gemini API
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Use a simple model call with minimal tokens to check key validity
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: 0,
        maxOutputTokens: 10
      }
    });

    // Make a simple API call to test the key
    const prompt = "Respond with 'valid' and nothing else.";
    const result = await model.generateContent(prompt);
    const response = await result.response;
    
    // If we get here, the key is valid
    return res.status(200).json({
      valid: true
    });
  } catch (error) {
    console.error('API key validation error:', error.message);
    
    // Check if the error is due to an invalid API key
    if (
      error.message?.includes('invalid API key') || 
      error.message?.includes('API key not valid') ||
      error.message?.includes('403')
    ) {
      return res.status(200).json({
        valid: false,
        error: 'Invalid API key'
      });
    }
    
    // For other errors (like network issues), consider the key potentially valid
    // to avoid disrupting users unnecessarily
    return res.status(200).json({
      valid: true,
      warning: 'Could not fully validate key due to error: ' + error.message
    });
  }
} 