/* daily.js — 「今日のドリル」を日付から決めるだけの小さなヘルパー
   - サーバー無し・日付計算だけでday-001〜day-030を順番にまわす。
   - 個人情報は扱わない。 */
(function (global) {
  "use strict";

  var TOTAL_DAYS = 30;

  function pad3(n) {
    var s = String(n);
    while (s.length < 3) s = "0" + s;
    return s;
  }

  // 2026-01-01を基準に、今日が何日目かを30で割った余りでday-001〜030を決める
  function todayId(now) {
    var base = new Date(Date.UTC(2026, 0, 1));
    var today = now || new Date();
    var utcToday = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
    var diffDays = Math.floor((utcToday - base) / (1000 * 60 * 60 * 24));
    var idx = ((diffDays % TOTAL_DAYS) + TOTAL_DAYS) % TOTAL_DAYS;
    return "day-" + pad3(idx + 1);
  }

  function loadDays() {
    return fetch("/data/daily-drills.json", { cache: "no-cache" }).then(function (r) {
      if (!r.ok) throw new Error("HTTP " + r.status);
      return r.json();
    });
  }

  function findDay(days, id) {
    return days.filter(function (d) { return d.id === id; })[0] || null;
  }

  function subjectLabel(subject) {
    var m = { kanji: "漢字", kokugo: "国語", english: "英語", math: "算数" };
    return m[subject] || subject;
  }

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  // #today-drill 要素に、今日のドリルの概要カードを描画する
  function renderTodayInto(rootEl) {
    if (!rootEl) return;
    var id = todayId();
    loadDays()
      .then(function (days) {
        var day = findDay(days, id);
        if (!day) throw new Error("today entry not found");

        rootEl.innerHTML = "";
        var card = el("div", "today-card");
        card.appendChild(el("p", "today-badge", "今日のドリル（" + id + "）"));
        card.appendChild(el("h3", "today-title", day.title));

        var counts = {};
        day.items.forEach(function (it) {
          counts[it.subject] = (counts[it.subject] || 0) + it.questionIds.length;
        });
        var summary = Object.keys(counts)
          .map(function (s) { return subjectLabel(s) + " " + counts[s] + "問"; })
          .join("　");
        card.appendChild(el("p", "today-summary", summary + "　／　目安 " + (day.estimatedMinutes || 10) + "分"));

        var actions = el("div", "today-actions");
        var pdfLink = el("a", "btn btn-primary", "印刷用PDFページを開く");
        pdfLink.href = "/" + day.pdf;
        actions.appendChild(pdfLink);
        card.appendChild(actions);

        rootEl.appendChild(card);
      })
      .catch(function (err) {
        if (global.console) global.console.error("[daily]", err);
        rootEl.innerHTML = "";
        rootEl.appendChild(el("p", "note", "今日のドリルを読み込めませんでした。"));
      });
  }

  global.DrillDaily = {
    todayId: todayId,
    loadDays: loadDays,
    findDay: findDay,
    subjectLabel: subjectLabel,
    renderTodayInto: renderTodayInto
  };
})(window);
