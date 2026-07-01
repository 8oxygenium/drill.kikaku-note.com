# project-spec.md — つまずきドリル P0 仕様

発注書（2026-06-29）に基づく実装仕様のサマリ。詳細は発注書が正。

## 目的

小2・小3の家庭学習用に、漢字・国語・英語スペル・算数の基礎つまずきを
1回10分以内で補修できる静的Webドリルを提供する。

## 絶対条件（抜粋）

- フレームワーク不使用（HTML/CSS/Vanilla JSのみ）
- DB・ログイン・サーバー処理・CMSなし
- 問題データはJSON、採点はブラウザ内、進捗はlocalStorageのみ
- 個人情報を保存しない
- P0はnoindex・広告なし・解析なし
- 外部CDNは極力使わない
- スマホ/タブレット/PC対応・印刷用CSSあり

## P0の成果物

- ページ：トップ / 各教科index / 各ドリル（漢字grade2・grade3、国語basic、英語spelling、算数review）
- データ：`data/` に5つのJSON
- 問題数：漢字60・国語40・英語60・算数30（合計190以上）
- 機能：出題→採点→解説→結果→間違いだけ再挑戦→印刷（答えあり/なし）→直近結果保存

## 問題データのスキーマ（共通）

```json
{
  "id": "k2-001",
  "grade": 2,
  "category": "kanji-grade2",
  "type": "choice-reading",
  "question": "「春」の読み方はどれ？",
  "choices": ["はる", "あき", "ふゆ", "なつ"],
  "answer": "はる",
  "explanation": "春は「はる」と読みます。季節の名前です。",

  "kanji": "春",
  "reading": ["はる", "シュン"],
  "words": ["春休み", "春分"],
  "sentence": "春になると、花がさきます。",
  "writeTarget": "春"
}
```

- `choices` がある → 選択式（ボタン）。ない → 入力式（テキスト）。
- `id`/`grade`/`category`/`type`/`question`/`answer`/`explanation` は必須。
- `kanji`/`reading`/`words`/`sentence`/`writeTarget`/`meaning`/`word` は任意（教科ごとに使う）。
- 入力式の採点は前後空白を無視し、大文字小文字を区別しない。

## 画面と挙動

1. ドリルページを開くと、対象JSONから10問（既定）を出題。
2. 各問：問題文＋（選択肢 or 入力）＋「答え合わせ」。
3. 答え合わせ後：正誤マーク＋解説＋「つぎへ」。
4. 全問終了：スコア（例 7/10）と、間違えた問題の一覧。
5. 「間違えた問題だけもう一度」：誤答のみで再セッション。
6. 「印刷」：現在のセッションのA4プリント（答えあり/なし切替、漢字は書き取り欄、英語はスペル欄）。

## localStorage

キー：`drill.lastResult`

```json
{
  "lastSubject": "kanji",
  "lastGrade": 2,
  "lastScore": 7,
  "lastTotal": 10,
  "lastMistakeIds": ["k2-001", "k2-004"]
}
```

個人を特定できる情報は一切保存しない。

## 実装順序

発注書 §13 に準拠（Step1 ドキュメント → Step2 HTML/CSS → Step3 JSエンジン →
Step4-7 各教科データ＋ページ → Step8 印刷 → Step9 レビュー）。
