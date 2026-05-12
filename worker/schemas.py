"""
Pydantic schemas for the EaseTinker worker API.
"""
from typing import Optional
from pydantic import BaseModel, Field


class StartJobRequest(BaseModel):
    job_id: str = Field(..., description="Database job ID from Next.js")
    project_id: str
    tinker_api_key: str = Field(..., description="Decrypted Tinker API key")
    base_model: str = Field(..., example="Qwen/Qwen3-8B")
    lora_rank: int = Field(default=32, ge=1, le=256)
    learning_rate: float = Field(default=1e-4, gt=0)
    epochs: int = Field(default=3, ge=1, le=100)
    batch_size: int = Field(default=4, ge=1, le=64)
    loss_function: str = Field(default="cross_entropy")
    training_data: list[dict] = Field(..., description="List of {prompt, completion} dicts")


class JobStatusResponse(BaseModel):
    job_id: str
    status: str
    current_step: Optional[int] = None
    total_steps: Optional[int] = None
    current_epoch: Optional[int] = None
    current_loss: Optional[float] = None
    checkpoint_path: Optional[str] = None
    error_msg: Optional[str] = None


class HealthResponse(BaseModel):
    status: str
