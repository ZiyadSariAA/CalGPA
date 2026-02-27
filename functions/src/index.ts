import { onRequest } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";

const groqApiKey = defineSecret("GROQ_API_KEY");

const MAX_PROMPT_LENGTH = 5000;

/* ─── Shared rules appended to every feature prompt ─── */
const SHARED_RULES = `
Rules:
- NEVER invent achievements, metrics, or experience the user didn't provide.
- If the user didn't provide enough detail, write a shorter but honest response instead of filling gaps with generic filler.
- If input contains Arabic text, translate and improve it into professional English.
- Use ATS-friendly language — standard industry terms, no creative formatting.
- Return ONLY the requested format — no markdown, no code blocks, no explanations, no labels.`;

/* ─── Per-feature system prompts ─── */
type FeatureKey = "description" | "projectDescription" | "summary" | "title" | "jobMatch";

const FEATURE_CONFIG: Record<FeatureKey, { max_tokens: number; temperature: number; systemPrompt: string }> = {
  description: {
    max_tokens: 300,
    temperature: 0.4,
    systemPrompt: `You are an expert ATS-optimized CV writer specializing in work experience bullet points.

Write 3-4 bullet points using the CAR method (Challenge → Action → Result).
Each bullet must start with a strong action verb (Developed, Led, Implemented, Optimized, Delivered, Reduced, Built, Designed).
If the user provides numbers, quantify the impact (e.g., "Reduced load time by 40%").
Each bullet on a new line prefixed with "• ".
${SHARED_RULES}`,
  },
  projectDescription: {
    max_tokens: 200,
    temperature: 0.4,
    systemPrompt: `You are an expert ATS-optimized CV writer specializing in project descriptions.

Write 2-3 concise sentences highlighting what was built, the tech stack used, and the impact or outcome.
Focus on what the user actually did — their role and contribution.
${SHARED_RULES}`,
  },
  summary: {
    max_tokens: 200,
    temperature: 0.5,
    systemPrompt: `You are an expert ATS-optimized CV writer specializing in professional summaries.

Write a 2-3 sentence professional summary in third person.
Highlight the candidate's strongest skills, experience level, and career focus.
Keep it specific to what the user provided — no generic filler like "passionate professional" or "team player" unless supported by their data.
${SHARED_RULES}`,
  },
  title: {
    max_tokens: 60,
    temperature: 0.3,
    systemPrompt: `You are an expert career advisor specializing in professional job titles.

Based on the user's skills and experience, suggest 3 relevant job titles.
Return ONLY a JSON array of 3 strings. Example: ["Software Engineer", "Full-Stack Developer", "Web Developer"]
No other text, no explanation — just the JSON array.
${SHARED_RULES}`,
  },
  jobMatch: {
    max_tokens: 1200,
    temperature: 0.3,
    systemPrompt: `You are an expert ATS-optimized CV writer and career advisor specializing in job-to-resume matching.

Analyze the user's CV against the provided job description.
Improve descriptions using the CAR method (Challenge → Action → Result) to better match the job requirements.
Follow the exact JSON structure requested in the user prompt.
Only suggest improvements based on what the user actually did — never add fake experience.
${SHARED_RULES}`,
  },
};

const VALID_FEATURES = new Set<string>(Object.keys(FEATURE_CONFIG));

/* ─── Cloud Function ─── */
export const aiGenerate = onRequest(
  { secrets: [groqApiKey], cors: true, region: "us-central1", timeoutSeconds: 60 },
  async (req, res) => {
    // Only allow POST
    if (req.method !== "POST") {
      res.status(405).json({ error: "Method not allowed" });
      return;
    }

    const { feature, prompt } = req.body as { feature?: string; prompt?: string };

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

    const config = FEATURE_CONFIG[feature as FeatureKey];
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
            { role: "system", content: config.systemPrompt },
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

      const json = await groqResponse.json() as {
        choices?: { message?: { content?: string } }[];
        usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
      };

      const content = json.choices?.[0]?.message?.content?.trim() ?? "";
      const tokenUsage = json.usage ?? null;

      res.status(200).json({ content, usage: tokenUsage });
    } catch (err) {
      console.error("Groq fetch error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);
