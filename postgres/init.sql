-- Create database schema for speech-to-text application

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum for job status
CREATE TYPE job_status AS ENUM ('pending', 'processing', 'completed', 'failed');

-- Create enum for file type  
CREATE TYPE file_type AS ENUM ('audio', 'video');

-- Create jobs table
CREATE TABLE jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    original_filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_type file_type NOT NULL,
    file_size BIGINT NOT NULL,
    status job_status DEFAULT 'pending',
    transcription_text TEXT,
    transcription_file_path VARCHAR(500),
    language VARCHAR(10),
    model VARCHAR(50) DEFAULT 'base',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT
);

-- Create index for faster queries
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_created_at ON jobs(created_at);

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_jobs_updated_at 
    BEFORE UPDATE ON jobs 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();