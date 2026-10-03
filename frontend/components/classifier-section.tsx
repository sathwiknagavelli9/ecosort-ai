"use client";

import Image from "next/image";
import {
  AlertCircle,
  ArrowRight,
  Camera,
  Check,
  FileImage,
  ImagePlus,
  LoaderCircle,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";
import {
  type ChangeEvent,
  type DragEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import { PredictionResult } from "@/components/prediction-result";
import { predictWaste } from "@/lib/prediction-api";
import { ACCEPTED_IMAGE_TYPES, validateImageFile } from "@/lib/upload-validation";
import type { PredictionResponse } from "@/types/prediction";

type ClassifierState = "empty" | "preview" | "submitting" | "result" | "error";

export function ClassifierSection() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [state, setState] = useState<ClassifierState>("empty");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PredictionResponse | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  function clearNativeInputs() {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    if (cameraInputRef.current) {
      cameraInputRef.current.value = "";
    }
  }

  function selectFile(nextFile: File | undefined) {
    if (!nextFile) {
      return;
    }

    const validationMessage = validateImageFile(nextFile);
    if (validationMessage) {
      setError(validationMessage);
      setState("error");
      setResult(null);
      clearNativeInputs();
      return;
    }

    setFile(nextFile);
    setError(null);
    setResult(null);
    setState("preview");
  }

  function handleInput(event: ChangeEvent<HTMLInputElement>) {
    selectFile(event.target.files?.[0]);
  }

  function handleDrop(event: DragEvent<HTMLFieldSetElement>) {
    event.preventDefault();
    setIsDragging(false);
    selectFile(event.dataTransfer.files?.[0]);
  }

  function removeFile() {
    setFile(null);
    setResult(null);
    setError(null);
    setState("empty");
    clearNativeInputs();
  }

  async function classify() {
    if (!file || state === "submitting") {
      return;
    }

    setState("submitting");
    setError(null);
    setResult(null);
    try {
      const prediction = await predictWaste(file);
      setResult(prediction);
      setState("result");
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "The prediction could not be completed. Please try again.",
      );
      setState("error");
    }
  }

  const isSubmitting = state === "submitting";

  return (
    <section className="classifier-section" id="classifier">
      <div className="container classifier-section__intro">
        <div>
          <span className="eyebrow">Try the classifier</span>
          <h2>Give waste a clearer next step.</h2>
        </div>
        <p>
          Use one well-lit item against a simple background. Your image is sent only when you
          press <strong>Classify waste</strong> and is processed only for that request by the
          inference API.
        </p>
      </div>

      <div className="container classifier-shell">
        <div className="classifier-shell__accent" aria-hidden="true" />
        <div className="classifier-workspace">
          <div className="classifier-workspace__topbar">
            <div>
              <span className="status-dot" aria-hidden="true" />
              <span>EcoSort visual scanner</span>
            </div>
            <span>JPEG · PNG · WEBP · max 8 MiB</span>
          </div>

          {state === "result" && result ? (
            <PredictionResult result={result} onClassifyAnother={removeFile} />
          ) : (
            <div className="classifier-grid">
              <div className="upload-column">
                <input
                  ref={fileInputRef}
                  className="visually-hidden"
                  type="file"
                  accept={ACCEPTED_IMAGE_TYPES.join(",")}
                  onChange={handleInput}
                  aria-label="Choose a waste image"
                />
                <input
                  ref={cameraInputRef}
                  className="visually-hidden"
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleInput}
                  aria-label="Take a waste photo with the rear camera"
                />

                {!file || !previewUrl ? (
                  <fieldset
                    className={`dropzone${isDragging ? " dropzone--active" : ""}`}
                    aria-label="Waste image upload area"
                    onDragEnter={(event) => {
                      event.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragOver={(event) => event.preventDefault()}
                    onDragLeave={(event) => {
                      if (event.currentTarget === event.target) {
                        setIsDragging(false);
                      }
                    }}
                    onDrop={handleDrop}
                  >
                    <span className="dropzone__icon" aria-hidden="true">
                      <UploadCloud size={32} strokeWidth={1.7} />
                    </span>
                    <span className="eyebrow">Add an image</span>
                    <h3>Drop a waste photo here</h3>
                    <p>or choose a file from this device</p>
                    <button
                      className="button button--primary"
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <ImagePlus size={18} aria-hidden="true" />
                      Choose image
                    </button>
                    <button
                      className="camera-button"
                      type="button"
                      onClick={() => cameraInputRef.current?.click()}
                    >
                      <Camera size={17} aria-hidden="true" />
                      Use camera
                    </button>
                    <small>For best results, center one main item in good light.</small>
                  </fieldset>
                ) : (
                  <div className="image-preview">
                    <div className="image-preview__frame">
                      <Image
                        src={previewUrl}
                        alt={`Preview of selected waste image: ${file.name}`}
                        fill
                        sizes="(max-width: 760px) 90vw, 520px"
                        unoptimized
                      />
                      <span className="scan-corner scan-corner--one" aria-hidden="true" />
                      <span className="scan-corner scan-corner--two" aria-hidden="true" />
                      <span className="scan-corner scan-corner--three" aria-hidden="true" />
                      <span className="scan-corner scan-corner--four" aria-hidden="true" />
                      {isSubmitting ? <span className="scan-line" aria-hidden="true" /> : null}
                    </div>
                    <div className="image-preview__meta">
                      <FileImage size={19} aria-hidden="true" />
                      <div>
                        <strong>{file.name}</strong>
                        <span>{(file.size / (1024 * 1024)).toFixed(2)} MiB</span>
                      </div>
                    </div>
                    <div className="image-preview__actions">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isSubmitting}
                      >
                        <RefreshCw size={16} aria-hidden="true" />
                        Replace
                      </button>
                      <button type="button" onClick={removeFile} disabled={isSubmitting}>
                        <Trash2 size={16} aria-hidden="true" />
                        Remove
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <aside className="scan-panel" aria-label="Classification controls">
                <div className="scan-panel__title">
                  <span aria-hidden="true">
                    <Sparkles size={19} />
                  </span>
                  <div>
                    <small>Model status</small>
                    <strong>Ready for one image</strong>
                  </div>
                </div>

                <div className="scan-checklist">
                  <span>
                    <Check size={15} aria-hidden="true" />
                    One main object
                  </span>
                  <span>
                    <Check size={15} aria-hidden="true" />
                    Clear, well-lit photo
                  </span>
                  <span>
                    <Check size={15} aria-hidden="true" />
                    Supported image format
                  </span>
                </div>

                {error ? (
                  <div className="classifier-error" role="alert">
                    <AlertCircle size={19} aria-hidden="true" />
                    <div>
                      <strong>Couldn&apos;t classify this image</strong>
                      <p>{error}</p>
                    </div>
                    <button type="button" onClick={() => setError(null)} aria-label="Dismiss error">
                      <X size={16} />
                    </button>
                  </div>
                ) : null}

                {isSubmitting ? (
                  <div className="classifier-loading" role="status" aria-live="polite">
                    <LoaderCircle size={25} aria-hidden="true" />
                    <div>
                      <strong>Running real model inference…</strong>
                      <p>
                        EcoSort AI may be starting the classifier. The first request can take a little
                        longer on no-cost hosting.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="scan-panel__empty" aria-live="polite">
                    <span>{file ? "Image ready" : "Waiting for image"}</span>
                    <strong>{file ? "Start the six-class analysis" : "Add a photo to continue"}</strong>
                    <p>
                      No random or fallback prediction is used. If the trained model is unavailable,
                      this interface will say so.
                    </p>
                  </div>
                )}

                <button
                  className="button button--classify"
                  type="button"
                  onClick={classify}
                  disabled={!file || isSubmitting}
                >
                  {isSubmitting ? (
                    <LoaderCircle className="spin" size={19} aria-hidden="true" />
                  ) : (
                    <ShieldCheck size={19} aria-hidden="true" />
                  )}
                  {isSubmitting ? "Classifying…" : "Classify waste"}
                  {!isSubmitting ? <ArrowRight size={18} aria-hidden="true" /> : null}
                </button>
                <small className="scan-panel__privacy">
                  Images are processed for this request and are not permanently stored.
                </small>
              </aside>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
