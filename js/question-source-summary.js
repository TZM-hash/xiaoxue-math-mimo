(function () {
  "use strict";

  const LABELS = {
    reference: "参考资料派生",
    original: "原创扩展",
    selfDrawn: "自绘图形",
    scanRewrite: "扫描页改写",
    pdfImage: "PDF截图",
    extension: "扩展题",
    review: "复习/错题",
    template: "本地模板/动态题"
  };

  function questionOf(item) {
    return item && item.question ? item.question : item;
  }

  function sourceMetaOf(question) {
    return (question && question.sourceMeta) || {};
  }

  function classifyQuestionSource(item) {
    const question = questionOf(item) || {};
    const meta = sourceMetaOf(question);
    const hasSourceImage = Boolean(question.sourceImage && question.sourceImage.src);
    const hasDiagram = Boolean(question.diagram);

    if (item && item.reviewSource) {
      return { id: "review", label: LABELS.review };
    }
    if (meta.kind === "referenceDerived") {
      return { id: "reference", label: LABELS.reference };
    }
    if (meta.kind === "codexOriginal") {
      return { id: "original", label: LABELS.original };
    }
    if (meta.visualPolicy === "self-drawn-diagram" || hasDiagram) {
      return { id: "selfDrawn", label: LABELS.selfDrawn };
    }
    if (meta.scanStatus === "scan-image" || meta.quality === "scan-page-rewrite") {
      return { id: "scanRewrite", label: LABELS.scanRewrite };
    }
    if (hasSourceImage || meta.visualPolicy === "pdf-crop-image") {
      return { id: "pdfImage", label: LABELS.pdfImage };
    }
    if (question.enrichment || meta.kind || meta.sourceFile || meta.sourceId) {
      return { id: "extension", label: LABELS.extension };
    }
    return { id: "template", label: LABELS.template };
  }

  function summarizeQuestionSources(items) {
    const counts = {};
    const total = Array.isArray(items) ? items.length : 0;
    (Array.isArray(items) ? items : []).forEach((item) => {
      const source = classifyQuestionSource(item);
      if (!counts[source.id]) counts[source.id] = { id: source.id, label: source.label, count: 0 };
      counts[source.id].count += 1;
    });
    const order = ["reference", "original", "selfDrawn", "scanRewrite", "pdfImage", "extension", "review", "template"];
    const itemsOut = order.map((id) => counts[id]).filter(Boolean);
    return { total, items: itemsOut, counts };
  }

  window.MathCampQuestionSourceSummary = {
    classifyQuestionSource,
    summarizeQuestionSources,
    labels: LABELS
  };
})();
