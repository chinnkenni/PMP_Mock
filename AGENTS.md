# PMP Mock Safeguards

- `docs/index.html` and `PMP练习题库-完整版.md` are generated from `build-exam.js` and `questions/*.md`. Do not edit them by hand.
- Preserve the shuffle/review invariant: answer options may be shuffled while answering, but review mode must use the source `q.options` order so displayed letters, answer keys, colors, and explanation references stay aligned.
- Keep `getOptionsForDisplay` as the single option-order decision point, or replace it only with an equivalent centralized implementation.
- Keep the `verifyReviewOptionOrder` build-time regression check, or replace it only with an equivalent automated test that covers shuffled answering, shuffled review, and normal review.
- Preserve AI wrong-answer review: only answered-and-wrong review items show the copy action, and the copied prompt must include the question, all source-order options, the user's answer, the correct answer, the source explanation, a game-development example, and an explicit comparison of key differences.
- Preserve the separate PMBOK knowledge coach screen and its 12 bilingual PMBOK 7 modules. Keep module references, mapped question pools, and the build-time `verifyKnowledgeCoach` check in sync.
- Knowledge mastery must remain evidence-based: a module needs at least 5 distinct questions explicitly assigned to that module before verification, and mastery must continue to account for historical accuracy and weak-question rate. Do not infer several module completions from one broadly mapped question.
- The PMBOK source PDFs are local reference material. Never copy or publish them into `docs/`, generated artifacts, or the repository.
- After changes that affect questions, answers, rendering, review, or saved exam state, run `node build-exam.js` and require the regression check to pass before publishing.
