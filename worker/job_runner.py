"""
Job runner — wraps the Tinker SDK training loop.
In Phase 1 this is a scaffold. The full training loop will be implemented in Etapa 6.
"""
import asyncio
import logging
import json
from typing import Optional

import redis.asyncio as aioredis

from schemas import StartJobRequest, JobStatusResponse

logger = logging.getLogger("easetinker.runner")

# Redis key prefixes
JOB_STATUS_KEY = "job:status:{job_id}"
JOB_STOP_KEY = "job:stop:{job_id}"


class JobRunner:
    def __init__(self, redis_url: str):
        self.redis_url = redis_url
        self._redis: Optional[aioredis.Redis] = None
        self._active_tasks: dict[str, asyncio.Task] = {}

    async def _get_redis(self) -> aioredis.Redis:
        if self._redis is None:
            self._redis = await aioredis.from_url(self.redis_url, decode_responses=True)
        return self._redis

    async def start_job(self, request: StartJobRequest) -> str:
        """Start a training job in the background."""
        job_id = request.job_id

        # Set initial status
        await self._set_status(job_id, {
            "job_id": job_id,
            "status": "RUNNING",
            "current_step": 0,
            "total_steps": None,
            "current_epoch": 0,
            "current_loss": None,
            "checkpoint_path": None,
            "error_msg": None,
        })

        # Launch background task
        task = asyncio.create_task(self._run_training(request))
        self._active_tasks[job_id] = task
        task.add_done_callback(lambda t: self._active_tasks.pop(job_id, None))

        return job_id

    async def _run_training(self, request: StartJobRequest):
        """
        Main training loop — integrates with Tinker SDK.
        Full implementation in Etapa 6.
        """
        job_id = request.job_id
        logger.info(f"[{job_id}] Training loop starting (scaffold mode)")

        try:
            import os
            os.environ["TINKER_API_KEY"] = request.tinker_api_key

            # ── Scaffold: simulate training steps ──────────────────────────
            # In Etapa 6 this will be replaced with real Tinker SDK calls:
            #
            # import tinker
            # from tinker import types
            #
            # service_client = tinker.ServiceClient()
            # training_client = service_client.create_lora_training_client(
            #     base_model=request.base_model,
            #     rank=request.lora_rank,
            # )
            # tokenizer = await training_client.get_tokenizer()
            # ... build batches from request.training_data ...
            # for epoch in range(request.epochs):
            #     for step, batch in enumerate(batches):
            #         stop_requested = await self._is_stop_requested(job_id)
            #         if stop_requested:
            #             break
            #         loss = await training_client.forward_backward_async(batch, request.loss_function)
            #         await training_client.optim_step_async(types.AdamParams(learning_rate=request.learning_rate))
            #         await self._report_progress(job_id, step, epoch, float(loss))
            #
            # checkpoint = await training_client.save_state(f"easetinker-{job_id}")
            # ──────────────────────────────────────────────────────────────

            total_steps = request.epochs * max(1, len(request.training_data) // request.batch_size)
            step = 0
            import math
            for epoch in range(request.epochs):
                if await self._is_stop_requested(job_id):
                    break
                batch_count = max(1, len(request.training_data) // request.batch_size)
                for batch_step in range(batch_count):
                    if await self._is_stop_requested(job_id):
                        break
                    step += 1
                    # Simulate decreasing loss
                    simulated_loss = 2.5 * math.exp(-0.1 * step)
                    await self._report_progress(job_id, step, total_steps, epoch + 1, simulated_loss)
                    await asyncio.sleep(1)

            await self._set_status(job_id, {
                "job_id": job_id,
                "status": "COMPLETED",
                "current_step": step,
                "total_steps": total_steps,
                "current_epoch": request.epochs,
                "current_loss": None,
                "checkpoint_path": f"tinker://easetinker/{job_id}/final",
                "error_msg": None,
            })
            logger.info(f"[{job_id}] Training completed")

        except Exception as e:
            logger.error(f"[{job_id}] Training failed: {e}")
            await self._set_status(job_id, {
                "job_id": job_id,
                "status": "FAILED",
                "error_msg": str(e),
            })

    async def _report_progress(self, job_id: str, step: int, total_steps: int, epoch: int, loss: float):
        """Update job status in Redis."""
        await self._set_status(job_id, {
            "job_id": job_id,
            "status": "RUNNING",
            "current_step": step,
            "total_steps": total_steps,
            "current_epoch": epoch,
            "current_loss": loss,
            "checkpoint_path": None,
            "error_msg": None,
        })
        # Pub/sub for real-time dashboard
        r = await self._get_redis()
        await r.publish(f"job:metrics:{job_id}", json.dumps({
            "step": step,
            "epoch": epoch,
            "loss": loss,
        }))
        logger.debug(f"[{job_id}] step={step} epoch={epoch} loss={loss:.4f}")

    async def _set_status(self, job_id: str, data: dict):
        r = await self._get_redis()
        key = JOB_STATUS_KEY.format(job_id=job_id)
        await r.set(key, json.dumps(data), ex=86400)  # 24h TTL

    async def get_status(self, job_id: str) -> Optional[JobStatusResponse]:
        r = await self._get_redis()
        key = JOB_STATUS_KEY.format(job_id=job_id)
        data = await r.get(key)
        if data is None:
            return None
        return JobStatusResponse(**json.loads(data))

    async def stop_job(self, job_id: str):
        r = await self._get_redis()
        stop_key = JOB_STOP_KEY.format(job_id=job_id)
        await r.set(stop_key, "1", ex=3600)

    async def _is_stop_requested(self, job_id: str) -> bool:
        r = await self._get_redis()
        stop_key = JOB_STOP_KEY.format(job_id=job_id)
        return await r.exists(stop_key) > 0
