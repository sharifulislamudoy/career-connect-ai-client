import { useCallback, useEffect, useRef, useState } from 'react';
const recognitionError = {
  'not-allowed': 'Microphone permission was denied. Allow access in browser settings or type your answer.',
  'service-not-allowed': 'The speech service is blocked in this browser. Type your answer or try a supported browser.',
  'audio-capture': 'No working microphone was found. Check your device or type your answer.',
  'no-speech': 'No speech was detected. Try again in a quiet place or type your answer.',
  network: 'Speech recognition could not reach its service. Check your connection; your existing transcript is kept.',
  'language-not-supported': 'The speech service does not support this language. You can type in this language instead.',
};
export default function useInterviewMedia({ language, onTranscript }) {
  const [voices, setVoices] = useState([]); const [listening, setListening] = useState(false); const [speaking, setSpeaking] = useState(false);
  const [interim, setInterim] = useState(''); const [note, setNote] = useState(''); const [camera, setCamera] = useState(false); const [cameraPending, setCameraPending] = useState(false);
  const recognitionRef = useRef(null); const streamRef = useRef(null); const videoRef = useRef(null); const transcriptRef = useRef(onTranscript);
  const mounted = useRef(true); const utteranceRef = useRef(null); const speechTimer = useRef(null); const cameraToken = useRef(0); const micToken = useRef(0); const micBusy = useRef(false); const speechToken = useRef(0); const [micPending, setMicPending] = useState(false);
  const speechSupported = typeof window !== 'undefined' && !!window.speechSynthesis;
  const recognitionSupported = typeof window !== 'undefined' && !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  const cameraSupported = typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia;
  useEffect(() => { transcriptRef.current = onTranscript; }, [onTranscript]);
  const stopSpeaking = useCallback(() => { speechToken.current++; clearTimeout(speechTimer.current); if (typeof window !== 'undefined') window.speechSynthesis?.cancel(); utteranceRef.current = null; if (mounted.current) setSpeaking(false); }, []);
  const stopListening = useCallback(() => { micToken.current++; micBusy.current = false; if (mounted.current) setMicPending(false); const recognition = recognitionRef.current; if (recognition) { try { recognition.stop(); } catch { /* Already stopped. */ } } }, []);
  const stopCamera = useCallback(() => { cameraToken.current++; streamRef.current?.getTracks().forEach(track => track.stop()); streamRef.current = null; if (videoRef.current) videoRef.current.srcObject = null; if (mounted.current) { setCamera(false); setCameraPending(false); } }, []);
  useEffect(() => {
    mounted.current = true;
    const micGeneration = micToken; const speechGeneration = speechToken;
    const synth = window.speechSynthesis; const update = () => setVoices(synth?.getVoices() || []);
    update(); synth?.addEventListener('voiceschanged', update);
    return () => { mounted.current = false; micGeneration.current++; speechGeneration.current++; synth?.removeEventListener('voiceschanged', update); clearTimeout(speechTimer.current); synth?.cancel();
      if (recognitionRef.current) { recognitionRef.current.onresult = null; recognitionRef.current.onerror = null; recognitionRef.current.onend = null; try { recognitionRef.current.abort(); } catch { /* Already ended. */ } }
      stopCamera();
    };
  }, [stopCamera]);
  useEffect(() => { stopListening(); stopSpeaking(); setInterim(''); }, [language, stopListening, stopSpeaking]);
  const matchedVoice = voices.find(voice => voice.lang.toLowerCase() === language.toLowerCase()) || voices.find(voice => voice.lang.split('-')[0].toLowerCase() === language.split('-')[0].toLowerCase());
  const speak = useCallback(text => {
    stopListening(); stopSpeaking(); setNote('');
    if (!speechSupported) { setNote('Spoken questions are unavailable in this browser. Read the displayed AI question.'); return false; }
    if (!matchedVoice) { setNote(`No installed voice matches ${language}. Install a matching device voice or read the displayed question.`); return false; }
    const token = speechToken.current; const chunks = text.match(/[^.!?。！？]+[.!?。！？]*/g) || [text]; let index = 0;
    setSpeaking(true);
    const next = () => {
      if (!mounted.current || token !== speechToken.current) return;
      if (index >= chunks.length) { setSpeaking(false); utteranceRef.current = null; clearTimeout(speechTimer.current); return; }
      const utterance = new SpeechSynthesisUtterance(chunks[index++]); utterance.lang = language; utterance.voice = matchedVoice; utterance.rate = 0.95;
      utterance.onend = next; utterance.onerror = event => { clearTimeout(speechTimer.current); if (mounted.current) { setSpeaking(false); if (!['canceled', 'interrupted'].includes(event.error)) setNote('Question audio could not play. Use Read question again or read the text.'); } };
      utteranceRef.current = utterance;
      try { window.speechSynthesis.speak(utterance); } catch { setSpeaking(false); setNote('Question audio could not start. Read the displayed question.'); }
    };
    speechTimer.current = setTimeout(() => { stopSpeaking(); if (mounted.current) setNote('Question audio timed out. Read the question or replay it.'); }, Math.min(120000, Math.max(30000, text.length * 100)));
    next(); return true;
  }, [language, matchedVoice, speechSupported, stopListening, stopSpeaking]);
  const startListening = useCallback(async () => {
    if (recognitionRef.current || listening || micBusy.current) return;
    setNote(''); stopSpeaking();
    if (!recognitionSupported) { setNote('Voice transcription is unavailable here. Type your answer; AI evaluation still works.'); return; }
    if (!window.isSecureContext) { setNote('Microphone access needs HTTPS or localhost. Type your answer for now.'); return; }
    const token = ++micToken.current; micBusy.current = true; setMicPending(true);
    if (cameraSupported) {
      try { const stream = await navigator.mediaDevices.getUserMedia({ audio: true }); stream.getTracks().forEach(track => track.stop()); }
      catch (e) { if (mounted.current && token === micToken.current) { micBusy.current = false; setMicPending(false); setNote(e.name === 'NotAllowedError' ? recognitionError['not-allowed'] : recognitionError['audio-capture']); } return; }
    }
    if (!mounted.current || token !== micToken.current) return;
    micBusy.current = false; setMicPending(false);
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    let recognition; try { recognition = new SpeechRecognition(); } catch { setNote('Speech recognition could not initialize. Type your answer instead.'); return; } recognitionRef.current = recognition;
    recognition.lang = language; recognition.continuous = true; recognition.interimResults = true; recognition.maxAlternatives = 1;
    const finalIds = new Set();
    recognition.onresult = event => {
      if (!mounted.current) return;
      const temporary = [];
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) { if (!finalIds.has(i)) { finalIds.add(i); transcriptRef.current(transcript); } }
        else temporary.push(transcript);
      }
      setInterim(temporary.join(' '));
    };
    recognition.onerror = event => { if (mounted.current && event.error !== 'aborted') setNote(recognitionError[event.error] || 'Voice capture stopped. Your transcript is kept; retry or type your answer.'); };
    recognition.onend = () => { recognitionRef.current = null; if (mounted.current) { setListening(false); setInterim(''); } };
    try { recognition.start(); setListening(true); setInterim(''); } catch { recognitionRef.current = null; setListening(false); setNote('Could not start the microphone. Retry or type your answer.'); }
  }, [cameraSupported, language, listening, recognitionSupported, stopSpeaking]);
  const startCamera = useCallback(async () => {
    if (streamRef.current || cameraPending) return;
    setNote('');
    if (!cameraSupported || !window.isSecureContext) { setNote('Camera preview needs a supported browser and HTTPS/localhost. Voice or typed interview remains available.'); return; }
    const token = ++cameraToken.current; setCameraPending(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }, audio: false });
      if (!mounted.current || token !== cameraToken.current) { stream.getTracks().forEach(track => track.stop()); return; }
      streamRef.current = stream; setCamera(true);
      if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play().catch(() => setNote('Click the camera preview to start playback.')); }
    } catch (e) { if (mounted.current) setNote(e.name === 'NotAllowedError' ? 'Camera permission denied. You can continue by voice or text.' : 'No available camera was found. You can continue by voice or text.'); }
    finally { if (mounted.current && token === cameraToken.current) setCameraPending(false); }
  }, [cameraPending, cameraSupported]);
  useEffect(() => { if (camera && videoRef.current && streamRef.current) { videoRef.current.srcObject = streamRef.current; videoRef.current.play().catch(() => {}); } }, [camera]);
  return { voices, matchedVoice, speechSupported, recognitionSupported, cameraSupported, micPending, listening, speaking, interim, note, camera, cameraPending, videoRef, speak, stopSpeaking, startListening, stopListening, startCamera, stopCamera };
}
