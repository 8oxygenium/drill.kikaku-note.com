/* review-print.js — 「間違えた問題だけ」復習・印刷ページ用
   - localStorage の drill.lastResult（lastSubject / lastGrade / lastMistakeIds）だけを読む。
   - サーバーへは何も送信しない。外部通信なし。 */
(function (global) {
  "use strict";

  var SOURCE_BY_SUBJECT = {
    kanji: { 2: "kanji-grade2.json", 3: "kanji-grade3.json" },
    kokugo: { 2: "kokugo-basic.json", 3: "kokugo-basic.json" },
    english: { 2: "english-spelling.json", 3: "english-spelling.json" },
    math: { 2: "math-review.json", 3: "math-review.json" }
  };

  var PRINT_MODE_BY_SUBJECT = { kanji: "kanji", english: "english" };

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  function init(rootEl) {
    if (!rootEl || !global.DrillStorage) return;
    var result = global.DrillStorage.loadResult();

    if (!result || !result.lastMistakeIds || !result.lastMistakeIds.length) {
      rootEl.innerHTML = "";
      rootEl.appendChild(
        el("p", "note", "まだ「間違えた問題」の記録がありません。ドリルを1回といてから、このページを開いてください。")
      );
      return;
    }

    var subject = result.lastSubject;
    var grade = result.lastGrade || 2;
    var sourceMap = SOURCE_BY_SUBJECT[subject];
    var source = sourceMap ? sourceMap[grade] || sourceMap[2] : null;

    if (!source) {
      rootEl.innerHTML = "";
      rootEl.appendChild(el("p", "note", "復習できる教科データが見つかりませんでした。"));
      return;
    }

    fetch("/data/" + source, { cache: "no-cache" })
      .then(function (r) {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.json();
      })
      .then(function (pool) {
        var idSet = result.lastMistakeIds;
        var items = pool.filter(function (q) { return idSet.indexOf(q.id) !== -1; });
        if (!items.length) {
          rootEl.innerHTML = "";
          rootEl.appendChild(el("p", "note", "前回はすべて正解でした。復習する問題はありません。"));
          return;
        }
        var printMode = PRINT_MODE_BY_SUBJECT[subject] || "plain";
        var title = "間違えた問題だけ復習（" + global.DrillDaily.subjectLabel(subject) + "）";
        global.DrillPrint.renderWorksheet(rootEl, items, { title: title, printMode: printMode });
      })
      .catch(function (err) {
        if (global.console) global.console.error("[review-print]", err);
        rootEl.innerHTML = "";
        rootEl.appendChild(el("p", "note", "問題を読み込めませんでした。"));
      });
  }

  function ready(fn) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fn);
    else fn();
  }

  ready(function () {
    var root = document.getElementById("review-root");
    if (root) init(root);
  });
})(window);
