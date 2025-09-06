// index.ts — Zisa PRO backend (Functions v2) — europe-west1

import { onRequest, onCall, HttpsError } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";

admin.initializeApp();

const db = admin.firestore();

// ====== Project-constanten ======
const REGION = "europe-west1";
const MAIL_COLLECTION = "post"; // Moet overeenkomen met de Firestore Trigger Email-extensie
const DEVICE_LIMIT = 2;
const PRODUCT_ID_PRO = "zisa-pro-jaarlijks";
const PRICE_EUR_KOOP = "40.00";      // koop.html
const PRICE_EUR_WAITLIST = "35.00";  // koop_wachtlijst.html
const APP_URL = "https://isabelrockele.github.io/juf_zisa_spelletjesmaker/pro/index.html";

// ====== Mollie client (robust import, compatibel met ESM/CJS) ======
import mollieImport from "@mollie/api-client";
// Werkt voor zowel ESM (default export) als CJS:
const createMollieClient: any = (mollieImport as any)?.default ?? (mollieImport as any);
// Minimale type voor wat we nodig hebben:
type MolliePayment = { id: string; status: string; metadata?: any; _links?: any };

// ====== Hulpfuncties ======
function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing environment variable: ${name}`);
  return v;
}

function createMollie() {
  const apiKey = requireEnv("MOLLIE_API_KEY"); // test_… in testmodus
  return createMollieClient({ apiKey });
}

function makeLicenseCode(): string {
  // 4×4 alfanumeriek met streepjes
  const block = () =>
    Math.random().toString(36).toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 4);
  return `${block()}-${block()}-${block()}-${block()}`;
}

async function queueEmail(
  toEmail: string,
  subject: string,
  html: string,
  attachments?: Array<{ filename: string; content?: string; encoding?: "base64"; path?: string }>
) {
  // BELANGRIJK: attachments op TOP-LEVEL, niet in message
  await db.collection(MAIL_COLLECTION).add({
    to: [toEmail.trim().toLowerCase()],
    message: { subject, html },
    attachments: attachments ?? []
  });
}

// — Order helpers —
async function createOrderDoc(params: {
  email: string;
  productId: string;
  amountEUR: string;
  betalingId: string;
  rang?: string; // bv. "algemeen"
  paymentMode?: "test" | "live";
}) {
  const doc = {
    "E-mail": params.email.trim().toLowerCase(),
    Productid: params.productId,
    aantal: Number(params.amountEUR.split(".")[0]),
    betalingId: params.betalingId,
    gemaaktOp: admin.firestore.Timestamp.now(),
    paymentMode:
      params.paymentMode ??
      (requireEnv("MOLLIE_API_KEY").startsWith("test_") ? "test" : "live"),
    paymentStatusHint: "open",
    rang: params.rang ?? "algemeen",
    status: "gemaakt"
  };
  const ref = await db.collection("Orders").add(doc);
  return ref.id;
}

async function completeOrderById(orderId: string) {
  const ref = db.collection("Orders").doc(orderId);
  const snap = await ref.get();
  if (!snap.exists) throw new Error(`Order ${orderId} not found`);

  const order = snap.data()!;
  const email = ((order["E-mail"] as string) || "").trim().toLowerCase();

  // 1) Licentie genereren (+1 jaar), subcollectie onder de order
  const licenseCode = makeLicenseCode();
  const now = admin.firestore.Timestamp.now();
  const expiresAt = admin.firestore.Timestamp.fromDate(
    new Date(now.toDate().getTime() + 365 * 24 * 60 * 60 * 1000)
  );

  await ref.collection("licenses").add({
    code: licenseCode,
    email,
    productId: order.Productid || PRODUCT_ID_PRO,
    createdAt: now,
    expiresAt,
    deviceLimit: DEVICE_LIMIT
  });

  // 2) Orderstatus bijwerken
  await ref.set(
    {
      status: "betaald",
      paymentStatusHint: "paid",
      betaaldBij: admin.firestore.FieldValue.serverTimestamp(),
      licenseCode,
      licenseExpiresAt: expiresAt
    },
    { merge: true }
  );

  // 3) Mail uitsturen (factuur-PDF kan later als bijlage toegevoegd worden)
  const subject = "Zisa PRO – je licentie is actief";
  const html = `
    <p>Beste,</p>
    <p>Bedankt voor je aankoop van <strong>Zisa PRO</strong>. Je licentie is nu actief.</p>
    <p><strong>Licentiecode:</strong> <code>${licenseCode}</code><br/>
       <strong>Geldig tot:</strong> ${expiresAt.toDate().toISOString().slice(0, 10)}</p>
    <p>Je kan meteen inloggen op: <a href="${APP_URL}">${APP_URL}</a>.</p>
    <p>Hartelijke groet,<br/>Juf Zisa</p>
  `;
  await queueEmail(email, subject, html, []); // Bijlagen optioneel later toevoegen
}

// ====== Webhook (robust id-parsing + fallback) ======
export const mollieWebhook = onRequest({ region: REGION }, async (req, res) => {
  try {
    // 1) Payment-id robuust uitlezen
    let paymentId: string | null = null;

    // Query varianten
    if (typeof req.query.id === "string") paymentId = req.query.id as string;
    if (!paymentId && typeof req.query.paymentId === "string")
      paymentId = req.query.paymentId as string;

    // Body kan x-www-form-urlencoded zijn; parse rawBody
    if (!paymentId) {
      const raw =
        (req as any).rawBody
          ? (req as any).rawBody.toString("utf8")
          : typeof req.body === "string"
          ? (req.body as string)
          : null;

      if (raw) {
        const p = new URLSearchParams(raw);
        paymentId = p.get("id") || p.get("paymentId") || p.get("resourceId");
      } else if (req.body && typeof req.body === "object") {
        // fallback JSON body
        const b = req.body as any;
        paymentId = b.id || b.paymentId || b.resourceId || null;
      }
    }

    if (!paymentId) {
      logger.error("Webhook: missing payment id", {
        query: req.query,
        bodyType: typeof req.body
      });
      res.status(200).send("ok");
      return;
    }

    // 2) Betaling ophalen bij Mollie
    const mollie = createMollie();
    let payment: MolliePayment;
    try {
      payment = await (mollie as any).payments.get(paymentId);
    } catch (e) {
      logger.error("Webhook: Mollie get(payment) failed", {
        paymentId,
        error: String(e)
      });
      res.status(200).send("ok");
      return;
    }

    // 3) Alleen afhandelen bij 'paid'
    if (payment.status !== "paid") {
      logger.log("Webhook: payment not paid yet", {
        paymentId,
        status: payment.status
      });
      res.status(200).send("ok");
      return;
    }

    // 4) Order bepalen: eerst metadata.orderId, anders lookup op betalingId
    let orderId = (payment.metadata as any)?.orderId as string | undefined;
    if (!orderId) {
      const snap = await db
        .collection("Orders")
        .where("betalingId", "==", payment.id)
        .limit(1)
        .get();
      if (!snap.empty) orderId = snap.docs[0].id;
    }

    if (!orderId) {
      logger.error("Webhook: paid, maar geen order gevonden", { paymentId });
      res.status(200).send("ok");
      return;
    }

    // 5) Order afronden (licentie + mail + status)
    await completeOrderById(orderId);

    res.status(200).send("ok");
  } catch (err) {
    logger.error("Webhook error", err);
    // Altijd 200 naar Mollie om retrystormen te vermijden
    res.status(200).send("ok");
  }
});

// ====== Betaal-endpoints ======
//
// Frontend flow (GET of POST) stuurt minstens 'email' mee.
// We maken eerst een Order in Firestore, daarna de Mollie-payment,
// en we geven de payment.checkoutUrl terug aan de client.
//

async function createPaymentCommon(
  emailRaw: string,
  amountEUR: string,
  meta: Record<string, any>
) {
  const email = emailRaw.trim().toLowerCase();
  const mollie = createMollie();

  // Mollie-payment aanmaken
  const payment = await (mollie as any).payments.create({
    amount: { currency: "EUR", value: amountEUR }, // "40.00" of "35.00"
    description: "Zisa PRO – jaarlicentie",
    redirectUrl: APP_URL, // of aparte "bedankt" pagina
    webhookUrl: `https://${REGION}-zisa-spelletjesmaker-pro.cloudfunctions.net/mollieWebhook`,
    method: ["bancontact", "ideal", "creditcard", "applepay"],
    metadata: meta
  });

  // Order in Firestore
  await createOrderDoc({
    email,
    productId: PRODUCT_ID_PRO,
    amountEUR: amountEUR,
    betalingId: (payment as any).id,
    paymentMode: requireEnv("MOLLIE_API_KEY").startsWith("test_") ? "test" : "live"
  });

  const checkoutUrl: string =
    (payment as any).getCheckoutUrl?.() ||
    (payment as any)._links?.checkout?.href ||
    "";

  return checkoutUrl;
}

// Koop: €40
export const createPaymentKoop = onRequest({ region: REGION }, async (req, res) => {
  try {
    const email =
      (req.method === "POST"
        ? ((req.body as any)?.email as string)
        : (req.query.email as string)) || "";
    if (!email) {
      res.status(400).send("Missing email");
      return;
    }

    const checkoutUrl = await createPaymentCommon(email, PRICE_EUR_KOOP, {
      orderId: "", // vullen we bij webhook via betalingId-lookup
      source: "koop"
    });

    res.status(200).json({ checkoutUrl });
  } catch (e) {
    logger.error("createPaymentKoop error", e);
    res.status(500).send("Error");
  }
});

// Koop wachtlijst: €35 (optionele check op collection 'waitlist')
async function isOnWaitlist(email: string): Promise<boolean> {
  try {
    const doc = await db.collection("waitlist").doc(email).get();
    return doc.exists;
  } catch {
    return false;
  }
}

export const createPaymentWaitlist = onRequest(
  { region: REGION },
  async (req, res) => {
    try {
      const email =
        (req.method === "POST"
          ? ((req.body as any)?.email as string)
          : (req.query.email as string)) || "";
      if (!email) {
        res.status(400).send("Missing email");
        return;
      }

      // Optionele beveiliging: enkel wie op waitlist staat
      const allowed = await isOnWaitlist(email.trim().toLowerCase());
      if (!allowed) {
        res.status(403).send("Email niet op wachtlijst");
        return;
      }

      const checkoutUrl = await createPaymentCommon(
        email,
        PRICE_EUR_WAITLIST,
        {
          orderId: "",
          source: "koop_wachtlijst"
        }
      );

      res.status(200).json({ checkoutUrl });
    } catch (e) {
      logger.error("createPaymentWaitlist error", e);
      res.status(500).send("Error");
    }
  }
);

// ====== Apparaatbeheer (limiet 2) ======

export const registerDevice = onCall({ region: REGION }, async (req) => {
  const uid = req.auth?.uid;
  const email = (req.auth?.token?.email as string | undefined)?.trim().toLowerCase();
  const deviceId = (req.data?.deviceId as string | undefined)?.trim();

  if (!uid || !email) throw new HttpsError("unauthenticated", "Login vereist.");
  if (!deviceId) throw new HttpsError("invalid-argument", "deviceId ontbreekt.");

  const userCol = db.collection("Devices").doc(email).collection("items");
  const deviceRef = userCol.doc(deviceId);
  const existing = await deviceRef.get();

  // Tel huidige toestellen
  const snap = await userCol.get();
  const count = snap.size;

  if (!existing.exists && count >= DEVICE_LIMIT) {
    return { allowed: false, reason: "limit", limit: DEVICE_LIMIT };
  }

  await deviceRef.set(
    {
      deviceId,
      registeredAt: admin.firestore.FieldValue.serverTimestamp(),
      lastSeenAt: admin.firestore.FieldValue.serverTimestamp()
    },
    { merge: true }
  );

  return { allowed: true, limit: DEVICE_LIMIT };
});

export const listDevices = onCall({ region: REGION }, async (req) => {
  const email = (req.auth?.token?.email as string | undefined)?.trim().toLowerCase();
  if (!email) throw new HttpsError("unauthenticated", "Login vereist.");

  const items = await db
    .collection("Devices")
    .doc(email)
    .collection("items")
    .orderBy("registeredAt", "desc")
    .get();
  return items.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
});

export const unregisterDevice = onCall({ region: REGION }, async (req) => {
  const email = (req.auth?.token?.email as string | undefined)?.trim().toLowerCase();
  const deviceId = (req.data?.deviceId as string | undefined)?.trim();
  if (!email) throw new HttpsError("unauthenticated", "Login vereist.");
  if (!deviceId) throw new HttpsError("invalid-argument", "deviceId ontbreekt.");

  await db.collection("Devices").doc(email).collection("items").doc(deviceId).delete();
  return { ok: true };
});


