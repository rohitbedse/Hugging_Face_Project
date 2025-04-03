import { LoaderCircle, ImageIcon, Send, RotateCw, Maximize, Wand2, Sun, Plus, Palette, Image as ImageLucide, Brush, SendToBack, Download, ArrowLeftRight } from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';
import ImageRefiner from './ImageRefiner';
import HeaderButtons from './HeaderButtons';

// Update REFINEMENT_SUGGESTIONS with cleaner labels and full prompts
const REFINEMENT_SUGGESTIONS = [
  { label: 'Rotate', prompt: 'Can you rotate this by ', icon: RotateCw },
  { label: 'Add light', prompt: 'Can you add a light from the ', icon: Sun },
  { label: 'Add object', prompt: 'Can you add a ', icon: Plus },
  { label: 'Background', prompt: 'Can you change the background to ', icon: ImageLucide },
  { label: 'Color', prompt: 'Can you make the color more ', icon: Palette },
  { label: 'Scale', prompt: 'Can you make this ', icon: Maximize },
  { label: 'Lighting', prompt: 'Can you make the lighting more ', icon: Sun },
  { label: 'Style', prompt: 'Can you make it look more ', icon: Wand2 },
  { label: 'Material', prompt: 'Can you change the material to ', icon: Wand2 },
  // Add more suggestions as needed...
];

// Update SURPRISE_REFINEMENTS with more fun, bonkers prompts
const SURPRISE_REFINEMENTS = [
  // Open-ended prompts (higher probability)
  "Do something cool with this. I leave it up to you!",
  "Surprise me! Take this image somewhere unexpected.",
  "Transform this however you want. Be creative!",
  "Do something wild with this image. No limits!",
  "Make this image magical in your own way.",
  "Take creative freedom with this image. Surprise me!",
  "Show me what you can do with this. Go crazy!",
  "Transform this in a way I wouldn't expect.",
  "Have fun with this and do whatever inspires you.",
  "Go wild with this image! Show me something amazing.",
  "Put your own creative spin on this image.",
  "Reimagine this image however you want. Be bold!",
  "Do something unexpected with this. Totally up to you!",
  "Surprise me with your creativity. Anything goes!",
  "Make this extraordinary in whatever way you choose.",
  "Show off your creative abilities with this image!",
  "Take this in any direction that excites you!",
  "Transform this however your imagination guides you.",
  "Make this magical in your own unique way.",
  "Do something fun and unexpected with this!",
  "Surprise me! Show me your creativity.",
  "Make this more beautiful <3",
  "Put your artistic spin on this image!",
  "Let your imagination run wild with this!",
  "Take this image to a whole new level of awesome!",
  "Make this image extraordinary in your own way.",
  "Do something fantastic with this. Full creative freedom!",
  "Surprise me with a totally unexpected transformation!",
  "Go nuts with this! Show me something incredible!",
  "Add your own wild twist to this image!",
  "Make this image come alive however you want!",
  "Transform this in the most creative way possible!",
  "Go crazy with this. I want to be wowed :))",
  "Do whatever magical things you want with this image!",
  "Reinvent this image however inspires you!",
  
  // Specific wild ideas (lower probability)
  "Can you add this to outer space with aliens having a BBQ?",
  "Can you add a giraffe wearing a tuxedo to this?",
  "Can you make tiny vikings invade this image?",
  "Can you turn this into an ice cream sundae being eaten by robots?",
  "Can you make this float in a sea of rainbow soup?",
  "Can you add dancing pickles to this image?",
  "Can you make this the centerpiece of an alien museum?",
  "Can you add this to a cereal bowl being eaten by a giant?",
  "Can you make this the star of a bizarre music video?",
  "Can you add tiny dinosaurs having a tea party?",
  "Can you turn this into something from a fever dream?",
  "Can you make this the main character in a surreal fairytale?",
  "Can you put this in the middle of a candy landscape?",
  "Can you add this to a world where physics works backwards?",
  "Can you make this the prize in a cosmic game show?",
  "Can you add tiny people worshipping this as a deity?",
  "Can you put this in the paws of a giant cosmic cat?",
  "Can you make this wearing sunglasses and surfing?",
  "Can you add this to a world made entirely of cheese?",
  "Can you make this the centerpiece of a goblin birthday party?",
  "Can you transform this into a cloud creature floating in the sky?",
  "Can you add this to a world where everything is made of pasta?",
  "Can you turn this into a piñata at a monster celebration?",
  "Can you add this to outer space?",
  "Can you add this to a landscape made of breakfast foods?",
  "Can you make this the conductor of an orchestra of unusual animals?",
  "Can you turn this into a strange plant growing in an alien garden?",
  "Can you add this to a world inside a snow globe?",
  "Can you make this the secret ingredient in a witch's cauldron?",
  "Can you turn this into a superhero with an unusual power?",
  "Can you make this swimming in a sea of jelly beans?",
  "Can you add this to a planet where everything is upside down?",
  "Can you make this the treasure in a dragon's unusual collection?",
  "Can you transform this into a character in a bizarre cartoon?",
  "Can you add this to a world where shadows come to life?"
];

const DisplayCanvas = ({ 
  displayCanvasRef, 
  isLoading,
  handleSaveImage,
  handleRegenerate,
  hasGeneratedContent = false,
  currentDimension,
  onOpenHistory,
  onRefineImage,
  onSendToDoodle,
  hasHistory,
  openHistoryModal,
  toggleLibrary
}) => {
  const [showPlaceholder, setShowPlaceholder] = useState(true);
  const [inputValue, setInputValue] = useState('');
  const [showDoodleTooltip, setShowDoodleTooltip] = useState(false);
  const [showSaveTooltip, setShowSaveTooltip] = useState(false);
  const [isHoveringCanvas, setIsHoveringCanvas] = useState(false);
  
  // Update placeholder visibility when loading or content prop changes
  useEffect(() => {
    if (hasGeneratedContent) {
      setShowPlaceholder(false);
    } else if (isLoading) {
      setShowPlaceholder(true);
    }
  }, [isLoading, hasGeneratedContent]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    onRefineImage(inputValue);
    setInputValue('');
  };

  const handleSuggestionClick = (suggestion) => {
    setInputValue(suggestion.prompt);
    document.querySelector('input[name="refiner"]').focus();
  };

  const handleSurpriseMe = () => {
    const randomPrompt = SURPRISE_REFINEMENTS[Math.floor(Math.random() * SURPRISE_REFINEMENTS.length)];
    setInputValue(randomPrompt);
    document.querySelector('input[name="refiner"]').focus();
  };

  const handleSendToDoodle = useCallback(() => {
    if (displayCanvasRef.current && onSendToDoodle) {
      const imageDataUrl = displayCanvasRef.current.toDataURL('image/png');
      onSendToDoodle(imageDataUrl);
    }
  }, [displayCanvasRef, onSendToDoodle]);

  // Function to handle clicking the canvas for regeneration
  const handleCanvasClickForRegenerate = () => {
    if (hasGeneratedContent && !isLoading) {
      handleRegenerate();
    }
  };

  // Placeholder function for fullscreen action
  const handleFullscreen = (e) => {
    e.stopPropagation(); // Prevent triggering the refresh
    alert('Fullscreen action triggered!'); 
    // TODO: Implement actual fullscreen logic (e.g., using Fullscreen API or opening image in new tab)
  };

  return (
    <div className="flex flex-col">
      {/* Canvas container with fixed aspect ratio */}
      <div 
        className="relative w-full"
        style={{ aspectRatio: `${currentDimension.width} / ${currentDimension.height}` }}
      >
        <button
          type="button"
          className="w-full h-full absolute inset-0 z-10 cursor-pointer appearance-none bg-transparent border-0 group" 
          onMouseEnter={() => setIsHoveringCanvas(true)}
          onMouseLeave={() => setIsHoveringCanvas(false)}
          onClick={handleCanvasClickForRegenerate}
          disabled={!hasGeneratedContent || isLoading}
          aria-label="Regenerate image"
        />
        <canvas
          ref={displayCanvasRef}
          width={currentDimension.width}
          height={currentDimension.height}
          className="absolute inset-0 w-full h-full border border-gray-300 bg-white rounded-xl shadow-soft"
          aria-label="Generated image canvas"
        />
        
        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/5 rounded-xl">
            <div className="bg-white/90 rounded-full p-3 shadow-medium">
              <LoaderCircle className="w-8 h-8 animate-spin text-gray-700" />
            </div>
          </div>
        )}
        
        {/* Placeholder overlay */}
        {showPlaceholder && !isLoading && !hasGeneratedContent && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <ImageIcon className="w-7 h-7 text-gray-400 mb-2" />
            <p className="text-gray-400 text-lg font-medium">Generation will appear here</p>
          </div>
        )}

        {/* Hover-to-Refresh Overlay */}        
        {isHoveringCanvas && hasGeneratedContent && !isLoading && (
          // Added transition classes for smoother appearance
          // Changed bg-black/20 to bg-black/10 for a gentler overlay
          <div className="absolute inset-0 flex items-center justify-center bg-black/0 rounded-xl pointer-events-none transition-opacity duration-300 ease-in-out">
            {/* Container for icon - allows separate click handling */}
            {/* Removed Maximize icon */}
            <div className="flex items-center gap-4 bg-white/90 rounded-full p-3 shadow-medium pointer-events-auto"> 
              {/* Refresh Icon (clickable via parent div onClick) */}
              <RotateCw className="w-8 h-8 text-gray-700" title="Click canvas to regenerate"/> 
            </div>
          </div>
        )}
      </div>

      {/* Action bar and refiner section - Combined layout */}
      <div className="mt-4 flex items-stretch justify-between gap-2 max-w-full">
        {/* Left side wrapper for Refiner and action buttons */}
        <div className="flex items-stretch gap-2 flex-1 min-w-0">
          {/* Refiner input - only shown when there's generated content */}
          {hasGeneratedContent ? (
            <>
              <form onSubmit={handleSubmit} className="flex-1 min-w-0">
                <div className="group flex items-center bg-gray-50 focus-within:bg-white rounded-xl shadow-soft p-2 border border-gray-200 focus-within:border-gray-300 h-14 transition-colors">
                  <input
                    name="refiner"
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Type to refine the image..."
                    disabled={isLoading}
                    className="flex-1 px-2 bg-transparent border-none text-sm text-gray-400 placeholder-gray-300 group-focus-within:text-gray-600 group-focus-within:placeholder-gray-400 focus:outline-none transition-colors"
                  />
                  <button
                    type="submit"
                    disabled={isLoading || !inputValue.trim()}
                    className="p-2 rounded-lg text-gray-400 group-focus-within:text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Send refinement"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </form>
              {/* Action buttons wrapper */}
              <div className="flex gap-2">
                {/* "Send to Doodle" button with tooltip */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={handleSendToDoodle}
                    disabled={isLoading}
                    onMouseEnter={() => setShowDoodleTooltip(true)}
                    onMouseLeave={() => setShowDoodleTooltip(false)}
                    className="group w-14 h-14 p-2 rounded-lg bg-gray-50 border border-gray-200 shadow-soft hover:bg-white hover:border-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    aria-label="Send image back to doodle canvas"
                  >
                    <ArrowLeftRight className="w-5 h-5 text-gray-400 group-hover:text-gray-700 transition-colors" />
                  </button>
                  {/* Custom Tooltip - Right aligned */}
                  {showDoodleTooltip && (
                    <div className="absolute bottom-full right-0 mb-2 px-3 py-1.5 bg-white border border-gray-200 text-gray-700 text-xs rounded-lg shadow-soft whitespace-nowrap pointer-events-none">
                      Send Back to Doodle Canvas
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            // Placeholder div to maintain layout when no content
            <div className="flex-1 h-0" />
          )}
        </div>
      </div>

      {/* Refined suggestion chips */}
      {hasGeneratedContent && (
        <div className="mt-4 flex flex-wrap gap-2 text-xs mb-4">
          {/* Surprise Me button with updated styling */}
          <button
            type="button"
            onClick={handleSurpriseMe}
            className="group flex items-center gap-2 px-3 py-1  bg-gray-50 hover:bg-white rounded-full border border-gray-200 text-gray-400 hover:border-gray-300 transition-all focus:outline-none focus:ring-2 focus:ring-gray-200"
          >
            <Wand2 className="w-4 h-4 group-hover:text-gray-600" />
            <span className="group-hover:text-gray-600">Surprise Me</span>
          </button>

          {/* Regular suggestion buttons with updated styling */}
          {REFINEMENT_SUGGESTIONS.map((suggestion) => (
            <button
              key={`suggestion-${suggestion.label}`}
              type="button"
              onClick={() => handleSuggestionClick(suggestion)}
              className="group flex items-center gap-2 px-3 py-1 bg-gray-50 hover:bg-white rounded-full border border-gray-200 text-gray-400 hover:border-gray-300 transition-all focus:outline-none focus:ring-2 focus:ring-gray-200"
            >
              <suggestion.icon className="w-4 h-4 group-hover:text-gray-600" />
              <span className="group-hover:text-gray-600">{suggestion.label}</span>
            </button>
          ))}
        </div>
      )}
      
      {/* Header buttons - Mobile only, appearing below refinement options */}
      <div className="md:hidden flex flex-wrap justify-between items-center gap-2 mt-6 mb-2 w-full">
        <div className="grid grid-cols-3 w-full gap-2">
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
    </div>
  );
};

export default DisplayCanvas; 