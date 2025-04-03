// Get the correct coordinates based on canvas scaling
export const getCoordinates = (e, canvas) => {
  const rect = canvas.getBoundingClientRect();
  
  // Calculate the scaling factor between the internal canvas size and displayed size
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  
  // Apply the scaling to get accurate coordinates
  return {
    x: (e.nativeEvent.offsetX || (e.nativeEvent.touches?.[0]?.clientX - rect.left)) * scaleX,
    y: (e.nativeEvent.offsetY || (e.nativeEvent.touches?.[0]?.clientY - rect.top)) * scaleY
  };
};

// Initialize canvas with white background
export const initializeCanvas = (canvas) => {
  const ctx = canvas.getContext("2d");
  
  // Fill canvas with white background
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
};

// Draw the background image to the canvas
export const drawImageToCanvas = (canvas, backgroundImage) => {
  if (!canvas || !backgroundImage) return;
  
  const ctx = canvas.getContext("2d");
  
  // Fill with white background first
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Draw the background image
  ctx.drawImage(
    backgroundImage,
    0, 0,
    canvas.width, canvas.height
  );
};

// Draw bezier curve
export const drawBezierCurve = (canvas, points) => {
  const ctx = canvas.getContext('2d');
  
  if (!points || points.length < 2) {
    console.error('Need at least 2 points to draw a path');
    return;
  }
  
  ctx.beginPath();
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 4;
  
  // Start at the first anchor point
  ctx.moveTo(points[0].x, points[0].y);
  
  // For each pair of anchor points (and their control points)
  for (let i = 0; i < points.length - 1; i++) {
    const current = points[i];
    const next = points[i + 1];
    
    if (current.handleOut && next.handleIn) {
      // If both points have handles, draw a cubic bezier
      ctx.bezierCurveTo(
        current.x + (current.handleOut?.x || 0), current.y + (current.handleOut?.y || 0),
        next.x + (next.handleIn?.x || 0), next.y + (next.handleIn?.y || 0),
        next.x, next.y
      );
    } else {
      // If no handles, draw a straight line
      ctx.lineTo(next.x, next.y);
    }
  }
  
  ctx.stroke();
};

// Draw bezier guides (control points and lines)
export const drawBezierGuides = (ctx, points) => {
  if (!points || points.length === 0) return;
  
  // Draw the path itself first (as a light preview)
  ctx.save();
  ctx.globalAlpha = 0.3;
  ctx.strokeStyle = '#888888';
  ctx.lineWidth = 1.5;
  
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  
  // For each pair of anchor points (and their control points)
  for (let i = 0; i < points.length - 1; i++) {
    const current = points[i];
    const next = points[i + 1];
    
    if (current.handleOut && next.handleIn) {
      // If both points have handles, draw a cubic bezier
      ctx.bezierCurveTo(
        current.x + (current.handleOut?.x || 0), current.y + (current.handleOut?.y || 0),
        next.x + (next.handleIn?.x || 0), next.y + (next.handleIn?.y || 0),
        next.x, next.y
      );
    } else {
      // If no handles, draw a straight line
      ctx.lineTo(next.x, next.y);
    }
  }
  
  ctx.stroke();
  ctx.restore();
  
  // Draw guide lines between anchor points and their handles
  ctx.strokeStyle = 'rgba(100, 100, 255, 0.5)';
  ctx.lineWidth = 1;
  
  for (const point of points) {
    // Draw line from anchor to in-handle if it exists
    if (point.handleIn) {
      ctx.beginPath();
      ctx.moveTo(point.x, point.y);
      ctx.lineTo(point.x + point.handleIn.x, point.y + point.handleIn.y);
      ctx.stroke();
    }
    
    // Draw line from anchor to out-handle if it exists
    if (point.handleOut) {
      ctx.beginPath();
      ctx.moveTo(point.x, point.y);
      ctx.lineTo(point.x + point.handleOut.x, point.y + point.handleOut.y);
      ctx.stroke();
    }
  }
  
  // Draw anchor points (main points of the path)
  for (const point of points) {
    // Draw the main anchor point
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.lineWidth = 1;
    
    ctx.beginPath();
    ctx.arc(point.x, point.y, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    
    // Draw the handle points if they exist
    if (point.handleIn) {
      ctx.fillStyle = 'rgba(100, 100, 255, 0.8)';
      ctx.beginPath();
      ctx.arc(point.x + point.handleIn.x, point.y + point.handleIn.y, 4, 0, Math.PI * 2);
      ctx.fill();
    }
    
    if (point.handleOut) {
      ctx.fillStyle = 'rgba(100, 100, 255, 0.8)';
      ctx.beginPath();
      ctx.arc(point.x + point.handleOut.x, point.y + point.handleOut.y, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }
};

// Helper to create a new anchor point with handles
export const createAnchorPoint = (x, y, prevPoint = null) => {
  // By default, create a point with no handles
  const point = { x, y, handleIn: null, handleOut: null };
  
  // If there's a previous point, automatically add symmetric handles
  if (prevPoint) {
    // Calculate the default handle length (as a percentage of distance to previous point)
    const dx = x - prevPoint.x;
    const dy = y - prevPoint.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const handleLength = distance * 0.3; // 30% of distance between points
    
    // Create handles perpendicular to the line between points
    // For a smooth curve, make the previous point's out handle opposite to this point's in handle
    const angle = Math.atan2(dy, dx);
    
    // Add an out handle to the previous point (if it doesn't already have one)
    if (!prevPoint.handleOut) {
      prevPoint.handleOut = {
        x: Math.cos(angle) * -handleLength,
        y: Math.sin(angle) * -handleLength
      };
    }
    
    // Add an in handle to the current point
    point.handleIn = {
      x: Math.cos(angle) * -handleLength,
      y: Math.sin(angle) * -handleLength
    };
  }
  
  return point;
};

// Helper to check if a point is near a handle
export const isNearHandle = (point, handleType, x, y, radius = 10) => {
  if (!point || !point[handleType]) return false;
  
  const handleX = point.x + point[handleType].x;
  const handleY = point.y + point[handleType].y;
  
  const dx = handleX - x;
  const dy = handleY - y;
  
  return (dx * dx + dy * dy) <= radius * radius;
};

// Helper to update a handle position
export const updateHandle = (point, handleType, dx, dy, symmetric = true) => {
  if (!point || !point[handleType]) return;
  
  // Update the target handle
  point[handleType].x += dx;
  point[handleType].y += dy;
  
  // If symmetric and the other handle exists, update it to be symmetrical
  if (symmetric) {
    const otherType = handleType === 'handleIn' ? 'handleOut' : 'handleIn';
    
    if (point[otherType]) {
      point[otherType].x = -point[handleType].x;
      point[otherType].y = -point[handleType].y;
    }
  }
}; 