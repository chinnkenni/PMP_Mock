# PMP 模拟考试

在线 PMP 模拟考试系统，支持错题本、专项提升、混合练习。

## 在线访问

通过 GitHub Pages 访问：部署完成后，访问 `https://<你的用户名>.github.io/pmp-exam-app/`

## 功能

- **模拟考试** — 随机抽题，倒计时，进度跟踪
- **错题本** — 答错自动收集，答对自动移出，按错误次数排序
- **专项提升** — 仅练习错题本中的题目
- **混合练习** — 错题 + 新题混合，巩固薄弱点
- **键盘快捷键** — 方向键翻页，A/B/C/D 选择
- **题目导航** — 题目地图快速跳转

## 追加新题目

1. 将 `.md` 文件放入 `questions/` 目录
2. 运行：

``bash
node build-exam.js
``

3. 提交更改即可自动更新

### md 文件格式

``markdown
# 标题

1、题目文本

A、选项A

B、选项B

C、选项C

D、选项D

# 答案与解析

# 1、答案：A

解析：解析文本
``

## 项目结构

```
pmp-exam-app/
├── build-exam.js     构建脚本
├── questions/        题库 md 文件
└── docs/             生成的网页（GitHub Pages 源）
    └── index.html
```

## GitHub Pages 部署

1. 在仓库 Settings → Pages 中
2. Source 选择 `Deploy from a branch`
3. Branch 选 `main`，目录选 `/docs`
4. 保存即可