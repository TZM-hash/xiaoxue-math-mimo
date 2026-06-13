(function () {
  "use strict";

  let toastRoot = null;
  let dialogRoot = null;

  function ensureToastRoot() {
    if (toastRoot) return toastRoot;
    toastRoot = document.createElement("div");
    toastRoot.className = "toast-stack";
    toastRoot.setAttribute("aria-live", "polite");
    document.body.appendChild(toastRoot);
    return toastRoot;
  }

  function notify(message, options = {}) {
    const root = ensureToastRoot();
    const toast = document.createElement("div");
    toast.className = `app-toast ${options.tone === "bad" ? "bad" : ""}`;
    const copy = document.createElement("span");
    copy.textContent = message;
    toast.appendChild(copy);
    if (typeof options.actionText === "string" && typeof options.onAction === "function") {
      const action = document.createElement("button");
      action.type = "button";
      action.className = "toast-action";
      action.textContent = options.actionText;
      action.addEventListener("click", () => {
        options.onAction();
        toast.remove();
      });
      toast.appendChild(action);
    }
    root.appendChild(toast);
    window.setTimeout(() => {
      toast.classList.add("leaving");
      window.setTimeout(() => toast.remove(), 220);
    }, options.duration || 2800);
  }

  function ensureDialogRoot() {
    if (dialogRoot) return dialogRoot;
    dialogRoot = document.createElement("div");
    dialogRoot.className = "app-dialog-layer";
    dialogRoot.hidden = true;
    document.body.appendChild(dialogRoot);
    return dialogRoot;
  }

  function closeDialog(afterClose) {
    const root = ensureDialogRoot();
    if (root.hidden) {
      if (typeof afterClose === "function") afterClose();
      return;
    }
    root.classList.add("is-closing");
    window.setTimeout(() => {
      root.hidden = true;
      root.classList.remove("is-closing");
      root.innerHTML = "";
      if (typeof afterClose === "function") afterClose();
    }, 180);
  }

  function ask({ title, message, confirmText = "确认", cancelText = "取消", danger = false, input = null }) {
    return new Promise((resolve) => {
      const root = ensureDialogRoot();
      const inputHTML = input
        ? `<input class="app-dialog-input" type="text" maxlength="${input.maxLength || 32}" value="${escapeAttr(input.value || "")}" />`
        : "";
      root.innerHTML = `
        <div class="app-dialog-backdrop" data-dialog-cancel></div>
        <section class="app-dialog" role="dialog" aria-modal="true" aria-label="${escapeAttr(title)}">
          <h3>${escapeHTML(title)}</h3>
          <p>${escapeHTML(message)}</p>
          ${inputHTML}
          <div class="app-dialog-actions">
            <button class="secondary" type="button" data-dialog-cancel>${escapeHTML(cancelText)}</button>
            <button class="${danger ? "danger" : "primary"}" type="button" data-dialog-confirm>${escapeHTML(confirmText)}</button>
          </div>
        </section>`;
      root.hidden = false;
      const field = root.querySelector(".app-dialog-input");
      if (field) field.focus({ preventScroll: true });
      root.querySelectorAll("[data-dialog-cancel]").forEach((node) => node.addEventListener("click", () => {
        closeDialog(() => resolve(input ? null : false));
      }));
      root.querySelector("[data-dialog-confirm]").addEventListener("click", () => {
        const value = field ? field.value.trim() : true;
        closeDialog(() => resolve(value));
      });
    });
  }

  function confirm(message, options = {}) {
    return ask({
      title: options.title || "请确认",
      message,
      confirmText: options.confirmText || "确认",
      cancelText: options.cancelText || "取消",
      danger: Boolean(options.danger)
    });
  }

  function prompt(message, fallback = "", options = {}) {
    return ask({
      title: options.title || "请输入",
      message,
      confirmText: options.confirmText || "保存",
      cancelText: options.cancelText || "取消",
      input: { value: fallback, maxLength: options.maxLength || 32 }
    });
  }

  function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[char]));
  }

  function escapeAttr(value) {
    return escapeHTML(value).replace(/`/g, "&#96;");
  }

  window.MathCampUIFeedback = { notify, confirm, prompt };
})();
