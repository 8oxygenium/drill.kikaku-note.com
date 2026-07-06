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

  // トップページの「今日のおすすめドリル」（#today-drill があれば描画）
  function initTodayDrill() {
    var box = document.getElementById("today-drill");
    if (!box || !global.DrillDaily) return;
    global.DrillDaily.renderTodayInto(box);
  }

  // トップページの「最新ドリル」（#latest-drills があれば描画。最大5件）
  function initLatestDrills() {
    var box = document.getElementById("latest-drills");
    if (!box) return;
    fetch("/data/latest-drills.json", { cache: "no-cache" })
      .then(function (r) { return r.json(); })
      .then(function (list) {
        box.innerHTML = "";
        list.slice(0, 5).forEach(function (item) {
          var a = document.createElement("a");
          a.className = "latest-item";
          a.href = item.url;
          var left = document.createElement("span");
          left.innerHTML =
            '<span class="latest-date">' + item.date + "</span><br>" +
            '<strong>' + item.title + "</strong>";
          var tags = document.createElement("span");
          tags.className = "latest-tags";
          (item.tags || []).forEach(function (t) {
            var s = document.createElement("span");
            s.textContent = t;
            tags.appendChild(s);
          });
          a.appendChild(left);
          a.appendChild(tags);
          box.appendChild(a);
        });
      })
      .catch(function () {
        box.innerHTML = '<p class="note">最新ドリルを読み込めませんでした。</p>';
      });
  }

  function ready(fn) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fn);
    else fn();
  }

  ready(function () {
    initNav();
    initLastResult();
    initTodayDrill();
    initLatestDrills();
  });
})(window);
