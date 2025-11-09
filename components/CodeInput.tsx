import React, { useCallback } from 'react';
import { useCodeCourtStore } from '../store/useCodeCourtStore';
import { Button } from './common';
import { Upload, X, FileCode } from 'lucide-react';
import { CodeFile } from '../types';

interface CodeInputProps {
    isAnalyzing: boolean;
}

const CodeInput: React.FC<CodeInputProps> = ({ isAnalyzing }) => {
  const { codeFiles, addCodeFile, clearCodeFiles } = useCodeCourtStore();

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      // Fix: Explicitly type `file` as `File` to resolve type inference issues.
      Array.from(event.target.files).forEach((file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const content = e.target?.result as string;
          addCodeFile({ name: file.name, content });
        };
        reader.readAsText(file);
      });
    }
  }, [addCodeFile]);
  
  const handlePaste = useCallback((event: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const pastedText = event.clipboardData.getData('text');
    if (pastedText) {
        addCodeFile({ name: `pasted-code-${Date.now()}.txt`, content: pastedText });
    }
  }, [addCodeFile]);

  return (
    <div className="flex flex-col gap-4">
        <div>
            <label htmlFor="file-upload" className="sr-only">Upload files</label>
            <input id="file-upload" type="file" multiple onChange={handleFileChange} className="hidden" disabled={isAnalyzing} />
            <Button onClick={() => document.getElementById('file-upload')?.click()} className="w-full" variant="outline" disabled={isAnalyzing}>
                <Upload className="w-4 h-4 mr-2" /> Upload Files
            </Button>
        </div>

        <textarea
            className="w-full h-40 p-3 bg-secondary rounded-md text-sm font-mono focus:ring-2 focus:ring-primary focus:outline-none"
            placeholder="Or paste your code here..."
            onPaste={handlePaste}
            disabled={isAnalyzing}
        />

        {codeFiles.length > 0 && (
            <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center">
                    <h4 className="font-semibold text-sm">Code Context</h4>
                    <Button variant="ghost" size="sm" onClick={clearCodeFiles} disabled={isAnalyzing}>
                        <X className="w-4 h-4 mr-1" /> Clear
                    </Button>
                </div>
                <div className="max-h-32 overflow-y-auto space-y-1 pr-2">
                {codeFiles.map((file, index) => (
                    <div key={index} className="flex items-center bg-secondary p-2 rounded-md text-sm">
                        <FileCode className="w-4 h-4 mr-2 flex-shrink-0" />
                        <span className="truncate flex-1">{file.name}</span>
                    </div>
                ))}
                </div>
            </div>
        )}
    </div>
  );
};

export default CodeInput;