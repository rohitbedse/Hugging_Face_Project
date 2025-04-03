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
    const { prompt, drawingData, customApiKey, generateTextOnly } = req.body;

    // Validate prompt
    if (!prompt) {
      console.error('Missing prompt in request');
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // Log the API request details (excluding the full drawing data for brevity)
    console.log('API Request:', {
      prompt: prompt.substring(0, 100) + '...',
      hasDrawingData: !!drawingData,
      hasCustomApiKey: !!customApiKey,
      generateTextOnly: !!generateTextOnly,
      retryCount
    });

    // Check API key
    const apiKey = customApiKey || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('Missing Gemini API key');
      return res.status(500).json({ error: 'API key is not configured' });
    }

    // Retry loop for handling transient errors
    while (true) {
      try {
        console.log(`Initializing Gemini AI with API key (attempt ${retryCount + 1}/${MAX_RETRIES + 1})`);
        const genAI = new GoogleGenerativeAI(apiKey);
        
        // Configure the model with settings based on the request type
        console.log('Configuring Gemini model');
        const model = genAI.getGenerativeModel({
          model: "gemini-2.0-flash-exp-image-generation",
          generationConfig: {
            temperature: 1,
            topP: 0.95,
            topK: 40,
            maxOutputTokens: 8192,
            responseModalities: generateTextOnly ? ["text"] : ["image", "text"]
          }
        });

        // Handle text-only generation
        if (generateTextOnly) {
          console.log('Generating text-only response');
          
          // Make text-only API call
          const result = await model.generateContent(prompt);
          const response = await result.response;
          
          // Extract text from response
          const textResponse = response.text();
          
          console.log('Generated text response:', textResponse.substring(0, 100) + '...');
          
          return res.status(200).json({
            success: true,
            textResponse: textResponse
          });
        }

        // For image generation, proceed as normal
        // Prepare the generation content
        let generationContent;
        if (drawingData) {
          console.log('Including drawing data in generation request');
          // If we have drawing data, include it in the request
          generationContent = [
            {
              inlineData: {
                data: drawingData,
                mimeType: "image/png"
              }
            },
            { text: prompt }
          ];
        } else {
          console.log('Using text-only prompt for generation');
          // Text-only prompt if no drawing
          generationContent = [{ text: prompt }];
        }

        console.log(`Calling Gemini API for image generation (attempt ${retryCount + 1}/${MAX_RETRIES + 1})...`);
        const result = await model.generateContent(generationContent);
        console.log('Gemini API response received');
        
        const response = await result.response;
        
        // Process the response to extract image data
        let imageData = null;
        if (!response?.candidates?.[0]?.content?.parts) {
          console.error('Invalid response structure:', response);
          throw new Error('Invalid response structure from Gemini API');
        }

        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            imageData = part.inlineData.data;
            console.log('Found image data in response');
            break;
          }
        }

        if (!imageData) {
          console.error('No image data in response parts:', response.candidates[0].content.parts);
          throw new Error('No image data found in response parts');
        }

        console.log('Successfully generated image');
        return res.status(200).json({
          success: true,
          imageData: imageData
        });
        
        // If we reach here, we succeeded, so break out of the retry loop
        break;
        
      } catch (attemptError) {
        // Only retry certain types of errors that might be transient
        const isRetryableError = 
          attemptError.message?.includes('timeout') ||
          attemptError.message?.includes('network') ||
          attemptError.message?.includes('ECONNRESET') ||
          attemptError.message?.includes('rate limit') ||
          attemptError.message?.includes('503') ||
          attemptError.message?.includes('500') ||
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
    console.error('Error in /api/generate:', error);
    
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
      error: error.message || 'An error occurred during generation.',
      details: error.stack,
      retries: retryCount
    });
  }
}
