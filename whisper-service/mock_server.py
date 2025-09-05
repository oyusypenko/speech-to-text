#!/usr/bin/env python3
"""
Mock WhisperX Service API for testing without GPU
"""

import os
import logging
from typing import Optional
from pathlib import Path

from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.responses import JSONResponse

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Mock WhisperX Service",
    description="Mock API for testing without GPU",
    version="1.0.0"
)

# Create directories
os.makedirs("/app/uploads", exist_ok=True)
os.makedirs("/app/temp", exist_ok=True)

@app.get("/")
async def root():
    """Root endpoint with service information"""
    return {
        "service": "Mock WhisperX Transcription Service",
        "version": "1.0.0",
        "status": "running",
        "device": "mock",
        "gpu_available": False,
        "mode": "MOCK MODE - No actual transcription",
        "endpoints": {
            "health": "/health",
            "transcribe": "/transcribe"
        }
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "device": "mock",
        "gpu_available": False,
        "mode": "MOCK MODE",
        "warning": "This is a mock service - no actual transcription will occur"
    }

@app.post("/transcribe")
async def transcribe_endpoint(
    audio: UploadFile = File(...),
    model: str = Form("base"),
    language: Optional[str] = Form(None),
    job_id: str = Form("unknown")
):
    """
    Mock transcription endpoint
    Returns a placeholder response for testing
    """
    
    # Log the request
    logger.info(f"Mock transcription request for job {job_id}")
    logger.info(f"File: {audio.filename}, Model: {model}, Language: {language}")
    
    # Save the file to temp (just to simulate processing)
    temp_path = f"/app/temp/{job_id}_{audio.filename}"
    content = await audio.read()
    
    with open(temp_path, 'wb') as f:
        f.write(content)
    
    # Create mock transcription file
    transcription_text = f"[MOCK TRANSCRIPTION] This is a mock transcription for file {audio.filename}. " \
                        f"In production, this would contain the actual transcribed text from the audio/video file. " \
                        f"Model used: {model}, Language: {language or 'auto-detected'}."
    
    transcription_filename = f"transcription_{job_id}.txt"
    transcription_path = f"/app/temp/{transcription_filename}"
    
    with open(transcription_path, 'w', encoding='utf-8') as f:
        f.write(transcription_text)
    
    # Clean up uploaded file
    try:
        os.unlink(temp_path)
    except:
        pass
    
    return JSONResponse(content={
        "success": True,
        "transcription": transcription_text,
        "transcription_file": transcription_path,
        "language": language or "en",
        "segments_count": 1,
        "model_used": model,
        "warning": "This is a MOCK response - no actual transcription performed"
    })

if __name__ == "__main__":
    import uvicorn
    
    # Start server
    uvicorn.run(
        "mock_server:app",
        host="0.0.0.0",
        port=8000,
        log_level="info",
        reload=False
    )