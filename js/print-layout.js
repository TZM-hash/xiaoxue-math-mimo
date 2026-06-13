(function () {
  "use strict";

  function density(perPage, hasWord) {
    if (hasWord || perPage <= 20) return "density-loose";
    if (perPage <= 40) return "density-medium";
    if (perPage <= 70) return "density-tight";
    return "density-dense";
  }

  function columnCount(printDensity, direction) {
    const landscape = direction === "landscape";
    if (printDensity === "density-dense") return landscape ? 6 : 5;
    if (printDensity === "density-tight") return landscape ? 5 : 4;
    if (printDensity === "density-medium") return landscape ? 4 : 3;
    return landscape ? 3 : 2;
  }

  function rowGap(printDensity) {
    if (printDensity === "density-dense") return 6;
    if (printDensity === "density-tight") return 8;
    return 10;
  }

  function rowMinHeight(hasWord, spaceClass) {
    if (hasWord) return 72;
    if (spaceClass === "answer-space-large") return 64;
    if (spaceClass === "answer-space-none") return 30;
    return 42;
  }

  function maxReadablePerPage({ requestedPerPage, hasWord, direction, spaceClass, hasNameLine }) {
    const printDensity = density(requestedPerPage, hasWord);
    const rowMin = rowMinHeight(hasWord, spaceClass);
    const gap = rowGap(printDensity);
    const columns = columnCount(printDensity, direction);
    const pageHeight = direction === "landscape" ? 794 : 1123;
    const pagePadding = 84;
    const headerHeight = hasNameLine ? 76 : 52;
    const footerHeight = 28;
    const paperGaps = 36;
    const usableHeight = Math.max(180, pageHeight - pagePadding - headerHeight - footerHeight - paperGaps);
    const rows = Math.max(1, Math.floor((usableHeight + gap) / (rowMin + gap)));
    return Math.max(1, Math.min(requestedPerPage, rows * columns));
  }

  function answerSpaceClass(setting, perPage, hasWord) {
    if (setting === "large") return "answer-space-large";
    if (setting === "none") return "answer-space-none";
    if (setting === "normal") return "";
    return perPage <= 20 && !hasWord ? "answer-space-large" : perPage >= 80 ? "answer-space-none" : "";
  }

  window.MathCampPrintLayout = {
    density,
    columnCount,
    rowGap,
    rowMinHeight,
    maxReadablePerPage,
    answerSpaceClass
  };
})();
