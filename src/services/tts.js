// Đọc phát âm tiếng Nhật bằng Web Speech API (port từ app.js cũ).

let cachedVoice = null;

function pickJapaneseVoice() {
  if (cachedVoice) return cachedVoice;
  const voices = window.speechSynthesis?.getVoices?.() ?? [];
  cachedVoice = voices.find((v) => v.lang === 'ja-JP') || voices.find((v) => v.lang?.startsWith('ja')) || null;
  return cachedVoice;
}

// Danh sách voice load bất đồng bộ trên một số trình duyệt
if (typeof window !== 'undefined' && window.speechSynthesis) {
  window.speechSynthesis.onvoiceschanged = () => {
    cachedVoice = null;
    pickJapaneseVoice();
  };
}

export function speakJapanese(text) {
  if (!text || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = 'ja-JP';
  utter.rate = 0.9;
  const voice = pickJapaneseVoice();
  if (voice) utter.voice = voice;
  window.speechSynthesis.speak(utter);
}
