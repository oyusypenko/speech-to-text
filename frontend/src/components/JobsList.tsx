'use client';

import React, { useState, useEffect } from 'react';
import { Job } from '@/types';
import { apiClient } from '@/lib/api';

interface JobsListProps {
  refreshTrigger: number;
}

export const JobsList: React.FC<JobsListProps> = ({ refreshTrigger }) => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadJobs();
  }, [refreshTrigger]);

  useEffect(() => {
    const interval = setInterval(() => {
      loadJobs();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const loadJobs = async () => {
    try {
      const response = await apiClient.getAllJobs();
      if (response.success && response.data) {
        setJobs(response.data.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ));
      }
    } catch (error) {
      // Error loading jobs - could implement proper error logging here
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (jobId: string) => {
    if (!confirm('Delete this job?')) return;

    try {
      await apiClient.deleteJob(jobId);
      setJobs(jobs.filter(job => job.id !== jobId));
    } catch (error) {
      // Delete error - could implement proper error logging here
      alert('Job deletion error');
    }
  };

  const handleDownload = async (job: Job) => {
    if (!job.transcriptionFilePath) return;

    try {
      const blob = await apiClient.downloadTranscription(job.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `transcription_${job.originalFilename}.txt`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      // Download error - could implement proper error logging here
      alert('File download error');
    }
  };

  const getStatusColor = (status: Job['status']) => {
    switch (status) {
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'processing':
        return 'text-blue-600 bg-blue-100';
      case 'completed':
        return 'text-green-600 bg-green-100';
      case 'failed':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status: Job['status']) => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'processing':
        return 'Processing';
      case 'completed':
        return 'Completed';
      case 'failed':
        return 'Failed';
      default:
        return status;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US');
  };

  if (loading) {
    return (
      <div className="w-full max-w-4xl mx-auto p-6">
        <div className="text-center">Loading jobs...</div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        Job History ({jobs.length})
      </h2>

      {jobs.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No jobs to display
        </div>
      ) : (
        <div className="space-y-4">
          {jobs.map((job) => (
            <div
              key={job.id}
              className="bg-white rounded-lg shadow border p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 truncate">
                      {job.originalFilename}
                    </h3>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                        job.status
                      )}`}
                    >
                      {getStatusText(job.status)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-3">
                    <div>
                      <span className="font-medium">Type:</span> {job.fileType}
                    </div>
                    <div>
                      <span className="font-medium">Size:</span> {formatFileSize(job.fileSize)}
                    </div>
                    <div>
                      <span className="font-medium">Model:</span> {job.model}
                    </div>
                    <div>
                      <span className="font-medium">Created:</span> {formatDate(job.createdAt)}
                    </div>
                  </div>

                  {job.language && (
                    <div className="text-sm text-gray-600 mb-2">
                      <span className="font-medium">Language:</span> {job.language}
                    </div>
                  )}

                  {job.errorMessage && (
                    <div className="text-sm text-red-600 bg-red-50 p-2 rounded mb-2">
                      <span className="font-medium">Error:</span> {job.errorMessage}
                    </div>
                  )}

                  {job.transcriptionText && (
                    <div className="mt-3 p-3 bg-gray-50 rounded text-sm">
                      <div className="font-medium text-gray-700 mb-1">Transcription:</div>
                      <div className="text-gray-600 max-h-20 overflow-y-auto">
                        {job.transcriptionText.substring(0, 200)}
                        {job.transcriptionText.length > 200 && '...'}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex flex-col space-y-2 ml-4">
                  {job.status === 'completed' && job.transcriptionFilePath && (
                    <button
                      onClick={() => handleDownload(job)}
                      className="px-3 py-1 bg-primary-600 text-white text-sm rounded hover:bg-primary-700 transition-colors"
                    >
                      Download
                    </button>
                  )}
                  
                  <button
                    onClick={() => handleDelete(job.id)}
                    className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};