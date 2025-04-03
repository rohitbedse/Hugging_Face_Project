import { useState, useRef, useEffect, useCallback } from 'react';
import { RefreshCw, Plus, Upload, Edit, Trash2, RefreshCcw, HelpCircle, Sparkles, Info, Check, X } from 'lucide-react';
import AddMaterialModal from './AddMaterialModal.js';
import { createPortal } from 'react-dom';

// Add custom scrollbar hiding styles
const scrollbarHideStyles = `
  /* Hide scrollbar for Chrome, Safari and Opera */
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
  
  /* Hide scrollbar for IE, Edge and Firefox */
  .scrollbar-hide {
    -ms-overflow-style: none;  /* IE and Edge */
    scrollbar-width: none;  /* Firefox */
  }
`;

// Define default style options with display names and prompts
const defaultStyleOptions = {
  material: {
    name: "Chrome",
    file: "chrome.jpeg",
    prompt: "Recreate this doodle as a physical, floating chrome sculpture made of a chromium metal tubes or pipes in a professional studio setting. If it is typography, render it accordingly, but always always have a black background and studio lighting. Render it using Cinema 4D with Octane, using studio lighting against a pure black background. Make it look like a high-end elegant rendering of a sculptural piece. Flat Black background always"
  },
  honey: {
    name: "Honey",
    file: "honey.jpeg",
    prompt: "Transform this sketch into a honey. Render it as if made entirely of translucent, golden honey with characteristic viscous drips and flows. Add realistic liquid properties including surface tension, reflections, and light refraction. Render it in Cinema 4D with Octane, using studio lighting against a pure black background. Flat Black background always"
  },
  softbody: {
    name: "Soft Body",
    file: "softbody.jpeg",
    prompt: "Convert this drawing / text into a soft body physics render. Render it as if made of a soft, jelly-like material that responds to gravity and motion. Add realistic deformation, bounce, and squash effects typical of soft body dynamics. Use dramatic lighting against a black background to emphasize the material's translucency and surface properties. Render it in Cinema 4D with Octane, using studio lighting against a pure black background. Make it look like a high-end 3D animation frame."
  },
  testMaterial: {
    name: "Surprise Me!",
    file: "test-material.jpeg",
    prompt: "Transform this sketch into an experimental material with unique and unexpected properties. Each generation should be different and surprising - it could be crystalline, liquid, gaseous, organic, metallic, or something completely unexpected. Use dramatic studio lighting against a pure black background to showcase the material's unique characteristics. Render it in a high-end 3D style with professional lighting and composition, emphasizing the most interesting and unexpected qualities of the chosen material."
  }
};

// Create a mutable copy that will include user-added materials
export let styleOptions = { ...defaultStyleOptions };

// Define the base prompt template
const BASE_PROMPT = (materialName) =>
  `Transform this sketch into a ${materialName.toLowerCase()} material. Render it in a high-end 3D visualization style with professional studio lighting against a pure black background. Make it look like an elegant Cinema 4D and Octane rendering with detailed material properties and characteristics. The final result should be an elegant visualization with perfect studio lighting, crisp shadows, and high-end material definition.`;

// Function to add a material directly to the library
export const addMaterialToLibrary = (material) => {
  // Create a unique key for the material based on its name and timestamp
  const materialKey = `${material.name.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`;
  
  // Create the material object
  const newMaterial = {
    name: material.name,
    prompt: material.prompt || BASE_PROMPT(material.name),
    thumbnail: material.image || material.thumbnail,
    originalDescription: material.name,
    isCustom: true
  };
  
  // Add to styleOptions
  styleOptions[materialKey] = newMaterial;
  
  // Save to localStorage
  try {
    const savedMaterials = localStorage.getItem('customMaterials') || '{}';
    const customMaterials = JSON.parse(savedMaterials);
    customMaterials[materialKey] = newMaterial;
    localStorage.setItem('customMaterials', JSON.stringify(customMaterials));
  } catch (error) {
    console.error('Error saving material to localStorage:', error);
  }
  
  // Return the key so it can be selected
  return materialKey;
};

// --- Updated function to use /api/enhance-prompt ---
const enhanceMaterialDetails = async (materialDescription) => {
  console.log("Enhancing prompt for:", materialDescription);
  const basePrompt = BASE_PROMPT(materialDescription); // Generate the base prompt to send

  try {
    const response = await fetch("/api/enhance-prompt", { // Call the correct API endpoint
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        materialName: materialDescription, // Send the user's input as materialName
        basePrompt: basePrompt             // Send the generated base prompt
      })
    });

    if (!response.ok) {
      // Handle API errors (like 500)
      throw new Error(`API responded with status ${response.status}`);
    }

    const data = await response.json();
    console.log("Enhanced prompt data:", data);

    // Use the response from /api/enhance-prompt
    // The API itself has fallback logic if JSON parsing fails,
    // returning { enhancedPrompt: basePrompt, suggestedName: materialName }
    if (data.enhancedPrompt && data.suggestedName) {
      return {
        name: data.suggestedName,
        prompt: data.enhancedPrompt
      };
    } else {
      // This case might occur if the API returns unexpected JSON structure
      throw new Error('Invalid enhancement data received from /api/enhance-prompt');
    }

  } catch (error) {
    console.error("Error enhancing prompt:", error);

    // Fallback if the fetch fails or response is totally invalid
    const capitalizedName = materialDescription
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');

    return {
      name: `${capitalizedName} Style`, // Slightly different fallback name
      prompt: basePrompt // Use the original base prompt as fallback
    };
  }
};
// --- End of updated function ---

// Function to get prompt based on style mode
export const getPromptForStyle = (styleMode) => {
  if (!styleMode || !styleOptions[styleMode]) {
    return styleOptions.material.prompt;
  }
  return styleOptions[styleMode].prompt || styleOptions.material.prompt;
};

// Replace with a simpler generatePromptForMaterial function
export const generatePromptForMaterial = (materialName) => {
  return `Transform this sketch into a ${materialName.toLowerCase()} material. Render it in a high-end 3D visualization style with professional studio lighting against a pure black background. Make it look like a elegant Cinema 4D and octane rendering with detailed material properties and characteristics.`;
};

const StyleSelector = ({ styleMode, setStyleMode, handleGenerate }) => {
  const [showAddMaterialModal, setShowAddMaterialModal] = useState(false);
  const [newMaterialName, setNewMaterialName] = useState('');
  const [isGeneratingThumbnail, setIsGeneratingThumbnail] = useState(false);
  const [useCustomImage, setUseCustomImage] = useState(false);
  const [customImagePreview, setCustomImagePreview] = useState('');
  const [customImageFile, setCustomImageFile] = useState(null);
  const fileInputRef = useRef(null);
  const [recentlyAdded, setRecentlyAdded] = useState(null);
  const [customPrompt, setCustomPrompt] = useState('');
  const [showCustomPrompt, setShowCustomPrompt] = useState(false);
  const [previewThumbnail, setPreviewThumbnail] = useState('');
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  const [materials, setMaterials] = useState(defaultStyleOptions);
  const [generatedMaterialName, setGeneratedMaterialName] = useState('');
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [isGeneratingText, setIsGeneratingText] = useState(false);
  const [showMaterialNameEdit, setShowMaterialNameEdit] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPromptInfo, setShowPromptInfo] = useState(null);
  const [promptPopoverPosition, setPromptPopoverPosition] = useState({ top: 0, left: 0 });
  const styleSelectorRef = useRef(null);
  const [editingPrompt, setEditingPrompt] = useState(null);
  const [editedPromptText, setEditedPromptText] = useState('');
  const [hasPromptChanged, setHasPromptChanged] = useState(false);
  const [generatedThumbnail, setGeneratedThumbnail] = useState(null);
  const [thumbnailError, setThumbnailError] = useState(null);

  // Load custom materials from local storage on component mount
  useEffect(() => {
    loadCustomMaterials();
  }, []);

  // Add effect to update materials state when styleOptions changes
  useEffect(() => {
    // This ensures the UI reflects changes to styleOptions made from outside this component
    setMaterials({...styleOptions});
  }, [styleOptions]);
  
  // Extract loadCustomMaterials into its own named function
  const loadCustomMaterials = () => {
    try {
      const savedMaterials = localStorage.getItem('customMaterials');
      if (savedMaterials) {
        const parsedMaterials = JSON.parse(savedMaterials);
        // Update both the styleOptions and the state
        const updatedMaterials = { ...defaultStyleOptions, ...parsedMaterials };
        styleOptions = updatedMaterials;
        setMaterials(updatedMaterials);
        console.log('Loaded custom materials from local storage');
      }
    } catch (error) {
      console.error('Error loading custom materials:', error);
    }
  };

  // Modify the useEffect that handles material descriptions
  useEffect(() => {
    const delayedGeneration = async () => {
      // Skip if no material name or if we're in edit mode
      if (!newMaterialName.trim() || recentlyAdded) return;

      // ONLY set text generation loading state
      setIsGeneratingText(true);

      try {
        // Use our updated enhanceMaterialDetails function (which now calls /api/enhance-prompt)
        const enhanced = await enhanceMaterialDetails(newMaterialName);
        console.log("Received enhanced data in useEffect:", enhanced);
        setGeneratedMaterialName(enhanced.name);
        setGeneratedPrompt(enhanced.prompt);

        // DO NOT generate thumbnail here
      } catch (error) {
        console.error('Error in material generation (useEffect):', error);

        // Fall back to basic generation if enhanceMaterialDetails fails catastrophically
        // (This shouldn't happen often as enhanceMaterialDetails has its own internal fallback)
        const capitalizedName = newMaterialName
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(' ');
        setGeneratedMaterialName(`${capitalizedName} Style`);
        setGeneratedPrompt(BASE_PROMPT(newMaterialName));
      } finally {
        setIsGeneratingText(false);
      }
    };

    // Delay generation to avoid too many API calls while typing
    const timeoutId = setTimeout(delayedGeneration, 1500);
    return () => clearTimeout(timeoutId);
  }, [newMaterialName, recentlyAdded]); // Dependencies remain the same

  // Helper function to resize and compress image data
  const compressImage = (dataUrl, maxWidth = 200) => {
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
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
      img.src = dataUrl;
    });
  };

  // Function to debug storage usage
  const checkStorageUsage = () => {
    let totalSize = 0;
    let itemCount = 0;
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      const value = localStorage.getItem(key);
      const size = (key.length + value.length) * 2; // Approximate size in bytes (UTF-16)
      totalSize += size;
      itemCount++;
      console.log(`Item: ${key}, Size: ${(size / 1024).toFixed(2)}KB`);
    }
    
    console.log(`Total localStorage usage: ${(totalSize / 1024 / 1024).toFixed(2)}MB, Items: ${itemCount}`);
    return totalSize;
  };

  const handleAddMaterial = () => {
    resetMaterialForm();
    setRecentlyAdded(null);
    setShowAddMaterialModal(true);
  };

  const handleCloseModal = () => {
    setShowAddMaterialModal(false);
    setNewMaterialName('');
    setUseCustomImage(false);
    setCustomImagePreview('');
    setCustomImageFile(null);
    setCustomPrompt('');
    setShowCustomPrompt(false);
    setPreviewThumbnail('');
  };

  // Handle clicking outside of the modal to close it
  const handleClickOutsideModal = (e) => {
    // If the clicked element is the backdrop (has the modalBackdrop class)
    if (e.target.classList.contains('modalBackdrop')) {
      handleCloseModal();
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = () => {
      // When the file is loaded, create a temporary image to extract a square crop
      const img = new Image();
      img.onload = () => {
        // Create a canvas element to crop the image to a square
        const canvas = document.createElement('canvas');
        // Determine the size of the square (min of width and height)
        const size = Math.min(img.width, img.height);
        canvas.width = size;
        canvas.height = size;
        
        // Calculate the position to start drawing to center the crop
        const offsetX = (img.width - size) / 2;
        const offsetY = (img.height - size) / 2;
        
        // Draw the cropped image to the canvas
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, offsetX, offsetY, size, size, 0, 0, size, size);
        
        // Convert the canvas to a data URL
        const croppedImageDataUrl = canvas.toDataURL(file.type);
        setCustomImagePreview(croppedImageDataUrl);
        setCustomImageFile(file);
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  const handleGenerateDefaultPrompt = () => {
    if (!newMaterialName.trim()) return;
    
    // Generate default prompt based on material name
    const defaultPrompt = generatePromptForMaterial(newMaterialName);
    setCustomPrompt(defaultPrompt);
    
    // Clear the preview so it will regenerate with the new prompt
    setPreviewThumbnail('');
  };

  // Add a helper function to read file as data URL
  const readFileAsDataURL = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Option 1: Add function to compress images more aggressively before storage
  const compressImageForStorage = async (dataUrl) => {
    // Use a smaller max width for storage
    const maxWidth = 100; // Reduce from 200 to 100
    const quality = 0.5; // Reduce quality from 0.7 to 0.5
    
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        let width = img.width;
        let height = img.height;
        
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = dataUrl;
    });
  };

  // Option 2: Add function to manage storage limits
  const manageStorageLimit = async (newMaterial) => {
    try {
      // Get current materials
      const savedMaterials = localStorage.getItem('customMaterials');
      if (!savedMaterials) return;
      
      const parsedMaterials = JSON.parse(savedMaterials);
      const customKeys = Object.keys(parsedMaterials).filter(key => 
        !Object.keys(defaultStyleOptions).includes(key));
      
      // If we have too many custom materials, remove the oldest ones
      if (customKeys.length > 4) { // Limit to 5 custom materials
        // Sort by creation time (if you have that data) or just take the first ones
        const keysToRemove = customKeys.slice(0, customKeys.length - 4);
        
        keysToRemove.forEach(key => {
          delete parsedMaterials[key];
        });
        
        // Save the reduced set back to localStorage
        localStorage.setItem('customMaterials', JSON.stringify(parsedMaterials));
      }
    } catch (error) {
      console.error('Error managing storage limit:', error);
    }
  };

  // Add a function to reset the form fields
  const resetMaterialForm = () => {
    setNewMaterialName('');
    setGeneratedMaterialName('');
    setGeneratedPrompt('');
    setCustomPrompt('');
    setPreviewThumbnail('');
    setUseCustomImage(false);
    setCustomImagePreview('');
    setShowCustomPrompt(false);
  };

  // Update the openAddMaterialModal function to reset form on open
  const openAddMaterialModal = () => {
    resetMaterialForm();
    setRecentlyAdded(null);
    setShowAddMaterialModal(true);
  };

  // Modify handleEditMaterial to handle all material properties
  const handleEditMaterial = (materialId) => {
    const material = materials[materialId];
    if (!material) return;
    
    // Set form fields with existing data
    setNewMaterialName(material.originalDescription || material.name); // Fallback to name if no original description
    setGeneratedMaterialName(material.name || '');
    
    // Set prompt
    const materialPrompt = material.prompt || '';
    setGeneratedPrompt(materialPrompt);
    setCustomPrompt(materialPrompt);
    setShowCustomPrompt(true); // Show the editable prompt by default
    
    // Set thumbnail
    if (material.thumbnail) {
      setPreviewThumbnail(material.thumbnail);
      setUseCustomImage(true); // Mark as custom image to prevent regeneration
    } else if (material.file) {
      setPreviewThumbnail(`/samples/${material.file}`);
      setUseCustomImage(true);
    }
    
    // Enable name editing by default
    setShowMaterialNameEdit(true);
    
    setRecentlyAdded(materialId);
    setShowAddMaterialModal(true);
  };

  // Add a function to manually refresh the thumbnail
  const handleRefreshThumbnail = async (prompt) => {
    if (!newMaterialName.trim() || useCustomImage) {
      console.log('Skipping thumbnail refresh: No material name or using custom image');
      return;
    }
    
    setIsGeneratingPreview(true);
    
    try {
      const promptToUse = showCustomPrompt && customPrompt.trim()
        ? customPrompt
        : generatePromptForMaterial(newMaterialName);
      
      // Use the dedicated thumbnail endpoint instead
      const response = await fetch("/api/generate-thumbnail", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: promptToUse,
          referenceImageData: DEFAULT_SHAPE_DATA_URL
        }),
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Thumbnail API response:', {
        success: data.success,
        hasImageData: !!data.imageData,
        error: data.error
      });
      
      if (data.success && data.imageData) {
        // Set the preview thumbnail
        setPreviewThumbnail(`data:image/jpeg;base64,${data.imageData}`);
        console.log('Successfully set new thumbnail');
      } else {
        throw new Error(data.error || 'No image data received');
      }
    } catch (error) {
      console.error("Error generating preview thumbnail:", error);
      
      // If we have a previous thumbnail, keep it
      if (previewThumbnail) {
        console.log('Keeping previous thumbnail after error');
      } else {
        // Otherwise generate a fallback
        console.log('Using fallback thumbnail after API error');
        const fallbackThumbnail = createFallbackThumbnail(newMaterialName);
        setPreviewThumbnail(fallbackThumbnail);
      }
      
      // Show a brief notification about the error
      const errorToast = document.createElement('div');
      errorToast.className = 'fixed bottom-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
      errorToast.innerText = 'Thumbnail generation failed. Using fallback.';
      document.body.appendChild(errorToast);
      
      // Remove the notification after 3 seconds
      setTimeout(() => {
        if (document.body.contains(errorToast)) {
          document.body.removeChild(errorToast);
        }
      }, 3000);
      
    } finally {
      setIsGeneratingPreview(false);
    }
  };

  // Add a function to manually refresh the text
  const handleRefreshText = async () => {
    if (!newMaterialName.trim()) return;
    
    setIsGeneratingText(true);
    
    try {
      // ... existing code for text generation ...
      // This can reuse the same code from the useEffect
    } catch (error) {
      console.error("Error generating material name and prompt:", error);
    } finally {
      setIsGeneratingText(false);
    }
  };

  // Modify handleNewMaterialDescription to only handle preview generation
  const handleNewMaterialDescription = async (description) => {
    if (!description.trim()) return;
    
    setIsGeneratingText(true);
    setIsGeneratingPreview(true);
    
    // Keep track of whether we've set a thumbnail yet
    let thumbnailSet = false;
    
    try {
      // First, get the enhanced description
      console.log(`Generating enhanced description for: "${description}"`);
      const enhanced = await enhanceMaterialDetails(description);
      setGeneratedMaterialName(enhanced.name);
      setGeneratedPrompt(enhanced.prompt);
      
      // Generate thumbnail with the enhanced prompt
      if (!useCustomImage) {
        try {
          console.log(`Generating thumbnail with prompt: "${enhanced.prompt.substring(0, 100)}..."`);
          
          // Set a timeout to ensure we don't wait too long for the API
          const thumbnailPromise = fetch("/api/generate", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              prompt: enhanced.prompt,
            }),
          });
          
          // Add a timeout to the thumbnail generation
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Thumbnail generation timed out')), 12000)
          );
          
          // Race the thumbnail generation against the timeout
          const response = await Promise.race([thumbnailPromise, timeoutPromise]);
          
          if (!response.ok) {
            throw new Error(`API returned status ${response.status}`);
          }
          
          const data = await response.json();
          
          if (data.success && data.imageData) {
            console.log('Successfully received thumbnail data');
            setPreviewThumbnail(`data:image/jpeg;base64,${data.imageData}`);
            thumbnailSet = true;
          } else {
            throw new Error(data.error || 'No image data received');
          }
        } catch (thumbnailError) {
          console.error("Error generating thumbnail:", thumbnailError);
          
          // Fall back to a static thumbnail if we couldn't generate one
          console.log('Using fallback static thumbnail');
          
          // Create a colored square as a fallback thumbnail
          const fallbackThumbnail = createFallbackThumbnail(description);
          setPreviewThumbnail(fallbackThumbnail);
          thumbnailSet = true;
        }
      }
    } catch (error) {
      console.error("Error in material generation:", error);
      
      // Set fallback values if we failed to generate enhanced content
      const capitalizedName = description
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
        
      setGeneratedMaterialName(`${capitalizedName} Material`);
      setGeneratedPrompt(generatePromptForMaterial(description));
      
      // If we haven't set a thumbnail yet, create a fallback one
      if (!thumbnailSet && !useCustomImage) {
        console.log('Using fallback static thumbnail after error');
        const fallbackThumbnail = createFallbackThumbnail(description);
        setPreviewThumbnail(fallbackThumbnail);
      }
    } finally {
      setIsGeneratingText(false);
      setIsGeneratingPreview(false);
    }
  };

  // Add a function to create a fallback thumbnail
  const createFallbackThumbnail = (text) => {
    // Generate a consistent color from the text
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      hash = text.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    // Convert hash to RGB color
    const r = (hash & 0xFF0000) >> 16;
    const g = (hash & 0x00FF00) >> 8;
    const b = hash & 0x0000FF;
    
    // Create a small canvas to generate the thumbnail
    const canvas = document.createElement('canvas');
    canvas.width = 100;
    canvas.height = 100;
    const ctx = canvas.getContext('2d');
    
    // Create gradient background
    const gradient = ctx.createLinearGradient(0, 0, 100, 100);
    gradient.addColorStop(0, `rgb(${r}, ${g}, ${b})`);
    gradient.addColorStop(1, `rgb(${b}, ${r}, ${g})`);
    
    // Fill the background
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 100, 100);
    
    // Add text first letter
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.font = 'bold 48px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text.charAt(0).toUpperCase(), 50, 50);
    
    // Return as data URL
    return canvas.toDataURL('image/jpeg', 0.9);
  };

  const handleCreateMaterial = async () => {
    if (!newMaterialName.trim()) return;
    
    // Generate a unique ID for the material
    const materialId = recentlyAdded || `custom_${Date.now()}`;
    
    // Use the generated material name instead of the description
    const displayName = generatedMaterialName || `${newMaterialName} Material`;
    
    // Use the generated or custom prompt
    const materialPrompt = showCustomPrompt ? customPrompt : (generatedPrompt || generatePromptForMaterial(newMaterialName));
    
    // Create the new material object
    const newMaterial = {
      name: displayName,
      prompt: materialPrompt,
      thumbnail: useCustomImage ? customImagePreview : previewThumbnail,
      originalDescription: newMaterialName,
      isCustom: true
    };
    
    // Update both our state and storage references
    const updatedMaterials = { ...materials, [materialId]: newMaterial };
    
    try {
      // Apply compression and save to localStorage
      if (useCustomImage && customImagePreview) {
        newMaterial.thumbnail = await compressImageForStorage(customImagePreview);
      } else if (previewThumbnail) {
        newMaterial.thumbnail = await compressImageForStorage(previewThumbnail);
      }
      
      await manageStorageLimit(newMaterial);
      localStorage.setItem('customMaterials', JSON.stringify(updatedMaterials));
      
      // Update state and global reference
      styleOptions = updatedMaterials;
      setMaterials(updatedMaterials);
      
      // Close the modal
      setShowAddMaterialModal(false);
      
      // Reset form
      resetMaterialForm();
      
      // Auto-select the newly created material
      setStyleMode(materialId);
      
      // Trigger generation with the new material
      if (handleGenerate && typeof handleGenerate === 'function') {
        setTimeout(() => handleGenerate(), 100); // Small delay to ensure styleMode is updated
      }
      
      console.log("Material created successfully:", materialId);
    } catch (error) {
      console.error('Storage error:', error);
      alert("Couldn't save your material. Please try clearing some browser data.");
    }
  };

  const handleDeleteMaterial = (event, key) => {
    event.stopPropagation(); // Prevent triggering the parent button's onClick
    
    // Only allow deleting custom materials
    if (styleOptions[key]?.isCustom) {
      if (window.confirm(`Are you sure you want to delete the "${styleOptions[key].name}" material?`)) {
        // If currently selected, switch to default material
        if (styleMode === key) {
          setStyleMode('material');
        }
        
        // Delete the material
        const { [key]: deleted, ...remaining } = styleOptions;
        const updatedMaterials = { ...defaultStyleOptions, ...remaining };
        styleOptions = updatedMaterials;
        setMaterials(updatedMaterials);
        
        // Save the updated materials
        const customMaterials = {};
        Object.entries(remaining).forEach(([k, v]) => {
          if (!defaultStyleOptions[k]) {
            customMaterials[k] = v;
          }
        });
        localStorage.setItem('customMaterials', JSON.stringify(customMaterials));
      }
    }
  };

  // Add a function to sort materials in the desired order
  const getSortedMaterials = (materials) => {
    // For mobile view, we'll handle the order in the render function
    // This function now only handles desktop order
    
    // 1. Get original materials (excluding Test Material)
    const originalMaterials = Object.entries(defaultStyleOptions)
      .filter(([key]) => key !== 'testMaterial')
      .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});

    // 2. Get custom/locally saved materials (excluding Test Material)
    const customMaterials = Object.entries(materials)
      .filter(([key]) => !defaultStyleOptions[key] && key !== 'testMaterial')
      .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});

    // 3. Get Test Material
    const testMaterial = materials.testMaterial ? { testMaterial: materials.testMaterial } : {};

    // Combine in desired order
    return {
      ...originalMaterials,
      ...customMaterials,
      ...testMaterial
    };
  };

  // New function to separate materials for mobile view
  const getMobileSortedElements = (materials, styleMode, handleAddMaterial, handleGenerate) => {
    // 1. Extract all materials except testMaterial (Surprise Me)
    const regularMaterials = Object.entries(materials)
      .filter(([key]) => key !== 'testMaterial')
      .map(([key, material]) => ({ key, material }));
    
    // 2. Get the Surprise Me button if it exists
    const testMaterial = materials.testMaterial ? { key: 'testMaterial', material: materials.testMaterial } : null;
    
    return {
      addButton: handleAddMaterial,
      materials: regularMaterials,
      surpriseButton: testMaterial
    };
  };

  // Add near your existing compression functions
  const compressImageForAPI = async (dataUrl) => {
    // Use a moderate size to ensure API can handle it
    const maxWidth = 800;
    const quality = 0.7;
    
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        let width = img.width;
        let height = img.height;
        
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = dataUrl;
    });
  };

  // Fix the reference image upload function
  const handleReferenceImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Clear recentlyAdded to ensure we're not in edit mode
    setRecentlyAdded(null);
    
    // Set loading states
    setIsGeneratingText(true);
    setIsGeneratingPreview(true);
    
    try {
      // Process the image for preview
      const reader = new FileReader();
      reader.onloadend = async (event) => {
        const imageDataUrl = event.target.result;
        
        // Set UI state for image
        setCustomImagePreview(imageDataUrl);
        setUseCustomImage(true);
        
        // Get custom API key if it exists
        const customApiKey = localStorage.getItem('customApiKey');
        
        // Call the visual-enhance-prompt API
        try {
          const compressedImage = await compressImageForAPI(imageDataUrl);
          
          const response = await fetch('/api/visual-enhance-prompt', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
              image: compressedImage,
              customApiKey,
              basePrompt: 'Transform this sketch into a material with professional studio lighting against a pure black background. Render it in Cinema 4D with Octane for a high-end 3D visualization.'
            }),
          });
          
          console.log('API response status:', response.status);
          
          if (!response.ok) {
            const errorText = await response.text().catch(() => '');
            console.error('API error details:', errorText);
            console.error(`API returned ${response.status}`);
            
            // Set fallback values right here when the API response is not OK
            setGeneratedMaterialName('Reference Material');
            setNewMaterialName('Reference Material');
            setGeneratedPrompt('Transform this reference into a 3D rendering with dramatic lighting on a black background.');
            setCustomPrompt('Transform this reference into a 3D rendering with dramatic lighting on a black background.');
            setShowCustomPrompt(true);
          } else {
            const data = await response.json();
            
            if (data.enhancedPrompt && data.suggestedName) {
              // Update the material information
              setGeneratedMaterialName(data.suggestedName);
              setNewMaterialName(data.suggestedName);
              setGeneratedPrompt(data.enhancedPrompt);
              setCustomPrompt(data.enhancedPrompt);
              setShowCustomPrompt(true);
              
              // If we have imageData from the API, use it as the preview
              if (data.imageData) {
                setPreviewThumbnail(`data:image/jpeg;base64,${data.imageData}`);
                setUseCustomImage(false); // Use the generated thumbnail instead of the raw image
              }
            } else {
              // Handle case where API returns success but missing data
              console.error('API response missing enhancedPrompt or suggestedName fields');
              setGeneratedMaterialName('Reference Material');
              setNewMaterialName('Reference Material');
              setGeneratedPrompt('Transform this reference into a 3D rendering with dramatic lighting on a black background.');
              setCustomPrompt('Transform this reference into a 3D rendering with dramatic lighting on a black background.');
              setShowCustomPrompt(true);
            }
          }
        } catch (error) {
          console.error('Error analyzing reference image:', error);
          
          // Show specific error message for quota exceeded
          if (error.message?.includes('429')) {
            alert('API quota exceeded. Please try again later or add your own API key in settings.');
          }
          
          // Set fallback values
          setGeneratedMaterialName('Reference Material');
          setNewMaterialName('Reference Material');
          setGeneratedPrompt('Transform this reference into a 3D rendering with dramatic lighting on a black background.');
          setCustomPrompt('Transform this reference into a 3D rendering with dramatic lighting on a black background.');
          setShowCustomPrompt(true);
        } finally {
          setIsGeneratingText(false);
          setIsGeneratingPreview(false);
        }
      };
      
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error processing image:', error);
      setIsGeneratingText(false);
      setIsGeneratingPreview(false);
    }
  };

  // Add this near the top of the component
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Close if clicking outside the popover and the style selector
      if (showPromptInfo && 
          !event.target.closest('.prompt-popover') && 
          !event.target.closest('.material-edit-button')) {
        setShowPromptInfo(null);
        setEditingPrompt(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showPromptInfo]);

  // Update the calculatePopoverPosition function
  const calculatePopoverPosition = (buttonElement, materialKey) => {
    if (!buttonElement) return;
    
    // If clicking the same material that's already open, close it
    if (showPromptInfo === materialKey) {
      setShowPromptInfo(null);
      setEditingPrompt(null);
      setEditedPromptText('');
      setHasPromptChanged(false);
      return;
    }

    const rect = buttonElement.getBoundingClientRect();
    const popoverWidth = 300;

    setPromptPopoverPosition({
      top: rect.top - 10,
      left: rect.left + (rect.width / 2) - (popoverWidth / 2)
    });
    
    // Set which material's prompt to show
    setShowPromptInfo(materialKey);
    
    // Reset editing state
    setEditingPrompt(null);
    setEditedPromptText(materials[materialKey]?.prompt || '');
    setHasPromptChanged(false);
  };

  // Add function to handle text changes in the textarea
  const handlePromptTextChange = (e) => {
    const newText = e.target.value;
    setEditedPromptText(newText);
    
    // Check if the text has changed from the original
    if (editingPrompt && materials[editingPrompt]) {
      const originalPrompt = materials[editingPrompt].prompt || '';
      setHasPromptChanged(newText !== originalPrompt);
    }
  };

  // Add function to save edited prompt
  const saveEditedPrompt = () => {
    if (!editingPrompt || !editedPromptText.trim() || !hasPromptChanged) return;
    
    try {
      // Create updated material with new prompt
      const updatedMaterial = {
        ...materials[editingPrompt],
        prompt: editedPromptText.trim()
      };
      
      // Update materials state and styleOptions
      const updatedMaterials = {
        ...materials,
        [editingPrompt]: updatedMaterial
      };
      
      setMaterials(updatedMaterials);
      styleOptions = updatedMaterials;
      
      // Save to localStorage (only custom materials)
      const customMaterials = {};
      for (const [k, v] of Object.entries(updatedMaterials)) {
        if (v.isCustom) {
          customMaterials[k] = v;
        }
      }
      
      localStorage.setItem('customMaterials', JSON.stringify(customMaterials));
      
      // Close edit mode
      setEditingPrompt(null);
      setShowPromptInfo(null);
      setHasPromptChanged(false);
    } catch (error) {
      console.error('Error saving edited prompt:', error);
    }
  };

  // Add function to cancel editing
  const cancelEditing = () => {
    setEditingPrompt(null);
    setEditedPromptText('');
    setHasPromptChanged(false);
  };

  const handleGenerateThumbnail = useCallback(async () => {
    // Prevent generation if text is still generating or already previewing
    if (isGeneratingText || isGeneratingPreview || !generatedPrompt) return;

    console.log('Starting thumbnail generation...');
    setIsGeneratingPreview(true);
    setThumbnailError(null); // Clear previous errors

    // --- CONFIRM THE PROMPT BEING USED ---
    console.log('Using prompt for thumbnail:', generatedPrompt.substring(0, 100) + '...');
    // --- You can check this log in your browser console ---

    try {
      // Fetch the thumbnail from the API endpoint
      const response = await fetch("/api/generate-thumbnail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Send the CURRENT generatedPrompt and the default shape
        body: JSON.stringify({
          prompt: generatedPrompt, // <-- Uses the state variable!
          referenceImageData: DEFAULT_SHAPE_DATA_URL // Base shape image
        }),
      });

      if (!response.ok) {
        // Handle HTTP errors from the API
        const errorData = await response.json().catch(() => ({ error: 'Failed to parse error response' }));
        throw new Error(`API Error (${response.status}): ${errorData.error || 'Unknown error'}`);
      }

      const data = await response.json();

      if (data.success && data.imageData) {
        // Update state with the new thumbnail data
        setGeneratedThumbnail(`data:image/png;base64,${data.imageData}`);
        console.log('Thumbnail generated successfully.');
      } else {
        // Handle cases where API reports success=false or missing data
        throw new Error(data.error || 'Thumbnail generation failed: No image data received.');
      }
    } catch (error) {
      console.error("Error generating thumbnail:", error);
      setThumbnailError(error.message || 'An unexpected error occurred during thumbnail generation.');
      setGeneratedThumbnail(null); // Clear any previous thumbnail on error
    } finally {
      setIsGeneratingPreview(false); // Ensure loading state is turned off
    }
  }, [generatedPrompt, isGeneratingText, isGeneratingPreview]); // Dependencies

  return (
    <div className="w-full" ref={styleSelectorRef}>
      {/* Inject scrollbar hiding CSS */}
      <style dangerouslySetInnerHTML={{ __html: scrollbarHideStyles }} />
      
      {/* Mobile View */}
      <div className="md:hidden w-full">
        <div className="overflow-x-auto pb-2 scrollbar-hide">
          <div className="flex flex-nowrap gap-2 pr-2" style={{ minWidth: 'min-content' }}>
            {/* Add Material Button (First) */}
            <button
              onClick={handleAddMaterial}
              type="button"
              aria-label="Add new material"
              className="focus:outline-none group flex-shrink-0"
              style={{ scrollSnapAlign: 'start' }}
            >
              <div className="w-20 border border-dashed border-gray-200 overflow-hidden rounded-xl bg-gray-50 flex flex-col group-hover:bg-white group-hover:border-gray-300">
                <div className="w-full relative flex-1 flex items-center justify-center" style={{ aspectRatio: '1/1' }}>
                  <Plus className="w-6 h-6 text-gray-500 group-hover:text-gray-600" />
                </div>
                <div className="px-1 py-1 text-left text-xs font-medium bg-gray-50 text-gray-500 w-full group-hover:bg-white group-hover:text-gray-600">
                  <div className="truncate">
                    Add Material
                  </div>
                </div>
              </div>
            </button>
            
            {/* Regular Materials (Middle) */}
            {Object.entries(materials)
              .filter(([key]) => key !== 'testMaterial')
              .map(([key, { name, file, imageData, thumbnail, isCustom, prompt }]) => (
                <button
                  key={key}
                  onClick={async () => {
                    const isSameMaterial = styleMode === key;
                    if (!isSameMaterial) {
                      setStyleMode(key);
                    } else {
                      handleGenerate();
                    }
                  }}
                  type="button"
                  aria-label={`Select ${name} style`}
                  aria-pressed={styleMode === key}
                  className="focus:outline-none relative group flex-shrink-0"
                  style={{ scrollSnapAlign: 'start' }}
                >
                  <div className={`w-20 border overflow-hidden rounded-xl ${
                    styleMode === key
                      ? 'border-blue-500 bg-white'
                      : 'bg-gray-50 border-gray-200 group-hover:bg-white group-hover:border-gray-300'
                  }`}>
                    <div className="w-full relative" style={{ aspectRatio: '1/1' }}>
                      <img 
                        src={imageData ? `data:image/jpeg;base64,${imageData}` : (file ? `/samples/${file}` : thumbnail || '')}
                        alt={`${name} style example`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          console.error(`Error loading thumbnail for ${name} from ${e.target.src}`);
                          // Provide a base64 encoded 1x1 transparent PNG as fallback
                          e.target.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
                        }}
                      />
                      <div className="absolute inset-0">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              calculatePopoverPosition(e.currentTarget, key);
                            }}
                            className="material-edit-button absolute top-1 right-1 bg-gray-800 bg-opacity-70 hover:bg-opacity-90 text-white rounded-full w-5 h-5 flex items-center justify-center transition-opacity"
                            aria-label={isCustom ? `Edit ${name} material` : `View ${name} prompt`}
                          >
                            <Info className="w-2.5 h-2.5" />
                          </button>
                          
                          {isCustom && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleDeleteMaterial(e, key);
                              }}
                              className="absolute top-1 left-1 bg-gray-800 bg-opacity-70 hover:bg-opacity-90 text-white rounded-full w-5 h-5 flex items-center justify-center transition-opacity"
                              aria-label={`Delete ${name} material`}
                            >
                              <Trash2 className="w-2.5 h-2.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className={`px-1 py-1 text-left text-xs font-medium ${
                      styleMode === key
                        ? 'bg-blue-50 text-blue-600'
                        : 'bg-gray-50 text-gray-500 group-hover:bg-white group-hover:text-gray-600'
                    }`}>
                      <div className="truncate">
                        {name}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            
            {/* Surprise Me Button (Last) */}
            {materials.testMaterial && (
              <button
                key="testMaterial"
                onClick={async () => {
                  const isSameMaterial = styleMode === 'testMaterial';
                  if (!isSameMaterial) {
                    setStyleMode('testMaterial');
                  } else {
                    handleGenerate();
                  }
                }}
                type="button"
                aria-label={`Select ${materials.testMaterial.name} style`}
                aria-pressed={styleMode === 'testMaterial'}
                className="focus:outline-none relative group flex-shrink-0"
                style={{ scrollSnapAlign: 'end' }}
              >
                <div className={`w-20 border overflow-hidden rounded-xl ${
                  styleMode === 'testMaterial' 
                    ? 'border-blue-500 bg-white' 
                    : 'bg-gray-50 border-gray-200 border-dashed group-hover:bg-white group-hover:border-gray-300'
                }`}>
                  <div className="w-full relative" style={{ aspectRatio: '1/1' }}>
                    <div className={`w-full h-full flex items-center justify-center ${
                      styleMode === 'testMaterial' ? 'bg-white' : 'bg-gray-50 group-hover:bg-white'
                    }`}>
                      <HelpCircle className={`w-8 h-8 ${
                        styleMode === 'testMaterial' ? 'text-blue-600' : 'text-gray-500 group-hover:text-gray-600'
                      }`} />
                    </div>
                  </div>
                  <div className={`px-1 py-1 text-left text-xs font-medium ${
                    styleMode === 'testMaterial'
                      ? 'bg-blue-50 text-blue-600'
                      : 'bg-gray-50 text-gray-500 group-hover:bg-white group-hover:text-gray-600'
                  }`}>
                    <div className="truncate">
                      {materials.testMaterial.name}
                    </div>
                  </div>
                </div>
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* Desktop View */}
      <div className="hidden md:block">
        <div className="overflow-x-auto">
          <div className="flex flex-wrap gap-2 overflow-y-auto max-h-[35vh] pr-2">
            {/* 1. Original + 2. Local + 3. Test Material */}
            {Object.entries(getSortedMaterials(materials)).map(([key, { name, file, imageData, thumbnail, isCustom, prompt }]) => (
              <button
                key={key}
                onClick={async () => {
                  const isSameMaterial = styleMode === key;
                  if (!isSameMaterial) {
                    setStyleMode(key);
                  } else {
                    handleGenerate();
                  }
                }}
                type="button"
                aria-label={`Select ${name} style`}
                aria-pressed={styleMode === key}
                className="focus:outline-none relative group"
              >
                <div className={`w-20 border overflow-hidden rounded-xl ${
                  styleMode === key
                    ? key === 'testMaterial' ? 'border-blue-500 bg-white' : 'border-blue-500 bg-white'
                    : key === 'testMaterial'
                      ? 'bg-gray-50 border-gray-200 border-dashed group-hover:bg-white group-hover:border-gray-300'
                      : 'bg-gray-50 border-gray-200 group-hover:bg-white group-hover:border-gray-300'
                }`}>
                  <div className="w-full relative" style={{ aspectRatio: '1/1' }}>
                    {key === 'testMaterial' ? (
                      <div className={`w-full h-full flex items-center justify-center ${
                        styleMode === key ? 'bg-white' : 'bg-gray-50 group-hover:bg-white'
                      }`}>
                        <HelpCircle className={`w-8 h-8 ${
                          styleMode === key ? 'text-blue-600' : 'text-gray-500 group-hover:text-gray-600'
                        }`} />
                      </div>
                    ) : (
                      <img 
                        src={imageData ? `data:image/jpeg;base64,${imageData}` : (file ? `/samples/${file}` : thumbnail || '')}
                        alt={`${name} style example`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          console.error(`Error loading thumbnail for ${name} from ${e.target.src}`);
                          // Provide a base64 encoded 1x1 transparent PNG as fallback
                          e.target.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
                        }}
                      />
                    )}
                    <div className="absolute inset-0">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            calculatePopoverPosition(e.currentTarget, key);
                          }}
                          className="material-edit-button absolute top-1 right-1 bg-gray-800 bg-opacity-70 hover:bg-opacity-90 text-white rounded-full w-5 h-5 flex items-center justify-center transition-opacity"
                          aria-label={isCustom ? `Edit ${name} material` : `View ${name} prompt`}
                        >
                          <Info className="w-2.5 h-2.5" />
                        </button>
                        
                        {isCustom && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleDeleteMaterial(e, key);
                            }}
                            className="absolute top-1 left-1 bg-gray-800 bg-opacity-70 hover:bg-opacity-90 text-white rounded-full w-5 h-5 flex items-center justify-center transition-opacity"
                            aria-label={`Delete ${name} material`}
                          >
                            <Trash2 className="w-2.5 h-2.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className={`px-1 py-1 text-left text-xs font-medium ${
                    styleMode === key
                      ? 'bg-blue-50 text-blue-600'
                      : 'bg-gray-50 text-gray-500 group-hover:bg-white group-hover:text-gray-600'
                  }`}>
                    <div className="truncate">
                      {name}
                    </div>
                  </div>
                </div>
              </button>
            ))}
            
            <button
              onClick={handleAddMaterial}
              type="button"
              aria-label="Add new material"
              className="focus:outline-none group"
            >
              <div className="w-20 border border-dashed border-gray-200 overflow-hidden rounded-xl bg-gray-50 flex flex-col group-hover:bg-white group-hover:border-gray-300">
                <div className="w-full relative flex-1 flex items-center justify-center" style={{ aspectRatio: '1/1' }}>
                  <Plus className="w-6 h-6 text-gray-500 group-hover:text-gray-600" />
                </div>
                <div className="px-1 py-1 text-left text-xs font-medium bg-gray-50 text-gray-500 w-full group-hover:bg-white group-hover:text-gray-600">
                  <div className="truncate">
                    Add Material
                  </div>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>

      {showPromptInfo && typeof document !== 'undefined' && createPortal(
        <div 
          className="prompt-popover fixed z-[9999] bg-white border border-gray-200 text-gray-900 rounded-lg shadow-lg p-4 text-xs"
          style={{
            top: `${promptPopoverPosition.top}px`,
            left: `${promptPopoverPosition.left}px`,
            width: '300px',
            transform: 'translateY(-100%)',
            maxHeight: '60vh',
          }}
        >
          <button
            type="button"
            className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
            onClick={() => {
              setShowPromptInfo(null);
              setEditingPrompt(null);
            }}
            aria-label="Close prompt info"
          >
            ×
          </button>

          <div className="text-sm font-medium mb-2 text-gray-700">
            {materials[showPromptInfo]?.name || ''}
          </div>
          
          {materials[showPromptInfo]?.isCustom ? (
            <>
              <textarea
                className={`font-mono text-xs w-full h-60 bg-gray-50 border ${editingPrompt ? 'border-blue-300 focus:border-blue-500' : 'border-gray-200'} rounded p-2 text-gray-900`}
                value={editingPrompt ? editedPromptText : (materials[showPromptInfo]?.prompt || '')}
                onChange={handlePromptTextChange}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!editingPrompt) {
                    setEditingPrompt(showPromptInfo);
                    setEditedPromptText(materials[showPromptInfo]?.prompt || '');
                  }
                }}
                onFocus={(e) => {
                  if (!editingPrompt) {
                    setEditingPrompt(showPromptInfo);
                    setEditedPromptText(materials[showPromptInfo]?.prompt || '');
                    // Place cursor at end of text
                    const val = e.target.value;
                    e.target.value = '';
                    e.target.value = val;
                  }
                }}
                onKeyDown={(e) => {
                  // Save changes on Ctrl+Enter or Cmd+Enter
                  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                    e.preventDefault();
                    if (editingPrompt && hasPromptChanged) {
                      saveEditedPrompt();
                    }
                  }
                  e.stopPropagation();
                }}
                placeholder="Edit prompt here..."
                readOnly={!editingPrompt}
              />
              {/* {editingPrompt && (
                <div className="text-xs text-gray-500 mt-1 mb-2 flex items-center">
                  <span className="mr-1">Pro tip:</span> 
                  <kbd className="px-1 py-0.5 border border-gray-300 rounded text-xs bg-gray-50 mr-1">
                    {navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'}
                  </kbd>
                  <span className="mr-1">+</span>
                  <kbd className="px-1 py-0.5 border border-gray-300 rounded text-xs bg-gray-50">
                    Enter
                  </kbd>
                  <span className="ml-1">to save</span>
                </div>
              )} */}
              <div className="flex justify-between mt-2">
                <button
                  type="button"
                  className="flex items-center bg-red-500 hover:bg-red-600 text-white rounded px-2 py-1 text-xs"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleDeleteMaterial(e, showPromptInfo);
                    setShowPromptInfo(null);
                  }}
                >
                  <Trash2 className="w-3 h-3 mr-1" />
                  Delete
                </button>
                <button
                  type="button"
                  className={`flex items-center ${
                    editingPrompt 
                      ? hasPromptChanged 
                        ? 'bg-blue-500 hover:bg-blue-600'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-500 hover:bg-blue-600'
                  } text-white rounded px-2 py-1 text-xs`}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (editingPrompt) {
                      if (hasPromptChanged) {
                        saveEditedPrompt();
                      }
                    } else {
                      setEditingPrompt(showPromptInfo);
                      setEditedPromptText(materials[showPromptInfo]?.prompt || '');
                    }
                  }}
                  disabled={editingPrompt && !hasPromptChanged}
                >
                  {editingPrompt 
                    ? <><Check className="w-3 h-3 mr-1" />Save Changes</>
                    : <><Edit className="w-3 h-3 mr-1" />Edit Prompt</>
                  }
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="font-mono text-xs overflow-y-auto max-h-60 border border-gray-200 rounded p-2 bg-gray-50 mb-3">
                {materials[showPromptInfo]?.prompt || 'No prompt available'}
              </div>
            </>
          )}
          
          <div className="absolute bottom-0 left-1/2 w-3 h-3 bg-white border-b border-r border-gray-200 transform translate-y-1/2 rotate-45 -translate-x-1/2" />
        </div>,
        document.body
      )}

      <AddMaterialModal
        showModal={showAddMaterialModal}
        onClose={() => setShowAddMaterialModal(false)}
        onAddMaterial={handleCreateMaterial}
        newMaterialName={newMaterialName}
        setNewMaterialName={setNewMaterialName}
        generatedMaterialName={generatedMaterialName}
        setGeneratedMaterialName={setGeneratedMaterialName}
        generatedPrompt={generatedPrompt}
        setGeneratedPrompt={setGeneratedPrompt}
        customPrompt={customPrompt}
        setCustomPrompt={setCustomPrompt}
        previewThumbnail={previewThumbnail}
        customImagePreview={customImagePreview}
        useCustomImage={useCustomImage}
        isGeneratingPreview={isGeneratingPreview}
        isGeneratingText={isGeneratingText}
        showMaterialNameEdit={showMaterialNameEdit}
        setShowMaterialNameEdit={setShowMaterialNameEdit}
        showCustomPrompt={showCustomPrompt}
        setShowCustomPrompt={setShowCustomPrompt}
        handleRefreshThumbnail={handleRefreshThumbnail}
        handleReferenceImageUpload={handleReferenceImageUpload}
        handleNewMaterialDescription={handleNewMaterialDescription}
        onStyleSelected={(materialKey) => {
          // Update the styleMode to select the new material
          setStyleMode(materialKey);
          // Update the materials state to reflect the change
          setMaterials({...styleOptions});
        }}
        materials={materials}
      />
    </div>
  );
};

export default StyleSelector; 