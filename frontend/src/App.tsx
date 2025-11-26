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

function App() {
  const [currentView, setCurrentView] = useState<ViewType>('upload');
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);

  const handleFileUpload = async (file: File) => {
    setCurrentView('processing');

    // Try backend upload
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await axios.post('http://localhost:5001/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 5000,
      });

      if (response.data.success) {
        setUploadedFile(response.data);
      }
    } catch (error) {
      console.error('Backend upload failed, using fallback:', error);
      setUploadedFile({
        filename: file.name,
        storedFilename: file.name,
        fileSize: file.size,
        uploadTime: new Date().toISOString(),
      });
    }

    // Processing animation duration
    setTimeout(() => {
      setCurrentView('dashboard');
    }, 3000);
  };

  const handleTextSubmit = async (text: string) => {
    setCurrentView('processing');

    // Try backend upload
    try {
      const response = await axios.post('http://localhost:5001/api/text-input', 
        { text }, 
        { timeout: 5000 }
      );

      if (response.data.success) {
        setUploadedFile({
          filename: 'user_input.txt',
          storedFilename: response.data.filename,
          fileSize: response.data.file_size,
          uploadTime: response.data.upload_time,
        });
      }
    } catch (error) {
      console.error('Backend text submit failed, using fallback:', error);
      setUploadedFile({
        filename: 'user_input.txt',
        storedFilename: 'user_input.txt',
        fileSize: text.length,
        uploadTime: new Date().toISOString(),
      });
    }

    // Processing animation duration
    setTimeout(() => {
      setCurrentView('dashboard');
    }, 3000);
  };

  const handleNewAnalysis = () => {
    setCurrentView('upload');
    setUploadedFile(null);
  };

  return (
    <div className="min-h-screen bg-slate-950">
      {currentView === 'upload' && (
        <UploadView 
          onFileUpload={handleFileUpload}
          onTextSubmit={handleTextSubmit}
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
