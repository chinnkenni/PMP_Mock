// PMP 模拟考试构建脚本
// 用法: node build-exam.js
// 扫描 md 目录下所有 .md 文件，自动生成 pmp-mock-exam.html

const fs = require("fs");
const path = require("path");

// ===== 配置 =====
const MD_DIR = path.join(__dirname, "questions");
const OUTPUT = path.join(__dirname, "docs", "index.html");

// ===== 解析单个 md 文件 =====
function parseMD(filePath) {
  const content = fs.readFileSync(filePath, "utf-8").replace(/\$([^$]+)\$/g, function(m, p1) { return p1.replace(/\\%/g, "%"); });
  const lines = content.split(/\r?\n/);

  let questions = [];
  let currentQ = null;
  let answerStartLine = -1;

  // 解析题目区域
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // 检测答案区开始
    if (/^#\s*答案与解析/.test(line)) {
      answerStartLine = i;
      break;
    }

    // 题目行
    const qMatch = line.match(/^(\d+)[、．.]\s*(.+)/);
    if (qMatch) {
      if (currentQ) questions.push(currentQ);
      currentQ = {
        number: parseInt(qMatch[1]),
        text: qMatch[2].trim(),
        options: [],
        answer: null,
        explanation: "",
      };
      continue;
    }

    // 选项行
    const oMatch = line.match(/^([A-D])[、．.、]\s*(.+)/);
    if (oMatch && currentQ) {
      currentQ.options.push({ letter: oMatch[1], text: oMatch[2].trim() });
      continue;
    }

    // 续行
    if (currentQ) {
      if (currentQ.options.length === 0) {
        currentQ.text += " " + line;
      } else {
        const subNum = line.match(/^(\d+)\.\s*(.+)/);
        if (!subNum) currentQ.options[currentQ.options.length - 1].text += " " + line;
      }
    }
  }
  if (currentQ) questions.push(currentQ);

  // 解析答案和解析
  if (answerStartLine >= 0) {
    for (let i = answerStartLine; i < lines.length; i++) {
      const line = lines[i].trim();
      const aMatch = line.match(/^#?\s*(\d+)[、．.]\s*答案[：:.、。]*\s*([A-D])/);
      if (aMatch) {
        const num = parseInt(aMatch[1]);
        const q = questions.find((q) => q.number === num);
        if (q) q.answer = aMatch[2];

        // 查找解析
        for (let j = i + 1; j < lines.length; j++) {
          const el = lines[j].trim();
          if (!el) continue;
          const eMatch = el.match(/^解析[：:]\s*(.+)/);
          if (eMatch && q) q.explanation = eMatch[1].trim();
          break;
        }
      }
    }
  }

  // 从文件名提取标题
  const title = path
    .basename(filePath, ".md")
    .replace(/^[第]/, "")
    .trim();

  return {
    title: title,
    questions: questions.filter((q) => q.answer && q.options.length >= 2),
  };
}

// ===== 扫描目录 =====
function buildExam() {
  const mdFiles = fs
    .readdirSync(MD_DIR)
    .filter((f) => f.endsWith(".md"))
    .sort()
    .map((f) => path.join(MD_DIR, f));

  console.log("Found " + mdFiles.length + " md file(s):");
  mdFiles.forEach((f) => console.log("  " + path.basename(f)));

  const parts = [];
  let totalQuestions = 0;

  mdFiles.forEach((file) => {
    const part = parseMD(file);
    console.log(
      "  -> " + part.questions.length + " valid questions from " + path.basename(file)
    );
    parts.push(part);
    totalQuestions += part.questions.length;
  });

  console.log("Total: " + totalQuestions + " questions");

  // Generate HTML
  const html = generateHTML(parts, totalQuestions);
  fs.writeFileSync(OUTPUT, html, "utf-8");
  console.log("Output: " + OUTPUT);
}

// ===== 生成 HTML =====
function generateHTML(parts, totalCount) {
  const questionsJSON = JSON.stringify(parts);

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>PMP 模拟考试</title>
<script src="https://cdn.tailwindcss.com"><\/script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<script>
tailwind.config={theme:{extend:{colors:{primary:'#4F46E5','primary-light':'#818CF8','primary-dark':'#3730A3',cta:'#22C55E','cta-dark':'#16A34A',surface:'#EEF2FF','surface-card':'#FFFFFF',ink:'#312E81','ink-light':'#475569','ink-muted':'#94A3B8',correct:'#16A34A',wrong:'#DC2626','wrong-bg':'#FEF2F2','correct-bg':'#F0FDF4'},fontFamily:{sans:['"Noto Sans SC"','system-ui','sans-serif']}}}}
<\/script>
<style>
@keyframes fadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
@keyframes pulseGlow{0%,100%{transform:scale(1)}50%{transform:scale(1.05)}}
.fade-in{animation:fadeIn .4s ease-out}.pulse-glow{animation:pulseGlow 2s ease-in-out infinite}
@media(prefers-reduced-motion:reduce){.fade-in,.pulse-glow{animation:none}}
.option-btn{transition:all 200ms ease}.option-btn:hover:not(.disabled){transform:translateX(4px)}
.timer-warning{animation:pulseGlow 1s ease-in-out infinite;color:#DC2626!important}.timer-warning svg{color:#DC2626!important}
</style>
</head>
<body class="bg-surface min-h-screen font-sans text-ink">

<!-- ========== START SCREEN ========== -->
<div id="startScreen" class="min-h-screen flex items-center justify-center px-4">
<div class="max-w-lg w-full bg-surface-card rounded-2xl shadow-xl p-8 md:p-12 text-center fade-in">
  <div class="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
    <svg class="w-10 h-10 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5"/></svg>
  </div>
  <h1 class="text-3xl md:text-4xl font-bold text-primary-dark mb-3">PMP 模拟考试</h1>
  <p class="text-ink-light text-lg mb-2" id="examSubtitle">全部题库</p>
  <div class="flex items-center justify-center gap-6 text-sm text-ink-muted mb-8">
    <span class="flex items-center gap-1.5">
      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
      <span id="totalBadge">${totalCount}</span> 道题
    </span>
    <span class="flex items-center gap-1.5">
      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
      约 <span id="timeEstimate">90</span> 分钟
    </span>
  </div>

  <!-- Part selector -->
  <div class="mb-6">
    <label class="block text-sm font-medium text-ink-light mb-3">选择考试范围</label>
    <div class="flex flex-col gap-2" id="partSelector">
      <label class="flex items-center gap-3 p-3 rounded-xl border-2 border-primary bg-primary/5 cursor-pointer transition-colors hover:bg-primary/10">
        <input type="radio" name="part" value="all" checked class="accent-primary">
        <span class="text-sm font-medium">全部题目 (${totalCount}题)</span>
      </label>
    </div>
  </div>

  <!-- Question count -->
  <div class="mb-8">
    <label class="block text-sm font-medium text-ink-light mb-3">选择题数</label>
    <div class="flex items-center justify-center gap-3 flex-wrap">
      <button onclick="setQCount(10)" class="qcount-btn px-4 py-2 rounded-lg border-2 border-primary/20 text-sm font-medium cursor-pointer hover:border-primary/50 transition-colors" data-count="10">10 题</button>
      <button onclick="setQCount(20)" class="qcount-btn px-4 py-2 rounded-lg border-2 border-primary/20 text-sm font-medium cursor-pointer hover:border-primary/50 transition-colors" data-count="20">20 题</button>
      <button onclick="setQCount(30)" class="qcount-btn px-4 py-2 rounded-lg border-2 border-primary/20 text-sm font-medium cursor-pointer hover:border-primary/50 transition-colors" data-count="30">30 题</button>
      <button onclick="setQCount(0)" class="qcount-btn px-4 py-2 rounded-lg border-2 border-primary text-sm font-medium bg-primary/5 cursor-pointer hover:border-primary/50 transition-colors active" data-count="0">全部</button>
    </div>
  </div>

  <div class="mb-6">
    <label class="flex items-center gap-4 p-4 rounded-2xl border-2 border-gray-100 bg-white shadow-sm cursor-pointer select-none hover:shadow-md transition-all">
      <div class="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
        <svg class="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
      </div>
      <div class="flex-1 min-w-0">
        <span class="text-sm font-semibold text-ink">打乱答案顺序</span>
        <p class="text-xs text-ink-muted mt-0.5">随机排列 A/B/C/D 选项，避免记住选项位置</p>
      </div>
      <div class="relative shrink-0">
        <input type="checkbox" id="shuffleToggle" class="sr-only peer" onchange="shuffleOptions=this.checked">
        <div class="w-11 h-6 bg-gray-200 rounded-full peer-checked:bg-primary transition-colors"></div>
        <div class="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform peer-checked:translate-x-5"></div>
      </div>
    </label>
  </div>
<!-- Mode buttons -->
  <div class="mb-8">
    <label class="block text-sm font-medium text-ink-light mb-3">选择模式</label>
    <div class="grid grid-cols-3 gap-3">
      <button onclick="startExam()" class="bg-primary hover:bg-primary-dark text-white font-semibold py-3 rounded-xl transition-colors cursor-pointer shadow-lg shadow-primary/25 flex flex-col items-center gap-1">
        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
        <span class="text-sm">普通练习</span>
      </button>
      <button id="drillBtn" onclick="startDrill()" class="bg-amber-500 hover:bg-amber-600 text-white font-semibold py-3 rounded-xl transition-colors cursor-pointer shadow-lg shadow-amber-500/25 flex flex-col items-center gap-1">
        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>
        <span class="text-sm">错题专项</span>
      </button>
      <button id="mixBtn" onclick="startMix()" class="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-xl transition-colors cursor-pointer shadow-lg shadow-purple-600/25 flex flex-col items-center gap-1">
        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/></svg>
        <span class="text-sm">混合练习</span>
      </button>
    </div>
  </div>

  <!-- Mistake bank card -->
  <div id="mistakeCard" class="hidden bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 cursor-pointer hover:bg-amber-100 transition-colors" onclick="showMistakeBook()">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 bg-amber-200 rounded-lg flex items-center justify-center">
          <svg class="w-5 h-5 text-amber-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>
        </div>
        <div class="text-left">
          <p class="text-sm font-semibold text-amber-800">错题本</p>
          <p class="text-xs text-amber-600">共 <span id="mistakeCountText">0</span> 道错题待复习</p>
        </div>
      </div>
      <svg class="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
    </div>
  </div>
</div>
</div>

<!-- ========== EXAM SCREEN ========== -->
<div id="examScreen" class="hidden min-h-screen">
<header class="sticky top-0 z-50 bg-surface-card/95 backdrop-blur-sm border-b border-primary/10 shadow-sm">
  <div class="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
    <span class="text-sm font-medium text-ink-light">第 <span id="currentNum" class="text-primary font-bold">1</span> / <span id="totalNum">${totalCount}</span> 题</span>
    <div id="timerDisplay" class="flex items-center gap-1.5 text-sm font-mono font-semibold text-primary">
      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
      <span id="timerText">90:00</span>
    </div>
    <button id="topSubmitBtn" onclick="handleTopSubmit()" class="text-sm font-medium text-cta hover:text-cta-dark transition-colors cursor-pointer flex items-center gap-1">
      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
      交卷
    </button>
  </div>
  <div class="h-1 bg-primary/10"><div id="progressBar" class="h-full bg-gradient-to-r from-primary to-primary-light transition-all duration-500 ease-out" style="width:0%"></div></div>
</header>

<main class="max-w-4xl mx-auto px-4 py-6 md:py-10">
  <div id="questionArea" class="bg-surface-card rounded-2xl shadow-md p-6 md:p-10 fade-in">
    <p id="partLabel" class="text-xs text-primary-light font-medium mb-3"></p>
    <h2 id="questionText" class="text-lg md:text-xl font-medium leading-relaxed mb-8"></h2>
    <div id="optionsArea" class="space-y-3"></div>
    <div id="explanationArea" class="hidden mt-6 p-4 rounded-xl bg-primary/5 border border-primary/10">
      <p id="explanationText" class="text-sm text-ink-light leading-relaxed"></p>
    </div>
  </div>

  <div class="flex items-center justify-between mt-6">
    <button id="prevBtn" onclick="prevQuestion()" class="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-primary/20 text-primary font-medium hover:bg-primary/5 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed">
      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>上一题
    </button>
    <button id="markBtn" onclick="toggleMark()" class="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-yellow-400/40 text-yellow-600 font-medium hover:bg-yellow-50 transition-colors cursor-pointer" title="标记此题">
      <svg id="markIcon" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"/></svg>
      <span id="markText">标记</span>
    </button>
    <button id="nextBtn" onclick="nextQuestion()" class="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white font-medium hover:bg-primary-dark transition-colors cursor-pointer">
      下一题<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
    </button>
  </div>

  <div class="mt-6 text-center">
    <button onclick="toggleQuestionMap()" class="text-sm text-primary-light hover:text-primary transition-colors cursor-pointer flex items-center gap-1 mx-auto">
      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"/></svg>题目导航
    </button>
  </div>
  <div id="questionMap" class="hidden mt-4 bg-surface-card rounded-2xl shadow-md p-6 fade-in">
    <div class="flex flex-wrap gap-2" id="questionMapGrid"></div>
    <div id="timeRankList" class="space-y-2 mt-4 hidden"></div>
    <div class="flex items-center gap-4 mt-4 text-xs text-ink-muted">
      <span class="flex items-center gap-1"><span class="w-3 h-3 rounded bg-primary inline-block"></span>已答</span>
      <span class="flex items-center gap-1"><span class="w-3 h-3 rounded bg-yellow-400 inline-block"></span>标记</span>
      <span class="flex items-center gap-1"><span class="w-3 h-3 rounded bg-gray-200 inline-block"></span>未答</span>
    </div>
  </div>
</main>
</div>

<!-- ========== RESULT SCREEN ========== -->
<div id="resultScreen" class="hidden min-h-screen flex items-center justify-center px-4 py-10">
<div class="max-w-2xl w-full fade-in">
  <div class="bg-surface-card rounded-2xl shadow-xl p-8 md:p-12 text-center mb-6">
    <div id="scoreEmoji" class="text-6xl mb-4"></div>
    <h2 class="text-2xl font-bold text-ink mb-2">考试结果</h2>
    <div class="my-8">
      <div class="relative w-40 h-40 mx-auto">
        <svg class="w-full h-full -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="52" fill="none" stroke="#E0E7FF" stroke-width="8"/>
          <circle id="scoreCircle" cx="60" cy="60" r="52" fill="none" stroke="#4F46E5" stroke-width="8" stroke-linecap="round" stroke-dasharray="326.73" stroke-dashoffset="326.73" style="transition:stroke-dashoffset 1.5s ease-out"/>
        </svg>
        <div class="absolute inset-0 flex flex-col items-center justify-center">
          <span id="scorePercent" class="text-4xl font-bold text-primary">0%</span>
          <span class="text-xs text-ink-muted">正确率</span>
        </div>
      </div>
    </div>
    <div class="grid grid-cols-3 gap-4 text-center">
      <div class="bg-correct-bg rounded-xl p-4"><p id="correctCount" class="text-2xl font-bold text-correct">0</p><p class="text-xs text-ink-muted mt-1">正确</p></div>
      <div class="bg-wrong-bg rounded-xl p-4"><p id="wrongCount" class="text-2xl font-bold text-wrong">0</p><p class="text-xs text-ink-muted mt-1">错误</p></div>
      <div class="bg-primary/5 rounded-xl p-4"><p id="unansweredCount" class="text-2xl font-bold text-primary">0</p><p class="text-xs text-ink-muted mt-1">未答</p></div>
    </div>
    <div class="mt-6 flex items-center justify-center gap-1 text-sm text-ink-muted">
      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
      用时 <span id="timeUsed">0:00</span>
    </div>
  </div>
  <div id="timeDetailSection" class="hidden bg-surface-card rounded-2xl shadow-xl p-6 md:p-8 mb-6">
    <h3 class="text-lg font-bold text-ink mb-1 flex items-center gap-2">
      每题停留时长
    </h3>
    <p class="text-xs text-ink-muted mb-4">按停留时间从长到短排列，帮助发现薄弱知识点</p>
    <div id="timeDetailList" class="space-y-2 max-h-80 overflow-y-auto pr-1"></div>
  </div>
  <div class="flex gap-3">
    <button onclick="reviewExam()" class="flex-1 bg-primary hover:bg-primary-dark text-white font-semibold py-3 rounded-xl transition-colors cursor-pointer shadow-lg shadow-primary/25">查看解析</button>
    <button onclick="restartExam()" class="flex-1 border-2 border-primary text-primary font-semibold py-3 rounded-xl hover:bg-primary/5 transition-colors cursor-pointer">重新考试</button>
  </div>
</div>
</div>

<!-- ========== MISTAKE BOOK SCREEN ========== -->
<div id="mistakeBookScreen" class="hidden min-h-screen">
<header class="sticky top-0 z-50 bg-surface-card/95 backdrop-blur-sm border-b border-primary/10 shadow-sm">
  <div class="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
    <button onclick="hideMistakeBook()" class="flex items-center gap-1 text-primary font-medium text-sm cursor-pointer hover:text-primary-dark transition-colors">
      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
      返回
    </button>
    <h2 class="text-lg font-bold text-ink">错题本</h2>
    <button onclick="confirmClearMistakes()" class="text-sm text-wrong font-medium cursor-pointer hover:text-red-700 transition-colors">清空</button>
  </div>
</header>
<main class="max-w-4xl mx-auto px-4 py-6">
  <div id="mistakeList"></div>
</main>
</div>

<!-- ========== CLEAR MISTAKES CONFIRM ========== -->
<div id="clearConfirmModal" class="hidden fixed inset-0 z-[100] flex items-center justify-center px-4 bg-black/40 backdrop-blur-sm">
<div class="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full text-center fade-in">
  <div class="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
    <svg class="w-7 h-7 text-wrong" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
  </div>
  <h3 class="text-xl font-bold text-ink mb-2">清空错题本？</h3>
  <p class="text-ink-light text-sm mb-6">所有记录的错题将被删除，此操作不可撤销。</p>
  <div class="flex gap-3">
    <button onclick="document.getElementById('clearConfirmModal').classList.add('hidden')" class="flex-1 border border-gray-200 text-ink-light font-medium py-2.5 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer">取消</button>
    <button onclick="doClearMistakes()" class="flex-1 bg-wrong text-white font-medium py-2.5 rounded-xl hover:bg-red-700 transition-colors cursor-pointer">确认清空</button>
  </div>
</div>
</div>
<!-- ========== CONFIRM MODAL ========== -->
<div id="confirmModal" class="hidden fixed inset-0 z-[100] flex items-center justify-center px-4 bg-black/40 backdrop-blur-sm">
<div class="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full text-center fade-in">
  <div class="w-14 h-14 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
    <svg class="w-7 h-7 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"/></svg>
  </div>
  <h3 class="text-xl font-bold text-ink mb-2">确认交卷？</h3>
  <p id="confirmText" class="text-ink-light text-sm mb-6"></p>
  <div class="flex gap-3">
    <button onclick="closeModal()" class="flex-1 border border-gray-200 text-ink-light font-medium py-2.5 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer">继续答题</button>
    <button onclick="submitExam()" class="flex-1 bg-cta text-white font-medium py-2.5 rounded-xl hover:bg-cta-dark transition-colors cursor-pointer">确认交卷</button>
  </div>
</div>
</div>

<script>
// Exam data - generated from md files
var EXAM_PARTS = ${questionsJSON};

// State
var examQuestions=[], selectedPart='all', selectedQCount=0, currentIndex=0, shuffleOptions=false;
var userAnswers={}, questionTimers={}, lastQuestionTime=0, markedQuestions=new Set(), timerInterval=null, timeLeft=0, startTime=null;
var examFinished=false, reviewMode=false, shuffledOptionsCache=null, frozenTimers=null, timedQuestionIndex=-1;

// Build part selector
(function(){
  var sel=document.getElementById('partSelector');
  EXAM_PARTS.forEach(function(part,idx){
    var label=document.createElement('label');
    label.className='flex items-center gap-3 p-3 rounded-xl border-2 border-gray-200 cursor-pointer transition-colors hover:bg-gray-50';
    label.innerHTML='<input type="radio" name="part" value="'+idx+'" class="accent-primary"><span class="text-sm font-medium">'+part.title+' ('+part.questions.length+'题)</span>';
    sel.appendChild(label);
  });
  sel.addEventListener('change',function(e){
    document.querySelectorAll('#partSelector label').forEach(function(l){l.className='flex items-center gap-3 p-3 rounded-xl border-2 border-gray-200 cursor-pointer transition-colors hover:bg-gray-50';});
    e.target.closest('label').className='flex items-center gap-3 p-3 rounded-xl border-2 border-primary bg-primary/5 cursor-pointer transition-colors hover:bg-primary/10';updateTimeEstimate();
  });
})();

// ===== Shuffle Options Helper =====
function shuffleArrayCopy(arr){
  var a=arr.slice();
  for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));var t=a[i];a[i]=a[j];a[j]=t;}
  return a;
}
function getShuffledOptions(q){
  if(!shuffleOptions)return q.options;
  var shuffled=shuffleArrayCopy(q.options);
  return shuffled;
}
function buildShuffledCache(){
  shuffledOptionsCache={};
  examQuestions.forEach(function(q,qi){
    shuffledOptionsCache[qi]=shuffleArrayCopy(q.options);
  });
}
function displayToOriginal(qi,displayLetter){
  var cache=shuffledOptionsCache;if(!cache||!cache[qi])return displayLetter;
  var opts=cache[qi];
  for(var i=0;i<opts.length;i++){if(String.fromCharCode(65+i)===displayLetter)return opts[i].letter;}
  return displayLetter;
}

// ===== Question Time Tracking =====
function startQuestionTimer(){lastQuestionTime=Date.now();timedQuestionIndex=currentIndex;}
function stopQuestionTimer(){if(!reviewMode && timedQuestionIndex>=0 && lastQuestionTime>0){var elapsed=Date.now()-lastQuestionTime;if(!questionTimers[timedQuestionIndex])questionTimers[timedQuestionIndex]=0;questionTimers[timedQuestionIndex]+=elapsed;}lastQuestionTime=0;timedQuestionIndex=-1;}
function formatMs(ms){
  var s=Math.round(ms/1000);
  if(s<60)return s+'\u79d2';
  var m=Math.floor(s/60),sec=s%60;
  return m+'\u5206'+sec+'\u79d2';
}
function updateTimeEstimate(){
  var sel=document.querySelector('input[name="part"]:checked').value;
  var pool=[];
  if(sel==='all'){EXAM_PARTS.forEach(function(p){pool=pool.concat(p.questions);});}
  else{pool=EXAM_PARTS[parseInt(sel)].questions.slice();}
  var count=selectedQCount>0?Math.min(selectedQCount,pool.length):pool.length;
  var mins=Math.max(10,Math.ceil(count*1.5));
  var el=document.getElementById('timeEstimate');
  if(el)el.textContent=mins;
}

function setQCount(n){
  selectedQCount=n;
  document.querySelectorAll('.qcount-btn').forEach(function(b){
    var a=parseInt(b.dataset.count)===n;
    b.classList.toggle('border-primary',a);b.classList.toggle('bg-primary/5',a);b.classList.toggle('border-primary/20',!a);updateTimeEstimate();
  });
}

function shuffleArray(a){var b=a.slice();for(var i=b.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));var t=b[i];b[i]=b[j];b[j]=t;}return b;}

function startExam(){
  examFinished=false;reviewMode=false;currentIndex=0;userAnswers={};markedQuestions=new Set();shuffledOptionsCache=null;frozenTimers=null;
  var sel=document.querySelector('input[name="part"]:checked').value;
  var pool=[];
  if(sel==='all'){EXAM_PARTS.forEach(function(p){pool=pool.concat(p.questions);});}
  else{pool=EXAM_PARTS[parseInt(sel)].questions.slice();}
  pool=shuffleArray(pool);
  examQuestions=selectedQCount>0?pool.slice(0,Math.min(selectedQCount,pool.length)):pool;
  // Assign sequential numbers for display
  examQuestions.forEach(function(q,i){q._displayNum=i+1;});
  document.getElementById('totalNum').textContent=examQuestions.length;
  timeLeft=Math.max(10,Math.ceil(examQuestions.length*1.5))*60;
  startTime=Date.now();
  document.getElementById('startScreen').classList.add('hidden');
  document.getElementById('examScreen').classList.remove('hidden');
  document.getElementById('resultScreen').classList.add('hidden');
  questionTimers={};lastQuestionTime=0;
  if(shuffleOptions)buildShuffledCache();else shuffledOptionsCache=null;
  startTimer();renderQuestion();renderQuestionMap();
}

function startTimer(){clearInterval(timerInterval);updateTimerDisplay();timerInterval=setInterval(function(){timeLeft--;updateTimerDisplay();if(timeLeft<=0){clearInterval(timerInterval);submitExam();}},1000);}

function updateTimerDisplay(){
  var m=Math.floor(Math.max(0,timeLeft)/60),s=Math.max(0,timeLeft)%60;
  var el=document.getElementById('timerDisplay');
  document.getElementById('timerText').textContent=m+':'+(s<10?'0':'')+s;
  if(timeLeft<=300)el.classList.add('timer-warning');else el.classList.remove('timer-warning');
}

function renderQuestion(){
  stopQuestionTimer();startQuestionTimer();
  var q=examQuestions[currentIndex];
  var opts=shuffleOptions&&shuffledOptionsCache&&shuffledOptionsCache[currentIndex]?shuffledOptionsCache[currentIndex]:q.options;
  document.getElementById('currentNum').textContent=currentIndex+1;
  document.getElementById('partLabel').textContent=q._partTitle||'';
  document.getElementById('questionText').textContent=(currentIndex+1)+'、'+q.text;
  document.getElementById('questionArea').classList.add('fade-in');
  var optArea=document.getElementById('optionsArea');optArea.innerHTML='';

  opts.forEach(function(opt,idx){
    var displayLetter=String.fromCharCode(65+idx);
    var origLetter=opt.letter;
    var isSelected=userAnswers[currentIndex]===origLetter;
    var isCorrect=reviewMode&&origLetter===q.answer;
    var isWrong=reviewMode&&isSelected&&origLetter!==q.answer;
    var btn=document.createElement('button');
    var cls='option-btn w-full text-left p-4 rounded-xl border-2 cursor-pointer flex items-start gap-3 ';
    if(reviewMode){if(isCorrect)cls+='border-correct bg-correct-bg';else if(isWrong)cls+='border-wrong bg-wrong-bg';else cls+='border-gray-200 bg-white';}
    else if(isSelected)cls+='border-primary bg-primary/5 shadow-md';
    else cls+='border-gray-200 bg-white hover:border-primary/30 hover:shadow-sm';
    btn.className=cls;
    if(!reviewMode)btn.onclick=(function(l){return function(){selectOption(l)};})(origLetter);
    else{btn.classList.add('disabled');btn.style.cursor='default';}

    var circ=document.createElement('span');
    var lc='w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ';
    if(reviewMode&&isCorrect)lc+='bg-correct text-white';
    else if(reviewMode&&isWrong)lc+='bg-wrong text-white';
    else if(isSelected)lc+='bg-primary text-white';
    else lc+='bg-gray-100 text-ink-light';
    circ.className=lc;circ.textContent=displayLetter;

    var txt=document.createElement('span');txt.className='pt-1 leading-relaxed text-sm md:text-base';txt.textContent=opt.text;
    btn.appendChild(circ);btn.appendChild(txt);

    if(reviewMode&&isCorrect){var ic=document.createElement('span');ic.className='ml-auto text-correct shrink-0';ic.innerHTML='<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>';btn.appendChild(ic);}
    else if(reviewMode&&isWrong){var ic2=document.createElement('span');ic2.className='ml-auto text-wrong shrink-0';ic2.innerHTML='<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>';btn.appendChild(ic2);}
    optArea.appendChild(btn);
  });

  var expArea=document.getElementById('explanationArea');
  if(reviewMode){
    var ua=userAnswers[currentIndex],ca=q.answer,exp='';
    if(ua===ca)exp='回答正确！正确答案是 '+ca+'。';
    else if(ua)exp='回答错误。你选了 '+ua+'，正确答案是 '+ca+'。';
    else exp='未作答。正确答案是 '+ca+'。';
    if(q.explanation)exp+=' '+q.explanation;
    document.getElementById('explanationText').textContent=exp;expArea.classList.remove('hidden');
  }else{expArea.classList.add('hidden');}

  document.getElementById('prevBtn').disabled=currentIndex===0;
  var nextBtn=document.getElementById('nextBtn');
  if(currentIndex<examQuestions.length-1)nextBtn.innerHTML='下一题 <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>';
  else if(reviewMode)nextBtn.innerHTML='返回结果 <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>';
  else nextBtn.innerHTML='交卷 <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>';

  // Update top-right submit button based on mode
  var topBtn=document.getElementById('topSubmitBtn');
  if(reviewMode){topBtn.innerHTML='<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>返回结果';topBtn.onclick=function(){document.getElementById('examScreen').classList.add('hidden');document.getElementById('resultScreen').classList.remove('hidden');};}
  else{topBtn.innerHTML='<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>交卷';topBtn.onclick=function(){confirmSubmit();};}
updateMarkButton();
  document.getElementById('progressBar').style.width=(Object.keys(userAnswers).length/examQuestions.length*100).toFixed(1)+'%';
  updateQuestionMap();
}

function selectOption(l){if(examFinished||reviewMode)return;if(userAnswers[currentIndex]===l)delete userAnswers[currentIndex];else userAnswers[currentIndex]=l;updateOptionStyles();updateQuestionMap();document.getElementById('progressBar').style.width=(Object.keys(userAnswers).length/examQuestions.length*100).toFixed(1)+'%';}
function prevQuestion(){if(currentIndex>0){currentIndex--;renderQuestion();}}
function nextQuestion(){if(currentIndex<examQuestions.length-1){currentIndex++;renderQuestion();}else if(reviewMode){document.getElementById('examScreen').classList.add('hidden');document.getElementById('resultScreen').classList.remove('hidden');}else{confirmSubmit();}}
function toggleMark(){if(markedQuestions.has(currentIndex))markedQuestions.delete(currentIndex);else markedQuestions.add(currentIndex);// Update top-right submit button based on mode
  var topBtn=document.getElementById('topSubmitBtn');
  if(reviewMode){topBtn.innerHTML='<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>返回结果';topBtn.onclick=function(){document.getElementById('examScreen').classList.add('hidden');document.getElementById('resultScreen').classList.remove('hidden');};}
  else{topBtn.innerHTML='<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>交卷';topBtn.onclick=function(){confirmSubmit();};}
updateMarkButton();updateQuestionMap();}
function updateMarkButton(){var m=markedQuestions.has(currentIndex);document.getElementById('markIcon').setAttribute('fill',m?'currentColor':'none');document.getElementById('markText').textContent=m?'已标记':'标记';}
function toggleQuestionMap(){document.getElementById('questionMap').classList.toggle('hidden');}
function renderTimeRank(containerId){
  var list=document.getElementById(containerId);if(!list)return;
  list.innerHTML="";
  if(!frozenTimers)return;
  var times=[];for(var i=0;i<examQuestions.length;i++){times.push({index:i,ms:frozenTimers[i]||0});}
  times.sort(function(a,b){return b.ms-a.ms;});
  var maxMs=Math.max.apply(null,times.map(function(t){return t.ms;}))||1;
  times.forEach(function(item){
    var q=examQuestions[item.index];
    var pct=Math.round(item.ms/maxMs*100);
    var sec=Math.round(item.ms/1000);
    var isCorrect=userAnswers[item.index]===q.answer;
    var isUnanswered=userAnswers[item.index]===undefined;
    var barColor=isUnanswered?"bg-gray-300":isCorrect?"bg-correct":"bg-wrong";
    var textColor=isUnanswered?"text-ink-muted":isCorrect?"text-correct":"text-wrong";
    var label=isUnanswered?"\u2014":isCorrect?"\u2713":"\u2717";
    var row=document.createElement("div");
    row.className="flex items-center gap-3 text-sm";
    row.innerHTML='<span class="w-12 text-right text-ink-muted shrink-0 font-mono">'+(item.index+1)+'</span><div class="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden"><div class="'+barColor+' h-full rounded-full transition-all duration-700" style="width:'+pct+'%"></div></div><span class="w-14 text-right font-medium '+textColor+' shrink-0">'+(sec<60?sec+'s':Math.floor(sec/60)+'m'+sec%60+'s')+'</span><span class="w-6 text-center font-bold '+textColor+' shrink-0">'+label+'</span>';
    list.appendChild(row);
  });
}

function renderQuestionMap(){
  var grid=document.getElementById('questionMapGrid');grid.innerHTML='';
  examQuestions.forEach(function(q,i){var btn=document.createElement('button');btn.className='w-10 h-10 rounded-lg text-xs font-bold cursor-pointer transition-all duration-200 hover:scale-110 ';btn.textContent=i+1;btn.onclick=(function(idx){return function(){currentIndex=idx;renderQuestion();};})(i);grid.appendChild(btn);});
  updateQuestionMap();
}


// Lightweight style update on answer selection - no DOM rebuild
function updateOptionStyles(){
  var q=examQuestions[currentIndex];
  var opts=shuffleOptions&&shuffledOptionsCache&&shuffledOptionsCache[currentIndex]?shuffledOptionsCache[currentIndex]:q.options;
  var btns=document.getElementById('optionsArea').children;
  for(var i=0;i<btns.length;i++){
    var btn=btns[i];
    var letter=opts[i].letter;
    var isSelected=userAnswers[currentIndex]===letter;
    var cls='option-btn w-full text-left p-4 rounded-xl border-2 cursor-pointer flex items-start gap-3 ';
    if(isSelected)cls+='border-primary bg-primary/5 shadow-md';
    else cls+='border-gray-200 bg-white hover:border-primary/30 hover:shadow-sm';
    btn.className=cls;
    // Update circle
    var circ=btn.querySelector('span');
    var lc='w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ';
    if(isSelected)lc+='bg-primary text-white';else lc+='bg-gray-100 text-ink-light';
    circ.className=lc;
  }
}
function updateQuestionMap(){
  var btns=document.getElementById('questionMapGrid').children;
  for(var i=0;i<btns.length;i++){
    var btn=btns[i],isA=userAnswers[i]!==undefined,isM=markedQuestions.has(i),isC=i===currentIndex;
    var cls='w-10 h-10 rounded-lg text-xs font-bold cursor-pointer transition-all duration-200 hover:scale-110 ';
    if(reviewMode){cls+=userAnswers[i]===examQuestions[i].answer?'bg-correct text-white':'bg-wrong text-white';}
    else if(isC){cls+='ring-2 ring-primary ring-offset-2 ';cls+=isM?'bg-yellow-400 text-white':isA?'bg-primary text-white':'bg-white text-ink border border-gray-200';}
    else if(isM)cls+='bg-yellow-400 text-white';else if(isA)cls+='bg-primary text-white';else cls+='bg-gray-100 text-ink-light hover:bg-gray-200';
    btn.className=cls;
  }
}

function confirmSubmit(){
  var a=Object.keys(userAnswers).length,t=examQuestions.length,u=t-a;
  document.getElementById('confirmText').textContent='你已回答 '+a+'/'+t+' 题'+(u>0?'，还有 '+u+' 题未作答。':'。')+'确定要提交吗？';
  document.getElementById('confirmModal').classList.remove('hidden');
}
function closeModal(){document.getElementById('confirmModal').classList.add('hidden');}

function submitExam(){
  clearInterval(timerInterval);examFinished=true;closeModal();
  var c=0,w=0,u=0;
  examQuestions.forEach(function(q,i){if(userAnswers[i]===undefined)u++;else if(userAnswers[i]===q.answer)c++;else w++;});
  // Save wrong/unanswered to mistake bank
  var bank=getMistakeBank();
  examQuestions.forEach(function(q,i){
    var key=q.text.substring(0,60);
    if(userAnswers[i]!==q.answer){
      if(!bank.find(function(m){return m.key===key;})){
        bank.push({key:key,text:q.text,options:q.options,answer:q.answer,explanation:q.explanation||'',wrongAt:Date.now(),wrongCount:1});
      }else{
        var existing=bank.find(function(m){return m.key===key;});
        existing.wrongCount=(existing.wrongCount||0)+1;
        existing.wrongAt=Date.now();
      }
    }else{
      bank=bank.filter(function(m){return m.key!==key;});
    }
  });
  saveMistakeBank(bank);
  var t=examQuestions.length,pct=Math.round(c/t*100);
  stopQuestionTimer();frozenTimers={};for(var fi=0;fi<examQuestions.length;fi++){frozenTimers[fi]=questionTimers[fi]||0;}var totalMs=0;for(var ti=0;ti<examQuestions.length;ti++){totalMs+=(frozenTimers[ti]||0);}var elapsed=Math.round(totalMs/1000),em=Math.floor(elapsed/60),es=elapsed%60;
  document.getElementById('scorePercent').textContent=pct+'%';
  document.getElementById('correctCount').textContent=c;
  document.getElementById('wrongCount').textContent=w;
  document.getElementById('unansweredCount').textContent=u;
  document.getElementById('timeUsed').textContent=em+'\u5206'+es+'\u79d2';
  var circ=326.73;
  var sc=document.getElementById('scoreCircle');sc.style.strokeDashoffset=circ-(pct/100)*circ;
  sc.style.stroke=pct>=80?'#22C55E':pct>=60?'#F59E0B':'#DC2626';
  document.getElementById('scoreEmoji').textContent=pct>=90?'\u{1F389}':pct>=80?'\u{1F44F}':pct>=60?'\u{1F4AA}':'\u{1F4DA}';
  document.getElementById('examScreen').classList.add('hidden');
  document.getElementById('resultScreen').classList.remove('hidden');
  document.getElementById('resultScreen').scrollIntoView({behavior:'smooth'});
  // Render per-question time details
  var timeSection=document.getElementById('timeDetailSection');
  var timeList=document.getElementById('timeDetailList');
  timeSection.classList.remove('hidden');
  timeList.innerHTML='';
  var times=[];
  for(var ti=0;ti<examQuestions.length;ti++){
    var ms=frozenTimers[ti]||0;
    times.push({index:ti,ms:ms});
  }
  times.sort(function(a,b){return b.ms-a.ms;});
  var maxMs=Math.max.apply(null,times.map(function(t){return t.ms;}))||1;
  times.forEach(function(item){
    var q=examQuestions[item.index];
    var pct=Math.round(item.ms/maxMs*100);
    var sec=Math.round(item.ms/1000);
    var isCorrect=userAnswers[item.index]===q.answer;
    var isUnanswered=userAnswers[item.index]===undefined;
    var barColor=isUnanswered?'bg-gray-300':isCorrect?'bg-correct':'bg-wrong';
    var textColor=isUnanswered?'text-ink-muted':isCorrect?'text-correct':'text-wrong';
    var label=isUnanswered?'\u2014':isCorrect?'\u2713':'\u2717';
    var row=document.createElement('div');
    row.className='flex items-center gap-3 text-sm';
    row.innerHTML='<span class="w-12 text-right text-ink-muted shrink-0 font-mono">'+(item.index+1)+'</span><div class="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden"><div class="'+barColor+' h-full rounded-full transition-all duration-700" style="width:'+pct+'%"></div></div><span class="w-14 text-right font-medium '+textColor+' shrink-0">'+(sec<60?sec+'s':Math.floor(sec/60)+'m'+sec%60+'s')+'</span><span class="w-6 text-center font-bold '+textColor+' shrink-0">'+label+'</span>';
    timeList.appendChild(row);
  });
  updateStartScreenMistakes();
}
function reviewExam(){reviewMode=true;currentIndex=0;document.getElementById('resultScreen').classList.add('hidden');document.getElementById('examScreen').classList.remove('hidden');renderQuestion();renderQuestionMap();var tr=document.getElementById('timeRankList');if(tr){tr.classList.remove('hidden');renderTimeRank('timeRankList');}}
function restartExam(){document.getElementById('resultScreen').classList.add('hidden');document.getElementById('startScreen').classList.remove('hidden');}

// ===== Mistake Bank (localStorage) =====
var MISTAKE_KEY='pmp_mistake_bank';
function getMistakeBank(){try{var d=localStorage.getItem(MISTAKE_KEY);return d?JSON.parse(d):[];}catch(e){return[];}}
function saveMistakeBank(bank){try{localStorage.setItem(MISTAKE_KEY,JSON.stringify(bank));}catch(e){}}
function clearMistakeBank(){localStorage.removeItem(MISTAKE_KEY);updateStartScreenMistakes();}
function getMistakeCount(){return getMistakeBank().length;}

function updateStartScreenMistakes(){
  var count=getMistakeCount();
  var badge=document.getElementById('mistakeBadge');
  var card=document.getElementById('mistakeCard');
  var countEl=document.getElementById('mistakeCountText');
  if(badge)badge.textContent=count;
  if(card){
    if(count>0){card.classList.remove('hidden');card.classList.add('fade-in');}
    else card.classList.add('hidden');
  }
  if(countEl)countEl.textContent=count;
  var drBtn=document.getElementById('drillBtn');
  var mixBtn=document.getElementById('mixBtn');
  if(drillBtn){drillBtn.disabled=count===0;if(count>0)drillBtn.classList.remove('opacity-40','cursor-not-allowed');else drBtn.classList.add('opacity-40','cursor-not-allowed');}
  if(mixBtn){mixBtn.disabled=count===0;if(count>0)mixBtn.classList.remove('opacity-40','cursor-not-allowed');else mixBtn.classList.add('opacity-40','cursor-not-allowed');}
}

var examMode='normal';

function startDrill(){
  examMode='drill';
  var bank=getMistakeBank();
  if(bank.length===0)return;
  examQuestions=shuffleArray(bank.map(function(m){return{text:m.text,options:m.options,answer:m.answer,explanation:m.explanation};}));
  startExamWithQuestions(examQuestions,'\u9519\u9898\u4e13\u9879\u63d0\u5347');
}

function startMix(){
  examMode='mix';
  var bank=getMistakeBank();
  var bankKeys=bank.map(function(m){return m.key;});
  var allPool=[];
  EXAM_PARTS.forEach(function(p){allPool=allPool.concat(p.questions);});
  var fresh=allPool.filter(function(q){return!bankKeys.includes(q.text.substring(0,60));});
  fresh=shuffleArray(fresh);
  var mistakeQs=shuffleArray(bank).slice(0,Math.max(5,Math.ceil(selectedQCount/2)));
  var freshQs=fresh.slice(0,Math.max(5,selectedQCount>0?selectedQCount-mistakeQs.length:10));
  var mixed=shuffleArray(mistakeQs.map(function(m){return{text:m.text,options:m.options,answer:m.answer,explanation:m.explanation};}).concat(freshQs));
  if(mixed.length===0)return;
  startExamWithQuestions(mixed,'\u6df7\u5408\u7ec3\u4e60 (\u9519\u9898+\u65b0\u9898)');
}

function startExamWithQuestions(questions,label){
  examFinished=false;reviewMode=false;currentIndex=0;userAnswers={};questionTimers={};lastQuestionTime=0;markedQuestions=new Set();shuffledOptionsCache=null;frozenTimers=null;
  examQuestions=questions;
  document.getElementById('totalNum').textContent=examQuestions.length;
  document.getElementById('partLabel').textContent=label||'';
  timeLeft=Math.max(10,Math.ceil(examQuestions.length*1.5))*60;
  startTime=Date.now();
  document.getElementById('startScreen').classList.add('hidden');
  document.getElementById('examScreen').classList.remove('hidden');
  document.getElementById('resultScreen').classList.add('hidden');
  document.getElementById('mistakeBookScreen').classList.add('hidden');
  startTimer();renderQuestion();renderQuestionMap();
}

function showMistakeBook(){
  document.getElementById('startScreen').classList.add('hidden');
  document.getElementById('mistakeBookScreen').classList.remove('hidden');
  renderMistakeBook();
}

function hideMistakeBook(){
  document.getElementById('mistakeBookScreen').classList.add('hidden');
  document.getElementById('startScreen').classList.remove('hidden');
  updateStartScreenMistakes();
}

function renderMistakeBook(){
  var bank=getMistakeBank();
  var container=document.getElementById('mistakeList');
  container.innerHTML='';
  if(bank.length===0){
    container.innerHTML='<p class="text-center text-ink-muted py-12">\u6682\u65e0\u9519\u9898\uff0c\u7ee7\u7eed\u4fdd\u6301\uff01</p>';
    return;
  }
  bank.sort(function(a,b){return (b.wrongCount||1)-(a.wrongCount||1);});
  bank.forEach(function(m,idx){
    var div=document.createElement('div');
    div.className='bg-white rounded-xl border border-gray-200 p-5 mb-4';
    div.innerHTML='<div class="flex items-start justify-between gap-3 mb-3"><p class="text-sm font-medium leading-relaxed flex-1">'+(idx+1)+'\u3001'+m.text+'</p><span class="shrink-0 text-xs px-2 py-1 rounded-full bg-wrong-bg text-wrong font-bold">\u9519 '+(m.wrongCount||1)+' \u6b21</span></div><div class="flex flex-wrap gap-2 mb-3">'+m.options.map(function(o){var isC=o.letter===m.answer;return '<span class="text-xs px-2.5 py-1 rounded-lg '+(isC?'bg-correct-bg text-correct font-bold border border-correct/30':'bg-gray-50 text-ink-light')+'">'+o.letter+'. '+o.text+'</span>';}).join('')+'</div>'+(m.explanation?'<p class="text-xs text-ink-muted leading-relaxed border-t border-gray-100 pt-3">\u89e3\u6790\uff1a'+m.explanation+'</p>':'');
    container.appendChild(div);
  });
}

function confirmClearMistakes(){document.getElementById('clearConfirmModal').classList.remove('hidden');}
function doClearMistakes(){clearMistakeBank();document.getElementById('clearConfirmModal').classList.add('hidden');renderMistakeBook();}

updateStartScreenMistakes();
updateTimeEstimate();// Keyboard shortcuts
document.addEventListener('keydown',function(e){
  if(document.getElementById('examScreen').classList.contains('hidden'))return;
  if(e.key==='ArrowLeft')prevQuestion();else if(e.key==='ArrowRight')nextQuestion();
  else if(!reviewMode){var k=e.key.toLowerCase();if(k==='a'||k==='1')selectOption('A');else if(k==='b'||k==='2')selectOption('B');else if(k==='c'||k==='3')selectOption('C');else if(k==='d'||k==='4')selectOption('D');}
});
<\/script>
</body>
</html>`;
}

// ===== Run =====
buildExam();