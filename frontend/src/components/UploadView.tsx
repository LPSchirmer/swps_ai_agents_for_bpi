import { useState, useRef } from 'react';
import { FileText, Send, Upload, X, Paperclip } from 'lucide-react';

interface UploadViewProps {
  onFileUpload: (file: File) => void;
  onTextSubmit: (text: string) => void;
  onCombinedSubmit?: (text: string, files: File[]) => void;
}

const UploadView = ({ onFileUpload, onTextSubmit, onCombinedSubmit }: UploadViewProps) => {
  const [textInput, setTextInput] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const allowedExtensions = ['.bpmn', '.xes', '.xml', '.csv', '.txt'];

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      Array.from(e.dataTransfer.files).forEach(file => handleFile(file));
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
      setAttachedFiles(prev => [...prev, file]);
    } else {
      alert(`Ungültiger Dateityp. Erlaubt sind: ${allowedExtensions.join(', ')}`);
    }
  };

  const removeFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    // Use combined submit if available and both text and files present
    if (onCombinedSubmit && (textInput.trim() || attachedFiles.length > 0)) {
      onCombinedSubmit(textInput, attachedFiles);
    } else {
      // Fallback to separate submissions
      if (textInput.trim()) {
        onTextSubmit(textInput);
      }
      
      // Submit all attached files
      for (const file of attachedFiles) {
        onFileUpload(file);
      }
    }
    
    // Clear after submission
    setTextInput('');
    setAttachedFiles([]);
  };

  const handleTextSubmitClick = () => {
    if (textInput.trim() || attachedFiles.length > 0) {
      handleSubmit();
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
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-slate-800">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-600 to-blue-600 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
              </svg>
            </div>
            <span className="text-xl font-bold text-white">ProcessAI</span>
          </div>
        </div>
      </div>

      {/* Main Content - Chat-like Interface */}
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-4xl">
          {/* Welcome Message */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-3">
              Wie kann ich Ihnen helfen?
            </h1>
            <p className="text-slate-400 text-lg">
              Beschreiben Sie Ihren Prozess oder laden Sie Dateien hoch
            </p>
          </div>

          {/* Suggestions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8">
            <button
              onClick={() => setTextInput('Analysiere meinen Event-Log und finde Bottlenecks')}
              className="p-4 bg-slate-900/60 hover:bg-slate-800/60 border border-slate-700 hover:border-slate-600 rounded-xl text-left transition-all"
            >
              <div className="text-white font-medium mb-1">Bottleneck-Analyse</div>
              <div className="text-slate-400 text-sm">Finde Engpässe in Ihrem Prozess</div>
            </button>
            <button
              onClick={() => setTextInput('Zeige mir Compliance-Verletzungen in meinem Prozess')}
              className="p-4 bg-slate-900/60 hover:bg-slate-800/60 border border-slate-700 hover:border-slate-600 rounded-xl text-left transition-all"
            >
              <div className="text-white font-medium mb-1">Compliance-Check</div>
              <div className="text-slate-400 text-sm">Überprüfe Regelkonformität</div>
            </button>
          </div>

          {/* Chat Input Box - ChatGPT Style */}
          <div className="bg-slate-900/60 backdrop-blur-sm rounded-2xl border border-slate-700 shadow-2xl">
            {/* Attached Files Display */}
            {attachedFiles.length > 0 && (
              <div className="p-4 border-b border-slate-700">
                <div className="flex flex-wrap gap-2">
                  {attachedFiles.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center space-x-2 bg-slate-800 rounded-lg px-3 py-2 border border-slate-600"
                    >
                      <FileText className="w-4 h-4 text-cyan-500" />
                      <span className="text-sm text-white">{file.name}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFile(index);
                        }}
                        className="text-slate-400 hover:text-white transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Text Input Area */}
            <div className="relative">
              <textarea
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Beschreiben Sie Ihren Prozess, Optimierungsziele, Compliance-Anforderungen..."
                className="w-full px-6 py-4 bg-transparent text-white placeholder-slate-500 focus:outline-none resize-none"
                rows={4}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              />
              
              {/* Action Bar */}
              <div className="flex items-center justify-between px-4 pb-4">
                <div className="flex items-center space-x-2">
                  {/* File Attach Button */}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 hover:bg-slate-800 rounded-lg transition-colors group"
                    title="Datei anhängen"
                  >
                    <Paperclip className="w-5 h-5 text-slate-400 group-hover:text-cyan-500" />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    accept=".bpmn,.xes,.xml,.csv,.txt"
                    onChange={handleChange}
                  />
                  <span className="text-xs text-slate-500">
                    {attachedFiles.length > 0 
                      ? `${attachedFiles.length} Datei(en) angehängt` 
                      : 'Dateien: .xes, .csv, .bpmn, .txt, .xml'
                    }
                  </span>
                </div>

                {/* Submit Button */}
                <button
                  onClick={handleTextSubmitClick}
                  disabled={!textInput.trim() && attachedFiles.length === 0}
                  className="p-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:from-slate-700 disabled:to-slate-700 disabled:cursor-not-allowed rounded-xl transition-all duration-300 group"
                  title="Senden"
                >
                  <Send className="w-5 h-5 text-white group-disabled:text-slate-500" />
                </button>
              </div>
            </div>
          </div>

          {/* Helper Text */}
          <div className="text-center mt-4 text-sm text-slate-500">
            <span className="inline-flex items-center space-x-4">
              <span>Shift + Enter für neue Zeile</span>
              <span>•</span>
              <span>Enter zum Senden</span>
              <span>•</span>
              <span>Mehrere Dateien möglich</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadView;
