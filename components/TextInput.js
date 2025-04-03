import { useEffect, useRef } from 'react';

const TextInput = ({ 
  isTyping, 
  textInputRef, 
  textInput, 
  setTextInput, 
  handleTextInput, 
  textPosition 
}) => {
  if (!isTyping) {
    return null;
  }
  
  return (
    <div
      className="absolute z-50 bg-white border border-gray-300 rounded-lg shadow-medium p-2"
      style={{
        top: textPosition.y,
        left: textPosition.x,
        transform: 'translateY(-100%)'
      }}
    >
      <input
        ref={textInputRef}
        type="text"
        value={textInput}
        onChange={(e) => setTextInput(e.target.value)}
        onKeyDown={handleTextInput}
        placeholder="Type text..."
        className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-400"
        aria-label="Text input for canvas"
      />
    </div>
  );
};

export default TextInput; 