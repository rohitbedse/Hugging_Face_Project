import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';

// Define a fallback shape in case no reference image is provided and the file doesn't exist
// This is a simple white circle on black background encoded as base64
const DEFAULT_SHAPE_DATA_URL = 'data:image/png;base64,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';

// Helper function to read the image file
const loadImageData = (filePath) => {
  try {
    const absolutePath = path.resolve('./public', filePath); // Adjust if your public dir is elsewhere
    console.log(`Loading reference image from: ${absolutePath}`);
    if (fs.existsSync(absolutePath)) {
      const imageBuffer = fs.readFileSync(absolutePath);
      return imageBuffer.toString('base64');
    } else {
      console.error(`Reference image not found at: ${absolutePath}`);
      return null;
    }
  } catch (error) {
    console.error('Error loading reference image:', error);
    return null;
  }
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  console.log('Starting thumbnail generation request');
  
  try {
    const { prompt, referenceImageData } = req.body;
    
    if (!prompt) {
      console.error('Missing prompt in request');
      return res.status(400).json({ error: 'Prompt is required' });
    }

    console.log('Received prompt:', prompt.substring(0, 100));
    
    // Initialize the model
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-exp-image-generation",
      generationConfig: {
        temperature: 0.8,
        topP: 0.9,
        topK: 40,
        maxOutputTokens: 8192,
      }
    });

    // Get the base image data (either from request or default)
    const baseImageData = referenceImageData || DEFAULT_SHAPE_DATA_URL;
    console.log('Using reference image:', referenceImageData ? 'Custom' : 'Default');

    // Construct the prompt for the image model
    const imageGenerationPrompt = `Treat the object shown in the reference image (the white circle) as a simple 3D sphere. Apply the following material description or style directly onto this sphere...`;

    console.log('Generated image prompt:', imageGenerationPrompt.substring(0, 100));

    // Prepare generation content
    const generationContent = [
      { text: imageGenerationPrompt },
      {
        inlineData: {
          data: baseImageData,
          mimeType: "image/png"
        }
      },
    ];

    console.log('Calling Gemini API for image generation...');
    
    // Generate content
    const result = await model.generateContent(generationContent);
    const response = await result.response;

    console.log('Received response from Gemini API');
    
    // Process response
    let generatedImageData = null;
    // Safely access parts
    const parts = response?.candidates?.[0]?.content?.parts;
    
    if (!parts) {
      console.error('No parts in response:', JSON.stringify(response));
      throw new Error('No parts in response from Gemini API');
    }
    
    console.log('Processing response parts:', parts.length);
    
    if (Array.isArray(parts)) {
      for (const part of parts) {
        if (part.inlineData && part.inlineData.mimeType?.startsWith('image/')) {
          generatedImageData = part.inlineData.data;
          console.log('Found image data in response');
          break;
        }
      }
    }

    if (!generatedImageData) {
      console.error('No image data in response parts:', JSON.stringify(parts));
      throw new Error('No image data found in response parts');
    }

    console.log('Successfully generated thumbnail');
    return res.status(200).json({
      success: true,
      imageData: generatedImageData
    });
    
  } catch (error) {
    console.error('Error in thumbnail generation:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'An error occurred during thumbnail generation'
    });
  }
} 