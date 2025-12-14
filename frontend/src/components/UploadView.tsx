import { useState, useRef } from 'react';
import { FileText, Send } from 'lucide-react';

interface UploadViewProps {
  onFileUpload: (file: File) => void;
  onTextSubmit: (text: string) => void;
}

const UploadView = ({ onFileUpload, onTextSubmit }: UploadViewProps) => {
  const [textInput, setTextInput] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const allowedExtensions = ['.bpmn', '.xes', '.xml', '.csv'];

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    
    if (allowedExtensions.includes(fileExtension)) {
      onFileUpload(file);
    } else {
      alert(`Ungültiger Dateityp. Erlaubt sind: ${allowedExtensions.join(', ')}`);
    }
  };

  const handleTextSubmitClick = () => {
    if (textInput.trim()) {
      onTextSubmit(textInput);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && e.shiftKey) {
      return;
    }
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleTextSubmitClick();
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-6 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-cyan-600 to-blue-600 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
            </svg>
          </div>
          <span className="text-xl font-bold text-white">ProcessAI</span>
        </div>
        
        <button className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-lg font-medium transition-all duration-300">
          Starten
        </button>
      </div>

      {/* Main Content */}
      <div className="w-full max-w-2xl">
        <h1 className="text-4xl font-bold text-white text-center mb-3">
          Prozess analysieren
        </h1>
        <p className="text-slate-400 text-center mb-12">
          Beschreiben Sie Ihren bestehenden Prozess und fügen beliebige prozessrelevante Dateien bei
        </p>

        {/* Input Box */}
        <div className="bg-slate-900/60 backdrop-blur-sm rounded-2xl border border-slate-700 p-6">
          {/* Text Input */}
          <div className="mb-6">
            <textarea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Beschreiben Sie Ihren bestehenden Prozess, inlusive Prozessoptimierungszielen, Compliance-Restriktionen, uvm ..."
              className="w-full h-32 px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent resize-none transition-all"
            />
            <div className="text-xs text-slate-500 mt-2">
              Shift + Enter für neue Zeile • Enter zum Senden
            </div>
          </div>

          <button
            onClick={handleTextSubmitClick}
            disabled={!textInput.trim()}
            className="w-full px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:from-slate-700 disabled:to-slate-700 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-all duration-300 flex items-center justify-center space-x-2 mb-6"
          >
            <Send className="w-5 h-5" />
            <span>Prozess analysieren</span>
          </button>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-700"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="px-4 bg-slate-900/60 text-slate-500 text-sm">oder</span>
            </div>
          </div>

          {/* File Upload */}
          <div
            className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
              dragActive
                ? 'border-cyan-500 bg-cyan-500/10'
                : 'border-slate-700 hover:border-slate-600 hover:bg-slate-800/30'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".bpmn,.xes,.xml,.csv"
              onChange={handleChange}
            />

            <FileText className="w-12 h-12 mx-auto mb-4 text-slate-500" />
            <p className="text-white mb-2">
              <span className="text-cyan-500 hover:text-cyan-400 cursor-pointer">Datei auswählen</span> oder per Drag and Drop einfügen
            </p>
            <p className="text-slate-500 text-sm">
              .xes, .csv, .bpmn, .pdf, .txt, .docx • Max 25MB
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadView;
