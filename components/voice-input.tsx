"use client";

import { useEffect, useRef, useState } from "react";

type VoiceState = "idle" | "permission" | "requesting" | "recording" | "processing" | "review" | "denied" | "failed" | "interrupted" | "sent";

type SpeechResultEvent = {
  results: ArrayLike<{ 0: { transcript: string }; isFinal: boolean }>;
};

type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechResultEvent) => void) | null;
  onerror: (() => void) | null;
  start(): void;
  stop(): void;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

const mimeCandidates = ["audio/mp4", "audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus"];

export function selectRecordingMimeType() {
  if (typeof MediaRecorder === "undefined") return "";
  return mimeCandidates.find((type) => MediaRecorder.isTypeSupported(type)) ?? "";
}

export function VoiceInput({ sessionId, language, onUseTranscript }: {
  sessionId: string;
  language: string;
  onUseTranscript: (text: string) => void;
}) {
  const supported = typeof navigator !== "undefined"
    && Boolean(navigator.mediaDevices?.getUserMedia)
    && typeof MediaRecorder !== "undefined";
  const [state, setState] = useState<VoiceState>("idle");
  const [seconds, setSeconds] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [message, setMessage] = useState("");
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const speechDraftRef = useRef("");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const limitRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const jobIdRef = useRef<string | null>(null);
  const canceledRef = useRef(false);
  const interruptedRef = useRef(false);
  const stateRef = useRef<VoiceState>("idle");

  function transition(next: VoiceState) {
    stateRef.current = next;
    setState(next);
  }

  function clearTimers() {
    if (timerRef.current) clearInterval(timerRef.current);
    if (limitRef.current) clearTimeout(limitRef.current);
    timerRef.current = null;
    limitRef.current = null;
  }

  function stopTracks() {
    for (const track of streamRef.current?.getTracks() ?? []) track.stop();
    streamRef.current = null;
  }

  function deleteTemporaryAudio() {
    const jobId = jobIdRef.current;
    jobIdRef.current = null;
    if (jobId) void fetch(`/api/transcriptions/${jobId}`, { method: "DELETE", keepalive: true });
  }

  async function processRecording(blob: Blob) {
    clearTimers();
    stopTracks();
    transition("processing");
    const form = new FormData();
    form.set("sessionId", sessionId);
    form.set("clientUploadId", crypto.randomUUID());
    form.set("language", language);
    form.set("audio", blob, blob.type.includes("mp4") ? "recording.m4a" : "recording.webm");
    try {
      const response = await fetch("/api/transcriptions", { method: "POST", body: form });
      if (!response.ok) throw new Error("UPLOAD_FAILED");
      const payload = await response.json() as { job: { id: string; status: string; transcript: string | null } };
      jobIdRef.current = payload.job.id;
      const reviewedText = payload.job.transcript?.trim() || speechDraftRef.current.trim();
      if (!reviewedText) {
        transition("failed");
        setMessage("Speech-to-text is not configured on this pilot yet. Your recording was not added to the interview. You can type or use your phone keyboard's dictation button.");
        return;
      }
      setTranscript(reviewedText);
      transition("review");
      setMessage(interruptedRef.current
        ? "Recording was interrupted. Review the text below and correct anything missing before you use it."
        : "Review and edit the text before adding it to your answer.");
    } catch {
      transition("failed");
      setMessage("We could not process that recording. Nothing was added to your interview. You can retry or type instead.");
    }
  }

  function stopRecognition() {
    try { recognitionRef.current?.stop(); } catch { /* already stopped */ }
    recognitionRef.current = null;
  }

  function finishRecording(interrupted = false) {
    if (stateRef.current !== "recording") return;
    interruptedRef.current = interrupted;
    transition(interrupted ? "interrupted" : "processing");
    clearTimers();
    stopRecognition();
    const recorder = recorderRef.current;
    if (recorder?.state === "recording") recorder.stop();
    stopTracks();
  }

  async function beginRecording() {
    window.speechSynthesis?.cancel();
    transition("requesting");
    setMessage("");
    deleteTemporaryAudio();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      const mimeType = selectRecordingMimeType();
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      streamRef.current = stream;
      recorderRef.current = recorder;
      chunksRef.current = [];
      speechDraftRef.current = "";
      canceledRef.current = false;
      interruptedRef.current = false;
      recorder.ondataavailable = (event) => { if (event.data.size > 0) chunksRef.current.push(event.data); };
      recorder.onstop = () => {
        recorderRef.current = null;
        if (canceledRef.current) return;
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        void processRecording(blob);
      };
      for (const track of stream.getAudioTracks()) {
        track.onended = () => {
          if (stateRef.current === "recording") finishRecording(true);
        };
      }

      const Recognition = window.SpeechRecognition ?? window.webkitSpeechRecognition;
      if (Recognition) {
        const recognition = new Recognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = language;
        recognition.onresult = (event) => {
          let next = "";
          for (let index = 0; index < event.results.length; index += 1) next += event.results[index][0]?.transcript ?? "";
          speechDraftRef.current = next;
        };
        recognition.onerror = () => setMessage("Live speech recognition stopped. The recording will still be processed when you finish.");
        recognitionRef.current = recognition;
        try { recognition.start(); } catch { recognitionRef.current = null; }
      }

      recorder.start(500);
      setSeconds(0);
      transition("recording");
      timerRef.current = setInterval(() => setSeconds((value) => value + 1), 1000);
      limitRef.current = setTimeout(() => {
        setMessage("The 90-second limit was reached. Review this segment before continuing.");
        finishRecording();
      }, 90_000);
    } catch (error) {
      stopTracks();
      transition("denied");
      setMessage(error instanceof DOMException && error.name === "NotAllowedError"
        ? "Microphone access was not allowed. You can keep typing, or change the browser permission and retry."
        : "A microphone is not available right now. You can keep typing your answer.");
    }
  }

  function cancelRecording() {
    canceledRef.current = true;
    clearTimers();
    stopRecognition();
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
    recorderRef.current = null;
    stopTracks();
    deleteTemporaryAudio();
    setTranscript("");
    setMessage("Recording canceled. Nothing was added to your answer.");
    transition("idle");
  }

  function useTranscript() {
    onUseTranscript(transcript.trim());
    deleteTemporaryAudio();
    transition("sent");
    setMessage("Text added to the answer box. It is only sent when you choose Continue.");
  }

  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden && stateRef.current === "recording") finishRecording(true);
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      canceledRef.current = true;
      clearTimers();
      stopRecognition();
      if (recorderRef.current?.state === "recording") recorderRef.current.stop();
      stopTracks();
      deleteTemporaryAudio();
    };
    // This teardown is intentionally bound to mount/unmount. Mutable media
    // resources are read through refs so a render cannot replace the cleanup.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!supported) {
    return <p className="voice-fallback">Voice recording is not supported in this browser. You can type or use the dictation key on your phone keyboard.</p>;
  }

  return (
    <div className="voice-input" aria-live="polite">
      {state === "idle" || state === "sent" || state === "denied" || state === "failed" ? (
        <button className="voice-button" type="button" onClick={() => transition("permission")}>
          <span aria-hidden="true">●</span> Start speaking
        </button>
      ) : null}
      {state === "permission" ? (
        <div className="voice-panel">
          <strong>Use your microphone for this answer?</strong>
          <p>Audio is sent only for transcription. We do not use your voice to infer age, emotion, personality, or employability.</p>
          <div className="voice-panel__actions">
            <button className="voice-button" type="button" onClick={beginRecording}>Allow microphone</button>
            <button className="text-button" type="button" onClick={cancelRecording}>Cancel</button>
          </div>
        </div>
      ) : null}
      {state === "requesting" ? <p role="status">Waiting for microphone permission…</p> : null}
      {state === "recording" ? (
        <div className="voice-panel voice-panel--recording">
          <strong>Recording · {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, "0")}</strong>
          <p>Speak naturally. Nothing is sent as an answer until you review the text.</p>
          <div className="voice-panel__actions">
            <button className="button button--primary" type="button" onClick={() => finishRecording()}>I&apos;m done</button>
            <button className="text-button" type="button" onClick={cancelRecording}>Cancel</button>
          </div>
        </div>
      ) : null}
      {state === "processing" || state === "interrupted" ? <p role="status">Turning the recording into text…</p> : null}
      {state === "review" ? (
        <div className="voice-panel">
          <label>
            <strong>Review the transcript</strong>
            <textarea rows={5} value={transcript} onChange={(event) => setTranscript(event.target.value)} />
          </label>
          <div className="voice-panel__actions">
            <button className="button button--primary" type="button" onClick={useTranscript}>Use this text</button>
            <button className="secondary-button" type="button" onClick={() => transition("permission")}>Record again</button>
            <button className="text-button" type="button" onClick={cancelRecording}>Cancel</button>
          </div>
        </div>
      ) : null}
      {message ? <p className={state === "failed" || state === "denied" ? "form-error" : "status-note"}>{message}</p> : null}
    </div>
  );
}
