import { useEffect, useRef, useState } from "react";

const Recognition = typeof window === "undefined" ? null : window.SpeechRecognition || window.webkitSpeechRecognition;

const ERRORS = {
  "not-allowed": "Microphone access is blocked. Allow it in your browser, or type instead.",
  "service-not-allowed": "Microphone access is blocked. Allow it in your browser, or type instead.",
  "no-speech": "We didn't hear anything. Tap the mic and speak again.",
  "audio-capture": "No microphone found. You can type instead.",
  network: "Voice typing needs an internet connection. You can type instead.",
  "language-not-supported": "Your browser can't listen in this language yet. Try typing, or pick English.",
};

/**
 * Voice typing with the browser's own speech recognition (Chrome, Edge and
 * Safari; the browser sends the audio to its own speech service). `onText`
 * gets the words heard so far: (final, stillSpeaking).
 */
export function useSpeech({ lang, onText }) {
  const [listening, setListening] = useState(false);
  const [error, setError] = useState("");
  const recognition = useRef(null);
  const callback = useRef(onText);

  useEffect(() => {
    callback.current = onText;
  }, [onText]);

  useEffect(() => () => recognition.current?.abort(), []);

  const start = () => {
    if (!Recognition || listening) return;
    setError("");
    const r = new Recognition();
    r.lang = lang;
    r.continuous = true;
    r.interimResults = true;
    let heard = "";
    r.onresult = (e) => {
      let partial = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const words = e.results[i][0].transcript;
        if (e.results[i].isFinal) heard += `${words} `;
        else partial += words;
      }
      callback.current(heard.trim(), partial.trim());
    };
    r.onerror = (e) => {
      if (e.error !== "aborted") setError(ERRORS[e.error] || "Voice typing stopped. Please try again.");
    };
    r.onend = () => {
      setListening(false);
      callback.current(heard.trim(), "");
    };
    recognition.current = r;
    r.start();
    setListening(true);
  };

  const stop = () => recognition.current?.stop();

  return { supported: Boolean(Recognition), listening, error, start, stop };
}
