/* Aqua Cart - frontend logic (talks to the Flask + SQLite3 backend) */

let listings = [];
let currentUser = null;
let currentLang = 'en';
let pendingSafetyAfterLogin = false;

/* ---------------- i18n (static UI strings) ---------------- */
const languages = {
  en: {
    fishNotePlaceholder: "Note (optional)", noteLabel: "Note:",
    marketHeading: "Today's Market Price (per kg)", marketNote: "Set by Aqua Cart admin", marketHintLabel: "Market price", marketPriceLabel: "Market price", noMarketPrices: "No market prices added yet.",
    welcome: "Welcome to Aqua Cart", gotoLogin: "Sign In", gotoRegister: "Create New Account",
    loginHeading: "Account Login", lblLoginEmail: "Email ID", lblLoginPassword: "Password", loginBtn: "Sign In",
    safetyHeading: "🛡️ Safety Precautions",
    safetyDesc: "Please read and agree to our safety guidelines before proceeding:",
    safety1: "Never send advance money to sellers without inspecting the product.",
    safety2: "Verify the freshness and quality of the fish during pickup.",
    safety3: "Keep transactions safe and meet in reliable public locations.",
    safety4: "Do not share sensitive bank credentials or OTPs with anyone.",
    btnAccept: "Accept", btnDisaccept: "Disaccept", appTitle: "Aqua Cart",
    navHome: "Home", navSell: "Sell", navMyAds: "My Ads", navAccount: "Account",
    homeHeading: "Home - Fish Listings",
    homeInstruction: "* Click on any fish photo to see full details and seller info.",
    searchPlaceholder: "🔍 Search fish type or location...",
    backBtn: "← Back to Home", sellHeading: "Sell Your Fish", lblFishPhoto: "Fish Photo:",
    fishTypePlaceholder: "Type of Fish", fishTonsPlaceholder: "Tons", fishWeightPlaceholder: "Weight",
    fishPiecesPlaceholder: "Pieces (count)", fishPricePlaceholder: "Price per kg (₹)",
    fishAddressPlaceholder: "Pickup Address / Location", doneBtn: "Done", myAdsHeading: "My Ads",
    accountHeading: "My Account", profileHeading: "User Profile", lblUserName: "User Name",
    lblUserPhone: "Phone Number", saveProfileBtn: "Save Profile", logoutBtn: "Logout",
    privacyHeading: "🔒 Privacy & Security",
    privacySubtext: "View your saved account information including Username, Phone Number and Email.",
    privacyBtn: "Privacy", privacyPageHeading: "🔒 Privacy Details", privacyBackBtn: "← Back to Account",
    lblPrivName: "User Name", lblPrivPhone: "Phone Number", lblPrivEmail: "Email ID",
    supportHeading: "Help & Support", supportText: "Having issues with your listing? Get in touch with us:",
    lblEmail: "Email:", lblHelpline: "Helpline:", noListings: "No listings available yet.",
    noSearchResults: "No matching fish found.", noMyAds: "You haven't posted any ads yet.",
    soldBadge: "SOLD", placeOrderBtn: "Place Order", soldOptionBtn: "Sold", unsoldOptionBtn: "Unsold",
    deleteOptionBtn: "Delete", viewFullDetails: "View Full Details & Contact Info",
    fishInfoHeading: "Information", qtyTons: "Total Quantity Tons:", weightCalc: "Weight Calculation:",
    countPieces: "Count / Pieces:", pickupAddress: "Pickup Address:",
    sellerContactHeading: "📞 Seller Contact Information", customerName: "Customer Name:",
    alertFillFields: "Please fill all fields!", alertProfileSaved: "Profile Details Saved Successfully!",
    alertOrderPlaced: "Order placed successfully! Marked as Sold.",
    voiceIntro: "Welcome to Aqua Cart. Tap Sign In to log into your account, or tap Create New Account if you are new here.",
    voiceLoginHelp: "Enter your registered email address and password, then tap Sign In to log in.",
    voiceRegisterHelp: "Enter your name, phone number, email address, and a password of at least six characters, then tap Create Account.",
    voicePendingHelp: "Your account is waiting for admin approval. You will be able to sign in once an admin approves your account.",
    voiceSafetyHelp: "Please read the safety precautions. Never send advance money without inspecting the product, verify freshness during pickup, meet only in safe public places, and never share your bank details or O T Ps. Tap Accept to continue.",
    voiceHomeWelcome: "Welcome home. Browse fish listings here, or use the Sell tab to list your own fish.",
    langChanged: "Language changed to English.",
    voiceStartHeading: "Tap to Start Voice Mode",
    voiceStartDesc: "One tap to turn on the microphone — this is required by your browser. After this, you won't need to touch anything. Just speak, and Aqua Cart will follow what you say.",
    voiceStartBtn: "🎙️ Start Voice Mode",
    voiceStartSkip: "Continue with touch only"
  },
  te: {
    fishNotePlaceholder: "గమనిక (ఐచ్ఛికం)", noteLabel: "గమనిక:",
    marketHeading: "ఈ రోజు మార్కెట్ ధర (కిలోకు)", marketNote: "Aqua Cart అడ్మిన్ నిర్ణయించినది", marketHintLabel: "మార్కెట్ ధర", marketPriceLabel: "మార్కెట్ ధర", noMarketPrices: "ఇంకా మార్కెట్ ధరలు జోడించబడలేదు.",
    welcome: "ఆక్వా కార్ట్‌కు స్వాగతం", gotoLogin: "సైన్ ఇన్ చేయండి", gotoRegister: "కొత్త ఖాతా సృష్టించండి",
    loginHeading: "ఖాతా లాగిన్", lblLoginEmail: "ఈమెయిల్ ఐడి", lblLoginPassword: "పాస్‌వర్డ్", loginBtn: "సైన్ ఇన్ చేయండి",
    safetyHeading: "🛡️ భద్రతా ముందస్తు జాగ్రత్తలు",
    safetyDesc: "కొనసాగించే ముందు దయచేసి మా భద్రతా మార్గదర్శకాలను చదివి అంగీకరించండి:",
    safety1: "ఉత్పత్తిని పరిశీలించకుండా విక్రేతలకు ముందస్తు డబ్బు పంపవద్దు.",
    safety2: "పికప్ సమయంలో చేపల తాజాదనం మరియు నాణ్యతను తనిఖీ చేయండి.",
    safety3: "లావాదేవీలను సురక్షితంగా ఉంచండి మరియు విశ్వసనీయమైన పబ్లిక్ ప్రదేశాలలో కలవండి.",
    safety4: "మీ సున్నితమైన బ్యాంక్ వివరాలు లేదా OTPలను ఎవరితోనూ పంచుకోవద్దు.",
    btnAccept: "అంగీకరించు", btnDisaccept: "నిరాకరించు", appTitle: "ఆక్వా కార్ట్",
    navHome: "హోమ్", navSell: "అమ్మకం", navMyAds: "నా ప్రకటనలు", navAccount: "ఖాతా",
    homeHeading: "హోమ్ - చేపల జాబితాలు",
    homeInstruction: "* పూర్తి వివరాలు మరియు విక్రేత సమాచారాన్ని చూడటానికి ఏదైనా చేప ఫోటోపై క్లిక్ చేయండి.",
    searchPlaceholder: "🔍 చేప రకం లేదా స్థలాన్ని వెతకండి...",
    backBtn: "← తిరిగి హోమ్‌కి వెళ్ళండి", sellHeading: "మీ చేపలను అమ్మండి", lblFishPhoto: "చేప ఫోటో:",
    fishTypePlaceholder: "చేప రకం", fishTonsPlaceholder: "టన్నులు", fishWeightPlaceholder: "బరువు",
    fishPiecesPlaceholder: "ముక్కలు (సంఖ్య)", fishPricePlaceholder: "కిలో ధర (₹)",
    fishAddressPlaceholder: "పికప్ చిరునామా / లొకేషన్", doneBtn: "పూర్తయింది", myAdsHeading: "నా ప్రకటనలు",
    accountHeading: "నా ఖాతా", profileHeading: "యూజర్ ప్రొఫైల్", lblUserName: "యూజర్ పేరు",
    lblUserPhone: "ఫోన్ నంబర్", saveProfileBtn: "ప్రొఫైల్ సేవ్ చేయండి", logoutBtn: "లాగ్ అవుట్",
    privacyHeading: "🔒 గోప్యత & భద్రత",
    privacySubtext: "మీ యూజర్‌పేరు, ఫోన్ నంబర్ మరియు ఈమెయిల్‌తో సహా మీ సేవ్ చేసిన ఖాతా సమాచారాన్ని చూడండి.",
    privacyBtn: "గోప్యత", privacyPageHeading: "🔒 గోప్యతా వివరాలు", privacyBackBtn: "← తిరిగి ఖాతా పేజీకి వెళ్ళండి",
    lblPrivName: "యూజర్ పేరు", lblPrivPhone: "ఫోన్ నంబర్", lblPrivEmail: "ఈమెయిల్ ఐడి",
    supportHeading: "సహాయం & మద్దతు", supportText: "మీ జాబితాతో సమస్యలు ఉన్నాయా? మమ్మల్ని సంప్రదించండి:",
    lblEmail: "ఇమెయిల్:", lblHelpline: "హెల్ప్‌లైన్:", noListings: "ఇంకా ఎలాంటి జాబితాలు అందుబాటులో లేవు.",
    noSearchResults: "సరిపోలే చేపలు దొరకలేదు.", noMyAds: "మీరు ఇంకా ఎలాంటి ప్రకటనలు పోస్ట్ చేయలేదు.",
    soldBadge: "అమ్ముడైంది", placeOrderBtn: "ఆర్డర్ చేయండి", soldOptionBtn: "అమ్ముడైంది",
    unsoldOptionBtn: "అమ్ముడవ్వలేదు", deleteOptionBtn: "తొలగించు",
    viewFullDetails: "పూర్తి వివరాలు & సంప్రదింపు సమాచారాన్ని చూడండి", fishInfoHeading: "సమాచారం",
    qtyTons: "మొత్తం పరిమాణం టన్నులు:", weightCalc: "బరువు లెక్కింపు:", countPieces: "కౌంట్ / ముక్కలు:",
    pickupAddress: "పికప్ చిరునామా:", sellerContactHeading: "📞 విక్రేత సంప్రదింపు సమాచారం",
    customerName: "కస్టమర్ పేరు:", alertFillFields: "దయచేసి అన్ని ఫీల్డ్స్ పూరించండి!",
    alertProfileSaved: "ప్రొఫైల్ వివరాలు విజయవంతంగా సేవ్ చేయబడ్డాయి!",
    alertOrderPlaced: "ఆర్డర్ విజయవంతంగా చేయబడింది! అమ్ముడైనట్లు గుర్తించబడింది.",
    voiceIntro: "ఆక్వా కార్ట్‌కు స్వాగతం. మీ ఖాతాలోకి లాగిన్ కావడానికి సైన్ ఇన్ నొక్కండి, లేదా మీరు కొత్తవారైతే కొత్త ఖాతా సృష్టించండి నొక్కండి.",
    voiceLoginHelp: "మీ నమోదిత ఈమెయిల్ చిరునామా మరియు పాస్‌వర్డ్‌ను నమోదు చేసి, లాగిన్ కావడానికి సైన్ ఇన్ నొక్కండి.",
    voiceRegisterHelp: "మీ పేరు, ఫోన్ నంబర్, ఈమెయిల్ చిరునామా, మరియు కనీసం ఆరు అక్షరాల పాస్‌వర్డ్‌ను నమోదు చేసి, ఖాతా సృష్టించండి నొక్కండి.",
    voicePendingHelp: "మీ ఖాతా అడ్మిన్ ఆమోదం కోసం వేచి ఉంది. అడ్మిన్ మీ ఖాతాను ఆమోదించిన తర్వాత మీరు సైన్ ఇన్ చేయగలరు.",
    voiceSafetyHelp: "దయచేసి భద్రతా జాగ్రత్తలను చదవండి. ఉత్పత్తిని పరిశీలించకుండా ముందస్తు డబ్బు పంపవద్దు, పికప్ సమయంలో తాజాదనాన్ని తనిఖీ చేయండి, సురక్షితమైన బహిరంగ ప్రదేశాలలో మాత్రమే కలవండి, మరియు మీ బ్యాంక్ వివరాలు లేదా ఓటీపీలను ఎవరితోనూ పంచుకోవద్దు. కొనసాగించడానికి అంగీకరించు నొక్కండి.",
    voiceHomeWelcome: "హోమ్‌కు స్వాగతం. ఇక్కడ చేపల జాబితాలను బ్రౌజ్ చేయండి, లేదా మీ చేపలను జాబితా చేయడానికి అమ్మకం ట్యాబ్‌ను ఉపయోగించండి.",
    langChanged: "భాష తెలుగుకు మార్చబడింది.",
    voiceStartHeading: "వాయిస్ మోడ్ ప్రారంభించడానికి నొక్కండి",
    voiceStartDesc: "మైక్రోఫోన్ ఆన్ చేయడానికి ఒకసారి నొక్కండి — ఇది మీ బ్రౌజర్‌కు అవసరం. దీని తర్వాత మీరు దేనినీ తాకాల్సిన అవసరం లేదు. మీరు చెప్పేది ఆక్వా కార్ట్ అనుసరిస్తుంది.",
    voiceStartBtn: "🎙️ వాయిస్ మోడ్ ప్రారంభించండి",
    voiceStartSkip: "టచ్‌తో మాత్రమే కొనసాగించండి"
  },
  hi: {
    fishNotePlaceholder: "नोट (वैकल्पिक)", noteLabel: "नोट:",
    marketHeading: "आज का बाजार भाव (प्रति किलो)", marketNote: "Aqua Cart एडमिन द्वारा तय", marketHintLabel: "बाजार भाव", marketPriceLabel: "बाजार भाव", noMarketPrices: "अभी कोई बाजार भाव नहीं जोड़ा गया है।",
    welcome: "एक्वा कार्ट में आपका स्वागत है", gotoLogin: "साइन इन करें", gotoRegister: "नया खाता बनाएं",
    loginHeading: "खाता लॉगिन", lblLoginEmail: "ईमेल आईडी", lblLoginPassword: "पासवर्ड", loginBtn: "साइन इन करें",
    safetyHeading: "🛡️ सुरक्षा सावधानियां",
    safetyDesc: "कृपया आगे बढ़ने से पहले हमारे सुरक्षा दिशानिर्देशों को पढ़ें और सहमत हों:",
    safety1: "उत्पाद की जांच किए बिना विक्रेताओं को कभी भी अग्रिम धन न भेजें।",
    safety2: "पिकअप के दौरान मछली की ताजगी और गुणवत्ता की जांच करें।",
    safety3: "लेन-देन को सुरक्षित रखें और विश्वसनीय सार्वजनिक स्थानों पर मिलें।",
    safety4: "अपनी संवेदनशील बैंक जानकारी या ओटीपी किसी के साथ साझा न करें।",
    btnAccept: "स्वीकार करें", btnDisaccept: "अस्वीकार करें", appTitle: "एक्वा कार्ट",
    navHome: "होम", navSell: "बेचें", navMyAds: "मेरे विज्ञापन", navAccount: "खाता",
    homeHeading: "होम - मछली सूची",
    homeInstruction: "* पूरी जानकारी और विक्रेता विवरण देखने के लिए किसी भी मछली की तस्वीर पर क्लिक करें।",
    searchPlaceholder: "🔍 मछली का प्रकार या स्थान खोजें...",
    backBtn: "← होम पर वापस जाएं", sellHeading: "अपनी मछली बेचें", lblFishPhoto: "मछली की तस्वीर:",
    fishTypePlaceholder: "मछली का प्रकार", fishTonsPlaceholder: "टन", fishWeightPlaceholder: "वजन",
    fishPiecesPlaceholder: "टुकड़े (संख्या)", fishPricePlaceholder: "प्रति किलो मूल्य (₹)",
    fishAddressPlaceholder: "पिकअप पता / स्थान", doneBtn: "हो गया", myAdsHeading: "मेरे विज्ञापन",
    accountHeading: "मेरा खाता", profileHeading: "उपयोगकर्ता प्रोफ़ाइल", lblUserName: "उपयोगकर्ता नाम",
    lblUserPhone: "फोन नंबर", saveProfileBtn: "प्रोफ़ाइल सहेजें", logoutBtn: "लॉग आउट करें",
    privacyHeading: "🔒 गोपनीयता और सुरक्षा",
    privacySubtext: "उपयोगकर्ता नाम, फोन नंबर और ईमेल सहित अपनी सहेजी गई खाता जानकारी देखें।",
    privacyBtn: "गोपनीयता", privacyPageHeading: "🔒 गोपनीयता विवरण", privacyBackBtn: "← खाते पर वापस जाएं",
    lblPrivName: "उपयोगकर्ता नाम", lblPrivPhone: "फोन नंबर", lblPrivEmail: "ईमेल आईडी",
    supportHeading: "सहायता और समर्थन", supportText: "क्या आपकी सूची में कोई समस्या है? हमसे संपर्क करें:",
    lblEmail: "ईमेल:", lblHelpline: "हेल्पलाइन:", noListings: "अभी कोई सूची उपलब्ध नहीं है।",
    noSearchResults: "कोई मेल खाती मछली नहीं मिली।", noMyAds: "आपने अभी तक कोई विज्ञापन पोस्ट नहीं किया है।",
    soldBadge: "बिक गया", placeOrderBtn: "ऑर्डर दें", soldOptionBtn: "बिक गया", unsoldOptionBtn: "नहीं बिका",
    deleteOptionBtn: "हटाएं", viewFullDetails: "पूरा विवरण और संपर्क जानकारी देखें", fishInfoHeading: "जानकारी",
    qtyTons: "कुल मात्रा (टन):", weightCalc: "वजन की गणना:", countPieces: "गिनती / टुकड़े:",
    pickupAddress: "पिकअप पता:", sellerContactHeading: "📞 विक्रेता संपर्क जानकारी", customerName: "ग्राहक का नाम:",
    alertFillFields: "कृपया सभी फ़ील्ड भरें!", alertProfileSaved: "प्रोफ़ाइल विवरण सफलतापूर्वक सहेजा गया!",
    alertOrderPlaced: "ऑर्डर सफलतापूर्वक दिया गया! बिक गया के रूप में चिह्नित।",
    voiceIntro: "आक्वा कार्ट में आपका स्वागत है। अपने खाते में लॉगिन करने के लिए साइन इन दबाएँ, या यदि आप नए हैं तो नया खाता बनाएँ दबाएँ।",
    voiceLoginHelp: "लॉगिन करने के लिए अपना पंजीकृत ईमेल पता और पासवर्ड दर्ज करें, फिर साइन इन दबाएँ।",
    voiceRegisterHelp: "अपना नाम, फोन नंबर, ईमेल पता, और कम से कम छह अक्षरों का पासवर्ड दर्ज करें, फिर खाता बनाएं दबाएँ।",
    voicePendingHelp: "आपका खाता एडमिन की मंजूरी का इंतजार कर रहा है। एडमिन द्वारा आपके खाते को मंजूरी मिलने के बाद ही आप साइन इन कर सकेंगे।",
    voiceSafetyHelp: "कृपया सुरक्षा सावधानियां पढ़ें। उत्पाद की जांच किए बिना अग्रिम धन न भेजें, पिकअप के दौरान ताजगी जांचें, केवल सुरक्षित सार्वजनिक स्थानों पर मिलें, और अपनी बैंक जानकारी या ओटीपी किसी के साथ साझा न करें। जारी रखने के लिए स्वीकार करें दबाएँ।",
    voiceHomeWelcome: "होम में आपका स्वागत है। यहां मछली की सूची देखें, या अपनी मछली बेचने के लिए बेचें टैब का उपयोग करें।",
    langChanged: "भाषा हिंदी में बदल दी गई है।",
    voiceStartHeading: "वॉइस मोड शुरू करने के लिए टैप करें",
    voiceStartDesc: "माइक्रोफ़ोन चालू करने के लिए एक बार टैप करें — यह आपके ब्राउज़र के लिए आवश्यक है। इसके बाद आपको कुछ भी छूने की ज़रूरत नहीं होगी। आप जो बोलेंगे, एक्वा कार्ट वही करेगा।",
    voiceStartBtn: "🎙️ वॉइस मोड शुरू करें",
    voiceStartSkip: "सिर्फ़ टच से जारी रखें"
  }
};

/* ---------------- tiny API helper ---------------- */
async function api(url, opts = {}) {
  opts.headers = opts.headers || {};
  if (!(opts.body instanceof FormData) && opts.body) {
    opts.headers['Content-Type'] = 'application/json';
  }
  const res = await fetch(url, { credentials: 'same-origin', ...opts });
  let data = {};
  try { data = await res.json(); } catch (e) { /* no body */ }
  return { status: res.status, ok: res.ok, data };
}

function showMsg(id, text) {
  const el = document.getElementById(id);
  if (!el) return;
  if (!text) { el.style.display = 'none'; return; }
  el.innerText = text;
  el.style.display = 'block';
}

/* ---------------- voice guide (text-to-speech) ---------------- */
let voiceEnabled = (localStorage.getItem('aquaCartVoiceEnabled') !== 'false');
let currentOnboardingStep = 'stepChoice';
const speechLangCodes = { en: 'en-US', te: 'te-IN', hi: 'hi-IN' };

// The browser's list of installed voices loads asynchronously, and on some
// browsers (Chrome especially) it isn't ready the instant the page loads.
// We cache it and refresh whenever the browser tells us it changed.
let availableVoices = [];
function refreshVoiceList() {
  if ('speechSynthesis' in window) availableVoices = window.speechSynthesis.getVoices();
}
if ('speechSynthesis' in window) {
  refreshVoiceList();
  window.speechSynthesis.onvoiceschanged = refreshVoiceList;
}

// Name fragments used by the common female system/browser voices across
// Windows, macOS, Android and Chrome OS, so we can prefer a female voice
// when one is installed.
const FEMALE_VOICE_HINTS = [
  'female', 'woman', 'girl',
  'zira', 'samantha', 'susan', 'victoria', 'karen', 'moira', 'tessa', 'fiona', 'kate', 'aria',
  'veena', 'lekha', 'raveena', 'heera', 'kalpana', 'swara', 'divya', 'neerja'
];

function pickBestVoice(langCode) {
  if (!availableVoices.length) refreshVoiceList();
  if (!availableVoices.length) return null;

  const exact = availableVoices.filter(v => v.lang && v.lang.toLowerCase() === langCode.toLowerCase());
  const prefix = langCode.split('-')[0].toLowerCase();
  const partial = availableVoices.filter(v => v.lang && v.lang.toLowerCase().startsWith(prefix));
  const pool = exact.length ? exact : partial;
  if (!pool.length) return null;

  const female = pool.find(v => FEMALE_VOICE_HINTS.some(h => v.name.toLowerCase().includes(h)));
  return female || pool[0];
}

function speak(text) {
  if (!voiceEnabled || !text || !('speechSynthesis' in window)) return;
  try {
    window.speechSynthesis.cancel(); // stop any voice already talking
    const langCode = speechLangCodes[currentLang] || 'en-US';
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = langCode;

    const voice = pickBestVoice(langCode);
    if (voice) utter.voice = voice; // use a real Telugu/Hindi voice when the device has one installed

    utter.rate = 0.95;
    // A slightly higher pitch reads as lighter / more feminine even on a
    // generic fallback voice, on top of preferring an actual female voice above.
    utter.pitch = 1.15;

    // Calling speak() immediately after cancel() is silently swallowed by
    // some browsers (a known Chrome/Edge bug, more noticeable on non-English
    // utterances) - a short delay avoids that.
    setTimeout(() => {
      try { window.speechSynthesis.speak(utter); } catch (e) { /* ignore */ }
    }, 60);
  } catch (e) {
    // speech synthesis unsupported/blocked in this browser - fail silently
  }
}

function speakForStep(stepId) {
  // Only guide the user with voice while they're still on the onboarding screen
  const onboarding = document.getElementById('onboardingScreen');
  if (!onboarding || onboarding.style.display === 'none') return;
  const t = languages[currentLang];
  if (stepId === 'stepChoice') speak(t.voiceIntro);
  else if (stepId === 'stepLogin') speak(t.voiceLoginHelp);
  else if (stepId === 'stepRegister') speak(t.voiceRegisterHelp);
  else if (stepId === 'stepPending') speak(t.voicePendingHelp);
  else if (stepId === 'stepSafety') speak(t.voiceSafetyHelp);
}

function updateVoiceToggleIcon() {
  const btn = document.getElementById('voiceToggleBtn');
  if (!btn) return;
  btn.innerText = voiceEnabled ? '\u{1F50A}' : '\u{1F507}';
  btn.classList.toggle('muted', !voiceEnabled);
}

function toggleVoiceGuide() {
  voiceEnabled = !voiceEnabled;
  localStorage.setItem('aquaCartVoiceEnabled', voiceEnabled ? 'true' : 'false');
  updateVoiceToggleIcon();
  if (!voiceEnabled) {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  } else {
    speakForStep(currentOnboardingStep);
  }
}

/* ---------------- onboarding step control ---------------- */
function showStep(stepId) {
  ['stepChoice', 'stepRegister', 'stepPending', 'stepLogin', 'stepSafety'].forEach(id => {
    document.getElementById(id).style.display = (id === stepId) ? 'block' : 'none';
  });
  currentOnboardingStep = stepId;
  speakForStep(stepId);
}

async function doRegister() {
  showMsg('registerError', null); showMsg('registerSuccess', null);
  const name = document.getElementById('regName').value.trim();
  const phone = document.getElementById('regPhone').value.trim();
  const email = document.getElementById('regEmail').value.trim();
  const password = document.getElementById('regPassword').value;

  if (!name || !phone || !email || !password) {
    showMsg('registerError', languages[currentLang].alertFillFields);
    return;
  }

  const { ok, data } = await api('/api/register', { method: 'POST', body: JSON.stringify({ name, phone, email, password }) });
  if (!ok) { showMsg('registerError', data.error || 'Registration failed.'); return; }
  document.getElementById('regName').value = '';
  document.getElementById('regPhone').value = '';
  document.getElementById('regEmail').value = '';
  document.getElementById('regPassword').value = '';
  showStep('stepPending');
}

async function doLogin() {
  showMsg('loginError', null);
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  if (!email || !password) { showMsg('loginError', 'Please enter both Email ID and Password.'); return; }

  const { ok, data } = await api('/api/login', { method: 'POST', body: JSON.stringify({ email, password }) });
  if (!ok) { showMsg('loginError', data.error || 'Login failed.'); return; }

  currentUser = data.user;
  showStep('stepSafety');
}

async function acceptSafety() {
  document.getElementById('onboardingScreen').style.display = 'none';
  document.getElementById('mainApp').style.display = 'block';
  document.getElementById('userName').value = currentUser.name || '';
  document.getElementById('userPhone').value = currentUser.phone || '';
  await loadListings();
  showPage('home');
  speak(languages[currentLang].voiceHomeWelcome); // voice guide continues right up to the Home page
}

async function logout() {
  await api('/api/logout', { method: 'POST' });
  location.reload();
}

/* ---------------- language ---------------- */
function changeLanguageFromStart() {
  currentLang = document.getElementById('startLangSelect').value;
  document.getElementById('langSelect').value = currentLang;
  updateAppLanguage();
}
function changeLanguageFromAccount() {
  currentLang = document.getElementById('langSelect').value;
  document.getElementById('startLangSelect').value = currentLang;
  updateAppLanguage();
}

function updateAppLanguage() {
  const t = languages[currentLang];
  const set = (id, val) => { const el = document.getElementById(id); if (el) el.innerText = val; };
  set('txt_welcome', t.welcome); set('txt_gotoLogin', t.gotoLogin); set('txt_gotoRegister', t.gotoRegister);
  set('txt_loginHeading', t.loginHeading); set('lbl_loginEmail', t.lblLoginEmail); set('lbl_loginPassword', t.lblLoginPassword);
  set('txt_loginBtn', t.loginBtn);
  set('txt_safetyHeading', t.safetyHeading); set('txt_safetyDesc', t.safetyDesc);
  set('txt_safety1', t.safety1); set('txt_safety2', t.safety2); set('txt_safety3', t.safety3); set('txt_safety4', t.safety4);
  set('btn_accept', t.btnAccept); set('btn_disaccept', t.btnDisaccept);
  set('txt_appTitle', t.appTitle); set('nav_home', t.navHome); set('nav_sell', t.navSell);
  set('nav_myAds', t.navMyAds); set('nav_account', t.navAccount);
  set('txt_homeHeading', t.homeHeading); set('txt_homeInstruction', t.homeInstruction);
  const search = document.getElementById('searchInput'); if (search) search.placeholder = t.searchPlaceholder;
  set('txt_backBtn', t.backBtn); set('txt_sellHeading', t.sellHeading); set('lbl_fishPhoto', t.lblFishPhoto);
  set('lbl_fishType', t.fishTypePlaceholder); set('lbl_fishTons', t.fishTonsPlaceholder);
  set('lbl_fishWeight', t.fishWeightPlaceholder); set('lbl_fishPieces', t.fishPiecesPlaceholder);
  set('lbl_fishPrice', t.fishPricePlaceholder); set('lbl_fishAddress', t.fishAddressPlaceholder); set('lbl_fishNote', t.fishNotePlaceholder);
  set('txt_doneBtn', t.doneBtn); set('txt_myAdsHeading', t.myAdsHeading); set('txt_accountHeading', t.accountHeading);
  set('txt_profileHeading', t.profileHeading); set('lbl_userName', t.lblUserName); set('lbl_userPhone', t.lblUserPhone);
  set('txt_saveProfileBtn', t.saveProfileBtn); set('txt_logoutBtn', t.logoutBtn);
  set('txt_privacyHeading', t.privacyHeading); set('txt_privacySubtext', t.privacySubtext); set('txt_privacyBtn', t.privacyBtn);
  set('txt_privacyPageHeading', t.privacyPageHeading); set('txt_privacyBackBtn', t.privacyBackBtn);
  set('lbl_privName', t.lblPrivName); set('lbl_privPhone', t.lblPrivPhone); set('lbl_privEmail', t.lblPrivEmail);
  set('txt_supportHeading', t.supportHeading); set('txt_supportText', t.supportText);
  set('lbl_email', t.lblEmail); set('lbl_helpline', t.lblHelpline);
  set('txt_voiceStartHeading', t.voiceStartHeading); set('txt_voiceStartDesc', t.voiceStartDesc);
  set('txt_marketHeading', t.marketHeading); set('txt_marketNote', t.marketNote); set('txt_marketHintLabel', t.marketHintLabel);
  renderMarketPrices(); updateMarketHint();
  set('txt_voiceStartBtn', t.voiceStartBtn); set('txt_voiceStartSkip', t.voiceStartSkip);

  if (document.getElementById('home').style.display === 'block') filterListings();

  // Speak the language change out loud, in the newly selected language.
  // On the onboarding screens we keep the existing step-specific guidance;
  // anywhere else (e.g. changing language from the Account page) we speak
  // a short confirmation so the switch is always audible.
  const onboarding = document.getElementById('onboardingScreen');
  if (onboarding && onboarding.style.display !== 'none') {
    speakForStep(currentOnboardingStep);
  } else {
    speak(t.langChanged);
  }
}

/* ---------------- page navigation ---------------- */
function showPage(pageId) {
  document.querySelectorAll('.page').forEach(p => p.style.display = 'none');
  document.getElementById(pageId).style.display = 'block';
  document.querySelectorAll('nav button').forEach(b => b.classList.remove('active'));
  const navBtn = document.getElementById('nav_' + pageId);
  if (navBtn) navBtn.classList.add('active');

  if (pageId === 'home') { loadListings(); }
  else if (pageId === 'myAds') { loadMyListings(); }
}

/* ---------------- calculation helpers (client-side preview only) ---------------- */
function calculateWeightAndPrice() {
  const tons = parseFloat(document.getElementById('fishTons').value);
  const weightUnit = document.getElementById('fishWeightUnit').value;
  const pricePerKg = parseFloat(document.getElementById('fishPricePerKg').value);

  const weightBox = document.getElementById('weightCalcBox');
  const priceBox = document.getElementById('priceCalcBox');
  const calcWeightValue = document.getElementById('calcWeightValue');
  const calcPriceValue = document.getElementById('calcPriceValue');

  if (weightUnit === 'g') { weightBox.style.display = 'none'; priceBox.style.display = 'none'; return; }

  if (!isNaN(tons) && tons > 0) {
    const totalKg = tons * 1000;
    calcWeightValue.innerText = `${totalKg.toLocaleString()} kg`;
    weightBox.style.display = 'block';
    document.getElementById('fishWeight').value = totalKg;

    if (!isNaN(pricePerKg) && pricePerKg > 0) {
      const totalPrice = totalKg * pricePerKg;
      calcPriceValue.innerText = `₹${totalPrice.toLocaleString('en-IN')}`;
      priceBox.style.display = 'block';
    } else { priceBox.style.display = 'none'; }
  } else { weightBox.style.display = 'none'; priceBox.style.display = 'none'; }
}

/* ---------------- listings ---------------- */
async function loadListings() {
  await loadMarketPrices();
  const { ok, data } = await api('/api/listings');
  if (ok) { listings = data.listings; displayHomeListings(listings); }
}

/* ---------------- market prices (read-only here; admin edits them in /admin) ---------------- */
let marketPrices = [];

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

async function loadMarketPrices() {
  const { ok, data } = await api('/api/market-prices');
  if (ok) { marketPrices = data.prices; renderMarketPrices(); updateMarketHint(); }
}

function renderMarketPrices() {
  const box = document.getElementById('marketPriceList');
  if (!box) return;
  const t = languages[currentLang];
  if (!marketPrices.length) { box.innerHTML = `<p>${t.noMarketPrices}</p>`; return; }
  box.innerHTML = marketPrices.map(p => `
    <div class="market-item">
      <span>${escapeHtml(p.fishName)}</span>
      <b>₹${Number(p.pricePerKg).toLocaleString('en-IN')}</b>
    </div>`).join('');
}

// Finds the market price that matches what the seller typed (e.g. "rohu" or "Rohu fish").
function findMarketPrice(name) {
  const q = (name || '').toLowerCase().trim();
  if (!q) return null;
  return marketPrices.find(p => {
    const n = p.fishName.toLowerCase();
    return n === q || n.includes(q) || q.includes(n.split(' (')[0]);
  }) || null;
}

function updateMarketHint() {
  const box = document.getElementById('marketHintBox');
  const val = document.getElementById('marketHintValue');
  const input = document.getElementById('fishType');
  if (!box || !val || !input) return;
  const match = findMarketPrice(input.value);
  if (match) {
    val.innerText = `${match.fishName} ₹${Number(match.pricePerKg).toLocaleString('en-IN')}/kg`;
    box.style.display = 'block';
  } else { box.style.display = 'none'; }
}

function filterListings() {
  const query = document.getElementById('searchInput').value.toLowerCase().trim();
  if (!query) { displayHomeListings(listings); return; }
  const filtered = listings.filter(l =>
    (l.type && l.type.toLowerCase().includes(query)) ||
    (l.address && l.address.toLowerCase().includes(query))
  );
  displayHomeListings(filtered, true);
}

function displayHomeListings(itemsToDisplay = listings, isSearching = false) {
  const homeDiv = document.getElementById('homeListings');
  homeDiv.innerHTML = '';
  const t = languages[currentLang];

  if (itemsToDisplay.length === 0) {
    homeDiv.innerHTML = `<p>${isSearching ? t.noSearchResults : t.noListings}</p>`;
    return;
  }

  itemsToDisplay.forEach(l => {
    const div = document.createElement('div');
    div.className = 'listing glass-card';
    let statusHTML = l.status === 'Sold' ? `<div class="sold-badge">${t.soldBadge}</div>` : '';
    div.innerHTML = `
      ${statusHTML}
      <img src="${l.photo}" onclick="viewDetails(${l.id})">
      <p><strong>${t.fishTypePlaceholder}:</strong> ${l.type}</p>
      <p><strong>Total Price:</strong> ₹${Number(l.price).toLocaleString('en-IN')}</p>
      ${marketLine(l.type)}
      <p><small style="color:#fff; text-decoration:underline; cursor:pointer;" onclick="viewDetails(${l.id})">${t.viewFullDetails}</small></p>
    `;
    homeDiv.appendChild(div);
  });
}

function marketLine(fishType) {
  const m = findMarketPrice(fishType);
  if (!m) return '';
  return `<p><strong>${languages[currentLang].marketPriceLabel}:</strong> ₹${Number(m.pricePerKg).toLocaleString('en-IN')}/kg</p>`;
}

async function viewDetails(id) {
  const { ok, data } = await api(`/api/listings/${id}`);
  if (!ok) return;
  currentDetailsId = id;
  const item = data.listing;
  const t = languages[currentLang];
  const detailsDiv = document.getElementById('listingDetails');
  let statusHTML = item.status === 'Sold' ? `<div class="sold-badge">${t.soldBadge}</div><br>` : '';
  let placeOrderButtonHTML = item.status !== 'Sold'
    ? `<button class="btn-order" onclick="placeOrder(${item.id})">${t.placeOrderBtn}</button>`
    : `<button class="btn-order" style="background:#888; cursor:not-allowed;" disabled>${t.soldBadge}</button>`;

  detailsDiv.innerHTML = `
    <div class="details-container glass-card">
      ${statusHTML}
      <h2 style="margin-bottom:15px;">${item.type} ${t.fishInfoHeading}</h2>
      <img src="${item.photo}">
      <p><strong>${t.qtyTons}</strong> ${item.tons}</p>
      <p><strong>${t.weightCalc}</strong> ${item.weight} ${item.weightUnit}</p>
      <p><strong>${t.countPieces}</strong> ${item.pieces}</p>
      <p><strong>Price per Kg:</strong> ₹${item.pricePerKg ?? '-'}</p>
      ${marketLine(item.type)}
      <p><strong>Total Calculated Price:</strong> ₹${Number(item.price).toLocaleString('en-IN')}</p>
      <p><strong>${t.pickupAddress}</strong> ${item.address}</p>
      ${item.note ? `<p><strong>${t.noteLabel}</strong> ${escapeHtml(item.note)}</p>` : ''}
      <div class="contact-card">
        <h4 style="margin:0 0 10px 0;">${t.sellerContactHeading}</h4>
        <p style="margin:5px 0;"><strong>${t.customerName}</strong> ${item.sellerName}</p>
        <p style="margin:5px 0;"><strong>${languages[currentLang].lblUserPhone}:</strong> <a href="tel:${item.sellerPhone}">${item.sellerPhone}</a></p>
      </div>
      ${placeOrderButtonHTML}
    </div>
  `;
  showPage('detailsPage');
}

async function placeOrder(id) {
  const { ok, data } = await api(`/api/listings/${id}/order`, { method: 'POST' });
  // alert() blocks JavaScript until tapped, which would freeze hands-free
  // Voice Mode - so when voice guide audio is on, speak the result instead.
  if (!ok) {
    const msg = data.error || 'Could not place order.';
    if (voiceEnabled) speak(msg); else alert(msg);
    return;
  }
  const msg = languages[currentLang].alertOrderPlaced;
  if (voiceEnabled) speak(msg); else alert(msg);
  showPage('home');
}

async function addListing() {
  showMsg('sellError', null);
  const photo = document.getElementById('fishPhoto').files[0];
  const type = document.getElementById('fishType').value;
  const tons = document.getElementById('fishTons').value;
  const weight = document.getElementById('fishWeight').value;
  const weightUnit = document.getElementById('fishWeightUnit').value;
  const pieces = document.getElementById('fishPieces').value;
  const pricePerKg = document.getElementById('fishPricePerKg').value;
  const address = document.getElementById('fishAddress').value;
  const note = document.getElementById('fishNote').value.trim();

  if (!photo || !type || !tons || !weight || !pieces || !pricePerKg || !address) {
    showMsg('sellError', languages[currentLang].alertFillFields);
    return;
  }

  const formData = new FormData();
  formData.append('photo', photo);
  formData.append('type', type);
  formData.append('tons', tons);
  formData.append('weight', weight);
  formData.append('weightUnit', weightUnit);
  formData.append('pieces', pieces);
  formData.append('pricePerKg', pricePerKg);
  formData.append('address', address);
  formData.append('note', note);

  const { ok, data } = await api('/api/listings', { method: 'POST', body: formData });
  if (!ok) { showMsg('sellError', data.error || 'Could not create listing.'); return; }

  document.getElementById('fishPhoto').value = '';
  document.getElementById('fishType').value = '';
  document.getElementById('fishTons').value = '';
  document.getElementById('fishWeight').value = '';
  document.getElementById('fishWeightUnit').value = 'kg';
  document.getElementById('fishPieces').value = '';
  document.getElementById('fishPricePerKg').value = '';
  document.getElementById('fishAddress').value = '';
  document.getElementById('fishNote').value = '';
  document.getElementById('weightCalcBox').style.display = 'none';
  document.getElementById('priceCalcBox').style.display = 'none';

  showPage('home');
}

async function loadMyListings() {
  const { ok, data } = await api('/api/listings/mine');
  if (ok) displayMyListings(data.listings);
}

function displayMyListings(userListings) {
  const myListingsDiv = document.getElementById('myListings');
  myListingsDiv.innerHTML = '';
  const t = languages[currentLang];

  if (!userListings || userListings.length === 0) {
    myListingsDiv.innerHTML = `<p>${t.noMyAds}</p>`;
    return;
  }

  userListings.forEach(l => {
    const div = document.createElement('div');
    div.className = 'listing glass-card';
    let statusHTML = l.status === 'Sold' ? `<div class="sold-badge">${t.soldBadge}</div>` : '';
    let buyerHTML = '';
    if (l.buyerName && l.buyerPhone) {
      buyerHTML = `
        <div class="contact-card" style="margin-top:10px; border-left-color:#28a745;">
          <h4 style="margin:0 0 5px 0;">🛒 Buyer Information</h4>
          <p style="margin:3px 0;"><strong>Buyer Name:</strong> ${l.buyerName}</p>
          <p style="margin:3px 0;"><strong>Buyer Phone:</strong> <a href="tel:${l.buyerPhone}">${l.buyerPhone}</a></p>
        </div>`;
    }
    div.innerHTML = `
      ${statusHTML}
      <img src="${l.photo}" onclick="viewDetails(${l.id})">
      <p><strong>${t.fishTypePlaceholder}:</strong> ${l.type}</p>
      <p><strong>Total Price:</strong> ₹${Number(l.price).toLocaleString('en-IN')}</p>
      ${l.note ? `<p><strong>${t.noteLabel}</strong> ${escapeHtml(l.note)}</p>` : ''}
      ${buyerHTML}
      <div class="action-group">
        <button class="btn-action btn-sold" onclick="markAsSold(${l.id})">${t.soldOptionBtn}</button>
        <button class="btn-action btn-unsold" onclick="markAsUnsold(${l.id})">${t.unsoldOptionBtn}</button>
        <button class="btn-action btn-delete" onclick="deleteListing(${l.id})">${t.deleteOptionBtn}</button>
      </div>
    `;
    myListingsDiv.appendChild(div);
  });
}

async function markAsSold(id) { await api(`/api/listings/${id}/sold`, { method: 'POST' }); loadMyListings(); }
async function markAsUnsold(id) { await api(`/api/listings/${id}/unsold`, { method: 'POST' }); loadMyListings(); }
async function deleteListing(id) {
  if (!confirm('Delete this listing?')) return;
  await api(`/api/listings/${id}`, { method: 'DELETE' });
  loadMyListings();
}

/* ---------------- account / profile ---------------- */
async function saveProfile() {
  showMsg('profileSuccess', null);
  const name = document.getElementById('userName').value.trim();
  const phone = document.getElementById('userPhone').value.trim();
  const { ok, data } = await api('/api/profile', { method: 'PUT', body: JSON.stringify({ name, phone }) });
  if (!ok) { alert(data.error || 'Could not save profile.'); return; }
  currentUser = data.user;
  showMsg('profileSuccess', languages[currentLang].alertProfileSaved);
}

async function changePassword() {
  showMsg('pwdError', null); showMsg('pwdSuccess', null);
  const currentPassword = document.getElementById('currentPassword').value;
  const newPassword = document.getElementById('newPassword').value;
  const { ok, data } = await api('/api/profile/password', { method: 'PUT', body: JSON.stringify({ currentPassword, newPassword }) });
  if (!ok) { showMsg('pwdError', data.error || 'Could not update password.'); return; }
  document.getElementById('currentPassword').value = '';
  document.getElementById('newPassword').value = '';
  showMsg('pwdSuccess', data.message || 'Password updated.');
}

/* ================================================================
   VOICE COMBINED — speak the question, listen to the answer, and
   fill in the form automatically. One button drives the whole
   currently-open form (Register, Login, Sell, Profile, Search) by
   walking through its fields one at a time.
   ================================================================ */

const vcPrompts = {
  en: {
    vcName: "Please say your name.",
    vcPhone: "Please say your phone number.",
    vcEmail: "Please say your email address.",
    vcPassword: "Please say your password.",
    vcFishType: "Please say the type of fish.",
    vcFishTons: "Please say the quantity in tons.",
    vcFishWeightUnit: "Say kilograms, or grams, for the weight unit.",
    vcFishWeight: "Please say the weight.",
    vcFishPieces: "Please say the number of pieces.",
    vcFishPrice: "Please say the price per kilogram, in rupees.",
    vcFishAddress: "Please say the pickup address.",
    vcSearch: "Say the fish type or location you want to search for.",
    vcIntro: "Voice Combined is on. I will ask each question, just speak your answer after the beep.",
    vcDone: "Done.",
    vcNoForm: "There is nothing to fill in on this page yet. Open a form like Sell, Register, Login or Account first.",
    vcListening: "Listening...",
    vcSpeaking: "Speaking...",
    vcRetry: "Sorry, I did not catch that. Please try again.",
    vcSkipped: "Skipped that field.",
    vcStopped: "Voice Mode stopped. Tap the microphone button any time to start again.",
    vcNoMic: "Voice input needs microphone access. Please allow it and try again.",
    vcNotSupported: "Voice Combined is not supported in this browser. Please use Chrome.",
    vcWelcomeAuto: "Welcome to Aqua Cart. You do not need to touch any option. Just speak, and I will follow what you say.",
    vcChoicePrompt: "Say 'sign in' to log in, or say 'create account' to register.",
    vcSafetyPrompt: "Say 'accept' to agree and continue, or say 'disaccept' to go back.",
    vcPendingPrompt: "Your account is waiting for admin approval. Say 'sign in' when you are ready to try logging in.",
    vcHomePrompt: "Say 'sell' to list a fish, 'my ads' for your listings, 'account' for your profile, 'logout' to sign out, or say a fish name to search.",
    vcMyAdsPrompt: "Say 'home', 'sell', 'account', or 'logout'. You can tap Sold, Unsold or Delete on any listing.",
    vcAccountPrompt: "Say 'edit' to update your name or phone, 'privacy' to view your details, 'logout' to sign out, or 'home' to go back.",
    vcPrivacyPrompt: "Say 'back' to return to your account, or 'stop' to end voice mode.",
    vcDetailsPrompt: "Say 'order' to place an order for this fish, or 'back' to go home.",
    vcSubmitting: "Submitting now.",
    vcSellPhotoPrompt: "Please tap once to choose the fish photo from your gallery. Then say 'done'.",
    vcNotUnderstoodCommand: "Sorry, I did not understand that. Please say it again."
  },
  te: {
    vcName: "దయచేసి మీ పేరు చెప్పండి.",
    vcPhone: "దయచేసి మీ ఫోన్ నంబర్ చెప్పండి.",
    vcEmail: "దయచేసి మీ ఈమెయిల్ చిరునామా చెప్పండి.",
    vcPassword: "దయచేసి మీ పాస్‌వర్డ్ చెప్పండి.",
    vcFishType: "దయచేసి చేప రకం చెప్పండి.",
    vcFishTons: "దయచేసి టన్నుల పరిమాణం చెప్పండి.",
    vcFishWeightUnit: "బరువు యూనిట్ కోసం కిలోగ్రాములు లేదా గ్రాములు అని చెప్పండి.",
    vcFishWeight: "దయచేసి బరువు చెప్పండి.",
    vcFishPieces: "దయచేసి ముక్కల సంఖ్య చెప్పండి.",
    vcFishPrice: "దయచేసి కిలోకు ధర రూపాయల్లో చెప్పండి.",
    vcFishAddress: "దయచేసి పికప్ చిరునామా చెప్పండి.",
    vcSearch: "మీరు వెతకాలనుకుంటున్న చేప రకం లేదా స్థలం చెప్పండి.",
    vcIntro: "వాయిస్ కంబైన్డ్ ఆన్ అయింది. నేను ప్రతి ప్రశ్న అడుగుతాను, బీప్ తర్వాత మీ సమాధానం చెప్పండి.",
    vcDone: "పూర్తయింది.",
    vcNoForm: "ఈ పేజీలో నింపడానికి ఏమీ లేదు. ముందుగా అమ్మకం, నమోదు, సైన్ ఇన్ లేదా ఖాతా వంటి ఫారమ్‌ను తెరవండి.",
    vcListening: "వింటోంది...",
    vcSpeaking: "మాట్లాడుతోంది...",
    vcRetry: "క్షమించండి, అది నాకు వినిపించలేదు. దయచేసి మళ్లీ ప్రయత్నించండి.",
    vcSkipped: "ఆ ఫీల్డ్ దాటవేయబడింది.",
    vcStopped: "వాయిస్ మోడ్ ఆగిపోయింది. మళ్లీ ప్రారంభించడానికి ఎప్పుడైనా మైక్ బటన్ నొక్కండి.",
    vcNoMic: "వాయిస్ ఇన్‌పుట్‌కు మైక్రోఫోన్ యాక్సెస్ అవసరం. దయచేసి అనుమతించి మళ్లీ ప్రయత్నించండి.",
    vcNotSupported: "ఈ బ్రౌజర్‌లో వాయిస్ కంబైన్డ్ మద్దతు లేదు. దయచేసి క్రోమ్ ఉపయోగించండి.",
    vcWelcomeAuto: "ఆక్వా కార్ట్‌కు స్వాగతం. మీరు ఏ ఆప్షన్‌ను తాకాల్సిన అవసరం లేదు. మీరు చెప్పేది నేను వింటాను, దాని ప్రకారం చేస్తాను.",
    vcChoicePrompt: "లాగిన్ కావడానికి 'సైన్ ఇన్' అని చెప్పండి, లేదా నమోదు చేయడానికి 'క్రియేట్ అకౌంట్' అని చెప్పండి.",
    vcSafetyPrompt: "అంగీకరించి కొనసాగించడానికి 'అంగీకరించు' అని చెప్పండి, లేదా వెనక్కి వెళ్ళడానికి 'నిరాకరించు' అని చెప్పండి.",
    vcPendingPrompt: "మీ ఖాతా అడ్మిన్ ఆమోదం కోసం వేచి ఉంది. సిద్ధమైనప్పుడు లాగిన్ ప్రయత్నించడానికి 'సైన్ ఇన్' అని చెప్పండి.",
    vcHomePrompt: "చేప అమ్మడానికి 'సెల్', మీ ప్రకటనల కోసం 'మై యాడ్స్', మీ ప్రొఫైల్ కోసం 'అకౌంట్', సైన్ అవుట్ కావడానికి 'లాగౌట్' అని చెప్పండి, లేదా వెతకడానికి చేప పేరు చెప్పండి.",
    vcMyAdsPrompt: "'హోమ్', 'సెల్', 'అకౌంట్', లేదా 'లాగౌట్' అని చెప్పండి. ఏదైనా ప్రకటనపై సోల్డ్, అన్‌సోల్డ్ లేదా డిలీట్ నొక్కవచ్చు.",
    vcAccountPrompt: "మీ పేరు లేదా ఫోన్ నంబర్ మార్చడానికి 'ఎడిట్', మీ వివరాలు చూడటానికి 'ప్రైవసీ', సైన్ అవుట్ కావడానికి 'లాగౌట్', లేదా వెనక్కి వెళ్ళడానికి 'హోమ్' అని చెప్పండి.",
    vcPrivacyPrompt: "ఖాతాకు తిరిగి వెళ్ళడానికి 'బ్యాక్' అని చెప్పండి, లేదా వాయిస్ మోడ్ ఆపడానికి 'స్టాప్' అని చెప్పండి.",
    vcDetailsPrompt: "ఈ చేపను ఆర్డర్ చేయడానికి 'ఆర్డర్' అని చెప్పండి, లేదా హోమ్‌కు వెళ్ళడానికి 'బ్యాక్' అని చెప్పండి.",
    vcSubmitting: "ఇప్పుడు సమర్పిస్తున్నాను.",
    vcSellPhotoPrompt: "దయచేసి చేప ఫోటోను గ్యాలరీ నుండి ఎంచుకోవడానికి ఒకసారి తాకండి. తర్వాత 'డన్' అని చెప్పండి.",
    vcNotUnderstoodCommand: "క్షమించండి, అది అర్థం కాలేదు. దయచేసి మళ్లీ చెప్పండి."
  },
  hi: {
    vcName: "कृपया अपना नाम बोलें.",
    vcPhone: "कृपया अपना फोन नंबर बोलें.",
    vcEmail: "कृपया अपना ईमेल पता बोलें.",
    vcPassword: "कृपया अपना पासवर्ड बोलें.",
    vcFishType: "कृपया मछली का प्रकार बोलें.",
    vcFishTons: "कृपया टन में मात्रा बोलें.",
    vcFishWeightUnit: "वजन की इकाई के लिए किलोग्राम या ग्राम बोलें.",
    vcFishWeight: "कृपया वजन बोलें.",
    vcFishPieces: "कृपया टुकड़ों की संख्या बोलें.",
    vcFishPrice: "कृपया प्रति किलो कीमत रुपयों में बोलें.",
    vcFishAddress: "कृपया पिकअप पता बोलें.",
    vcSearch: "आप जो मछली का प्रकार या स्थान खोजना चाहते हैं वह बोलें.",
    vcIntro: "वॉइस कॉम्बाइंड चालू है। मैं हर सवाल पूछूंगा, बीप के बाद अपना जवाब बोलें.",
    vcDone: "हो गया.",
    vcNoForm: "इस पेज पर भरने के लिए अभी कुछ नहीं है। पहले बेचें, पंजीकरण, साइन इन या खाता जैसा फ़ॉर्म खोलें.",
    vcListening: "सुन रहा हूँ...",
    vcSpeaking: "बोल रहा हूँ...",
    vcRetry: "माफ़ कीजिए, वह समझ नहीं आया। कृपया दोबारा कोशिश करें.",
    vcSkipped: "वह फ़ील्ड छोड़ दिया गया.",
    vcStopped: "वॉइस मोड बंद हो गया। फिर से शुरू करने के लिए कभी भी माइक बटन दबाएँ.",
    vcNoMic: "वॉइस इनपुट के लिए माइक्रोफ़ोन की अनुमति चाहिए। कृपया अनुमति दें और फिर कोशिश करें.",
    vcNotSupported: "इस ब्राउज़र में वॉइस कॉम्बाइंड समर्थित नहीं है। कृपया क्रोम का उपयोग करें.",
    vcWelcomeAuto: "एक्वा कार्ट में आपका स्वागत है। आपको किसी भी विकल्प को छूने की ज़रूरत नहीं है। आप जो कहेंगे, मैं वही करूँगा.",
    vcChoicePrompt: "लॉगिन करने के लिए 'साइन इन' बोलें, या पंजीकरण के लिए 'क्रिएट अकाउंट' बोलें.",
    vcSafetyPrompt: "सहमत होकर आगे बढ़ने के लिए 'स्वीकार' बोलें, या वापस जाने के लिए 'अस्वीकार' बोलें.",
    vcPendingPrompt: "आपका खाता एडमिन की मंजूरी का इंतजार कर रहा है। तैयार होने पर लॉगिन के लिए 'साइन इन' बोलें.",
    vcHomePrompt: "मछली बेचने के लिए 'सेल', अपने विज्ञापनों के लिए 'माय एड्स', प्रोफ़ाइल के लिए 'अकाउंट', साइन आउट के लिए 'लॉगआउट' बोलें, या खोजने के लिए मछली का नाम बोलें.",
    vcMyAdsPrompt: "'होम', 'सेल', 'अकाउंट', या 'लॉगआउट' बोलें। किसी भी विज्ञापन पर सोल्ड, अनसोल्ड या डिलीट टैप कर सकते हैं.",
    vcAccountPrompt: "नाम या फोन नंबर बदलने के लिए 'एडिट', अपनी जानकारी देखने के लिए 'प्राइवेसी', साइन आउट के लिए 'लॉगआउट', या वापस जाने के लिए 'होम' बोलें.",
    vcPrivacyPrompt: "खाते पर वापस जाने के लिए 'बैक' बोलें, या वॉइस मोड बंद करने के लिए 'स्टॉप' बोलें.",
    vcDetailsPrompt: "इस मछली का ऑर्डर देने के लिए 'ऑर्डर' बोलें, या होम जाने के लिए 'बैक' बोलें.",
    vcSubmitting: "अभी सबमिट कर रहा हूँ.",
    vcSellPhotoPrompt: "कृपया गैलरी से मछली की तस्वीर चुनने के लिए एक बार टैप करें। फिर 'हो गया' बोलें.",
    vcNotUnderstoodCommand: "माफ़ कीजिए, यह समझ नहीं आया। कृपया दोबारा बोलें."
  }
};

// Spoken navigation / choice commands, in all 3 interface languages. English
// words are always accepted as a fallback too (people often say English
// keywords like "sell" or "logout" even while using Telugu/Hindi voices).
const vcCommandWords = {
  signIn: { en: ['sign in', 'signin', 'log in', 'login'], te: ['సైన్ ఇన్', 'సైన్', 'లాగిన్'], hi: ['साइन इन', 'लॉगिन'] },
  createAccount: { en: ['create account', 'create new account', 'new account', 'register', 'sign up'], te: ['క్రియేట్ అకౌంట్', 'ఖాతా సృష్టించండి', 'రిజిస్టర్'], hi: ['क्रिएट अकाउंट', 'खाता बनाएं', 'रजिस्टर'] },
  accept: { en: ['accept', 'agree'], te: ['అంగీకరించు', 'ఒప్పుకుంటున్నాను'], hi: ['स्वीकार'] },
  disaccept: { en: ['disaccept', 'disagree', 'reject'], te: ['నిరాకరించు'], hi: ['अस्वीकार'] },
  home: { en: ['home'], te: ['హోమ్'], hi: ['होम'] },
  sell: { en: ['sell'], te: ['సెల్', 'అమ్మకం'], hi: ['सेल', 'बेचें'] },
  myAds: { en: ['my ads', 'myads', 'ads'], te: ['మై యాడ్స్', 'నా ప్రకటనలు'], hi: ['माय एड्स', 'मेरे विज्ञापन'] },
  account: { en: ['account'], te: ['అకౌంట్', 'ఖాతా'], hi: ['अकाउंट', 'खाता'] },
  logout: { en: ['logout', 'log out', 'sign out'], te: ['లాగౌట్', 'లాగ్ అవుట్'], hi: ['लॉगआउट', 'लॉग आउट'] },
  edit: { en: ['edit', 'update', 'change'], te: ['ఎడిట్', 'మార్చు'], hi: ['एडिट', 'बदलें'] },
  privacy: { en: ['privacy'], te: ['ప్రైవసీ', 'గోప్యత'], hi: ['प्राइवेसी', 'गोपनीयता'] },
  back: { en: ['back'], te: ['బ్యాక్', 'వెనుకకు'], hi: ['बैक', 'वापस'] },
  order: { en: ['order', 'place order'], te: ['ఆర్డర్'], hi: ['ऑर्डर'] },
  stop: { en: ['stop', 'pause', 'cancel voice'], te: ['స్టాప్', 'ఆపు'], hi: ['स्टॉप', 'रोकें'] },
  done: { en: ['done', 'finished', 'ok', 'okay'], te: ['డన్', 'పూర్తయింది'], hi: ['हो गया', 'डन'] }
};

// Matches a spoken phrase against a set of command keys, checking the
// current language's words first and always falling back to English.
function vcMatchCommand(raw, keys) {
  const lower = raw.toLowerCase();
  for (const key of keys) {
    const def = vcCommandWords[key];
    if (!def) continue;
    const words = (def[currentLang] || []).concat(def.en || []);
    if (words.some(w => lower.includes(w.toLowerCase()))) return key;
  }
  return null;
}

// One flow per fillable screen. `type` controls how the spoken answer is
// cleaned up before it's put into the field, and `after` (optional) is the
// name of an existing function to re-run once the field is set (so price /
// weight calculations and the search filter stay in sync). `type: 'manual'`
// is for the one field voice cannot fill in (choosing a photo file) - it
// asks for a single tap instead of dictation, then waits for a spoken "done".
const vcFlows = {
  register: [
    { id: 'regName', type: 'text', prompt: 'vcName' },
    { id: 'regPhone', type: 'number', prompt: 'vcPhone' },
    { id: 'regEmail', type: 'email', prompt: 'vcEmail' },
    { id: 'regPassword', type: 'password', prompt: 'vcPassword' }
  ],
  login: [
    { id: 'loginEmail', type: 'email', prompt: 'vcEmail' },
    { id: 'loginPassword', type: 'password', prompt: 'vcPassword' }
  ],
  sell: [
    { id: 'fishPhoto', type: 'manual', prompt: 'vcSellPhotoPrompt', validate: () => document.getElementById('fishPhoto').files.length > 0 },
    { id: 'fishType', type: 'text', prompt: 'vcFishType' },
    { id: 'fishTons', type: 'number', prompt: 'vcFishTons', after: 'calculateWeightAndPrice' },
    { id: 'fishWeightUnit', type: 'choice', prompt: 'vcFishWeightUnit', choices: { kg: ['kg', 'kilo', 'kilogram', 'kilograms'], g: ['g', 'gram', 'grams'] }, after: 'calculateWeightAndPrice' },
    { id: 'fishWeight', type: 'number', prompt: 'vcFishWeight',
      skip: () => parseFloat(document.getElementById('fishTons').value) > 0 && document.getElementById('fishWeightUnit').value === 'kg' },
    { id: 'fishPieces', type: 'number', prompt: 'vcFishPieces' },
    { id: 'fishPricePerKg', type: 'number', prompt: 'vcFishPrice', after: 'calculateWeightAndPrice' },
    { id: 'fishAddress', type: 'text', prompt: 'vcFishAddress' }
  ],
  profile: [
    { id: 'userName', type: 'text', prompt: 'vcName' },
    { id: 'userPhone', type: 'number', prompt: 'vcPhone' }
  ],
  search: [
    { id: 'searchInput', type: 'text', prompt: 'vcSearch', after: 'filterListings' }
  ]
};

let vcActive = false;        // a recognition/speech cycle is currently running
let vcAutoMode = false;      // continuous hands-free mode is on (loops by itself)
let vcRecognition = null;
let vcFlowFields = [];
let vcStepIndex = 0;
let vcRetryCount = 0;
let vcCommandRetryCount = 0;
let vcCurrentFlowContext = null;
let vcFieldFlowOnComplete = null;
let vcAccountVisited = false;  // avoids re-asking name/phone every time Account is opened
let currentDetailsId = null;   // last fish listing opened, so "order" can be said by voice

function vcText(key) {
  return (vcPrompts[currentLang] && vcPrompts[currentLang][key]) || vcPrompts.en[key];
}

// Works out which screen is on view right now, so the assistant knows
// whether to fill fields or offer navigation commands next.
function detectVoiceContext() {
  const onboarding = document.getElementById('onboardingScreen');
  if (onboarding && onboarding.style.display !== 'none') {
    if (document.getElementById('stepRegister').style.display !== 'none') return 'register';
    if (document.getElementById('stepLogin').style.display !== 'none') return 'login';
    if (document.getElementById('stepSafety').style.display !== 'none') return 'safety';
    if (document.getElementById('stepPending').style.display !== 'none') return 'pending';
    if (document.getElementById('stepChoice').style.display !== 'none') return 'welcomeChoice';
    return null;
  }
  const byId = (id) => document.getElementById(id);
  if (byId('sell') && byId('sell').style.display !== 'none') return 'sell';
  if (byId('privacyPage') && byId('privacyPage').style.display !== 'none') return 'privacyPage';
  if (byId('account') && byId('account').style.display !== 'none') return 'profile';
  if (byId('myAds') && byId('myAds').style.display !== 'none') return 'myAds';
  if (byId('detailsPage') && byId('detailsPage').style.display !== 'none') return 'details';
  if (byId('home') && byId('home').style.display !== 'none') return 'home';
  return null;
}

// Every navigation / menu screen: what to say, which spoken words are
// accepted, and what to do once one of them is recognised. `fallback` (home
// only) treats anything unmatched as a search query instead of an error.
const vcCommandContexts = {
  welcomeChoice: {
    prompt: 'vcChoicePrompt', keys: ['signIn', 'createAccount'],
    act: (key) => { if (key === 'signIn') showStep('stepLogin'); else showStep('stepRegister'); }
  },
  pending: {
    prompt: 'vcPendingPrompt', keys: ['signIn'],
    act: () => showStep('stepLogin')
  },
  safety: {
    prompt: 'vcSafetyPrompt', keys: ['accept', 'disaccept'],
    act: (key) => (key === 'accept' ? acceptSafety() : showStep('stepLogin'))
  },
  home: {
    prompt: 'vcHomePrompt', keys: ['sell', 'myAds', 'account', 'logout'],
    act: (key) => {
      if (key === 'sell') showPage('sell');
      else if (key === 'myAds') showPage('myAds');
      else if (key === 'account') { vcAccountVisited = false; showPage('account'); }
      else if (key === 'logout') logout();
    },
    fallback: (raw) => { document.getElementById('searchInput').value = raw; filterListings(); }
  },
  myAds: {
    prompt: 'vcMyAdsPrompt', keys: ['home', 'sell', 'account', 'logout'],
    act: (key) => {
      if (key === 'home') showPage('home');
      else if (key === 'sell') showPage('sell');
      else if (key === 'account') { vcAccountVisited = false; showPage('account'); }
      else if (key === 'logout') logout();
    }
  },
  accountMenu: {
    prompt: 'vcAccountPrompt', keys: ['edit', 'privacy', 'logout', 'home'],
    act: (key) => {
      if (key === 'edit') { vcRunFieldFlow('profile', () => vcRunCommandFlow('accountMenu')); return true; }
      if (key === 'privacy') openPrivacyPage();
      else if (key === 'logout') logout();
      else if (key === 'home') showPage('home');
    }
  },
  privacyPage: {
    prompt: 'vcPrivacyPrompt', keys: ['back'],
    act: () => showPage('account')
  },
  details: {
    prompt: 'vcDetailsPrompt', keys: ['order', 'back'],
    act: (key) => { if (key === 'order' && currentDetailsId) placeOrder(currentDetailsId); else showPage('home'); }
  }
};

// Spoken numbers usually arrive as digits already ("9876543210"), but this
// also copes with a few number words so it still works if a browser
// transcribes them as words instead.
const VC_NUMBER_WORDS = {
  zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9,
  ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16,
  seventeen: 17, eighteen: 18, nineteen: 19, twenty: 20, thirty: 30, forty: 40, fifty: 50,
  sixty: 60, seventy: 70, eighty: 80, ninety: 90, hundred: 100, thousand: 1000
};
function vcExtractNumber(raw) {
  const digitMatch = raw.replace(/,/g, '').match(/-?\d+(\.\d+)?/g);
  if (digitMatch) return digitMatch.join('').match(/-?\d+(\.\d+)?/)[0];
  const words = raw.toLowerCase().replace(/point/g, ' point ').split(/\s+/).filter(Boolean);
  let total = 0, current = 0, sawWord = false;
  for (const w of words) {
    if (w === 'point') break;
    if (w in VC_NUMBER_WORDS) {
      sawWord = true;
      const val = VC_NUMBER_WORDS[w];
      if (val === 100) current *= val; else if (val === 1000) { total += current * val; current = 0; } else current += val;
    }
  }
  return sawWord ? String(total + current) : '';
}
function vcCleanEmail(raw) {
  return raw.toLowerCase().trim()
    .replace(/\s+at\s+/g, '@').replace(/\s+dot\s+/g, '.')
    .replace(/\s+underscore\s+/g, '_').replace(/\s+dash\s+/g, '-')
    .replace(/\s+/g, '');
}

function vcSpeak(text, langOverride, onend) {
  if (!('speechSynthesis' in window)) { if (onend) onend(); return; }
  try {
    window.speechSynthesis.cancel();
    const langCode = langOverride || speechLangCodes[currentLang] || 'en-US';
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = langCode;
    const voice = pickBestVoice(langCode);
    if (voice) utter.voice = voice;
    utter.rate = 0.95; utter.pitch = 1.1;
    if (onend) utter.onend = onend;
    setTimeout(() => { try { window.speechSynthesis.speak(utter); } catch (e) { if (onend) onend(); } }, 60);
  } catch (e) { if (onend) onend(); }
}

function vcSetStatus(text, listening) {
  const status = document.getElementById('vcStatus');
  const dot = document.getElementById('vcDot');
  if (status) status.innerText = text;
  if (dot) dot.style.background = listening ? '#ff4757' : '#2ed573';
}

// One shared helper for every "speak a prompt, then listen once" step -
// used for dictated fields, the tap-and-confirm photo step, and every
// navigation command menu.
function vcRecognizeOnce(langCode, onResult, onFail) {
  const SpeechRecognitionApi = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognitionApi) { onFail(); return; }
  const recognition = new SpeechRecognitionApi();
  vcRecognition = recognition;
  recognition.lang = langCode;
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  vcSetStatus(vcText('vcListening'), true);

  recognition.onresult = (event) => {
    recognition._handled = true;
    const raw = event.results[0][0].transcript;
    document.getElementById('vcHeard').innerText = '"' + raw + '"';
    onResult(raw);
  };
  recognition.onerror = () => { if (!recognition._handled) onFail(); };
  recognition.onend = () => { if (vcActive && !recognition._handled) onFail(); };

  try { recognition.start(); } catch (e) { onFail(); }
}

// Tap the mic FAB (or the overlay's Start button) to turn continuous, fully
// hands-free Voice Mode on or off.
function toggleVoiceCombined() {
  if (vcActive) { stopVoiceCombined(); return; }
  startVoiceAuto();
}

function startVoiceAuto() {
  const SpeechRecognitionApi = window.SpeechRecognition || window.webkitSpeechRecognition;
  const overlay = document.getElementById('voiceStartOverlay');
  if (!SpeechRecognitionApi) {
    if (overlay) overlay.style.display = 'none';
    alert(vcText('vcNotSupported'));
    return;
  }
  if (overlay) overlay.style.display = 'none';

  vcAutoMode = true;
  vcActive = true;
  vcAccountVisited = false;
  document.getElementById('voiceCombinedBtn').classList.add('listening');
  document.getElementById('voiceCombinedPanel').style.display = 'block';
  document.getElementById('vcHeard').innerText = '';
  vcSetStatus(vcText('vcSpeaking'), false);

  // The one thing said unprompted: welcome, then "you don't need to touch
  // anything" - after this everything is driven purely by what is heard.
  vcSpeak(vcText('vcWelcomeAuto'), null, () => vcAutoStep());
}

function dismissVoiceStart() {
  const overlay = document.getElementById('voiceStartOverlay');
  if (overlay) overlay.style.display = 'none';
}

function stopVoiceCombined() {
  vcActive = false;
  vcAutoMode = false;
  if (vcRecognition) { try { vcRecognition.onresult = null; vcRecognition.onerror = null; vcRecognition.onend = null; vcRecognition.stop(); } catch (e) {} }
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  document.getElementById('voiceCombinedBtn').classList.remove('listening');
  document.getElementById('voiceCombinedPanel').style.display = 'none';
}

// The heart of the continuous loop: look at whatever screen is on view,
// then either walk through its fields (and auto-submit) or offer its
// navigation commands - and once that's done, look again and keep going.
const VC_FIELD_FLOW_CONTEXTS = ['register', 'login', 'sell'];

function vcAutoStep() {
  if (!vcActive || !vcAutoMode) return;
  const context = detectVoiceContext();
  if (!context) { setTimeout(vcAutoStep, 1200); return; }

  if (context === 'profile') {
    // Name/phone are already pre-filled from the account, so only walk
    // through them the first time Account is opened; after that (and after
    // Privacy -> back) just offer the account menu straight away.
    if (vcAccountVisited) { vcRunCommandFlow('accountMenu'); }
    else { vcAccountVisited = true; vcRunFieldFlow('profile', () => vcRunCommandFlow('accountMenu')); }
    return;
  }
  if (VC_FIELD_FLOW_CONTEXTS.indexOf(context) !== -1) { vcRunFieldFlow(context); return; }
  if (vcCommandContexts[context]) { vcRunCommandFlow(context); return; }
  setTimeout(vcAutoStep, 1200);
}

/* ---- field-dictation flows (Register, Login, Sell, Profile) ---- */

function vcRunFieldFlow(context, onComplete) {
  if (!vcActive) return;
  vcFlowFields = vcFlows[context].filter(f => !f.skip || !f.skip());
  vcStepIndex = 0;
  vcCurrentFlowContext = context;
  vcFieldFlowOnComplete = onComplete || null;
  vcAskCurrentField();
}

function vcAskCurrentField() {
  if (!vcActive) return;
  if (vcStepIndex >= vcFlowFields.length) { vcFinishFieldFlow(); return; }
  const field = vcFlowFields[vcStepIndex];
  vcRetryCount = 0;
  vcSetStatus(vcText('vcSpeaking'), false);
  document.getElementById('vcHeard').innerText = '';
  if (field.type === 'manual') {
    vcSpeak(vcText(field.prompt), null, () => vcListenManualConfirm(field));
  } else {
    vcSpeak(vcText(field.prompt), null, () => vcListenForField(field));
  }
}

function vcListenForField(field) {
  if (!vcActive) return;
  // Numbers, emails and passwords are usually spoken in Latin characters /
  // digits regardless of the interface language, so recognise those in
  // English for reliability; everything else follows the chosen language.
  const useEnglish = field.type === 'number' || field.type === 'email' || field.type === 'password' || field.type === 'choice';
  const langCode = useEnglish ? 'en-IN' : (speechLangCodes[currentLang] || 'en-US');
  vcRecognizeOnce(langCode, (raw) => vcApplyAnswer(field, raw), () => vcHandleNoAnswer(field));
}

// Used only for the fishPhoto step: no dictation is possible (the browser
// can't pick a gallery photo from speech), so this just asks for one tap
// and then listens for the spoken word "done".
function vcListenManualConfirm(field) {
  if (!vcActive) return;
  vcRecognizeOnce(speechLangCodes[currentLang] || 'en-US', (raw) => {
    const key = vcMatchCommand(raw, ['done']);
    if (key === 'done' && (!field.validate || field.validate())) {
      vcStepIndex++;
      setTimeout(vcAskCurrentField, 400);
    } else {
      vcHandleNoAnswer(field);
    }
  }, () => vcHandleNoAnswer(field));
}

function vcHandleNoAnswer(field) {
  if (!vcActive) return;
  vcRetryCount++;
  const retry = () => (field.type === 'manual' ? vcListenManualConfirm(field) : vcListenForField(field));
  if (vcRetryCount <= 1) {
    vcSetStatus(vcText('vcRetry'), false);
    vcSpeak(vcText('vcRetry'), null, retry);
  } else {
    vcSetStatus(vcText('vcSkipped'), false);
    vcStepIndex++;
    setTimeout(vcAskCurrentField, 900);
  }
}

function vcApplyAnswer(field, raw) {
  const el = document.getElementById(field.id);
  if (!el) { vcStepIndex++; vcAskCurrentField(); return; }
  let value = raw.trim();

  if (field.type === 'number') {
    const num = vcExtractNumber(value);
    if (!num) { vcHandleNoAnswer(field); return; }
    value = num;
  } else if (field.type === 'email') {
    value = vcCleanEmail(value);
  } else if (field.type === 'password') {
    value = value.replace(/\s+/g, '');
  } else if (field.type === 'choice') {
    const lower = value.toLowerCase();
    const match = Object.keys(field.choices).find(key => field.choices[key].some(w => lower.includes(w)));
    if (!match) { vcHandleNoAnswer(field); return; }
    value = match;
  }

  el.value = value;
  if (field.after && typeof window[field.after] === 'function') { try { window[field.after](); } catch (e) {} }

  vcStepIndex++;
  setTimeout(vcAskCurrentField, 500);
}

// Once every field in the flow has an answer, submit the form for real
// (Register / Login / Sell) or save it (Profile) - all without a tap -
// then speak any error, or move on to whatever comes next.
const vcFlowSubmitAction = { register: doRegister, login: doLogin, sell: addListing };
const vcFlowErrorBox = { register: 'registerError', login: 'loginError', sell: 'sellError' };

async function vcFinishFieldFlow() {
  if (!vcActive) return;
  const context = vcCurrentFlowContext;
  const submitFn = vcFlowSubmitAction[context] || saveProfile;
  vcSetStatus(vcText('vcSpeaking'), false);
  vcSpeak(vcText('vcSubmitting'), null, async () => {
    await submitFn();
    const errBoxId = vcFlowErrorBox[context];
    const errEl = errBoxId ? document.getElementById(errBoxId) : null;
    if (errEl && errEl.style.display === 'block') {
      vcSpeak(errEl.innerText, null, () => setTimeout(vcAutoStep, 700));
      return;
    }
    vcSpeak(vcText('vcDone'), null, () => {
      if (vcFieldFlowOnComplete) setTimeout(vcFieldFlowOnComplete, 400);
      else setTimeout(vcAutoStep, 700);
    });
  });
}

/* ---- navigation / choice command menus (everything else) ---- */

function vcRunCommandFlow(contextKey) {
  if (!vcActive) return;
  const def = vcCommandContexts[contextKey];
  if (!def) { setTimeout(vcAutoStep, 1000); return; }
  vcCommandRetryCount = 0;
  vcSetStatus(vcText('vcSpeaking'), false);
  document.getElementById('vcHeard').innerText = '';
  vcSpeak(vcText(def.prompt), null, () => vcListenCommand(def));
}

function vcListenCommand(def) {
  if (!vcActive) return;
  const langCode = speechLangCodes[currentLang] || 'en-US';
  vcRecognizeOnce(langCode, (raw) => {
    // "stop" always works, in every command menu, so the person can end
    // Voice Mode at any time just by saying so.
    const key = vcMatchCommand(raw, def.keys.concat(['stop']));
    if (key === 'stop') { vcSpeak(vcText('vcStopped'), null, stopVoiceCombined); return; }
    if (key) {
      const result = def.act(key);
      if (result === true) return; // the handler starts its own flow (e.g. "edit")
      if (result && typeof result.then === 'function') { result.then(() => setTimeout(vcAutoStep, 900)); return; }
      setTimeout(vcAutoStep, 900);
    } else if (def.fallback) {
      def.fallback(raw);
      setTimeout(vcAutoStep, 900);
    } else {
      vcCommandRetryCount++;
      if (vcCommandRetryCount <= 2) vcSpeak(vcText('vcNotUnderstoodCommand'), null, () => vcListenCommand(def));
      else { vcCommandRetryCount = 0; setTimeout(vcAutoStep, 900); }
    }
  }, () => {
    vcCommandRetryCount++;
    if (vcCommandRetryCount <= 2) vcSpeak(vcText('vcRetry'), null, () => vcListenCommand(def));
    else { vcCommandRetryCount = 0; setTimeout(vcAutoStep, 900); }
  });
}

function openPrivacyPage() {
  document.getElementById('privDisplay_name').innerText = currentUser.name || '-';
  document.getElementById('privDisplay_phone').innerText = currentUser.phone || '-';
  document.getElementById('privDisplay_email').innerText = currentUser.email || '-';
  showPage('privacyPage');
}

/* ---------------- boot ---------------- */
window.onload = async function () {
  updateVoiceToggleIcon();
  const fishTypeInput = document.getElementById('fishType');
  if (fishTypeInput) fishTypeInput.addEventListener('input', updateMarketHint);
  const { ok, data } = await api('/api/me');
  if (ok && data.user) {
    currentUser = data.user;
    document.getElementById('onboardingScreen').style.display = 'none';
    document.getElementById('mainApp').style.display = 'block';
    document.getElementById('userName').value = currentUser.name || '';
    document.getElementById('userPhone').value = currentUser.phone || '';
    await loadListings();
    showPage('home');
  } else {
    showStep('stepChoice'); // speaks the voice-guided welcome/login intro, if the browser allows audio before a tap
  }
  initVoiceStartOverlay();
};

// Shows the "tap once to start Voice Mode" overlay - the single unavoidable
// tap browsers require before they'll allow microphone access. Skipped
// entirely if this browser has no speech recognition support at all.
function initVoiceStartOverlay() {
  const overlay = document.getElementById('voiceStartOverlay');
  if (!overlay) return;
  const SpeechRecognitionApi = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognitionApi) { overlay.style.display = 'none'; return; }
  overlay.style.display = 'flex';
}
