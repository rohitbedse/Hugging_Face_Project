import { Download, History as HistoryIcon, Library as LibraryIcon } from "lucide-react";

const HeaderButtons = ({ 
  hasHistory, 
  openHistoryModal, 
  toggleLibrary, 
  handleSaveImage, 
  isLoading, 
  hasGeneratedContent 
}) => {
  return (
    <>
      <button
        type="button"
        onClick={openHistoryModal}
        disabled={!hasHistory}
        className={`group flex items-center justify-center gap-2 md:gap-2.5 px-2 md:px-5 h-14 rounded-full border text-sm shadow-soft transition-all focus:outline-none w-full md:w-auto ${
          !hasHistory
            ? 'bg-gray-50 border-gray-200 text-gray-300 cursor-not-allowed opacity-70'
            : 'bg-gray-50 border-gray-200 text-gray-400 hover:bg-white hover:border-gray-300'
        }`}
      >
        <HistoryIcon className={`w-5 h-5 ${!hasHistory ? 'text-gray-300' : 'text-gray-400 group-hover:text-gray-600'}`} />
        <span className={`font-medium md:inline ${!hasHistory ? 'text-gray-300' : 'text-gray-400 group-hover:text-gray-600'}`}>History</span>
      </button>
      <button
        type="button"
        onClick={toggleLibrary}
        className="group flex items-center justify-center gap-2 md:gap-2.5 px-2 md:px-5 h-14 bg-gray-50 hover:bg-white rounded-full border border-gray-200 text-gray-400 hover:border-gray-300 transition-all focus:outline-none focus:ring-2 focus:ring-gray-200 text-sm shadow-soft w-full md:w-auto"
      >
        <LibraryIcon className="w-5 h-5 group-hover:text-gray-600" />
        <span className="group-hover:text-gray-600 font-medium">Gallery</span>
      </button>
      <button
        type="button"
        onClick={handleSaveImage}
        disabled={isLoading || !hasGeneratedContent}
        className="group flex items-center justify-center gap-2 md:gap-2.5 px-2 md:px-5 h-14 rounded-full border text-sm shadow-soft transition-all focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed bg-gray-50 border-gray-200 text-gray-400 hover:bg-white hover:border-gray-300 w-full md:w-auto"
      >
        <Download className={`w-5 h-5 ${isLoading || !hasGeneratedContent ? 'text-gray-400' : 'group-hover:text-gray-600'}`} />
        <span className={isLoading || !hasGeneratedContent ? 'text-gray-400' : 'group-hover:text-gray-600 font-medium'}>Save</span>
      </button>
    </>
  );
};

export default HeaderButtons; 