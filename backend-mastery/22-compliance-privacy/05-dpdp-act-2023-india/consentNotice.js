/**
 * DPDP Act 2023 – Multilingual Consent Notice Generator
 * Consent notices must be available in all 22 scheduled Indian languages (Section 6(1)).
 */

const CONSENT_NOTICE_TEMPLATES = {
  en: {
    language: "English",
    title: "Consent to Process Your Personal Data",
    body: "We collect and process your personal data (name, email, phone, address) to provide our services. You may withdraw consent at any time by visiting your Privacy Settings. For queries, contact our Grievance Officer at grievance@example.com.",
    withdraw: "You may withdraw your consent at any time.",
    contact: "Grievance Officer: grievance@example.com",
  },
  hi: {
    language: "हिन्दी",
    title: "आपके व्यक्तिगत डेटा को संसाधित करने की सहमति",
    body: "हम अपनी सेवाएं प्रदान करने के लिए आपका व्यक्तिगत डेटा (नाम, ईमेल, फोन, पता) एकत्र और संसाधित करते हैं। आप किसी भी समय अपनी गोपनीयता सेटिंग्स पर जाकर सहमति वापस ले सकते हैं।",
    withdraw: "आप किसी भी समय अपनी सहमति वापस ले सकते हैं।",
    contact: "शिकायत अधिकारी: grievance@example.com",
  },
  bn: {
    language: "বাংলা",
    title: "আপনার ব্যক্তিগত তথ্য প্রক্রিয়া করার সম্মতি",
    body: "আমরা আমাদের পরিষেবা প্রদানের জন্য আপনার ব্যক্তিগত তথ্য (নাম, ইমেইল, ফোন, ঠিকানা) সংগ্রহ করি। আপনি যেকোনো সময় আপনার গোপনীয়তা সেটিংস থেকে সম্মতি প্রত্যাহার করতে পারেন।",
    withdraw: "আপনি যেকোনো সময় আপনার সম্মতি প্রত্যাহার করতে পারেন।",
    contact: "অভিযোগ কর্মকর্তা: grievance@example.com",
  },
  ta: {
    language: "தமிழ்",
    title: "உங்கள் தனிப்பட்ட தரவை செயலாக்குவதற்கான சம்மதம்",
    body: "எங்கள் சேவைகளை வழங்க உங்கள் தனிப்பட்ட தரவை (பெயர், மின்னஞ்சல், தொலைபேசி, முகவரி) சேகரிக்கிறோம். எந்த நேரத்திலும் உங்கள் தனியுரிமை அமைப்புகளில் சம்மதத்தை திரும்பப் பெறலாம்.",
    withdraw: "நீங்கள் எந்த நேரத்திலும் உங்கள் சம்மதத்தை திரும்பப் பெறலாம்.",
    contact: "குறை தீர்ப்பு அதிகாரி: grievance@example.com",
  },
  te: {
    language: "తెలుగు",
    title: "మీ వ్యక్తిగత డేటాను ప్రాసెస్ చేయడానికి సమ్మతి",
    body: "మా సేవలను అందించడానికి మేము మీ వ్యక్తిగత డేటాను (పేరు, ఇమెయిల్, ఫోన్, చిరునామా) సేకరిస్తాము. మీరు ఎప్పుడైనా మీ గోప్యత సెట్టింగ్‌లలో సమ్మతిని ఉపసంహరించుకోవచ్చు.",
    withdraw: "మీరు ఎప్పుడైనా మీ సమ్మతిని ఉపసంహరించుకోవచ్చు.",
    contact: "ఫిర్యాదు అధికారి: grievance@example.com",
  },
  mr: {
    language: "मराठी",
    title: "तुमच्या वैयक्तिक डेटावर प्रक्रिया करण्यासाठी संमती",
    body: "आम्ही आमच्या सेवा प्रदान करण्यासाठी तुमचा वैयक्तिक डेटा (नाव, ईमेल, फोन, पत्ता) गोळा करतो. तुम्ही कधीही तुमच्या गोपनीयता सेटिंग्जमध्ये संमती मागे घेऊ शकता.",
    withdraw: "तुम्ही कधीही तुमची संमती मागे घेऊ शकता.",
    contact: "तक्रार अधिकारी: grievance@example.com",
  },
};

/**
 * Get a consent notice in the requested language.
 * Falls back to English if language not available.
 */
function getConsentNotice(languageCode = "en") {
  return CONSENT_NOTICE_TEMPLATES[languageCode] || CONSENT_NOTICE_TEMPLATES["en"];
}

/**
 * Get list of all available languages.
 */
function getAvailableLanguages() {
  return Object.entries(CONSENT_NOTICE_TEMPLATES).map(([code, t]) => ({ code, language: t.language }));
}

/**
 * Generate a full consent notice object for storage/display.
 */
function generateConsentNotice(languageCode, version = "1.0", dataFiduciary = "Example Corp") {
  const template = getConsentNotice(languageCode);
  return {
    version,
    language: languageCode,
    languageName: template.language,
    dataFiduciary,
    title: template.title,
    body: template.body,
    withdrawText: template.withdraw,
    contactText: template.contact,
    generatedAt: new Date().toISOString(),
  };
}

module.exports = { getConsentNotice, getAvailableLanguages, generateConsentNotice };
