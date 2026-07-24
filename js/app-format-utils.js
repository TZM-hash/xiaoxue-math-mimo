(function () {
  "use strict";

  // 纯格式化 / 日期 / HTML 转义工具函数。
  // 这些函数不依赖 app.js 的 state / els，可独立测试与复用。
  // 从 app.js 抽出，行为保持完全一致（只搬不改）。

  // 把值转义为可安全放入 HTML 文本节点的字符串。
  function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[char]));
  }
  // 在 escapeHTML 基础上再转义反引号，用于放入 HTML 属性值。
  function escapeAttr(value) {
    return escapeHTML(value).replace(/`/g, "&#96;");
  }
  // 判断是否是普通对象（非 null、非数组的 object）。
  function isPlainObject(value) {
    return Boolean(value) && typeof value === "object" && !Array.isArray(value);
  }
  // 返回相对今天 offset 天的本地日期键（YYYY-MM-DD）。
  function todayKey(offset = 0) {
    const date = new Date();
    date.setDate(date.getDate() + offset);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  }
  // 把「距 1970-01-01 的天数」转换为 UTC 日期键（YYYY-MM-DD）。
  function dateKeyFromDayNumber(value) {
    const day = Number(value);
    if (!Number.isFinite(day)) return todayKey();
    const date = new Date(day * 86400000);
    return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
  }
  // 把日期键（YYYY-MM-DD）转换为「距 1970-01-01 的天数」，非法输入返回 NaN。
  function dayNumber(key) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(key || ""));
    if (!match) return NaN;
    return Math.floor(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])) / 86400000);
  }
  // 计算一组作答记录的正确率（百分比，四舍五入到整数）。
  function accuracyOf(items) {
    if (!items.length) return 0;
    return Math.round(items.filter((item) => item.correct).length / items.length * 100);
  }

  window.MathCampFormatUtils = {
    escapeHTML,
    escapeAttr,
    isPlainObject,
    todayKey,
    dateKeyFromDayNumber,
    dayNumber,
    accuracyOf
  };
})();
