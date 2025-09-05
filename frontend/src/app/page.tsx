'use client';

import React, { useState } from 'react';
import { FileUpload } from '@/components/FileUpload';
import { JobsList } from '@/components/JobsList';

export default function HomePage() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleUploadSuccess = (jobId: string) => {
    // File uploaded successfully, refresh the jobs list
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="container mx-auto px-4 space-y-8">
      <header className="text-center py-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Speech to Text
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Convert audio and video files to text using WhisperX technology.
          Supports multiple languages and high-quality transcription.
        </p>
      </header>

      <FileUpload onUploadSuccess={handleUploadSuccess} />
      
      <JobsList refreshTrigger={refreshTrigger} />
    </div>
  );
}