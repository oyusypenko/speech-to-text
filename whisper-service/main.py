#!/usr/bin/env python3
"""
WhisperX Service API
Provides transcription services using WhisperX library
"""

import os
import logging
import tempfile
import asyncio
from pathlib import Path
from typing import Optional, Dict, Any
import traceback

from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.responses import JSONResponse
import whisperx
import torch
import gc

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="WhisperX Transcription Service",
    description="High-accuracy speech-to-text transcription using WhisperX",
    version="1.0.0"
)

class WhisperXService:
    def __init__(self):
        # Check if we should skip model initialization (for testing without GPU)
        self.skip_models = os.getenv('SKIP_MODEL_INIT', '').lower() == 'true'
        
        if self.skip_models:
            logger.info("⚠️ SKIP_MODEL_INIT is set - WhisperX models will NOT be initialized")
            logger.info("⚠️ API endpoints will work but transcription will return mock data")
            self.device = "none"
            self.compute_type = "none"
            self.batch_size = 0
            self.gpu_available = False
        else:
            # Check if FORCE_CPU environment variable is set
            force_cpu = os.getenv('FORCE_CPU', '').lower() == 'true'
            
            # Determine device based on availability and environment
            if force_cpu:
                self.device = "cpu"
                self.compute_type = "int8"
                self.batch_size = 8  # Smaller batch size for CPU
                logger.info("🖥️ Forced CPU mode by environment variable")
            elif torch.cuda.is_available():
                self.device = "cuda"
                self.compute_type = "float16"
                self.batch_size = 16
                logger.info("🚀 GPU mode enabled")
            else:
                self.device = "cpu"
                self.compute_type = "int8" 
                self.batch_size = 8  # Smaller batch size for CPU
                logger.info("💻 CPU mode (no GPU detected)")
            
            self.gpu_available = self.device == "cuda"
            
            logger.info(f"Device: {self.device}")
            logger.info(f"Compute type: {self.compute_type}")
            logger.info(f"Batch size: {self.batch_size}")
            
            # Performance warnings for CPU mode
            if not self.gpu_available:
                logger.warning("⚠️ Running in CPU mode - transcription will be slower")
                logger.warning("⚠️ For better performance, use NVIDIA GPU with CUDA support")
        
        self.models_cache = {}
        
        # Create directories
        os.makedirs("/app/uploads", exist_ok=True)
        os.makedirs("/app/temp", exist_ok=True)
        os.makedirs("/app/models", exist_ok=True)

    def load_model(self, model_name: str) -> Dict[str, Any]:
        """Load and cache WhisperX model"""
        if model_name in self.models_cache:
            logger.info(f"Using cached model: {model_name}")
            return self.models_cache[model_name]
        
        try:
            logger.info(f"Loading model: {model_name}")
            
            # Load WhisperX model
            model = whisperx.load_model(
                model_name, 
                self.device, 
                compute_type=self.compute_type,
                download_root="/app/models"
            )
            
            self.models_cache[model_name] = {
                "model": model,
                "model_name": model_name
            }
            
            logger.info(f"Successfully loaded model: {model_name}")
            return self.models_cache[model_name]
            
        except Exception as e:
            logger.error(f"Failed to load model {model_name}: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Failed to load model: {str(e)}")

    async def transcribe_audio(
        self, 
        audio_file: UploadFile,
        model_name: str = "base",
        language: Optional[str] = None,
        job_id: str = "unknown"
    ) -> Dict[str, Any]:
        """Transcribe audio file using WhisperX"""
        
        # If models are skipped, return mock data
        if self.skip_models:
            logger.info(f"MOCK: Simulating transcription for job {job_id}")
            
            # Save file to simulate processing
            temp_path = f"/app/temp/{job_id}_{audio_file.filename}"
            content = await audio_file.read()
            with open(temp_path, 'wb') as f:
                f.write(content)
            
            # Create mock transcription
            transcription_text = f"[TEST MODE] Mock transcription for file {audio_file.filename}. " \
                                f"Model: {model_name}, Language: {language or 'auto'}. " \
                                f"In production with GPU, this would contain actual transcribed text."
            
            transcription_filename = f"transcription_{job_id}.txt"
            transcription_path = f"/app/temp/{transcription_filename}"
            
            with open(transcription_path, 'w', encoding='utf-8') as f:
                f.write(transcription_text)
            
            # Clean up
            try:
                os.unlink(temp_path)
            except:
                pass
            
            return {
                "success": True,
                "transcription": transcription_text,
                "transcription_file": transcription_path,
                "language": language or "en",
                "segments_count": 1,
                "model_used": model_name,
                "mode": "TEST_MODE_NO_GPU"
            }
        
        temp_input_path = None
        temp_output_path = None
        
        try:
            logger.info(f"Starting transcription for job {job_id} with model {model_name}")
            
            # Save uploaded file to temporary location
            with tempfile.NamedTemporaryFile(delete=False, suffix=Path(audio_file.filename).suffix) as temp_file:
                temp_input_path = temp_file.name
                content = await audio_file.read()
                temp_file.write(content)
            
            logger.info(f"Saved audio file to: {temp_input_path}")
            
            # Load model
            model_info = self.load_model(model_name)
            model = model_info["model"]
            
            # Load audio
            logger.info("Loading audio file...")
            audio = whisperx.load_audio(temp_input_path)
            
            # Transcribe with WhisperX
            logger.info("Starting transcription...")
            result = model.transcribe(audio, batch_size=self.batch_size)
            
            # Language detection if not specified
            detected_language = result.get("language", "unknown")
            if language is None:
                language = detected_language
                
            logger.info(f"Detected language: {detected_language}")
            
            # Load alignment model if language is supported
            try:
                logger.info(f"Loading alignment model for language: {language}")
                model_a, metadata = whisperx.load_align_model(
                    language_code=language, 
                    device=self.device
                )
                
                # Align whisper output
                logger.info("Aligning transcription...")
                result = whisperx.align(
                    result["segments"], 
                    model_a, 
                    metadata, 
                    audio, 
                    self.device, 
                    return_char_alignments=False
                )
                
                # Clean up alignment model
                del model_a
                if self.device == "cuda":
                    torch.cuda.empty_cache()
                gc.collect()
                
            except Exception as e:
                logger.warning(f"Alignment failed, using basic transcription: {str(e)}")
            
            # Diarization (optional, can be resource intensive)
            # For now, we skip this step to keep things simple and fast
            
            # Extract transcription text
            if "segments" in result:
                transcription_text = " ".join([segment["text"].strip() for segment in result["segments"]])
            else:
                transcription_text = result.get("text", "")
            
            # Clean up transcription text
            transcription_text = transcription_text.strip()
            
            if not transcription_text:
                raise HTTPException(status_code=400, detail="No transcription generated")
            
            logger.info(f"Transcription completed. Length: {len(transcription_text)} characters")
            
            # Save transcription to file
            transcription_filename = f"transcription_{job_id}.txt"
            temp_output_path = f"/app/temp/{transcription_filename}"
            
            with open(temp_output_path, 'w', encoding='utf-8') as f:
                f.write(transcription_text)
            
            logger.info(f"Saved transcription to: {temp_output_path}")
            
            return {
                "success": True,
                "transcription": transcription_text,
                "transcription_file": temp_output_path,
                "language": language,
                "segments_count": len(result.get("segments", [])),
                "model_used": model_name
            }
            
        except Exception as e:
            logger.error(f"Transcription failed for job {job_id}: {str(e)}")
            logger.error(traceback.format_exc())
            
            return {
                "success": False,
                "error": f"Transcription failed: {str(e)}"
            }
            
        finally:
            # Clean up temporary input file
            if temp_input_path and os.path.exists(temp_input_path):
                try:
                    os.unlink(temp_input_path)
                except Exception as e:
                    logger.warning(f"Failed to remove temp file {temp_input_path}: {e}")
            
            # Force garbage collection to free memory
            gc.collect()
            if self.device == "cuda":
                torch.cuda.empty_cache()

# Initialize service
whisperx_service = WhisperXService()

@app.get("/")
async def root():
    """Root endpoint with service information"""
    return {
        "service": "WhisperX Transcription Service",
        "version": "1.0.0",
        "status": "running",
        "device": whisperx_service.device,
        "gpu_available": whisperx_service.gpu_available,
        "compute_type": whisperx_service.compute_type,
        "batch_size": whisperx_service.batch_size,
        "available_models": ["tiny", "base", "small", "medium", "large"],
        "performance_mode": "GPU Accelerated" if whisperx_service.gpu_available else "CPU Mode (Slower)",
        "endpoints": {
            "health": "/health",
            "transcribe": "/transcribe"
        }
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    try:
        # Basic health check
        torch_available = torch.cuda.is_available() if whisperx_service.device == "cuda" else True
        
        return {
            "status": "healthy",
            "device": whisperx_service.device,
            "gpu_available": whisperx_service.gpu_available,
            "torch_cuda_available": torch.cuda.is_available(),
            "device_functional": torch_available,
            "models_loaded": list(whisperx_service.models_cache.keys()),
            "performance_mode": "GPU Accelerated" if whisperx_service.gpu_available else "CPU Mode",
            "warnings": [] if whisperx_service.gpu_available else [
                "Running in CPU mode - slower performance",
                "Consider using NVIDIA GPU for better performance"
            ]
        }
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        raise HTTPException(status_code=503, detail=f"Service unhealthy: {str(e)}")

@app.post("/transcribe")
async def transcribe_endpoint(
    audio: UploadFile = File(...),
    model: str = Form("base"),
    language: Optional[str] = Form(None),
    job_id: str = Form("unknown")
):
    """
    Transcribe audio file using WhisperX
    
    Parameters:
    - audio: Audio file (various formats supported)
    - model: WhisperX model size (tiny, base, small, medium, large)
    - language: Language code (optional, auto-detected if not provided)
    - job_id: Unique job identifier for tracking
    """
    
    # Validate file
    if not audio.filename:
        raise HTTPException(status_code=400, detail="No file provided")
    
    # Check file size (500MB limit)
    max_size = 500 * 1024 * 1024  # 500MB
    if audio.size and audio.size > max_size:
        raise HTTPException(status_code=413, detail="File too large (max 500MB)")
    
    # Validate model
    available_models = ["tiny", "base", "small", "medium", "large"]
    if model not in available_models:
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid model. Available models: {available_models}"
        )
    
    # Process transcription
    try:
        result = await whisperx_service.transcribe_audio(
            audio_file=audio,
            model_name=model,
            language=language,
            job_id=job_id
        )
        
        return JSONResponse(content=result)
        
    except Exception as e:
        logger.error(f"Transcription endpoint error: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    
    # Start server
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        log_level="info",
        reload=False
    )