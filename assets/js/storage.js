/* storage.js — localStorage ヘルパー
   個人を特定できる情報は保存しない。直近の結果だけを 1 キーに保存する。 */
(function (global) {
  "use strict";

  var KEY = "drill.lastResult";

  function isAvailable() {
    try {
      var t = "__drill_test__";
      global.localStorage.setItem(t, "1");
      global.localStorage.removeItem(t);
      return true;
    } catch (e) {
      return false;
    }
  }

  // 保存してよいのは、教科・学年・スコア・合計・間違えたIDのみ。
  function saveResult(result) {
    if (!isAvailable()) return false;
    var safe = {
      lastSubject: String(result.lastSubject || ""),
      lastGrade: result.lastGrade == null ? null : Number(result.lastGrade),
      lastScore: Number(result.lastScore || 0),
      lastTotal: Number(result.lastTotal || 0),
      lastMistakeIds: Array.isArray(result.lastMistakeIds)
        ? result.lastMistakeIds.map(String)
        : []
    };
    try {
      global.localStorage.setItem(KEY, JSON.stringify(safe));
      return true;
    } catch (e) {
      return false;
    }
  }

  function loadResult() {
    if (!isAvailable()) return null;
    try {
      var raw = global.localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function clearResult() {
    if (!isAvailable()) return;
    try {
      global.localStorage.removeItem(KEY);
    } catch (e) {}
  }

  global.DrillStorage = {
    isAvailable: isAvailable,
    saveResult: saveResult,
    loadResult: loadResult,
    clearResult: clearResult
  };
})(window);
