import fs from "fs";
import path from "path";

export type PublicProfileSnapshot = {
  id: string; // Public identifier for URL /p/[id]
  managementToken: string; // Secret management token for owner
  publishedAt: string;
  updatedAt: string;
  displayName?: string;
  goal: {
    title: string;
    description?: string;
    duration: string;
    createdAt: string;
  };
  stats: {
    totalMinutes: number;
    totalSessions: number;
    learningDays: number;
    currentStreak: number;
    longestStreak: number;
  };
  sessions: {
    id: string;
    completedAt: string;
    duration: number;
    mode: string;
    customActivity?: string;
    topic: string;
    reflection: string;
    independence: string;
    difficulty?: string;
    analysis?: {
      summary: string;
      skills: string[];
      classification: "guided" | "practice" | "application" | "exploration";
      evidence: "low" | "medium" | "high";
      progression: string;
    };
  }[];
  skills: {
    skill: string;
    stage: "Learned" | "Practiced" | "Applied";
    sessionCount: number;
  }[];
  tasks?: unknown[];
  dailyPlans?: Record<string, unknown>;
  report?: {
    createdAt: string;
    narrative: string;
    pattern: string;
    gap: string;
    priority: string;
  };
};

/**
 * Returns the preferred database connection string.
 * Precedence: DATABASE_URL -> POSTGRES_URL
 */
function getDatabaseUrl(): string | undefined {
  return process.env.DATABASE_URL || process.env.POSTGRES_URL;
}

/**
 * Checks whether the application is running in a production environment (Vercel or NODE_ENV=production).
 */
function isProductionEnvironment(): boolean {
  return process.env.NODE_ENV === "production" || process.env.VERCEL === "1";
}

// Fallback in-memory / file storage for local development ONLY
const FALLBACK_DIR = path.join(process.cwd(), "outputs");
const FALLBACK_FILE = path.join(FALLBACK_DIR, "public_profiles.json");

function ensureFallbackFile(): Record<string, PublicProfileSnapshot> {
  try {
    if (!fs.existsSync(FALLBACK_DIR)) {
      fs.mkdirSync(FALLBACK_DIR, { recursive: true });
    }
    if (fs.existsSync(FALLBACK_FILE)) {
      const data = fs.readFileSync(FALLBACK_FILE, "utf-8");
      return JSON.parse(data || "{}");
    }
  } catch (e) {
    console.error("Error reading local profiles fallback file:", e);
  }
  return {};
}

function writeFallbackFile(data: Record<string, PublicProfileSnapshot>): void {
  try {
    if (!fs.existsSync(FALLBACK_DIR)) {
      fs.mkdirSync(FALLBACK_DIR, { recursive: true });
    }
    fs.writeFileSync(FALLBACK_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (e) {
    console.error("Error writing local profiles fallback file:", e);
  }
}

/**
 * Saves or updates a public profile snapshot.
 * In production: MUST use Neon PostgreSQL (DATABASE_URL / POSTGRES_URL).
 * In development: Uses PostgreSQL if present, otherwise safely falls back to local file storage.
 */
export async function savePublicProfile(profile: PublicProfileSnapshot): Promise<void> {
  const dbUrl = getDatabaseUrl();

  if (dbUrl) {
    try {
      const { neon } = await import("@neondatabase/serverless");
      const sql = neon(dbUrl);

      // Create table if not exists
      await sql`
        CREATE TABLE IF NOT EXISTS public_profiles (
          id TEXT PRIMARY KEY,
          management_token TEXT NOT NULL,
          published_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          data JSONB NOT NULL
        );
      `;

      await sql`
        INSERT INTO public_profiles (id, management_token, published_at, updated_at, data)
        VALUES (${profile.id}, ${profile.managementToken}, ${profile.publishedAt}, ${profile.updatedAt}, ${JSON.stringify(profile)})
        ON CONFLICT (id) DO UPDATE SET
          updated_at = ${profile.updatedAt},
          data = ${JSON.stringify(profile)};
      `;
      return;
    } catch (e) {
      if (isProductionEnvironment()) {
        throw new Error(`Production database save failed: ${e instanceof Error ? e.message : String(e)}`);
      }
      console.warn("Postgres save failed in development, using local fallback:", e instanceof Error ? e.message : e);
    }
  } else if (isProductionEnvironment()) {
    throw new Error("DATABASE_URL or POSTGRES_URL environment variable is required in production for durable public profile storage.");
  }

  // Fallback to local storage (Development only)
  const profiles = ensureFallbackFile();
  profiles[profile.id] = profile;
  writeFallbackFile(profiles);
}

/**
 * Retrieves a public profile snapshot by ID for read-only viewing.
 * Strips managementToken before returning to client.
 */
export async function getPublicProfile(id: string): Promise<Omit<PublicProfileSnapshot, "managementToken"> | null> {
  const dbUrl = getDatabaseUrl();

  if (dbUrl) {
    try {
      const { neon } = await import("@neondatabase/serverless");
      const sql = neon(dbUrl);
      const rows = await sql`SELECT data FROM public_profiles WHERE id = ${id} LIMIT 1;`;
      if (rows.length > 0) {
        const full = typeof rows[0].data === "string" ? JSON.parse(rows[0].data) : rows[0].data;
        const sanitized = { ...full };
        delete (sanitized as { managementToken?: string }).managementToken;
        return sanitized;
      }
      return null;
    } catch (e) {
      if (isProductionEnvironment()) {
        throw new Error(`Production database fetch failed: ${e instanceof Error ? e.message : String(e)}`);
      }
      console.warn("Postgres fetch failed in development, trying local fallback:", e instanceof Error ? e.message : e);
    }
  } else if (isProductionEnvironment()) {
    throw new Error("DATABASE_URL or POSTGRES_URL environment variable is required in production for durable public profile storage.");
  }

  const profiles = ensureFallbackFile();
  const found = profiles[id];
  if (!found) return null;

  const sanitized = { ...found };
  delete (sanitized as { managementToken?: string }).managementToken;
  return sanitized;
}

/**
 * Retrieves a public profile snapshot including management token for validation.
 */
export async function getPublicProfileWithToken(id: string): Promise<PublicProfileSnapshot | null> {
  const dbUrl = getDatabaseUrl();

  if (dbUrl) {
    try {
      const { neon } = await import("@neondatabase/serverless");
      const sql = neon(dbUrl);
      const rows = await sql`SELECT data FROM public_profiles WHERE id = ${id} LIMIT 1;`;
      if (rows.length > 0) {
        return typeof rows[0].data === "string" ? JSON.parse(rows[0].data) : rows[0].data;
      }
      return null;
    } catch (e) {
      if (isProductionEnvironment()) {
        throw new Error(`Production database token fetch failed: ${e instanceof Error ? e.message : String(e)}`);
      }
      console.warn("Postgres token fetch failed in development, trying local fallback:", e instanceof Error ? e.message : e);
    }
  } else if (isProductionEnvironment()) {
    throw new Error("DATABASE_URL or POSTGRES_URL environment variable is required in production for durable public profile storage.");
  }

  const profiles = ensureFallbackFile();
  return profiles[id] || null;
}

/**
 * Deletes / unpublishes a public profile snapshot.
 */
export async function deletePublicProfile(id: string): Promise<boolean> {
  const dbUrl = getDatabaseUrl();

  if (dbUrl) {
    try {
      const { neon } = await import("@neondatabase/serverless");
      const sql = neon(dbUrl);
      await sql`DELETE FROM public_profiles WHERE id = ${id};`;
      return true;
    } catch (e) {
      if (isProductionEnvironment()) {
        throw new Error(`Production database delete failed: ${e instanceof Error ? e.message : String(e)}`);
      }
      console.warn("Postgres delete failed in development, trying local fallback:", e instanceof Error ? e.message : e);
    }
  } else if (isProductionEnvironment()) {
    throw new Error("DATABASE_URL or POSTGRES_URL environment variable is required in production for durable public profile storage.");
  }

  const profiles = ensureFallbackFile();
  if (profiles[id]) {
    delete profiles[id];
    writeFallbackFile(profiles);
    return true;
  }
  return false;
}
