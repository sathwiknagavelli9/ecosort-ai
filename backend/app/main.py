from __future__ import annotations

import logging
from contextlib import asynccontextmanager
from typing import AsyncIterator

from fastapi import FastAPI, File, HTTPException, Request, UploadFile
from fastapi.concurrency import run_in_threadpool
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .config import MAX_UPLOAD_BYTES, UPLOAD_CHUNK_BYTES, get_allowed_origins
from .inference import ImageValidationError, ModelService, decode_uploaded_image
from .schemas import (
    HealthResponse,
    ModelInfoResponse,
    PredictionResponse,
    RootResponse,
)

logger = logging.getLogger("ecosort.api")


def create_app(model_service: ModelService | None = None) -> FastAPI:
    service = model_service or ModelService()

    @asynccontextmanager
    async def lifespan(application: FastAPI) -> AsyncIterator[None]:
        application.state.model_service = service
        application.state.model_load_error = None
        try:
            await run_in_threadpool(service.load)
            logger.info("EcoSort model loaded successfully with %s classes.", len(service.class_names))
        except Exception as exc:  # startup remains observable through /health
            application.state.model_load_error = type(exc).__name__
            logger.error("EcoSort model failed to load (%s).", type(exc).__name__)
        yield

    application = FastAPI(
        title="EcoSort AI API",
        version="1.0.0",
        description="Real MobileNetV2 waste classification and deterministic recycling guidance.",
        lifespan=lifespan,
    )
    application.add_middleware(
        CORSMiddleware,
        allow_origins=get_allowed_origins(),
        allow_credentials=False,
        allow_methods=["GET", "POST", "OPTIONS"],
        allow_headers=["Accept", "Content-Type"],
    )

    @application.exception_handler(RequestValidationError)
    async def validation_error_handler(
        _request: Request, _exc: RequestValidationError
    ) -> JSONResponse:
        return JSONResponse(
            status_code=422,
            content={"detail": "The request is missing a valid multipart image field named 'file'."},
        )

    @application.exception_handler(Exception)
    async def unexpected_error_handler(_request: Request, exc: Exception) -> JSONResponse:
        logger.error("Unhandled API error (%s).", type(exc).__name__)
        return JSONResponse(
            status_code=500,
            content={"detail": "The classifier encountered an internal error."},
        )

    @application.get("/", response_model=RootResponse)
    async def root() -> RootResponse:
        return RootResponse(name="EcoSort AI API", status="ok", documentation="/docs")

    @application.get("/health", response_model=HealthResponse)
    async def health(request: Request) -> HealthResponse | JSONResponse:
        current: ModelService = request.app.state.model_service
        payload = HealthResponse(
            status="healthy" if current.loaded else "unavailable",
            model_loaded=current.loaded,
            runtime=current.runtime_version,
            supported_categories=len(current.class_names),
        )
        if not current.loaded:
            return JSONResponse(status_code=503, content=payload.model_dump())
        return payload

    @application.get("/model-info", response_model=ModelInfoResponse)
    async def model_info(request: Request) -> ModelInfoResponse:
        current: ModelService = request.app.state.model_service
        return current.model_info()

    @application.post("/predict", response_model=PredictionResponse)
    async def predict(request: Request, file: UploadFile = File(...)) -> PredictionResponse:
        current: ModelService = request.app.state.model_service
        if not current.loaded:
            raise HTTPException(status_code=503, detail="The trained model is temporarily unavailable.")

        content_type = file.content_type
        payload = bytearray()
        try:
            while chunk := await file.read(UPLOAD_CHUNK_BYTES):
                payload.extend(chunk)
                if len(payload) > MAX_UPLOAD_BYTES:
                    raise HTTPException(
                        status_code=413,
                        detail="The image is too large. The maximum upload size is 8 MiB.",
                    )
        finally:
            await file.close()

        try:
            image = await run_in_threadpool(
                decode_uploaded_image, bytes(payload), content_type
            )
            return await run_in_threadpool(current.predict, image)
        except ImageValidationError as exc:
            raise HTTPException(status_code=exc.status_code, detail=str(exc)) from exc
        except RuntimeError as exc:
            logger.error("Inference runtime error (%s).", type(exc).__name__)
            raise HTTPException(
                status_code=503, detail="The trained model is temporarily unavailable."
            ) from exc

    return application


app = create_app()
