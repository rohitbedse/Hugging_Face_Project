import { useState, useRef, useEffect, useCallback } from "react";
import Canvas from "./Canvas";
import DisplayCanvas from "./DisplayCanvas";
import ToolBar from "./ToolBar";
import StyleSelector from "./StyleSelector";
import { getPromptForStyle, styleOptions, addMaterialToLibrary } from "./StyleSelector";
import ActionBar from "./ActionBar";
import ErrorModal from "./ErrorModal";
import TextInput from "./TextInput";
import Header from "./Header";
import DimensionSelector from "./DimensionSelector";
import HistoryModal from "./HistoryModal";
import BottomToolBar from "./BottomToolBar";
import LibraryPage from "./LibraryPage";
import {
  getCoordinates,
  initializeCanvas,
  drawImageToCanvas,
  drawBezierCurve,
} from "./utils/canvasUtils";
import { toast } from "react-hot-toast";
import { Download, History as HistoryIcon, RefreshCw as RefreshIcon, Library as LibraryIcon, LoaderCircle } from "lucide-react";
import OutputOptionsBar from "./OutputOptionsBar";
import ApiKeyModal from "./ApiKeyModal";
import HeaderButtons from "./HeaderButtons";

const CanvasContainer = () => {
  // Check if the device is mobile based on screen width
  const isMobileDevice = () => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 768; // Common breakpoint for mobile devices
    }
    return false; // Default to desktop on server-side
  };

  // Get default dimensions based on device type
  const getDefaultDimension = () => {
    if (isMobileDevice()) {
      // Square (1:1) for mobile
      return {
        id: "square",
        label: "1:1",
        width: 1000,
        height: 1000,
      };
    } else {
      // Landscape (3:2) for desktop
      return {
        id: "landscape",
        label: "3:2",
        width: 1500,
        height: 1000,
      };
    }
  };

  const canvasRef = useRef(null);
  const canvasComponentRef = useRef(null);
  const displayCanvasRef = useRef(null);
  const backgroundImageRef = useRef(null);
  const [currentDimension, setCurrentDimension] = useState(getDefaultDimension());
  const [isDrawing, setIsDrawing] = useState(false);
  const [penColor, setPenColor] = useState("#000000");
  const [penWidth, setPenWidth] = useState(2);
  const colorInputRef = useRef(null);
  const [prompt, setPrompt] = useState("");
  const [generatedImage, setGeneratedImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [customApiKey, setCustomApiKey] = useState("");
  const [debugMode, setDebugMode] = useState(false);
  const [styleMode, setStyleMode] = useState("material");
  const [strokeCount, setStrokeCount] = useState(0);
  const strokeTimeoutRef = useRef(null);
  const [lastRequestTime, setLastRequestTime] = useState(0);
  const MIN_REQUEST_INTERVAL = 2000; // Minimum 2 seconds between requests
  const [currentTool, setCurrentTool] = useState("pencil"); // 'pencil', 'pen', 'eraser', 'text', 'rect', 'circle', 'line', 'star'
  const [isTyping, setIsTyping] = useState(false);
  const [undoStack, setUndoStack] = useState([]);
  const [bezierPoints, setBezierPoints] = useState([]);
  const [textInput, setTextInput] = useState("");
  const [textPosition, setTextPosition] = useState({ x: 0, y: 0 });
  const textInputRef = useRef(null);
  const [isPenDrawing, setIsPenDrawing] = useState(false);
  const [currentBezierPath, setCurrentBezierPath] = useState([]);
  const [tempPoints, setTempPoints] = useState([]);
  const [hasGeneratedContent, setHasGeneratedContent] = useState(false);
  const [imageHistory, setImageHistory] = useState([]);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [hasDrawing, setHasDrawing] = useState(false);
  // Add a ref to track style changes that need regeneration
  const needsRegenerationRef = useRef(false);
  // Add a ref to track if regeneration was manually triggered
  const isManualRegenerationRef = useRef(false);
  const [isSendingToDoodle, setIsSendingToDoodle] = useState(false);
  // Add state for API key modal
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);
  // Add state for template loading 
  const [isTemplateLoading, setIsTemplateLoading] = useState(false);
  const [templateLoadingMessage, setTemplateLoadingMessage] = useState("");

  // Load saved API key from localStorage on component mount
  useEffect(() => {
    const savedApiKey = localStorage.getItem("geminiApiKey");
    if (savedApiKey) {
      setCustomApiKey(savedApiKey);
      // Validate the API key silently
      validateApiKey(savedApiKey);
    }
    
    // Check if debug mode is enabled in localStorage or URL
    const debugParam = new URLSearchParams(window.location.search).get('debug');
    // Only look at localStorage if debug parameter is not explicitly set to false
    const savedDebug = debugParam !== "false" && localStorage.getItem("debugMode") === "true";
    
    if (debugParam === "true" || savedDebug) {
      // Set debug mode to true AND show error modal
      setDebugMode(true);
      setShowErrorModal(true);
    } else {
      // Ensure debug mode is OFF by default
      setDebugMode(false);
      // Also clean up any stale localStorage value
      if (localStorage.getItem("debugMode") === "true") {
        localStorage.setItem("debugMode", "false");
      }
    }
  }, []);

  // Add effect to save debug mode to localStorage
  useEffect(() => {
    // Always save the current state to localStorage
    localStorage.setItem("debugMode", debugMode.toString());
    
    // ONLY auto-show error modal when debug mode is enabled
    if (debugMode === true) {
      setShowErrorModal(true);
    }
  }, [debugMode]);

  // Add a function to validate the API key
  const validateApiKey = async (apiKey) => {
    if (!apiKey) return;
    
    try {
      const response = await fetch("/api/validate-key", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ apiKey }),
      });
      
      const data = await response.json();
      
      if (!data.valid) {
        console.warn("Invalid API key detected, will be cleared");
        // Clear the invalid key
        localStorage.removeItem("geminiApiKey");
        setCustomApiKey("");
        // Don't show error to user for now - they'll see it when trying to use the app
      }
    } catch (error) {
      console.error("Error validating API key:", error);
      // Don't clear the key on connection errors
    }
  };

  // Load background image when generatedImage changes
  useEffect(() => {
    if (generatedImage && canvasRef.current) {
      // Use the window.Image constructor to avoid conflict with Next.js Image component
      const img = new window.Image();
      img.onload = () => {
        backgroundImageRef.current = img;
        drawImageToCanvas(canvasRef.current, backgroundImageRef.current);
      };
      img.src = generatedImage;
    }
  }, [generatedImage]);

  // Initialize canvas with white background when component mounts
  useEffect(() => {
    if (canvasRef.current) {
      initializeCanvas(canvasRef.current);
    }

    // Also initialize the display canvas
    if (displayCanvasRef.current) {
      const displayCtx = displayCanvasRef.current.getContext("2d");
      displayCtx.fillStyle = "#FFFFFF";
      displayCtx.fillRect(
        0,
        0,
        displayCanvasRef.current.width,
        displayCanvasRef.current.height
      );
    }
  }, []);

  // Add resize listener to update dimensions when switching between mobile and desktop
  useEffect(() => {
    let isMobile = isMobileDevice();
    
    const handleResize = () => {
      const newIsMobile = isMobileDevice();
      // Only update dimensions if the device type changed (mobile <-> desktop)
      if (newIsMobile !== isMobile) {
        isMobile = newIsMobile;
        
        // Only update dimensions if the canvas is empty (no drawing)
        if (canvasRef.current && !hasDrawing && !hasGeneratedContent) {
          setCurrentDimension(getDefaultDimension());
        }
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [hasDrawing, hasGeneratedContent]);

  // Add an effect to sync canvas dimensions when they change
  useEffect(() => {
    if (canvasRef.current && displayCanvasRef.current) {
      // Ensure both canvases have the same dimensions
      canvasRef.current.width = currentDimension.width;
      canvasRef.current.height = currentDimension.height;
      displayCanvasRef.current.width = currentDimension.width;
      displayCanvasRef.current.height = currentDimension.height;

      // Initialize both canvases with white backgrounds
      initializeCanvas(canvasRef.current);

      const displayCtx = displayCanvasRef.current.getContext("2d");
      displayCtx.fillStyle = "#FFFFFF";
      displayCtx.fillRect(
        0,
        0,
        displayCanvasRef.current.width,
        displayCanvasRef.current.height
      );
    }
  }, [currentDimension]);

  const startDrawing = (e) => {
    const { x, y } = getCoordinates(e, canvasRef.current);

    if (e.type === "touchstart") {
      e.preventDefault();
    }

    console.log("startDrawing called", { currentTool, x, y });

    const ctx = canvasRef.current.getContext("2d");

    // Set up the line style at the start of drawing
    ctx.lineWidth = currentTool === "eraser" ? 20 : penWidth;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = currentTool === "eraser" ? "#FFFFFF" : penColor;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setStrokeCount((prev) => prev + 1);

    // Save canvas state before drawing
    saveCanvasState();
  };

  const draw = (e) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const { x, y } = getCoordinates(e, canvas);

    // Occasionally log drawing activity
    if (Math.random() < 0.05) {
      // Only log ~5% of move events to avoid console spam
      console.log("draw called", { currentTool, isDrawing, x, y });
    }

    // Set up the line style before drawing
    ctx.lineWidth = currentTool === "eraser" ? 60 : penWidth * 4; // Pen width now 4x original size
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    if (currentTool === "eraser") {
      ctx.strokeStyle = "#FFFFFF";
    } else {
      ctx.strokeStyle = penColor;
    }

    if (currentTool === "pen") {
      // Show preview line while moving
      if (tempPoints.length > 0) {
        const lastPoint = tempPoints[tempPoints.length - 1];
        ctx.beginPath();
        ctx.moveTo(lastPoint.x, lastPoint.y);
        ctx.lineTo(x, y);
        ctx.stroke();
      }
    } else {
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  };

  const stopDrawing = async (e) => {
    console.log("stopDrawing called in CanvasContainer", {
      isDrawing,
      currentTool,
      hasEvent: !!e,
      eventType: e ? e.type : "none",
    });

    if (!isDrawing) return;
    setIsDrawing(false);

    // Remove the timeout-based generation
    if (strokeTimeoutRef.current) {
      clearTimeout(strokeTimeoutRef.current);
      strokeTimeoutRef.current = null;
    }

    // The Canvas component will handle generation for pen and pencil tools directly
    // This function now primarily handles stroke counting for other tools

    // Only generate on mouse/touch up events when not using the pen or pencil tool
    // (since those are handled by the Canvas component)
    if (
      e &&
      (e.type === "mouseup" || e.type === "touchend") &&
      currentTool !== "pen" &&
      currentTool !== "pencil"
    ) {
      console.log("stopDrawing: detected mouseup/touchend event", {
        strokeCount,
      });
      // Check if we have enough strokes to generate (increased to 10 from 3)
      if (strokeCount >= 10) {
        console.log(
          "stopDrawing: calling handleGeneration due to stroke count"
        );
        await handleGeneration();
        setStrokeCount(0);
      }
    }
  };

  const clearCanvas = () => {
    // If we have a ref to our Canvas component, use its custom clear method
    if (canvasComponentRef.current?.handleClearCanvas) {
      canvasComponentRef.current.handleClearCanvas();
      return;
    }

    // Fallback to original implementation
    const canvas = canvasRef.current;
    if (!canvas) return;

    initializeCanvas(canvas);

    setGeneratedImage(null);
    backgroundImageRef.current = null;

    // Also clear the display canvas and reset generated content flag
    if (displayCanvasRef.current) {
      const displayCtx = displayCanvasRef.current.getContext("2d");
      displayCtx.clearRect(
        0,
        0,
        displayCanvasRef.current.width,
        displayCanvasRef.current.height
      );
      displayCtx.fillStyle = "#FFFFFF";
      displayCtx.fillRect(
        0,
        0,
        displayCanvasRef.current.width,
        displayCanvasRef.current.height
      );
      setHasGeneratedContent(false);
    }

    // Save empty canvas state
    saveCanvasState();
  };

  const handleGeneration = useCallback(
    async (isManualRegeneration = false) => {
      console.log("handleGeneration called", { isManualRegeneration });

      // Set our ref if this is a manual regeneration
      if (isManualRegeneration) {
        isManualRegenerationRef.current = true;
      }

      // Remove the time throttling for automatic generation after doodle conversion
      // but keep it for manual generations
      const isAutoGeneration = !lastRequestTime && !isManualRegeneration;
      if (!isAutoGeneration) {
        const now = Date.now();
        if (now - lastRequestTime < MIN_REQUEST_INTERVAL) {
          console.log("Request throttled - too soon after last request");
          return;
        }
        setLastRequestTime(now);
      }

      if (!canvasRef.current) return;

      console.log("Starting generation process");

      // Check if we're already in a loading state before setting it
      if (!isLoading) {
        setIsLoading(true);
      }

      try {
        const canvas = canvasRef.current;
        const tempCanvas = document.createElement("canvas");
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        const tempCtx = tempCanvas.getContext("2d");

        tempCtx.fillStyle = "#FFFFFF";
        tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
        tempCtx.drawImage(canvas, 0, 0);

        const drawingData = tempCanvas.toDataURL("image/png").split(",")[1];

        const materialPrompt = getPromptForStyle(styleMode);

        const requestPayload = {
          prompt: materialPrompt,
          drawingData,
          customApiKey,
        };

        console.log("Making API request with style:", styleMode);
        console.log(`Using prompt: ${materialPrompt.substring(0, 100)}...`);

        const response = await fetch("/api/generate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestPayload),
        });

        console.log("API response received, status:", response.status);

        const data = await response.json();

        if (data.success && data.imageData) {
          console.log("Image generated successfully");
          const imageUrl = `data:image/png;base64,${data.imageData}`;

          // Draw the generated image to the display canvas
          const displayCanvas = displayCanvasRef.current;
          if (!displayCanvas) {
            console.error("Display canvas ref is null");
            return;
          }

          const displayCtx = displayCanvas.getContext("2d");

          // Clear the display canvas first
          displayCtx.clearRect(0, 0, displayCanvas.width, displayCanvas.height);
          displayCtx.fillStyle = "#FFFFFF";
          displayCtx.fillRect(0, 0, displayCanvas.width, displayCanvas.height);

          // Create and load the new image
          const img = new Image();

          // Set up the onload handler before setting the src
          img.onload = () => {
            console.log("Generated image loaded, drawing to display canvas");

            // Clear the canvas first
            displayCtx.clearRect(
              0,
              0,
              displayCanvas.width,
              displayCanvas.height
            );

            // Fill with black background for letterboxing
            displayCtx.fillStyle = "#000000";
            displayCtx.fillRect(
              0,
              0,
              displayCanvas.width,
              displayCanvas.height
            );

            // Calculate aspect ratios
            const imgRatio = img.width / img.height;
            const canvasRatio = displayCanvas.width / displayCanvas.height;

            let drawWidth, drawHeight, x, y;

            if (imgRatio > canvasRatio) {
              // Image is wider than canvas (relative to height)
              drawWidth = displayCanvas.width;
              drawHeight = displayCanvas.width / imgRatio;
              x = 0;
              y = (displayCanvas.height - drawHeight) / 2;
            } else {
              // Image is taller than canvas (relative to width)
              drawHeight = displayCanvas.height;
              drawWidth = displayCanvas.height * imgRatio;
              x = (displayCanvas.width - drawWidth) / 2;
              y = 0;
            }

            // Draw the image with letterboxing
            displayCtx.drawImage(img, x, y, drawWidth, drawHeight);

            // Update our state to indicate we have generated content
            setHasGeneratedContent(true);

            // Add to history
            setImageHistory((prev) => [
              ...prev,
              {
                imageUrl,
                timestamp: Date.now(),
                drawingData: canvas.toDataURL(),
                styleMode,
                dimensions: currentDimension,
              },
            ]);
          };

          // Set the src to trigger loading
          img.src = imageUrl;
        } else {
          console.error("Failed to generate image:", data.error);

          // When generation fails, ensure display canvas is cleared
          if (displayCanvasRef.current) {
            const displayCtx = displayCanvasRef.current.getContext("2d");
            displayCtx.clearRect(
              0,
              0,
              displayCanvasRef.current.width,
              displayCanvasRef.current.height
            );
            displayCtx.fillStyle = "#FFFFFF";
            displayCtx.fillRect(
              0,
              0,
              displayCanvasRef.current.width,
              displayCanvasRef.current.height
            );
          }

          // Make sure we mark that we don't have generated content
          setHasGeneratedContent(false);

          // Check for quota or API key errors
          if (
            data.error &&
            (data.error.includes("Resource has been exhausted") ||
              data.error.includes("quota") ||
              data.error.includes("exceeded") ||
              response.status === 429)
          ) {
            // Show API key modal instead of error modal for quota issues
            setShowApiKeyModal(true);
          } else if (response.status === 500) {
            // Show regular error modal for other server errors
            setErrorMessage(data.error);
            setShowErrorModal(true);
          }
        }
      } catch (error) {
        console.error("Error generating image:", error);
        
        // Check for quota-related errors in the catch block too
        if (
          error.message &&
          (error.message.includes("Resource has been exhausted") ||
           error.message.includes("quota") ||
           error.message.includes("exceeded") ||
           error.message.includes("429"))
        ) {
          // Show API key modal for quota issues
          setShowApiKeyModal(true);
        } else {
          // Show regular error modal for other errors
          setErrorMessage(error.message || "An unexpected error occurred.");
          setShowErrorModal(true);
        }

        // When generation errors, ensure display canvas is cleared
        if (displayCanvasRef.current) {
          const displayCtx = displayCanvasRef.current.getContext("2d");
          displayCtx.clearRect(
            0,
            0,
            displayCanvasRef.current.width,
            displayCanvasRef.current.height
          );
          displayCtx.fillStyle = "#FFFFFF";
          displayCtx.fillRect(
            0,
            0,
            displayCanvasRef.current.width,
            displayCanvasRef.current.height
          );
        }

        // Make sure we mark that we don't have generated content
        setHasGeneratedContent(false);
      } finally {
        setIsLoading(false);
        console.log("Generation process completed");
      }
    },
    [canvasRef, isLoading, styleMode, customApiKey, lastRequestTime]
  );

  // Close the error modal
  const closeErrorModal = () => {
    setShowErrorModal(false);
  };

  // Handle the custom API key submission
  const handleApiKeySubmit = (apiKey) => {
    setCustomApiKey(apiKey);
    // Save to localStorage for persistence
    localStorage.setItem("geminiApiKey", apiKey);
    // Close the API key modal
    setShowApiKeyModal(false);
    // Also close error modal if it was open
    setShowErrorModal(false);
    // Show confirmation toast
    toast.success("API key saved successfully");
  };

  // Add this function to handle undo
  const handleUndo = () => {
    if (undoStack.length > 0) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      const previousState = undoStack[undoStack.length - 2]; // Get second to last state

      if (previousState) {
        const img = new Image();
        img.onload = () => {
          ctx.fillStyle = "#FFFFFF";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);
        };
        img.src = previousState;
      } else {
        // If no previous state, clear to white
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      setUndoStack((prev) => prev.slice(0, -1));
    }
  };

  // Add this function to save canvas state
  const saveCanvasState = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dataURL = canvas.toDataURL();
    setUndoStack((prev) => [...prev, dataURL]);
  };

  // Add this function to handle text input
  const handleTextInput = (e) => {
    if (e.key === "Enter") {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      ctx.font = "24px Arial";
      ctx.fillStyle = "#000000";
      ctx.fillText(textInput, textPosition.x, textPosition.y);
      setTextInput("");
      setIsTyping(false);
      saveCanvasState();
    }
  };

  // Modify the canvas click handler to handle text placement
  const handleCanvasClick = (e) => {
    if (currentTool === "text") {
      const { x, y } = getCoordinates(e, canvasRef.current);
      setTextPosition({ x, y });
      setIsTyping(true);
      if (textInputRef.current) {
        textInputRef.current.focus();
      }
    }
  };

  // Handle pen click for bezier curve tool
  const handlePenClick = (e) => {
    if (currentTool !== "pen") return;

    // Note: Actual point creation is now handled in the Canvas component
    // This function is primarily used as a callback to inform the CanvasContainer
    // that a pen action happened

    console.log("handlePenClick called in CanvasContainer");

    // Set isDrawing flag to true when using pen tool
    // This ensures handleStopDrawing knows we're in drawing mode with the pen
    setIsDrawing(true);

    // Save canvas state when adding new points
    saveCanvasState();
  };

  // Add this new function near your other utility functions
  const handleSaveImage = useCallback(() => {
    if (displayCanvasRef.current && hasGeneratedContent) {
      const canvas = displayCanvasRef.current;
      const link = document.createElement('a');
      
      // Create timestamp in format: YYYYMMDD_HHMM
      const now = new Date();
      const timestamp = now.toISOString()
        .replace(/[-:T]/g, '')  // Remove all separators
        .slice(0, 12);         // Keep only YYYYMMDDHHMM
      
      // Get the actual material name from styleOptions
      const materialName = styleOptions[styleMode]?.name || styleMode;
      
      // Create filename: timestamp_materialname.png
      const filename = `${timestamp}_${materialName}.png`;
      
      link.download = filename;
      link.href = canvas.toDataURL('image/png');
      link.click();
      toast.success(`Saved as "${filename}"`);
    } else {
      toast.error("No generated image to save.");
    }
  }, [displayCanvasRef, hasGeneratedContent, styleMode]);

  // Add this function to handle regeneration
  const handleRegenerate = async () => {
    if (canvasRef.current) {
      // Set flag to prevent useEffect hooks from triggering additional generations
      isManualRegenerationRef.current = true;
      await handleGeneration(true);
    }
  };

  // Add useEffect to watch for styleMode changes and regenerate
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    // Skip if this was triggered by a manual regeneration
    if (isManualRegenerationRef.current) {
      console.log("Skipping automatic generation due to manual regeneration");
      return;
    }

    // Only trigger if we have something drawn (check if canvas is not empty)
    // Note: handleGeneration is intentionally omitted from dependencies to prevent infinite loops
    const checkCanvasAndGenerate = async () => {
      if (!canvasRef.current) return;

      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

      // Check if canvas has any non-white pixels
      const hasDrawing = Array.from(imageData.data).some((pixel, index) => {
        // Check only RGB values (skip alpha)
        return index % 4 !== 3 && pixel !== 255;
      });

      // Only generate if there's a drawing AND we don't already have generated content
      if (hasDrawing && !hasGeneratedContent) {
        await handleGeneration();
      } else if (hasDrawing) {
        // Mark that regeneration is needed when style changes but we already have content
        needsRegenerationRef.current = true;
      }
    };

    // Skip on first render
    if (styleMode) {
      checkCanvasAndGenerate();
    }
  }, [styleMode, hasGeneratedContent]); // Removed handleGeneration from dependencies to prevent loop

  // Add new useEffect to handle regeneration when hasGeneratedContent changes to false
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    // Skip if this was triggered by a manual regeneration
    if (isManualRegenerationRef.current) {
      console.log("Skipping automatic generation due to manual regeneration");
      // Reset the flag after the first render with it set
      isManualRegenerationRef.current = false;
      return;
    }

    // Note: handleGeneration is intentionally omitted from dependencies to prevent infinite loops
    // If we need regeneration and the generated content was cleared
    if (needsRegenerationRef.current && !hasGeneratedContent) {
      const checkDrawingAndRegenerate = async () => {
        if (!canvasRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        // Check if canvas has any non-white pixels
        const hasDrawing = Array.from(imageData.data).some((pixel, index) => {
          // Check only RGB values (skip alpha)
          return index % 4 !== 3 && pixel !== 255;
        });

        if (hasDrawing) {
          needsRegenerationRef.current = false;
          await handleGeneration();
        }
      };

      checkDrawingAndRegenerate();
    }
  }, [hasGeneratedContent]);

  // Cleanup function - keep this to prevent memory leaks
  useEffect(() => {
    return () => {
      if (strokeTimeoutRef.current) {
        clearTimeout(strokeTimeoutRef.current);
        strokeTimeoutRef.current = null;
      }
    };
  }, []);

  // Handle dimension change
  const handleDimensionChange = (newDimension) => {
    console.log("Changing dimensions to:", newDimension);

    // Clear both canvases
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      canvas.width = newDimension.width;
      canvas.height = newDimension.height;
      initializeCanvas(canvas);
    }

    if (displayCanvasRef.current) {
      const displayCanvas = displayCanvasRef.current;
      displayCanvas.width = newDimension.width;
      displayCanvas.height = newDimension.height;
      const ctx = displayCanvas.getContext("2d");
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, displayCanvas.width, displayCanvas.height);
    }

    // Reset generation state
    setHasGeneratedContent(false);
    setGeneratedImage(null);
    backgroundImageRef.current = null;

    // Update dimension state AFTER canvas dimensions are updated
    setCurrentDimension(newDimension);
  };

  // Add new function to handle selecting a historical image
  const handleSelectHistoricalImage = (historyItem) => {
    // First set the dimensions and wait for canvases to update
    if (historyItem.dimensions) {
      // Update canvas dimensions first
      if (canvasRef.current) {
        canvasRef.current.width = historyItem.dimensions.width;
        canvasRef.current.height = historyItem.dimensions.height;
      }
      if (displayCanvasRef.current) {
        displayCanvasRef.current.width = historyItem.dimensions.width;
        displayCanvasRef.current.height = historyItem.dimensions.height;
      }
      // Then update the dimension state
      setCurrentDimension(historyItem.dimensions);
    }

    // Use Promise to ensure images are loaded after dimensions are set
    Promise.resolve().then(() => {
      // Draw the original drawing to the canvas
      const drawingImg = new Image();
      drawingImg.onload = () => {
        const canvas = canvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext("2d");
          ctx.fillStyle = "#FFFFFF";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(drawingImg, 0, 0, canvas.width, canvas.height);
        }
      };
      drawingImg.src = historyItem.drawingData;

      // Draw the generated image to the display canvas
      const generatedImg = new Image();
      generatedImg.onload = () => {
        const displayCanvas = displayCanvasRef.current;
        if (displayCanvas) {
          const ctx = displayCanvas.getContext("2d");
          ctx.fillStyle = "#000000"; // Black background for letterboxing
          ctx.fillRect(0, 0, displayCanvas.width, displayCanvas.height);
          
          // Calculate aspect ratios
          const imgRatio = generatedImg.width / generatedImg.height;
          const canvasRatio = displayCanvas.width / displayCanvas.height;
          
          let drawWidth, drawHeight, x, y;
          
          if (imgRatio > canvasRatio) {
            // Image is wider than canvas
            drawWidth = displayCanvas.width;
            drawHeight = displayCanvas.width / imgRatio;
            x = 0;
            y = (displayCanvas.height - drawHeight) / 2;
          } else {
            // Image is taller than canvas
            drawHeight = displayCanvas.height;
            drawWidth = displayCanvas.height * imgRatio;
            x = (displayCanvas.width - drawWidth) / 2;
            y = 0;
          }
          
          // Draw the image with letterboxing
          ctx.drawImage(generatedImg, x, y, drawWidth, drawHeight);
          setHasGeneratedContent(true);
        }
      };
      generatedImg.src = historyItem.imageUrl;
    });

    // Close the history modal
    setIsHistoryModalOpen(false);
  };

  // Add new function to handle image refinement
  const handleImageRefinement = async (refinementPrompt) => {
    if (!displayCanvasRef.current || !hasGeneratedContent) return;

    console.log("Starting image refinement with prompt:", refinementPrompt);
    setIsLoading(true);

    try {
      // Get the current image data
      const displayCanvas = displayCanvasRef.current;
      const imageData = displayCanvas.toDataURL("image/png").split(",")[1];

      const requestPayload = {
        prompt: refinementPrompt,
        imageData,
        customApiKey,
      };

      console.log("Making refinement API request");

      const response = await fetch("/api/refine", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestPayload),
      });

      console.log("Refinement API response received, status:", response.status);

      const data = await response.json();

      if (data.success && data.imageData) {
        console.log("Image refined successfully");
        const imageUrl = `data:image/png;base64,${data.imageData}`;

        // Draw the refined image to the display canvas
        const displayCtx = displayCanvas.getContext("2d");
        const img = new Image();

        img.onload = () => {
          console.log("Refined image loaded, drawing to display canvas");

          // Clear the canvas
          displayCtx.clearRect(0, 0, displayCanvas.width, displayCanvas.height);

          // Fill with black background for letterboxing
          displayCtx.fillStyle = "#000000";
          displayCtx.fillRect(0, 0, displayCanvas.width, displayCanvas.height);

          // Calculate aspect ratios
          const imgRatio = img.width / img.height;
          const canvasRatio = displayCanvas.width / displayCanvas.height;

          let drawWidth, drawHeight, x, y;

          if (imgRatio > canvasRatio) {
            // Image is wider than canvas (relative to height)
            drawWidth = displayCanvas.width;
            drawHeight = displayCanvas.width / imgRatio;
            x = 0;
            y = (displayCanvas.height - drawHeight) / 2;
          } else {
            // Image is taller than canvas (relative to width)
            drawHeight = displayCanvas.height;
            drawWidth = displayCanvas.height * imgRatio;
            x = (displayCanvas.width - drawWidth) / 2;
            y = 0;
          }

          // Draw the image with letterboxing
          displayCtx.drawImage(img, x, y, drawWidth, drawHeight);

          // Add to history
          setImageHistory((prev) => [
            ...prev,
            {
              imageUrl,
              timestamp: Date.now(),
              drawingData: canvasRef.current.toDataURL(),
              styleMode,
              dimensions: currentDimension,
            },
          ]);
        };

        img.src = imageUrl;
      } else {
        console.error("Failed to refine image:", data.error);
        
        // Check for quota or API key errors
        if (
          data.error && 
          (data.error.includes("Resource has been exhausted") ||
           data.error.includes("quota") ||
           data.error.includes("exceeded") ||
           response.status === 429)
        ) {
          // Show API key modal instead of error modal for quota issues
          setShowApiKeyModal(true);
        } else {
          // Show regular error modal for other errors
          setErrorMessage(data.error || "Failed to refine image. Please try again.");
          setShowErrorModal(true);
        }
      }
    } catch (error) {
      console.error("Error during refinement:", error);
      
      // Check for quota-related errors in the catch block
      if (
        error.message &&
        (error.message.includes("Resource has been exhausted") ||
         error.message.includes("quota") ||
         error.message.includes("exceeded") ||
         error.message.includes("429"))
      ) {
        // Show API key modal for quota issues
        setShowApiKeyModal(true);
      } else {
        // Show regular error modal for other errors
        setErrorMessage("An error occurred during refinement. Please try again.");
        setShowErrorModal(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Add onImageUpload function
  const handleImageUpload = (imageDataUrl) => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      // Clear the canvas
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Calculate dimensions to maintain aspect ratio and fit within canvas
      const scale = Math.min(
        canvas.width / img.width,
        canvas.height / img.height
      );
      const x = (canvas.width - img.width * scale) / 2;
      const y = (canvas.height - img.height * scale) / 2;

      // Draw the image centered and scaled
      ctx.drawImage(img, x, y, img.width * scale, img.height * scale);

      // Save canvas state after uploading image
      saveCanvasState();
      setHasGeneratedContent(true);
    };

    img.src = imageDataUrl;
  };

  // Add stroke width handler
  const handleStrokeWidth = (width) => {
    setPenWidth(width);
  };

  // Function to handle sending the generated image back to the doodle canvas
  const handleSendToDoodle = useCallback(
    async (imageDataUrl) => {
      if (!imageDataUrl || isSendingToDoodle) return;

      console.log("Sending image back to doodle canvas...");
      setIsSendingToDoodle(true);

      let response; // Define response outside try
      try {
        const base64Data = imageDataUrl.split(",")[1];

        response = await fetch("/api/convert-to-doodle", {
          // Assign to outer scope variable
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ 
            imageData: base64Data,
            customApiKey // Pass the custom API key
          }),
        });

        // Check for non-OK HTTP status first
        if (!response.ok) {
          let errorBody = await response.text(); // Get raw text first
          let errorMessage = `API Error: ${response.status}`;
          try {
            // Try parsing error response as JSON
            const errorData = JSON.parse(errorBody);
            errorMessage = errorData.error || errorMessage;
          } catch (parseError) {
            // If response wasn't JSON (like the "Body exceeded" error)
            console.error("API response was not valid JSON:", errorBody);
            // Use truncated raw text in the error message
            errorMessage = `${errorMessage}. Response: ${errorBody.substring(
              0,
              100
            )}${errorBody.length > 100 ? "..." : ""}`;
          }
          
          // Check if this is a quota error
          if (
            errorMessage.includes("quota") ||
            errorMessage.includes("exceeded") || 
            errorMessage.includes("Resource has been exhausted") ||
            response.status === 429
          ) {
            // Show API key modal for quota issues
            setShowApiKeyModal(true);
            setIsSendingToDoodle(false);
            return;
          }
          
          throw new Error(errorMessage); // Throw error to be caught below
        }

        // If response.ok, proceed to parse the JSON body
        const result = await response.json();

        if (result.success && result.imageData) {
          const mainCtx = canvasRef.current?.getContext("2d");
          if (mainCtx && canvasRef.current) {
            const img = new Image();
            img.onload = () => {
              // Clear canvas without triggering state updates
              mainCtx.fillStyle = '#FFFFFF';
              mainCtx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
              
              // Draw the new image
              mainCtx.drawImage(
                img,
                0,
                0,
                canvasRef.current.width,
                canvasRef.current.height
              );
              
              // Batch our state updates
              Promise.resolve().then(() => {
                setTempPoints([]);
                if (canvasRef.current.setHasDrawing) {
                  canvasRef.current.setHasDrawing(true);
                }
                // Save canvas state after all state updates are complete
                requestAnimationFrame(() => {
                  saveCanvasState();
                  toast.success("Image sent back to doodle canvas!");
                  setIsSendingToDoodle(false);
                });
              });
            };
            img.onerror = (err) => {
              console.error("Error loading converted doodle image:", err);
              toast.error("Failed to load the converted doodle.");
              setIsSendingToDoodle(false); // Turn off loading on image load error
            };
            img.src = `data:image/png;base64,${result.imageData}`;
          } else {
            throw new Error("Main canvas context not available.");
          }
        } else {
          // Handle cases where API returns success: false or missing imageData
          throw new Error(
            result.error || "API returned success:false or missing data."
          );
        }
      } catch (error) {
        // This catches errors from fetch, response.ok check, response.json(), or explicit throws
        console.error("Error sending image back to doodle:", error);
        
        // Check for quota errors in catch block
        if (
          error.message && 
          (error.message.includes("quota") || 
           error.message.includes("exceeded") ||
           error.message.includes("Resource has been exhausted") ||
           error.message.includes("429"))
        ) {
          // Show API key modal for quota issues
          setShowApiKeyModal(true);
        } else {
          toast.error(`Error: ${error.message || "An unknown error occurred."}`);
        }
        
        // Ensure loading state is turned off in *any* error scenario
        setIsSendingToDoodle(false);
      }
    },
    [isSendingToDoodle, clearCanvas, saveCanvasState, setTempPoints, toast, customApiKey]
  );

  // Function to open history modal
  const openHistoryModal = () => {
    setIsHistoryModalOpen(true);
  };

  // Updated function for library button
  const toggleLibrary = () => {
    setShowLibrary(prev => !prev);
  };

  // Calculate if history exists
  const hasHistory = imageHistory && imageHistory.length > 0;

  // Add this helper function for image compression
  const compressImage = useCallback(async (dataUrl, maxWidth = 1200) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        // Create a canvas to resize the image
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Calculate new dimensions
        let width = img.width;
        let height = img.height;
        
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw and export as JPEG with lower quality
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.src = dataUrl;
    });
  }, []);

  // Add this new function to handle using a library image as template
  const handleUseAsTemplate = useCallback(async (imageUrl) => {
    console.log('Using library image as template:', imageUrl);
    
    // Show loading state with specific messages for each step
    setTemplateLoadingMessage("Preparing template...");
    setIsTemplateLoading(true);
    
    try {
      // 1. Create a material from the image
      // First, fetch the image and convert to base64
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      
      // Convert blob to base64
      const reader = new FileReader();
      const imageDataPromise = new Promise((resolve) => {
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(blob);
      });
      
      const imageDataUrl = await imageDataPromise;
      
      // Process with visual-enhance-prompt API (compress the image first)
      setTemplateLoadingMessage("Analyzing image...");
      const compressedImage = await compressImage(imageDataUrl, 1200);
      
      // Get custom API key if it exists
      const customApiKey = localStorage.getItem("geminiApiKey");
      
      // Call the visual-enhance-prompt API
      const promptResponse = await fetch('/api/visual-enhance-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          image: compressedImage,
          customApiKey,
          basePrompt: 'Transform this sketch into a material with professional studio lighting against a pure black background. Render it in Cinema 4D with Octane for a high-end 3D visualization.'
        }),
      });
      
      if (!promptResponse.ok) {
        throw new Error(`API returned ${promptResponse.status}`);
      }
      
      const promptData = await promptResponse.json();
      
      // 2. Add material to StyleSelector
      if (promptData.enhancedPrompt && promptData.suggestedName) {
        setTemplateLoadingMessage("Creating material...");
        // Create material object - use a smaller compressed image for thumbnail
        const thumbnailImage = await compressImage(imageDataUrl, 300);
        
        const materialObj = {
          name: promptData.suggestedName,
          prompt: promptData.enhancedPrompt,
          image: thumbnailImage // Use compressed thumbnail
        };
        
        // Add material to library and get the key
        const materialKey = addMaterialToLibrary(materialObj);
        
        // Select this new material
        setStyleMode(materialKey);
        
        // 3. Convert the library image to a doodle and render in Canvas
        setTemplateLoadingMessage("Converting to doodle...");
        const doodleResponse = await fetch('/api/convert-to-doodle', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageData: compressedImage.split(',')[1],
            customApiKey
          }),
        });
        
        if (!doodleResponse.ok) {
          throw new Error(`Doodle conversion API returned ${doodleResponse.status}`);
        }
        
        const doodleData = await doodleResponse.json();
        
        if (doodleData.success && doodleData.imageData) {
          // Render the doodle on the canvas
          const mainCtx = canvasRef.current?.getContext("2d");
          if (mainCtx && canvasRef.current) {
            const img = new Image();
            img.onload = () => {
              // Clear canvas 
              mainCtx.fillStyle = '#FFFFFF';
              mainCtx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
              
              // Calculate appropriate dimensions while maintaining aspect ratio
              // and respecting the current canvas dimensions
              const canvasWidth = canvasRef.current.width;
              const canvasHeight = canvasRef.current.height;
              
              const imgRatio = img.width / img.height;
              const canvasRatio = canvasWidth / canvasHeight;
              
              // Declare variables separately to fix linter warning
              let drawWidth = 0;
              let drawHeight = 0;
              let x = 0;
              let y = 0;
              
              if (imgRatio > canvasRatio) {
                // Image is wider relative to canvas
                drawWidth = canvasWidth * 0.8;
                drawHeight = drawWidth / imgRatio;
                x = canvasWidth * 0.1;
                y = (canvasHeight - drawHeight) / 2;
              } else {
                // Image is taller relative to canvas
                drawHeight = canvasHeight * 0.8;
                drawWidth = drawHeight * imgRatio;
                x = (canvasWidth - drawWidth) / 2;
                y = canvasHeight * 0.1;
              }
              
              // Draw doodle
              mainCtx.drawImage(img, x, y, drawWidth, drawHeight);
              
              // Save canvas state
              if (typeof saveCanvasState === 'function') {
                saveCanvasState();
              }
              
              // Mark as having drawing
              setHasDrawing(true);
              
              // 4. Show the original image in the display canvas first
              setTemplateLoadingMessage("Generating material preview...");
              
              // Draw the original image to the display canvas
              if (displayCanvasRef.current) {
                const displayCtx = displayCanvasRef.current.getContext("2d");
                if (displayCtx) {
                  // Create a new image for the display canvas
                  const displayImg = new Image();
                  displayImg.onload = () => {
                    // Clear display canvas first
                    displayCtx.clearRect(0, 0, displayCanvasRef.current.width, displayCanvasRef.current.height);
                    
                    // Fill with black background for letterboxing
                    displayCtx.fillStyle = "#000000";
                    displayCtx.fillRect(0, 0, displayCanvasRef.current.width, displayCanvasRef.current.height);
                    
                    // Calculate aspect ratios for display canvas
                    const imgRatio = displayImg.width / displayImg.height;
                    const canvasRatio = displayCanvasRef.current.width / displayCanvasRef.current.height;
                    
                    // Declare variables separately
                    let dispDrawWidth = 0;
                    let dispDrawHeight = 0;
                    let dispX = 0;
                    let dispY = 0;
                    
                    if (imgRatio > canvasRatio) {
                      // Image is wider than canvas
                      dispDrawWidth = displayCanvasRef.current.width;
                      dispDrawHeight = displayCanvasRef.current.width / imgRatio;
                      dispX = 0;
                      dispY = (displayCanvasRef.current.height - dispDrawHeight) / 2;
                    } else {
                      // Image is taller than canvas
                      dispDrawHeight = displayCanvasRef.current.height;
                      dispDrawWidth = displayCanvasRef.current.height * imgRatio;
                      dispX = (displayCanvasRef.current.width - dispDrawWidth) / 2;
                      dispY = 0;
                    }
                    
                    // Draw the image with letterboxing
                    displayCtx.drawImage(displayImg, dispX, dispY, dispDrawWidth, dispDrawHeight);
                    
                    // Set flag to indicate we have generated content
                    setHasGeneratedContent(true);
                    
                    // 5. Finally, trigger generation to show the styled version
                    // Close the library view and finish the template process
                    setShowLibrary(false);
                    
                    // Slight delay before starting generation
                    setTimeout(() => {
                      handleGeneration();
                      
                      // Turn off template loading
                      setIsTemplateLoading(false);
                      setTemplateLoadingMessage("");
                    }, 500);
                  };
                  
                  // Load the original image for display
                  displayImg.src = imageUrl;
                }
              } else {
                // If no display canvas, just trigger generation and finish
                handleGeneration();
                setShowLibrary(false);
                setIsTemplateLoading(false);
                setTemplateLoadingMessage("");
              }
            };
            
            img.src = `data:image/png;base64,${doodleData.imageData}`;
          } else {
            throw new Error("Canvas context unavailable");
          }
        } else {
          throw new Error("Failed to convert to doodle");
        }
      } else {
        throw new Error("Failed to analyze image");
      }
    } catch (error) {
      console.error('Error using image as template:', error);
      toast.error('Failed to use image as template');
      setIsTemplateLoading(false);
      setTemplateLoadingMessage("");
    }
  }, [compressImage, handleGeneration]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-start bg-gray-50 p-2 md:p-4 overflow-y-auto">
      {showLibrary ? (
        <LibraryPage onBack={toggleLibrary} onUseAsTemplate={handleUseAsTemplate} />
      ) : (
        <div className="w-full max-w-[1800px] mx-auto pb-4">
          <div className="space-y-1">
            <div className="flex flex-col sm:flex-row items-start justify-between gap-2">
              <div className="flex-shrink-0">
                <Header />
              </div>
              {/* Header Buttons Section - only visible on desktop */}
              <div className="hidden md:flex items-center gap-2 mt-auto sm:mt-8">
                <HeaderButtons 
                  hasHistory={hasHistory}
                  openHistoryModal={openHistoryModal}
                  toggleLibrary={toggleLibrary}
                  handleSaveImage={handleSaveImage}
                  isLoading={isLoading}
                  hasGeneratedContent={hasGeneratedContent}
                />
              </div>
            </div>

            {/* New single row layout */}
            <div className="flex flex-col md:flex-row items-stretch gap-4 w-full md:mt-4">
              {/* Toolbar - fixed width on desktop, full width horizontal on mobile */}
              <div className="w-full md:w-[60px] md:flex-shrink-0">
                {/* Mobile toolbar (horizontal) */}
                <div className="block md:hidden w-fit">
                  <ToolBar
                    currentTool={currentTool}
                    setCurrentTool={setCurrentTool}
                    handleUndo={handleUndo}
                    clearCanvas={clearCanvas}
                    orientation="horizontal"
                    currentWidth={penWidth}
                    setStrokeWidth={handleStrokeWidth}
                    currentDimension={currentDimension}
                    onDimensionChange={handleDimensionChange}
                  />
                </div>

                {/* Desktop toolbar (vertical) */}
                <div className="hidden md:block">
                  <ToolBar
                    currentTool={currentTool}
                    setCurrentTool={setCurrentTool}
                    handleUndo={handleUndo}
                    clearCanvas={clearCanvas}
                    orientation="vertical"
                    currentWidth={penWidth}
                    setStrokeWidth={handleStrokeWidth}
                    currentDimension={currentDimension}
                    onDimensionChange={handleDimensionChange}
                  />
                </div>
              </div>

              {/* Main content area */}
              <div className="flex-1 flex flex-col gap-4">
                {/* Canvas row */}
                <div className="flex flex-col md:flex-row gap-2">
                  {/* Canvas */}
                  <div className="flex-1 w-full relative">
                    <Canvas
                      ref={canvasComponentRef}
                      canvasRef={canvasRef}
                      currentTool={currentTool}
                      isDrawing={isDrawing}
                      startDrawing={startDrawing}
                      draw={draw}
                      stopDrawing={stopDrawing}
                      handleCanvasClick={handleCanvasClick}
                      handlePenClick={handlePenClick}
                      handleGeneration={handleGeneration}
                      tempPoints={tempPoints}
                      setTempPoints={setTempPoints}
                      handleUndo={handleUndo}
                      clearCanvas={clearCanvas}
                      setCurrentTool={setCurrentTool}
                      currentDimension={currentDimension}
                      currentColor={penColor}
                      currentWidth={penWidth}
                      onImageUpload={handleImageUpload}
                      onGenerate={handleGeneration}
                      isGenerating={isLoading}
                      setIsGenerating={setIsLoading}
                      saveCanvasState={saveCanvasState}
                      onDrawingChange={setHasDrawing}
                      styleMode={styleMode}
                      setStyleMode={setStyleMode}
                      isSendingToDoodle={isSendingToDoodle}
                    />
                  </div>

                  {/* Display Canvas */}
                  <div className="flex-1 w-full">
                    <DisplayCanvas
                      displayCanvasRef={displayCanvasRef}
                      isLoading={isLoading}
                      handleRegenerate={handleRegenerate}
                      hasGeneratedContent={hasGeneratedContent}
                      currentDimension={currentDimension}
                      onOpenHistory={openHistoryModal}
                      onRefineImage={handleImageRefinement}
                      onSendToDoodle={handleSendToDoodle}
                      hasHistory={hasHistory}
                      openHistoryModal={openHistoryModal}
                      toggleLibrary={toggleLibrary}
                      handleSaveImage={handleSaveImage}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <ErrorModal
        showErrorModal={showErrorModal}
        closeErrorModal={closeErrorModal}
        customApiKey={customApiKey}
        setCustomApiKey={setCustomApiKey}
        handleApiKeySubmit={handleApiKeySubmit}
        debugMode={debugMode}
        setDebugMode={setDebugMode}
      />

      <ApiKeyModal
        isOpen={showApiKeyModal}
        onClose={() => setShowApiKeyModal(false)}
        onSubmit={handleApiKeySubmit}
        initialValue={customApiKey}
      />

      <TextInput
        isTyping={isTyping}
        textInputRef={textInputRef}
        textInput={textInput}
        setTextInput={setTextInput}
        handleTextInput={handleTextInput}
        textPosition={textPosition}
      />

      <HistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        history={imageHistory}
        onSelectImage={handleSelectHistoricalImage}
        currentDimension={currentDimension}
      />

      {/* Template loading overlay */}
      {isTemplateLoading && (
        <div className="fixed inset-0 flex flex-col items-center justify-center bg-black/50 z-50">
          <div className="bg-white shadow-lg rounded-xl p-6 flex flex-col items-center max-w-md">
            <LoaderCircle className="w-12 h-12 text-blue-600 animate-spin mb-4" />
            <p className="text-gray-900 font-medium text-lg">{templateLoadingMessage || "Processing template..."}</p>
            <p className="text-gray-500 text-sm mt-2">This may take a moment</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CanvasContainer;
