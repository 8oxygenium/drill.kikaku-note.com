/* write-order.js — 漢字「書き順ノーヒント練習」
   - 漢字そのものは見せず、よみ・文だけを見せて紙に書かせる。
   - canvas・手書き判定・AIジャッジ・書き順アニメーションは一切ない。
   - 答え合わせは「答えを見る」ボタンでの自己採点のみ。 */
(function (global) {
  "use strict";

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  function extractReading(q) {
    if (q.type === "choice-reading") return q.answer;
    var m1 = q.question.match(/「(.+?)」/);
    if (m1) return m1[1];
    var m2 = q.question.match(/（(.+?)）/);
    if (m2) return m2[1];
    return "";
  }

  function maskSentence(sentence, target) {
    if (!sentence) return sentence;
    // データ上の文は、あなうめ用の「___」（半角アンダースコア）で
    // 空らんが作られている（答えの漢字そのものは文中に出てこない）。
    // 見た目をそろえるため、全角の「＿」に統一する。
    var masked = sentence.replace(/_+/g, "＿");
    // 念のため、対象の漢字が文中に残っていた場合も置き換える。
    if (target) {
      masked = masked.replace(new RegExp(target, "g"), "＿");
    }
    return masked;
  }

  function dedupeByTarget(pool) {
    var seen = {};
    var out = [];
    pool.forEach(function (q) {
      var key = q.writeTarget || q.kanji || q.answer;
      if (!key || seen[key]) return;
      seen[key] = true;
      out.push(q);
    });
    return out;
  }

  function renderCard(q) {
    var card = el("div", "writeorder-card");
    // 「小N配当」は、その漢字が実際に配当されている学年（q.grade）を表示する。
    // どちらのファイルから読み込んだか（_grade）ではない。
    card.appendChild(el("p", "writeorder-meta", "小" + q.grade + "配当"));
    card.appendChild(el("p", "writeorder-reading", "よみ： " + extractReading(q)));
    if (q.sentence) {
      card.appendChild(el("p", "writeorder-sentence", maskSentence(q.sentence, q.writeTarget)));
    }
    card.appendChild(el("p", "writeorder-blank", "＿＿＿＿"));

    // 印刷時のみ表示する書き取りマス（紙に書く実際のスペース）
    var boxes = el("div", "print-kanji-boxes writeorder-boxes");
    for (var i = 0; i < 4; i++) boxes.appendChild(el("span", "kbox"));
    card.appendChild(boxes);

    var reveal = el("button", "btn btn-outline writeorder-reveal", "答えを見る");
    var answer = el("p", "writeorder-answer", q.writeTarget);
    reveal.addEventListener("click", function () {
      answer.classList.toggle("is-shown");
      reveal.textContent = answer.classList.contains("is-shown") ? "答えをかくす" : "答えを見る";
    });
    card.appendChild(reveal);
    card.appendChild(answer);
    return card;
  }

  function init() {
    var root = document.getElementById("writeorder-root");
    if (!root) return;

    Promise.all([
      fetch("/data/kanji-grade2.json", { cache: "no-cache" }).then(function (r) { return r.json(); }),
      fetch("/data/kanji-grade3.json", { cache: "no-cache" }).then(function (r) { return r.json(); })
    ])
      .then(function (results) {
        var all = dedupeByTarget(results[0].concat(results[1]));

        root.innerHTML = "";
        all.forEach(function (q) {
          root.appendChild(renderCard(q));
        });

        var printNo = document.getElementById("wo-print-no");
        var printYes = document.getElementById("wo-print-yes");
        if (printNo) {
          printNo.addEventListener("click", function () {
            document.body.classList.remove("print-answers");
            window.print();
          });
        }
        if (printYes) {
          printYes.addEventListener("click", function () {
            document.body.classList.add("print-answers");
            window.print();
          });
        }
      })
      .catch(function (err) {
        if (global.console) global.console.error("[write-order]", err);
        root.innerHTML = "";
        root.appendChild(el("p", "note", "漢字データを読み込めませんでした。"));
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})(window);
