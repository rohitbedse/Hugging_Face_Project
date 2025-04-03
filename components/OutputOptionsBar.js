import { Brush, Download, History, RefreshCw } from 'lucide-react';
import { useState } from 'react';

// Mini component for consistent button styling
const ActionButton = ({ icon: Icon, label, onClick, disabled, ariaLabel, onMouseEnter, onMouseLeave }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="focus:outline-none group relative flex-shrink-0"
      aria-label={ariaLabel}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className={`w-16 md:w-14 border overflow-hidden rounded-lg ${
        disabled
          ? 'bg-gray-50 border-gray-200 opacity-50 cursor-not-allowed'
          : 'bg-gray-50 border-gray-200 group-hover:bg-white group-hover:border-gray-300 transition-colors'
      }`}>
        {/* Icon container */}
        <div className="w-full relative flex items-center justify-center py-3 md:py-2"> 
          <Icon className={`w-5 h-5 ${
            disabled
              ? 'text-gray-400'
              : 'text-gray-400 group-hover:text-gray-700 transition-colors'
          }`} />
        </div>
      </div>
    </button>
  );
};

const OutputOptionsBar = ({ 
  isLoading, 
  hasGeneratedContent,
  onSendToDoodle,
}) => {
  const [showDoodleTooltip, setShowDoodleTooltip] = useState(false);

  return (
    <div className="flex items-center gap-2">
        
        {/* "Send to Doodle" button with tooltip */}
        <div className="relative">
          <ActionButton
            icon={Brush}
            label="Doodle"
            onClick={onSendToDoodle}
            disabled={isLoading || !hasGeneratedContent}
            ariaLabel="Send image back to doodle canvas"
            onMouseEnter={() => setShowDoodleTooltip(true)}
            onMouseLeave={() => setShowDoodleTooltip(false)}
          />
          {/* Custom Tooltip - Right aligned */}
          {showDoodleTooltip && (
            <div className="absolute bottom-full right-0 mb-2 px-3 py-1.5 bg-white border border-gray-200 text-gray-700 text-xs rounded-lg shadow-soft whitespace-nowrap pointer-events-none z-10">
              Send to Doodle Canvas
            </div>
          )}
        </div>
        
    </div>
  );
};

export default OutputOptionsBar;