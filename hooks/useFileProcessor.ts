
import { useState } from 'react';

interface FileData {
  name: string;
  base64: string;
  mimeType: string;
}

export const useFileProcessor = () => {
  const [error, setError] = useState<string | null>(null);

  const processFile = (file: File): Promise<FileData> => {
    return new Promise((resolve, reject) => {
      setError(null);
      if (!file) {
        const err = "No file provided.";
        setError(err);
        reject(new Error(err));
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // The result is in the format "data:mime/type;base64,the_base64_string"
        const base64String = result.split(',')[1];
        if (!base64String) {
          const err = "Could not read file content.";
          setError(err);
          reject(new Error(err));
          return;
        }
        
        resolve({
          name: file.name,
          base64: base64String,
          mimeType: file.type,
        });
      };
      
      reader.onerror = (err) => {
        setError('Error reading file.');
        reject(err);
      };
      
      reader.readAsDataURL(file);
    });
  };

  return { processFile, error };
};
