import { X, Calendar } from 'lucide-react';
import { useRef, useEffect } from 'react';

const HistoryModal = ({ 
  isOpen, 
  onClose, 
  history,
  onSelectImage,
  currentDimension
}) => {
  if (!isOpen) return null;
  
  const modalContentRef = useRef(null);
  
  // Handle click outside to close
  useEffect(() => {
    function handleClickOutside(event) {
      if (modalContentRef.current && !modalContentRef.current.contains(event.target)) {
        onClose();
      }
    }
    
    // Add event listener when modal is open
    document.addEventListener('mousedown', handleClickOutside);
    
    // Clean up the event listener
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  // Format date nicely
  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Check if it's today
    if (date.toDateString() === today.toDateString()) {
      return `Today, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    // Check if it's yesterday
    if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    // Otherwise show full date
    return date.toLocaleDateString([], { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 overflow-y-auto p-4">
      <div 
        ref={modalContentRef}
        className="bg-white p-4 rounded-xl shadow-medium max-w-5xl w-full mx-auto my-4 max-h-[85vh] flex flex-col border border-gray-200"
      >
        <div className="flex items-center justify-between mb-4 px-1">
          <h2 className="text-xl font-medium text-gray-800" style={{ fontFamily: "'Google Sans', sans-serif" }}>Drawing History</h2>
          <button 
            type="button"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-50 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {!history || history.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-gray-500 py-12">
            No history available yet. Start drawing to create some!
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 px-1 pb-6">
            {history.map((item, index) => (
              <div key={item.timestamp} className="flex flex-col justify-center h-full">
                <button 
                  className="w-full h-auto relative group cursor-pointer rounded-lg overflow-hidden border border-gray-200 hover:border-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300"
                  onClick={() => onSelectImage(item)}
                  type="button"
                  aria-label={`Select drawing from ${new Date(item.timestamp).toLocaleString()}`}
                >
                  <div className="w-full" style={{ aspectRatio: `${item.dimensions?.width || 1} / ${item.dimensions?.height || 1}` }}>
                    <div className="relative bg-black w-full h-full">
                      <img 
                        src={item.imageUrl} 
                        alt={`Drawing history ${index + 1}`}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-black/30 backdrop-blur-[2px] text-xs py-2 px-3 opacity-0 group-hover:opacity-100 transition-opacity border-t border-gray-800/10 flex items-center gap-1.5">
                      <Calendar className="w-3 h-3 text-gray-300" />
                      <span className="text-white/90">{formatDate(item.timestamp)}</span>
                    </div>
                  </div>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryModal; 