/* quiz.js — つまずきドリル 共通クイズエンジン
   - 1ページに <div id="quiz" data-src="/data/xxx.json" ...> を1つ置くだけで動く。
   - choices があれば選択式、なければ入力式で描画する。
   - 採点 → 解説 → 結果 → 間違いだけ再挑戦 → 印刷（答えあり/なし）まで担当。
   - フレームワーク不使用・外部通信は同一オリジンのJSON取得のみ。 */
(function (global) {
  "use strict";

  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i];
      a[i] = a[j];
      a[j] = t;
    }
    return a;
  }

  function normalize(s) {
    return String(s == null ? "" : s).trim().toLowerCase();
  }

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  function Quiz(root) {
    this.root = root;
    this.src = root.getAttribute("data-src");
    this.subject = root.getAttribute("data-subject") || "";
    this.gradeAttr = root.getAttribute("data-grade");
    this.grade = this.gradeAttr != null ? Number(this.gradeAttr) : null;
    this.sessionSize = Number(root.getAttribute("data-session") || 10);
    this.printMode = root.getAttribute("data-print") || "plain"; // kanji | english | plain
    this.pool = [];       // 読み込んだ全問
    this.session = [];    // 今回の出題
    this.index = 0;
    this.answered = false;
    this.mistakes = [];   // 今回間違えた問題オブジェクト
    this.answers = {};    // id -> ユーザー解答（表示用）
  }

  Quiz.prototype.load = function () {
    var self = this;
    self.root.innerHTML = "";
    self.root.appendChild(el("p", "quiz-loading", "問題をよみこみ中…"));
    fetch(self.src, { cache: "no-cache" })
      .then(function (r) {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.json();
      })
      .then(function (data) {
        self.pool = Array.isArray(data) ? data : [];
        if (!self.pool.length) throw new Error("no questions");
        self.startSession(self.pool);
      })
      .catch(function (err) {
        self.root.innerHTML = "";
        var box = el("div", "quiz-error");
        box.appendChild(el("p", null, "問題を読み込めませんでした。"));
        box.appendChild(
          el(
            "p",
            "quiz-error-hint",
            "※ローカルで確認する場合は、簡易サーバー（例：python -m http.server）から開いてください。"
          )
        );
        self.root.appendChild(box);
        if (global.console) global.console.error("[quiz]", err);
      });
  };

  // pool から出題を組み立てて開始（再挑戦時は誤答リストを渡す）
  Quiz.prototype.startSession = function (source) {
    var size = Math.min(this.sessionSize, source.length);
    this.session = shuffle(source).slice(0, size);
    this.index = 0;
    this.mistakes = [];
    this.answers = {};
    this.renderQuestion();
  };

  Quiz.prototype.renderQuestion = function () {
    var self = this;
    var q = this.session[this.index];
    this.answered = false;
    this.root.innerHTML = "";

    var card = el("div", "quiz-card");

    // 進み具合
    var meta = el("div", "quiz-meta");
    meta.appendChild(el("span", "quiz-progress", "問題 " + (this.index + 1) + " / " + this.session.length));
    card.appendChild(meta);

    // 文脈（例文など）
    if (q.sentence) {
      card.appendChild(el("p", "quiz-sentence", q.sentence));
    }
    if (q.passage) {
      var pas = el("div", "quiz-passage");
      String(q.passage).split("\n").forEach(function (line) {
        pas.appendChild(el("p", null, line));
      });
      card.appendChild(pas);
    }

    // 問題文
    card.appendChild(el("h2", "quiz-question", q.question));

    var feedback = el("div", "quiz-feedback");
    feedback.setAttribute("aria-live", "polite");

    var checkBtn = el("button", "btn btn-primary quiz-check", "答え合わせ");

    var isChoice = Array.isArray(q.choices) && q.choices.length > 0;
    var selected = { value: null };
    var input = null;

    if (isChoice) {
      var list = el("div", "quiz-choices");
      shuffle(q.choices).forEach(function (choice) {
        var b = el("button", "choice", choice);
        b.type = "button";
        b.addEventListener("click", function () {
          if (self.answered) return;
          var all = list.querySelectorAll(".choice");
          for (var i = 0; i < all.length; i++) all[i].classList.remove("is-selected");
          b.classList.add("is-selected");
          selected.value = choice;
        });
        list.appendChild(b);
      });
      card.appendChild(list);
    } else {
      var wrap = el("div", "quiz-input-wrap");
      input = el("input", "quiz-input");
      input.type = "text";
      input.setAttribute("autocomplete", "off");
      input.setAttribute("autocapitalize", "off");
      input.setAttribute("inputmode", q.inputMode || "text");
      input.placeholder = q.placeholder || "こたえを入力";
      input.addEventListener("keydown", function (e) {
        if (e.key === "Enter" && !self.answered) {
          e.preventDefault();
          checkBtn.click();
        }
      });
      wrap.appendChild(input);
      card.appendChild(wrap);
    }

    card.appendChild(checkBtn);
    card.appendChild(feedback);
    this.root.appendChild(card);
    if (input) input.focus();

    checkBtn.addEventListener("click", function () {
      if (self.answered) return;

      var userVal = isChoice ? selected.value : (input ? input.value : "");
      if (isChoice && userVal == null) {
        feedback.textContent = "こたえをえらんでね。";
        feedback.className = "quiz-feedback is-hint";
        return;
      }
      if (!isChoice && normalize(userVal) === "") {
        feedback.textContent = "こたえを入力してね。";
        feedback.className = "quiz-feedback is-hint";
        return;
      }

      self.answered = true;
      self.answers[q.id] = userVal;
      var correct = normalize(userVal) === normalize(q.answer);

      if (isChoice) {
        var all = self.root.querySelectorAll(".choice");
        for (var i = 0; i < all.length; i++) {
          var c = all[i];
          c.disabled = true;
          if (normalize(c.textContent) === normalize(q.answer)) c.classList.add("is-correct");
          if (c.classList.contains("is-selected") && !correct) c.classList.add("is-wrong");
        }
      } else if (input) {
        input.disabled = true;
        input.classList.add(correct ? "is-correct" : "is-wrong");
      }

      feedback.innerHTML = "";
      var mark = el("p", "quiz-mark " + (correct ? "is-ok" : "is-ng"), correct ? "せいかい！" : "おしい…");
      feedback.appendChild(mark);
      if (!correct) {
        feedback.appendChild(el("p", "quiz-answer", "こたえ： " + q.answer));
      }
      if (q.explanation) {
        feedback.appendChild(el("p", "quiz-explanation", q.explanation));
      }
      feedback.className = "quiz-feedback is-shown";

      if (!correct) self.mistakes.push(q);

      checkBtn.remove();
      var nextBtn = el(
        "button",
        "btn btn-primary quiz-next",
        self.index + 1 < self.session.length ? "つぎへ" : "結果を見る"
      );
      nextBtn.addEventListener("click", function () {
        self.index++;
        if (self.index < self.session.length) self.renderQuestion();
        else self.renderResult();
      });
      card.appendChild(nextBtn);
      nextBtn.focus();
    });
  };

  Quiz.prototype.renderResult = function () {
    var self = this;
    var total = this.session.length;
    var score = total - this.mistakes.length;
    this.root.innerHTML = "";

    // 直近結果を保存（個人情報なし）
    if (global.DrillStorage) {
      global.DrillStorage.saveResult({
        lastSubject: this.subject,
        lastGrade: this.grade,
        lastScore: score,
        lastTotal: total,
        lastMistakeIds: this.mistakes.map(function (q) { return q.id; })
      });
    }

    var card = el("div", "quiz-card quiz-result");
    card.appendChild(el("h2", "result-title", "けっか"));

    var big = el("p", "result-score");
    big.appendChild(el("span", "result-score-num", String(score)));
    big.appendChild(el("span", "result-score-den", " / " + total));
    card.appendChild(big);

    var msg;
    if (self.mistakes.length === 0) msg = "ぜんもん せいかい！ すごい！";
    else if (score >= Math.ceil(total * 0.7)) msg = "よくできました。あと少し、やりなおしてみよう。";
    else msg = "だいじょうぶ。まちがえたところを もう一度やれば直るよ。";
    card.appendChild(el("p", "result-msg", msg));

    if (self.mistakes.length > 0) {
      var h = el("h3", "result-sub", "まちがえた問題");
      card.appendChild(h);
      var ul = el("ul", "result-mistakes");
      self.mistakes.forEach(function (q) {
        var li = el("li", null);
        li.appendChild(el("span", "rm-q", q.question));
        li.appendChild(el("span", "rm-a", "こたえ： " + q.answer));
        ul.appendChild(li);
      });
      card.appendChild(ul);
    }

    var actions = el("div", "result-actions");

    if (self.mistakes.length > 0) {
      var retry = el("button", "btn btn-primary", "間違えた問題だけ もう一度");
      var wrongPool = self.mistakes.slice();
      retry.addEventListener("click", function () {
        self.sessionSize = wrongPool.length;
        self.startSession(wrongPool);
        window.scrollTo(0, 0);
      });
      actions.appendChild(retry);
    }

    var again = el("button", "btn btn-secondary", "はじめから");
    again.addEventListener("click", function () {
      self.sessionSize = Number(self.root.getAttribute("data-session") || 10);
      self.startSession(self.pool);
      window.scrollTo(0, 0);
    });
    actions.appendChild(again);

    var printNo = el("button", "btn btn-outline", "答えなしで印刷");
    printNo.addEventListener("click", function () { self.print(false); });
    actions.appendChild(printNo);

    var printYes = el("button", "btn btn-outline", "答えありで印刷");
    printYes.addEventListener("click", function () { self.print(true); });
    actions.appendChild(printYes);

    card.appendChild(actions);
    this.root.appendChild(card);
  };

  // 印刷用シートを作って印刷する。withAnswers=true で解答も出す。
  Quiz.prototype.print = function (withAnswers) {
    var self = this;
    var old = document.getElementById("print-sheet");
    if (old) old.parentNode.removeChild(old);

    var sheet = el("div", "print-sheet");
    sheet.id = "print-sheet";

    var title = document.title.split("｜")[0] || "つまずきドリル";
    var head = el("div", "print-head");
    head.appendChild(el("h1", "print-title", title));
    var line = el("div", "print-name-line");
    line.appendChild(el("span", null, "なまえ ＿＿＿＿＿＿＿＿＿＿"));
    line.appendChild(el("span", null, "日づけ ＿＿／＿＿"));
    head.appendChild(line);
    sheet.appendChild(head);

    var list = el("ol", "print-list");
    this.session.forEach(function (q) {
      var li = el("li", "print-item");
      if (q.sentence) li.appendChild(el("p", "print-sentence", q.sentence));
      if (q.passage) {
        String(q.passage).split("\n").forEach(function (l) {
          li.appendChild(el("p", "print-sentence", l));
        });
      }
      li.appendChild(el("p", "print-q", q.question));

      if (Array.isArray(q.choices) && q.choices.length) {
        var cs = el("p", "print-choices", q.choices.join("　／　"));
        li.appendChild(cs);
      }

      // 書き取り／スペル欄
      if (self.printMode === "kanji") {
        var boxes = el("div", "print-kanji-boxes");
        var n = 8;
        for (var i = 0; i < n; i++) boxes.appendChild(el("span", "kbox"));
        li.appendChild(boxes);
      } else if (self.printMode === "english") {
        var eline = el("div", "print-spell-line");
        var wlen = (q.word ? q.word.length : 5);
        for (var j = 0; j < Math.max(wlen, 4); j++) eline.appendChild(el("span", "sbox"));
        li.appendChild(eline);
      } else {
        li.appendChild(el("div", "print-answer-line"));
      }

      // 答え（答えありモードのみ表示：CSSで制御）
      var ans = el("p", "print-answer", "こたえ： " + q.answer);
      li.appendChild(ans);

      list.appendChild(li);
    });
    sheet.appendChild(list);
    document.body.appendChild(sheet);

    document.body.classList.toggle("print-answers", !!withAnswers);
    document.body.classList.add("printing");

    var cleanup = function () {
      document.body.classList.remove("printing");
      window.removeEventListener("afterprint", cleanup);
    };
    window.addEventListener("afterprint", cleanup);
    window.print();
  };

  function init() {
    var root = document.getElementById("quiz");
    if (!root || !root.getAttribute("data-src")) return;
    new Quiz(root).load();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  global.DrillQuiz = Quiz;
})(window);
