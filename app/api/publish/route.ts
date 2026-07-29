import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { savePublicProfile, getPublicProfile, getPublicProfileWithToken, deletePublicProfile, PublicProfileSnapshot } from "@/lib/db";
import { stats as calculateStats, Session } from "@/lib/data";

const publishPayloadSchema = z.object({
  id: z.string().optional(),
  managementToken: z.string().optional(),
  displayName: z.string().max(80).optional(),
  store: z.object({
    version: z.literal(1),
    goal: z.object({
      title: z.string().max(120),
      description: z.string().max(500).optional(),
      duration: z.string().max(50),
      createdAt: z.string(),
    }),
    sessions: z.array(z.any()),
    report: z.any().optional(),
  }),
});

const deletePayloadSchema = z.object({
  id: z.string(),
  managementToken: z.string(),
});

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const parsed = publishPayloadSchema.parse(json);
    const { store, displayName } = parsed;

    if (!store.goal) {
      return NextResponse.json({ error: "A goal is required to publish a learning journey." }, { status: 400 });
    }

    let id = parsed.id;
    let managementToken = parsed.managementToken;

    const nowIso = new Date().toISOString();
    let publishedAt = nowIso;

    // If updating an existing profile, verify management token
    if (id && managementToken) {
      const existing = await getPublicProfileWithToken(id);
      if (existing) {
        if (existing.managementToken !== managementToken) {
          return NextResponse.json({ error: "Invalid management token. Update unauthorized." }, { status: 403 });
        }
        publishedAt = existing.publishedAt; // Preserve original publication timestamp
      }
    }

    if (!id) {
      id = crypto.randomUUID().slice(0, 8); // 8-char short ID
    }
    if (!managementToken) {
      managementToken = crypto.randomUUID();
    }

    const st = calculateStats(store.sessions as Session[]);

    // Aggregate skill signals with stages
    const skillMap: Record<string, { stage: "Learned" | "Practiced" | "Applied"; count: number }> = {};
    (store.sessions as Session[]).forEach((s) => {
      const detectedSkills = s.analysis?.skills || [s.topic];
      detectedSkills.forEach((skill) => {
        const current = skillMap[skill];
        const newStage = s.mode === "Building" ? "Applied" : s.mode === "Practicing" ? "Practiced" : "Learned";
        const priority: Record<string, number> = { Learned: 1, Practiced: 2, Applied: 3 };

        if (!current) {
          skillMap[skill] = { stage: newStage, count: 1 };
        } else {
          current.count += 1;
          if (priority[newStage] > priority[current.stage]) {
            current.stage = newStage;
          }
        }
      });
    });

    const formattedSkills = Object.entries(skillMap)
      .map(([skill, data]) => ({
        skill,
        stage: data.stage,
        sessionCount: data.count,
      }))
      .sort((a, b) => b.sessionCount - a.sessionCount);

    // Format public session evidence (sanitized, no internal fields)
    const publicSessions = (store.sessions as Session[])
      .filter((s) => s.completedAt)
      .map((s) => ({
        id: s.id,
        completedAt: s.completedAt,
        duration: s.duration,
        mode: s.mode,
        customActivity: s.customActivity,
        topic: s.topic,
        reflection: s.reflection,
        independence: s.independence,
        difficulty: s.difficulty,
        analysis: s.analysis
          ? {
              summary: s.analysis.summary,
              skills: s.analysis.skills,
              classification: s.analysis.classification,
              evidence: s.analysis.evidence,
              progression: s.analysis.progression,
            }
          : undefined,
      }));

    const snapshot: PublicProfileSnapshot = {
      id,
      managementToken,
      publishedAt,
      updatedAt: nowIso,
      displayName: displayName?.trim() || undefined,
      goal: {
        title: store.goal.title,
        description: store.goal.description,
        duration: store.goal.duration,
        createdAt: store.goal.createdAt,
      },
      stats: {
        totalMinutes: st.total,
        totalSessions: st.done.length,
        learningDays: Object.keys(st.daily).length,
        currentStreak: st.currentStreak,
        longestStreak: st.longestStreak,
      },
      sessions: publicSessions,
      skills: formattedSkills,
      report: store.report
        ? {
            createdAt: store.report.createdAt,
            narrative: store.report.narrative,
            pattern: store.report.pattern,
            gap: store.report.gap,
            priority: store.report.priority,
          }
        : undefined,
    };

    await savePublicProfile(snapshot);

    return NextResponse.json({
      ok: true,
      id,
      managementToken,
      publicUrl: `/p/${id}`,
    });
  } catch (e) {
    console.error("Publish endpoint error:", e);
    return NextResponse.json({ error: "Failed to publish learning journey snapshot." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const json = await req.json();
    const { id, managementToken } = deletePayloadSchema.parse(json);

    const existing = await getPublicProfileWithToken(id);
    if (!existing) {
      return NextResponse.json({ error: "Public profile not found." }, { status: 404 });
    }

    if (existing.managementToken !== managementToken) {
      return NextResponse.json({ error: "Invalid management token. Unpublish unauthorized." }, { status: 403 });
    }

    await deletePublicProfile(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Unpublish endpoint error:", e);
    return NextResponse.json({ error: "Failed to unpublish profile." }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Profile ID required" }, { status: 400 });
  }

  const profile = await getPublicProfile(id);
  if (!profile) {
    return NextResponse.json({ error: "Public profile not found" }, { status: 404 });
  }

  return NextResponse.json(profile);
}
