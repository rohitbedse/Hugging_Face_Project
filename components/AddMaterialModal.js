import { useRef, useState, useMemo } from 'react';
import { Upload, Edit, RefreshCw, RefreshCcw, Sparkles, ImageIcon, Plus, Check } from 'lucide-react';
import { addMaterialToLibrary } from './StyleSelector';

const AddMaterialModal = ({ 
  showModal, 
  onClose, 
  onAddMaterial, 
  newMaterialName, 
  setNewMaterialName,
  generatedMaterialName,
  setGeneratedMaterialName,
  generatedPrompt,
  setGeneratedPrompt,
  customPrompt,
  setCustomPrompt,
  previewThumbnail,
  customImagePreview,
  useCustomImage,
  isGeneratingPreview,
  isGeneratingText,
  showMaterialNameEdit,
  setShowMaterialNameEdit,
  showCustomPrompt,
  setShowCustomPrompt,
  handleRefreshThumbnail,
  handleReferenceImageUpload,
  handleNewMaterialDescription,
  onStyleSelected,
  materials
}) => {
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [inputValue, setInputValue] = useState(newMaterialName);
  const [hoveredMaterial, setHoveredMaterial] = useState(null);

  // Sample materials for the library
  const sampleMaterials = [
    {
      name: 'Aquatic Eggs',
      image: '/samples/aquaticeggs.png',
      prompt: "Transform this sketch into a chrome material. Render it in a high-end 3D visualization style with professional studio lighting against a pure black background. Make it look like an elegant Cinema 4D and Octane rendering with detailed material properties and characteristics. The final result should be an elegant visualization with perfect studio lighting, crisp shadows, and high-end material definition. Specifically, the chrome material should exhibit a highly reflective surface with a subtle specular highlight, creating a mirror-like appearance. The material's surface should possess a subtle sheen, achieved through a thin-film interference effect in the Octane Glossy material, adding a rainbow iridescence that shifts with the viewing angle."
    },
    {
      name: 'Topographic',
      image: '/samples/topographic.jpeg',
      prompt: "Transform this sketch into a sculptural form composed of precisely stacked, thin metallic rings or layers. Render it with warm copper/bronze tones with each layer maintaining equal spacing from adjacent layers, creating a topographic map effect. The form should appear to flow and undulate while maintaining the precise parallel structure. Use dramatic studio lighting against a pure black background to highlight the metallic luster and dimensional quality. Render it in a high-end 3D visualization style with perfect definition between each ring layer."
    },
    {
      name: 'Glow Jelly',
      image: '/samples/glowjelly.png',
      prompt: "Transform this sketch into a boobly material. Render it in a high-end 3D visualization style with professional studio lighting against a pure black background. Make it look like an elegant Cinema 4D and Octane rendering with detailed material properties and characteristics. The final result should be an elegant visualization with perfect studio lighting, crisp shadows, and high-end material definition. Specifically, the boobly material should exhibit noticeable internal light scattering and a high degree of dynamic deformation on impact. To achieve the boobly effect, use a combination of Octane's Subsurface Scattering (SSS) and a Dynamic Mesh simulation in Cinema 4D, feeding the displacement output into the Octane material via an Octane Displacement node. The SSS should be tuned for a soft, fleshy translucency with a slight color shift towards red in thinner areas. Implement a high-frequency, low-amplitude noise pattern within the SSS radius to simulate subcutaneous textures. The material's surface should possess a subtle sheen, achieved through a thin-film interference effect in the Octane Glossy material, adding a rainbow iridescence that shifts with the viewing angle. The Dynamic Mesh should simulate realistic jiggle physics; consider using Cinema 4D's Soft Body Dynamics with carefully tuned spring and dampening values. Optimize the Octane scene for render efficiency, focusing on minimizing noise in the SSS and glossy reflections with adequate sample counts and kernel settings. The boobly material possesses a unique combination of squishiness and internal illumination, resulting in a captivating visual texture reminiscent of soft, organic forms. Rendering requires careful balancing of SSS settings and dynamic mesh calculations to achieve a realistic and visually appealing final result."
    },
    {
      name: 'Chinese Porcelain',
      image: '/samples/porcelain.png',
      prompt: "Transform this sketch into a ceramic vase featuring traditional blue and white Chinese porcelain designs, including dragons and cloud motifs. Pay close attention to the subtle variations in the blue pigment, creating a hand-painted effect with soft edges and intricate details. The vase should have a slightly glossy surface with gentle reflections. Render in Cinema 4D with Octane, using professional studio lighting to showcase the form and texture against a pure black background. Simulate subtle imperfections and surface irregularities typical of hand-crafted porcelain."
    },
    {
      name: 'Dragonscale',
      image: '/samples/dragonscale.png',
      prompt: "Transform this sketch into a form that appears to be constructed from incredibly detailed and overlapping dragonscales. The scales should exhibit a subtle iridescence, catching and reflecting light in a way that mimics natural mineral refraction. Each scale should have a slightly raised texture and a subtle specular highlight. Render the piece in Cinema 4D and Octane, paying close attention to the intricacies of the scale pattern and the way light interacts with the textured surface against a pure black background. The final result should be a highly detailed, elegant visualization that showcases the complex material properties of dragonscales under professional studio lighting with crisp, well-defined shadows."
    },
    {
      name: 'Ernst Haeckel',
      image: '/samples/ernsthaeckel.png',
      prompt: "Transform this sketch into a collection of various deep-sea organisms with intricate patterns and textures, reminiscent of Ernst Haeckel's illustrations. Each organism should exhibit unique color palettes, ranging from vibrant yellows and oranges to deep blues and greens. The surfaces should convey a sense of organic texture, with subtle variations in glossiness and detailed surface imperfections. Render in Cinema 4D with Octane, using professional studio lighting to capture the delicate details and vibrant colors against a pure black background, enhancing the contrast and highlighting the bioluminescent qualities of the forms."
    },
    {
      name: 'Emoji',
      image: '/samples/emojiface.png',
      prompt: "Recreate this sketch as a smooth, stylized human face emoji. The skin should have a subtle subsurface scattering effect to give it a soft, slightly translucent quality. The hair should be a matte with very subtle highlights to give it form. Render in Cinema 4D with Octane, using soft, diffused studio lighting to emphasize the smooth surfaces and subtle color variations. Maintain a pure black background."
    },
    {
      name: 'Fruit',
      image: '/samples/fruit.png',
      prompt: "Transform this sketch into a photorealistic 3D rendering of various fruits, including a lemon, orange, grapes, and walnuts. Pay close attention to the textures; the lemon and orange should have a bumpy, porous surface with subtle variations in color. The grapes should exhibit a smooth, slightly translucent skin. The walnuts should have a detailed, rough texture with realistic cracks and crevices. Use professional studio lighting against a pure black background to create strong contrasts and highlight the details of each fruit. Render in Cinema 4D with Octane, focusing on accurate subsurface scattering for the grapes and realistic light interaction with the textured surfaces of the lemon, orange, and walnuts."
    },
    {
      name: 'Gold',
      image: '/samples/gold.png',
      prompt: "Transform this sketch into a sculptural form composed of precisely stacked, thin metallic rings or layers. Render it with warm copper/bronze tones with each layer maintaining equal spacing from adjacent layers, creating a topographic map effect. The form should appear to flow and undulate while maintaining the precise parallel structure. Use dramatic studio lighting against a pure black background to highlight the metallic luster and dimensional quality. Render it in a high-end 3D visualization style with perfect definition between each ring layer."
    },
    {
      name: 'Stained Glass',
      image: '/samples/stainedglass.png',
      prompt: "Transform this sketch into a detailed 3D model of a stained glass. Each segment of glass should have a unique, vibrant color and subtle internal texture, simulating the natural imperfections of stained glass. The metal frame should have a brushed finish with slight imperfections and subtle reflections. Render in Cinema 4D with Octane, using professional studio lighting to enhance the transparency and color variations of the glass, and the metallic sheen of the frame, against a pure black background."
    },
    {
      name: 'Holographic Foil',
      image: '/samples/holographicfoil.png',
      prompt: "Transform this sketch into a physical form rendered entirely in holographic foil material. Capture the iridescent, shifting colors and light diffraction effects characteristic of holographic foil, as light plays across its surface. Render the material's unique texture and reflective properties in a high-end 3D visualization using Cinema 4D and Octane. The professional studio lighting should enhance the holographic effect, creating crisp reflections and vibrant color gradients against the pure black background. The final result should be an elegant visualization with perfect studio lighting, highlighting the detailed material properties and characteristics of holographic foil."
    },
    {
      name: 'Liquid Mercury',
      image: '/samples/liquidmercury.png',
      prompt: "Transform this sketch into a form that appears to be composed entirely of liquid mercury. Render it in a high-end 3D visualization style with professional studio lighting that reflects and refracts through the metallic liquid surface against a pure black background. The Cinema 4D and Octane rendering should showcase the unique specular highlights, smooth, flowing forms, and highly reflective nature of mercury. Pay close attention to the way light interacts with the curved surfaces, creating realistic caustics and distortions. The final result should be an elegant visualization with perfect studio lighting, crisp reflections, and detailed material definition, capturing the essence of liquid mercury."
    },
    {
      name: 'Mushrooms',
      image: '/samples/mushrooms.png',
      prompt: "Transform this sketch into a material that embodies the essence of mushrooms. Render it in a high-end 3D visualization style with professional studio lighting against a pure black background. Make it look like an elegant Cinema 4D and Octane rendering, emphasizing the organic textures, subtle translucency, and earthy tones of various mushroom species. Focus on the interplay of light and shadow across the cap's surface, capturing the unique patterns and textures, from smooth and glossy to dry and porous. The final result should be an elegant visualization with perfect studio lighting, crisp shadows, and high-end material definition, showcasing the delicate beauty and natural complexity of mushrooms."
    },
     {
      name: 'Octopus',
      image: '/samples/octopus.png',
      prompt: "Transform this sketch into a physical octopus tentacle material. Render it in a high-end 3D visualization style with professional studio lighting against a pure black background. Make it look like an elegant Cinema 4D and Octane rendering with detailed material properties and characteristics, focusing on the tentacle's unique texture, including suckers, and subtle translucency. Highlight the interplay of light and shadow on the wet, slightly slimy surface, capturing the organic feel. The final result should be an elegant visualization with perfect studio lighting, crisp shadows, and high-end material definition emphasizing the octopus tentacle's natural details."
    },
    {
      name: 'Plant',
      image: '/samples/plant.png',
      prompt: "Transform this sketch into a plant with soft green leaves, featuring a subtle, fine dusting on the surface, resembling a delicate bloom. The leaves should have a slightly translucent quality, allowing light to subtly scatter through them. Render in Cinema 4D with Octane, using professional studio lighting to create dramatic shadows and highlights against a pure black background, emphasizing the texture and form of the plant. Use subsurface scattering to simulate the light passing through the leaves."
    },
    {
      name: 'Purple Fur',
      image: '/samples/purplefur.png',
      prompt: "Transform this sketch into a 3D model with a stylized fur material, featuring long, soft, vibrant purple strands with subtle dark grey roots. Pay close attention to the direction and clumping of the fur to mimic the animal form's texture. Render it in Cinema 4D with Octane, using professional studio lighting against a pure black background to accentuate the texture and color depth of the fur, creating soft shadows and highlights."
    },
    {
      name: 'Pink Velvet',
      image: '/samples/pinkvelvet.png',
      prompt: "Transform this sketch into a 3D rendering of soft, velvety, textured forms arranged in a composition. The forms should have a plush, almost granular surface texture, reminiscent of velvet flocking. Utilize subtle variations in pink and red hues across the forms. Render in Cinema 4D with Octane, using soft, diffused studio lighting to accentuate the depth and texture of the flocked material, set against a pure black background to create dramatic contrast and isolate the arrangement."
    },
    {
      name: 'Voxels',
      image: '/samples/voxels.png',
      prompt: "Transform this sketch into a physical manifestation of 8-bit voxel art. The rendering should capture the distinct, blocky nature of the medium, with each 'voxel' clearly defined and possessing a matte, slightly rough surface texture. Render the object as if constructed from these individual, quantized blocks, highlighting the stepped edges and discrete color transitions inherent to the 8-bit aesthetic. The professional studio lighting should emphasize the geometric forms and reveal subtle variations in tone across the voxel surfaces. Use Cinema 4D and Octane to create a high-resolution visualization that showcases the material's unique properties against a pure black background, ensuring crisp shadows and a clear definition of each individual voxel. The final result should be an elegant visualization that celebrates the charm and simplicity of 8-bit graphics in a physical form."
    },
    {
      name: 'Water',
      image: '/samples/water.png',
      prompt: "Transform this sketch into a dynamic water sculpture. Render it in a high-end 3D visualization style with professional studio lighting against a pure black background. Make it look like an elegant Cinema 4D and Octane rendering with detailed material properties and characteristics, capturing the essence of flowing water. The final result should be an elegant visualization with perfect studio lighting, crisp shadows, and high-end material definition, showcasing the water's transparency, refractive index, and subtle surface ripples. Emphasize the interplay of light and shadow as it passes through the water, highlighting its fluid and dynamic nature."
    },
    {
      name: 'Studio Ghibli',
      image: '/samples/ghibli.png',
      prompt: "Render the specific subject/scene/character detailed in the provided drawing/text. Faithfully interpret the core elements, composition, and figures present in the input. THEN, apply the following Studio Ghibli stylistic treatment: Aesthetic: Convert the rendering into the characteristic hand-painted look of Studio Ghibli films. Backgrounds: Use lush, painterly backgrounds that complement the subject (if the input lacks a background, create one in the Ghibli style; if it has one, render that background in the Ghibli style). Linework: Employ soft, expressive linework, avoiding harsh digital lines. Color: Utilize a warm, evocative, and harmonious color palette. Atmosphere: Infuse the scene with a Ghibli sense of wonder, nostalgia, or gentle melancholy, appropriate to the subject matter drawn. Details: Add subtle environmental details like wind, detailed foliage, or atmospheric effects typical of Ghibli, where suitable for the depicted scene. Lighting: Implement soft, natural, and atmospheric lighting (dappled sunlight, golden hour, overcast) integrated into the painted style. Goal: The final image must look like a high-quality Ghibli keyframe or background plate that is a clear and recognizable interpretation of the original provided drawing/text, not a generic Ghibli scene."
    },
    {
      name: 'Skin',
      image: '/samples/skin.png',
      prompt: "Transform this sketch into a realistic skin material. Pay close attention to the subtle variations in skin tone and the way light reflects off the surface. The skin should appear hydrated and healthy with fine pores and natural imperfections. Use subsurface scattering to simulate the way light penetrates the skin. Render it in Cinema 4D with Octane, using professional studio lighting against a pure black background to enhance the specular highlights and create a contrast between the skin and the background."
    },
    {
      name: 'Shrek',
      image: '/samples/shrek.png',
      prompt: "Transform this sketch into a Shrek-like material, capturing the essence of his green, slightly bumpy skin texture. Render it in a high-end 3D visualization style with professional studio lighting against a pure black background. Emphasize the subtle variations in skin tone, the slight translucency that allows for subsurface scattering, and the almost mossy, organic feel. Make it look like an elegant Cinema 4D and Octane rendering with detailed material properties and characteristics, highlighting the way light interacts with the unique surface. The final result should be an elegant visualization with perfect studio lighting, crisp shadows, and high-end material definition, showcasing the Shrek-like skin properties."
    },
    {
      name: 'Temple Patterns',
      image: '/samples/templepatterns.png',
      prompt: "Transform this sketch into a physical form exhibiting the intricate patterns and textures found on Hindu temples. Render it in a high-end 3D visualization style with professional studio lighting against a pure black background. The material should emulate the characteristic stone carvings, detailed reliefs, and geometric designs typical of Hindu temple architecture. Use Cinema 4D and Octane to create an elegant rendering that captures the depth and complexity of the pattern, including subtle variations in texture and tone. Focus on precise replication of the surface details, creating the illusion of aged stone and carved motifs. The final result should be an elegant visualization with perfect studio lighting, crisp shadows that accentuate the pattern, and high-end material definition that showcases the essence of Hindu temple design."
    },
  ];

  // Create a memoized list of already added material names
  const addedMaterialNames = useMemo(() => {
    if (!materials) return [];
    
    // Extract all material names (convert to lowercase for case-insensitive comparison)
    return Object.values(materials)
      .map(material => material.name?.toLowerCase())
      .filter(Boolean); // Filter out undefined/null
  }, [materials]);

  // Check if a material is already in the user's library
  const isMaterialAlreadyAdded = (materialName) => {
    return addedMaterialNames.includes(materialName.toLowerCase());
  };

  // Handle clicking outside of the modal to close it
  const handleClickOutsideModal = (e) => {
    if (e.target.classList.contains('modalBackdrop')) {
      onClose();
    }
  };

  // Handle selecting a material from the library
  const handleAddMaterialFromLibrary = (material) => {
    // Skip if already added
    if (isMaterialAlreadyAdded(material.name)) {
      return;
    }
    
    // Create a material object for the library
    const materialObj = {
      name: material.name,
      prompt: material.prompt,
      image: material.image
    };
    
    // Add material to library and get the key
    const materialKey = addMaterialToLibrary(materialObj);
    
    // Notify parent to select this material if the callback exists
    if (onStyleSelected && typeof onStyleSelected === 'function') {
      onStyleSelected(materialKey);
    }
    
    // Close the modal
    onClose();
  };

  // Handle drag and drop events
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        // Create a synthetic event to pass to handleReferenceImageUpload
        const syntheticEvent = {
          target: {
            files: [file]
          }
        };
        handleReferenceImageUpload(syntheticEvent);
      } else {
        alert('Please drop an image file');
      }
    }
  };

  // Create a debounced version of the material description handler
  const handleSafeMaterialDescription = (description) => {
    // Don't process if already generating
    if (isGeneratingText || isGeneratingPreview) {
      return;
    }
    
    // Update the name and generate material - this should trigger just one workflow
    setNewMaterialName(description);
    handleNewMaterialDescription(description);
  };

  if (!showModal) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-30 h-screen flex items-center justify-center z-50 modalBackdrop overflow-y-auto p-0"
      onClick={handleClickOutsideModal}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white rounded-xl shadow-medium w-full max-w-6xl mx-auto my-auto flex flex-col md:flex-row">
        {/* Material Library Section */}
        <div className="p-4 md:p-6 border-b md:border-b-0 md:border-r border-gray-100 w-full md:w-1/2 max-h-[50vh] md:max-h-none overflow-auto">
          <div className="mb-3 md:mb-4">
            <h2 className="text-lg md:text-xl font-medium text-gray-800" style={{ fontFamily: "'Google Sans Text', sans-serif" }}>Material Library</h2>
          </div>
          
          <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
            {sampleMaterials.map((material, index) => {
              const isAlreadyAdded = isMaterialAlreadyAdded(material.name);
              return (
                <button
                  key={index}
                  onClick={() => handleAddMaterialFromLibrary(material)}
                  type="button" 
                  aria-label={`Add ${material.name} material`}
                  className={`focus:outline-none group ${isAlreadyAdded ? 'opacity-50 cursor-not-allowed' : ''}`}
                  disabled={isAlreadyAdded}
                >
                  <div className={`w-full border overflow-hidden rounded-xl ${isAlreadyAdded ? 'bg-gray-100 border-gray-200' : 'bg-gray-50 border-gray-200 group-hover:bg-white group-hover:border-gray-300'}`}>
                    <div className="w-full relative" style={{ aspectRatio: '1/1' }}>
                      <img 
                        src={material.image}
                        alt={`${material.name} style example`}
                        className={`w-full h-full object-cover ${isAlreadyAdded ? 'opacity-70' : ''}`}
                        onError={(e) => {
                          console.error(`Error loading thumbnail for ${material.name}`);
                          e.target.src = '/samples/chrome.jpeg';
                        }}
                      />
                      <div className="absolute inset-0">
                        {isAlreadyAdded ? (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="flex items-center gap-1 bg-gray-500 px-2.5 py-1.5 text-white rounded-full text-xs font-medium">
                              <Check className="w-3 h-3" />
                              <span>Added</span>
                            </div>
                          </div>
                        ) : (
                          <div className="opacity-0 group-hover:opacity-100 hover:cursor-pointer transition-opacity">
                            <div className="absolute inset-0 bg-gray-500 bg-opacity-60 flex items-center justify-center">
                              <div className="flex items-center gap-1 bg-blue-500 px-2.5 py-1.5 text-white rounded-full text-xs font-medium">
                                <Plus className="w-3 h-3" />
                                <span>Add</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className={`px-1 py-1 text-left text-xs font-medium ${isAlreadyAdded ? 'bg-gray-100 text-gray-400' : 'bg-gray-50 text-gray-500 group-hover:bg-white group-hover:text-gray-600'}`}>
                      <div className="truncate">
                        {material.name}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
        
        {/* Add Material Form Section */}
        <div className="p-4 md:p-6 w-full md:w-1/2">
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <h2 className="text-lg md:text-xl font-medium text-gray-800" style={{ fontFamily: "'Google Sans Text', sans-serif" }}>Add Material</h2>
          </div>

          {/* Input Section */}
          <div className="mb-6 md:mb-8 pb-6 md:pb-8 border-b border-gray-100">
            <div className="space-y-4">
              {/* Text input */}
              <div>
                <label htmlFor="materialDescription" className="block text-sm font-medium text-gray-700 mb-1">
                  Describe your material
                </label>
                <div className="relative flex items-center">
                  <input
                    id="materialDescription"
                    type="text"
                    value={inputValue}
                    onChange={(e) => {
                      setInputValue(e.target.value);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && inputValue.trim()) {
                        e.preventDefault();
                        handleSafeMaterialDescription(inputValue);
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black pr-10"
                    placeholder="Eg. Bubbles, glass etc"
                    disabled={isGeneratingText || isGeneratingPreview}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (inputValue.trim() && !isGeneratingText && !isGeneratingPreview) {
                        handleSafeMaterialDescription(inputValue);
                      }
                    }}
                    className="absolute right-2 p-1.5 bg-blue-500 rounded-md hover:bg-blue-400 transition-colors"
                    title="Generate material preview"
                    disabled={isGeneratingText || isGeneratingPreview}
                  >
                    {isGeneratingText || isGeneratingPreview ? (
                      <RefreshCw className="w-5 h-5 text-white animate-spin" />
                    ) : (
                      <div className="flex text-sm text-white items-center gap-1">
                         <Sparkles className="w-4 h-4 text-white " /> Generate
                      </div>
                    )}
                  </button>
                </div>
              </div>

              {/* Divider with "or" */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Or upload a reference image</span>
                </div>
              </div>

              {/* Image upload */}
              <div>
                <div 
                  className={`border-2 border-dashed rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer transition-colors ${
                    isDragging 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-300 hover:bg-gray-50'
                  } ${isGeneratingText && useCustomImage ? 'opacity-70 pointer-events-none' : ''}`}
                  onClick={() => !isGeneratingText && fileInputRef.current?.click()}
                  onKeyDown={(e) => {
                    if (!isGeneratingText && (e.key === 'Enter' || e.key === ' ')) {
                      e.preventDefault();
                      fileInputRef.current?.click();
                    }
                  }}
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  style={{ minHeight: "100px" }}
                  role="button"
                  tabIndex={0}
                >
                  {isGeneratingText && useCustomImage ? (
                    <div className="flex flex-col items-center gap-2 py-2">
                      <RefreshCw className="w-6 h-6 text-blue-500 animate-spin" />
                      <p className="text-sm text-blue-500 font-medium">Analyzing image...</p>
                    </div>
                  ) : (
                    <>
                      <div className="flex flex-col items-center gap-2">
                        <ImageIcon className={`w-6 h-6 ${isDragging ? 'text-blue-500' : 'text-gray-400'}`} />
                        <p className={`text-sm ${isDragging ? 'text-blue-500' : 'text-gray-500'} text-center font-medium`}>
                          {isDragging ? 'Drop your image here' : 'Upload your reference image here'}
                        </p>
                      </div>
                      <input
                        id="referenceImage"
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleReferenceImageUpload}
                        disabled={isGeneratingText && useCustomImage}
                      />
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Review Section */}
          {(generatedMaterialName || previewThumbnail) && (
            <div className="mb-6 md:mb-8">
              <div className="flex gap-4">
                {/* Left column: Name and Prompt */}
                <div className="flex-1 space-y-3">
                  {/* Material Name - smaller and lighter text */}
                  <div className="group relative">
                    <input
                      type="text"
                      value={generatedMaterialName}
                      onChange={(e) => setGeneratedMaterialName(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg 
                        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white 
                        transition-all text-gray-900 focus:text-gray-900 text-sm focus:text-base
                        placeholder-gray-400"
                      placeholder="Material Name"
                    />
                  </div>

                  {/* Prompt - smaller and lighter text */}
                  <div className="group relative">
                    <textarea
                      value={customPrompt || generatedPrompt}
                      onChange={(e) => setCustomPrompt(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg 
                        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white 
                        transition-all text-gray-900 text-sm
                        h-[100px] md:h-[180px] resize-none placeholder-gray-400 leading-relaxed"
                      placeholder="Prompt"
                    />
                  </div>
                </div>

                {/* Right column: Preview */}
                <div className="w-28 md:w-36">
                  <div className="w-28 h-28 md:w-36 md:h-36 bg-gray-50 border border-gray-200 rounded-lg overflow-hidden relative flex items-center justify-center">
                    {/* Preview content */}
                    {((previewThumbnail || customImagePreview) && !isGeneratingPreview) ? (
                      <img 
                        src={useCustomImage ? customImagePreview : previewThumbnail} 
                        alt="Material preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-white flex flex-col items-center justify-center">
                        {isGeneratingPreview ? (
                          <>
                            <RefreshCw className="w-6 h-6 md:w-8 md:h-8 text-blue-500 animate-spin mb-2" />
                            <p className="text-xs md:text-sm text-blue-500 text-center px-2 md:px-4">
                              Generating preview...
                            </p>
                          </>
                        ) : (
                          <p className="text-xs md:text-sm text-gray-400 text-center px-2 md:px-4">
                            Preview
                          </p>
                        )}
                      </div>
                    )}
                    
                    {/* Refresh button */}
                    {(previewThumbnail || customImagePreview) && !isGeneratingPreview && !useCustomImage && (
                      <button
                        type="button"
                        onClick={() => {
                          if (!isGeneratingPreview) {
                            handleRefreshThumbnail(customPrompt);
                          }
                        }}
                        className="absolute top-2 right-2 bg-white/80 rounded-full p-1 hover:bg-white transition-colors"
                        title="Refresh thumbnail"
                      >
                        <RefreshCcw className="w-3 h-3 md:w-4 md:h-4 text-gray-600" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Action buttons */}
          <div className="flex justify-end gap-3 mt-4 md:mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 border border-gray-200 rounded-lg text-gray-600 hover:border-gray-300 hover:bg-gray-50 text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onAddMaterial}
              disabled={isGeneratingPreview || !newMaterialName.trim()}
              className="px-3 py-2 border border-blue-500 rounded-lg text-white bg-blue-500 hover:bg-blue-400 hover:cursor-pointer disabled:opacity-50 text-sm font-medium transition-colors"
            >
              + Add Material
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddMaterialModal; 