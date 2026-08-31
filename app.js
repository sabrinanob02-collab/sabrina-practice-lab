(function () {
  const APP_CONFIG = typeof PRACTICE_LAB_CONFIG !== "undefined" ? PRACTICE_LAB_CONFIG : {};
  const STORAGE_NAMESPACE = APP_CONFIG.storageNamespace || "law-school-practice-lab-starter";
  const STORAGE_KEY = `${STORAGE_NAMESPACE}-progress-v1`;
  const THEME_KEY = `${STORAGE_NAMESPACE}-theme`;
  const SRS_KEY = `${STORAGE_NAMESPACE}-srs`;
  const DEFAULT_STATS = { answered: 0, correct: 0, missed: {}, flagged: {}, byTopic: {}, history: [] };
  const warnedMissingFullRule = new Set();

  const state = {
    sessionQuestions: [],
    currentIndex: -1,
    answers: {},
    current: null,
    answeredCurrent: false,
    sessionActive: false,
    timerId: null,
    timerEndsAt: 0,
    timerUrgentAnnounced: false,
    sessionTotal: 0,
    sessionAnswered: 0,
    sessionCorrect: 0,
    sessionStartedAt: null,
    sessionTopicStats: {}
  };

  const els = {
    courseMultiBtn: document.getElementById("courseMultiBtn"),
    courseMultiPopover: document.getElementById("courseMultiPopover"),
    modeSelect: document.getElementById("modeSelect"),
    setSelect: document.getElementById("setSelect"),
    topicSelect: document.getElementById("topicSelect"),
    timerSelect: document.getElementById("timerSelect"),
    sessionSizeSelect: document.getElementById("sessionSizeSelect"),
    startBtn: document.getElementById("startBtn"),
    shareAppBtn: document.getElementById("shareAppBtn"),
    themeToggleBtn: document.getElementById("themeToggleBtn"),
    resetStatsBtn: document.getElementById("resetStatsBtn"),
    answeredStat: document.getElementById("answeredStat"),
    accuracyStat: document.getElementById("accuracyStat"),
    missedStat: document.getElementById("missedStat"),
    flaggedStat: document.getElementById("flaggedStat"),
    timerStat: document.getElementById("timerStat"),
    courseChart: document.getElementById("courseChart"),
    weakList: document.getElementById("weakList"),
    reviewSuggestion: document.getElementById("reviewSuggestion"),
    sourceSummary: document.getElementById("sourceSummary"),
    coursePill: document.getElementById("coursePill"),
    topicPill: document.getElementById("topicPill"),
    typePill: document.getElementById("typePill"),
    difficultyPill: document.getElementById("difficultyPill"),
    progressPill: document.getElementById("progressPill"),
    difficultyFilter: document.getElementById("difficultyFilter"),
    questionText: document.getElementById("questionText"),
    answerList: document.getElementById("answerList"),
    feedbackBox: document.getElementById("feedbackBox"),
    feedbackTitle: document.getElementById("feedbackTitle"),
    feedbackCase: document.getElementById("feedbackCase"),
    feedbackRule: document.getElementById("feedbackRule"),
    feedbackApplication: document.getElementById("feedbackApplication"),
    feedbackConclusion: document.getElementById("feedbackConclusion"),
    feedbackSource: document.getElementById("feedbackSource"),
    flagBtn: document.getElementById("flagBtn"),
    revealBtn: document.getElementById("revealBtn"),
    skipBtn: document.getElementById("skipBtn"),
    liveStatus: document.getElementById("liveStatus"),
    backBtn: document.getElementById("backBtn"),
    endSessionBtn: document.getElementById("endSessionBtn"),
    nextBtn: document.getElementById("nextBtn")
  };

  const saved = loadStats();
  const srsData = loadSRS();
  let currentTheme = loadTheme();

  function loadStats() {
    try {
      return normalizeStats(JSON.parse(localStorage.getItem(STORAGE_KEY)));
    } catch {
      return normalizeStats();
    }
  }

  function normalizeStats(stats) {
    return {
      ...DEFAULT_STATS,
      ...(stats || {}),
      missed: (stats && stats.missed) || {},
      flagged: (stats && stats.flagged) || {},
      byTopic: (stats && stats.byTopic) || {},
      history: (stats && stats.history) || []
    };
  }

  function saveStats() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
  }

  function loadSRS() {
    try {
      return JSON.parse(localStorage.getItem(SRS_KEY)) || {};
    } catch {
      return {};
    }
  }

  function saveSRS() {
    localStorage.setItem(SRS_KEY, JSON.stringify(srsData));
  }

  function updateSRS(questionId, correct) {
    const now = new Date().toISOString();
    const entry = srsData[questionId] || { interval: 0, easeFactor: 2.5, repetitions: 0 };
    if (correct) {
      entry.repetitions += 1;
      if (entry.repetitions === 1) entry.interval = 1;
      else if (entry.repetitions === 2) entry.interval = 6;
      else entry.interval = Math.round(entry.interval * entry.easeFactor);
      const quality = 4;
      entry.easeFactor = Math.max(1.3, entry.easeFactor + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    } else {
      entry.repetitions = 0;
      entry.interval = 1;
      entry.easeFactor = Math.max(1.3, entry.easeFactor - 0.2);
    }
    entry.lastAnswered = now;
    const dueDate = new Date(now);
    dueDate.setDate(dueDate.getDate() + entry.interval);
    entry.nextDue = dueDate.toISOString();
    srsData[questionId] = entry;
    saveSRS();
  }

  function getSRSDueQuestions(pool) {
    const now = new Date().toISOString();
    const due = [];
    const unseen = [];
    for (const q of pool) {
      const entry = srsData[q.id];
      if (!entry) {
        unseen.push(q);
      } else if (entry.nextDue <= now) {
        due.push(q);
      }
    }
    due.sort((a, b) => {
      const ea = srsData[a.id];
      const eb = srsData[b.id];
      return ea.nextDue.localeCompare(eb.nextDue);
    });
    return [...due, ...shuffle(unseen)];
  }

  function getSRSDueCount() {
    const now = new Date().toISOString();
    let count = 0;
    for (const id of Object.keys(srsData)) {
      if (srsData[id].nextDue && srsData[id].nextDue <= now) count += 1;
    }
    return count;
  }

  function getSelectedDifficulties() {
    const checks = [...els.difficultyFilter.querySelectorAll("input[type='checkbox']")];
    const selected = checks.filter(cb => cb.checked).map(cb => cb.value);
    return new Set(selected.length ? selected : ["easy", "medium", "hard"]);
  }

  function loadTheme() {
    const savedTheme = localStorage.getItem(THEME_KEY);
    if (savedTheme === "dark" || savedTheme === "light") return savedTheme;
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  function saveTheme(theme) {
    localStorage.setItem(THEME_KEY, theme);
  }

  function shuffle(items) {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function makeCourseOption(value, text, checked) {
    const label = document.createElement("label");
    label.className = "course-multi-option";
    const input = document.createElement("input");
    input.type = "checkbox";
    input.value = value;
    input.checked = checked;
    const span = document.createElement("span");
    span.textContent = text;
    label.append(input, span);
    return label;
  }

  function getSelectedCourses() {
    const allBox = els.courseMultiPopover.querySelector("input[value='all']");
    if (allBox && allBox.checked) return new Set();
    return new Set(
      [...els.courseMultiPopover.querySelectorAll("input:not([value='all'])")].filter(cb => cb.checked).map(cb => cb.value)
    );
  }

  function updateCourseBtnLabel() {
    const selected = getSelectedCourses();
    const total = [...els.courseMultiPopover.querySelectorAll("input:not([value='all'])")].length;
    if (selected.size === 0 || selected.size === total) {
      els.courseMultiBtn.textContent = "All courses";
    } else if (selected.size === 1) {
      els.courseMultiBtn.textContent = [...selected][0];
    } else {
      els.courseMultiBtn.textContent = `${selected.size} of ${total} courses`;
    }
  }

  function initCourseMulti() {
    const courses = [...new Set(FINALS_QUESTIONS.map(q => q.course))].sort();
    const popover = els.courseMultiPopover;

    const allOption = makeCourseOption("all", "All courses", true);
    allOption.classList.add("all-option");
    popover.appendChild(allOption);
    courses.forEach(course => popover.appendChild(makeCourseOption(course, course, false)));

    els.courseMultiBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const willOpen = els.courseMultiPopover.hidden;
      els.courseMultiPopover.hidden = !willOpen;
      els.courseMultiBtn.setAttribute("aria-expanded", String(willOpen));
    });

    popover.addEventListener("change", () => {
      const allBox = popover.querySelector("input[value='all']");
      const courseBoxes = [...popover.querySelectorAll("input:not([value='all'])")];
      const anySpecificChecked = courseBoxes.some(cb => cb.checked);
      const allSpecificChecked = courseBoxes.every(cb => cb.checked);
      if (!anySpecificChecked || allSpecificChecked) {
        allBox.checked = true;
        courseBoxes.forEach(cb => { cb.checked = false; });
      } else {
        allBox.checked = false;
      }
      updateCourseBtnLabel();
      refreshTopicOptions();
    });

    document.addEventListener("click", (e) => {
      if (!e.target.closest("#courseMulti")) {
        els.courseMultiPopover.hidden = true;
        els.courseMultiBtn.setAttribute("aria-expanded", "false");
      }
    });
  }

  function init() {
    document.title = APP_CONFIG.appTitle || "Law School Practice Lab";
    const title = document.getElementById("appTitle");
    const eyebrow = document.getElementById("semesterEyebrow");
    if (title) title.textContent = APP_CONFIG.appTitle || "Law School Practice Lab";
    if (eyebrow) eyebrow.textContent = `${APP_CONFIG.semesterLabel || "Your Semester"} · ${APP_CONFIG.tagline || "source-locked drills"}`;
    applyTheme();
    initCourseMulti();
    initSetOptions();
    refreshTopicOptions();

    els.startBtn.addEventListener("click", startSession);
    els.nextBtn.addEventListener("click", showNextQuestion);
    els.backBtn.addEventListener("click", showPreviousQuestion);
    els.endSessionBtn.addEventListener("click", endSession);
    els.shareAppBtn.addEventListener("click", shareApp);
    els.themeToggleBtn.addEventListener("click", toggleTheme);
    els.flagBtn.addEventListener("click", toggleFlag);
    els.revealBtn.addEventListener("click", revealAnswer);
    els.skipBtn.addEventListener("click", skipQuestion);
    els.resetStatsBtn.addEventListener("click", resetStats);
    els.timerSelect.addEventListener("change", renderQuestionTools);
    els.setSelect.addEventListener("change", refreshTopicOptions);
    document.addEventListener("keydown", handleKeys);
    renderStats();
    renderCourseChart();
    renderWeakAreas();
    registerServiceWorker();
  }

  function getFilteredPool() {
    const selectedCourses = getSelectedCourses();
    const selectedDifficulties = getSelectedDifficulties();
    const mode = els.modeSelect.value;
    let pool = FINALS_QUESTIONS.filter(q => selectedCourses.size === 0 || selectedCourses.has(q.course));
    if (els.setSelect.value !== "all") pool = pool.filter(q => q.set === els.setSelect.value);
    if (els.topicSelect.value !== "all") pool = pool.filter(q => q.topic === els.topicSelect.value);
    pool = pool.filter(q => selectedDifficulties.has(q.difficulty || "medium"));

    if (mode === "missed") {
      pool = pool.filter(q => saved.missed[q.id]);
    }

    if (mode === "flagged") {
      pool = pool.filter(q => saved.flagged[q.id]);
    }

    if (mode === "weak") {
      const weakTopics = Object.entries(saved.byTopic)
        .filter(([, v]) => v.wrong > 0)
        .sort((a, b) => (b[1].wrong / Math.max(1, b[1].seen)) - (a[1].wrong / Math.max(1, a[1].seen)))
        .slice(0, 8)
        .map(([topic]) => topic);
      pool = weakTopics.length ? pool.filter(q => weakTopics.includes(topicKey(q))) : [];
    }

    if (mode === "spaced") {
      return getSRSDueQuestions(pool);
    }

    return shuffle(pool);
  }

  function initSetOptions() {
    [...new Set(FINALS_QUESTIONS.map(q => q.set))].sort().forEach(set => {
      const option = document.createElement("option");
      option.value = set;
      const count = FINALS_QUESTIONS.filter(q => q.set === set).length;
      option.textContent = `${set} (${count} questions)`;
      els.setSelect.appendChild(option);
    });
  }

  function refreshTopicOptions() {
    const previous = els.topicSelect.value;
    const selectedCourses = getSelectedCourses();
    let pool = FINALS_QUESTIONS.filter(q => selectedCourses.size === 0 || selectedCourses.has(q.course));
    if (els.setSelect.value !== "all") pool = pool.filter(q => q.set === els.setSelect.value);
    const topics = [...new Set(pool.map(q => q.topic))].sort();
    els.topicSelect.replaceChildren();
    const all = document.createElement("option");
    all.value = "all";
    all.textContent = "All topics";
    els.topicSelect.appendChild(all);
    topics.forEach(topic => {
      const option = document.createElement("option");
      option.value = topic;
      option.textContent = topic;
      els.topicSelect.appendChild(option);
    });
    els.topicSelect.value = topics.includes(previous) ? previous : "all";
  }

  function startSession() {
    clearTimer("Off");
    state.current = null;
    state.answeredCurrent = false;
    const filtered = getFilteredPool();
    const requestedSize = els.sessionSizeSelect.value === "all" ? filtered.length : Number(els.sessionSizeSelect.value);
    state.sessionQuestions = filtered.slice(0, Math.min(requestedSize, filtered.length));
    state.currentIndex = -1;
    state.answers = {};
    state.sessionTotal = state.sessionQuestions.length;
    state.sessionAnswered = 0;
    state.sessionCorrect = 0;
    state.sessionStartedAt = Date.now();
    state.sessionTopicStats = {};
    state.sessionActive = state.sessionTotal > 0;

    if (!state.sessionTotal) {
      els.questionText.textContent = getEmptyStateMessage();
      els.answerList.replaceChildren();
      els.feedbackBox.hidden = true;
      els.coursePill.textContent = "";
      els.topicPill.textContent = "";
      els.typePill.textContent = "";
      els.difficultyPill.textContent = "";
      els.difficultyPill.removeAttribute("data-difficulty");
      els.progressPill.textContent = "";
      hideFlagButton();
      hideQuestionTools();
      updateSessionControls();
      els.nextBtn.disabled = true;
      els.liveStatus.textContent = els.questionText.textContent;
      return;
    }
    showNextQuestion();
  }

  function showNextQuestion() {
    clearTimer();
    if (!state.sessionActive) return;
    const nextIndex = state.currentIndex + 1;
    if (nextIndex >= state.sessionTotal) {
      renderSessionSummary();
      return;
    }
    state.currentIndex = nextIndex;
    state.current = state.sessionQuestions[state.currentIndex];
    const snapshot = state.answers[state.current.id];
    state.answeredCurrent = Boolean(snapshot);
    renderQuestion(state.current, snapshot);
    if (snapshot) {
      clearTimer(Number(els.timerSelect.value) ? "Paused" : "Off");
    } else {
      startTimer();
    }
  }

  function showPreviousQuestion() {
    if (!state.sessionActive || state.currentIndex <= 0) return;
    clearTimer(Number(els.timerSelect.value) ? "Paused" : "Off");
    state.currentIndex -= 1;
    state.current = state.sessionQuestions[state.currentIndex];
    const snapshot = state.answers[state.current.id];
    state.answeredCurrent = Boolean(snapshot);
    renderQuestion(state.current, snapshot);
    els.liveStatus.textContent = "Reviewing previous question.";
  }

  function renderQuestion(q, snapshot) {
    els.coursePill.textContent = q.course;
    els.topicPill.textContent = q.topic;
    els.typePill.textContent = q.type === "tf" ? "True/False" : `${q.choices.length} choices`;
    const diff = q.difficulty || "medium";
    els.difficultyPill.textContent = diff.charAt(0).toUpperCase() + diff.slice(1);
    els.difficultyPill.dataset.difficulty = diff;
    renderProgressPill();
    els.questionText.textContent = q.prompt;
    els.answerList.replaceChildren();
    els.feedbackBox.hidden = true;
    renderFlagButton();
    renderQuestionTools();
    updateSessionControls();

    q.choices.forEach((choice, index) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "answer-btn";
      btn.dataset.index = String(index);
      btn.setAttribute("aria-label", `Choice ${index + 1}: ${choice}`);
      const key = document.createElement("span");
      key.className = "answer-key";
      key.textContent = String(index + 1);
      const text = document.createElement("span");
      text.textContent = choice;
      btn.append(key, text);
      btn.addEventListener("click", () => answer(index));
      if (snapshot) {
        btn.disabled = true;
        btn.tabIndex = -1;
        if (index === q.correctIndex) btn.classList.add("correct");
        if (index === snapshot.selectedIndex && !snapshot.correct) btn.classList.add("incorrect");
      }
      els.answerList.appendChild(btn);
    });

    if (snapshot) {
      renderFeedback(q, snapshot);
      els.nextBtn.disabled = false;
      syncNextBtnLabel();
      updateSessionControls();
    }
  }

  function answer(index, forcedTimeout, revealMode) {
    if (!state.current || state.answeredCurrent) return;
    state.answeredCurrent = true;
    clearTimer(Number(els.timerSelect.value) ? "Done" : "Off");

    const q = state.current;
    const correct = index === q.correctIndex && !forcedTimeout && !revealMode;
    const snapshot = {
      selectedIndex: index,
      correct,
      forcedTimeout: Boolean(forcedTimeout),
      revealMode: revealMode || "",
      at: new Date().toISOString()
    };
    state.answers[q.id] = snapshot;
    saved.answered += 1;
    if (correct) saved.correct += 1;

    const key = topicKey(q);
    saved.byTopic[key] = saved.byTopic[key] || { seen: 0, wrong: 0 };
    saved.byTopic[key].seen += 1;
    state.sessionAnswered += 1;
    if (correct) state.sessionCorrect += 1;
    state.sessionTopicStats[key] = state.sessionTopicStats[key] || { seen: 0, wrong: 0 };
    state.sessionTopicStats[key].seen += 1;
    if (!correct) {
      saved.byTopic[key].wrong += 1;
      state.sessionTopicStats[key].wrong += 1;
      saved.missed[q.id] = true;
    } else {
      delete saved.missed[q.id];
    }

    saved.history.push({ id: q.id, correct, at: snapshot.at });
    saved.history = saved.history.slice(-250);
    saveStats();
    updateSRS(q.id, correct);

    [...els.answerList.children].forEach((btn, i) => {
      btn.disabled = true;
      btn.tabIndex = -1;
      if (i === q.correctIndex) btn.classList.add("correct");
      if (i === index && !correct) btn.classList.add("incorrect");
    });

    renderFeedback(q, snapshot);
    els.nextBtn.disabled = false;
    syncNextBtnLabel();
    renderQuestionTools();
    updateSessionControls();
    els.nextBtn.focus();
    renderProgressPill();
    renderStats();
    renderWeakAreas();
    renderCourseChart();
  }

  function extractFeedbackSection(text, label) {
    if (!text) return "";
    const next = "Authorities?|Authority|Rule|Application|Conclusion|Explanation";
    const re = new RegExp(`(?:^|\\s)${label}:\\s*([\\s\\S]*?)(?=\\s+(?:${next}):|$)`, "i");
    const m = text.match(re);
    return m ? m[1].trim() : "";
  }

  function renderFeedback(q, snapshot) {
    const revealMode = snapshot.revealMode;
    els.feedbackTitle.textContent = snapshot.correct ? "Correct" : snapshot.forcedTimeout ? "Time" : revealMode === "skip" ? "Skipped" : revealMode ? "Revealed" : "Not quite";
    els.feedbackTitle.className = `feedback-title ${snapshot.correct ? "good" : "bad"}`;
    els.feedbackCase.textContent = q.caseRef || "No specific case reference";
    els.feedbackRule.textContent = q.rule;
    els.feedbackApplication.textContent = q.application || extractFeedbackSection(q.explanation, "Application") || q.explanation;
    els.feedbackConclusion.textContent = q.conclusion || extractFeedbackSection(q.explanation, "Conclusion");
    els.feedbackSource.textContent = q.source;
    els.feedbackBox.hidden = false;
  }

  function toggleFlag() {
    if (!state.current) return;
    const id = state.current.id;
    let message;
    if (saved.flagged[id]) {
      delete saved.flagged[id];
      message = "Flag removed.";
    } else {
      saved.flagged[id] = true;
      message = "Question flagged for review.";
    }
    saveStats();
    renderFlagButton();
    renderStats();
    els.liveStatus.textContent = message;
  }

  function renderFlagButton() {
    if (!state.current) {
      hideFlagButton();
      return;
    }
    const isFlagged = Boolean(saved.flagged[state.current.id]);
    els.flagBtn.hidden = false;
    els.flagBtn.disabled = false;
    els.flagBtn.setAttribute("aria-pressed", String(isFlagged));
    els.flagBtn.textContent = isFlagged ? "Flagged for review" : "Flag for review";
  }

  function hideFlagButton() {
    els.flagBtn.hidden = true;
    els.flagBtn.disabled = true;
    els.flagBtn.setAttribute("aria-pressed", "false");
    els.flagBtn.textContent = "Flag for review";
  }

  function renderQuestionTools() {
    const timed = Number(els.timerSelect.value) > 0;
    els.revealBtn.hidden = timed;
    els.skipBtn.hidden = timed;
    const hasSnapshot = state.current && state.answers[state.current.id];
    els.revealBtn.disabled = timed || state.answeredCurrent || hasSnapshot || !state.current;
    els.skipBtn.disabled = timed || state.answeredCurrent || hasSnapshot || !state.current;
  }

  function hideQuestionTools() {
    els.revealBtn.hidden = true;
    els.skipBtn.hidden = true;
    els.revealBtn.disabled = true;
    els.skipBtn.disabled = true;
  }

  function triggerNoAnswer(mode) {
    if (Number(els.timerSelect.value) || !state.current || state.answeredCurrent) return;
    answer(-1, false, mode);
  }

  function revealAnswer() { triggerNoAnswer("reveal"); }
  function skipQuestion() { triggerNoAnswer("skip"); }

  function toggleTheme() {
    currentTheme = currentTheme === "dark" ? "light" : "dark";
    saveTheme(currentTheme);
    applyTheme();
  }

  function applyTheme() {
    document.documentElement.dataset.theme = currentTheme;
    const dark = currentTheme === "dark";
    els.themeToggleBtn.setAttribute("aria-pressed", String(dark));
    els.themeToggleBtn.textContent = dark ? "Light theme" : "Dark theme";
    const themeMeta = document.querySelector("meta[name='theme-color']");
    if (themeMeta) themeMeta.setAttribute("content", dark ? "#17222c" : "#0e6f68");
  }

  async function shareApp() {
    const shareUrl = window.location.href.split("#")[0];
    const shareData = {
      title: APP_CONFIG.appTitle || "Law School Practice Lab",
      text: "Practice source-locked law-school questions with this offline-ready drill app.",
      url: shareUrl
    };

    try {
      if (navigator.share && (!navigator.canShare || navigator.canShare(shareData))) {
        await navigator.share(shareData);
        announceShareResult("Share sheet opened.");
        return;
      }

      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(shareUrl);
        announceShareResult("Link copied.");
        return;
      }

      window.prompt(`Copy this link to share ${APP_CONFIG.appTitle || "Law School Practice Lab"}:`, shareUrl);
      announceShareResult("Share link ready.");
    } catch (error) {
      if (error && error.name === "AbortError") return;
      announceShareResult("Sharing was not available.");
    }
  }

  function announceShareResult(message) {
    els.liveStatus.textContent = message;
    els.shareAppBtn.textContent = message === "Link copied." ? "Copied" : "Share";
    els.shareAppBtn.classList.toggle("is-success", message === "Link copied.");
    window.setTimeout(() => {
      els.shareAppBtn.textContent = "Share";
      els.shareAppBtn.classList.remove("is-success");
    }, 1800);
  }

  function registerServiceWorker() {
    if (!("serviceWorker" in navigator) || window.location.protocol === "file:") return;
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("service-worker.js").catch(() => {
        els.liveStatus.textContent = "Offline install is unavailable in this browser.";
      });
    });
  }

  function startTimer() {
    const seconds = Number(els.timerSelect.value);
    if (!seconds) {
      els.timerStat.textContent = "Off";
      els.timerStat.removeAttribute("data-timer-urgent");
      state.timerUrgentAnnounced = false;
      return;
    }
    state.timerUrgentAnnounced = false;
    state.timerEndsAt = Date.now() + seconds * 1000;
    updateTimerDisplay();
    state.timerId = window.setInterval(() => {
      const remaining = updateTimerDisplay();
      if (remaining <= 0) {
        answer(-1, true);
      }
    }, 250);
  }

  function clearTimer(statusText) {
    if (state.timerId) window.clearInterval(state.timerId);
    state.timerId = null;
    state.timerUrgentAnnounced = false;
    els.timerStat.removeAttribute("data-timer-urgent");
    if (typeof statusText === "string") {
      els.timerStat.textContent = statusText;
    }
  }

  function updateTimerDisplay() {
    const remaining = Math.max(0, Math.ceil((state.timerEndsAt - Date.now()) / 1000));
    els.timerStat.textContent = `${remaining}s`;
    if (remaining <= 10) {
      els.timerStat.setAttribute("data-timer-urgent", "true");
      if (!state.timerUrgentAnnounced && remaining > 0) {
        els.liveStatus.textContent = `${remaining} seconds remaining.`;
        state.timerUrgentAnnounced = true;
      }
    } else {
      els.timerStat.removeAttribute("data-timer-urgent");
    }
    renderProgressPill(remaining);
    return remaining;
  }

  function handleKeys(event) {
    if (document.querySelector("dialog[open]")) return;
    if (event.target && event.target.tagName === "SUMMARY") return;
    if (event.key === "Escape" && !els.courseMultiPopover.hidden) {
      els.courseMultiPopover.hidden = true;
      els.courseMultiBtn.setAttribute("aria-expanded", "false");
      els.courseMultiBtn.focus();
      return;
    }
    if (!state.current) return;
    if (/^[1-9]$/.test(event.key)) {
      if (state.answeredCurrent) return;
      const index = Number(event.key) - 1;
      if (index < state.current.choices.length) answer(index);
    }
    if (event.key === "Enter" && !els.nextBtn.disabled) showNextQuestion();
    if (event.key === "ArrowLeft" && !els.backBtn.disabled) showPreviousQuestion();
  }

  function syncNextBtnLabel() {
    els.nextBtn.textContent = state.currentIndex >= state.sessionTotal - 1 ? "Summary" : "Next";
  }

  function renderProgressPill(remaining) {
    if (!state.current || !state.sessionTotal) {
      els.progressPill.textContent = "";
      return;
    }
    const currentNumber = Math.max(1, Math.min(state.currentIndex + 1, state.sessionTotal));
    const activeTimer = Number(els.timerSelect.value) && state.timerId;
    const timerText = activeTimer ? ` - ${remaining ?? Math.max(0, Math.ceil((state.timerEndsAt - Date.now()) / 1000))}s remaining` : "";
    els.progressPill.textContent = `Question ${currentNumber} of ${state.sessionTotal}${timerText}`;
  }

  function endSession() {
    if (!state.sessionActive) return;
    renderSessionSummary();
  }

  function renderSessionSummary() {
    clearTimer(Number(els.timerSelect.value) ? "Done" : "Off");
    const elapsedSeconds = state.sessionStartedAt ? Math.round((Date.now() - state.sessionStartedAt) / 1000) : 0;
    const minutes = Math.floor(elapsedSeconds / 60);
    const seconds = String(elapsedSeconds % 60).padStart(2, "0");
    const accuracy = Math.round((state.sessionCorrect / Math.max(1, state.sessionAnswered)) * 100);
    const weakest = Object.entries(state.sessionTopicStats)
      .filter(([, v]) => v.wrong > 0)
      .sort((a, b) => b[1].wrong - a[1].wrong)
      .slice(0, 4);
    const topicsDrilled = Object.entries(state.sessionTopicStats)
      .sort((a, b) => b[1].seen - a[1].seen || a[0].localeCompare(b[0]))
      .map(([topic, v]) => `${topic} (${v.seen} seen, ${v.wrong} missed)`);

    state.current = null;
    state.answeredCurrent = false;
    state.sessionActive = false;
    hideQuestionTools();
    els.coursePill.textContent = "Session complete";
    els.topicPill.textContent = "";
    els.typePill.textContent = "";
    els.difficultyPill.textContent = "";
    els.difficultyPill.removeAttribute("data-difficulty");
    els.progressPill.textContent = `${state.sessionAnswered} of ${state.sessionTotal}`;
    els.questionText.textContent = "Session summary";
    const summary = document.createElement("div");
    summary.className = "session-summary";
    summary.setAttribute("role", "region");
    summary.setAttribute("aria-live", "assertive");
    summary.setAttribute("aria-label", "Session complete");
    summary.tabIndex = -1;

    const summaryGrid = document.createElement("div");
    summaryGrid.className = "summary-grid";
    [
      ["Answered", String(state.sessionAnswered)],
      ["Accuracy", `${accuracy}%`],
      ["Time", `${minutes}:${seconds}`]
    ].forEach(([label, value]) => {
      const item = document.createElement("div");
      const itemLabel = document.createElement("span");
      itemLabel.textContent = label;
      const itemValue = document.createElement("strong");
      itemValue.textContent = value;
      item.append(itemLabel, itemValue);
      summaryGrid.appendChild(item);
    });

    const topics = document.createElement("p");
    topics.textContent = `Topics drilled: ${topicsDrilled.length ? topicsDrilled.join("; ") : "None"}`;
    const weak = document.createElement("p");
    weak.textContent = weakest.length
      ? `Highest-yield review: ${weakest.map(([topic, v]) => `${topic} (${v.wrong}/${v.seen})`).join("; ")}`
      : "No misses in this session.";
    const spaced = document.createElement("p");
    spaced.textContent = `Spaced review: ${getSRSDueCount()} questions due for review.`;

    summary.append(summaryGrid, topics, weak, spaced);
    els.answerList.replaceChildren(summary);
    els.feedbackBox.hidden = true;
    hideFlagButton();
    updateSessionControls();
    els.nextBtn.textContent = "Next";
    if (summary && typeof summary.focus === "function") {
      summary.focus();
    }
  }

  function updateSessionControls() {
    const hasActiveSession = state.sessionActive && state.sessionTotal > 0;
    els.backBtn.disabled = !hasActiveSession || state.currentIndex <= 0;
    els.endSessionBtn.disabled = !hasActiveSession;
    els.nextBtn.disabled = !hasActiveSession || (!state.answeredCurrent && !(state.current && state.answers[state.current.id]));
  }

  function renderStats() {
    els.answeredStat.textContent = String(saved.answered);
    els.accuracyStat.textContent = `${Math.round((saved.correct / Math.max(1, saved.answered)) * 100)}%`;
    els.missedStat.textContent = String(Object.keys(saved.missed).length);
    els.flaggedStat.textContent = String(Object.keys(saved.flagged).length);
  }

  function renderCourseChart() {
    const totals = {};
    const idToCourse = {};
    for (const q of FINALS_QUESTIONS) {
      totals[q.course] = (totals[q.course] || 0) + 1;
      idToCourse[q.id] = q.course;
    }
    const courseStats = {};
    for (const entry of saved.history) {
      const course = idToCourse[entry.id];
      if (!course) continue;
      if (!courseStats[course]) courseStats[course] = { answered: 0, correct: 0 };
      courseStats[course].answered++;
      if (entry.correct) courseStats[course].correct++;
    }
    const abbrev = c => c.replace("Civil Procedure II", "Civ Pro II").replace("Civil Procedure I", "Civ Pro I").replace("Constitutional Law I", "Con Law I");
    els.courseChart.replaceChildren();
    Object.entries(totals).forEach(([course, total]) => {
      const s = courseStats[course] || { answered: 0, correct: 0 };
      const progressPct = Math.round((s.answered / total) * 100);
      const accPct = s.answered > 0 ? Math.round((s.correct / s.answered) * 100) : null;
      const colorClass = accPct === null ? "" : accPct >= 80 ? "bar-good" : accPct >= 60 ? "bar-warn" : "bar-bad";
      const label = accPct === null ? `${total} Qs` : `${accPct}% acc`;
      const row = document.createElement("div");
      row.className = "bar-row";
      const name = document.createElement("span");
      name.textContent = abbrev(course);
      const bar = document.createElement("div");
      bar.className = "bar";
      const fill = document.createElement("span");
      fill.className = colorClass;
      fill.style.width = `${progressPct}%`;
      bar.appendChild(fill);
      const value = document.createElement("strong");
      value.textContent = label;
      row.append(name, bar, value);
      els.courseChart.appendChild(row);
    });
    els.sourceSummary.textContent = `${FINALS_QUESTIONS.length} questions from ${FINALS_SOURCE_DOCS.length} packs.`;
  }

  function renderWeakAreas() {
    const weak = Object.entries(saved.byTopic)
      .filter(([, v]) => v.wrong > 0)
      .sort((a, b) => b[1].wrong - a[1].wrong)
      .slice(0, 5);
    els.weakList.replaceChildren();
    const items = weak.length ? weak : [["No misses yet.", null]];
    items.forEach(([topic, v]) => {
      const li = document.createElement("li");
      li.textContent = v ? `${topic} (${v.wrong}/${v.seen})` : topic;
      els.weakList.appendChild(li);
    });
    els.reviewSuggestion.textContent = getReviewSuggestion(weak);
  }

  function resetStats() {
    const previouslyFocused = document.activeElement;
    const dialog = document.createElement("dialog");
    dialog.setAttribute("role", "alertdialog");
    dialog.setAttribute("aria-modal", "true");
    dialog.setAttribute("aria-labelledby", "reset-dialog-title");
    dialog.setAttribute("aria-describedby", "reset-dialog-description");
    dialog.innerHTML = `
      <div style="padding: 1.5rem;">
        <h2 id="reset-dialog-title">Reset Progress</h2>
        <p id="reset-dialog-description">This will permanently delete all saved drill progress, stats, and history. This action cannot be undone.</p>
        <div style="display: flex; gap: 1rem; margin-top: 1.5rem; justify-content: flex-end;">
          <button type="button" class="ghost" id="reset-cancel">Cancel</button>
          <button type="button" class="btn-danger" id="reset-confirm">Reset All</button>
        </div>
      </div>
    `;
    document.body.appendChild(dialog);
    dialog.showModal();

    const confirmBtn = dialog.querySelector("#reset-confirm");
    const cancelBtn = dialog.querySelector("#reset-cancel");
    const trapFocus = (event) => {
      if (event.key !== "Tab") return;
      const focusables = [cancelBtn, confirmBtn].filter(Boolean);
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    cancelBtn.focus();

    const doReset = () => {
      clearTimer("Off");
      resetSessionState();
      saved.answered = 0;
      saved.correct = 0;
      saved.missed = {};
      saved.flagged = {};
      saved.byTopic = {};
      saved.history = [];
      saveStats();
      Object.keys(srsData).forEach(k => delete srsData[k]);
      saveSRS();
      renderFlagButton();
      hideQuestionTools();
      updateSessionControls();
      renderStats();
      renderWeakAreas();
      els.questionText.textContent = "Choose a verified set or mixed session and start drilling.";
      els.answerList.replaceChildren();
      els.feedbackBox.hidden = true;
      els.coursePill.textContent = "";
      els.topicPill.textContent = "";
      els.typePill.textContent = "";
      els.difficultyPill.textContent = "";
      els.difficultyPill.removeAttribute("data-difficulty");
      els.progressPill.textContent = "";
      closeDialog();
      els.liveStatus.textContent = "Progress reset.";
    };

    const closeDialog = () => {
      dialog.close();
      document.body.removeChild(dialog);
      if (previouslyFocused && typeof previouslyFocused.focus === "function") {
        previouslyFocused.focus();
      }
    };

    confirmBtn.addEventListener("click", doReset, { once: true });
    cancelBtn.addEventListener("click", closeDialog);
    dialog.addEventListener("keydown", trapFocus);
    dialog.addEventListener("cancel", closeDialog);
  }

  function topicKey(q) {
    return `${q.course}: ${q.topic}`;
  }

  function resetSessionState() {
    clearTimer("Off");
    state.sessionQuestions = [];
    state.currentIndex = -1;
    state.answers = {};
    state.current = null;
    state.answeredCurrent = false;
    state.sessionActive = false;
    state.timerEndsAt = 0;
    state.timerUrgentAnnounced = false;
    state.sessionTotal = 0;
    state.sessionAnswered = 0;
    state.sessionCorrect = 0;
    state.sessionStartedAt = null;
    state.sessionTopicStats = {};
  }

  function getEmptyStateMessage() {
    const mode = els.modeSelect.value;
    if (mode === "weak") return "No weak areas yet. Use mixed mode to build a record first.";
    if (mode === "missed") return "No missed questions yet. Missed review will unlock after an incorrect answer.";
    if (mode === "flagged") return "No flagged questions yet. Flag questions during a session to review them here.";
    if (mode === "spaced") return "No questions due for spaced review yet. Answer some questions first, then come back later.";
    return "No questions match that setup yet.";
  }

  function getReviewSuggestion(weak) {
    if (!weak.length) {
      return "Start with mixed mode. Once you miss a few, this panel will point to the highest-yield review target.";
    }

    const [topic, stats] = weak[0];
    const rate = Math.round((stats.wrong / Math.max(1, stats.seen)) * 100);
    return `Drill ${topic} next. Your saved miss rate there is ${rate}%, so missed review or weak-area mode should pay off quickly.`;
  }

  init();
})();
