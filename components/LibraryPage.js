import { useState, useEffect } from 'react';
import { X, ArrowLeft, Wand2 } from 'lucide-react';
import Masonry from 'react-masonry-css';

// Function to get last modified date from filename for sorting
const getDateFromFilename = (filename) => {
  // Extract date if it's in the format "chrome-study - YYYY-MM-DDTHHMMSS"
  const dateMatch = filename.match(/chrome-study - (\d{4}-\d{2}-\d{2}T\d{6})/);
  if (dateMatch) {
    return new Date(dateMatch[1].replace('T', 'T').slice(0, 19));
  }
  
  // Extract number if it's in the format "chrome-study (XX)" or "chrome-study-XX"
  const numMatch = filename.match(/chrome-study[- ]\(?(\d+)/);
  if (numMatch) {
    return Number.parseInt(numMatch[1], 10);
  }
  
  return 0; // Default value for sorting
};

const LibraryPage = ({ onBack, onUseAsTemplate }) => {
  const [images, setImages] = useState([]);
  const [fullscreenImage, setFullscreenImage] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hoveredImage, setHoveredImage] = useState(null);
  
  // Breakpoint columns configuration for the masonry layout
  const breakpointColumnsObj = {
    default: 4,
    1100: 3,
    700: 2,
    500: 1
  };
  
  useEffect(() => {
    // Function to get all images from the library folder
    const fetchImages = async () => {
      try {
        // Simulate fetching the list of images
        // In a real app, you would fetch this from an API
        const imageFiles = [
          "chrome-study (17).png",
          "chrome-study (19).png",
          "chrome-study (27).png",
          "chrome-study (43).png",
          "chrome-study (47).png",
          "chrome-study (48).png",
          "chrome-study (55).png",
          "chrome-study (56).png",
          "chrome-study (58).png",
          "chrome-study (62).png",
          "chrome-study (64).png",
          "chrome-study (72).png",
          "chrome-study (76).png",
          "chrome-study (77).png",
          "chrome-study (78).png",
          "chrome-study (79).png",
          "chrome-study (81).png",
          "chrome-study (83).png",
          "chrome-study (84).png",
          "chrome-study (86).png",
          "chrome-study (87).png",
          "chrome-study (92).png",
          "chrome-study (94).png",
          "chrome-study (95).png",
          "chrome-study (98).png",
          "chrome-study (99).png",
          "chrome-study - 2025-03-29T231111.407.png",
          "chrome-study - 2025-03-29T231628.676.png",
          "chrome-study - 2025-03-29T231852.687.png",
          "chrome-study - 2025-03-29T232157.263.png",
          "chrome-study - 2025-03-29T232601.690.png",
          "chrome-study - 2025-03-29T235802.886.png",
          "chrome-study - 2025-03-30T000256.137.png",
          "chrome-study - 2025-03-30T000847.148.png",
          "chrome-study - 2025-03-30T001126.978.png",
          "chrome-study - 2025-03-30T001518.410.png",
          "chrome-study - 2025-03-30T002129.834.png",
          "chrome-study - 2025-03-30T002928.187.png",
          "chrome-study - 2025-03-30T003503.053.png",
          "chrome-study - 2025-03-30T003713.255.png",
          "chrome-study - 2025-03-30T003942.300.png",
          "chrome-study - 2025-03-30T011127.402.png",
          "chrome-study-11.png",
          "chrome-study-6.png"
        ];
        
        // Sort images by "newest" (using filename to guess date/order)
        // In a real app, you would have actual metadata
        const sortedImages = imageFiles.sort((a, b) => {
          const dateA = getDateFromFilename(a);
          const dateB = getDateFromFilename(b);
          return dateB - dateA; // Descending order
        });
        
        setImages(sortedImages);
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching library images:", error);
        setIsLoading(false);
      }
    };
    
    fetchImages();
  }, []);
  
  const handleImageClick = (imagePath) => {
    setFullscreenImage(imagePath);
  };
  
  const handleKeyDown = (event, imagePath) => {
    if (event.key === 'Enter' || event.key === ' ') {
      setFullscreenImage(imagePath);
    }
  };
  
  return (
    <div className="flex min-h-screen flex-col items-center justify-start bg-gray-50 p-2 md:p-4 overflow-y-auto">
      <div className="w-full max-w-[1800px] mx-auto pb-32">
        {/* Fixed header section */}
        <div className="fixed top-0 left-0 right-0 bg-gray-50 z-10 px-2 md:px-4 pt-2 md:pt-4 pb-3">
          <div className="w-full max-w-[1800px] mx-auto">
            {/* Simple Header */}
            <div className="flex items-center justify-between mt-4 mx-1">
              <button 
                type="button"
                onClick={onBack}
                className="flex items-center text-gray-800 hover:text-gray-600 hover:cursor-pointer transition-colors text-lg font-medium"
                aria-label="Go back to gallery"
              >
                <ArrowLeft className="w-5 h-5 mr-1" />
                Gallery
              </button>

              <div>
                <span className="inline-flex items-center rounded-full border px-5 py-2 border-gray-200 bg-gray-100 text-base text-gray-500">
                  Submit by replying to this{" "}<a href="https://x.com/dev_valladares/status/1799888888888888888" target="_blank" rel="noreferrer" className="underline ml-1">tweet</a>
                </span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Content with padding to account for fixed header */}
        <div className="space-y-4 mt-28">
          {/* Loading state */}
          {isLoading && (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-400" />
            </div>
          )}
          
          {/* Masonry grid of images */}
          <Masonry
            breakpointCols={breakpointColumnsObj}
            className="flex w-auto -ml-4"
            columnClassName="pl-4 bg-clip-padding"
          >
            {images.map((image, index) => (
              <button 
                key={image}
                className="mb-4 cursor-pointer transform transition-transform hover:scale-[1.01] text-left block w-full p-0 border-0 bg-transparent"
                onClick={() => handleImageClick(`/library/${image}`)}
                onMouseEnter={() => setHoveredImage(image)}
                onMouseLeave={() => setHoveredImage(null)}
                type="button"
                aria-label={`Screenshot ${index + 1}`}
              >
                <div className="relative rounded-xl overflow-hidden border border-gray-200 shadow-sm bg-white">
                  <img 
                    src={`/library/${image}`} 
                    alt={`Screenshot ${index + 1}`}
                    className="w-full h-auto object-cover"
                    loading="lazy"
                  />
                  
                  {/* Use as template button */}
                  {hoveredImage === image && onUseAsTemplate && (
                    <div className="absolute bottom-2 right-2 z-10">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent opening the fullscreen view
                          onUseAsTemplate(`/library/${image}`);
                        }}
                        className="flex items-center gap-1 bg-white/90 hover:bg-white text-gray-800 px-3 py-1.5 rounded-full text-xs font-medium shadow-md transition-all"
                        type="button"
                      >
                        <Wand2 className="w-3 h-3" />
                        Use as template
                      </button>
                    </div>
                  )}
                </div>
              </button>
            ))}
          </Masonry>
          
          {/* No images state */}
          {!isLoading && images.length === 0 && (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <p className="text-lg mb-2">No images in library</p>
              <p className="text-sm">Create some images to see them here</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Fullscreen image modal */}
      {fullscreenImage && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="relative max-w-4xl w-full max-h-[90vh]">
            <button
              type="button"
              onClick={() => setFullscreenImage(null)}
              className="absolute -top-12 right-0 p-2 text-white hover:text-gray-300 transition-colors"
              aria-label="Close fullscreen view"
            >
              <X className="w-6 h-6" />
            </button>
            <img 
              src={fullscreenImage} 
              alt="Fullscreen view"
              className="w-full h-auto object-contain max-h-[90vh] rounded-lg"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default LibraryPage; 