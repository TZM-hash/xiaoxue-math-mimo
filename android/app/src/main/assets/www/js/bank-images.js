(function () {
  "use strict";

  // ------------------------------------------------------------------
  // 校内题库图片存储（IndexedDB）。
  // 图片体积大，不放 localStorage；按 bankId + 图片名存 data URL。
  // 所有方法返回 Promise；在非浏览器（测试沙箱）环境下降级为内存 Map。
  // ------------------------------------------------------------------

  const DB_NAME = "mathcamp-bank-images";
  const STORE_NAME = "images";
  const DB_VERSION = 1;

  const hasIndexedDB = typeof indexedDB !== "undefined";
  const memoryStore = new Map(); // 降级：key -> dataUrl

  let dbPromise = null;
  function openDb() {
    if (!hasIndexedDB) return Promise.resolve(null);
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    }).catch(() => null);
    return dbPromise;
  }

  function keyFor(bankId, imageName) {
    return `${bankId}::${imageName}`;
  }

  async function putImage(bankId, imageName, dataUrl) {
    const key = keyFor(bankId, imageName);
    const db = await openDb();
    if (!db) { memoryStore.set(key, dataUrl); return true; }
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      tx.objectStore(STORE_NAME).put(dataUrl, key);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => { memoryStore.set(key, dataUrl); resolve(false); };
    });
  }

  async function getImage(bankId, imageName) {
    const key = keyFor(bankId, imageName);
    if (memoryStore.has(key)) return memoryStore.get(key);
    const db = await openDb();
    if (!db) return memoryStore.get(key) || "";
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const req = tx.objectStore(STORE_NAME).get(key);
      req.onsuccess = () => resolve(req.result || "");
      req.onerror = () => resolve("");
    });
  }

  // 读取一个批次的全部图片，返回 { imageName: dataUrl }
  async function getBankImages(bankId, imageNames) {
    const result = {};
    await Promise.all((imageNames || []).map(async (name) => {
      const url = await getImage(bankId, name);
      if (url) result[name] = url;
    }));
    return result;
  }

  async function deleteBankImages(bankId, imageNames) {
    const names = imageNames || [];
    const db = await openDb();
    if (!db) { names.forEach((n) => memoryStore.delete(keyFor(bankId, n))); return true; }
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      names.forEach((n) => store.delete(keyFor(bankId, n)));
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    });
  }

  // 读取 File -> data URL
  function fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(new Error("图片读取失败"));
      reader.readAsDataURL(file);
    });
  }

  window.MathCampBankImages = {
    putImage,
    getImage,
    getBankImages,
    deleteBankImages,
    fileToDataUrl,
    _hasIndexedDB: hasIndexedDB
  };
})();
