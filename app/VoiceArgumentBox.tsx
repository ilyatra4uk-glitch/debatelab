"use client";

import { useEffect, useRef, useState } from "react";

type SpeechRecognitionResultItem = {
  transcript: string;
};

type SpeechRecognitionResult = {
  isFinal: boolean;
  0: SpeechRecognitionResultItem;
};

type SpeechRecognitionResultList = {
  length: number;
  [index: number]: SpeechRecognitionResult;
};

type SpeechRecognitionEvent = {
  resultIndex: number;
  results: SpeechRecognitionResultList;
};

type SpeechRecognitionInstance = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  start: () => void;
  stop: () => void;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

type SpeechWindow = Window & {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
};

export function VoiceArgumentBox({
  label,
  placeholder,
}: {
  label: string;
  placeholder: string;
}) {
  const [text, setText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [message, setMessage] = useState("Press record and start speaking.");
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  useEffect(() => {
    const speechWindow = window as SpeechWindow;
    const Recognition =
      speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;

    if (!Recognition) {
      setIsSupported(false);
      setMessage("Voice recording is not supported in this browser.");
      return;
    }

    const recognition = new Recognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognition.onresult = (event) => {
      let transcript = "";
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        transcript += event.results[index][0].transcript;
      }
      setText((current) => `${current} ${transcript}`.trim());
    };
    recognition.onerror = () => {
      setIsListening(false);
      setMessage("I could not hear that clearly. Try recording again.");
    };
    recognition.onend = () => {
      setIsListening(false);
    };
    recognitionRef.current = recognition;

    return () => {
      recognition.stop();
      recognitionRef.current = null;
    };
  }, []);

  function toggleListening() {
    const recognition = recognitionRef.current;
    if (!recognition) return;

    if (isListening) {
      recognition.stop();
      setIsListening(false);
      setMessage("Recording stopped.");
      return;
    }

    recognition.start();
    setIsListening(true);
    setMessage("Listening...");
  }

  return (
    <div className="voice-box">
      <label className="debate-field">
        <span>{label}</span>
        <textarea
          onChange={(event) => setText(event.target.value)}
          placeholder={placeholder}
          value={text}
        />
      </label>
      <div className="voice-controls">
        <button
          className={isListening ? "record-action active" : "record-action"}
          disabled={!isSupported}
          onClick={toggleListening}
          type="button"
        >
          {isListening ? "Stop recording" : "Record speech"}
        </button>
        <button
          className="secondary-action"
          onClick={() => setText("")}
          type="button"
        >
          Clear
        </button>
      </div>
      <p className="voice-status">{message}</p>
    </div>
  );
}
