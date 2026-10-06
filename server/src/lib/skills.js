/**
 * The kinds of work a professional can sign up for, and which services each
 * one covers. Bookings are only offered to professionals with the right skill.
 */
const SKILLS = [
  { key: "cleaning", label: "Home cleaning", icon: "🧽" },
  { key: "pest-control", label: "Pest control", icon: "🪳" },
  { key: "salon-women", label: "Women's salon & spa", icon: "💅" },
  { key: "salon-men", label: "Men's salon & massage", icon: "💈" },
  { key: "appliance-repair", label: "AC & appliance repair", icon: "❄️" },
  { key: "electrician", label: "Electrician", icon: "💡" },
  { key: "plumber", label: "Plumber", icon: "🚰" },
  { key: "carpenter", label: "Carpenter", icon: "🪚" },
  { key: "painting", label: "Painting & waterproofing", icon: "🎨" },
];
const SKILL_KEYS = SKILLS.map((s) => s.key);

// Service page slug (client/src/data/services.js) → skill.
const SUB_SKILL = {
  "bathroom-cleaning": "cleaning",
  "kitchen-cleaning": "cleaning",
  "living-bedroom-cleaning": "cleaning",
  "full-home-cleaning": "cleaning",
  "insta-help": "cleaning",
  "cockroach-control": "pest-control",
  "termite-control": "pest-control",
  "ants-bedbugs-control": "pest-control",
  "salon-women": "salon-women",
  "spa-women": "salon-women",
  "hair-studio-women": "salon-women",
  "makeup-styling": "salon-women",
  "salon-men": "salon-men",
  "salon-royale": "salon-men",
  "salon-prime": "salon-men",
  "massage-men": "salon-men",
  ac: "appliance-repair",
  "washing-machine": "appliance-repair",
  refrigerator: "appliance-repair",
  television: "appliance-repair",
  chimney: "appliance-repair",
  microwave: "appliance-repair",
  stove: "appliance-repair",
  laptop: "appliance-repair",
  "water-purifier": "appliance-repair",
  geyser: "appliance-repair",
  electrician: "electrician",
  "festive-lights": "electrician",
  plumber: "plumber",
  "tile-grouting": "plumber",
  carpenter: "carpenter",
  "furniture-assembly": "carpenter",
  "flatpack-assembly": "carpenter",
  "wall-panels": "carpenter",
  painting: "painting",
};

// Home-page service cards (client/src/data/catalog.js) carry a broad category instead.
const CATEGORY_SKILL = {
  Cleaning: "cleaning",
  Beauty: "salon-women",
  Appliance: "appliance-repair",
  Plumbing: "plumber",
};

/** The skill a cart item needs, or null when it can't be told. */
function skillFor(item) {
  if (SUB_SKILL[item.sub]) return SUB_SKILL[item.sub];
  if (CATEGORY_SKILL[item.category]) return CATEGORY_SKILL[item.category];
  return null;
}

module.exports = { SKILLS, SKILL_KEYS, skillFor };
