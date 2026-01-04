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
    <div className="min-h-screen bg-background flex flex-col p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <span className="text-xl font-display font-bold text-text-primary">ProcessAI</span>
      </div>

      {/* Main Content - ChatGPT Style */}
      <div className="flex-1 flex flex-col items-center justify-center max-w-4xl w-full mx-auto">
        {/* Welcome Message */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-display font-bold text-text-primary mb-4">
            KI-gestützte Prozessanalyse
          </h1>
          <p className="text-xl text-text-secondary max-w-2xl mx-auto mb-4">
            Beschreiben Sie Ihren <span className="text-accent font-medium">Prozess</span>, 
            laden Sie <span className="text-accent font-medium">prozessbezogene Dateien</span> (z.B. Event-Logs, BPMN-Daten) 
            hoch und erhalten Sie maßgeschneiderte, domänenspezifische <span className="text-accent font-medium">Prozessverbesserungen</span>.
          </p>
          <p className="text-base text-text-muted max-w-2xl mx-auto">
            💡 Tipp: Geben Sie den Namen Ihrer <span className="text-accent">Organisation</span> an, um eine kontextuelle Anreicherung der Daten zu ermöglichen.
          </p>
          <p className="text-base text-text-muted max-w-2xl mx-auto">
            📄 Optional: Geben Sie <span className="text-accent">Prozessoptimierungsziele</span>, <span className="text-accent">Compliance-Vorgaben</span> oder andere 
            prozessrelevante Daten an, um die Analyse zu verfeinern.
          </p>
        </div>

        {/* Example Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full mb-12">
          <div className="bg-background-surface border border-border rounded-card p-4 hover:border-accent/30 transition-all duration-150 cursor-pointer">
            <div className="text-sm text-text-secondary mb-2">🏢 Beispiel-Eingabe</div>
            <div className="text-text-primary text-sm">
              "Siemens AG, Garantieabwicklung – Prüfe das angehängte BPMN-Modell auf die Einhaltung unserer internen Compliance-Richtlinien (PDF-Anhang) und auf die ISO-Norm 10002"
            </div>
          </div>
          <div className="bg-background-surface border border-border rounded-card p-4 hover:border-accent/30 transition-all duration-150 cursor-pointer">
            <div className="text-sm text-text-secondary mb-2">🏭 Beispiel-Eingabe</div>
            <div className="text-text-primary text-sm">
              "BMW Group, Beschaffungsprozess – Optimiere die Performance des angehängten Prozesses (Event-Log). Beachte hierbei die internen Restriktionen (Word-Anhang)"
            </div>
          </div>
          <div className="bg-background-surface border border-border rounded-card p-4 hover:border-accent/30 transition-all duration-150 cursor-pointer">
            <div className="text-sm text-text-secondary mb-2">🏥 Beispiel-Eingabe</div>
            <div className="text-text-primary text-sm">
              "Charité Berlin, Patientenaufnahme – Steigere die finanzielle Effizienz des angehängten Prozesses (PDF-Datei). Halte dabei gesetzliche Vorgaben für Krankenhäuser ein"
            </div>
          </div>
        </div>

        {/* Input Area - ChatGPT Style */}
        <div className="w-full">
          <div 
            className={`bg-background-surface backdrop-blur-sm rounded-panel border transition-all duration-150 ${
              dragActive 
                ? 'border-accent bg-accent/5' 
                : 'border-border hover:border-border-light'
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
                      className="flex items-center space-x-2 bg-background-elevated border border-border rounded-lg px-3 py-2 group"
                    >
                      <FileText className="w-4 h-4 text-accent" />
                      <span className="text-sm text-text-primary truncate max-w-[200px]">
                        {file.name}
                      </span>
                      <span className="text-xs text-text-muted">
                        ({formatFileSize(file.size)})
                      </span>
                      <button
                        onClick={() => removeFile(index)}
                        className="ml-2 text-text-muted hover:text-semantic-error transition-colors duration-150"
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
                placeholder="Beschreiben Sie Ihren Prozess, laden prozessbezogene Dateien hoch und stellen Kontextinformationen bereit..."
                className="w-full px-6 py-5 bg-transparent text-text-primary placeholder-text-muted focus:outline-none resize-none min-h-[80px] max-h-[300px]"
                rows={3}
              />
              
              {/* Bottom Actions */}
              <div className="flex items-center justify-between px-6 pb-4">
                <div className="flex items-center space-x-3">
                  {/* File Upload Button */}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 text-text-secondary hover:text-accent hover:bg-background-elevated rounded-lg transition-all duration-150"
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
                  
                  <span className="text-xs text-text-muted">
                    {attachedFiles.length > 0 
                      ? `${attachedFiles.length} Datei(en) angehängt` 
                      : '.xes, .csv, .bpmn, .txt, .pdf, .docx'}
                  </span>
                </div>

                {/* Submit Button */}
                <button
                  onClick={handleSubmit}
                  disabled={!textInput.trim() && attachedFiles.length === 0}
                  className="p-2.5 bg-accent hover:bg-accent-hover disabled:bg-background-elevated disabled:text-text-muted disabled:cursor-not-allowed text-white rounded-button transition-all duration-150 flex items-center space-x-2"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default UploadView;
