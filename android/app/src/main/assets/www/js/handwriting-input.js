(function () {
  "use strict";

  function createEmptyState(width, height) {
    return {
      width: Number(width) || 0,
      height: Number(height) || 0,
      strokes: [],
      undone: [],
      tool: "pen",
      lineWidth: 4
    };
  }

  function serialize(state) {
    return {
      width: Number(state && state.width) || 0,
      height: Number(state && state.height) || 0,
      strokes: (state && Array.isArray(state.strokes) ? state.strokes : []).map((stroke) => (
        Array.isArray(stroke) ? stroke.map((point) => ({
          x: Math.round(Number(point.x) || 0),
          y: Math.round(Number(point.y) || 0),
          pressure: Math.round((Number(point.pressure) || 0.5) * 100) / 100
        })) : []
      )).filter((stroke) => stroke.length).slice(-80)
    };
  }

  function clear(state) {
    if (!state) return state;
    state.strokes = [];
    state.undone = [];
    return state;
  }

  function undo(state) {
    if (!state || !Array.isArray(state.strokes)) return state;
    const stroke = state.strokes.pop();
    if (stroke) {
      if (!Array.isArray(state.undone)) state.undone = [];
      state.undone.push(stroke);
    }
    return state;
  }

  function redo(state) {
    if (!state || !Array.isArray(state.undone)) return state;
    const stroke = state.undone.pop();
    if (stroke) {
      if (!Array.isArray(state.strokes)) state.strokes = [];
      state.strokes.push(stroke);
    }
    return state;
  }

  window.MathCampHandwritingInput = { createEmptyState, serialize, clear, undo, redo };
})();
