"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiGenerate = void 0;
const https_1 = require("firebase-functions/v2/https");
const params_1 = require("firebase-functions/params");
const admin = __importStar(require("firebase-admin"));
admin.initializeApp();
const groqApiKey = (0, params_1.defineSecret)("GROQ_API_KEY");
const db = admin.firestore();
const MAX_PROMPT_LENGTH = 5000;
const DAILY_LIMIT = 15;
/* ─── Static system prompt (cacheable by Groq, ~90% discount on repeated calls) ─── */
const SYSTEM_PROMPT = `You are a professional CV/resume writing assistant. You produce ATS-optimized, honest content.

Rules:
- Never invent fake achievements, metrics, or experience the user didn't provide.
- Use strong action verbs (Developed, Managed, Implemented, Designed, Led).
- Keep output concise and professionally worded.
- If input contains Arabic text, translate and improve it into professional English.
- Return ONLY the requested format — no markdown, no code blocks, no explanations.`;
const FEATURE_CONFIG = {
    description: { max_tokens: 300, temperature: 0.4 },
    projectDescription: { max_tokens: 200, temperature: 0.4 },
    summary: { max_tokens: 200, temperature: 0.5 },
    title: { max_tokens: 60, temperature: 0.3 },
    jobMatch: { max_tokens: 1200, temperature: 0.3 },
};
const VALID_FEATURES = new Set(Object.keys(FEATURE_CONFIG));
/* ─── Rate limit helper ─── */
function getTodayKey() {
    return new Date().toISOString().slice(0, 10); // "2026-02-27"
}
async function checkAndIncrementUsage(uid) {
    const today = getTodayKey();
    const ref = db.doc(`aiUsage/${uid}/daily/${today}`);
    const result = await db.runTransaction(async (tx) => {
        const snap = await tx.get(ref);
        const current = snap.exists ? (snap.data()?.count ?? 0) : 0;
        if (current >= DAILY_LIMIT) {
            return { allowed: false, remaining: 0 };
        }
        tx.set(ref, { count: current + 1, lastUsed: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
        return { allowed: true, remaining: DAILY_LIMIT - current - 1 };
    });
    return result;
}
/* ─── Cloud Function ─── */
exports.aiGenerate = (0, https_1.onRequest)({ secrets: [groqApiKey], cors: true, region: "us-central1", timeoutSeconds: 60 }, async (req, res) => {
    // Only allow POST
    if (req.method !== "POST") {
        res.status(405).json({ error: "Method not allowed" });
        return;
    }
    // Verify Firebase Auth token
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
        res.status(401).json({ error: "Missing or invalid authorization header" });
        return;
    }
    let uid;
    try {
        const decoded = await admin.auth().verifyIdToken(authHeader.split("Bearer ")[1]);
        uid = decoded.uid;
    }
    catch {
        res.status(401).json({ error: "Invalid or expired auth token" });
        return;
    }
    const { feature, prompt } = req.body;
    // Validate inputs
    if (!feature || !prompt) {
        res.status(400).json({ error: "Missing required fields: feature, prompt" });
        return;
    }
    if (!VALID_FEATURES.has(feature)) {
        res.status(400).json({ error: `Invalid feature: ${feature}` });
        return;
    }
    if (prompt.length > MAX_PROMPT_LENGTH) {
        res.status(400).json({ error: `Prompt too long (max ${MAX_PROMPT_LENGTH} characters)` });
        return;
    }
    // Check daily rate limit
    const usage = await checkAndIncrementUsage(uid);
    if (!usage.allowed) {
        res.status(429).json({
            error: "Daily limit reached",
            message: "لقد وصلت للحد اليومي من استخدام الذكاء الاصطناعي. حاول مرة أخرى غداً.",
            limit: DAILY_LIMIT,
        });
        return;
    }
    const config = FEATURE_CONFIG[feature];
    const apiKey = groqApiKey.value();
    try {
        const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                messages: [
                    { role: "system", content: SYSTEM_PROMPT },
                    { role: "user", content: prompt },
                ],
                max_tokens: config.max_tokens,
                temperature: config.temperature,
            }),
        });
        if (!groqResponse.ok) {
            const errorText = await groqResponse.text();
            console.error(`Groq API error (${groqResponse.status}):`, errorText);
            res.status(502).json({ error: "AI service unavailable" });
            return;
        }
        const json = await groqResponse.json();
        const content = json.choices?.[0]?.message?.content?.trim() ?? "";
        const tokenUsage = json.usage ?? null;
        res.status(200).json({ content, usage: tokenUsage, remaining: usage.remaining });
    }
    catch (err) {
        console.error("Groq fetch error:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});
//# sourceMappingURL=index.js.map