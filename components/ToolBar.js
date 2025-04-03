import { Pencil, Eraser, Type, Undo, Trash2, PenLine, MousePointer } from 'lucide-react';
import { PenTool } from 'lucide-react';
import { Undo2 } from 'lucide-react';
import { useState } from 'react';
import DimensionSelector from './DimensionSelector';

const ToolBar = ({ 
  currentTool, 
  setCurrentTool, 
  handleUndo, 
  clearCanvas, 
  orientation = 'horizontal',
  currentWidth,
  setStrokeWidth,
  currentDimension,
  onDimensionChange
}) => {
  const mainTools = [
    // { id: 'selection', icon: MousePointer, label: 'Selection' },
    { id: 'pencil', icon: Pencil, label: 'Pencil' },
    // { id: 'pen', icon: PenTool, label: 'Pen' },
    { id: 'eraser', icon: Eraser, label: 'Eraser' },
    // { id: 'text', icon: Type, label: 'Text' }
  ];

  const actions = [
    { id: 'undo', icon: Undo2, label: 'Undo', onClick: handleUndo },
    { id: 'clear', icon: Trash2, label: 'Clear', onClick: clearCanvas }
  ];

  const containerClasses = orientation === 'vertical' 
    ? 'flex flex-col gap-2 bg-white rounded-xl shadow-soft p-2 border border-gray-200'
    : 'flex gap-2 bg-white rounded-xl shadow-soft p-2 border border-gray-200';

  return (
    <div className={orientation === 'vertical' ? 'flex flex-col gap-2' : 'flex flex-col gap-3 mt-1'}>
      {/* Main toolbar container - includes dimension selector in horizontal mode */}
      <div className={orientation === 'horizontal' ? 'flex items-center justify-between' : ''}>
        {/* Main toolbar */}
        <div className={containerClasses}>
          {mainTools.map((tool) => (
            <div key={tool.id} className="relative">
              <button
                onClick={() => setCurrentTool(tool.id)}
                className={`p-2.5 rounded-lg transition-colors flex items-center justify-center ${
                  currentTool === tool.id
                    ? 'bg-gray-100 text-gray-900'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
                title={tool.label}
              >
                <tool.icon className="w-5 h-5" />
              </button>
            </div>
          ))}
          
          {orientation === 'vertical' && <div className="h-px bg-gray-200 my-2" />}
          {orientation === 'horizontal' && <div className="w-px bg-gray-200 mx-0" />}
          
          {actions.map((action) => (
            <button
              key={action.id}
              onClick={action.onClick}
              className="p-2 rounded-lg text-gray-600 hover:bg-gray-50 text-center flex items-center justify-center transition-colors"
              title={action.label}
            >
              <action.icon className="w-5 h-5" />
            </button>
          ))}
        </div>

        {/* Dimension selector - show inline in horizontal layout */}
        {orientation === 'horizontal' && currentDimension && onDimensionChange && (
          <div className="ml-2 bg-white rounded-xl shadow-soft p-2 border border-gray-200">
            <DimensionSelector 
              currentDimension={currentDimension}
              onDimensionChange={onDimensionChange}
            />
          </div>
        )}
      </div>

      {/* Separate DimensionSelector - only in vertical orientation */}
      {orientation === 'vertical' && currentDimension && onDimensionChange && (
        <div className="bg-white rounded-xl shadow-soft border border-gray-200">
          <DimensionSelector 
            currentDimension={currentDimension}
            onDimensionChange={onDimensionChange}
          />
        </div>
      )}
    </div>
  );
};

export default ToolBar; 