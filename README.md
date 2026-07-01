# つまずきドリル（drill.kikaku-note.com）

小学2年生・小学3年生の家庭学習用に、**漢字・国語・英語スペル・算数**の基礎つまずきを
「10分でみつけて直す」ことに特化した、静的Webドリルサイトです。

- サイト名（仮）：つまずきドリル
- サブタイトル：小学生の苦手を10分で見つけて直すドリル
- 想定URL：https://drill.kikaku-note.com/
- 設計思想：小2基礎を直して、小3内容へ橋渡しする

## 対象学年

| モード | 状況 | 優先順位 |
| --- | --- | --- |
| 小学2年生 | 算数は概ねOK・国語と漢字がかなり弱い・英語はスペルが弱い | 漢字 → 国語 → 英語スペル → 算数維持 |
| 小学3年生 | 算数と国語は概ねOK・漢字と英語が難しい | 漢字 → 英語スペル → 国語の軽い復習 → 算数は後回し |

## 技術構成

- HTML / CSS / Vanilla JavaScript のみ（フレームワーク不使用）
- Astro / React / Next.js / Vue / Svelte / CMS / DB / ログイン / サーバー処理はすべて**不使用**
- 問題データは `data/*.json`（1教科1ファイル・フラットな配列）
- 採点はブラウザ内 JavaScript で完結
- 進捗保存は `localStorage` のみ（個人情報は保存しない）
- 外部CDNなし・スマホ / タブレット / PC 対応・印刷用CSSあり

## ディレクトリ構成

```txt
/
├ index.html                トップ
├ subjects/
│ ├ kanji/  index.html grade2.html grade3.html
│ ├ kokugo/ index.html basic.html
│ ├ english/index.html spelling.html
│ └ math/   index.html review.html
├ data/       kanji-grade2.json kanji-grade3.json kokugo-basic.json english-spelling.json math-review.json
├ assets/
│ ├ css/ style.css print.css
│ └ js/  app.js quiz.js storage.js
├ docs/  project-spec.md curriculum-policy.md content-guidelines.md
├ .claude/agents/  （教材・実装・レビュー用サブエージェント定義）
├ CLAUDE.md
├ README.md
└ robots.txt
```

## ローカル確認方法

このサイトは `fetch()` で JSON を読み込むため、`file://` 直開きではなく
簡易HTTPサーバー経由で開いてください。

```bash
# Python がある場合（推奨）
cd drill.kikaku-note.com
python -m http.server 8000
# → ブラウザで http://localhost:8000/ を開く

# Node がある場合
npx serve .
```

確認すること：
- トップから各教科・各ドリルへ移動できる
- 「答え合わせ」で正誤と解説が出る
- 結果画面が出て、「間違えた問題だけもう一度」ができる
- 「印刷」ボタンでA4の書き取り／スペル練習プリントが出る（答えあり・なし切替）
- ブラウザを閉じても直近の結果が残る（localStorage）

## Cloudflare Pages 公開方法

ビルド不要の純粋な静的サイトです。

1. GitHub リポジトリ `8oxygenium/drill.kikaku-note.com` に push
2. Cloudflare Pages で当該リポジトリを接続
3. ビルド設定
   - Framework preset: **None**
   - Build command: （空）
   - Build output directory: `/`（リポジトリ直下）
4. カスタムドメイン `drill.kikaku-note.com` を割り当て

## noindex 運用方針

- P0 の間は全HTMLに `<meta name="robots" content="noindex,nofollow">` を入れて検索非公開。
- `robots.txt` はクロール自体は許可（`Disallow:` 空）だが、上記metaでインデックスを止める。
- 品質確認（教材・印刷・安全レビュー）が済み、隆郎さんの承認が出たら noindex を解除する。

## ロードマップ

### P0（今回）
- トップ・各教科ページ・各ドリル
- 漢字60問・国語40問・英語60問・算数30問
- 採点／間違い再挑戦／印刷（答えあり・なし）／localStorage直近結果
- noindex・広告なし・解析なし

### P1（品質確認後）
- 問題数の追加（各教科の網羅性向上）
- noindex 解除・タイトル / description 最適化
- 「今日の10問」の自動出題ロジック強化

### P2（拡張）
- 学年・教科の追加（小4以降 / 別単元）
- 保護者向けの取り組み記録（引き続き個人情報は保存しない）
- 必要に応じた解析・広告の検討（導入時は別途方針を決める）
