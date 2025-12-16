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
    // Try backend upload
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await axios.post('http://localhost:5001/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 10000,
      });

      if (response.data.success) {
        console.log('File uploaded successfully:', response.data);
      }
    } catch (error) {
      console.error('Backend upload failed:', error);
    }
  };

  const handleTextSubmit = async (text: string) => {
    // Try backend upload
    try {
      const response = await axios.post('http://localhost:5001/api/text-input', 
        { text }, 
        { timeout: 5000 }
      );

      if (response.data.success) {
        console.log('Text submitted successfully:', response.data);
      }
    } catch (error) {
      console.error('Backend text submit failed:', error);
    }
  };

  const handleCombinedSubmit = async (text: string, files: File[]) => {
    setCurrentView('processing');

    const uploadResults = {
      textUploaded: false,
      filesUploaded: 0,
      totalFiles: files.length,
    };

    // Submit text if present
    if (text.trim()) {
      try {
        await handleTextSubmit(text);
        uploadResults.textUploaded = true;
      } catch (error) {
        console.error('Text upload error:', error);
      }
    }

    // Submit all files
    for (const file of files) {
      try {
        await handleFileUpload(file);
        uploadResults.filesUploaded++;
      } catch (error) {
        console.error('File upload error:', error);
      }
    }

    // Set uploaded file info for display
    if (uploadResults.filesUploaded > 0 || uploadResults.textUploaded) {
      setUploadedFile({
        filename: uploadResults.textUploaded 
          ? `Text + ${uploadResults.filesUploaded} Datei(en)` 
          : `${uploadResults.filesUploaded} Datei(en)`,
        storedFilename: 'multiple_uploads',
        fileSize: 0,
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
