// src/components/VoiceModal.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, VolumeX, X, Sparkles, Navigation, MapPin, Droplets, CheckCircle, AlertCircle, Building2, Radio, Camera } from 'lucide-react';
import { translations } from '../i18n/translations';
import { 
  startVoiceRecognition, 
  parseVoiceCommand, 
  speakText, 
  stopSpeaking,
  setMuted,
  getMuted,
  isSpeechSupported 
} from '../services/voiceService';

export default function VoiceModal({
  isOpen,
  onClose,
  lang,
  setLang,
  isMuted,
  onToggleMute,
  onExecuteCommand
}) {
  const t = translations[lang] || translations.en;
  const tv = t.voice;

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [feedback, setFeedback] = useState('');
  const [isSpeakingResponse, setIsSpeakingResponse] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const recognizerRef = useRef(null);

  // Stop listening and speaking on modal close or unmount
  useEffect(() => {
    if (!isOpen) {
      if (recognizerRef.current) {
        try { recognizerRef.current.abort(); } catch (_) {}
      }
      setIsListening(false);
      stopSpeaking();
      setIsSpeakingResponse(false);
      setTranscript('');
      setFeedback('');
      setErrorMsg('');
    } else {
      // Automatically start listening when opened
      handleStartListening();
    }
  }, [isOpen]);

  const handleStartListening = () => {
    if (!isSpeechSupported()) {
      setErrorMsg(tv.unsupported);
      return;
    }

    setErrorMsg('');
    setTranscript('');
    setFeedback('');
    stopSpeaking();
    setIsSpeakingResponse(false);

    try {
      recognizerRef.current = startVoiceRecognition({
        lang,
        onStart: () => {
          setIsListening(true);
        },
        onResult: (text, isFinal) => {
          setTranscript(text);
          if (isFinal) {
            handleFinalTranscript(text);
          }
        },
        onError: (err) => {
          setIsListening(false);
          if (err === 'not-allowed') {
            setErrorMsg('Microphone access denied. Please allow microphone permission in your browser settings.');
          } else if (err !== 'no-speech') {
            setErrorMsg(`Voice recognition notice: ${err}`);
          }
        },
        onEnd: () => {
          setIsListening(false);
        }
      });
    } catch (err) {
      console.warn('Voice start error:', err);
      setIsListening(false);
    }
  };

  const handleStopListening = () => {
    if (recognizerRef.current) {
      try { recognizerRef.current.stop(); } catch (_) {}
    }
    setIsListening(false);
  };

  const handleFinalTranscript = (text) => {
    setIsListening(false);
    const parsed = parseVoiceCommand(text, lang);
    if (!parsed) return;

    setFeedback(parsed.message || parsed.speakText);

    // Speak AI Voice feedback aloud
    if (parsed.speakText) {
      setIsSpeakingResponse(true);
      speakText(parsed.speakText, lang, () => {
        setIsSpeakingResponse(false);
      });
    }

    // Dispatch action to main app
    if (onExecuteCommand) {
      onExecuteCommand(parsed);
    }

    // Auto close modal after successful execution
    if (parsed.type !== 'UNKNOWN') {
      setTimeout(() => {
        onClose && onClose();
      }, 3500);
    }
  };

  const handleSampleClick = (sampleQuery) => {
    setTranscript(sampleQuery);
    handleFinalTranscript(sampleQuery);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl p-5 sm:p-6 shadow-2xl max-w-md w-full text-slate-100 flex flex-col gap-4 relative overflow-hidden">
        
        {/* Ambient background glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-950 border border-emerald-600/50 text-emerald-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <span>{tv.buttonTitle}</span>
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-900/60 text-emerald-300 border border-emerald-700/50">
                  {lang === 'ta' ? 'தமிழ்' : 'English'}
                </span>
              </h2>
              <p className="text-[11px] text-slate-400 font-normal">{tv.speakPrompt}</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Quick Mute Toggle Button */}
            <button
              onClick={onToggleMute}
              className={`px-2.5 py-1 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                isMuted
                  ? 'bg-rose-950/80 border-rose-700 text-rose-300'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
              }`}
              title={isMuted ? "Click to Unmute Voice" : "Click to Mute Voice"}
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
              <span className="text-[11px]">{isMuted ? (lang === 'ta' ? 'அமைதி' : 'Muted') : (lang === 'ta' ? 'ஒலி' : 'Mute')}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Interactive Microphone Orb Area */}
        <div className="flex flex-col items-center justify-center py-4 gap-3">
          <div className="relative flex items-center justify-center">
            {/* Pulsing rings when listening */}
            {isListening && (
              <>
                <div className="absolute w-24 h-24 rounded-full bg-emerald-500/20 animate-ping"></div>
                <div className="absolute w-20 h-20 rounded-full bg-emerald-500/30 animate-pulse"></div>
              </>
            )}

            <button
              onClick={isListening ? handleStopListening : handleStartListening}
              className={`relative z-10 w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-all transform active:scale-95 ${
                isListening
                  ? 'bg-rose-600 hover:bg-rose-500 text-white ring-4 ring-rose-500/40'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white ring-4 ring-emerald-500/20 hover:ring-emerald-500/40'
              }`}
            >
              {isListening ? (
                <MicOff className="w-7 h-7" />
              ) : (
                <Mic className="w-7 h-7" />
              )}
            </button>
          </div>

          <span className="text-xs font-semibold tracking-wide text-slate-300 flex items-center gap-1.5">
            {isListening ? (
              <>
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                <span className="text-rose-400">{tv.listening}</span>
              </>
            ) : isSpeakingResponse ? (
              <>
                <Volume2 className="w-4 h-4 text-emerald-400 animate-bounce" />
                <span className="text-emerald-300">Speaking AI Response...</span>
              </>
            ) : (
              <span className="text-slate-400">Tap mic to speak</span>
            )}
          </span>
        </div>

        {/* Live Audio Transcript / Feedback Box */}
        {(transcript || feedback || errorMsg) && (
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex flex-col gap-2">
            {transcript && (
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] text-slate-500 font-semibold uppercase">{tv.recognized}</span>
                <p className="text-xs font-medium text-slate-200 italic">
                  "{transcript}"
                </p>
              </div>
            )}

            {feedback && (
              <div className="flex items-start gap-2 pt-1 border-t border-slate-900 text-xs text-emerald-400">
                <CheckCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-emerald-400" />
                <span className="font-medium text-emerald-300">{feedback}</span>
              </div>
            )}

            {errorMsg && (
              <div className="flex items-start gap-2 pt-1 border-t border-slate-900 text-xs text-rose-400">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-rose-400" />
                <span className="font-medium">{errorMsg}</span>
              </div>
            )}
          </div>
        )}

        {/* Sample Voice Prompts & Navigation Actions */}
        <div className="flex flex-col gap-2 pt-1">
          <span className="text-[11px] font-semibold text-slate-400">
            {tv.examplesTitle}
          </span>
          <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
            {tv.examples.map((ex, idx) => (
              <button
                key={idx}
                onClick={() => handleSampleClick(ex)}
                className="text-left text-[11px] px-2.5 py-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 transition-colors flex items-center gap-1.5 font-medium"
              >
                <Sparkles className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                <span>{ex}</span>
              </button>
            ))}

            {/* Quick Web Navigation Voice Prompts */}
            <button
              onClick={() => handleSampleClick(lang === 'ta' ? 'குளிர்ந்த வழிகள்' : 'Go to Cool Routes')}
              className="text-left text-[11px] px-2.5 py-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900 text-emerald-300 border border-emerald-800/60 transition-colors flex items-center gap-1.5 font-medium"
            >
              <Navigation className="w-3 h-3 text-emerald-400 flex-shrink-0" />
              <span>{lang === 'ta' ? '🧭 குளிர்ந்த வழிகள் செல்' : '🧭 Go to Cool Routes'}</span>
            </button>

            <button
              onClick={() => handleSampleClick(lang === 'ta' ? 'மாநகராட்சி டாஷ்போர்டு' : 'Go to Municipal Dashboard')}
              className="text-left text-[11px] px-2.5 py-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900 text-emerald-300 border border-emerald-800/60 transition-colors flex items-center gap-1.5 font-medium"
            >
              <Building2 className="w-3 h-3 text-emerald-400 flex-shrink-0" />
              <span>{lang === 'ta' ? '🏢 மாநகராட்சி செல்' : '🏢 Go to Municipal'}</span>
            </button>

            <button
              onClick={() => handleSampleClick(lang === 'ta' ? 'நேரடி சென்சார்கள்' : 'Go to Live Sensors')}
              className="text-left text-[11px] px-2.5 py-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900 text-emerald-300 border border-emerald-800/60 transition-colors flex items-center gap-1.5 font-medium"
            >
              <Radio className="w-3 h-3 text-emerald-400 flex-shrink-0" />
              <span>{lang === 'ta' ? '📡 நேரடி சென்சார்கள்' : '📡 Go to Sensors'}</span>
            </button>

            <button
              onClick={() => handleSampleClick(lang === 'ta' ? '360 ஸ்ட்ரீட் வியூ' : 'Open 360 Street View')}
              className="text-left text-[11px] px-2.5 py-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 transition-colors flex items-center gap-1.5 font-medium"
            >
              <Camera className="w-3 h-3 text-rose-400 flex-shrink-0" />
              <span>{lang === 'ta' ? '📷 360° பார்வை திற' : '📷 Open 360° Street View'}</span>
            </button>
          </div>
        </div>

        {/* Footer Language Toggle Switcher */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs text-slate-400">
          <span>Voice Language:</span>
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setLang('en')}
              className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors ${
                lang === 'en' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              English (en-IN)
            </button>
            <button
              onClick={() => setLang('ta')}
              className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors ${
                lang === 'ta' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              தமிழ் (ta-IN)
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
