import { Plus } from 'lucide-react';

// Define the type for material object
interface Material {
  name: string;
  file: string;
  prompt: string;
}

interface MaterialLibraryProps {
  onSelectMaterial: (material: Material) => void;
}

// Only keep the Topographic material from the actual materials bar
const libraryMaterials: Record<string, Material> = {
  topographic: {
    name: "Topographic",
    file: "topographic.jpeg",
    prompt: "Transform this sketch into a sculptural form composed of precisely stacked, thin metallic rings or layers. Render it with warm copper/bronze tones with each layer maintaining equal spacing from adjacent layers, creating a topographic map effect. The form should appear to flow and undulate while maintaining the precise parallel structure. Use dramatic studio lighting against a pure black background to highlight the metallic luster and dimensional quality. Render it in a high-end 3D visualization style with perfect definition between each ring layer."
  }
};

const MaterialLibrary: React.FC<MaterialLibraryProps> = ({ onSelectMaterial }) => {
  return (
    <div className="bg-white p-6 rounded-xl shadow-medium w-full">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-medium text-gray-800" style={{ fontFamily: "'Google Sans Text', sans-serif" }}>Material Library</h2>
        <button
          className="text-blue-500 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-full text-sm font-medium"
        >
          +Add your own Material
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {Object.entries(libraryMaterials).map(([key, material]) => (
          <div key={key} className="relative group">
            <div className="border border-gray-200 overflow-hidden rounded-lg bg-white">
              <div className="w-full relative" style={{ aspectRatio: '1/1' }}>
                <img 
                  src={`/samples/${material.file}`}
                  alt={`${material.name} material`}
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => onSelectMaterial(material)}
                  className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 flex items-center justify-center transition-all duration-200"
                >
                  <div className="opacity-0 group-hover:opacity-100 bg-white rounded-full p-1 transform translate-y-2 group-hover:translate-y-0 transition-all duration-200">
                    <Plus className="w-5 h-5 text-blue-500" />
                  </div>
                </button>
              </div>
              <div className="px-2 py-1 text-center text-sm font-medium border-t border-gray-200">
                {material.name}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MaterialLibrary; 