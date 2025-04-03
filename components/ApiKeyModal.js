import { useState } from 'react';

const ApiKeyModal = ({ isOpen, onClose, onSubmit, initialValue = '' }) => {
  const [apiKey, setApiKey] = useState(initialValue);
  
  if (!isOpen) return null;
  
  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 modalBackdrop"
      onClick={(e) => {
        if (e.target.classList.contains('modalBackdrop')) {
          onClose();
        }
      }}
    >
      <div className="bg-white p-6 rounded-xl shadow-medium max-w-md w-full">
        <h2 className="text-xl font-medium text-gray-800 mb-4">API Key Required</h2>
        
        <p className="text-sm text-gray-600 mb-6">
          You've reached the limit of free Gemini API calls. To continue using this feature, please enter your own Gemini API key below.
          You can get a free API key from <a href="https://ai.google.dev/" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Google AI Studio</a>.
        </p>
        
        <form onSubmit={(e) => {
          e.preventDefault();
          onSubmit(apiKey);
        }}>
          <div className="mb-4">
            <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700 mb-1">
              Gemini API Key
            </label>
            <input
              id="apiKey"
              type="text"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="AIza..."
              required
            />
          </div>
          
          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 border border-gray-200 rounded-lg text-gray-600 hover:border-gray-300 hover:bg-gray-50 text-sm font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!apiKey.trim()}
              className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 text-sm font-medium"
            >
              Save API Key
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ApiKeyModal; 