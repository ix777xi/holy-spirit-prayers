// Seeded data for Holy Spirit Prayers — used as a mock backend.
// Backend stubs return these via API; this file is also imported directly
// by the client for instant rendering and offline preview.

export type PrayerCategory = {
  id: string;
  name: string;
  slug: string;
  description: string;
};

export type Prayer = {
  id: string;
  slug: string;
  title: string;
  categorySlug: string;
  bibleTheme: string;
  scriptures: string[];
  description: string;
  whatsIncluded: string[];
  durationSeconds: number;
  price: number; // 0 means free
  isFree: boolean;
  isFeatured: boolean;
  playCount: number;
  purchaseCount: number;
  // Visual artwork swatch — gradient stops + accent
  art: {
    from: string;
    to: string;
    accent: string;
    motif: "dove" | "flame" | "cross" | "rays" | "olive";
  };
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

const A = (from: string, to: string, accent: string, motif: Prayer["art"]["motif"]) =>
  ({ from, to, accent, motif } as Prayer["art"]);

export const prayers: Prayer[] = [
  {
    id: "p1",
    slug: "psalm-91-shield-of-protection",
    title: "Psalm 91 — Shield of Protection",
    categorySlug: "protection",
    bibleTheme: "A covenant of covering for those who dwell in the secret place.",
    scriptures: ["Psalm 91:1–16", "Psalm 27:1", "2 Thessalonians 3:3"],
    description:
      "A guided prayer that walks verse-by-verse through Psalm 91, declaring God’s shelter, refuge, and angelic protection over your home, family, and going-out and coming-in.",
    whatsIncluded: ["Full audio prayer (12 min)", "Written transcript (PDF)", "Meditation guide"],
    durationSeconds: 740,
    price: 7,
    isFree: false,
    isFeatured: true,
    playCount: 18420,
    purchaseCount: 2410,
    art: A("#050505", "#6B7280", "#111111", "rays"),
  },
  {
    id: "p2",
    slug: "morning-surrender-let-the-spirit-lead",
    title: "Morning Surrender — Let the Spirit Lead",
    categorySlug: "morning",
    bibleTheme: "Beginning the day yielded, listening, and ready.",
    scriptures: ["Lamentations 3:22–23", "Romans 8:14", "Psalm 5:3"],
    description:
      "Open your morning with stillness. This prayer surrenders your plans, attention, and conversations to the Holy Spirit so that the day’s steps are ordered by Him.",
    whatsIncluded: ["Full audio prayer (8 min)", "Written transcript", "7-day morning rhythm"],
    durationSeconds: 510,
    price: 0,
    isFree: true,
    isFeatured: true,
    playCount: 64200,
    purchaseCount: 0,
    art: A("#FFFFFF", "#2B2B2B", "#050505", "dove"),
  },
  {
    id: "p3",
    slug: "anxiety-cast-your-care",
    title: "Anxiety — Cast Your Care",
    categorySlug: "anxiety-peace",
    bibleTheme: "The peace that guards heart and mind in Christ Jesus.",
    scriptures: ["Philippians 4:6–7", "1 Peter 5:7", "Isaiah 26:3"],
    description:
      "A slow, breath-paced prayer for the anxious mind. Releases the day’s worries and invites the peace of God to garrison your heart.",
    whatsIncluded: ["Full audio (10 min)", "Breath cues", "Scripture reference card"],
    durationSeconds: 615,
    price: 7,
    isFree: false,
    isFeatured: true,
    playCount: 27300,
    purchaseCount: 3120,
    art: A("#6B7280", "#FFFFFF", "#111111", "olive"),
  },
  {
    id: "p4",
    slug: "healing-by-his-stripes",
    title: "Healing — By His Stripes",
    categorySlug: "healing",
    bibleTheme: "Jesus carried our sicknesses; healing is part of His covenant.",
    scriptures: ["Isaiah 53:4–5", "1 Peter 2:24", "Psalm 103:2–3"],
    description:
      "A scripture-heavy declaration prayer that walks the body, soul, and spirit through what the cross secured. Use as part of an ongoing healing rhythm.",
    whatsIncluded: ["Full audio (14 min)", "Scripture meditation", "Daily declaration list"],
    durationSeconds: 840,
    price: 7,
    isFree: false,
    isFeatured: true,
    playCount: 22100,
    purchaseCount: 2790,
    art: A("#111111", "#050505", "#FFFFFF", "cross"),
  },
  {
    id: "p5",
    slug: "deliverance-breaking-every-chain",
    title: "Deliverance — Breaking Every Chain",
    categorySlug: "deliverance",
    bibleTheme: "The Son sets free, and whom He sets free is free indeed.",
    scriptures: ["John 8:36", "Isaiah 10:27", "Galatians 5:1"],
    description:
      "A bold deliverance prayer renouncing patterns of bondage and declaring freedom in the name of Jesus. Pair with repentance and Word.",
    whatsIncluded: ["Full audio (16 min)", "Renunciation script", "Aftercare guide"],
    durationSeconds: 970,
    price: 7,
    isFree: false,
    isFeatured: true,
    playCount: 14800,
    purchaseCount: 1860,
    art: A("#050505", "#111111", "#6B7280", "flame"),
  },
  {
    id: "p6",
    slug: "marriage-covenant-of-love",
    title: "Marriage — Covenant of Love",
    categorySlug: "marriage",
    bibleTheme: "Two becoming one under the covering of Christ.",
    scriptures: ["Ephesians 5:21–33", "Ecclesiastes 4:12", "Song of Solomon 8:7"],
    description:
      "A tender prayer for spouses — for unity, honor, attraction, and protection of your covenant from offense and outside voices.",
    whatsIncluded: ["Full audio (11 min)", "Couple’s liturgy", "Weekly rhythm"],
    durationSeconds: 660,
    price: 7,
    isFree: false,
    isFeatured: true,
    playCount: 9400,
    purchaseCount: 1240,
    art: A("#2B2B2B", "#6B7280", "#050505", "olive"),
  },
  {
    id: "p7",
    slug: "night-prayer-rest-in-his-shadow",
    title: "Night Prayer — Rest in His Shadow",
    categorySlug: "night",
    bibleTheme: "He gives His beloved sleep.",
    scriptures: ["Psalm 4:8", "Psalm 127:2", "Proverbs 3:24"],
    description:
      "A quiet prayer for the end of the day. Hands the day’s weights back to the Lord and welcomes deep, restorative sleep under His shadow.",
    whatsIncluded: ["Full audio (9 min)", "Wind-down liturgy", "Scripture lullaby"],
    durationSeconds: 555,
    price: 7,
    isFree: false,
    isFeatured: false,
    playCount: 11200,
    purchaseCount: 980,
    art: A("#050505", "#6B7280", "#2B2B2B", "dove"),
  },
  {
    id: "p8",
    slug: "wisdom-direction-show-me-the-way",
    title: "Wisdom & Direction — Show Me the Way",
    categorySlug: "wisdom-direction",
    bibleTheme: "If any lacks wisdom, let him ask of God who gives generously.",
    scriptures: ["James 1:5", "Proverbs 3:5–6", "Psalm 32:8"],
    description:
      "Stand at the crossroads with confidence. This prayer asks for clarity and the courage to obey when the next step is shown.",
    whatsIncluded: ["Full audio (10 min)", "Decision journal", "Discernment checklist"],
    durationSeconds: 600,
    price: 7,
    isFree: false,
    isFeatured: true,
    playCount: 13560,
    purchaseCount: 1410,
    art: A("#6B7280", "#111111", "#050505", "rays"),
  },
  {
    id: "p9",
    slug: "freedom-from-addiction",
    title: "Freedom from Addiction",
    categorySlug: "freedom-addiction",
    bibleTheme: "Where the Spirit of the Lord is, there is liberty.",
    scriptures: ["2 Corinthians 3:17", "Romans 6:14", "1 Corinthians 10:13"],
    description:
      "A prayer for the long road of freedom. Declares the new nature, severs old agreements, and asks the Holy Spirit to walk you out one day at a time.",
    whatsIncluded: ["Full audio (15 min)", "30-day declaration plan", "Aftercare prompts"],
    durationSeconds: 905,
    price: 7,
    isFree: false,
    isFeatured: false,
    playCount: 8120,
    purchaseCount: 760,
    art: A("#111111", "#050505", "#FFFFFF", "flame"),
  },
  {
    id: "p10",
    slug: "identity-in-christ-i-am-his",
    title: "Identity in Christ — I Am His",
    categorySlug: "identity-in-christ",
    bibleTheme: "A new creation; the old has passed, the new has come.",
    scriptures: ["2 Corinthians 5:17", "Ephesians 1:3–14", "Galatians 2:20"],
    description:
      "A first-person liturgy of who you are in Christ. Builds spiritual confidence by anchoring identity to Scripture rather than performance.",
    whatsIncluded: ["Full audio (12 min)", "I AM declarations card", "Weekly rhythm"],
    durationSeconds: 720,
    price: 7,
    isFree: false,
    isFeatured: true,
    playCount: 19400,
    purchaseCount: 2210,
    art: A("#FFFFFF", "#111111", "#050505", "cross"),
  },
  {
    id: "p11",
    slug: "spiritual-warfare-armor-up",
    title: "Spiritual Warfare — Armor Up",
    categorySlug: "spiritual-warfare",
    bibleTheme: "Putting on the full armor of God for the day’s battles.",
    scriptures: ["Ephesians 6:10–18", "2 Corinthians 10:3–5", "Luke 10:19"],
    description:
      "A bold morning warfare prayer that names each piece of armor and the assignment it answers. Use before high-stakes days.",
    whatsIncluded: ["Full audio (13 min)", "Armor liturgy", "Daily watch prompts"],
    durationSeconds: 790,
    price: 7,
    isFree: false,
    isFeatured: false,
    playCount: 10300,
    purchaseCount: 1145,
    art: A("#050505", "#111111", "#6B7280", "flame"),
  },
  {
    id: "p12",
    slug: "employment-provision-open-doors",
    title: "Employment & Provision — Open Doors",
    categorySlug: "employment-provision",
    bibleTheme: "He opens what no one can shut.",
    scriptures: ["Revelation 3:8", "Philippians 4:19", "Deuteronomy 8:18"],
    description:
      "Pray for favor, open doors, and supernatural provision. A practical prayer for job seekers, career transitions, and those waiting on breakthrough.",
    whatsIncluded: ["Full audio (11 min)", "Interview liturgy", "Stewardship prompts"],
    durationSeconds: 670,
    price: 7,
    isFree: false,
    isFeatured: false,
    playCount: 9700,
    purchaseCount: 1080,
    art: A("#111111", "#6B7280", "#050505", "rays"),
  },
  {
    id: "p13",
    slug: "family-blessing-over-our-home",
    title: "Family — Blessing Over Our Home",
    categorySlug: "family",
    bibleTheme: "As for me and my house, we will serve the Lord.",
    scriptures: ["Joshua 24:15", "Psalm 128", "Acts 16:31"],
    description:
      "A liturgy to pray over your household — covering doorways, bedrooms, and conversations with peace and the fear of the Lord.",
    whatsIncluded: ["Full audio (10 min)", "Room-by-room blessing", "Weekly family rhythm"],
    durationSeconds: 600,
    price: 7,
    isFree: false,
    isFeatured: false,
    playCount: 8200,
    purchaseCount: 920,
    art: A("#FFFFFF", "#6B7280", "#111111", "olive"),
  },
  {
    id: "p14",
    slug: "grief-comfort-in-mourning",
    title: "Grief — Comfort in Mourning",
    categorySlug: "grief-loss",
    bibleTheme: "Blessed are those who mourn, for they shall be comforted.",
    scriptures: ["Matthew 5:4", "Psalm 34:18", "Revelation 21:4"],
    description:
      "A gentle, unhurried prayer for the brokenhearted. Holds space for sorrow while inviting the Comforter into the deepest places.",
    whatsIncluded: ["Full audio (12 min)", "Lament prompts", "Companion Scriptures"],
    durationSeconds: 720,
    price: 7,
    isFree: false,
    isFeatured: false,
    playCount: 7400,
    purchaseCount: 690,
    art: A("#6B7280", "#050505", "#2B2B2B", "dove"),
  },
  {
    id: "p15",
    slug: "purpose-calling-walk-in-it",
    title: "Purpose & Calling — Walk in It",
    categorySlug: "purpose-calling",
    bibleTheme: "Created in Christ for good works prepared in advance.",
    scriptures: ["Ephesians 2:10", "Jeremiah 29:11", "Romans 11:29"],
    description:
      "Step into the assignment God has prepared. This prayer awakens calling, names fears, and consecrates the next season.",
    whatsIncluded: ["Full audio (11 min)", "Calling prompts", "Consecration liturgy"],
    durationSeconds: 660,
    price: 7,
    isFree: false,
    isFeatured: true,
    playCount: 11900,
    purchaseCount: 1320,
    art: A("#111111", "#FFFFFF", "#050505", "rays"),
  },
  {
    id: "p16",
    slug: "against-fear-perfect-love",
    title: "Against Fear — Perfect Love Casts Out",
    categorySlug: "against-fear",
    bibleTheme: "God has not given us a spirit of fear.",
    scriptures: ["2 Timothy 1:7", "1 John 4:18", "Psalm 23:4"],
    description:
      "A prayer that names fear, exchanges it for love, power, and a sound mind, and re-anchors the heart in the Father’s nearness.",
    whatsIncluded: ["Full audio (9 min)", "Exchange liturgy", "Truth declarations"],
    durationSeconds: 540,
    price: 7,
    isFree: false,
    isFeatured: false,
    playCount: 9100,
    purchaseCount: 1010,
    art: A("#050505", "#2B2B2B", "#6B7280", "flame"),
  },
  {
    id: "p17",
    slug: "forgiveness-let-it-go",
    title: "Forgiveness — Let It Go",
    categorySlug: "forgiveness",
    bibleTheme: "As we have been forgiven, we forgive.",
    scriptures: ["Matthew 6:14–15", "Colossians 3:13", "Ephesians 4:32"],
    description:
      "A guided release of resentment, naming who and what you forgive — and receiving freshness from the One who forgave you first.",
    whatsIncluded: ["Full audio (10 min)", "Release prompts", "Daily check-in"],
    durationSeconds: 600,
    price: 7,
    isFree: false,
    isFeatured: false,
    playCount: 8600,
    purchaseCount: 890,
    art: A("#FFFFFF", "#111111", "#6B7280", "olive"),
  },
  {
    id: "p18",
    slug: "children-cover-and-call-them",
    title: "For My Children — Cover & Call Them",
    categorySlug: "children",
    bibleTheme: "Train up a child; entrust them to the Lord.",
    scriptures: ["Proverbs 22:6", "Isaiah 54:13", "Psalm 127:3"],
    description:
      "A daily prayer for parents and grandparents — protection, identity, friendships, and destiny over the next generation.",
    whatsIncluded: ["Full audio (10 min)", "Bedtime liturgy", "Identity blessings"],
    durationSeconds: 600,
    price: 7,
    isFree: false,
    isFeatured: true,
    playCount: 10200,
    purchaseCount: 1190,
    art: A("#6B7280", "#FFFFFF", "#111111", "dove"),
  },
];

export function getPrayerBySlug(slug: string): Prayer | undefined {
  return prayers.find((p) => p.slug === slug);
}

export function getCategoryBySlug(slug: string): PrayerCategory | undefined {
  return categories.find((c) => c.slug === slug);
}

export function getRelated(prayer: Prayer, n = 3): Prayer[] {
  return prayers
    .filter((p) => p.id !== prayer.id && p.categorySlug === prayer.categorySlug)
    .slice(0, n)
    .concat(
      prayers
        .filter((p) => p.id !== prayer.id && p.categorySlug !== prayer.categorySlug)
    )
    .slice(0, n);
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

// Mock orders / users / requests for admin views
export type OrderRow = {
  id: string;
  userName: string;
  userEmail: string;
  prayerSlug: string;
  amount: number;
  date: string; // ISO
  paymentStatus: "paid" | "pending" | "refunded" | "failed";
  downloadStatus: "available" | "expired" | "pending";
};

export const mockOrders: OrderRow[] = Array.from({ length: 28 }).map((_, i) => {
  const p = prayers[i % prayers.length];
  const d = new Date();
  d.setDate(d.getDate() - i);
  return {
    id: `ORD-${(2401 + i).toString()}`,
    userName: ["Hannah Cole","Marcus Reed","Priscilla Adeyemi","Daniel Okafor","Ruth Patel","Elijah Tan","Mara Gomez","Stephen Park","Lydia Brooks","Caleb Hayes"][i % 10],
    userEmail: `user${i + 1}@example.com`,
    prayerSlug: p.slug,
    amount: p.price || 7,
    date: d.toISOString(),
    paymentStatus: ["paid","paid","paid","pending","paid","paid","refunded","paid"][i % 8] as OrderRow["paymentStatus"],
    downloadStatus: ["available","available","pending","available","available","expired","available","available"][i % 8] as OrderRow["downloadStatus"],
  };
});

export type CustomRequestRow = {
  id: string;
  userName: string;
  email: string;
  categorySlug: string;
  description: string;
  preferredTone: string[];
  wantAudio: boolean;
  date: string;
  status: "pending" | "in_progress" | "completed" | "delivered";
};

export const mockCustomRequests: CustomRequestRow[] = [
  { id: "REQ-1042", userName: "Naomi Carter", email: "naomi@example.com", categorySlug: "healing", description: "Prayer for my mother as she begins chemotherapy next week. She loves Psalms.", preferredTone: ["Gentle & Comforting","Scripture-Heavy"], wantAudio: true, date: "2026-05-04", status: "in_progress" },
  { id: "REQ-1041", userName: "Joseph Lim", email: "joseph@example.com", categorySlug: "employment-provision", description: "Final-round interview Friday. Praying for favor and the right words.", preferredTone: ["Powerful & Bold"], wantAudio: true, date: "2026-05-03", status: "pending" },
  { id: "REQ-1040", userName: "Tanya R.", email: "tanya@example.com", categorySlug: "marriage", description: "My husband and I are walking through restoration after a hard season.", preferredTone: ["Gentle & Comforting","Peace & Stillness"], wantAudio: true, date: "2026-05-02", status: "completed" },
  { id: "REQ-1039", userName: "Caleb Hayes", email: "caleb@example.com", categorySlug: "deliverance", description: "Patterns I’ve been fighting for a decade. Ready to break agreement.", preferredTone: ["Deliverance-Focused","Prophetic & Declarative"], wantAudio: true, date: "2026-05-01", status: "delivered" },
  { id: "REQ-1038", userName: "Sade O.",   email: "sade@example.com",   categorySlug: "wisdom-direction", description: "Considering a cross-country move with my family.", preferredTone: ["Scripture-Heavy"], wantAudio: false, date: "2026-04-30", status: "pending" },
  { id: "REQ-1037", userName: "Priscilla A.", email: "p@example.com", categorySlug: "children", description: "My oldest is struggling with anxiety. Praying over her sleep.", preferredTone: ["Gentle & Comforting"], wantAudio: true, date: "2026-04-29", status: "in_progress" },
  { id: "REQ-1036", userName: "Mara Gomez", email: "mara@example.com", categorySlug: "grief-loss", description: "Lost my brother in March. Need a prayer to pray each morning.", preferredTone: ["Peace & Stillness","Scripture-Heavy"], wantAudio: true, date: "2026-04-28", status: "delivered" },
  { id: "REQ-1035", userName: "Daniel O.", email: "daniel@example.com", categorySlug: "spiritual-warfare", description: "Leading a new ministry. Want covering for my family and team.", preferredTone: ["Powerful & Bold","Prophetic & Declarative"], wantAudio: true, date: "2026-04-27", status: "completed" },
];

export type AdminUserRow = {
  id: string;
  name: string;
  email: string;
  joined: string;
  totalPurchases: number;
  role: "user" | "admin";
};

export const mockUsers: AdminUserRow[] = [
  { id: "u1",  name: "Hannah Cole",       email: "hannah@example.com",   joined: "2026-01-12", totalPurchases: 9, role: "user" },
  { id: "u2",  name: "Marcus Reed",       email: "marcus@example.com",   joined: "2026-02-03", totalPurchases: 4, role: "user" },
  { id: "u3",  name: "Priscilla Adeyemi", email: "priscilla@example.com",joined: "2026-02-18", totalPurchases: 12, role: "user" },
  { id: "u4",  name: "Daniel Okafor",     email: "daniel@example.com",   joined: "2026-03-04", totalPurchases: 2, role: "user" },
  { id: "u5",  name: "Ruth Patel",        email: "ruth@example.com",     joined: "2026-03-12", totalPurchases: 7, role: "user" },
  { id: "u6",  name: "Elijah Tan",        email: "elijah@example.com",   joined: "2026-03-22", totalPurchases: 1, role: "user" },
  { id: "u7",  name: "Mara Gomez",        email: "mara@example.com",     joined: "2026-04-01", totalPurchases: 5, role: "user" },
  { id: "u8",  name: "Stephen Park",      email: "stephen@example.com",  joined: "2026-04-09", totalPurchases: 3, role: "user" },
  { id: "u9",  name: "Lydia Brooks",      email: "lydia@example.com",    joined: "2026-04-18", totalPurchases: 6, role: "user" },
  { id: "u10", name: "Caleb Hayes",       email: "caleb@example.com",    joined: "2026-04-22", totalPurchases: 2, role: "user" },
  { id: "u11", name: "Admin",             email: "admin@holyspiritprayers.com", joined: "2025-12-01", totalPurchases: 0, role: "admin" },
];

// Pre-baked logged-in user for demo dashboard/admin view
export const demoUser = {
  id: "u-demo",
  name: "Hannah Cole",
  email: "hannah@example.com",
  role: "user" as const,
  // owned/purchased prayer slugs
  owned: ["psalm-91-shield-of-protection", "anxiety-cast-your-care", "healing-by-his-stripes"],
  // hearted/saved prayer slugs (not necessarily purchased)
  favorites: ["morning-surrender-let-the-spirit-lead", "marriage-covenant-of-love", "identity-in-christ-i-am-his", "wisdom-direction-show-me-the-way"],
  customRequests: [
    { id: "REQ-1042", category: "Healing Prayers", date: "2026-05-04", status: "in_progress" as const },
    { id: "REQ-1018", category: "Marriage Prayers", date: "2026-04-12", status: "delivered" as const },
  ],
  purchaseDates: {
    "psalm-91-shield-of-protection": "2026-04-22",
    "anxiety-cast-your-care": "2026-03-30",
    "healing-by-his-stripes": "2026-02-14",
  } as Record<string, string>,
};

// 30-day revenue for admin dashboard chart
export const revenue30d = Array.from({ length: 30 }).map((_, i) => {
  const d = new Date();
  d.setDate(d.getDate() - (29 - i));
  // Realistic but not random-looking shape: weekday troughs, weekend peaks, slight upward trend
  const base = 280 + i * 6;
  const dow = d.getDay();
  const wave = dow === 0 || dow === 6 ? 140 : dow === 5 ? 60 : 0;
  const noise = ((i * 1103515245 + 12345) % 60) - 30;
  return { date: d.toISOString().slice(0, 10), revenue: Math.max(120, base + wave + noise) };
});

// Category-level analytics
export const popularCategories = [
  { name: "Protection", value: 28 },
  { name: "Anxiety & Peace", value: 21 },
  { name: "Healing", value: 18 },
  { name: "Identity in Christ", value: 12 },
  { name: "Marriage", value: 9 },
  { name: "Other", value: 12 },
];

export const userGrowth = Array.from({ length: 12 }).map((_, i) => ({
  month: ["Jun","Jul","Aug","Sep","Oct","Nov","Dec","Jan","Feb","Mar","Apr","May"][i],
  users: 80 + i * 65 + (i % 3) * 30,
}));
