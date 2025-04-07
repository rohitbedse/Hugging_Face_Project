---
title: Gemini 3D Co-Drawing
emoji: 🌖
colorFrom: yellow
colorTo: indigo
sdk: docker
pinned: false
license: apache-2.0
app_port: 3000
short_description: 'Gemini native image for 3D co-drawing'
---

# Gemini 3D Co-Drawing

A collaborative drawing application powered by Google's Gemini 2.0 API for image generation. This app allows users to create drawings and have Gemini enhance or add to them based on text prompts.

This ONLY uses the base Gemini API to generate.

## API Key Setup

To use this application, you'll need a Google AI Studio API key:

1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey) (https://ai.dev)
2. Create a new API key or use an existing one
3. Put your API key in a `.env` file. 

```
GEMINI_API_KEY={your_key}
```

The free tier includes generous usage limits, but you can also upgrade for additional capacity.

## Technology Stack

This is a [Next.js](https://nextjs.org) project that uses:
- Next.js for the frontend and API routes
- Google's Gemini 2.0 API for image generation
- Canvas API for drawing functionality
