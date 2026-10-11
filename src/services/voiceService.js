// src/services/voiceService.js
/**
 * HeatShield Chennai Voice Service
 * Provides Speech-to-Text (Voice Recognition) and Text-to-Speech (TTS Voice Readout)
 * with full bilingual support for Tamil (ta-IN) and Indian English (en-IN).
 */

export const KNOWN_LANDMARKS = [
  { name: 'T. Nagar Bus Stand', taName: 'தி. நகர் பேருந்து நிலையம்', coords: '13.0410,80.2335', keywords: ['t nagar', 't. nagar', 'tnagar', 't nagar bus', 'தி நகர்', 'டி நகர்', 'பனகல்'] },
  { name: 'Guindy Station', taName: 'கிண்டி ரயில் நிலையம்', coords: '13.0090,80.2120', keywords: ['guindy', 'guindy station', 'கிண்டி', 'கிண்டி நிலையம்'] },
  { name: 'Saidapet Metro', taName: 'சைதாப்பேட்டை மெட்ரோ', coords: '13.0245,80.2220', keywords: ['saidapet', 'saidapet metro', 'சைதாப்பேட்டை', 'சைதை'] },
  { name: 'Panagal Park', taName: 'பனகல் பூங்கா', coords: '13.0400,80.2290', keywords: ['panagal park', 'panagal', 'பனகல் பார்க்', 'பனகல் பூங்கா'] },
  { name: 'Anna University', taName: 'அண்ணா பல்கலைக்கழகம்', coords: '13.0110,80.2360', keywords: ['anna university', 'anna univ', 'அண்ணா பல்கலைக்கழகம்'] },
  { name: 'Marina Beach', taName: 'மெரினா கடற்கரை', coords: '13.0530,80.2820', keywords: ['marina beach', 'marina', 'beach', 'மெரினா', 'கடற்கரை'] },
  { name: 'Chennai Central', taName: 'சென்னை சென்ட்ரல்', coords: '13.0820,80.2750', keywords: ['central', 'chennai central', 'சென்ட்ரல்', 'சென்னை சென்ட்ரல்'] },
  { name: 'Koyambedu CMBT', taName: 'கோயம்பேடு பேருந்து நிலையம்', coords: '13.0690,80.1980', keywords: ['koyambedu', 'cmbt', 'கோயம்பேடு', 'கோயம்பேடு சந்தை'] },
  { name: 'Anna Nagar Tower', taName: 'அண்ணா நகர் கோபுரம்', coords: '13.0860,80.2140', keywords: ['anna nagar', 'tower park', 'அண்ணா நகர்'] },
  { name: 'Besant Nagar', taName: 'பெசன்ட் நகர் கடற்கரை', coords: '13.0000,80.2660', keywords: ['besant nagar', 'elliot', 'பெசன்ட் நகர்'] },
  { name: 'Mylapore Temple', taName: 'மயிலாப்பூர்', coords: '13.0330,80.2640', keywords: ['mylapore', 'kapaleeshwarar', 'மயிலாப்பூர்', 'கபாலீஸ்வரர்'] },
  { name: 'Egmore Station', taName: 'எழும்பூர் நிலையம்', coords: '13.0780,80.2610', keywords: ['egmore', 'museum', 'எழும்பூர்'] },
  { name: 'Vadapalani Murugan', taName: 'வடபழனி முருகன் கோவில்', coords: '13.0510,80.2120', keywords: ['vadapalani', 'வடபழனி'] }
];

// Initialize speech synthesis voices
let cachedVoices = [];
let _isMuted = false;

export function setMuted(muted) {
  _isMuted = Boolean(muted);
  if (_isMuted) {
    stopSpeaking();
  }
}

export function getMuted() {
  return _isMuted;
}

function loadVoices() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    cachedVoices = window.speechSynthesis.getVoices();
  }
}
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  loadVoices();
  window.speechSynthesis.onvoiceschanged = loadVoices;
}

/**
 * Text-to-Speech synthesizer
 */
export function speakText(text, lang = 'en', onEnd = null) {
  if (_isMuted) {
    onEnd && onEnd();
    return;
  }

  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    console.warn('Speech synthesis not supported');
    onEnd && onEnd();
    return;
  }

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  if (!text || text.trim() === '') {
    onEnd && onEnd();
    return;
  }

  const cleanText = text.replace(/[*#_~`]/g, ''); // strip markdown
  const utterance = new SpeechSynthesisUtterance(cleanText);

  // Pick voice
  const voices = cachedVoices.length ? cachedVoices : window.speechSynthesis.getVoices();
  let matchedVoice = null;

  if (lang === 'ta') {
    matchedVoice = voices.find(v => v.lang.startsWith('ta') || v.name.toLowerCase().includes('tamil'));
    utterance.lang = 'ta-IN';
  } else {
    matchedVoice = voices.find(v => v.lang === 'en-IN' || v.name.toLowerCase().includes('india')) ||
                   voices.find(v => v.lang.startsWith('en'));
    utterance.lang = 'en-IN';
  }

  if (matchedVoice) {
    utterance.voice = matchedVoice;
  }

  utterance.rate = 0.95;
  utterance.pitch = 1.0;

  if (onEnd) {
    utterance.onend = () => onEnd();
    utterance.onerror = () => onEnd();
  }

  window.speechSynthesis.speak(utterance);
}

export function stopSpeaking() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

export function isSpeechSupported() {
  if (typeof window === 'undefined') return false;
  return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
}

/**
 * Create a speech recognition listener instance
 */
export function startVoiceRecognition({ lang = 'en', onResult, onError, onEnd, onStart }) {
  if (!isSpeechSupported()) {
    onError && onError('Speech recognition is not supported in this browser. Please use Chrome or Edge.');
    return null;
  }

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new SpeechRecognition();

  recognition.continuous = false;
  recognition.interimResults = true;
  recognition.maxAlternatives = 1;
  recognition.lang = lang === 'ta' ? 'ta-IN' : 'en-IN';

  recognition.onstart = () => {
    onStart && onStart();
  };

  recognition.onresult = (event) => {
    let transcript = '';
    let isFinal = false;

    for (let i = event.resultIndex; i < event.results.length; ++i) {
      transcript += event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        isFinal = true;
      }
    }

    onResult && onResult(transcript.trim(), isFinal);
  };

  recognition.onerror = (event) => {
    console.error('Speech recognition error:', event.error);
    onError && onError(event.error);
  };

  recognition.onend = () => {
    onEnd && onEnd();
  };

  try {
    recognition.start();
  } catch (err) {
    console.warn('Recognition start exception:', err);
  }

  return recognition;
}

/**
 * Intelligent parser for Chennai voice queries in English and Tamil
 */
export function parseVoiceCommand(query, lang = 'en') {
  if (!query) return null;
  const text = query.toLowerCase();

  // 1. Check for landmark matches
  const matchedLandmark = KNOWN_LANDMARKS.find(lm => 
    lm.keywords.some(kw => text.includes(kw.toLowerCase()))
  );

  // 2. Mute / Unmute audio intent
  if (
    text.includes('mute') || 
    text.includes('quiet') || 
    text.includes('silent') || 
    text.includes('stop talking') || 
    text.includes('அமைதி') || 
    text.includes('சத்தம் வேண்டாம்')
  ) {
    setMuted(true);
    return {
      type: 'MUTE',
      muted: true,
      speakText: '',
      message: lang === 'ta' ? 'குரல் ஒலி அணைக்கப்பட்டது (Muted)' : 'Voice audio muted'
    };
  }

  if (
    text.includes('unmute') || 
    text.includes('sound on') || 
    text.includes('speak') || 
    text.includes('சத்தம் வேண்டும்') || 
    text.includes('பேசு')
  ) {
    setMuted(false);
    return {
      type: 'MUTE',
      muted: false,
      speakText: lang === 'ta' ? 'குரல் ஒலி இயக்கப்பட்டது' : 'Voice audio unmuted',
      message: lang === 'ta' ? 'குரல் ஒலி இயக்கப்பட்டது (Unmuted)' : 'Voice audio unmuted'
    };
  }

  // 3. Full Web Page / Tab Navigation intents
  if (
    text.includes('map') || 
    text.includes('risk map') || 
    text.includes('heat map') || 
    text.includes('வரைபடம்') || 
    text.includes('முகப்பு') || 
    text.includes('ஹோம்') || 
    text.includes('home')
  ) {
    return {
      type: 'NAV_TAB',
      tab: 'map',
      speakText: lang === 'ta' ? 'சென்னை வெப்ப அபாய வரைபடத்திற்குச் செல்கிறேன்.' : 'Navigating to Heat Risk Map.',
      message: lang === 'ta' ? 'அபாய வரைபடம்' : 'Heat Risk Map'
    };
  }

  if (
    text.includes('routes') || 
    text.includes('cool routes') || 
    text.includes('shade routes') || 
    text.includes('walk routes') || 
    text.includes('வழிகள்') || 
    text.includes('நிழல் வழிகள்')
  ) {
    return {
      type: 'NAV_TAB',
      tab: 'routes',
      speakText: lang === 'ta' ? 'குளிர்ந்த நிழல் வழித்தடப் பக்கத்திற்குச் செல்கிறேன்.' : 'Navigating to Cool Routes Navigation.',
      message: lang === 'ta' ? 'குளிர்ந்த வழிகள்' : 'Cool Routes Navigation'
    };
  }

  if (
    text.includes('municipal') || 
    text.includes('top sectors') || 
    text.includes('corporation') || 
    text.includes('மாநகராட்சி') || 
    text.includes('டாஷ்போர்டு')
  ) {
    return {
      type: 'NAV_TAB',
      tab: 'municipal',
      speakText: lang === 'ta' ? 'மாநகராட்சி அவசர நடவடிக்கை டாஷ்போர்டிற்குச் செல்கிறேன்.' : 'Navigating to Municipal Action Dashboard.',
      message: lang === 'ta' ? 'மாநகராட்சி டாஷ்போர்டு' : 'Municipal Dashboard'
    };
  }

  if (
    text.includes('sensor') || 
    text.includes('iot') || 
    text.includes('live climate') || 
    text.includes('சென்சார்') || 
    text.includes('நேரடி')
  ) {
    return {
      type: 'NAV_TAB',
      tab: 'sensors',
      speakText: lang === 'ta' ? 'நேரடி நுண்-காலநிலை சென்சார்கள் பக்கத்திற்குச் செல்கிறேன்.' : 'Navigating to Live Sensors Monitoring.',
      message: lang === 'ta' ? 'நேரடி சென்சார்கள்' : 'Live Sensors Monitoring'
    };
  }

  // 4. Street View 360 Inspection intent
  if (
    text.includes('street view') || 
    text.includes('streetview') || 
    text.includes('camera') || 
    text.includes('360') || 
    text.includes('ஸ்ட்ரீட் வியூ') || 
    text.includes('பார்வை')
  ) {
    return {
      type: 'OPEN_STREETVIEW',
      speakText: lang === 'ta' ? '360 டிகிரி தெருக் காட்சி ஆய்வைத் திறக்கிறேன்.' : 'Opening 360 degree Street View inspection.',
      message: lang === 'ta' ? '360° தெருக் காட்சி' : '360° Street View Inspection'
    };
  }

  // 5. Navigation / Route intent with Landmarks
  const isRouteQuery = 
    text.includes('route') || 
    text.includes('navigate') || 
    text.includes('walk') || 
    text.includes('coolest') || 
    text.includes('shade') || 
    text.includes('direction') || 
    text.includes('வழி') || 
    text.includes('பாதை') || 
    text.includes('செல்ல');

  if (isRouteQuery && matchedLandmark) {
    const origin = KNOWN_LANDMARKS[0]; // T Nagar
    const destination = matchedLandmark.coords === origin.coords ? KNOWN_LANDMARKS[1] : matchedLandmark;

    return {
      type: 'ROUTE',
      from: origin.coords,
      to: destination.coords,
      fromName: origin.name,
      toName: destination.name,
      speakText: lang === 'ta'
        ? `${destination.taName}-க்கு மிகக் குளிர்ந்த நிழல் பாதையைக் கணக்கிடுகிறேன்.`
        : `Calculating the coolest shaded route to ${destination.name}.`,
      message: lang === 'ta'
        ? `நிழல் பாதை: ${origin.taName} ➔ ${destination.taName}`
        : `Shaded route: ${origin.name} ➔ ${destination.name}`
    };
  }

  // 6. Inspect Heat Risk for Landmark intent
  const isHeatQuery = 
    text.includes('heat') || 
    text.includes('hot') || 
    text.includes('risk') || 
    text.includes('temperature') || 
    text.includes('score') || 
    text.includes('safe') || 
    text.includes('வெப்பம்') || 
    text.includes('சூடு') || 
    text.includes('அபாயம்') || 
    text.includes('நிலை');

  if ((isHeatQuery || !isRouteQuery) && matchedLandmark) {
    return {
      type: 'INSPECT_LANDMARK',
      landmark: matchedLandmark,
      speakText: lang === 'ta'
        ? `${matchedLandmark.taName} பகுதியின் வெப்ப அபாய விவரங்களைக் காண்பிக்கிறேன்.`
        : `Opening heat risk and safety advice for ${matchedLandmark.name}.`,
      message: lang === 'ta'
        ? `${matchedLandmark.taName} பகுதி தேர்ந்தெடுக்கப்பட்டது`
        : `Selected ${matchedLandmark.name}`
    };
  }

  // 7. Water point intent
  const isWaterQuery = 
    text.includes('water') || 
    text.includes('drink') || 
    text.includes('kiosk') || 
    text.includes('thirst') || 
    text.includes('தண்ணீர்') || 
    text.includes('குடிநீர்') || 
    text.includes('தாகம்');

  if (isWaterQuery) {
    return {
      type: 'SHOW_WATER',
      speakText: lang === 'ta'
        ? 'சென்னை முழுவதும் உள்ள 23 அரசு குடிநீர் பந்தல்கள் மற்றும் நிழல் மையங்களைக் காண்பிக்கிறேன்.'
        : 'Displaying 23 emergency water kiosks and cooling shelters across Chennai.',
      message: lang === 'ta'
        ? 'குடிநீர் பந்தல்கள் மற்றும் நிழல் மையங்கள்'
        : 'Emergency water kiosks & cooling shelters'
    };
  }

  // 8. Time of Day setting intent
  const timeMatch = text.match(/(\d{1,2})\s*(am|pm|மணி)/);
  if (timeMatch) {
    let hr = parseInt(timeMatch[1], 10);
    const meridiem = timeMatch[2];
    if (meridiem === 'pm' && hr < 12) hr += 12;
    if (meridiem === 'am' && hr === 12) hr = 0;
    if (hr >= 0 && hr <= 23) {
      return {
        type: 'SET_HOUR',
        hour: hr,
        speakText: lang === 'ta' ? `நேரம் ${hr}:00 மணிக்கு மாற்றப்பட்டது.` : `Time set to ${hr}:00 hours.`,
        message: `Time: ${hr}:00`
      };
    }
  }

  // 9. Demographic profile change intent
  if (text.includes('vendor') || text.includes('வியாபாரி')) {
    return { type: 'PROFILE', profile: 'vendor', speakText: lang === 'ta' ? 'தெரு வியாபாரிக்கு மாற்றப்பட்டது' : 'Profile switched to Street Vendor.' };
  }
  if (text.includes('labor') || text.includes('worker') || text.includes('construction') || text.includes('தொழிலாளி')) {
    return { type: 'PROFILE', profile: 'laborer', speakText: lang === 'ta' ? 'கட்டுமானத் தொழிலாளிக்கு மாற்றப்பட்டது' : 'Profile switched to Construction Laborer.' };
  }
  if (text.includes('elder') || text.includes('senior') || text.includes('முதியவர்')) {
    return { type: 'PROFILE', profile: 'elderly', speakText: lang === 'ta' ? 'முதியவருக்கு மாற்றப்பட்டது' : 'Profile switched to Elderly Person.' };
  }
  if (text.includes('child') || text.includes('student') || text.includes('குழந்தை')) {
    return { type: 'PROFILE', profile: 'child', speakText: lang === 'ta' ? 'குழந்தைகளுக்கு மாற்றப்பட்டது' : 'Profile switched to Child / Student.' };
  }
  if (text.includes('office') || text.includes('அலுவலகம்')) {
    return { type: 'PROFILE', profile: 'office', speakText: lang === 'ta' ? 'அலுவலகப் பணியாளருக்கு மாற்றப்பட்டது' : 'Profile switched to Office Worker.' };
  }

  // 10. Language change intent
  if (text.includes('tamil') || text.includes('தமிழ்')) {
    return { type: 'LANG', lang: 'ta', speakText: 'தமிழ் மொழிக்கு மாற்றப்பட்டது' };
  }
  if (text.includes('english') || text.includes('ஆங்கிலம்')) {
    return { type: 'LANG', lang: 'en', speakText: 'Switched to English.' };
  }

  // Fallback default
  return {
    type: 'UNKNOWN',
    transcript: query,
    speakText: lang === 'ta'
      ? `மன்னிக்கவும், "${query}" புரிந்துகொள்ள முடியவில்லை. டி நகர் அல்லது கிண்டி பற்றி கேளுங்கள்.`
      : `Sorry, I didn't recognize that command. Try asking about T. Nagar or Guindy.`,
    message: query
  };
}
