# CLAUDE.md

## Project

This is drill.kikaku-note.com, a static elementary school drill site for Japanese grade 2 and grade 3 learners.

## Core rule

Do not use Astro, React, Next.js, Vue, Svelte, backend servers, databases, login, or CMS.

Use only static HTML, CSS, and Vanilla JavaScript.

## Priority

P0 focuses on:

1. Kanji
2. Japanese remedial basics
3. English spelling
4. Basic math review

## Learner assumptions

Grade 2 learner:
- Math is mostly okay
- Japanese and kanji are very weak
- English speaking may be okay, but spelling is weak

Grade 3 learner:
- Math and Japanese are mostly okay
- Kanji and English are difficult

## Safety

- Do not collect personal data
- Do not store child names
- Do not add login
- Do not add ads in P0
- Do not add analytics in P0
- Keep noindex until explicitly approved

## Tone

Use encouraging, neutral Japanese.
Never use insulting or shaming language.
Prefer:
- つまずき
- やりなおし
- 10分復習
- 基礎確認

Avoid:
- 勉強できない子
- 落ちこぼれ
- バカでもわかる
- できない

## Data / architecture notes

- Questions live in `data/*.json`. One flat array per file.
- A single quiz engine (`assets/js/quiz.js`) renders every drill page.
  A drill page just needs a `<div id="quiz" data-src="/data/xxx.json" ...>`.
- Rendering rule: a question with a `choices` array renders as multiple choice；
  a question without `choices` renders as a text input.
- Grading, results, retry-of-wrong-only, and print view are all in the engine.
- localStorage key is `drill.lastResult` and stores only non-identifying result data.
