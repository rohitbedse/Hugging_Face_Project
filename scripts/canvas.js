function drawImageMaintainAspectRatio(ctx, image, canvas) {
  // Clear the canvas first
  ctx.fillStyle = '#000'; // or '#fff' for white bars
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Calculate aspect ratios
  const imageRatio = image.width / image.height;
  const canvasRatio = canvas.width / canvas.height;
  
  let drawWidth, drawHeight, x, y;
  
  if (imageRatio > canvasRatio) {
    // Image is wider than canvas
    drawWidth = canvas.width;
    drawHeight = canvas.width / imageRatio;
    x = 0;
    y = (canvas.height - drawHeight) / 2;
  } else {
    // Image is taller than canvas
    drawHeight = canvas.height;
    drawWidth = canvas.height * imageRatio;
    x = (canvas.width - drawWidth) / 2;
    y = 0;
  }
  
  ctx.drawImage(image, x, y, drawWidth, drawHeight);
} 