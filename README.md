# PMP 模拟考试

一个基于静态 HTML 的 PMP 模拟考试练习工具，支持随机抽题、计时、错题本、每题停留时长统计等功能。

## 在线访问

🔗 [GitHub Pages](https://chinnkenni.github.io/PMP_Mock/)

## 功能特性

- **随机抽题** — 从题库中随机抽取指定数量的题目进行模拟考试
- **倒计时** — 每题 1.5 分钟，动态计算考试时间
- **题目导航** — 快速跳转、标记题目
- **每题停留时长** — 交卷后查看每道题的停留时间，发现薄弱知识点
- **错题本** — 自动收集错题，支持专项练习和混合练习
- **打乱答案顺序** — 随机排列选项位置，避免记住答案位置
- **键盘快捷键** — 方向键切换题目，A/B/C/D 快速选择
- **解析查看** — 交卷后逐题查看正确答案和解析

## 项目结构

```
pmp-exam-app/
├── build-exam.js          # 构建脚本：解析 MD → 生成 docs/index.html
├── questions/             # 题目源文件（Markdown）
│   ├── 第一部分：项目管理基础知识.md
│   └── 第二部分：1. 整合管理.md
├── docs/
│   └── index.html         # 生成的考试页面（自动生成，勿手动编辑）
└── README.md
```

## 添加新题目

1. 在 `questions/` 目录下新建 `.md` 文件，格式如下：

```markdown
# 标题

1、题目文本

A、选项A
B、选项B
C、选项C
D、选项D

# 答案与解析

# 1、答案：A

解析：解析文本
```

2. 运行构建脚本：

```bash
node build-exam.js
```

3. 新题目会自动被发现并整合到考试页面中。

## 本地开发

```bash
# 安装依赖（仅需 Node.js）
node build-exam.js

# 本地预览
npx serve docs
```

## 部署

### GitHub Pages

项目已配置 GitHub Pages， serving from `/docs` on `main` branch。推送后自动更新。

### Vercel

1. 导入 GitHub 仓库
2. Framework Preset: **Other**
3. Output Directory: `docs`
4. 部署

## 技术栈

- HTML + Tailwind CSS（CDN）
- Vanilla JavaScript
- Node.js 构建脚本
- GitHub Pages / Vercel 部署
