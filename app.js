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
    
    openAiChatBtn: document.getElementById('open-ai-chat-modal'),
    aiChatModal: document.getElementById('ai-chat-modal'),
    closeAiChat: document.getElementById('close-ai-chat'),
    
    aiImageUpload: document.getElementById('ai-image-upload'),
    btnUploadImage: document.getElementById('btn-upload-image'),
    btnCaptureScreen: document.getElementById('btn-capture-screen'),
    aiImagePreviewContainer: document.getElementById('ai-image-preview-container'),
    aiImagePreview: document.getElementById('ai-image-preview'),
    removeAiImage: document.getElementById('remove-ai-image'),
    
    cropModal: document.getElementById('crop-modal'),
    cropCanvas: document.getElementById('crop-canvas'),
    btnCancelCrop: document.getElementById('btn-cancel-crop'),
    btnConfirmCrop: document.getElementById('btn-confirm-crop'),
    
    // AI Settings
    aiSettingsBtn: document.getElementById('ai-settings-btn'),
    aiSettingsPanel: document.getElementById('ai-settings-panel'),
    geminiApiKey: document.getElementById('gemini-api-key'),
    deepseekApiKey: document.getElementById('deepseek-api-key'),
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
    saveNewWordBtn: document.getElementById('save-new-word-btn'),
    addWordMsg: document.getElementById('add-word-msg'),
    
    exportBtn: document.getElementById('export-vocab-btn'),
    importBtn: document.getElementById('import-vocab-btn'),
    importInput: document.getElementById('vocab-import-input'),
    
    cloudPushBtn: document.getElementById('cloud-push-btn'),
    cloudPullBtn: document.getElementById('cloud-pull-btn'),
    
    ghUsername: document.getElementById('gh-username'),
    ghRepo: document.getElementById('gh-repo'),
    ghToken: document.getElementById('gh-token')
};

// --- INITIALIZATION ---
function init() {
    const savedGeminiKey = localStorage.getItem('learn_to_die_gemini_key');
    if (savedGeminiKey && DOM.geminiApiKey) DOM.geminiApiKey.value = savedGeminiKey;
    
    const savedGhUser = localStorage.getItem('learn_to_die_gh_user');
    if (savedGhUser && DOM.ghUsername) DOM.ghUsername.value = savedGhUser;
    
    const savedGhRepo = localStorage.getItem('learn_to_die_gh_repo');
    if (savedGhRepo && DOM.ghRepo) DOM.ghRepo.value = savedGhRepo;
    
    const savedGhToken = localStorage.getItem('learn_to_die_gh_token');
    if (savedGhToken && DOM.ghToken) DOM.ghToken.value = savedGhToken;

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
}

// --- EVENT LISTENERS ---
function setupEventListeners() {
    // Top bar actions
    DOM.themeBtn.addEventListener('click', () => toggleTheme());
    if (DOM.settingsBtn) {
        DOM.settingsBtn.addEventListener('click', () => {
            DOM.aiSettingsPanel.classList.remove('hidden');
        });
    }
    DOM.vocabBtn.addEventListener('click', openVocabModal);
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
    
    // AI Settings
    if(DOM.aiSettingsBtn) {
        DOM.aiSettingsBtn.addEventListener('click', () => {
            DOM.aiSettingsPanel.classList.toggle('hidden');
        });
    }
    if(DOM.saveApiKeyBtn) {
        DOM.saveApiKeyBtn.addEventListener('click', () => {
        if (DOM.geminiApiKey) localStorage.setItem('learn_to_die_gemini_key', DOM.geminiApiKey.value);
        if (DOM.ghUsername) localStorage.setItem('learn_to_die_gh_user', DOM.ghUsername.value);
        if (DOM.ghRepo) localStorage.setItem('learn_to_die_gh_repo', DOM.ghRepo.value);
        if (DOM.ghToken) localStorage.setItem('learn_to_die_gh_token', DOM.ghToken.value);
        
        DOM.aiSettingsPanel.classList.add('hidden');
        alert('Settings saved successfully!');
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

    if (DOM.quickAutoFillBtn) {
        DOM.quickAutoFillBtn.addEventListener('click', async () => {
            const word = DOM.quickWordJp.value.trim();
            if (!word) return;
            
            const apiKey = localStorage.getItem('learn_to_die_gemini_key');
            if (!apiKey) {
                DOM.quickVocabMsg.textContent = 'Missing Gemini API Key in Settings!';
                DOM.quickVocabMsg.style.color = '#ef4444';
                DOM.aiSettingsPanel.classList.remove('hidden');
                return;
            }
            
            DOM.quickAutoFillBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
            DOM.quickAutoFillBtn.disabled = true;
            
            try {
                const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{
                            parts: [{
                                text: `You are a Japanese to Vietnamese dictionary. Given the Japanese word "${word}", return exactly a JSON object in this format: {"kana": "hiragana reading", "meaning": "vietnamese meaning", "example": "A short Japanese example sentence with its Vietnamese translation"}. Do not include any other text or markdown.`
                            }]
                        }],
                        generationConfig: {
                            responseMimeType: "application/json"
                        }
                    })
                });
                
                const data = await response.json();
                DOM.quickAutoFillBtn.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles"></i> AI';
                DOM.quickAutoFillBtn.disabled = false;
                
                if (data.error) {
                    DOM.quickVocabMsg.textContent = 'API Error: ' + data.error.message;
                    DOM.quickVocabMsg.style.color = '#ef4444';
                    return;
                }
                
                let resultText = data.candidates[0].content.parts[0].text;
                resultText = resultText.replace(/```json\n?|```/g, '').trim();
                const result = JSON.parse(resultText);
                
                if (result.kana) DOM.quickWordKana.value = result.kana;
                if (result.meaning) DOM.quickWordVi.value = result.meaning;
                if (result.example && DOM.quickWordEx) DOM.quickWordEx.value = result.example;
                
                DOM.quickVocabMsg.textContent = 'Auto-filled successfully!';
                DOM.quickVocabMsg.style.color = '#10b981';
                setTimeout(() => { DOM.quickVocabMsg.textContent = ''; }, 2000);
            } catch (err) {
                DOM.quickAutoFillBtn.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles"></i> AI';
                DOM.quickAutoFillBtn.disabled = false;
                DOM.quickVocabMsg.textContent = 'Error: ' + err.message;
                DOM.quickVocabMsg.style.color = '#ef4444';
            }
        });
    }
    
    // AI Interactions (Modal)
    DOM.openAiChatBtn.addEventListener('click', () => {
        DOM.aiChatModal.classList.remove('hidden');
    });
    DOM.closeAiChat.addEventListener('click', () => {
        DOM.aiChatModal.classList.add('hidden');
    });
    
    DOM.sendTranslateBtn.addEventListener('click', () => handleAiChat('translate'));
    DOM.sendExplainBtn.addEventListener('click', () => handleAiChat('explain'));
    if (DOM.btnCaptureScreen) {
        DOM.btnCaptureScreen.addEventListener('click', captureScreen);
    }
    DOM.aiInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleAiChat('explain');
        }
    });
    
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
                exJp: '',
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
    } else {
        DOM.pdfViewer.src = 'about:blank';
        simulateAiResponse('Sorry, the PDF for this exam is not available.');
    }
    
    window.scrollTo(0, 0);
}

// --- AI CHAT WITH GEMINI ---
let currentAttachedImage = null;

async function handleAiChat(mode = 'explain') {
    const text = DOM.aiInput.value.trim();
    if (!text && !currentAttachedImage) return;
    
    const apiKey = localStorage.getItem('learn_to_die_gemini_key');
    if (!apiKey) {
        simulateAiResponse('⚠️ Vui lòng nhập Gemini API Key trong phần Settings (biểu tượng bánh răng) trước khi chat.');
        DOM.aiSettingsPanel.classList.remove('hidden');
        return;
    }
    
    DOM.aiInput.value = '';
    
    // Append user message
    const userMsg = document.createElement('div');
    userMsg.style.background = 'var(--primary)';
    userMsg.style.color = '#fff';
    userMsg.style.padding = '0.75rem 1rem';
    userMsg.style.borderRadius = '1.2rem 1.2rem 0 1.2rem';
    userMsg.style.alignSelf = 'flex-end';
    userMsg.style.maxWidth = '85%';
    userMsg.style.boxShadow = '0 4px 12px rgba(var(--primary-rgb), 0.3)';
    
    if (text) {
        const textSpan = document.createElement('div');
        textSpan.style.whiteSpace = 'pre-wrap';
        textSpan.textContent = text;
        userMsg.appendChild(textSpan);
    }
    
    if (currentAttachedImage) {
        const imgNode = document.createElement('img');
        imgNode.src = currentAttachedImage;
        imgNode.style.maxWidth = '100%';
        imgNode.style.borderRadius = '4px';
        imgNode.style.marginTop = text ? '0.5rem' : '0';
        userMsg.appendChild(imgNode);
    }
    
    DOM.aiResponse.appendChild(userMsg);
    
    // Scroll to bottom
    DOM.aiResponse.scrollTop = DOM.aiResponse.scrollHeight;
    
    // Add typing indicator
    const thinkingMsg = document.createElement('div');
    thinkingMsg.className = 'typing-indicator';
    thinkingMsg.style.alignSelf = 'flex-start';
    thinkingMsg.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> AI đang suy nghĩ...';
    thinkingMsg.style.color = 'var(--primary)';
    DOM.aiResponse.appendChild(thinkingMsg);
    
    const parts = [];
    let promptTemplate = '';
    
    if (mode === 'translate') {
        promptTemplate = "Hãy dịch đoạn văn bản tiếng Nhật sau (hoặc văn bản trong ảnh) sang tiếng Việt một cách chính xác. CHỈ DỊCH, không giải thích thêm.";
    } else {
        promptTemplate = "Bạn là chuyên gia ôn thi Gijutsushi-ho (技術士補). Hãy giải thích câu hỏi trong văn bản hoặc ảnh đính kèm bằng tiếng Việt, đưa ra đáp án đúng và giải thích lý do tại sao đáp án đó đúng.";
    }

    if (text) {
        parts.push({ text: `${promptTemplate}\n\n${text}` });
    } else {
        parts.push({ text: `${promptTemplate}` });
    }
    
    if (currentAttachedImage) {
        const base64Data = currentAttachedImage.split(',')[1];
        const mimeType = currentAttachedImage.match(/data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+).*,.*/)[1];
        parts.push({
            inlineData: {
                mimeType: mimeType,
                data: base64Data
            }
        });
        
        currentAttachedImage = null;
        DOM.aiImagePreviewContainer.classList.add('hidden');
    }
    
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: parts }]
            })
        });
        
        const data = await response.json();
        thinkingMsg.remove();
        
        if (data.error) {
            simulateAiResponse(`API Error: ${data.error.message}`);
            return;
        }
        
        const replyText = data.candidates[0].content.parts[0].text;
        
        const aiMsg = document.createElement('div');
        aiMsg.style.background = 'var(--card-bg)';
        aiMsg.style.border = '1px solid var(--border-color)';
        aiMsg.style.padding = '0.5rem 1rem';
        aiMsg.style.borderRadius = '1rem 1rem 1rem 0';
        aiMsg.style.alignSelf = 'flex-start';
        aiMsg.style.maxWidth = '90%';
        // Simple markdown parsing for bold and line breaks
        aiMsg.innerHTML = replyText
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\n/g, '<br>');
            
        DOM.aiResponse.appendChild(aiMsg);
        DOM.aiResponse.scrollTop = DOM.aiResponse.scrollHeight;
        
    } catch (err) {
        thinkingMsg.remove();
        simulateAiResponse(`Error connecting to AI: ${err.message}`);
    }
}

function simulateAiResponse(text) {
    const aiMsg = document.createElement('div');
    aiMsg.style.background = 'var(--card-bg)';
    aiMsg.style.border = '1px solid var(--border-color)';
    aiMsg.style.padding = '0.75rem 1rem';
    aiMsg.style.borderRadius = '0 1.2rem 1.2rem 1.2rem';
    aiMsg.style.alignSelf = 'flex-start';
    aiMsg.style.maxWidth = '90%';
    aiMsg.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
    aiMsg.style.lineHeight = '1.5';
    aiMsg.innerHTML = text;
    DOM.aiResponse.appendChild(aiMsg);
    DOM.aiResponse.scrollTop = DOM.aiResponse.scrollHeight;
}

async function captureScreen() {
    try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const video = document.createElement('video');
        video.srcObject = stream;
        video.play();
        
        video.onloadedmetadata = () => {
            setTimeout(() => {
                const canvas = document.createElement('canvas');
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                
                const imageData = canvas.toDataURL('image/jpeg');
                
                // Stop all tracks
                stream.getTracks().forEach(track => track.stop());
                
                // Convert to file to use existing crop logic
                fetch(imageData)
                    .then(res => res.blob())
                    .then(blob => {
                        const file = new File([blob], "screenshot.jpg", { type: "image/jpeg" });
                        openCropModal(file);
                    });
            }, 500); // Small delay to ensure frame is ready
        };
    } catch (err) {
        console.error("Error capturing screen: ", err);
        if (err.name !== 'NotAllowedError') {
            alert("Không thể chụp màn hình: " + err.message);
        }
    }
}



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
document.addEventListener('DOMContentLoaded', init);

// --- IMAGE CROP LOGIC ---
let cropImg = new Image();
let cropStartX = 0, cropStartY = 0, cropCurrentX = 0, cropCurrentY = 0;
let isCropping = false;

DOM.btnUploadImage.addEventListener('click', () => DOM.aiImageUpload.click());

DOM.aiImageUpload.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) {
        openCropModal(e.target.files[0]);
    }
});

window.addEventListener('paste', (e) => {
    if (DOM.aiChatModal.classList.contains('hidden')) return;
    const items = (e.clipboardData || e.originalEvent.clipboardData).items;
    for (let item of items) {
        if (item.type.indexOf('image') === 0) {
            const file = item.getAsFile();
            openCropModal(file);
            e.preventDefault();
            break;
        }
    }
});

function openCropModal(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        cropImg.onload = () => {
            initCropCanvas();
            DOM.cropModal.classList.remove('hidden');
        };
        cropImg.src = e.target.result;
    };
    reader.readAsDataURL(file);
    DOM.aiImageUpload.value = ''; 
}

function initCropCanvas() {
    DOM.cropCanvas.width = cropImg.naturalWidth;
    DOM.cropCanvas.height = cropImg.naturalHeight;
    redrawCrop();
}

function redrawCrop() {
    const ctx = DOM.cropCanvas.getContext('2d');
    ctx.clearRect(0, 0, DOM.cropCanvas.width, DOM.cropCanvas.height);
    ctx.drawImage(cropImg, 0, 0);
    
    if (isCropping || (cropStartX !== cropCurrentX && cropStartY !== cropCurrentY)) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, DOM.cropCanvas.width, DOM.cropCanvas.height);
        
        const x = Math.min(cropStartX, cropCurrentX);
        const y = Math.min(cropStartY, cropCurrentY);
        const w = Math.abs(cropCurrentX - cropStartX);
        const h = Math.abs(cropCurrentY - cropStartY);
        
        ctx.save();
        ctx.beginPath();
        ctx.rect(x, y, w, h);
        ctx.clip();
        ctx.drawImage(cropImg, 0, 0);
        ctx.restore();
        
        ctx.strokeStyle = '#3a86ff';
        ctx.lineWidth = 2 * (DOM.cropCanvas.width / DOM.cropCanvas.clientWidth);
        ctx.strokeRect(x, y, w, h);
    }
}

function getCanvasPos(e) {
    const rect = DOM.cropCanvas.getBoundingClientRect();
    const scaleX = DOM.cropCanvas.width / rect.width;
    const scaleY = DOM.cropCanvas.height / rect.height;
    
    let clientX = e.clientX;
    let clientY = e.clientY;
    if (e.touches && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
    }
    
    return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY
    };
}

DOM.cropCanvas.addEventListener('mousedown', startCrop);
DOM.cropCanvas.addEventListener('touchstart', startCrop, {passive: false});

DOM.cropCanvas.addEventListener('mousemove', moveCrop);
DOM.cropCanvas.addEventListener('touchmove', moveCrop, {passive: false});

DOM.cropCanvas.addEventListener('mouseup', endCrop);
DOM.cropCanvas.addEventListener('touchend', endCrop);

function startCrop(e) {
    isCropping = true;
    const pos = getCanvasPos(e);
    cropStartX = pos.x;
    cropStartY = pos.y;
    cropCurrentX = pos.x;
    cropCurrentY = pos.y;
    redrawCrop();
}

function moveCrop(e) {
    if (!isCropping) return;
    if(e.cancelable) e.preventDefault(); 
    const pos = getCanvasPos(e);
    cropCurrentX = pos.x;
    cropCurrentY = pos.y;
    redrawCrop();
}

function endCrop(e) {
    isCropping = false;
}

DOM.btnCancelCrop.addEventListener('click', () => {
    DOM.cropModal.classList.add('hidden');
    cropStartX = cropStartY = cropCurrentX = cropCurrentY = 0;
});

DOM.btnConfirmCrop.addEventListener('click', () => {
    let x = Math.min(cropStartX, cropCurrentX);
    let y = Math.min(cropStartY, cropCurrentY);
    let w = Math.abs(cropCurrentX - cropStartX);
    let h = Math.abs(cropCurrentY - cropStartY);
    
    if (w < 10 || h < 10) {
        currentAttachedImage = cropImg.src;
    } else {
        const tCanvas = document.createElement('canvas');
        tCanvas.width = w;
        tCanvas.height = h;
        const tCtx = tCanvas.getContext('2d');
        tCtx.drawImage(cropImg, x, y, w, h, 0, 0, w, h);
        currentAttachedImage = tCanvas.toDataURL('image/jpeg', 0.8);
    }
    
    DOM.aiImagePreview.src = currentAttachedImage;
    DOM.aiImagePreviewContainer.classList.remove('hidden');
    DOM.cropModal.classList.add('hidden');
    cropStartX = cropStartY = cropCurrentX = cropCurrentY = 0;
});

DOM.removeAiImage.addEventListener('click', () => {
    currentAttachedImage = null;
    DOM.aiImagePreviewContainer.classList.add('hidden');
});

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
    const user = localStorage.getItem('learn_to_die_gh_user');
    const repo = localStorage.getItem('learn_to_die_gh_repo');
    const token = localStorage.getItem('learn_to_die_gh_token');
    
    if (!user || !repo || !token) {
        alert("⚠️ Vui lòng cấu hình GitHub Username, Repo và Token trong phần Settings trước!");
        DOM.aiSettingsPanel.classList.remove('hidden');
        return;
    }

    DOM.cloudPushBtn.disabled = true;
    DOM.cloudPushBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang lưu...';

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
        DOM.cloudPushBtn.disabled = false;
        DOM.cloudPushBtn.innerHTML = '<i class="fa-solid fa-cloud-arrow-up"></i> Lưu lên';
    }
}

async function loadFromGitHub() {
    const user = localStorage.getItem('learn_to_die_gh_user');
    const repo = localStorage.getItem('learn_to_die_gh_repo');
    const token = localStorage.getItem('learn_to_die_gh_token');
    
    if (!user || !repo || !token) {
        alert("⚠️ Vui lòng cấu hình GitHub trong phần Settings trước!");
        DOM.aiSettingsPanel.classList.remove('hidden');
        return;
    }

    DOM.cloudPullBtn.disabled = true;
    DOM.cloudPullBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang tải...';

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
        DOM.cloudPullBtn.disabled = false;
        DOM.cloudPullBtn.innerHTML = '<i class="fa-solid fa-cloud-arrow-down"></i> Tải về';
    }
}
