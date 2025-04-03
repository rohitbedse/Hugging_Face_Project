import { Square, RectangleVertical, RectangleHorizontal, ChevronDown } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

const dimensions = [
  {
    id: 'landscape',
    label: '3:2',
    width: 1500,
    height: 1000,
    icon: RectangleHorizontal
  },
  {
    id: 'square',
    label: '1:1',
    width: 1000,
    height: 1000,
    icon: Square
  },
  {
    id: 'portrait',
    label: '4:5',
    width: 1000,
    height: 1250,
    icon: RectangleVertical
  }
 
];

const DimensionSelector = ({ currentDimension = dimensions[0], onDimensionChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  
  // Handle both click and hover for better mobile and desktop experience
  const handleToggle = () => setIsOpen(!isOpen);
  
  // We don't want to close on mouse leave immediately
  const timeoutRef = useRef(null);
  
  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsOpen(true);
  };
  
  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 100);
  };
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  // Find current dimension
  const current = dimensions.find(d => d.id === currentDimension.id) || dimensions[0];
  const Icon = current.icon;

  return (
    <div 
      className="relative z-50" 
      ref={dropdownRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Current selection */}
      <button
        type="button"
        className="w-full flex flex-row md:flex-col items-center justify-center md:p-2 md:py-4 px-2 py-2 rounded-lg transition-colors hover:bg-gray-50"
        onClick={handleToggle}
        style={{ opacity: isOpen ? 1 : 0.7 }}
      >
        <Icon className="w-5 h-5 text-gray-900 mr-2 md:mr-0 md:mb-1" />
        <span className="text-sm text-gray-900">{current.label}</span>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Invisible bridge element that extends to the dropdown */}
          <div className="hidden md:block absolute left-[calc(100%-4px)] top-0 h-full w-8" 
               onMouseEnter={handleMouseEnter}
               style={{ pointerEvents: 'auto' }} />
          
          <div className="absolute left-0 md:left-[calc(100%+4px)] top-0 bg-white rounded-xl shadow-soft 
                      border border-gray-200 z-10 min-w-[80px]"
               onMouseEnter={handleMouseEnter}
               onMouseLeave={handleMouseLeave}>
            <div className="py-1">
              {dimensions.map((dim) => {
                const Icon = dim.icon;
                return (
                  <button
                    type="button"
                    key={dim.id}
                    onClick={() => {
                      onDimensionChange(dim);
                      setIsOpen(false);
                    }}
                    className={`w-full p-2 flex items-center gap-2 hover:bg-gray-50 transition-colors whitespace-nowrap ${
                      currentDimension.id === dim.id ? 'bg-gray-100 text-gray-900' : 'text-gray-600'
                    } ${dim.id === dimensions[0].id ? 'rounded-t-lg' : ''} ${dim.id === dimensions[dimensions.length-1].id ? 'rounded-b-lg' : ''}`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm">{dim.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default DimensionSelector;