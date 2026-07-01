/* app.js — サイト共通の小さなUI（ナビ開閉・直近結果の表示）
   フレームワーク不使用・外部通信なし。 */
(function (global) {
  "use strict";

  function initNav() {
    var toggle = document.querySelector(".nav-toggle");
    var nav = document.getElementById("site-nav");
    if (!toggle || !nav) return;
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  // トップページの「まえのつづき」表示（任意要素 #last-result があれば描画）
  function initLastResult() {
    var box = document.getElementById("last-result");
    if (!box || !global.DrillStorage) return;
    var r = global.DrillStorage.loadResult();
    if (!r || !r.lastTotal) return;

    var subjects = { kanji: "漢字", kokugo: "国語", english: "英語", math: "算数" };
    var label = subjects[r.lastSubject] || "ドリル";
    var grade = r.lastGrade ? "小" + r.lastGrade + " " : "";
    box.hidden = false;
    box.innerHTML =
      '<p class="last-result-text">まえのつづき：' +
      grade + label + "　" + r.lastScore + " / " + r.lastTotal + " 問せいかい</p>";
  }

  function ready(fn) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fn);
    else fn();
  }

  ready(function () {
    initNav();
    initLastResult();
  });
})(window);
