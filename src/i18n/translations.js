export const translations = {
  en: {
    appTitle: "HeatShield Chennai",
    subTitle: "Hyperlocal 500m Heat Risk Grid",
    demoBadge: "Demo Mode (Mock API)",
    liveBadge: "Live Backend API",
    
    tabs: {
      map: "Risk Map",
      routes: "Cool Routes",
      municipal: "Municipal Dashboard",
      sensors: "Live Sensors",
    },

    profiles: {
      vendor: "Street Vendor",
      laborer: "Construction Worker",
      elderly: "Elderly Person",
      child: "Child / Student",
      office: "Office Worker",
    },

    profileSubtext: {
      vendor: "High outdoor exposure (1.2x multiplier)",
      laborer: "Heavy physical labor (1.3x multiplier)",
      elderly: "Extreme heat vulnerability (1.4x multiplier)",
      child: "High metabolic sensitivity (1.3x multiplier)",
      office: "Indoor climate control (0.8x multiplier)",
    },

    bands: {
      green: "Low Risk",
      amber: "Moderate Risk",
      red: "High Risk",
    },

    mapScreen: {
      timeLabel: "Time of Day",
      inspectTitle: "Cell Details",
      heatIndex: "Heat Index",
      greenery: "Greenery Cover",
      builtDensity: "Built-up Density",
      unsafeWindow: "Unsafe Time Window",
      clickPrompt: "Click any grid cell on map to inspect risk details",
      legendTitle: "Heat Risk Band (0-100)",
      legendGreen: "0-39: Low Risk",
      legendAmber: "40-69: Moderate Risk",
      legendRed: "70-100: High Risk",
    },

    routes: {
      title: "Shaded Route Navigation",
      subtitle: "Compare fastest direct path vs heat-optimized shade path",
      origin: "Origin Point",
      destination: "Destination Point",
      calculate: "Calculate Coolest Route",
      fastest: "Fastest Route",
      coolest: "Coolest Route (Shaded)",
      minutes: "mins",
      heatExposure: "Avg Exposure Score",
      reduction: "Heat Exposure Saved",
      lessHeat: "less heat stress",
      presetLabel: "Quick Presets:",
    },

    municipal: {
      title: "Top 10 Vulnerable Grid Cells",
      subtitle: "Actionable priority zones requiring urgent municipal cooling interventions",
      cellId: "Cell ID",
      score: "Risk Score",
      vulnerability: "Vulnerable Population",
      suggestion: "Action Required",
      suggestWater: "Suggest Water Point",
      waterPointAdded: "Water Point Marker Placed!",
      placedCount: "Active Suggested Water Stations",
      viewOnMap: "Locate Cell",
    },

    sensors: {
      title: "Real-time Micro-climate Sensors",
      subtitle: "Auto-refreshing IoT sensor readings (5s interval)",
      temp: "Temperature",
      updated: "Last updated",
      spikeAlert: "HIGH HEAT SPIKE ALERT!",
      spikeDesc: "Sensor reading exceeded 40°C in cell",
      activeSensors: "Active Operational Nodes",
    },

    advice: {
      vendor: "Avoid direct sun exposure between 12:00 PM and 3:30 PM. Use damp cooling cloths and set up shade umbrella immediately.",
      laborer: "Mandatory 15-minute rest breaks every hour in shade. Hydrate with ORS/electrolytes before feeling thirsty.",
      elderly: "Remain indoors in ventilated or air-conditioned rooms. High humidity restricts sweat evaporation; monitor heart rate.",
      child: "Cancel outdoor activities during peak hours. Ensure hydration with fresh coconut water or oral rehydration solution.",
      office: "Heat stress is manageable during transit hours. Carry water bottle for short walks to metro or bus stops.",
    }
  },

  ta: {
    appTitle: "ஹீட்ஷீல்ட் சென்னை",
    subTitle: "500மீ நுண் பகுதி வெப்ப அபாய வரைபடம்",
    demoBadge: "டெமோ பயன்முறை (போலி தரவு)",
    liveBadge: "நேரலை சேவையகம்",

    tabs: {
      map: "அபாய வரைபடம்",
      routes: "குளிர்ந்த வழிகள்",
      municipal: "மாநகராட்சி டாஷ்போர்டு",
      sensors: "நேரடி சென்சார்கள்",
    },

    profiles: {
      vendor: "தெரு வியாபாரி",
      laborer: "கட்டுமானத் தொழிலாளி",
      elderly: "முதியவர்",
      child: "குழந்தை / மாணவர்",
      office: "அலுவலகப் பணியாளர்",
    },

    profileSubtext: {
      vendor: "அதிக வெளிப்படைத்தன்மை (1.2x)",
      laborer: "கடுமையான உடலுழைப்பு (1.3x)",
      elderly: "அதிக வெப்ப பாதிப்பு (1.4x)",
      child: "வெப்ப உணர்திறன் அதிகம் (1.3x)",
      office: "குளிரூட்டப்பட்ட அறை (0.8x)",
    },

    bands: {
      green: "குறைந்த அபாயம்",
      amber: "மிதமான அபாயம்",
      red: "அதிக அபாயம்",
    },

    mapScreen: {
      timeLabel: "நேரம்",
      inspectTitle: "பகுதி விவரங்கள்",
      heatIndex: "வெப்பக் குறியீடு",
      greenery: "பச்சை மரப்பரப்பு",
      builtDensity: "கட்டிட அடர்த்தி",
      unsafeWindow: "பாதுகாப்பற்ற நேரம்",
      clickPrompt: "விவரங்களை அறிய வரைபடத்தில் ஏதேனும் கட்டத்தைத் தொடுக",
      legendTitle: "வெப்ப அபாய அளவு (0-100)",
      legendGreen: "0-39: குறைந்த அபாயம்",
      legendAmber: "40-69: மிதமான அபாயம்",
      legendRed: "70-100: அதிக அபாயம்",
    },

    routes: {
      title: "நிழல் வழி வழிகாட்டி",
      subtitle: "வேகமான பாதை மற்றும் குளிர்ந்த நிழல் பாதையை ஒப்பிடுக",
      origin: "புறப்படும் இடம்",
      destination: "செல்லும் இடம்",
      calculate: "குளிர்ந்த பாதையைக் காண்க",
      fastest: "வேகமான பாதை",
      coolest: "குளிர்ந்த பாதை (நிழல்)",
      minutes: "நிமிடங்கள்",
      heatExposure: "சராசரி வெப்ப அளவு",
      reduction: "வெப்பக் குறைப்பு",
      lessHeat: "குறைந்த வெப்ப அழுத்தம்",
      presetLabel: "விரைவு இடங்கள்:",
    },

    municipal: {
      title: "மிகவும் பாதிக்கப்படக்கூடிய 10 பகுதிகள்",
      subtitle: "மாநகராட்சி அவசரக் கவனம் செலுத்த வேண்டிய முன்னுரிமை மண்டலங்கள்",
      cellId: "கட்ட எண்",
      score: "அபாய மதிப்பெண்",
      vulnerability: "பாதிக்கப்படும் மக்கள்",
      suggestion: "பரிந்துரைக்கப்பட்ட நடவடிக்கை",
      suggestWater: "நீர் பந்தல் பரிந்துரை",
      waterPointAdded: "நீர் பந்தல் அடையாளம் வைக்கப்பட்டது!",
      placedCount: "பரிந்துரைக்கப்பட்ட நீர் பந்தல்கள்",
      viewOnMap: "வரைபடத்தில் காண்க",
    },

    sensors: {
      title: "நேரடி நுண்-காலநிலை சென்சார்கள்",
      subtitle: "5 வினாடிகளுக்கு ஒருமுறை புதுப்பிக்கப்படும் சென்சார் அளவுகள்",
      temp: "வெப்பநிலை",
      updated: "கடைசியாக புதுப்பிக்கப்பட்டது",
      spikeAlert: "அவசர வெப்ப எச்சரிக்கை!",
      spikeDesc: "சென்சார் வெப்பநிலை 40°C ஐ தாண்டியுள்ளது",
      activeSensors: "இயங்கும் சென்சார்கள்",
    },

    advice: {
      vendor: "மதியம் 12:00 முதல் 3:30 மணி வரை நேரடி வெயிலைத் தவிர்க்கவும். ஈரமான துணியைப் பயன்படுத்தவும், நிழல் குடை அமைக்கவும்.",
      laborer: "ஒவ்வொரு மணி நேரமும் நிழலில் 15 நிமிடம் ஓய்வெடுக்கவும். தாகம் எடுப்பதற்கு முன்பே நீர் மற்றும் உப்புக்கரைசல் அருந்தவும்.",
      elderly: "காற்றோட்டமான அல்லது குளிரூட்டப்பட்ட அறைகளுக்குள்ளேயே இருக்கவும். அதிக ஈரப்பதம் வியர்வை ஆவியாவதைத் தடுக்கும்.",
      child: "வெப்பத்தின் உச்ச நேரத்தில் வெளிப்புற விளையாட்டுகளைத் தவிர்க்கவும். இளநீர் அல்லது ORS நீர் வழங்கவும்.",
      office: "பயண நேரங்களில் மட்டும் வெப்ப கவனம் தேவை. பஸ்/மெட்ரோ நிலையங்களுக்கு நடக்கும்போது தண்ணீர் பாட்டில் வைத்திருக்கவும்.",
    }
  }
};
