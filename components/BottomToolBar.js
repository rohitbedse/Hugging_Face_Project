import { Plus, HelpCircle } from 'lucide-react';

const BottomToolBar = () => {
  const tools = [
    { id: 'add', icon: Plus, label: 'Add' },
    { id: 'help', icon: HelpCircle, label: 'Help' }
  ];

  return (
    <div className="flex flex-col gap-2 rounded-xl p-2 opacity-0">
      {tools.map((tool) => (
        <div key={tool.id} className="relative">
          <button
            className="p-2 rounded-lg"
            title={tool.label}
          >
            <tool.icon className="w-5 h-5" />
          </button>
        </div>
      ))}
    </div>
  );
};

export default BottomToolBar; 