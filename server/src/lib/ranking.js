const { User } = require("../models/User");
const { distanceKm } = require("./geo");

/**
 * Who's best for a job: higher rating first (to one decimal, so 4.86 and 4.84
 * tie), then the nearer one. Used for offering jobs and for the "top
 * professionals near you" lists, so both agree.
 */
const byRatingThenDistance = (a, b) =>
  Math.round(b.pro.provider.rating * 10) - Math.round(a.pro.provider.rating * 10) || a.km - b.km;

/**
 * "AI pick": a balance of rating, how many jobs they've done, experience,
 * being online now, and distance, so a great professional a little further
 * away can beat a closer, newer one.
 */
function pickScore({ pro, km }) {
  const p = pro.provider;
  return (
    (p.rating || 0) * 20 +
    Math.min(p.jobsDone || 0, 500) / 50 +
    Math.min(p.experienceYears || 0, 20) * 0.4 +
    (p.online ? 3 : 0) -
    km * 0.8
  );
}

/** Approved professionals with all the `skills` whose travel radius covers the place. */
async function coveringProviders({ skills, lat, lng, exclude }) {
  const pros = await User.find(
    {
      role: "professional",
      "provider.idDoc.status": "approved",
      "provider.payout.method": { $exists: true },
      "provider.skills": { $all: skills },
    },
    "name email avatar provider"
  );
  return pros
    .filter((p) => p.provider.area?.lat != null && !(exclude && p._id.equals(exclude)))
    .map((pro) => ({ pro, km: distanceKm({ lat, lng }, pro.provider.area) }))
    .filter((x) => x.km <= x.pro.provider.radiusKm);
}

/** What customers see about a professional: no phone, email or exact base. */
function publicCard({ pro, km }, flags = {}) {
  const p = pro.provider;
  return {
    id: pro.id,
    name: pro.name,
    avatar: pro.avatar || null,
    rating: Math.round((p.rating || 0) * 100) / 100,
    ratingCount: p.ratingCount || 0,
    jobsDone: p.jobsDone || 0,
    experienceYears: p.experienceYears || 0,
    area: (p.area?.label || "").split(",")[0],
    distanceKm: Math.round(km * 10) / 10,
    about: (p.about || "").slice(0, 160),
    skills: p.skills,
    online: Boolean(p.online),
    ...flags,
  };
}

/** The best few professionals for a service near a place, each marked best, closest or AI pick. */
async function topProviders({ skills, lat, lng, limit = 5, exclude }) {
  const covering = await coveringProviders({ skills, lat, lng, exclude });
  if (!covering.length) return [];
  const best = [...covering].sort(byRatingThenDistance)[0];
  const closest = [...covering].sort((a, b) => a.km - b.km)[0];
  const pick = [...covering].sort((a, b) => pickScore(b) - pickScore(a))[0];
  const ranked = [...covering].sort((a, b) => pickScore(b) - pickScore(a));
  // The three highlighted ones first, then the rest by the same score.
  const ordered = [...new Set([pick, best, closest, ...ranked])].slice(0, limit);
  return ordered.map((x) =>
    publicCard(x, { aiPick: x === pick, bestRated: x === best, closest: x === closest })
  );
}

module.exports = { byRatingThenDistance, pickScore, coveringProviders, topProviders, publicCard };
