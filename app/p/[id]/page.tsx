import React from "react";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublicProfile } from "@/lib/db";
import PublicProfileView from "@/components/proof/PublicProfileView";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const profile = await getPublicProfile(id);
  if (!profile) {
    return {
      title: "Public Profile Not Found | Learning Arc",
      description: "This learning journey profile does not exist or has been unpublished.",
    };
  }

  const hours = Math.floor(profile.stats.totalMinutes / 60);
  const durationText = hours > 0 ? `${hours}h ${profile.stats.totalMinutes % 60}m` : `${profile.stats.totalMinutes}m`;
  const name = profile.displayName || "Self-Learner";

  return {
    title: `${profile.goal.title} • ${name}'s Learning Arc`,
    description: `${name} has accumulated ${durationText} of focused learning across ${profile.stats.totalSessions} sessions (${profile.stats.currentStreak}-day active streak).`,
    openGraph: {
      title: `${profile.goal.title} • ${name}'s Learning Arc`,
      description: `Explore ${name}'s verifiable learning journey, evidence reflections, and skill evolution.`,
      type: "website",
    },
  };
}

export default async function PublicProfilePage({ params }: Props) {
  const { id } = await params;
  const profile = await getPublicProfile(id);

  if (!profile) {
    notFound();
  }

  return (
    <main className="public-profile-page">
      <PublicProfileView profile={profile} />
    </main>
  );
}
