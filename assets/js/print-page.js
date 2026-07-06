/* print-page.js — つまずきドリル 印刷/PDF共通エンジン（P1）
   - quiz.js の採点セッションを待たずに「今すぐ紙で印刷」できるようにする。
   - 独立した pdf/ ページ（#printpack）では、問題だけを表示 → こたえは最終ページにまとめる。
   - どちらも同じ .print-sheet / .print-item 構造を使い、print.css を共用する。 */
(function (global) {
  "use strict";

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  // 教科ごとの書き込み欄を1問ぶん作る
  function writeBox(printMode, q) {
    if (printMode === "kanji") {
      var boxes = el("div", "print-kanji-boxes");
      for (var i = 0; i < 8; i++) boxes.appendChild(el("span", "kbox"));
      return boxes;
    }
    if (printMode === "english") {
      var eline = el("div", "print-spell-line");
      var wlen = q.word ? q.word.length : 5;
      for (var j = 0; j < Math.max(wlen, 4); j++) eline.appendChild(el("span", "sbox"));
      return eline;
    }
    return el("div", "print-answer-line");
  }

  // 1問ぶんの <li class="print-item"> を作る（こたえは含めない）
  function buildItem(q, printMode) {
    var li = el("li", "print-item");
    if (q.sentence) li.appendChild(el("p", "print-sentence", q.sentence));
    if (q.passage) {
      String(q.passage).split("\n").forEach(function (line) {
        li.appendChild(el("p", "print-sentence", line));
      });
    }
    li.appendChild(el("p", "print-q", q.question));
    if (Array.isArray(q.choices) && q.choices.length) {
      li.appendChild(el("p", "print-choices", q.choices.join("　／　")));
    }
    li.appendChild(writeBox(printMode, q));
    return li;
  }

  // 見出し（タイトル・なまえ・日づけ）
  function buildHead(title) {
    var head = el("div", "print-head");
    head.appendChild(el("h1", "print-title", title || "つまずきドリル"));
    var line = el("div", "print-name-line");
    line.appendChild(el("span", null, "なまえ ＿＿＿＿＿＿＿＿＿＿"));
    line.appendChild(el("span", null, "日づけ ＿＿／＿＿"));
    head.appendChild(line);
    return head;
  }

  // ============================================================
  // A) クイックプリント：subjects/*.html の「このページを印刷する」用
  //    セッション開始前でも、プールから即席の練習セットを作って印刷する。
  // ============================================================
  function quickPrint(opts) {
    var withAnswers = !!opts.withAnswers;
    fetch(opts.src, { cache: "no-cache" })
      .then(function (r) {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.json();
      })
      .then(function (data) {
        var pool = Array.isArray(data) ? data : [];
        if (!pool.length) throw new Error("no questions");
        var count = Math.min(opts.count || 10, pool.length);
        var items = shuffle(pool).slice(0, count);
        renderQuickSheet(items, opts, withAnswers);
      })
      .catch(function (err) {
        if (global.console) global.console.error("[print-page]", err);
        global.alert("問題を読み込めませんでした。しばらくしてからもう一度お試しください。");
      });
  }

  function renderQuickSheet(items, opts, withAnswers) {
    var old = document.getElementById("print-sheet");
    if (old) old.parentNode.removeChild(old);

    var sheet = el("div", "print-sheet");
    sheet.id = "print-sheet";
    sheet.appendChild(buildHead(opts.title));

    var list = el("ol", "print-list");
    items.forEach(function (q) {
      var li = buildItem(q, opts.printMode);
      li.appendChild(el("p", "print-answer", "こたえ： " + q.answer));
      list.appendChild(li);
    });
    sheet.appendChild(list);
    document.body.appendChild(sheet);

    document.body.classList.toggle("print-answers", withAnswers);
    showPrintNoticeThenPrint(function () {
      document.body.classList.remove("printing");
    });
  }

  // 印刷前に一言案内を出してから window.print() を呼ぶ
  function showPrintNoticeThenPrint(onDone) {
    document.body.classList.add("printing");
    var notice = document.getElementById("print-notice");
    if (!notice) {
      notice = el("div", "print-notice", "印刷画面が開きます。プリンターを選ぶか、「PDFに保存」を選んでください。");
      notice.id = "print-notice";
      document.body.appendChild(notice);
    }
    notice.classList.add("is-shown");

    var cleanup = function () {
      notice.classList.remove("is-shown");
      document.body.classList.remove("printing");
      window.removeEventListener("afterprint", cleanup);
      if (onDone) onDone();
    };
    window.addEventListener("afterprint", cleanup);

    global.setTimeout(function () {
      window.print();
    }, 400);
  }

  // ============================================================
  // B) 独立したPDF用ページ（pdf/ 配下）：問題を画面にそのまま表示し、
  //    最終ページに「こたえ（おうちの方へ）」をまとめる。
  // ============================================================
  function renderWorksheet(rootEl, items, opts) {
    rootEl.innerHTML = "";
    document.body.classList.add("pdf-page");

    var sheet = el("div", "print-sheet");
    sheet.appendChild(buildHead(opts.title));

    if (opts.note) {
      sheet.appendChild(el("p", "print-note", opts.note));
    }

    var list = el("ol", "print-list");
    items.forEach(function (q) {
      list.appendChild(buildItem(q, q.printMode || opts.printMode || "plain"));
    });
    sheet.appendChild(list);

    // こたえ（おうちの方へ）：印刷時は改ページして最終ページにまとめる
    var keyWrap = el("div", "print-answerkey");
    keyWrap.appendChild(el("h2", "print-answerkey-title", "こたえ（おうちの方へ）"));
    var keyList = el("ol", "print-answerkey-list");
    items.forEach(function (q) {
      var li = el("li", null);
      li.appendChild(el("span", "ak-q", q.question));
      li.appendChild(el("span", "ak-a", "→ " + q.answer));
      keyList.appendChild(li);
    });
    keyWrap.appendChild(keyList);
    sheet.appendChild(keyWrap);

    rootEl.appendChild(sheet);

    var btnRow = el("div", "pdf-actions");
    var printBtn = el("button", "btn btn-primary", "このページを印刷する（PDF保存もできます）");
    printBtn.addEventListener("click", function () {
      showPrintNoticeThenPrint(null);
    });
    btnRow.appendChild(printBtn);
    rootEl.parentNode.insertBefore(btnRow, rootEl.nextSibling);
  }

  function loadError(rootEl, message) {
    rootEl.innerHTML = "";
    var box = el("div", "quiz-error");
    box.appendChild(el("p", null, message || "問題を読み込めませんでした。"));
    box.appendChild(el("p", "quiz-error-hint", "※ローカルで確認する場合は、簡易サーバーから開いてください。"));
    rootEl.appendChild(box);
  }

  // data-mode="pool"：1教科のJSONを丸ごと（または先頭N問）印刷用に表示
  function initPool(rootEl) {
    var src = rootEl.getAttribute("data-src");
    var printMode = rootEl.getAttribute("data-print") || "plain";
    var title = rootEl.getAttribute("data-title") || document.title.split("｜")[0];
    var countAttr = rootEl.getAttribute("data-count");
    var count = countAttr ? Number(countAttr) : null;

    fetch(src, { cache: "no-cache" })
      .then(function (r) {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.json();
      })
      .then(function (data) {
        var pool = Array.isArray(data) ? data : [];
        if (!pool.length) throw new Error("no questions");
        var items = count ? pool.slice(0, count) : pool;
        items.forEach(function (q) { q.printMode = printMode; });
        renderWorksheet(rootEl, items, { title: title, printMode: printMode });
      })
      .catch(function (err) {
        if (global.console) global.console.error("[print-page]", err);
        loadError(rootEl, "問題を読み込めませんでした。");
      });
  }

  // data-mode="daily"：data/daily-drills.json の1日ぶんを教科横断で表示
  function initDaily(rootEl) {
    var dayId = rootEl.getAttribute("data-daily");

    fetch("/data/daily-drills.json", { cache: "no-cache" })
      .then(function (r) { return r.json(); })
      .then(function (days) {
        var day = days.filter(function (d) { return d.id === dayId; })[0];
        if (!day) throw new Error("day not found: " + dayId);

        var sourceCache = {};
        var fetches = day.items.map(function (item) {
          if (sourceCache[item.source]) return sourceCache[item.source];
          var p = fetch("/data/" + item.source, { cache: "no-cache" }).then(function (r) { return r.json(); });
          sourceCache[item.source] = p;
          return p;
        });

        return Promise.all(fetches).then(function (sources) {
          var items = [];
          day.items.forEach(function (item, idx) {
            var pool = sources[idx];
            var printMode = item.subject === "kanji" ? "kanji" : item.subject === "english" ? "english" : "plain";
            item.questionIds.forEach(function (id) {
              var q = pool.filter(function (p) { return p.id === id; })[0];
              if (q) {
                q.printMode = printMode;
                items.push(q);
              }
            });
          });
          renderWorksheet(rootEl, items, {
            title: day.title,
            note: "きょうの目安時間：やく" + (day.estimatedMinutes || 10) + "分"
          });
        });
      })
      .catch(function (err) {
        if (global.console) global.console.error("[print-page]", err);
        loadError(rootEl, "今日のドリルを読み込めませんでした。");
      });
  }

  function init() {
    var root = document.getElementById("printpack");
    if (!root) return;
    var mode = root.getAttribute("data-mode");
    if (mode === "pool") initPool(root);
    else if (mode === "daily") initDaily(root);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  global.DrillPrint = {
    quickPrint: quickPrint,
    renderWorksheet: renderWorksheet
  };
})(window);
