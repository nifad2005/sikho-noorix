

import React, { useState, useRef } from 'react';
import { LearningMaterial, MaterialType } from '../types';
import { useFileProcessor } from '../hooks/useFileProcessor';
import { PlusIcon } from './icons/PlusIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { TrashIcon } from './icons/TrashIcon';

interface MaterialInputProps {
  onStartLearning: (materials: LearningMaterial[]) => void;
}

const MaterialInput: React.FC<MaterialInputProps> = ({ onStartLearning }) => {
  const [materials, setMaterials] = useState<LearningMaterial[]>([]);
  const [inputType, setInputType] = useState<MaterialType>(MaterialType.TOPIC);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { processFile, error: fileError } = useFileProcessor();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddMaterial = () => {
    if (!inputValue.trim()) return;
    const newMaterial: LearningMaterial = {
      id: Date.now().toString(),
      type: inputType,
      content: inputValue.trim(),
    };
    setMaterials([...materials, newMaterial]);
    setInputValue('');
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setIsLoading(true);
      try {
        const { name, base64, mimeType } = await processFile(file);
        const newMaterial: LearningMaterial = {
          id: Date.now().toString(),
          type: MaterialType.FILE,
          content: name,
          data: base64,
          mimeType: mimeType,
        };
        setMaterials(prev => [...prev, newMaterial]);
      } catch (err) {
        console.error("File processing error:", err);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleRemoveMaterial = (id: string) => {
    setMaterials(materials.filter(m => m.id !== id));
  };
  
  const inputPlaceholder = {
    [MaterialType.TOPIC]: "e.g., 'React Hooks' or 'Quantum Physics'",
    [MaterialType.TEXT]: "Paste any relevant text here...",
    [MaterialType.FILE]: "",
  };

  const renderMaterialTag = (material: LearningMaterial) => {
    const baseClasses = "flex items-center max-w-full py-2 pl-4 pr-2 rounded-full text-sm font-medium";
    const typeClasses = {
        [MaterialType.TOPIC]: "bg-sky-100 text-sky-800",
        [MaterialType.TEXT]: "bg-emerald-100 text-emerald-800",
        [MaterialType.FILE]: "bg-purple-100 text-purple-800",
    }
    const typeLabel = {
        [MaterialType.TOPIC]: "Topic",
        [MaterialType.TEXT]: "Text",
        [MaterialType.FILE]: "File",
    }
    
    return (
        <div key={material.id} className={`${baseClasses} ${typeClasses[material.type]}`}>
            <span className="font-bold mr-2">{typeLabel[material.type]}:</span>
            <span className="truncate" title={material.content}>{material.content}</span>
            <button onClick={() => handleRemoveMaterial(material.id)} className="ml-2 flex-shrink-0 p-1 rounded-full hover:bg-black/10">
                <TrashIcon className="h-4 w-4" />
            </button>
        </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
      <div className="text-center">
        <SparklesIcon className="mx-auto h-12 w-12 text-indigo-500" />
        <h2 className="mt-4 text-3xl font-extrabold text-slate-900 sm:text-4xl">
          Create Your Learning Path
        </h2>
        <p className="mt-4 text-lg text-slate-600">
          Provide your learning materials, and our AI will generate a personalized roadmap for you.
        </p>
      </div>
      
      <div className="mt-12 bg-white p-8 rounded-2xl shadow-xl border border-slate-200">
        <div className="flex border border-slate-300 rounded-lg p-1 bg-slate-100 mb-6">
          {(Object.keys(MaterialType) as Array<keyof typeof MaterialType>).map(key => (
            <button
              key={key}
              onClick={() => setInputType(MaterialType[key])}
              className={`w-full py-2.5 text-sm font-semibold rounded-md transition-colors focus:outline-none ${inputType === MaterialType[key] ? 'bg-white text-indigo-700 shadow' : 'text-slate-600 hover:bg-slate-200'}`}
            >
              {MaterialType[key].charAt(0).toUpperCase() + MaterialType[key].slice(1)}
            </button>
          ))}
        </div>

        {inputType === MaterialType.FILE ? (
          <div>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              className="w-full flex justify-center items-center px-6 py-3 border-2 border-dashed border-slate-300 rounded-lg text-slate-600 hover:border-indigo-500 hover:text-indigo-600 transition-colors"
            >
              {isLoading ? 'Processing...' : 'Click to upload a file (PDF, TXT, etc.)'}
            </button>
            {fileError && <p className="text-red-500 text-sm mt-2">{fileError}</p>}
          </div>
        ) : (
          <div className="flex space-x-4">
            <textarea
              rows={inputType === 'text' ? 5 : 1}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={inputPlaceholder[inputType]}
              className="flex-grow p-4 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow resize-y bg-white text-slate-800 placeholder-slate-400"
            />
            <button onClick={handleAddMaterial} className="self-start p-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                <PlusIcon className="h-6 w-6" />
            </button>
          </div>
        )}

        <div className="mt-6">
          <h3 className="text-lg font-medium text-slate-800">Your Materials</h3>
          {materials.length === 0 ? (
            <p className="text-slate-500 mt-2">Add some materials to get started.</p>
          ) : (
            <div className="mt-3 flex flex-wrap gap-3">
              {materials.map(renderMaterialTag)}
            </div>
          )}
        </div>

        <div className="mt-8 border-t border-slate-200 pt-6">
          <button
            onClick={() => onStartLearning(materials)}
            disabled={materials.length === 0}
            className="w-full flex items-center justify-center py-4 px-6 border border-transparent rounded-lg shadow-lg text-lg font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-transform transform hover:scale-105"
          >
            <SparklesIcon className="h-6 w-6 mr-3" />
            Generate Roadmap
          </button>
        </div>
      </div>
    </div>
  );
};

export default MaterialInput;