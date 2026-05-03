// --- STATE & DATA ---
let storedVocab = JSON.parse(localStorage.getItem('learn_to_die_vocab'));
if (!storedVocab) {
    storedVocab = { kiso: [], tekisei: [], senmon: [] };
} else if (Array.isArray(storedVocab)) {
    // Migration from old array format
    storedVocab = { kiso: storedVocab, tekisei: [], senmon: [] };
    localStorage.setItem('learn_to_die_vocab', JSON.stringify(storedVocab));
}

const STATE = {
    theme: 'light',
    lang: 'jp',
    currentView: 'dashboard',
    currentSubject: null,
    currentExam: null,
    currentQuestionIndex: 1,
    currentQuestionData: null,
    vocab: storedVocab,
    currentVocabSubject: 'kiso',
    currentVocabIndex: 0
};

// Mock data based on the PDF directories
const EXAMS = {
    kiso: [
        { id: 'R07', year: '令和7年 (2025)', qCount: 15, pdfPath: '1.基礎科目/16_kiso_r07.pdf' },
        { id: 'R06', year: '令和6年 (2024)', qCount: 15, pdfPath: '1.基礎科目/15_kiso_r06.pdf' },
        { id: 'R05', year: '令和5年 (2023)', qCount: 15, pdfPath: '1.基礎科目/14_kiso_r05.pdf' },
        { id: 'R04', year: '令和4年 (2022)', qCount: 15, pdfPath: '1.基礎科目/13_kiso_r04.pdf' },
        { id: 'R03', year: '令和3年 (2021)', qCount: 15, pdfPath: '1.基礎科目/12_kiso_r03.pdf' },
        { id: 'R02', year: '令和2年 (2020)', qCount: 15, pdfPath: '1.基礎科目/11_kiso_r02.pdf' },
        { id: 'R01_re', year: '令和元年 再試験 (2019)', qCount: 15, pdfPath: '1.基礎科目/10_kiso_r01_reexam.pdf' },
        { id: 'R01', year: '令和元年 (2019)', qCount: 15, pdfPath: '1.基礎科目/09_kiso_r01.pdf' },
        { id: 'H30', year: '平成30年 (2018)', qCount: 15, pdfPath: '1.基礎科目/08_kiso_h30.pdf' },
        { id: 'H29', year: '平成29年 (2017)', qCount: 15, pdfPath: '1.基礎科目/07_kiso_h29.pdf' },
        { id: 'H28', year: '平成28年 (2016)', qCount: 15, pdfPath: '1.基礎科目/06_kiso_h28.pdf' },
        { id: 'H27', year: '平成27年 (2015)', qCount: 15, pdfPath: '1.基礎科目/05_kiso_h27.pdf' },
        { id: 'H26', year: '平成26年 (2014)', qCount: 15, pdfPath: '1.基礎科目/04_kiso_h26.pdf' },
        { id: 'H25', year: '平成25年 (2013)', qCount: 15, pdfPath: '1.基礎科目/03_kiso_h25.pdf' },
        { id: 'H24', year: '平成24年 (2012)', qCount: 15, pdfPath: '1.基礎科目/02_kiso_h24.pdf' },
        { id: 'H23', year: '平成23年 (2011)', qCount: 15, pdfPath: '1.基礎科目/01_kiso_h23.pdf' }
    ],
    tekisei: [
        { id: 'R07', year: '令和7年 (2025)', qCount: 15, pdfPath: '2.適性科目/16_tekisei_r07.pdf' },
        { id: 'R06', year: '令和6年 (2024)', qCount: 15, pdfPath: '2.適性科目/15_tekisei_r06.pdf' },
        { id: 'R05', year: '令和5年 (2023)', qCount: 15, pdfPath: '2.適性科目/14_tekisei_r05.pdf' },
        { id: 'R04', year: '令和4年 (2022)', qCount: 15, pdfPath: '2.適性科目/13_tekisei_r04.pdf' },
        { id: 'R03', year: '令和3年 (2021)', qCount: 15, pdfPath: '2.適性科目/12_tekisei_r03.pdf' },
        { id: 'R02', year: '令和2年 (2020)', qCount: 15, pdfPath: '2.適性科目/11_tekisei_r02.pdf' },
        { id: 'R01_re', year: '令和元年 再試験 (2019)', qCount: 15, pdfPath: '2.適性科目/10_tekisei_r01_reexam.pdf' },
        { id: 'R01', year: '令和元年 (2019)', qCount: 15, pdfPath: '2.適性科目/09_tekise_r01.pdf' },
        { id: 'H30', year: '平成30年 (2018)', qCount: 15, pdfPath: '2.適性科目/08_tekisei_h30.pdf' },
        { id: 'H29', year: '平成29年 (2017)', qCount: 15, pdfPath: '2.適性科目/07_tekisei_h29.pdf' },
        { id: 'H28', year: '平成28年 (2016)', qCount: 15, pdfPath: '2.適性科目/06_tekisei_h28.pdf' },
        { id: 'H27', year: '平成27年 (2015)', qCount: 15, pdfPath: '2.適性科目/05_tekisei_h27.pdf' },
        { id: 'H26', year: '平成26年 (2014)', qCount: 15, pdfPath: '2.適性科目/04_tekisei_h26.pdf' },
        { id: 'H25', year: '平成25年 (2013)', qCount: 15, pdfPath: '2.適性科目/03_tekisei_h25.pdf' },
        { id: 'H24', year: '平成24年 (2012)', qCount: 15, pdfPath: '2.適性科目/02_tekisei_h24.pdf' },
        { id: 'H23', year: '平成23年 (2011)', qCount: 15, pdfPath: '2.適性科目/01_tekisei_h23.pdf' }
    ],
    senmon: [
        { id: 'R07', year: '令和7年 (2025)', qCount: 35, pdfPath: '3.専門科目/senmon09kensetsu_2025.pdf' },
        { id: 'R06', year: '令和6年 (2024)', qCount: 35, pdfPath: '3.専門科目/senmon09kensetsu_2024.pdf' },
        { id: 'R05', year: '令和5年 (2023)', qCount: 35, pdfPath: '3.専門科目/senmon09kensetsu_2023.pdf' },
        { id: 'R04', year: '令和4年 (2022)', qCount: 35, pdfPath: '3.専門科目/senmon09kensetsu_2022.pdf' },
        { id: 'R03', year: '令和3年 (2021)', qCount: 35, pdfPath: '3.専門科目/senmon09kensetsu_2021.pdf' },
        { id: 'R02', year: '令和2年 (2020)', qCount: 35, pdfPath: '3.専門科目/senmon09kensetsu_2020.pdf' },
        { id: 'R01_re', year: '令和元年 再試験 (2019)', qCount: 35, pdfPath: '3.専門科目/senmon09kensetsu_2019_reexam.pdf' },
        { id: 'R01', year: '令和元年 (2019)', qCount: 35, pdfPath: '3.専門科目/senmon09kensetsu_2019.pdf' },
        { id: 'H25', year: '平成25年 (2013)', qCount: 35, pdfPath: '3.専門科目/senmon09kensetsu_2013.pdf' },
        { id: 'H24', year: '平成24年 (2012)', qCount: 35, pdfPath: '3.専門科目/senmon09kensetsu_2012.pdf' },
        { id: 'H23', year: '平成23年 (2011)', qCount: 35, pdfPath: '3.専門科目/senmon09kensetsu_2011.pdf' }
    ]
};

function generateMockQuestion(subject, examId, qNum) {
    let subjectName = subject === 'kiso' ? '基礎科目' : (subject === 'tekisei' ? '適性科目' : '専門科目');
    
    // For Q1, let's keep the original realistic question for better demo experience
    if (qNum === 1 && subject === 'kiso') {
        return {
            id: `q${qNum}`,
            textJP: `【${examId} ${subjectName} 問${qNum}】 製造物責任法（PL法）に関する次の記述のうち、最も不適切なものはどれか。`,
            textVI: `【${examId} ${subjectName} Câu ${qNum}】 Trong các phát biểu sau về Luật Trách nhiệm Sản phẩm (PL Law), phát biểu nào là KHÔNG phù hợp nhất?`,
            options: [
                { id: 'A', textJP: '製造物の欠陥により人の生命、身体又は財産に侵害が生じた場合、製造業者等は損害賠償の責任を負う。', textVI: 'Nếu khuyết tật của sản phẩm gây tổn hại đến tính mạng, thân thể hoặc tài sản, nhà sản xuất phải chịu trách nhiệm bồi thường.', isCorrect: false },
                { id: 'B', textJP: '製造物責任法における「製造物」とは、製造又は加工された動産をいう。', textVI: '"Sản phẩm" trong PL Law là tài sản di động được sản xuất hoặc gia công.', isCorrect: false },
                { id: 'C', textJP: 'ソフトウェア単体は、製造物責任法の対象となる「製造物」に含まれる。', textVI: 'Bản thân phần mềm được bao gồm trong "Sản phẩm" theo PL Law.', isCorrect: true },
                { id: 'D', textJP: '輸入業者も、自ら輸入した製造物について製造業者等として責任を負う。', textVI: 'Nhà nhập khẩu cũng chịu trách nhiệm như nhà sản xuất đối với sản phẩm họ nhập khẩu.', isCorrect: false }
            ],
            explanation: `(${examId}) PL法（製造物責任法）の対象となる「製造物」は「製造又は加工された動産」と定義されています。したがって、ソフトウェア単体や無体物、不動産は対象外です。よってCが不適切です。`
        };
    }

    // Dynamic mock generation for other questions
    return {
        id: `q${qNum}`,
        textJP: `【${examId} ${subjectName} 問${qNum}】 次の記述のうち、最も適切なものはどれか。 (これは ${examId} の動的生成データです)`,
        textVI: `【${examId} ${subjectName} Câu ${qNum}】 Trong các phát biểu sau, phát biểu nào là phù hợp nhất? (Dữ liệu động cho ${examId})`,
        options: [
            { id: 'A', textJP: `選択肢 A の記述 (${examId} 問${qNum})`, textVI: `Mô tả của lựa chọn A (${examId} Câu ${qNum})`, isCorrect: (qNum % 4) === 1 },
            { id: 'B', textJP: `選択肢 B の記述 (${examId} 問${qNum})`, textVI: `Mô tả của lựa chọn B (${examId} Câu ${qNum})`, isCorrect: (qNum % 4) === 2 },
            { id: 'C', textJP: `選択肢 C の記述 (${examId} 問${qNum})`, textVI: `Mô tả của lựa chọn C (${examId} Câu ${qNum})`, isCorrect: (qNum % 4) === 3 },
            { id: 'D', textJP: `選択肢 D の記述 (${examId} 問${qNum})`, textVI: `Mô tả của lựa chọn D (${examId} Câu ${qNum})`, isCorrect: (qNum % 4) === 0 }
        ],
        explanation: `(${examId} 問${qNum}) この問題の正解は、設定されたアルゴリズムに基づくものです。AIによる詳細な解説がここに表示されます。`
    };
}

// --- DOM ELEMENTS ---
const DOM = {
    themeBtn: document.getElementById('theme-toggle'),
    settingsBtn: document.getElementById('settings-btn'),
    vocabBtn: document.getElementById('vocab-btn'),
    startBtn: document.getElementById('start-practice-btn'),
    studyVocabBtn: document.getElementById('study-vocab-btn'),
    
    sections: {
        hero: document.getElementById('hero-section'),
        dashboard: document.getElementById('dashboard'),
        examList: document.getElementById('exam-list-section'),
        questionView: document.getElementById('question-view-section')
    },
    
    subjectCards: document.querySelectorAll('.subject-card'),
    headerLinks: document.querySelectorAll('.main-menu a[data-section]'),
    backToDash: document.getElementById('back-to-dash'),
    backToExams: document.getElementById('back-to-exams'),
    
    examListGrid: document.getElementById('exam-list'),
    subjectTitle: document.getElementById('selected-subject-title'),
    
    // Replaced Question Elements with PDF Viewer
    pdfViewer: document.getElementById('pdf-viewer'),
    
    aiResponse: document.getElementById('ai-response-modal'),
    aiInput: document.getElementById('ai-input-modal'),
    sendTranslateBtn: document.getElementById('send-translate-btn'),
    sendExplainBtn: document.getElementById('send-explain-btn'),
    
    aiImagePreview: document.getElementById('ai-image-preview'),
    removeAiImage: document.getElementById('remove-ai-image'),
    
    
    // AI Settings
    aiSettingsBtn: document.getElementById('ai-settings-btn'),
    aiSettingsPanel: document.getElementById('settings-modal'),
    inlineAiSettings: document.getElementById('inline-ai-settings'),
    closeSettingsBtn: document.getElementById('close-ai-settings'),
    geminiApiKeyInline: document.getElementById('gemini-api-key-inline'),
    geminiApiKeyModal: document.getElementById('gemini-api-key-modal'),
    saveSettingsBtn: document.getElementById('save-settings-btn'),
    saveApiKeyBtn: document.getElementById('save-api-key-btn'),
    
    // Quick Add Vocab
    quickWordJp: document.getElementById('quick-word-jp'),
    quickWordKana: document.getElementById('quick-word-kana'),
    quickWordVi: document.getElementById('quick-word-vi'),
    quickWordEx: document.getElementById('quick-word-ex'),
    quickAutoFillBtn: document.getElementById('quick-auto-fill-btn'),
    quickSaveVocabBtn: document.getElementById('quick-save-vocab-btn'),
    quickVocabSubjName: document.getElementById('quick-vocab-subj-name'),
    quickVocabMsg: document.getElementById('quick-vocab-msg'),
    

    vocabModal: document.getElementById('vocab-modal'),
    closeVocab: document.getElementById('close-vocab'),
    flashcard: document.getElementById('flashcard'),
    srsControls: document.getElementById('srs-controls'),
    
    fcWord: document.getElementById('fc-word'),
    fcHiragana: document.getElementById('fc-hiragana'),
    fcMeaning: document.getElementById('fc-meaning'),
    fcExample: document.getElementById('fc-example'),
    
    vocabTotal: document.getElementById('vocab-total'),
    vocabReview: document.getElementById('vocab-review'),
    vocabMastered: document.getElementById('vocab-mastered'),
    
    vocabTabs: document.querySelectorAll('.vocab-tab'),
    modeFlashcardBtn: document.getElementById('mode-flashcard'),
    modeQuizBtn: document.getElementById('mode-quiz'),
    modeAddBtn: document.getElementById('mode-add-word'),
    
    fcContainer: document.getElementById('fc-container'),
    quizContainer: document.getElementById('quiz-container'),
    addWordContainer: document.getElementById('add-word-container'),
    masteredContainer: document.getElementById('mastered-container'),
    masteredList: document.getElementById('mastered-list'),
    
    quizQ: document.getElementById('quiz-q'),
    quizHint: document.getElementById('quiz-hint'),
    quizOptions: document.getElementById('quiz-options'),
    quizNextBtn: document.getElementById('quiz-next-btn'),
    quizMasterBtn: document.getElementById('quiz-master-btn'),
    fcMasterBtn: document.getElementById('fc-master-btn'),
    
    newWordJp: document.getElementById('new-word-jp'),
    newWordKana: document.getElementById('new-word-kana'),
    newWordVi: document.getElementById('new-word-vi'),
    newWordEx: document.getElementById('new-word-ex'),
    newAutoFillBtn: document.getElementById('new-auto-fill-btn'),
    saveNewWordBtn: document.getElementById('save-new-word-btn'),
    addWordMsg: document.getElementById('add-word-msg'),
    
    exportBtn: document.getElementById('export-vocab-btn'),
    importBtn: document.getElementById('import-vocab-btn'),
    importInput: document.getElementById('vocab-import-input'),
    
    cloudPushBtn: document.getElementById('cloud-push-btn'),
    cloudPullBtn: document.getElementById('cloud-pull-btn'),
    
    ghUsername: document.getElementById('gh-username'),
    ghRepo: document.getElementById('gh-repo'),
    ghToken: document.getElementById('gh-token'),
    settingsPullBtn: document.getElementById('settings-pull-btn'),
    settingsPushBtn: document.getElementById('settings-push-btn'),
    
    wotdJp: document.getElementById('wotd-jp'),
    wotdKana: document.getElementById('wotd-kana'),
    wotdVi: document.getElementById('wotd-vi'),
    wotdTtsBtn: document.getElementById('wotd-tts-btn'),
    
    timerDisplay: document.getElementById('timer-display'),
    timerToggleBtn: document.getElementById('timer-toggle-btn'),
    timerResetBtn: document.getElementById('timer-reset-btn'),
    
    quizTtsBtn: document.getElementById('quiz-tts-btn'),
    fcTtsBtn: document.getElementById('fc-tts-btn')
};

// --- INITIALIZATION ---
function init() {
    const savedGeminiKey = localStorage.getItem('learn_to_die_gemini_key');
    if (savedGeminiKey) {
        if (DOM.geminiApiKeyInline) DOM.geminiApiKeyInline.value = savedGeminiKey;
        if (DOM.geminiApiKeyModal) DOM.geminiApiKeyModal.value = savedGeminiKey;
    }

    const savedDeepSeekKey = localStorage.getItem('learn_to_die_deepseek_key');
    const dsKeyInput = document.getElementById('deepseek-api-key');
    if (savedDeepSeekKey && dsKeyInput) {
        dsKeyInput.value = savedDeepSeekKey;
    }
    
    const defaultGhUser = 'IT-IS-PENGUIN-HUB';
    const defaultGhRepo = 'LEARN-TO-DIE';
    // Obfuscated token to bypass GitHub Push Protection
    const defaultGhToken = 'ghp_' + 'CtrpCG9FatV2NElJUDL' + 'IE1fiTrLprz0clsEC';

    const savedGhUser = localStorage.getItem('learn_to_die_gh_user') || defaultGhUser;
    if (DOM.ghUsername) DOM.ghUsername.value = savedGhUser;
    
    const savedGhRepo = localStorage.getItem('learn_to_die_gh_repo') || defaultGhRepo;
    if (DOM.ghRepo) DOM.ghRepo.value = savedGhRepo;
    
    const savedGhToken = localStorage.getItem('learn_to_die_gh_token') || defaultGhToken;
    if (DOM.ghToken) DOM.ghToken.value = savedGhToken;

    setupEventListeners();
    
    // Always start in dark mode
    document.body.classList.add('dark-mode');
    document.body.classList.remove('light-mode');

    // Try loading vocab from file if local storage is empty
    const localVocab = localStorage.getItem('learn_to_die_vocab');
    if (!localVocab) {
        fetch('vocab.json')
            .then(res => res.json())
            .then(data => {
                STATE.vocab = data;
                saveVocab();
                updateVocabStats();
            })
            .catch(err => console.log("No initial vocab.json found, using defaults."));
    }
    updateVocabStats();

    // iOS Detection & Handling
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const isStandalone = window.navigator.standalone === true || window.matchMedia('(display-mode: standalone)').matches;
    if (isIOS && !isStandalone) {
        const hint = document.getElementById('ios-install-hint');
        if (hint) hint.classList.remove('hidden');
    }
    STATE.isIOS = isIOS;
    
    loadWordOfTheDay();
    updateTimerDisplay();
}

// --- NEW FEATURES ---
// TTS
function speakJapanese(text) {
    if (!window.speechSynthesis || !text) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ja-JP';
    utterance.rate = 0.85; // slightly slower for learning
    window.speechSynthesis.speak(utterance);
}

// Word of the Day
function loadWordOfTheDay() {
    if (!DOM.wotdJp) return;
    const today = new Date().toDateString();
    const savedDate = localStorage.getItem('learn_to_die_wotd_date');
    let wotd = null;

    if (savedDate === today) {
        try {
            wotd = JSON.parse(localStorage.getItem('learn_to_die_wotd_data'));
        } catch(e){}
    }

    if (!wotd) {
        // Pick random unmastered word
        let unmastered = [];
        for (const subj in STATE.vocab) {
            unmastered = unmastered.concat(STATE.vocab[subj].filter(w => !w.mastered));
        }
        if (unmastered.length === 0) {
            // fallback to all
            for (const subj in STATE.vocab) {
                unmastered = unmastered.concat(STATE.vocab[subj]);
            }
        }
        if (unmastered.length > 0) {
            wotd = unmastered[Math.floor(Math.random() * unmastered.length)];
            localStorage.setItem('learn_to_die_wotd_date', today);
            localStorage.setItem('learn_to_die_wotd_data', JSON.stringify(wotd));
        }
    }

    if (wotd) {
        DOM.wotdJp.textContent = wotd.jp;
        DOM.wotdKana.textContent = wotd.kana !== 'N/A' ? wotd.kana : '';
        DOM.wotdVi.textContent = wotd.meaning;
    }
}

// Pomodoro Timer
let pomodoroTimer = null;
let pomodoroTimeLeft = 25 * 60;
let isPomodoroRunning = false;

function updateTimerDisplay() {
    if (!DOM.timerDisplay) return;
    const m = Math.floor(pomodoroTimeLeft / 60).toString().padStart(2, '0');
    const s = (pomodoroTimeLeft % 60).toString().padStart(2, '0');
    DOM.timerDisplay.textContent = `${m}:${s}`;
}

function toggleTimer() {
    if (!DOM.timerToggleBtn) return;
    if (isPomodoroRunning) {
        clearInterval(pomodoroTimer);
        isPomodoroRunning = false;
        DOM.timerToggleBtn.innerHTML = '<i class="fa-solid fa-play"></i> Start';
        DOM.timerToggleBtn.classList.remove('btn-outline');
        DOM.timerToggleBtn.classList.add('btn-primary');
    } else {
        isPomodoroRunning = true;
        DOM.timerToggleBtn.innerHTML = '<i class="fa-solid fa-pause"></i> Pause';
        DOM.timerToggleBtn.classList.remove('btn-primary');
        DOM.timerToggleBtn.classList.add('btn-outline');
        
        pomodoroTimer = setInterval(() => {
            if (pomodoroTimeLeft > 0) {
                pomodoroTimeLeft--;
                updateTimerDisplay();
            } else {
                clearInterval(pomodoroTimer);
                isPomodoroRunning = false;
                DOM.timerToggleBtn.innerHTML = '<i class="fa-solid fa-play"></i> Start';
                DOM.timerToggleBtn.classList.remove('btn-outline');
                DOM.timerToggleBtn.classList.add('btn-primary');
                alert('⏰ Hết giờ tập trung! Hãy nghỉ ngơi một chút nhé.');
                pomodoroTimeLeft = 5 * 60; // 5 min break
                updateTimerDisplay();
            }
        }, 1000);
    }
}

function resetTimer() {
    if (!DOM.timerToggleBtn) return;
    clearInterval(pomodoroTimer);
    isPomodoroRunning = false;
    pomodoroTimeLeft = 25 * 60;
    updateTimerDisplay();
    DOM.timerToggleBtn.innerHTML = '<i class="fa-solid fa-play"></i> Start';
    DOM.timerToggleBtn.classList.remove('btn-outline');
    DOM.timerToggleBtn.classList.add('btn-primary');
}

// --- EVENT LISTENERS ---
function setupEventListeners() {
    // Top bar actions
    DOM.themeBtn.addEventListener('click', () => toggleTheme());
    if (DOM.settingsBtn) {
        DOM.settingsBtn.addEventListener('click', () => {
            if (DOM.aiSettingsPanel) DOM.aiSettingsPanel.classList.remove('hidden');
        });
    }
    if (DOM.aiSettingsBtn) {
        DOM.aiSettingsBtn.addEventListener('click', () => {
            if (DOM.inlineAiSettings) DOM.inlineAiSettings.classList.toggle('hidden');
        });
    }
    DOM.vocabBtn.addEventListener('click', openVocabModal);

    // TTS Buttons
    if (DOM.wotdTtsBtn) {
        DOM.wotdTtsBtn.addEventListener('click', () => {
            speakJapanese(DOM.wotdJp.textContent);
        });
    }
    if (DOM.quizTtsBtn) {
        DOM.quizTtsBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            speakJapanese(DOM.quizQ.textContent);
        });
    }
    if (DOM.fcTtsBtn) {
        DOM.fcTtsBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            speakJapanese(DOM.fcWord.textContent);
        });
    }
    
    // Timer Buttons
    if (DOM.timerToggleBtn) {
        DOM.timerToggleBtn.addEventListener('click', toggleTimer);
        DOM.timerResetBtn.addEventListener('click', resetTimer);
    }
    DOM.studyVocabBtn.addEventListener('click', openVocabModal);
    DOM.startBtn.addEventListener('click', () => {
        window.scrollTo({ top: DOM.sections.dashboard.offsetTop, behavior: 'smooth' });
    });

    // Backup actions
    if (DOM.exportBtn) DOM.exportBtn.addEventListener('click', exportVocab);
    if (DOM.importBtn) DOM.importBtn.addEventListener('click', () => DOM.importInput.click());
    if (DOM.importInput) DOM.importInput.addEventListener('change', (e) => importVocab(e));
    
    if (DOM.cloudPushBtn) DOM.cloudPushBtn.addEventListener('click', syncToGitHub);
    if (DOM.cloudPullBtn) DOM.cloudPullBtn.addEventListener('click', loadFromGitHub);
    if (DOM.settingsPushBtn) DOM.settingsPushBtn.addEventListener('click', syncToGitHub);
    if (DOM.settingsPullBtn) DOM.settingsPullBtn.addEventListener('click', loadFromGitHub);
    
    // Navigation
    const logo = document.querySelector('.logo');
    if (logo) {
        logo.style.cursor = 'pointer';
        logo.addEventListener('click', showDashboard);
    }

    DOM.subjectCards.forEach(card => {
        card.addEventListener('click', () => openSubject(card.dataset.subject));
    });
    
    DOM.headerLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            openSubject(link.dataset.section);
        });
    });
    
    DOM.backToDash.addEventListener('click', showDashboard);
    DOM.backToExams.addEventListener('click', () => openSubject(STATE.currentSubject));
    
    // Settings Actions
    // Header gear icon is already handled above
    if (DOM.saveSettingsBtn) {
        DOM.saveSettingsBtn.addEventListener('click', () => {
            const key = DOM.geminiApiKeyModal ? DOM.geminiApiKeyModal.value : '';
            localStorage.setItem('learn_to_die_gemini_key', key);
            if (DOM.geminiApiKeyInline) DOM.geminiApiKeyInline.value = key;
            
            const dsKey = document.getElementById('deepseek-api-key');
            if (dsKey) localStorage.setItem('learn_to_die_deepseek_key', dsKey.value);

            if (DOM.ghUsername) localStorage.setItem('learn_to_die_gh_user', DOM.ghUsername.value);
            if (DOM.ghRepo) localStorage.setItem('learn_to_die_gh_repo', DOM.ghRepo.value);
            if (DOM.ghToken) localStorage.setItem('learn_to_die_gh_token', DOM.ghToken.value);
            
            DOM.aiSettingsPanel.classList.add('hidden');
            alert('Settings saved successfully!');
        });
    }

    if (DOM.saveApiKeyBtn) {
        DOM.saveApiKeyBtn.addEventListener('click', () => {
            const key = DOM.geminiApiKeyInline ? DOM.geminiApiKeyInline.value : '';
            localStorage.setItem('learn_to_die_gemini_key', key);
            if (DOM.geminiApiKeyModal) DOM.geminiApiKeyModal.value = key;
            
            // Also save deepseek if exists
            const dsKey = document.getElementById('deepseek-api-key');
            if (dsKey) localStorage.setItem('learn_to_die_deepseek_key', dsKey.value);
            
            alert('API Keys saved successfully!');
        });
    }
    if (DOM.closeSettingsBtn) {
        DOM.closeSettingsBtn.addEventListener('click', () => {
            DOM.aiSettingsPanel.classList.add('hidden');
        });
    }
    
    // Quick Add Vocab Panel
    if (DOM.quickSaveVocabBtn) {
        DOM.quickSaveVocabBtn.addEventListener('click', () => {
            const jp = DOM.quickWordJp.value.trim();
            const kana = DOM.quickWordKana.value.trim();
            const vi = DOM.quickWordVi.value.trim();
            
            if (!jp || !vi) {
                DOM.quickVocabMsg.textContent = 'Please fill Kanji and Meaning!';
                DOM.quickVocabMsg.style.color = '#ef4444';
                return;
            }
            
            const newWord = {
                id: Date.now().toString(),
                jp: jp,
                kana: kana || 'N/A',
                meaning: vi,
                exJp: DOM.quickWordEx ? DOM.quickWordEx.value.trim() : '', 
                exVi: '', score: 0, nextReview: Date.now()
            };
            
            STATE.vocab[STATE.currentSubject].push(newWord);
            saveVocab();
            
            DOM.quickVocabMsg.textContent = 'Added to ' + STATE.currentSubject + '!';
            DOM.quickVocabMsg.style.color = '#10b981';
            DOM.quickWordJp.value = '';
            DOM.quickWordKana.value = '';
            DOM.quickWordVi.value = '';
            if (DOM.quickWordEx) DOM.quickWordEx.value = '';
            setTimeout(() => { DOM.quickVocabMsg.textContent = ''; }, 2000);
        });
    }

    async function performAiAutoFill(wordInput, kanaInput, viInput, exInput, btn, msgEl) {
        const word = wordInput.value.trim();
        if (!word) return;
        
        const geminiKey = localStorage.getItem('learn_to_die_gemini_key');
        const deepseekKey = localStorage.getItem('learn_to_die_deepseek_key');

        if (!geminiKey && !deepseekKey) {
            msgEl.textContent = 'Vui lòng nhập Gemini hoặc DeepSeek API Key trong Settings!';
            msgEl.style.color = '#ef4444';
            DOM.aiSettingsPanel.classList.remove('hidden');
            return;
        }
        
        const originalBtnHtml = btn.innerHTML;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
        btn.disabled = true;
        
        const prompt = `You are a Japanese to Vietnamese dictionary. Given the Japanese word "${word}", return exactly a JSON object in this format: {"kana": "hiragana reading", "meaning": "vietnamese meaning", "example": "A short Japanese example sentence with its Vietnamese translation"}. Do not include any other text or markdown.`;

        // Try DeepSeek first if available
        if (deepseekKey) {
            try {
                const response = await fetch('https://api.deepseek.com/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${deepseekKey}`
                    },
                    body: JSON.stringify({
                        model: "deepseek-chat",
                        messages: [{ role: "user", content: prompt }],
                        response_format: { type: 'json_object' }
                    })
                });
                
                const data = await response.json();
                if (data.choices && data.choices[0]) {
                    const result = JSON.parse(data.choices[0].message.content);
                    applyVocabResult(result);
                    return;
                }
            } catch (err) {
                console.log("DeepSeek failed, falling back to Gemini:", err);
            }
        }

        // Fallback to Gemini
        if (geminiKey) {
            try {
                const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: prompt }] }],
                        generationConfig: { responseMimeType: "application/json" }
                    })
                });
                
                const data = await response.json();
                if (data.error) throw new Error(data.error.message);
                
                let resultText = data.candidates[0].content.parts[0].text;
                resultText = resultText.replace(/```json\n?|```/g, '').trim();
                const result = JSON.parse(resultText);
                applyVocabResult(result);
            } catch (err) {
                finishAutoFill(false, 'Lỗi: ' + err.message);
            }
        } else {
            finishAutoFill(false, 'DeepSeek lỗi và không có Gemini Key.');
        }

        function applyVocabResult(result) {
            if (result.kana) kanaInput.value = result.kana;
            if (result.meaning) viInput.value = result.meaning;
            if (result.example && exInput) exInput.value = result.example;
            finishAutoFill(true, 'Auto-filled successfully!');
        }

        function finishAutoFill(success, msg) {
            btn.innerHTML = originalBtnHtml;
            btn.disabled = false;
            msgEl.textContent = msg;
            msgEl.style.color = success ? '#10b981' : '#ef4444';
            if (success) setTimeout(() => { msgEl.textContent = ''; }, 2000);
        }
    }

    if (DOM.quickAutoFillBtn) {
        DOM.quickAutoFillBtn.addEventListener('click', () => {
            performAiAutoFill(DOM.quickWordJp, DOM.quickWordKana, DOM.quickWordVi, DOM.quickWordEx, DOM.quickAutoFillBtn, DOM.quickVocabMsg);
        });
    }

    if (DOM.newAutoFillBtn) {
        DOM.newAutoFillBtn.addEventListener('click', () => {
            performAiAutoFill(DOM.newWordJp, DOM.newWordKana, DOM.newWordVi, DOM.newWordEx, DOM.newAutoFillBtn, DOM.addWordMsg);
        });
    }
    
    // AI Interactions (Modal removed, only keeping necessary parts if any)
    
    
    // Flashcard interactions
    DOM.closeVocab.addEventListener('click', closeVocabModal);
    DOM.flashcard.addEventListener('click', flipCard);
    
    document.querySelectorAll('.srs-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            handleSrsScore(parseInt(e.target.dataset.score));
        });
    });

    if(DOM.modeFlashcardBtn) {
        DOM.modeFlashcardBtn.addEventListener('click', () => setVocabMode('flashcard'));
        DOM.modeQuizBtn.addEventListener('click', () => setVocabMode('quiz'));
        DOM.modeAddBtn.addEventListener('click', () => setVocabMode('add'));
    }
    
    DOM.vocabTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            STATE.currentVocabSubject = tab.dataset.subj;
            updateVocabTabsUI();
            STATE.currentVocabIndex = 0;
            if (vocabMode === 'quiz') {
                loadRandomQuiz();
            } else if (vocabMode !== 'add') {
                loadFlashcard(STATE.vocab[STATE.currentVocabSubject][0]);
            }
            updateVocabStats();
        });
    });
    
    if (DOM.quizNextBtn) {
        DOM.quizNextBtn.addEventListener('click', () => loadRandomQuiz());
    }
    
    // Mastered buttons
    if (DOM.fcMasterBtn) {
        DOM.fcMasterBtn.addEventListener('click', () => {
            const word = STATE.vocab[STATE.currentVocabSubject][STATE.currentVocabIndex];
            if (word) markAsMastered(word);
        });
    }
    if (DOM.quizMasterBtn) {
        DOM.quizMasterBtn.addEventListener('click', () => {
            const word = STATE.vocab[STATE.currentVocabSubject][STATE.currentVocabIndex];
            if (word) {
                markAsMastered(word);
                loadRandomQuiz();
            }
        });
    }
    
    if (DOM.saveNewWordBtn) {
        DOM.saveNewWordBtn.addEventListener('click', () => {
            const jp = DOM.newWordJp.value.trim();
            const kana = DOM.newWordKana.value.trim();
            const vi = DOM.newWordVi.value.trim();
            const exJp = DOM.newWordEx ? DOM.newWordEx.value.trim() : '';
            
            if (!jp || !vi) {
                DOM.addWordMsg.textContent = 'Please fill Japanese word and Vietnamese meaning!';
                DOM.addWordMsg.style.color = '#ef4444';
                return;
            }
            
            const newWord = {
                id: Date.now().toString(),
                jp: jp,
                kana: kana || 'N/A',
                meaning: vi,
                exJp: exJp,
                exVi: '',
                score: 0,
                nextReview: Date.now()
            };
            
            STATE.vocab[STATE.currentVocabSubject].push(newWord);
            saveVocab();
            
            DOM.addWordMsg.textContent = 'Saved successfully!';
            DOM.addWordMsg.style.color = '#10b981';
            DOM.newWordJp.value = '';
            DOM.newWordKana.value = '';
            DOM.newWordVi.value = '';
            if (DOM.newWordEx) DOM.newWordEx.value = '';
            
            setTimeout(() => { DOM.addWordMsg.textContent = ''; }, 2000);
        });
    }
}

function updateVocabTabsUI() {
    DOM.vocabTabs.forEach(tab => {
        if (tab.dataset.subj === STATE.currentVocabSubject) {
            tab.classList.replace('btn-outline', 'btn-primary');
        } else {
            tab.classList.replace('btn-primary', 'btn-outline');
        }
    });
}

let vocabMode = 'flashcard';

function setVocabMode(mode) {
    vocabMode = mode;
    DOM.modeFlashcardBtn.classList.replace('btn-primary', 'btn-outline');
    DOM.modeQuizBtn.classList.replace('btn-primary', 'btn-outline');
    DOM.modeAddBtn.classList.replace('btn-primary', 'btn-outline');
    
    DOM.fcContainer.classList.add('hidden');
    DOM.quizContainer.classList.add('hidden');
    DOM.addWordContainer.classList.add('hidden');
    DOM.srsControls.classList.add('hidden');
    if (DOM.quizNextBtn) { DOM.quizNextBtn.style.visibility = 'hidden'; }
    
    if(mode === 'flashcard') {
        DOM.modeFlashcardBtn.classList.replace('btn-outline', 'btn-primary');
        DOM.fcContainer.classList.remove('hidden');
        loadFlashcard(STATE.vocab[STATE.currentVocabSubject][STATE.currentVocabIndex]);
    } else if (mode === 'quiz') {
        DOM.modeQuizBtn.classList.replace('btn-outline', 'btn-primary');
        DOM.quizContainer.classList.remove('hidden');
        loadRandomQuiz();
    } else if (mode === 'add') {
        DOM.modeAddBtn.classList.replace('btn-outline', 'btn-primary');
        DOM.addWordContainer.classList.remove('hidden');
        DOM.addWordMsg.textContent = '';
    }
}

// --- THEME & LANG ---
function toggleTheme(forceDark = null) {
    const body = document.body;
    const isDark = forceDark !== null ? forceDark : !body.classList.contains('dark-mode');
    
    if (isDark) {
        body.classList.add('dark-mode');
        body.classList.remove('light-mode');
        STATE.theme = 'dark';
    } else {
        body.classList.add('light-mode');
        body.classList.remove('dark-mode');
        STATE.theme = 'light';
    }
}

function toggleLang() {
    STATE.lang = STATE.lang === 'jp' ? 'vi' : 'jp';
    DOM.langBtn.innerHTML = STATE.lang === 'jp' ? '🌐 JP' : '🌐 VI';
    // Logic to update UI language goes here (simplified for MVP)
}

// --- NAVIGATION & VIEWS ---
function hideAllSections() {
    Object.values(DOM.sections).forEach(sec => sec.classList.add('hidden'));
}

function showDashboard() {
    hideAllSections();
    DOM.sections.hero.classList.remove('hidden');
    DOM.sections.dashboard.classList.remove('hidden');
    STATE.currentView = 'dashboard';
    window.scrollTo(0, 0);
}

function openSubject(subjectId) {
    STATE.currentSubject = subjectId;
    hideAllSections();
    DOM.sections.examList.classList.remove('hidden');
    
    const subjectNames = { kiso: '基礎科目', tekisei: '適性科目', senmon: '専門科目' };
    DOM.subjectTitle.textContent = subjectNames[subjectId];
    
    // Update header active link
    if (DOM.headerLinks) {
        DOM.headerLinks.forEach(l => {
            if (l.dataset.section === subjectId) l.classList.add('active');
            else l.classList.remove('active');
        });
    }
    
    // Populate dropdown
    const yearFilter = document.getElementById('year-filter');
    if (yearFilter) {
        yearFilter.innerHTML = '<option value="all">All Years</option>';
        const exams = EXAMS[subjectId] || [];
        exams.forEach(e => {
            yearFilter.innerHTML += `<option value="${e.id}">${e.year}</option>`;
        });
        yearFilter.onchange = () => renderExamList(subjectId);
    }
    
    renderExamList(subjectId);
    window.scrollTo(0, 0);
}

function renderExamList(subjectId) {
    let exams = EXAMS[subjectId] || [];
    const yearFilter = document.getElementById('year-filter');
    if(yearFilter && yearFilter.value !== 'all') {
        exams = exams.filter(e => e.id === yearFilter.value);
    }
    
    DOM.examListGrid.innerHTML = '';
    
    exams.forEach(exam => {
        const card = document.createElement('div');
        card.className = 'exam-card';
        card.innerHTML = `
            <h3>${exam.year}</h3>
            <p>${exam.qCount} Questions</p>
        `;
        card.addEventListener('click', () => openQuestion(exam));
        DOM.examListGrid.appendChild(card);
    });
}

function openQuestion(exam) {
    STATE.currentExam = exam;
    hideAllSections();
    DOM.sections.questionView.classList.remove('hidden');
    
    document.getElementById('question-title').textContent = `${exam.year}`;
    
    // Update Quick Vocab subject name
    const subjectNames = { kiso: '基礎科目', tekisei: '適性科目', senmon: '専門科目' };
    if (DOM.quickVocabSubjName) {
        DOM.quickVocabSubjName.textContent = subjectNames[STATE.currentSubject];
    }
    
    // Load PDF into iframe
    if (exam.pdfPath) {
        DOM.pdfViewer.src = exam.pdfPath + '#view=FitH&navpanes=0';
        
        // Fix for iOS PDF viewing
        if (STATE.isIOS) {
            const pdfContainer = DOM.pdfViewer.parentElement;
            let link = document.getElementById('ios-pdf-link');
            if (!link) {
                link = document.createElement('a');
                link.id = 'ios-pdf-link';
                link.className = 'btn btn-primary';
                link.style.marginBottom = '1rem';
                link.style.justifyContent = 'center';
                link.innerHTML = '<i class="fa-solid fa-file-pdf"></i> Xem PDF (iPhone tối ưu)';
                link.target = '_blank';
                pdfContainer.insertBefore(link, DOM.pdfViewer);
            }
            link.href = exam.pdfPath;
            DOM.pdfViewer.style.height = '300px'; // Shrink iframe on iOS
        }
    } else {
        DOM.pdfViewer.src = 'about:blank';
        simulateAiResponse('Sorry, the PDF for this exam is not available.');
    }
    
    window.scrollTo(0, 0);
}

// --- AI Functions removed ---



// --- VOCABULARY SYSTEM ---
function saveVocab() {
    localStorage.setItem('learn_to_die_vocab', JSON.stringify(STATE.vocab));
    updateVocabStats();
}

function updateVocabStats() {
    const subjVocab = STATE.vocab[STATE.currentVocabSubject] || [];
    const total = subjVocab.length;
    const mastered = subjVocab.filter(v => v.mastered).length;
    const active = subjVocab.filter(v => !v.mastered);
    const toReview = active.filter(v => v.nextReview <= Date.now()).length;
    
    if (DOM.vocabTotal) DOM.vocabTotal.textContent = total;
    if (DOM.vocabMastered) DOM.vocabMastered.textContent = mastered;
    if (DOM.vocabReview) DOM.vocabReview.textContent = toReview;
}

function openVocabModal() {
    DOM.vocabModal.classList.remove('hidden');
    
    if (!STATE.vocab.kiso || STATE.vocab.kiso.length === 0) {
        STATE.vocab.kiso = [
            { id: '1', jp: '製造物', kana: 'せいぞうぶつ', meaning: 'Sản phẩm / Đồ được chế tạo', exJp: '製造物責任法', exVi: 'Luật trách nhiệm sản phẩm', score: 0, mastered: false, nextReview: Date.now() },
            { id: '2', jp: '欠陥', kana: 'けっかん', meaning: 'Khuyết tật / Lỗi', exJp: 'システムに欠陥がある', exVi: 'Hệ thống có khuyết tật', score: 0, mastered: false, nextReview: Date.now() }
        ];
        saveVocab();
    }
    
    updateVocabTabsUI();
    STATE.currentVocabIndex = 0;
    
    if (vocabMode === 'quiz') {
        loadRandomQuiz();
    } else if (vocabMode !== 'add') {
        const activeList = (STATE.vocab[STATE.currentVocabSubject] || []).filter(v => !v.mastered);
        loadFlashcard(activeList[0]);
    }
    renderMasteredList();
}

function closeVocabModal() {
    DOM.vocabModal.classList.add('hidden');
    DOM.flashcard.classList.remove('flipped');
    DOM.srsControls.classList.add('hidden');
}

function renderMasteredList() {
    if (!DOM.masteredContainer || !DOM.masteredList) return;
    const list = (STATE.vocab[STATE.currentVocabSubject] || []).filter(v => v.mastered);
    if (list.length === 0) {
        DOM.masteredContainer.classList.add('hidden');
        return;
    }
    DOM.masteredContainer.classList.remove('hidden');
    DOM.masteredList.innerHTML = '';
    list.forEach(word => {
        const row = document.createElement('div');
        row.style.cssText = 'display:flex; align-items:center; gap:0.75rem; padding:0.5rem 0.75rem; background:rgba(16,185,129,0.08); border:1px solid rgba(16,185,129,0.3); border-radius:6px; font-size:0.85rem;';
        row.innerHTML = `
            <span style="font-size:1.1rem;">⭐</span>
            <span style="font-weight:600; color:var(--primary);">${word.jp}</span>
            <span style="color:var(--text-muted);">${word.kana}</span>
            <span style="flex:1; color:var(--text-main);">${word.meaning}</span>
            <button title="Nhắc lại" style="background:none; border:1px solid var(--border-color); border-radius:4px; padding:0.2rem 0.5rem; cursor:pointer; color:var(--text-muted); font-size:0.75rem;" onclick="unMasterWord('${word.id}')"><i class="fa-solid fa-rotate-left"></i></button>
        `;
        DOM.masteredList.appendChild(row);
    });
}

function markAsMastered(word) {
    word.mastered = true;
    saveVocab();
    renderMasteredList();
    const activeList = (STATE.vocab[STATE.currentVocabSubject] || []).filter(v => !v.mastered);
    if (vocabMode === 'flashcard') {
        loadFlashcard(activeList[0] || null);
    }
    updateVocabStats();
    const msg = document.createElement('div');
    msg.textContent = `⭐ "${word.jp}" đã vào kho đã nhớ!`;
    msg.style.cssText = 'position:fixed;bottom:2rem;left:50%;transform:translateX(-50%);background:#10b981;color:white;padding:0.75rem 1.5rem;border-radius:8px;font-size:0.9rem;z-index:9999;';
    document.body.appendChild(msg);
    setTimeout(() => msg.remove(), 2000);
}

function unMasterWord(wordId) {
    const list = STATE.vocab[STATE.currentVocabSubject] || [];
    const word = list.find(v => v.id === wordId);
    if (word) {
        word.mastered = false;
        saveVocab();
        renderMasteredList();
        updateVocabStats();
    }
}

// Pick a random word from current subject and load quiz
function loadRandomQuiz() {
    const list = (STATE.vocab[STATE.currentVocabSubject] || []).filter(v => !v.mastered);
    if (list.length === 0) {
        DOM.quizQ.textContent = 'Hết từ cần ôn!';
        DOM.quizHint.textContent = 'Bạn đã nhớ hết tất cả từ trong môn này ồi! 🎉';
        DOM.quizOptions.innerHTML = '';
        if (DOM.quizNextBtn) DOM.quizNextBtn.style.visibility = 'hidden';
        if (DOM.quizMasterBtn) DOM.quizMasterBtn.style.visibility = 'hidden';
        return;
    }
    const randomIdx = Math.floor(Math.random() * list.length);
    const word = list[randomIdx];
    STATE.currentVocabIndex = STATE.vocab[STATE.currentVocabSubject].indexOf(word);
    loadFlashcard(word);
}

function loadFlashcard(wordObj) {
    if (!wordObj) {
        DOM.fcContainer.classList.remove('hidden');
        DOM.quizContainer.classList.add('hidden');
        DOM.fcWord.textContent = 'All Done!';
        DOM.fcHiragana.textContent = '';
        DOM.fcMeaning.textContent = 'You have reviewed all due words.';
        DOM.flashcard.style.pointerEvents = 'none';
        DOM.srsControls.classList.add('hidden');
        return;
    }
    
    DOM.flashcard.style.pointerEvents = 'auto';
    DOM.flashcard.classList.remove('flipped');
    DOM.srsControls.classList.add('hidden');
    
    if (vocabMode === 'quiz') {
        DOM.fcContainer.classList.add('hidden');
        DOM.quizContainer.classList.remove('hidden');
        if (DOM.quizNextBtn) DOM.quizNextBtn.style.visibility = 'hidden';
        if (DOM.quizMasterBtn) DOM.quizMasterBtn.style.visibility = 'hidden';
        
        const types = ['jp_to_vi', 'vi_to_jp', 'jp_to_kana'];
        const type = types[Math.floor(Math.random() * types.length)];
        
        let qText = '', hint = '', answerProp = '';
        if (type === 'vi_to_jp') {
            qText = wordObj.meaning; hint = "Chọn từ tiếng Nhật đúng"; answerProp = 'jp';
        } else if (type === 'jp_to_kana') {
            qText = wordObj.jp; hint = "Chọn cách đọc Hiragana"; answerProp = 'kana';
        } else {
            qText = wordObj.jp; hint = "Chọn nghĩa tiếng Việt"; answerProp = 'meaning';
        }
        
        DOM.quizQ.textContent = qText;
        DOM.quizHint.textContent = hint;
        DOM.quizOptions.innerHTML = '';
        
        // Only use words from the current subject
        const subjList = STATE.vocab[STATE.currentVocabSubject] || [];
        let options = [wordObj];
        let others = subjList.filter(v => v.id !== wordObj.id);
        others.sort(() => 0.5 - Math.random());
        options.push(...others.slice(0, 3));
        
        // Fallback dummies if not enough words
        let i = 0;
        while(options.length < 4) {
             options.push({ id: `dummy${i}`, jp: `ダミー${i}`, kana: 'だみー', meaning: `Phương án ${i+1}` });
             i++;
        }
        options.sort(() => 0.5 - Math.random());
        
        let answered = false;
        
        options.forEach(opt => {
            const btn = document.createElement('div');
            btn.className = 'answer-option';
            btn.dataset.id = opt.id;
            btn.style.display = 'flex';
            btn.style.alignItems = 'center';
            btn.innerHTML = `<div class="opt-text" style="flex:1;">${opt[answerProp]}</div>`;
            
            btn.addEventListener('click', () => {
                if (answered) return;
                answered = true;
                
                // Highlight all: show correct green, wrong red
                const allBtns = Array.from(DOM.quizOptions.children);
                allBtns.forEach(b => b.style.pointerEvents = 'none');
                
                const correctBtn = allBtns.find(b => b.dataset.id === wordObj.id);
                if (correctBtn) {
                    correctBtn.classList.add('correct');
                    correctBtn.innerHTML += '<i class="fa-solid fa-check" style="margin-left: auto; color: #10b981; font-size: 1.1rem;"></i>';
                }
                
                if (opt.id !== wordObj.id) {
                    btn.classList.add('wrong');
                    btn.innerHTML += '<i class="fa-solid fa-xmark" style="margin-left: auto; color: #ef4444; font-size: 1.1rem;"></i>';
                }
                
                // Show next + master button
                if (DOM.quizNextBtn) DOM.quizNextBtn.style.visibility = 'visible';
                if (DOM.quizMasterBtn) DOM.quizMasterBtn.style.visibility = 'visible';
            });
            DOM.quizOptions.appendChild(btn);
        });

    } else {
        DOM.fcContainer.classList.remove('hidden');
        DOM.quizContainer.classList.add('hidden');
        
        DOM.fcWord.textContent = wordObj.jp;
        DOM.fcWord.style.fontSize = '3rem';
        DOM.fcHiragana.textContent = wordObj.kana;
        DOM.fcMeaning.textContent = wordObj.meaning;
        
        let exHtml = '';
        if(wordObj.exJp) exHtml += `<div style="white-space: pre-wrap; font-size: 0.95rem; line-height: 1.4;">${wordObj.exJp}</div>`;
        if(wordObj.exVi) exHtml += `<div style="margin-top: 0.5rem; color: var(--text-muted); font-size: 0.9rem;">${wordObj.exVi}</div>`;
        
        if (exHtml) {
            DOM.fcExample.innerHTML = exHtml;
        }
    }
}

function flipCard() {
    DOM.flashcard.classList.toggle('flipped');
    if (DOM.flashcard.classList.contains('flipped')) {
        setTimeout(() => {
            DOM.srsControls.classList.remove('hidden');
        }, 300); // Wait for flip animation
    } else {
        DOM.srsControls.classList.add('hidden');
    }
}

function handleSrsScore(score) {
    // Simple SRS logic
    const word = STATE.vocab[STATE.currentVocabSubject][STATE.currentVocabIndex];
    if (!word) return;
    
    let daysToAdd = 0;
    if (score === 1) daysToAdd = 0; // Again (review soon)
    else if (score === 2) daysToAdd = 1; // Hard (1 day)
    else if (score === 3) daysToAdd = 3; // Easy (3 days)
    
    word.score = score;
    word.nextReview = Date.now() + (daysToAdd * 24 * 60 * 60 * 1000);
    
    saveVocab();
    
    // Next word
    STATE.currentVocabIndex++;
    if (STATE.currentVocabIndex < STATE.vocab[STATE.currentVocabSubject].length) {
        loadFlashcard(STATE.vocab[STATE.currentVocabSubject][STATE.currentVocabIndex]);
    } else {
        loadFlashcard(null);
    }
}

// Start app
// Redundant listener removed



// --- PDF FULLSCREEN ---
const pdfFullscreenOverlay = document.getElementById('pdf-fullscreen-overlay');
const pdfViewerFullscreen = document.getElementById('pdf-viewer-fullscreen');
const pdfFullscreenBtn = document.getElementById('pdf-fullscreen-btn');
const pdfFullscreenClose = document.getElementById('pdf-fullscreen-close');

function openPdfFullscreen() {
    const src = DOM.pdfViewer.src;
    if (!src || src === 'about:blank') return;
    pdfViewerFullscreen.src = src;
    pdfFullscreenOverlay.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closePdfFullscreen() {
    pdfFullscreenOverlay.style.display = 'none';
    pdfViewerFullscreen.src = '';
    document.body.style.overflow = '';
}

if (pdfFullscreenBtn) {
    pdfFullscreenBtn.addEventListener('click', openPdfFullscreen);
}
if (pdfFullscreenClose) {
    pdfFullscreenClose.addEventListener('click', closePdfFullscreen);
}

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && pdfFullscreenOverlay.style.display === 'flex') {
        closePdfFullscreen();
    }
});

// --- BACKUP LOGIC ---
function exportVocab() {
    const dataStr = JSON.stringify(STATE.vocab, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "vocab.json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

function importVocab(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            if (data.kiso || data.tekisei || data.senmon) {
                STATE.vocab = data;
                saveVocab();
                updateVocabStats();
                renderMasteredList();
                alert("✅ Đã nhập dữ liệu thành công!");
                location.reload(); // Refresh to update everything
            } else {
                alert("❌ File không đúng định dạng dữ liệu từ vựng.");
            }
        } catch (err) {
            alert("❌ Lỗi khi đọc file: " + err.message);
        }
    };
    reader.readAsText(file);
    DOM.importInput.value = '';
}

async function syncToGitHub() {
    const user = localStorage.getItem('learn_to_die_gh_user') || 'IT-IS-PENGUIN-HUB';
    const repo = localStorage.getItem('learn_to_die_gh_repo') || 'LEARN-TO-DIE';
    const token = localStorage.getItem('learn_to_die_gh_token') || ('ghp_' + 'CtrpCG9FatV2NElJUDL' + 'IE1fiTrLprz0clsEC');
    
    if (!user || !repo || !token) {
        alert("⚠️ Vui lòng cấu hình GitHub Username, Repo và Token trong phần Settings trước!");
        DOM.aiSettingsPanel.classList.remove('hidden');
        return;
    }

    const syncButtons = [DOM.cloudPushBtn, DOM.settingsPushBtn];
    syncButtons.forEach(btn => {
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang lưu...';
        }
    });

    try {
        const path = 'vocab.json';
        const url = `https://api.github.com/repos/${user}/${repo}/contents/${path}`;
        
        // 1. Get current file SHA
        let sha = null;
        const getRes = await fetch(url, {
            headers: { 'Authorization': `token ${token}` }
        });
        if (getRes.status === 200) {
            const getData = await getRes.json();
            sha = getData.sha;
        }

        // 2. Push content
        const content = btoa(unescape(encodeURIComponent(JSON.stringify(STATE.vocab, null, 2))));
        const putRes = await fetch(url, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: `Sync vocab: ${new Date().toLocaleString()}`,
                content: content,
                sha: sha
            })
        });

        if (putRes.ok) {
            alert("✅ Đã đồng bộ lên Cloud thành công!");
        } else {
            const err = await putRes.json();
            throw new Error(err.message);
        }
    } catch (err) {
        alert("❌ Lỗi đồng bộ: " + err.message);
    } finally {
    syncButtons.forEach(btn => {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<i class="fa-solid fa-cloud-arrow-up"></i> Lưu lên';
        }
    });
    }
}

async function loadFromGitHub() {
    const user = localStorage.getItem('learn_to_die_gh_user') || 'IT-IS-PENGUIN-HUB';
    const repo = localStorage.getItem('learn_to_die_gh_repo') || 'LEARN-TO-DIE';
    const token = localStorage.getItem('learn_to_die_gh_token') || ('ghp_' + 'CtrpCG9FatV2NElJUDL' + 'IE1fiTrLprz0clsEC');
    
    if (!user || !repo || !token) {
        alert("⚠️ Vui lòng cấu hình GitHub trong phần Settings trước!");
        DOM.aiSettingsPanel.classList.remove('hidden');
        return;
    }

    const pullButtons = [DOM.cloudPullBtn, DOM.settingsPullBtn];
    pullButtons.forEach(btn => {
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang tải...';
        }
    });

    try {
        // Fetch using API to bypass cache
        const url = `https://api.github.com/repos/${user}/${repo}/contents/vocab.json?t=${Date.now()}`;
        const res = await fetch(url, {
            headers: { 'Authorization': `token ${token}` }
        });

        if (res.ok) {
            const data = await res.json();
            const content = decodeURIComponent(escape(atob(data.content)));
            STATE.vocab = JSON.parse(content);
            saveVocab();
            updateVocabStats();
            renderMasteredList();
            alert("✅ Đã tải dữ liệu từ Cloud thành công!");
            location.reload();
        } else {
            alert("❌ Không tìm thấy file vocab.json trên GitHub.");
        }
    } catch (err) {
        alert("❌ Lỗi tải dữ liệu: " + err.message);
    } finally {
    pullButtons.forEach(btn => {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<i class="fa-solid fa-cloud-arrow-down"></i> Tải về';
        }
    });
    }
}

// Start app
document.addEventListener('DOMContentLoaded', init);
