import { useState } from 'react';
import axios from 'axios';
import UploadView from './components/UploadView';
import ProcessingScreen from './components/ProcessingScreen';
import Dashboard from './components/Dashboard';

type ViewType = 'upload' | 'processing' | 'dashboard';

interface UploadedFile {
  filename: string;
  storedFilename: string;
  fileSize: number;
  uploadTime: string;
}

interface UploadResponse {
  files: UploadedFile[];
  total_files: number;
  etl_results: Array<{ file: string; status: string }>;
}

function App() {
  const [currentView, setCurrentView] = useState<ViewType>('upload');
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

  const handleCombinedSubmit = async (text: string, files: File[]) => {
    setCurrentView('processing');

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
      
      const response = await axios.post<{ success: boolean; data?: UploadResponse }>(
        'http://localhost:5001/api/combined-upload', 
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
          timeout: 10000,
        }
      );

      if (response.data.success && response.data.data) {
        setUploadedFiles(response.data.data.files);
        // Set the first file as primary for backward compatibility
        if (response.data.data.files.length > 0) {
          setUploadedFile(response.data.data.files[0]);
        }
        console.log('ETL Results:', response.data.data.etl_results);
      }
    } catch (error) {
      console.error('Backend upload failed:', error);
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
    }

    // Processing animation duration
    setTimeout(() => {
      setCurrentView('dashboard');
    }, 3000);
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
          onNewAnalysis={handleNewAnalysis}
        />
      )}
    </div>
  );
}

export default App;
