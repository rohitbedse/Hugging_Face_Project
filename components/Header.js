const Header = () => {
  return (
    <header className="w-full pt-2">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 pb-0">
        <div className="flex flex-col gap-0">
          <h1 className="text-lg tracking-[-0.1px] text-gray-800" 
          style={{ fontFamily: "'Google Sans', sans-serif" }}>GEMINI 3D DRAWING</h1>
          <p className="text-sm text-gray-400">
            <span>By</span>{" "}
            <a href="https://x.com/dev_valladares" target="_blank" rel="noreferrer" className="hover:text-gray-600 underline transition-colors">rohitbedse_</a> 
            {" "}&{" "}

            
          </p>
          <span className="inline-flex items-center rounded-full mt-1.5 border border-gray-200 px-1.5 py-1 text-xs font-mono text-gray-400">
          ⟡ Gemini 2.0 Native Image Generation ⟡
          </span>
        </div>
      </div>
    </header>
  );
};

export default Header; 
