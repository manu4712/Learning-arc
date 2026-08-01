import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { savePublicProfile, getPublicProfile, getPublicProfileWithToken, deletePublicProfile, PublicProfileSnapshot } from "@/lib/db";
import { stats as calculateStats, Session } from "@/lib/data";
import { aggregateCoreSkills } from "@/lib/skills";

const publishPayloadSchema = z.object({
  id: z.string().optional(),
  managementToken: z.string().optional(),
  displayName: z.string().max(80).optional(),
  store: z.object({
    version: z.union([z.literal(1), z.literal(2), z.number()]),
    goal: z
      .object({
        title: z.string().optional().nullable(),
        description: z.string().optional().nullable(),
        duration: z.string().optional().nullable(),
        createdAt: z.string().optional().nullable(),
      })
      .optional()
      .nullable(),
    sessions: z.array(z.any()).default([]),
    tasks: z.array(z.any()).optional().default([]),
    dailyPlans: z.record(z.string(), z.any()).optional().default({}),
    report: z.any().optional().nullable(),
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

    if (!store.goal || !store.goal.title || !store.goal.title.trim()) {
      return NextResponse.json(
        { error: "A goal is required to publish a learning journey. Set your current mission on the Home screen first." },
        { status: 400 }
      );
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

    // Aggregate skill signals into durable Core Skills
    const coreSkillGroups = aggregateCoreSkills(store.sessions as Session[]);
    const formattedSkills = coreSkillGroups.map((g) => ({
      skill: g.skill,
      stage: g.stage,
      sessionCount: g.sessions.length,
    }));

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
        title: store.goal.title.trim(),
        description: store.goal.description || undefined,
        duration: store.goal.duration || "Self-Paced",
        createdAt: store.goal.createdAt || nowIso,
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
      tasks: store.tasks || [],
      dailyPlans: store.dailyPlans || {},
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
    if (e instanceof z.ZodError) {
      const issues = e.issues.map((i) => `${i.path.join(".") || "payload"}: ${i.message}`).join("; ");
      return NextResponse.json(
        { error: `Invalid publish request payload: ${issues}` },
        { status: 400 }
      );
    }
    const message = e instanceof Error ? e.message : "Failed to publish learning journey snapshot.";
    return NextResponse.json({ error: message }, { status: 500 });
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
    if (e instanceof z.ZodError) {
      const issues = e.issues.map((i) => `${i.path.join(".") || "payload"}: ${i.message}`).join("; ");
      return NextResponse.json(
        { error: `Invalid unpublish payload: ${issues}` },
        { status: 400 }
      );
    }
    const message = e instanceof Error ? e.message : "Failed to unpublish profile.";
    return NextResponse.json({ error: message }, { status: 500 });
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
