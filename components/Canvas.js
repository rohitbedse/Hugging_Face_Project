  import { useRef, useEffect, useState, forwardRef, useImperativeHandle, useCallback } from 'react';
import { 
  getCoordinates, 
  drawBezierCurve, 
  drawBezierGuides, 
  createAnchorPoint,
  isNearHandle,
  updateHandle
} from './utils/canvasUtils';
import { PencilLine, Upload, ImagePlus, LoaderCircle, Brush } from 'lucide-react';
import ToolBar from './ToolBar';
import StyleSelector from './StyleSelector';

const Canvas = forwardRef(({
  canvasRef,
  currentTool,
  isDrawing,
  startDrawing,
  draw,
  stopDrawing,
  handleCanvasClick,
  handlePenClick,
  handleGeneration,
  tempPoints,
  setTempPoints,
  handleUndo,
  clearCanvas,
  setCurrentTool,
  currentDimension,
  onImageUpload,
  onGenerate,
  isGenerating,
  setIsGenerating,
  currentColor,
  currentWidth,
  handleStrokeWidth,
  saveCanvasState,
  onDrawingChange,
  styleMode,
  setStyleMode,
  isSendingToDoodle,
}, ref) => {
  const [showBezierGuides, setShowBezierGuides] = useState(true);
  const [activePoint, setActivePoint] = useState(-1);
  const [activeHandle, setActiveHandle] = useState(null);
  const [symmetric, setSymmetric] = useState(true);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
  const [hasDrawing, setHasDrawing] = useState(false);
  const [strokeCount, setStrokeCount] = useState(0);
  const fileInputRef = useRef(null);
  const [shapeStartPos, setShapeStartPos] = useState(null);
  const [previewCanvas, setPreviewCanvas] = useState(null);
  const [isDoodleConverting, setIsDoodleConverting] = useState(false);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [draggingImage, setDraggingImage] = useState(null);
  const [resizingImage, setResizingImage] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const canvasContainerRef = useRef(null);

  // Create a ref to track the previous style mode
  const prevStyleModeRef = useRef(styleMode);
  
  // Stable callback reference for handleGeneration
  const handleGenerationRef = useRef(handleGeneration);
  useEffect(() => {
    handleGenerationRef.current = handleGeneration;
  }, [handleGeneration]);
  
  // Add effect to watch for styleMode changes and trigger generation
  useEffect(() => {
    // Skip the first render
    if (prevStyleModeRef.current === styleMode) {
      return;
    }
    
    // Update the ref to current value
    prevStyleModeRef.current = styleMode;
    
    // When styleMode changes, trigger generation
    if (typeof handleGenerationRef.current === 'function') {
      handleGenerationRef.current();
    }
  }, [styleMode]);

  // Add touch event prevention function
  useEffect(() => {
    // Function to prevent default touch behavior on canvas
    const preventTouchDefault = (e) => {
      if (isDrawing) {
        e.preventDefault();
      }
    };

    // Add event listener when component mounts
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.addEventListener('touchstart', preventTouchDefault, { passive: false });
      canvas.addEventListener('touchmove', preventTouchDefault, { passive: false });
    }

    // Remove event listener when component unmounts
    return () => {
      if (canvas) {
        canvas.removeEventListener('touchstart', preventTouchDefault);
        canvas.removeEventListener('touchmove', preventTouchDefault);
      }
    };
  }, [isDrawing, canvasRef]);

  // Add debugging info to console
  useEffect(() => {
    console.log('Canvas tool changed or isDrawing changed:', { currentTool, isDrawing });
  }, [currentTool, isDrawing]);

  // Add effect to rerender when uploadedImages change
  useEffect(() => {
    if (uploadedImages.length > 0) {
      renderCanvas();
    }
  }, [uploadedImages]);

  // Redraw bezier guides and control points when tempPoints change
  useEffect(() => {
    if (currentTool === 'pen' && tempPoints.length > 0 && showBezierGuides) {
      redrawBezierGuides();
    }
  }, [tempPoints, showBezierGuides, currentTool]);

  // Add useEffect to check if canvas has content
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    
    // Check if canvas has any non-white pixels (i.e., has a drawing)
    const hasNonWhitePixels = Array.from(imageData.data).some((pixel, index) => {
      // Check only RGB values (skip alpha)
      return index % 4 !== 3 && pixel !== 255;
    });
    
    setHasDrawing(hasNonWhitePixels);
  }, [canvasRef]);

  // Add this near your other useEffects
  useEffect(() => {
    // When isDoodleConverting becomes true, also set hasDrawing to true
    if (isDoodleConverting) {
      setHasDrawing(true);
    }
  }, [isDoodleConverting]);

  // Create a stable ref for handleFileChange to avoid dependency cycles
  const handleFileChangeRef = useRef(null);
  
  // Update handleFileChange function
  const handleFileChange = useCallback(async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Store the current tool
    const previousTool = currentTool;
    
    // Hide the placeholder immediately when upload begins
    if (typeof onDrawingChange === 'function') {
      onDrawingChange(true);
    }
    
    // Show loading state
    setIsDoodleConverting(true);

    const reader = new FileReader();
    reader.onload = async (e) => {
      const imageDataUrl = e.target.result;
      
      try {
        // Compress the image before sending
        const compressedImage = await compressImage(imageDataUrl);
        
        const response = await fetch('/api/convert-to-doodle', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            imageData: compressedImage.split(",")[1],
          }),
        });

        const data = await response.json();
        
        if (data.success && data.imageData) {
          const img = new Image();
          img.onload = () => {
            const ctx = canvasRef.current.getContext('2d');
            
            // Clear canvas
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
            
            // Calculate dimensions
            const scale = Math.min(
              canvasRef.current.width / img.width,
              canvasRef.current.height / img.height
            );
            const x = (canvasRef.current.width - img.width * scale) / 2;
            const y = (canvasRef.current.height - img.height * scale) / 2;
            
            // Draw doodle
            ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
            
            // Save canvas state
            saveCanvasState();
            
            // Hide loading state
            setIsDoodleConverting(false);

            // Ensure placeholder is hidden
            if (typeof onDrawingChange === 'function') {
              onDrawingChange(true);
            }

            // Automatically trigger generation
            handleGenerationRef.current();
          };
          
          img.src = `data:image/png;base64,${data.imageData}`;
        }
      } catch (error) {
        console.error('Error processing image:', error);
        setIsDoodleConverting(false);
        alert('Error processing image. Please try a different image or a smaller file size.');
        
        // Restore previous tool even if there's an error
        setCurrentTool(previousTool);
      }
    };

    reader.readAsDataURL(file);
  }, [canvasRef, currentTool, onDrawingChange, saveCanvasState, setCurrentTool, setIsDoodleConverting]);

  // Keep the ref updated
  useEffect(() => {
    handleFileChangeRef.current = handleFileChange;
  }, [handleFileChange]);

  // Add drag and drop event handlers
  useEffect(() => {
    const container = canvasContainerRef.current;
    if (!container) return;

    const handleDragEnter = (e) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDraggingFile(true);
    };

    const handleDragOver = (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (!isDraggingFile) setIsDraggingFile(true);
    };

    const handleDragLeave = (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      // Only set to false if we're leaving the container (not entering a child)
      if (e.currentTarget === container && !container.contains(e.relatedTarget)) {
        setIsDraggingFile(false);
      }
    };

    const handleDrop = (e) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDraggingFile(false);
      
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        const file = files[0];
        
        // Check if it's an image
        if (file.type.startsWith('image/')) {
          // Create a fake event object to reuse the existing handleFileChange function
          const fakeEvent = { target: { files: [file] } };
          if (handleFileChangeRef.current) {
            handleFileChangeRef.current(fakeEvent);
          }
        }
      }
    };

    container.addEventListener('dragenter', handleDragEnter);
    container.addEventListener('dragover', handleDragOver);
    container.addEventListener('dragleave', handleDragLeave);
    container.addEventListener('drop', handleDrop);

    return () => {
      container.removeEventListener('dragenter', handleDragEnter);
      container.removeEventListener('dragover', handleDragOver);
      container.removeEventListener('dragleave', handleDragLeave);
      container.removeEventListener('drop', handleDrop);
    };
  }, [isDraggingFile]);

  const handleKeyDown = (e) => {
    // Add keyboard accessibility
    if (e.key === 'Enter' || e.key === ' ') {
      handleCanvasClick(e);
    }
    
    // Toggle symmetric handles with Shift key
    if (e.key === 'Shift') {
      setSymmetric(!symmetric);
    }
  };

  // Draw bezier control points and guide lines
  const redrawBezierGuides = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Get the canvas context
    const ctx = canvas.getContext('2d');
    
    // Save the current canvas state to redraw later
    const canvasImage = new Image();
    canvasImage.src = canvas.toDataURL();
    
    canvasImage.onload = () => {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Redraw the canvas content
      ctx.drawImage(canvasImage, 0, 0);
      
      // Draw the control points and guide lines
      drawBezierGuides(ctx, tempPoints);
    };
  };

  // Function to draw a star shape
  const drawStar = (ctx, x, y, radius, points = 5) => {
    ctx.beginPath();
    for (let i = 0; i <= points * 2; i++) {
      const r = i % 2 === 0 ? radius : radius / 2;
      const angle = (i * Math.PI) / points;
      const xPos = x + r * Math.sin(angle);
      const yPos = y + r * Math.cos(angle);
      if (i === 0) ctx.moveTo(xPos, yPos);
      else ctx.lineTo(xPos, yPos);
    }
    ctx.closePath();
  };

  // Function to draw shapes
  const drawShape = (ctx, startPos, endPos, shape, isPreview = false) => {
    if (!startPos || !endPos) return;

    const width = endPos.x - startPos.x;
    const height = endPos.y - startPos.y;
    const radius = Math.sqrt(width * width + height * height) / 2;

    ctx.strokeStyle = currentColor || '#000000';
    ctx.fillStyle = currentColor || '#000000';
    ctx.lineWidth = currentWidth || 2;

    switch (shape) {
      case 'rect':
        if (isPreview) {
          ctx.strokeRect(startPos.x, startPos.y, width, height);
        } else {
          ctx.fillRect(startPos.x, startPos.y, width, height);
        }
        break;
      case 'circle':
        ctx.beginPath();
        ctx.ellipse(
          startPos.x + width / 2,
          startPos.y + height / 2,
          Math.abs(width / 2),
          Math.abs(height / 2),
          0,
          0,
          2 * Math.PI
        );
        if (isPreview) {
          ctx.stroke();
        } else {
          ctx.fill();
        }
        break;
      case 'line':
        ctx.beginPath();
        ctx.lineCap = 'round';
        ctx.lineWidth = currentWidth * 2 || 4; // Make lines thicker
        ctx.moveTo(startPos.x, startPos.y);
        ctx.lineTo(endPos.x, endPos.y);
        ctx.stroke();
        break;
      case 'star': {
        const centerX = startPos.x + width / 2;
        const centerY = startPos.y + height / 2;
        drawStar(ctx, centerX, centerY, radius);
        if (isPreview) {
          ctx.stroke();
        } else {
          ctx.fill();
        }
        break;
      }
    }
  };

  // Add this new renderCanvas function after handleFileChange
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    // Store current canvas state in a temporary canvas to preserve drawings
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.drawImage(canvas, 0, 0);
    
    // Clear canvas
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Redraw original content
    ctx.drawImage(tempCanvas, 0, 0);
    
    // Draw all uploaded images
    for (const img of uploadedImages) {
      const imageObj = new Image();
      imageObj.src = img.src;
      ctx.drawImage(imageObj, img.x, img.y, img.width, img.height);
      
      // Draw selection handles if dragging or resizing this image
      if (draggingImage === img.id || resizingImage === img.id) {
        // Draw border
        ctx.strokeStyle = '#0080ff';
        ctx.lineWidth = 2;
        ctx.strokeRect(img.x, img.y, img.width, img.height);
        
        // Draw corner resize handles
        ctx.fillStyle = '#0080ff';
        const handleSize = 8;
        
        // Top-left
        ctx.fillRect(img.x - handleSize/2, img.y - handleSize/2, handleSize, handleSize);
        // Top-right
        ctx.fillRect(img.x + img.width - handleSize/2, img.y - handleSize/2, handleSize, handleSize);
        // Bottom-left
        ctx.fillRect(img.x - handleSize/2, img.y + img.height - handleSize/2, handleSize, handleSize);
        // Bottom-right
        ctx.fillRect(img.x + img.width - handleSize/2, img.y + img.height - handleSize/2, handleSize, handleSize);
      }
    }
  }, [canvasRef, uploadedImages, draggingImage, resizingImage]);
  
  // Handle mouse down for image interaction
  const handleImageMouseDown = (e) => {
    if (currentTool !== 'selection') return false;
    
    const { x, y } = getCoordinates(e, canvasRef.current);
    const handleSize = 8;
    
    // Check if clicked on any image handle first (for resizing)
    for (let i = uploadedImages.length - 1; i >= 0; i--) {
      const img = uploadedImages[i];
      
      // Check if clicked on bottom-right resize handle
      if (
        x >= img.x + img.width - handleSize/2 - 5 &&
        x <= img.x + img.width + handleSize/2 + 5 &&
        y >= img.y + img.height - handleSize/2 - 5 &&
        y <= img.y + img.height + handleSize/2 + 5
      ) {
        setResizingImage(img.id);
        setDragOffset({ x: x - (img.x + img.width), y: y - (img.y + img.height) });
        return true;
      }
    }
    
    // If not resizing, check if clicked on any image (for dragging)
    for (let i = uploadedImages.length - 1; i >= 0; i--) {
      const img = uploadedImages[i];
      if (
        x >= img.x && 
        x <= img.x + img.width && 
        y >= img.y && 
        y <= img.y + img.height
      ) {
        setDraggingImage(img.id);
        setDragOffset({ x: x - img.x, y: y - img.y });
        return true;
      }
    }
    
    return false;
  };
  
  // Handle mouse move for image interaction
  const handleImageMouseMove = (e) => {
    if (!draggingImage && !resizingImage) return false;
    
    const { x, y } = getCoordinates(e, canvasRef.current);
    
    if (draggingImage) {
      // Update position of dragged image
      setUploadedImages(prev => prev.map(img => {
        if (img.id === draggingImage) {
          return {
            ...img,
            x: x - dragOffset.x,
            y: y - dragOffset.y
          };
        }
        return img;
      }));
      
      renderCanvas();
      return true;
    }
    
    if (resizingImage) {
      // Update size of resized image
      setUploadedImages(prev => prev.map(img => {
        if (img.id === resizingImage) {
          // Calculate new width and height
          const newWidth = Math.max(20, x - img.x - dragOffset.x + 10);
          const newHeight = Math.max(20, y - img.y - dragOffset.y + 10);
          
          // Option 1: Free resize
          return {
            ...img,
            width: newWidth,
            height: newHeight
          };
          
          // Option 2: Maintain aspect ratio (uncomment if needed)
          /*
          const aspectRatio = img.originalWidth / img.originalHeight;
          const newHeight = newWidth / aspectRatio;
          return {
            ...img,
            width: newWidth,
            height: newHeight
          };
          */
        }
        return img;
      }));
      
      renderCanvas();
      return true;
    }
    
    return false;
  };
  
  // Handle mouse up for image interaction
  const handleImageMouseUp = () => {
    if (draggingImage || resizingImage) {
      setDraggingImage(null);
      setResizingImage(null);
      saveCanvasState();
      return true;
    }
    return false;
  };

  // Function to delete the selected image
  const deleteSelectedImage = useCallback(() => {
    if (draggingImage) {
      setUploadedImages(prev => prev.filter(img => img.id !== draggingImage));
      setDraggingImage(null);
      renderCanvas();
      saveCanvasState();
    }
  }, [draggingImage, renderCanvas, saveCanvasState]);

  // Modify existing startDrawing to check for image interaction first
  const handleStartDrawing = (e) => {
    console.log('Canvas onMouseDown', { currentTool, isDrawing });
    
    // Check if we're interacting with an image first
    if (handleImageMouseDown(e)) {
      return;
    }
    
    if (currentTool === 'pen') {
      if (!checkForPointOrHandle(e)) {
        handlePenToolClick(e);
      }
      return;
    }
    
    const { x, y } = getCoordinates(e, canvasRef.current);
    
    if (['rect', 'circle', 'line', 'star'].includes(currentTool)) {
      setShapeStartPos({ x, y });
      
      // Create preview canvas if it doesn't exist
      if (!previewCanvas) {
        const canvas = document.createElement('canvas');
        canvas.width = canvasRef.current.width;
        canvas.height = canvasRef.current.height;
        setPreviewCanvas(canvas);
      }
    }
    
    startDrawing(e);
    setHasDrawing(true);
  };

  // Modify existing draw to handle image interaction
  const handleDraw = (e) => {
    // Handle image dragging/resizing first
    if (handleImageMouseMove(e)) {
      return;
    }
    
    if (currentTool === 'pen' && handleBezierMouseMove(e)) {
      return;
    }

    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    const { x, y } = getCoordinates(e, canvas);
    
    draw(e);
  };

  // Modify existing stopDrawing to handle image interaction
  const handleStopDrawing = (e) => {
    // Handle image release first
    if (handleImageMouseUp()) {
      return;
    }
    
    console.log('handleStopDrawing called', { 
      eventType: e?.type, 
      currentTool, 
      isDrawing, 
      activePoint, 
      activeHandle
    });
    
    // If we're using the pen tool with active point or handle
    if (currentTool === 'pen') {
      // If we were dragging a handle, just release it
      if (activeHandle) {
        setActiveHandle(null);
        return;
      }
      
      // If we were dragging an anchor point, just release it
      if (activePoint !== -1) {
        setActivePoint(-1);
        return;
      }
    }

    stopDrawing(e);

    // If using the pencil tool and we've just finished a drag, trigger generation
    if (currentTool === 'pencil' && isDrawing && !isGenerating) {
      console.log(`${currentTool} tool condition met, will try to trigger generation`);
      
      // Set generating flag to prevent multiple calls
      if (typeof setIsGenerating === 'function') {
        setIsGenerating(true);
      }
      
      // Generate immediately - no timeout needed
      console.log('Calling handleGeneration function');
      if (typeof handleGenerationRef.current === 'function') {
        handleGenerationRef.current();
      } else {
        console.error('handleGeneration is not a function:', handleGenerationRef.current);
      }
    } else {
      console.log('Generation not triggered because:', { 
        isPencilTool: currentTool === 'pencil',
        wasDrawing: isDrawing,
        isGenerating
      });
    }
  };

  // Handle keyboard events for image deletion
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && draggingImage) {
        deleteSelectedImage();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [draggingImage, deleteSelectedImage]);

  // Check if we clicked on an existing point or handle
  const checkForPointOrHandle = (e) => {
    if (currentTool !== 'pen' || !showBezierGuides || tempPoints.length === 0) {
      return false;
    }
    
    const canvas = canvasRef.current;
    const { x, y } = getCoordinates(e, canvas);
    setLastMousePos({ x, y });
    
    // Check if we clicked on a handle
    for (let i = 0; i < tempPoints.length; i++) {
      const point = tempPoints[i];
      
      // Check for handleIn
      if (isNearHandle(point, 'handleIn', x, y)) {
        setActivePoint(i);
        setActiveHandle('handleIn');
        return true;
      }
      
      // Check for handleOut
      if (isNearHandle(point, 'handleOut', x, y)) {
        setActivePoint(i);
        setActiveHandle('handleOut');
        return true;
      }
      
      // Check for the anchor point itself
      const distance = Math.sqrt((point.x - x) ** 2 + (point.y - y) ** 2);
      if (distance <= 10) {
        setActivePoint(i);
        setActiveHandle(null);
        return true;
      }
    }
    
    return false;
  };
  
  // Handle mouse move for bezier control point or handle dragging
  const handleBezierMouseMove = (e) => {
    if (currentTool !== 'pen') {
      return false;
    }
    
    const canvas = canvasRef.current;
    const { x, y } = getCoordinates(e, canvas);
    const dx = x - lastMousePos.x;
    const dy = y - lastMousePos.y;
    
    // If we're dragging a handle
    if (activePoint !== -1 && activeHandle) {
      const newPoints = [...tempPoints];
      updateHandle(newPoints[activePoint], activeHandle, dx, dy, symmetric);
      setTempPoints(newPoints);
      setLastMousePos({ x, y });
      return true;
    }
    
    // If we're dragging an anchor point
    if (activePoint !== -1) {
      const newPoints = [...tempPoints];
      newPoints[activePoint].x += dx;
      newPoints[activePoint].y += dy;
      
      // If this point has handles, move them with the point
      if (newPoints[activePoint].handleIn) {
        // No need to change the handle's offset, just move with the point
      }
      
      if (newPoints[activePoint].handleOut) {
        // No need to change the handle's offset, just move with the point
      }
      
      setTempPoints(newPoints);
      setLastMousePos({ x, y });
      return true;
    }
    
    return false;
  };

  // Handle clicks for bezier curve tool
  const handlePenToolClick = (e) => {
    const canvas = canvasRef.current;
    const { x, y } = getCoordinates(e, canvas);
    
    // Add a new point
    if (tempPoints.length === 0) {
      // First point has no handles initially
      const newPoint = { x, y, handleIn: null, handleOut: null };
      setTempPoints([newPoint]);
    } else {
      // Create a new point with handles relative to the last point
      const newPoint = createAnchorPoint(x, y, tempPoints[tempPoints.length - 1]);
      setTempPoints([...tempPoints, newPoint]);
    }
    
    // Always show guides when adding points
    setShowBezierGuides(true);
  };
  
  // Toggle bezier guide visibility
  const toggleBezierGuides = () => {
    setShowBezierGuides(!showBezierGuides);
    if (showBezierGuides) {
      redrawBezierGuides();
    }
  };

  // Draw the final bezier curve and clear control points
  const finalizeBezierCurve = () => {
    if (tempPoints.length < 2) {
      // Need at least 2 points for a path
      console.log('Need at least 2 control points to draw a path');
      return;
    }
    
    const canvas = canvasRef.current;
    
    // Draw the actual bezier curve
    drawBezierCurve(canvas, tempPoints);
    
    // Hide guides and reset control points
    setShowBezierGuides(false);
    setTempPoints([]);
    
    // Trigger generation only if not already generating
    if (!isGenerating) {
      // Set generating flag to prevent multiple calls
      if (typeof setIsGenerating === 'function') {
        setIsGenerating(true);
      }
      
      if (typeof handleGenerationRef.current === 'function') {
        handleGenerationRef.current();
      }
    }
  };

  // Add control point to segment
  const addControlPoint = (e) => {
    if (currentTool !== 'pen' || tempPoints.length < 2) return;
    
    const canvas = canvasRef.current;
    const { x, y } = getCoordinates(e, canvas);
    
    // Find the closest segment to add a point to
    let closestDistance = Number.POSITIVE_INFINITY;
    let insertIndex = -1;
    
    for (let i = 0; i < tempPoints.length - 1; i++) {
      const p1 = tempPoints[i];
      const p2 = tempPoints[i + 1];
      
      // Calculate distance from click to line between points
      // This is a simplified distance calculation for demo purposes
      const lineLength = Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);
      if (lineLength === 0) continue;
      
      // Project point onto line
      const t = ((x - p1.x) * (p2.x - p1.x) + (y - p1.y) * (p2.y - p1.y)) / (lineLength * lineLength);
      
      // If projection is outside the line segment, skip
      if (t < 0 || t > 1) continue;
      
      // Calculate closest point on line
      const closestX = p1.x + t * (p2.x - p1.x);
      const closestY = p1.y + t * (p2.y - p1.y);
      
      // Calculate distance to closest point
      const distance = Math.sqrt((x - closestX) ** 2 + (y - closestY) ** 2);
      
      if (distance < closestDistance && distance < 20) {
        closestDistance = distance;
        insertIndex = i + 1;
      }
    }
    
    if (insertIndex > 0) {
      // Create a new array with the new point inserted
      const newPoints = [...tempPoints];
      const prevPoint = newPoints[insertIndex - 1];
      const nextPoint = newPoints[insertIndex];
      
      // Create a new point at the click position with automatically calculated handles
      const newPoint = { 
        x, 
        y,
        // Calculate handles based on the positions of adjacent points
        handleIn: { 
          x: (prevPoint.x - x) * 0.25, 
          y: (prevPoint.y - y) * 0.25 
        },
        handleOut: { 
          x: (nextPoint.x - x) * 0.25, 
          y: (nextPoint.y - y) * 0.25 
        }
      };
      
      // Insert the new point
      newPoints.splice(insertIndex, 0, newPoint);
      setTempPoints(newPoints);
    }
  };

  // Add image compression utility
  const compressImage = async (dataUrl) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        // Calculate new dimensions while maintaining aspect ratio
        const MAX_DIMENSION = 1200;
        if (width > height && width > MAX_DIMENSION) {
          height *= MAX_DIMENSION / width;
          width = MAX_DIMENSION;
        } else if (height > MAX_DIMENSION) {
          width *= MAX_DIMENSION / height;
          height = MAX_DIMENSION;
        }

        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        
        // Compress as JPEG with 0.8 quality
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.onerror = reject;
      img.src = dataUrl;
    });
  };

  const handleGenerate = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Use the ref to ensure we have the latest handler
    if (typeof handleGenerationRef.current === 'function') {
      handleGenerationRef.current();
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  // Add custom clearCanvas implementation
  const handleClearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Clear the canvas with white background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Reset states
    setTempPoints([]);
    setHasDrawing(false);
    setUploadedImages([]);
    
    // Save the cleared state
    saveCanvasState();
    
    // Notify about drawing change
    if (typeof onDrawingChange === 'function') {
      onDrawingChange(false);
    }
  }, [saveCanvasState, onDrawingChange]);

  useImperativeHandle(ref, () => ({
    canvas: canvasRef.current,
    clear: () => clearCanvas(true),
    setHasDrawing: setHasDrawing,
  }), [clearCanvas, setHasDrawing]);

  return (
    <div className="flex flex-col gap-4">
      {/* Canvas container with fixed aspect ratio */}
      <div 
        ref={canvasContainerRef}
        className={`relative w-full ${isDraggingFile ? 'bg-gray-100 border-2 border-dashed border-gray-400' : ''}`} 
        style={{ aspectRatio: `${currentDimension.width} / ${currentDimension.height}` }}
      >
        <canvas
          ref={canvasRef}
          width={currentDimension.width}
          height={currentDimension.height}
          className="absolute inset-0 w-full h-full border border-gray-300 bg-white rounded-xl shadow-soft"
          style={{
            touchAction: 'none'
          }}
          onMouseDown={handleStartDrawing}
          onMouseMove={handleDraw}
          onMouseUp={handleStopDrawing}
          onMouseLeave={handleStopDrawing}
          onTouchStart={handleStartDrawing}
          onTouchMove={handleDraw}
          onTouchEnd={handleStopDrawing}
          onClick={handleCanvasClick}
          onKeyDown={handleKeyDown}
          tabIndex="0"
          aria-label="Drawing canvas"
        />
        
        {/* Floating upload button */}
        <button 
          type="button"
          onClick={handleUploadClick}
          className={`absolute bottom-2.5 right-2.5 z-10 bg-white border border-gray-200 text-gray-600 rounded-lg p-4 sm:p-3 flex items-center justify-center shadow-soft hover:bg-gray-100 transition-colors ${isDrawing ? 'pointer-events-none' : ''}`}
          aria-label="Upload image"
          title="Upload image"
        >
          <ImagePlus className="w-6 h-6 sm:w-5 sm:h-5" />
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            className="hidden" 
            accept="image/*"
          />
        </button>
        
        {/* Doodle conversion loading overlay */}
        {isDoodleConverting && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-400/80 rounded-xl z-50">
            <div className="bg-white shadow-lg rounded-xl p-6 flex flex-col items-center">
              <LoaderCircle className="w-12 h-12 text-gray-700 animate-spin mb-4" />
              <p className="text-gray-900 font-medium text-lg">Converting to doodle...</p>
              <p className="text-gray-500 text-sm mt-2">This may take a moment</p>
            </div>
          </div>
        )}
        
        {/* Sending back to doodle loading overlay */}
        {isSendingToDoodle && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-400/80 rounded-xl z-50">
            <div className="bg-white shadow-lg rounded-xl p-6 flex flex-col items-center">
              <LoaderCircle className="w-12 h-12 text-gray-700 animate-spin mb-4" />
              <p className="text-gray-900 font-medium text-lg">Sending back to doodle...</p>
              <p className="text-gray-500 text-sm mt-2">Converting and loading...</p>
            </div>
          </div>
        )}
        
        {/* Draw here placeholder */}
        {!hasDrawing && !isDoodleConverting && !isSendingToDoodle && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <PencilLine className="w-8 h-8 text-gray-400 mb-2" />
            <p className="text-gray-400 text-lg font-medium">Draw here</p>
          </div>
        )}
        
        {/* Drag and drop indicator */}
        {isDraggingFile && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100/80 border-2 border-dashed border-gray-400 rounded-xl z-40 pointer-events-none">
            <ImagePlus className="w-12 h-12 text-gray-500 mb-4" />
            <p className="text-gray-600 text-lg font-medium">Drop image to convert to doodle</p>
          </div>
        )}
      </div>

      {/* Style selector - positioned below canvas */}
      <div className="w-full">
        <StyleSelector 
          styleMode={styleMode}
          setStyleMode={setStyleMode}
          handleGenerate={handleGeneration}
        />
      </div>
    </div>
  );
});

Canvas.displayName = 'Canvas';

export default Canvas; 