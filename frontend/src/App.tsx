import { useState } from 'react';
import axios from 'axios';
import UploadView from './components/UploadView';
import ProcessingScreen from './components/ProcessingScreen';
import Dashboard from './components/Dashboard';
import { ProcessMetrics } from './components/MetricsVisualization';

type ViewType = 'upload' | 'processing' | 'dashboard';

interface UploadedFile {
  filename: string;
  storedFilename: string;
  fileSize: number;
  uploadTime: string;
}

interface AgentOutputs {
  performance?: string;
  finance?: string;
  compliance?: string;
  requirements?: string;
  economic?: string;
}

// Prozess-Visualisierungs-Typen
interface ProcessVisualizationData {
  success: boolean;
  graph?: {
    nodes: Array<{
      id: string;
      label: string;
      type: 'start' | 'end' | 'activity' | 'gateway' | 'event';
      frequency: number;
      duration: number;
    }>;
    edges: Array<{
      source: string;
      target: string;
      frequency: number;
      label: string;
    }>;
    metadata: Record<string, unknown>;
  };
  image?: string;
  statistics?: {
    cases?: number;
    events?: number;
    activities?: number;
    variants?: number;
    top_activities?: Record<string, number>;
  };
  file_type?: string;
  file_name?: string;
  error?: string;
}

interface UploadResponse {
  files: UploadedFile[];
  total_files: number;
  etl_results: Array<{ file: string; status: string }>;
  ai_analysis?: {
    success: boolean;
    analysis_result?: string;
    agent_outputs?: AgentOutputs;
    process_metrics?: ProcessMetrics;
    process_visualization?: ProcessVisualizationData;
    error?: string;
    data_summary?: {
      has_textual_data: boolean;
      has_event_log: boolean;
      kpis_calculated: {
        basic: boolean;
        performance: boolean;
        finance: boolean;
        compliance: boolean;
      };
    };
  };
}

function App() {
  const [currentView, setCurrentView] = useState<ViewType>('upload');
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [aiAnalysisResult, setAiAnalysisResult] = useState<string | null>(null);
  const [agentOutputs, setAgentOutputs] = useState<AgentOutputs | null>(null);
  const [processMetrics, setProcessMetrics] = useState<ProcessMetrics | null>(null);
  const [processVisualization, setProcessVisualization] = useState<ProcessVisualizationData | null>(null);

  const handleCombinedSubmit = async (text: string, files: File[]) => {
    // Wechsle zum Processing Screen
    setCurrentView('processing');
    
    // Kurze Verzögerung damit der Processing Screen gerendert wird
    await new Promise(resolve => setTimeout(resolve, 100));

    try {
      const formData = new FormData();
      
      // Add text if provided
      if (text.trim()) {
        formData.append('text', text);
      }
      
      // Add files if provided
      if (files.length > 0) {
        files.forEach(file => {
          formData.append('files', file);
        });
      }
      
      console.log('🚀 Starte Upload und KI-Analyse...');
      const response = await axios.post<{ success: boolean; data?: UploadResponse }>(
        'http://localhost:5001/api/combined-upload', 
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
          timeout: 300000, // 5 Minuten für KI-Analyse
        }
      );

      if (response.data.success && response.data.data) {
        setUploadedFiles(response.data.data.files);
        // Set the first file as primary for backward compatibility
        if (response.data.data.files.length > 0) {
          setUploadedFile(response.data.data.files[0]);
        }
        console.log('ETL Results:', response.data.data.etl_results);
        
        // 🤖 KI-Analyseergebnisse speichern
        if (response.data.data.ai_analysis) {
          const aiAnalysis = response.data.data.ai_analysis;
          console.log('🔍 DEBUG ai_analysis vollständig:', JSON.stringify(aiAnalysis, null, 2));
          
          if (aiAnalysis.success && aiAnalysis.analysis_result) {
            setAiAnalysisResult(aiAnalysis.analysis_result);
            console.log('✅ KI-Analyse erfolgreich:', aiAnalysis.data_summary);
            
            // Speichere einzelne Agent-Outputs
            if (aiAnalysis.agent_outputs) {
              console.log('🔍 DEBUG agent_outputs:', JSON.stringify(aiAnalysis.agent_outputs, null, 2));
              console.log('📊 Agent Outputs Keys:', Object.keys(aiAnalysis.agent_outputs));
              console.log('📊 Performance vorhanden:', !!aiAnalysis.agent_outputs.performance);
              console.log('📊 Finance vorhanden:', !!aiAnalysis.agent_outputs.finance);
              console.log('📊 Compliance vorhanden:', !!aiAnalysis.agent_outputs.compliance);
              setAgentOutputs(aiAnalysis.agent_outputs);
            } else {
              console.warn('⚠️ KEINE agent_outputs im aiAnalysis!');
            }
            
            // 📊 NEU: Process Metrics für Visualisierung speichern
            if (aiAnalysis.process_metrics) {
              console.log('📈 Process Metrics vorhanden:', Object.keys(aiAnalysis.process_metrics));
              setProcessMetrics(aiAnalysis.process_metrics);
            } else {
              console.warn('⚠️ Keine process_metrics im aiAnalysis - Visualisierungen nicht verfügbar');
              setProcessMetrics(null);
            }
            
            // 📊 Prozessvisualisierung speichern
            if (aiAnalysis.process_visualization) {
              console.log('🎨 Prozessvisualisierung vorhanden');
              setProcessVisualization(aiAnalysis.process_visualization);
            } else {
              setProcessVisualization(null);
            }
          } else if (aiAnalysis.error) {
            console.warn('⚠️ KI-Analyse Fehler:', aiAnalysis.error);
            setAiAnalysisResult(null);
            setAgentOutputs(null);
            setProcessMetrics(null);
            setProcessVisualization(null);
          }
        } else {
          console.warn('⚠️ Keine KI-Analyse-Daten in der Antwort');
        }
        
        // Prozessvisualisierung kommt jetzt aus aiAnalysis.process_visualization
        // Kein zusätzlicher API-Aufruf mehr nötig
        
        console.log('✅ Upload und Analyse abgeschlossen - Wechsle zum Dashboard');
        // Wechsle zum Dashboard nachdem die Analyse komplett ist
        setCurrentView('dashboard');
      } else {
        console.error('❌ Ungültige Server-Antwort:', response.data);
        setCurrentView('dashboard');
      }
    } catch (error) {
      console.error('❌ Backend upload failed:', error);
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED') {
          console.error('⏱️ Timeout: Die KI-Analyse hat zu lange gedauert');
        } else if (error.response) {
          console.error('Server Error:', error.response.status, error.response.data);
        } else if (error.request) {
          console.error('Keine Antwort vom Server erhalten');
        }
      }
      
      // Fallback handling
      const fallbackFiles: UploadedFile[] = [];
      
      if (text.trim()) {
        fallbackFiles.push({
          filename: 'user_input.txt',
          storedFilename: 'user_input.txt',
          fileSize: text.length,
          uploadTime: new Date().toISOString(),
        });
      }
      
      files.forEach(file => {
        fallbackFiles.push({
          filename: file.name,
          storedFilename: file.name,
          fileSize: file.size,
          uploadTime: new Date().toISOString(),
        });
      });
      
      setUploadedFiles(fallbackFiles);
      if (fallbackFiles.length > 0) {
        setUploadedFile(fallbackFiles[0]);
      }
      
      // Auch bei Fehler zum Dashboard wechseln
      setCurrentView('dashboard');
    }
  };

  const handleFileUpload = async (file: File) => {
    // Backward compatibility - use combined submit with single file
    handleCombinedSubmit('', [file]);
  };

  const handleTextSubmit = async (text: string) => {
    // Backward compatibility - use combined submit with just text
    handleCombinedSubmit(text, []);
  };

  const handleNewAnalysis = () => {
    setCurrentView('upload');
    setUploadedFile(null);
    setUploadedFiles([]);
    setAiAnalysisResult(null);
    setAgentOutputs(null);
    setProcessMetrics(null);
    setProcessVisualization(null);
  };

  return (
    <div className="min-h-screen bg-slate-950">
      {currentView === 'upload' && (
        <UploadView 
          onFileUpload={handleFileUpload}
          onTextSubmit={handleTextSubmit}
          onCombinedSubmit={handleCombinedSubmit}
        />
      )}
      
      {currentView === 'processing' && (
        <ProcessingScreen />
      )}
      
      {currentView === 'dashboard' && (
        <Dashboard
          uploadedFile={uploadedFile}
          uploadedFiles={uploadedFiles}
          onNewAnalysis={handleNewAnalysis}
          aiAnalysisResult={aiAnalysisResult}
          agentOutputs={agentOutputs}
          processMetrics={processMetrics}
          processVisualization={processVisualization}
        />
      )}
    </div>
  );
}

export default App;
