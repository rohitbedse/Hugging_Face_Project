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

## Developer Features

### Debug Mode

For development and testing purposes, the application includes a debug mode to help troubleshoot API quota issues:

- **Enabling Debug Mode** (OFF by default): 
  - Add `?debug=true` to the URL
  - Or toggle the debug button in the error modal (development environment only)
  - Or set `debugMode=true` in localStorage

- **Disabling Debug Mode**:
  - Add `?debug=false` to the URL to override any localStorage setting
  - Toggle the debug button to OFF in the error modal
  - Clearing browser data for the site will also reset it to OFF

- **Features**:
  - Automatically displays the API quota error modal for testing
  - Debug status is persisted in localStorage between sessions
  - Visible debug toggle in the error modal

This mode is only fully available in development environments (`NODE_ENV === 'development'`).

## Technology Stack

This is a [Next.js](https://nextjs.org) project that uses:
- Next.js for the frontend and API routes
- Google's Gemini 2.0 API for image generation
- Canvas API for drawing functionality
