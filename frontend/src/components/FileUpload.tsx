'use client';

import React, { useState, useCallback } from 'react';
import { apiClient } from '@/lib/api';

interface FileUploadProps {
  onUploadSuccess: (jobId: string) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onUploadSuccess }) => {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [language, setLanguage] = useState('auto');
  const [model, setModel] = useState('base');

  const handleFiles = useCallback(async (files: FileList) => {
    if (!files.length) return;

    const file = files[0];
    const allowedTypes = [
      'audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/ogg',
      'video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo'
    ];

    if (!allowedTypes.includes(file.type)) {
      alert('Unsupported file format. Supported formats: MP3, WAV, MP4, MOV, AVI, OGG');
      return;
    }

    if (file.size > 500 * 1024 * 1024) {
      alert('File too large. Maximum size: 500MB');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const response = await apiClient.uploadFile(
        file,
        language === 'auto' ? undefined : language,
        model
      );

      if (response.success && response.jobId) {
        onUploadSuccess(response.jobId);
      } else {
        alert(response.message || 'File upload error');
      }
    } catch (error: any) {
      // Upload error - could implement proper error logging here
      alert('File upload error: ' + (error.response?.data?.message || error.message));
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  }, [language, model, onUploadSuccess]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  }, [handleFiles]);

  return (
    <div className="w-full max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
        File Upload for Transcription
      </h2>

      <div className="mb-6 grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Language
          </label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            disabled={uploading}
          >
            <option value="auto">Auto-detect</option>
            <option value="ru">Russian</option>
            <option value="en">English</option>
            <option value="uk">Українська</option>
            <option value="es">Español</option>
            <option value="fr">Français</option>
            <option value="de">Deutsch</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Model
          </label>
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            disabled={uploading}
          >
            <option value="tiny">Tiny (fast, less accurate)</option>
            <option value="base">Base (optimal)</option>
            <option value="small">Small (accurate)</option>
            <option value="medium">Medium (very accurate)</option>
            <option value="large">Large (maximum accuracy)</option>
          </select>
        </div>
      </div>

      <div
        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive
            ? 'border-primary-500 bg-primary-50'
            : 'border-gray-300 hover:border-primary-400'
        } ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept="audio/*,video/*"
          onChange={handleChange}
          disabled={uploading}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />

        <div className="space-y-4">
          <div className="text-4xl text-gray-400">
            📁
          </div>
          
          {uploading ? (
            <div className="space-y-2">
              <p className="text-lg text-gray-600">Uploading file...</p>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          ) : (
            <>
              <p className="text-lg text-gray-600">
                Drop file here or click to select
              </p>
              <p className="text-sm text-gray-500">
                Supported: MP3, WAV, MP4, MOV, AVI, OGG (up to 500MB)
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};