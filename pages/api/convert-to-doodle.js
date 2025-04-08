import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from 'next/server';

// Configuration for the API route
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb', // Increase limit to 10MB (adjust if needed)
    },
  },
};

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Add retry configuration
  const MAX_RETRIES = 2;
  const RETRY_DELAY = 1000; // 1 second
  let retryCount = 0;
  
  // Function to wait for a delay
  const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  try {
    const { imageData, customApiKey } = req.body;

    // Validate inputs
    if (!imageData) {
      return res.status(400).json({ error: 'Image data is required' });
    }

    // Set up the API key
    const apiKey = customApiKey || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('Missing Gemini API key');
      return res.status(500).json({ error: 'API key is not configured' });
    }

    // Retry loop for handling transient errors
    while (true) {
      try {
        console.log(`Initializing Gemini AI for doodle conversion (attempt ${retryCount + 1}/${MAX_RETRIES + 1})`);
        // Initialize the Gemini API
        const genAI = new GoogleGenerativeAI(apiKey);
        
        console.log('Configuring Gemini model');
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

        // Create the prompt for doodle conversion
        const prompt = `Could you please convert this image into a black and white doodle.
Requirements:
- Use ONLY pure black lines on a pure white background
- No gray tones or shading
- Maintain the key shapes and outlines
- Follow the original content but simplify if needed
- IMPORTANT: If this image contains any text, logo, or wordmark:
  * Simply convert it to black and white, and pass it through
  * Preserve ALL text exactly as it appears in the original
  * Maintain the exact spelling, letterspacing, and arrangement of letters
  * Keep text legible and clear with high contrast
  * Do not simplify or omit any text elements
  * Text should remain readable in the final doodle, and true to the original :))`;

        // Prepare the generation content
        console.log('Including image data in generation request');
        const generationContent = [
          {
            inlineData: {
              data: imageData,
              mimeType: "image/png"
            }
          },
          { text: prompt }
        ];

        // Generate content
        console.log(`Calling Gemini API for doodle conversion (attempt ${retryCount + 1}/${MAX_RETRIES + 1})...`);
        const result = await model.generateContent(generationContent);
        console.log('Gemini API response received');
        
        const response = await result.response;
        
        // Process the response to extract image data
        let convertedImageData = null;
        if (!response?.candidates?.[0]?.content?.parts) {
          console.error('Invalid response structure:', response);
          throw new Error('Invalid response structure from Gemini API');
        }
        
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            convertedImageData = part.inlineData.data;
            console.log('Found image data in response');
            break;
          }
        }

        if (!convertedImageData) {
          console.error('No image data in response parts:', response.candidates[0].content.parts);
          throw new Error('No image data found in response parts');
        }

        // Return the converted image data
        console.log('Successfully generated doodle');
        return res.status(200).json({
          success: true,
          imageData: convertedImageData
        });
        
      } catch (attemptError) {
        // Only retry certain types of errors that might be transient
        const isRetryableError = 
          attemptError.message?.includes('timeout') ||
          attemptError.message?.includes('network') ||
          attemptError.message?.includes('ECONNRESET') ||
          attemptError.message?.includes('rate limit') ||
          attemptError.message?.includes('503') ||
          attemptError.message?.includes('500') ||
          attemptError.message?.includes('overloaded') ||
          attemptError.message?.includes('connection');
          
        // Check if we should retry
        if (retryCount < MAX_RETRIES && isRetryableError) {
          console.log(`Retryable error encountered (${retryCount + 1}/${MAX_RETRIES}):`, attemptError.message);
          retryCount++;
          // Wait before retrying
          await wait(RETRY_DELAY * retryCount);
          continue;
        }
        
        // If we've exhausted retries or it's not a retryable error, rethrow
        throw attemptError;
      }
    }
  } catch (error) {
    console.error('Error in /api/convert-to-doodle:', error);
    
    // Check for specific error types
    if (error.message?.includes('quota') || error.message?.includes('Resource has been exhausted')) {
      return res.status(429).json({
        error: 'API quota exceeded. Please try again later or use your own API key.'
      });
    }

    if (error.message?.includes('API key')) {
      return res.status(500).json({
        error: 'Invalid or missing API key. Please check your configuration.'
      });
    }
    
    if (error.message?.includes('safety') || error.message?.includes('blocked') || error.message?.includes('harmful')) {
      return res.status(400).json({
        error: 'Content was blocked due to safety filters. Try a different prompt.'
      });
    }
    
    return res.status(500).json({
      error: error.message || 'An error occurred during conversion.',
      details: error.stack,
      retries: retryCount
    });
  }
} 