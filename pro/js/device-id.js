(function () {
  function uuid() {
    try {
      if (typeof crypto !== 'undefined') {
        if (crypto.randomUUID) return crypto.randomUUID();
        if (crypto.getRandomValues) {
          const a = crypto.getRandomValues(new Uint8Array(16));
          a[6] = (a[6] & 0x0f) | 0x40;
          a[8] = (a[8] & 0x3f) | 0x80;
          const hex = [...a].map(b => b.toString(16).padStart(2, "0")).join("");
          return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
        }
      }
    } catch (_) {}
    // Fallback
    let d = Date.now();
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => {
      const r = (d + Math.random() * 16) % 16 | 0;
      d = Math.floor(d / 16);
      return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
    });
  }

  function readCookie(name) {
    const m = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/[-.\w]/g, '\\$&') + '=([^;]*)'));
    return m ? decodeURIComponent(m[1]) : null;
  }

  async function persistStorage() {
    try { if (navigator.storage && navigator.storage.persist) await navigator.storage.persist(); } catch (_) {}
  }

  function getOrCreateDeviceId() {
    try {
      let id = localStorage.getItem("zisa_device_id") || readCookie("zisa_device_id");
      if (!id) {
        id = uuid();
        localStorage.setItem("zisa_device_id", id);
        document.cookie = "zisa_device_id=" + encodeURIComponent(id) + "; Path=/; Max-Age=31536000; SameSite=Lax; Secure";
        persistStorage();
      }
      return id;
    } catch (e) {
      let id = readCookie("zisa_device_id");
      if (!id) {
        id = uuid();
        document.cookie = "zisa_device_id=" + encodeURIComponent(id) + "; Path=/; Max-Age=31536000; SameSite=Lax; Secure";
      }
      return id;
    }
  }

  window.ZisaDevice = { getOrCreateDeviceId };
})();
