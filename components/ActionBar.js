import { Download, RefreshCw, History } from 'lucide-react';

const ActionBar = ({ handleSaveImage, handleRegenerate, onOpenHistory, hasGeneratedContent = false }) => {
  return (
    <div className="fixed bottom-4 right-4 flex gap-2">
      <button
        type="button"
        onClick={handleRegenerate}
        disabled={!hasGeneratedContent}
        className={`group flex flex-col w-20 border border-gray-200 overflow-hidden rounded-xl transition-colors bg-gray-50 ${
          hasGeneratedContent
            ? 'hover:border-gray-300 hover:bg-white'
            : 'opacity-50 cursor-not-allowed'
        }`}
        aria-label="Regenerate"
      >
        <div className="w-full relative flex items-center justify-center" style={{ aspectRatio: '1/1' }}>
          <RefreshCw className={`w-6 h-6 text-gray-400 ${hasGeneratedContent ? 'group-hover:text-gray-600' : ''}`} />
        </div>
        <div className={`px-1 py-1 text-center text-xs font-medium text-gray-400 w-full ${hasGeneratedContent ? 'group-hover:text-gray-600' : ''}`}>
          <div className="truncate">Regenerate</div>
        </div>
      </button>

      <button
        type="button"
        onClick={onOpenHistory}
        className="group flex flex-col w-20 border border-gray-200 overflow-hidden rounded-xl transition-colors bg-gray-50 hover:border-gray-300 hover:bg-white"
        aria-label="View History"
      >
        <div className="w-full relative flex items-center justify-center" style={{ aspectRatio: '1/1' }}>
          <History className="w-6 h-6 text-gray-400 group-hover:text-gray-600" />
        </div>
        <div className="px-1 py-1 text-center text-xs font-medium text-gray-400 w-full group-hover:text-gray-600">
          <div className="truncate">History</div>
        </div>
      </button>

      <button
        type="button"
        onClick={handleSaveImage}
        disabled={!hasGeneratedContent}
        className={`group flex flex-col w-20 border border-gray-200 overflow-hidden rounded-xl transition-colors bg-gray-50 ${
          hasGeneratedContent
            ? 'hover:border-gray-300 hover:bg-white'
            : 'opacity-50 cursor-not-allowed'
        }`}
        aria-label="Save Image"
      >
        <div className="w-full relative flex items-center justify-center" style={{ aspectRatio: '1/1' }}>
          <Download className={`w-6 h-6 text-gray-400 ${hasGeneratedContent ? 'group-hover:text-gray-600' : ''}`} />
        </div>
        <div className={`px-1 py-1 text-center text-xs font-medium text-gray-400 w-full ${hasGeneratedContent ? 'group-hover:text-gray-600' : ''}`}>
          <div className="truncate">Save</div>
        </div>
      </button>
    </div>
  );
};

export default ActionBar; 