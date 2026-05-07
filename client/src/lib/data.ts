// Shared, code-level constants for Holy Spirit Prayers.
// Real prayer data is served exclusively from /api/uploaded-prayers (admin
// uploads). This module retains the canonical category list (used to label
// uploaded prayers by slug) plus a couple of duration/format helpers.

export type PrayerCategory = {
  id: string;
  name: string;
  slug: string;
  description: string;
};

export const categories: PrayerCategory[] = [
  { id: "c1",  name: "Deliverance Prayers",        slug: "deliverance",         description: "Breaking spiritual bondage and oppression." },
  { id: "c2",  name: "Healing Prayers",            slug: "healing",             description: "Physical, emotional, and spiritual healing." },
  { id: "c3",  name: "Protection Prayers",         slug: "protection",          description: "Psalm 91-style covering and spiritual safety." },
  { id: "c4",  name: "Forgiveness Prayers",        slug: "forgiveness",         description: "Releasing others and receiving forgiveness." },
  { id: "c5",  name: "Repentance Prayers",         slug: "repentance",          description: "Turning back to God with a contrite heart." },
  { id: "c6",  name: "Court of Heaven Prayers",    slug: "court-of-heaven",     description: "Legal spiritual warfare in the heavenly realm." },
  { id: "c7",  name: "Employment & Provision",     slug: "employment-provision",description: "Job, career, and financial breakthrough." },
  { id: "c8",  name: "Relationship Restoration",   slug: "relationship-restoration", description: "Reconciliation and mending broken relationships." },
  { id: "c9",  name: "Marriage Prayers",           slug: "marriage",            description: "Unity, love, and covenant protection for spouses." },
  { id: "c10", name: "Family Prayers",             slug: "family",              description: "Blessing and covering for household members." },
  { id: "c11", name: "Anxiety & Peace Prayers",    slug: "anxiety-peace",       description: "Casting cares and receiving God’s peace." },
  { id: "c12", name: "Spiritual Warfare Prayers",  slug: "spiritual-warfare",   description: "Confronting darkness with Kingdom authority." },
  { id: "c13", name: "Breaking Soul Ties",         slug: "breaking-soul-ties",  description: "Severing unhealthy spiritual connections." },
  { id: "c14", name: "Freedom from Addiction",     slug: "freedom-addiction",   description: "Breaking chains of substance and behavioral addiction." },
  { id: "c15", name: "Identity in Christ",         slug: "identity-in-christ",  description: "Knowing who you are as a child of God." },
  { id: "c16", name: "Wisdom & Direction",         slug: "wisdom-direction",    description: "Guidance for decisions and next steps." },
  { id: "c17", name: "Morning Prayers",            slug: "morning",             description: "Starting the day with surrender and purpose." },
  { id: "c18", name: "Night Prayers",              slug: "night",               description: "Peaceful surrender before sleep." },
  { id: "c19", name: "Prayers for Children",       slug: "children",            description: "Blessing, protection, and destiny for kids." },
  { id: "c20", name: "Prayers for Business",       slug: "business",            description: "Blessing work, ventures, and entrepreneurship." },
  { id: "c21", name: "Prayers for Grief & Loss",   slug: "grief-loss",          description: "Comfort in mourning and seasons of sorrow." },
  { id: "c22", name: "Prayers for Strength",       slug: "strength",            description: "Renewed power when weary." },
  { id: "c23", name: "Prayers Against Fear",       slug: "against-fear",        description: "Replacing terror with faith and confidence." },
  { id: "c24", name: "Purpose & Calling",          slug: "purpose-calling",     description: "Discovering and walking in divine destiny." },
];

export function getCategoryBySlug(slug: string): PrayerCategory | undefined {
  return categories.find((c) => c.slug === slug);
}

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function durationBucket(seconds: number): "short" | "medium" | "long" {
  if (seconds < 5 * 60) return "short";
  if (seconds <= 15 * 60) return "medium";
  return "long";
}
