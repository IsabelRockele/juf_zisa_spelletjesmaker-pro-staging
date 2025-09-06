// /pro/js/device-id.js
(function () {
  window.ZisaDevice = window.ZisaDevice || {};
  if (typeof window.ZisaDevice.getOrCreateDeviceId === 'function') return;

  window.ZisaDevice.getOrCreateDeviceId = function(){
    try {
      let id = localStorage.getItem('zisa_device_id');
      if (!id) {
        const gen = (crypto && crypto.randomUUID)
          ? crypto.randomUUID()
          : (Math.random().toString(36).slice(2) + Date.now());
        id = String(gen);
        localStorage.setItem('zisa_device_id', id);
        document.cookie = 'zisa_device_id=' + encodeURIComponent(id)
          + '; Path=/; Max-Age=31536000; SameSite=Lax; Secure';
      }
      return id;
    } catch(e) {
      return 'fallback-' + Date.now() + '-' + Math.random().toString(36).slice(2);
    }
  };
})();
