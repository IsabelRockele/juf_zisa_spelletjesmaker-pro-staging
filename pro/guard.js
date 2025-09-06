// pro/js/guard.js — stabiele PRO-guard
// - eerst licentie controleren, dan pas registreren
// - GEEN registratie op apparaten.html
// - herkent DEVICE_LIMIT (429/resource-exhausted) en stuurt naar apparaten.html
// - safeGo voorkomt self-redirects
// - ?guard=off of localStorage['zisa_guard_off']='1' om tijdelijk uit te schakelen

const GUARD_OFF = (() => {
  try {
    const p = new URLSearchParams(location.search);
    return p.get("guard") === "off" || localStorage.getItem("zisa_guard_off") === "1";
  } catch { return false; }
})();
if (GUARD_OFF) {
  console.warn("[GUARD] UIT: ?guard=off of localStorage");
}

const CURRENT_PAGE = (() => {
  const f = (location.pathname.split("/").pop() || "").toLowerCase();
  return f || "index.html";
})();
const SKIP_PAGES = new Set(["index.html", "koop.html", "bedankt.html"]); // publiek

function safeGo(to, reason) {
  try {
    const dest = (to.split("/").pop() || "").toLowerCase();
    if (dest === CURRENT_PAGE) {
      console.warn("[GUARD] Self-redirect voorkomen:", to, reason);
      return;
    }
  } catch {}
  const q = reason ? ("?reason=" + encodeURIComponent(reason)) : "";
  location.href = to + q;
}
const goLogin   = () => safeGo("./index.html");
const goApp     = (r) => safeGo("./app.html", r);
const goDevices = () => safeGo("./apparaten.html");
const goKoop    = (r) => safeGo("./koop.html", r);

import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFunctions, httpsCallable } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-functions.js";
import { initializeAppCheck, ReCaptchaV3Provider, getToken as getAppCheckToken } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app-check.js";

(function ensureDeviceId(){
  if (window.ZisaDevice && typeof window.ZisaDevice.getOrCreateDeviceId === "function") return;
  window.ZisaDevice = {
    getOrCreateDeviceId(){
      try {
        let id = localStorage.getItem("zisa_device_id");
        if (!id) {
          const gen = (crypto?.randomUUID?.() || (Math.random().toString(36).slice(2) + Date.now()));
          id = String(gen);
          localStorage.setItem("zisa_device_id", id);
          document.cookie = "zisa_device_id=" + encodeURIComponent(id) + "; Path=/; Max-Age=31536000; SameSite=Lax; Secure";
        }
        return id;
      } catch {
        return "fallback-" + Date.now() + "-" + Math.random().toString(36).slice(2);
      }
    }
  };
})();

const firebaseConfig = {
  apiKey: "AIzaSyA1svbzlhdjiiDMyRIgqQq1jSu_F8li3Bw",
  authDomain: "zisa-spelletjesmaker-pro.firebaseapp.com",
  projectId: "zisa-spelletjesmaker-pro",
  storageBucket: "zisa-spelletjesmaker-pro.appspot.com",
  messagingSenderId: "828063957776",
  appId: "1:828063957776:web:8d8686b478846fe980db95",
  measurementId: "G-9LHNLFHSXX"
};

const app  = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const fns  = getFunctions(app, "europe-west1");

const appCheck = initializeAppCheck(app, {
  provider: new ReCaptchaV3Provider("6Lf5e7krAAAAAA1xV5_tz_Xickk-m6BRIMd_BzTO"),
  isTokenAutoRefreshEnabled: true,
});

if (!GUARD_OFF) {
  onAuthStateChanged(auth, async (user) => {
    if (SKIP_PAGES.has(CURRENT_PAGE)) return;

    if (!user) { goLogin(); return; }

    const IS_DEVICES_PAGE = CURRENT_PAGE === "apparaten.html";

    try {
      await Promise.all([
        getAppCheckToken(appCheck, /*forceRefresh*/ false),
        user.getIdToken(true)
      ]);

      const getAccessStatus = httpsCallable(fns, "getAccessStatus");
      let status;
      try {
        const res = await getAccessStatus({});
        status = res?.data || {};
      } catch (e) {
        console.error("getAccessStatus error:", e);
        goLogin(); return;
      }
      if (!status.allowed) { goKoop(status?.reason || "no_access"); return; }

      if (!IS_DEVICES_PAGE) {
        const deviceId = window.ZisaDevice.getOrCreateDeviceId();
        const registerDevice = httpsCallable(fns, "registerDevice");
        try {
          await registerDevice({ deviceId });
        } catch (e) {
          console.error("registerDevice error:", e);
          const msg = (e && (e.details || e.code || e.message || "")).toString();
          const limitHit =
            msg.includes("DEVICE_LIMIT") ||
            msg.includes("resource-exhausted") ||
            msg.includes("429");
          if (limitHit) { goDevices(); return; }
          goLogin(); return;
        }
      } else {
        console.info("[GUARD] apparaten.html: registratie overgeslagen (bewust).");
      }

      if (typeof window.onProReady === "function") {
        window.onProReady({
          user,
          expiresAt: status.expiresAt,
          limit: status.deviceLimit ?? 2
        });
      }
    } catch (err) {
      console.error("Guard error:", err);
      goLogin();
    }
  });
}



