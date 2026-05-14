"""
EaseTinker — Python Worker
FastAPI service that wraps the Tinker SDK for fine-tuning orchestration.
"""
import asyncio
import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Security, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware

from schemas import (
    StartJobRequest,
    JobStatusResponse,
    HealthResponse,
    ValidateTinkerKeyRequest,
    ValidateTinkerKeyResponse,
)
from job_runner import JobRunner

# ─── Logging ──────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("easetinker.worker")

# ─── Config ───────────────────────────────────────────────────────────────────
WORKER_SECRET = os.environ.get("WORKER_SECRET", "")
REDIS_URL = os.environ.get("REDIS_URL", "redis://localhost:6379")

# ─── Auth ─────────────────────────────────────────────────────────────────────
security = HTTPBearer()

def verify_secret(credentials: HTTPAuthorizationCredentials = Security(security)):
    """Verify the shared secret from Next.js."""
    if not WORKER_SECRET:
        raise HTTPException(status_code=500, detail="Worker secret not configured")
    if credentials.credentials != WORKER_SECRET:
        raise HTTPException(status_code=401, detail="Invalid worker secret")
    return credentials.credentials

# ─── App lifecycle ────────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Worker starting up...")
    app.state.runner = JobRunner(redis_url=REDIS_URL)
    yield
    logger.info("Worker shutting down...")

# ─── FastAPI App ──────────────────────────────────────────────────────────────
app = FastAPI(
    title="EaseTinker Worker",
    description="Internal Python worker for Tinker SDK orchestration",
    version="0.1.0",
    docs_url=None,  # Disable in production
    redoc_url=None,
    lifespan=lifespan,
)

# Only allow internal Next.js calls
app.add_middleware(
    CORSMiddleware,
    allow_origins=[],  # No external origins
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Authorization", "Content-Type"],
)

# ─── Routes ───────────────────────────────────────────────────────────────────

@app.get("/health", response_model=HealthResponse)
async def health():
    """Health check endpoint (no auth required)."""
    return HealthResponse(status="ok")


# Serialize validation calls: the Tinker SDK reads TINKER_API_KEY from process
# env, so we can't safely run two validations with different keys in parallel.
_tinker_validate_lock = asyncio.Lock()

VALIDATE_TIMEOUT_SECONDS = 20.0


def _classify_tinker_error(msg: str) -> str:
    """Turn a raw SDK error string into a user-friendly message."""
    low = msg.lower()
    if "billing" in low or "payment" in low or " 402" in msg or "code: 402" in msg:
        return (
            "Your Tinker account has billing paused. Add a payment method at "
            "https://tinker-console.thinkingmachines.ai/billing/balance and try again."
        )
    if " 401" in msg or "unauthorized" in low or "invalid api key" in low:
        return "Tinker rejected the API key as unauthorized. Double-check the key on the Tinker console."
    if " 403" in msg or "forbidden" in low:
        return "Tinker returned 403 Forbidden. The key may not have access to this resource."
    if " 404" in msg:
        return "Tinker endpoint returned 404. Check that the SDK version matches the server."
    return f"Tinker rejected the request: {msg}"


@app.post(
    "/tinker/validate",
    response_model=ValidateTinkerKeyResponse,
    dependencies=[Depends(verify_secret)],
)
async def validate_tinker_key(req: ValidateTinkerKeyRequest):
    """Validate a Tinker API key by querying server capabilities."""
    async with _tinker_validate_lock:
        try:
            import tinker
            os.environ["TINKER_API_KEY"] = req.api_key
            client = tinker.ServiceClient()
            try:
                caps = await asyncio.wait_for(
                    client.get_server_capabilities_async(),
                    timeout=VALIDATE_TIMEOUT_SECONDS,
                )
            except asyncio.TimeoutError:
                logger.warning("Tinker validation timed out after %.0fs", VALIDATE_TIMEOUT_SECONDS)
                return ValidateTinkerKeyResponse(
                    valid=False,
                    error=(
                        f"Timed out talking to Tinker after {int(VALIDATE_TIMEOUT_SECONDS)}s. "
                        "The most common cause is billing paused on the account — "
                        "check https://tinker-console.thinkingmachines.ai/billing/balance"
                    ),
                )
            supported = getattr(caps, "supported_models", None)
            max_batch = getattr(caps, "max_batch_size", None)
            # supported_models items may be pydantic objects — coerce to dict/list
            if supported is not None:
                try:
                    supported = [
                        m.model_dump() if hasattr(m, "model_dump") else m
                        for m in supported
                    ]
                except Exception:
                    pass
            logger.info(f"Tinker key validated, {len(supported) if supported else 0} models")
            return ValidateTinkerKeyResponse(
                valid=True,
                supported_models=supported,
                max_batch_size=max_batch,
            )
        except Exception as e:
            raw = str(e)
            logger.warning(f"Tinker key validation failed: {raw}")
            return ValidateTinkerKeyResponse(valid=False, error=_classify_tinker_error(raw))


@app.post("/jobs/start", dependencies=[Depends(verify_secret)])
async def start_job(request: StartJobRequest):
    """
    Start a training job.
    Called by Next.js when user clicks 'Start Training'.
    """
    runner: JobRunner = app.state.runner
    try:
        job_id = await runner.start_job(request)
        logger.info(f"Started job {job_id} for project {request.project_id}")
        return {"job_id": job_id, "status": "started"}
    except Exception as e:
        logger.error(f"Failed to start job: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/jobs/{job_id}/status", response_model=JobStatusResponse, dependencies=[Depends(verify_secret)])
async def get_job_status(job_id: str):
    """Get current status of a training job."""
    runner: JobRunner = app.state.runner
    status = await runner.get_status(job_id)
    if status is None:
        raise HTTPException(status_code=404, detail="Job not found")
    return status


@app.post("/jobs/{job_id}/stop", dependencies=[Depends(verify_secret)])
async def stop_job(job_id: str):
    """Cancel a running training job."""
    runner: JobRunner = app.state.runner
    await runner.stop_job(job_id)
    logger.info(f"Stopped job {job_id}")
    return {"job_id": job_id, "status": "stopping"}
