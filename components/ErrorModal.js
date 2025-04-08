import { X, Bug } from 'lucide-react';
import { useState, useEffect } from 'react';

const ErrorModal = ({ 
  showErrorModal, 
  closeErrorModal, 
  customApiKey, 
  setCustomApiKey, 
  handleApiKeySubmit,
  // Add debug toggle prop with default value
  debugMode = false,
  setDebugMode = () => {}
}) => {
  const [localApiKey, setLocalApiKey] = useState(customApiKey);
  
  // Update local API key when prop changes
  useEffect(() => {
    setLocalApiKey(customApiKey);
  }, [customApiKey]);
  
  const handleSubmit = (e) => {
    e.preventDefault();
    handleApiKeySubmit(localApiKey);
  };

  return (
    <>
      {showErrorModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 overflow-y-auto modalBackdrop"
          onClick={(e) => {
            if (e.target.classList.contains('modalBackdrop')) {
              closeErrorModal();
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              closeErrorModal();
            }
          }}
        >
          <dialog 
            open
            className="bg-white p-6 rounded-xl shadow-medium max-w-md w-full mx-4 my-8 relative"
            aria-labelledby="error-modal-title"
          >
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h2 id="error-modal-title" className="text-xl font-medium text-gray-800">This space is super popular</h2>
                <div className="flex items-center gap-2">
                  {/* Debug toggle button - only visible in development */}
                  {process.env.NODE_ENV === 'development' && (
                    <div className="relative group">
                      <button
                        type="button"
                        onClick={() => setDebugMode(!debugMode)}
                        className={`flex items-center justify-center p-1.5 rounded transition-colors ${
                          debugMode 
                            ? 'bg-blue-500 text-white hover:bg-blue-600' 
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                        aria-label={debugMode ? "Debug mode on" : "Debug mode off"}
                      >
                        <Bug className="w-4 h-4" />
                        <span className="ml-1 text-xs font-medium">{debugMode ? "ON" : "OFF"}</span>
                      </button>
                      
                      {/* Tooltip */}
                      <div className="absolute left-1/2 bottom-full mb-2 -translate-x-1/2 hidden group-hover:block w-48 p-2 bg-gray-800 text-xs text-white rounded shadow-lg z-10">
                        <p className="text-center">
                          Debug Mode: {debugMode ? "ON" : "OFF"}
                        </p>
                        <p className="mt-1">
                          When enabled, this modal will automatically appear on page load for development purposes.
                        </p>
                        <div className="w-2 h-2 bg-gray-800 absolute left-1/2 -bottom-1 -ml-1 rotate-45" />
                      </div>
                    </div>
                  )}
                  <button 
                    type="button"
                    onClick={closeErrorModal}
                    className="text-gray-500 hover:text-gray-700"
                    aria-label="Close"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              <div className="text-gray-600">
                <p className="mb-2">
                  Our free API key is currently at capacity. To continue:
                </p>
                <ol className="list-decimal pl-5 space-y-2 mb-0">
                  <li>Get your own API key at <a href="https://ai.dev/app/apikey" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline">ai.dev/app/apikey</a></li>
                  <li>Enter it below</li>
                </ol>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label 
                    htmlFor="apiKey" 
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Your Gemini API Key
                  </label>
                  <input
                    id="apiKey"
                    type="text"
                    placeholder="Enter your Gemini API key"
                    value={localApiKey}
                    onChange={(e) => setLocalApiKey(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={closeErrorModal}
                    className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors text-sm font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!localApiKey.trim()}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors text-sm font-medium"
                  >
                    Save API Key
                  </button>
                </div>
              </form>
            </div>
          </dialog>
        </div>
      )}
    </>
  );
};

export default ErrorModal; 