import { useState, useRef } from 'react';
import { FileText, Send, Paperclip, X } from 'lucide-react';

interface UploadViewProps {
  onFileUpload: (file: File) => void;
  onTextSubmit: (text: string) => void;
  onCombinedSubmit?: (text: string, files: File[]) => void;
}

const UploadView = ({ onFileUpload, onTextSubmit, onCombinedSubmit }: UploadViewProps) => {
  const [textInput, setTextInput] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const allowedExtensions = ['.bpmn', '.xes', '.xml', '.csv', '.txt', '.pdf', '.docx'];

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

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const newFiles = Array.from(e.dataTransfer.files).filter(file => {
        const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
        return allowedExtensions.includes(fileExtension);
      });
      setAttachedFiles(prev => [...prev, ...newFiles]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files).filter(file => {
        const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
        return allowedExtensions.includes(fileExtension);
      });
      setAttachedFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleFile = (file: File) => {
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    
    if (allowedExtensions.includes(fileExtension)) {
      setAttachedFiles(prev => [...prev, file]);
    } else {
      alert(`Ungültiger Dateityp. Erlaubt sind: ${allowedExtensions.join(', ')}`);
    }
  };

  const handleSubmit = () => {
    if (!textInput.trim() && attachedFiles.length === 0) return;

    if (onCombinedSubmit && (textInput.trim() || attachedFiles.length > 0)) {
      // Neue kombinierte Methode
      onCombinedSubmit(textInput, attachedFiles);
    } else {
      // Fallback zu alten Methoden
      if (textInput.trim()) {
        onTextSubmit(textInput);
      }
      if (attachedFiles.length > 0) {
        attachedFiles.forEach(file => onFileUpload(file));
      }
    }
    
    setTextInput('');
    setAttachedFiles([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && e.shiftKey) {
      return;
    }
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-cyan-600 to-blue-600 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
            </svg>
          </div>
          <span className="text-xl font-bold text-white">ProcessAI</span>
        </div>
      </div>

      {/* Main Content - ChatGPT Style */}
      <div className="flex-1 flex flex-col items-center justify-center max-w-4xl w-full mx-auto">
        {/* Welcome Message */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">
            Analysieren Sie Ihre Geschäftsprozesse
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            Beschreiben Sie Ihren Prozess in eigenen Worten und laden Sie relevante Dateien hoch – 
            <span className="text-cyan-400"> beides gleichzeitig ist möglich</span>
          </p>
        </div>

        {/* Example Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full mb-12">
          <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 hover:bg-slate-900/60 transition-all cursor-pointer">
            <div className="text-sm text-slate-400 mb-2">📊 Beispiel</div>
            <div className="text-white text-sm">
              "Analysiere meinen Bestellprozess und finde Engpässe"
            </div>
          </div>
          <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 hover:bg-slate-900/60 transition-all cursor-pointer">
            <div className="text-sm text-slate-400 mb-2">🔍 Beispiel</div>
            <div className="text-white text-sm">
              "Optimiere den Genehmigungsworkflow unter Einhaltung von ISO 9001"
            </div>
          </div>
          <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 hover:bg-slate-900/60 transition-all cursor-pointer">
            <div className="text-sm text-slate-400 mb-2">📁 Beispiel</div>
            <div className="text-white text-sm">
              "Hier ist mein Event-Log. Zeige mir die häufigsten Prozessvarianten"
            </div>
          </div>
        </div>

        {/* Input Area - ChatGPT Style */}
        <div className="w-full">
          <div 
            className={`bg-slate-900/60 backdrop-blur-sm rounded-3xl border-2 transition-all ${
              dragActive 
                ? 'border-cyan-500 bg-cyan-500/10' 
                : 'border-slate-700 hover:border-slate-600'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            {/* Attached Files Display */}
            {attachedFiles.length > 0 && (
              <div className="px-6 pt-4 pb-2">
                <div className="flex flex-wrap gap-2">
                  {attachedFiles.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center space-x-2 bg-slate-800/60 border border-slate-700 rounded-lg px-3 py-2 group"
                    >
                      <FileText className="w-4 h-4 text-cyan-400" />
                      <span className="text-sm text-white truncate max-w-[200px]">
                        {file.name}
                      </span>
                      <span className="text-xs text-slate-500">
                        ({formatFileSize(file.size)})
                      </span>
                      <button
                        onClick={() => removeFile(index)}
                        className="ml-2 text-slate-500 hover:text-red-400 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Text Input */}
            <div className="relative">
              <textarea
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Beschreiben Sie Ihren Prozess, Ihre Optimierungsziele, Compliance-Anforderungen... Oder laden Sie Dateien hoch."
                className="w-full px-6 py-5 bg-transparent text-white placeholder-slate-500 focus:outline-none resize-none min-h-[80px] max-h-[300px]"
                rows={3}
              />
              
              {/* Bottom Actions */}
              <div className="flex items-center justify-between px-6 pb-4">
                <div className="flex items-center space-x-3">
                  {/* File Upload Button */}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 text-slate-400 hover:text-cyan-400 hover:bg-slate-800/50 rounded-lg transition-all"
                    title="Dateien anhängen"
                  >
                    <Paperclip className="w-5 h-5" />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept=".bpmn,.xes,.xml,.csv,.txt,.pdf,.docx"
                    multiple
                    onChange={handleChange}
                  />
                  
                  <span className="text-xs text-slate-500">
                    {attachedFiles.length > 0 
                      ? `${attachedFiles.length} Datei(en) angehängt` 
                      : '.xes, .csv, .bpmn, .txt, .pdf, .docx'}
                  </span>
                </div>

                {/* Submit Button */}
                <button
                  onClick={handleSubmit}
                  disabled={!textInput.trim() && attachedFiles.length === 0}
                  className="p-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:from-slate-700 disabled:to-slate-700 disabled:cursor-not-allowed text-white rounded-xl transition-all duration-300 flex items-center space-x-2"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Helper Text */}
          <div className="text-center mt-4 text-sm text-slate-500">
            <span className="inline-flex items-center space-x-2">
              <span>💡 Tipp: Sie können Text und Dateien</span>
              <span className="text-cyan-400 font-medium">gleichzeitig</span>
              <span>einreichen</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadView;
