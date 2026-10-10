// Fills the database with demo accounts for trying Servify end to end:
// 50 customers and 100 approved professionals, mostly in Hyderabad and the rest
// in towns across Telangana.
//
//   npm run seed
//
// Every demo account uses the reserved ".test" email domain, so re-running
// replaces them without touching real accounts. Logins are written to
// DEMO_ACCOUNTS.md at the repository root.
const fs = require("node:fs");
const path = require("node:path");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const config = require("../src/config");
const { User } = require("../src/models/User");
const { Booking } = require("../src/models/Booking");
const { SKILLS } = require("../src/lib/skills");

const DEMO_DOMAINS = ["mailbox.test", "inbox.test", "postbox.test", "letters.test"];
const DEMO_EMAIL = /@(mailbox|inbox|postbox|letters)\.test$/;
// Demo passwords are throwaway, so a lower bcrypt cost keeps seeding quick.
const BCRYPT_COST = 10;

// Same results every run.
function random(seed) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = random(20261006);
const pick = (list) => list[Math.floor(rand() * list.length)];
const jitter = (n, by = 0.006) => Math.round((n + (rand() - 0.5) * by) * 1e5) / 1e5;

const AREAS = [
  ["Madhapur", 17.4483, 78.3915], ["HITEC City", 17.4435, 78.3772], ["Gachibowli", 17.44, 78.3489],
  ["Kondapur", 17.4609, 78.3568], ["Kukatpally", 17.4849, 78.4138], ["Miyapur", 17.4968, 78.3614],
  ["Jubilee Hills", 17.4326, 78.4071], ["Banjara Hills", 17.4156, 78.4347], ["Ameerpet", 17.4375, 78.4482],
  ["Begumpet", 17.4447, 78.4664], ["Secunderabad", 17.4399, 78.4983], ["Somajiguda", 17.4239, 78.4583],
  ["Himayatnagar", 17.4022, 78.4867], ["Abids", 17.3924, 78.4757], ["Mehdipatnam", 17.3959, 78.4312],
  ["Tolichowki", 17.3999, 78.4136], ["Manikonda", 17.4026, 78.3866], ["Attapur", 17.3707, 78.4235],
  ["Charminar", 17.3616, 78.4747], ["Malakpet", 17.3747, 78.5038], ["Dilsukhnagar", 17.3687, 78.5247],
  ["LB Nagar", 17.3457, 78.5522], ["Uppal", 17.4058, 78.5591], ["Tarnaka", 17.4281, 78.5383],
  ["Habsiguda", 17.4182, 78.5434], ["Kompally", 17.5367, 78.4846],
].map(([name, lat, lng]) => ({ name, lat, lng, city: "Hyderabad" }));

// Towns elsewhere in Telangana: three professionals and one customer each.
const TOWNS = [
  ["Warangal", 17.9689, 79.5941], ["Karimnagar", 18.4386, 79.1288], ["Nizamabad", 18.6725, 78.0941],
  ["Khammam", 17.2473, 80.1514], ["Nalgonda", 17.0575, 79.2684], ["Mahbubnagar", 16.7488, 78.0035],
  ["Siddipet", 18.1018, 78.852], ["Adilabad", 19.6641, 78.532],
].map(([name, lat, lng]) => ({ name, lat, lng, city: "Telangana" }));
const IN_TOWNS = { customers: TOWNS.length, providers: TOWNS.length * 3 };

const FIRST = [
  "Aarav", "Aditya", "Akhil", "Anil", "Arjun", "Bhavana", "Chaitanya", "Deepika", "Divya", "Farhan",
  "Fatima", "Gayatri", "Harsha", "Imran", "Kavya", "Keerthi", "Kiran", "Lakshmi", "Mahesh", "Meera",
  "Mohammed", "Naveen", "Nikhil", "Pooja", "Pradeep", "Priya", "Rahul", "Ramesh", "Ravi", "Rohan",
  "Sai", "Sameer", "Sana", "Sandeep", "Shreya", "Sneha", "Srinivas", "Suresh", "Swathi", "Tejas",
  "Uday", "Varun", "Venkat", "Vijay", "Yasmin", "Zoya", "Ayesha", "Bhargav", "Hari", "Ishaan",
];
const LAST = [
  "Reddy", "Rao", "Naidu", "Sharma", "Verma", "Khan", "Ali", "Hussain", "Iyer", "Nair",
  "Patel", "Gupta", "Kumar", "Chowdary", "Goud", "Yadav", "Siddiqui", "Varma", "Pillai", "Joshi",
];
const BUILDINGS = ["Lotus Residency", "Green Park Apartments", "Sai Enclave", "Pearl Heights", "Cyber Towers", "Sunrise Villas", "Lake View Homes", "Royal Gardens"];
const ABOUT = [
  (y, s) => `${y} years of experience in ${s}. On time, polite and careful in your home.`,
  (y, s) => `${s} లో ${y} సంవత్సరాల అనుభవం. సమయానికి వచ్చి శుభ్రంగా పని చేస్తాను.`,
  (y, s) => `${s} में ${y} साल का अनुभव। समय पर आता हूँ और काम साफ़-सुथरा करता हूँ।`,
  (y, s) => `${s} میں ${y} سال کا تجربہ۔ وقت کی پابندی اور صاف ستھرا کام۔`,
];

const pad = (n) => String(n).padStart(3, "0");
const usedEmails = new Set();
function emailFor(first, last, i) {
  const base = `${first}.${last}`.toLowerCase();
  let email = `${base}@${DEMO_DOMAINS[i % DEMO_DOMAINS.length]}`;
  for (let n = 2; usedEmails.has(email); n++) email = `${base}${n}@${DEMO_DOMAINS[i % DEMO_DOMAINS.length]}`;
  usedEmails.add(email);
  return email;
}

async function main() {
  await mongoose.connect(config.mongoUri);
  console.log(`Seeding ${mongoose.connection.name}…`);

  const old = await User.find({ email: DEMO_EMAIL }, "_id");
  const oldIds = old.map((u) => u._id);
  await Booking.deleteMany({ $or: [{ user: { $in: oldIds } }, { professional: { $in: oldIds } }] });
  await User.deleteMany({ _id: { $in: oldIds } });

  const customers = [];
  for (let i = 1; i <= 50; i++) {
    const first = pick(FIRST);
    const last = pick(LAST);
    const area = i > 50 - IN_TOWNS.customers ? TOWNS[i - 1 - (50 - IN_TOWNS.customers)] : AREAS[(i * 7) % AREAS.length];
    customers.push({
      name: `${first} ${last}`,
      email: emailFor(first, last, i),
      password: `Customer@${pad(i)}`,
      phone: `71${String(i).padStart(8, "0")}`,
      area,
      address: {
        label: "Home",
        house: `Flat ${100 + Math.floor(rand() * 400)}, ${pick(BUILDINGS)}`,
        area: `${area.name}, ${area.city}`,
        landmark: "",
        lat: jitter(area.lat),
        lng: jitter(area.lng),
      },
    });
  }

  const providers = [];
  for (let i = 1; i <= 100; i++) {
    const first = pick(FIRST);
    const last = pick(LAST);
    const area = i > 100 - IN_TOWNS.providers ? TOWNS[(i - 1 - (100 - IN_TOWNS.providers)) % TOWNS.length] : AREAS[i % AREAS.length];
    const primary = SKILLS[i % SKILLS.length];
    const skills = [primary.key];
    if (rand() < 0.4) {
      const extra = SKILLS[(i * 4 + 3) % SKILLS.length].key;
      if (extra !== primary.key) skills.push(extra);
    }
    const years = 1 + Math.floor(rand() * 15);
    providers.push({
      name: `${first} ${last}`,
      email: emailFor(first, last, i + 50),
      password: `Provider@${pad(i)}`,
      phone: `81${String(i).padStart(8, "0")}`,
      area,
      skills,
      radiusKm: 8 + Math.floor(rand() * 5),
      years,
      about: ABOUT[i % ABOUT.length](years, primary.label.toLowerCase()),
      rating: Math.round((4.5 + rand() * 0.45) * 100) / 100,
    });
  }

  const hash = (pw) => bcrypt.hash(pw, BCRYPT_COST);
  await User.insertMany(
    await Promise.all(
      customers.map(async (c) => ({
        name: c.name,
        email: c.email,
        phone: c.phone,
        role: "customer",
        passwordHash: await hash(c.password),
        addresses: [c.address],
      }))
    )
  );
  await User.insertMany(
    await Promise.all(
      providers.map(async (p) => ({
        name: p.name,
        email: p.email,
        phone: p.phone,
        role: "professional",
        passwordHash: await hash(p.password),
        provider: {
          skills: p.skills,
          experienceYears: p.years,
          about: p.about,
          area: { label: `${p.area.name}, ${p.area.city}`, lat: jitter(p.area.lat), lng: jitter(p.area.lng) },
          radiusKm: p.radiusKm,
          // Demo profiles skip the document upload; real sign-ups go through the ID check.
          idDoc: { type: "aadhaar", last4: String(1000 + Math.floor(rand() * 9000)), status: "approved", by: "seed", reason: "Demo account", checkedAt: new Date() },
          payout: { method: "upi", upiId: `${p.email.split("@")[0]}@demo` },
          online: true,
          rating: p.rating,
        },
      }))
    )
  );

  const label = (key) => SKILLS.find((s) => s.key === key).label;
  const place = (a) => (a.city === "Hyderabad" ? `${a.name}, Hyderabad` : a.name);
  const lines = [
    "# Demo accounts",
    "",
    "Made by `npm run seed` in `server/`. Everything here is test data: the email",
    "domains end in `.test`, which can never be real addresses, and the phone",
    "numbers and UPI IDs are made up. Sign in with the email (or phone) and password.",
    "Re-running the seed replaces these accounts and their bookings.",
    "",
    "Professionals are online and approved. A booking goes to the nearest one",
    "whose services match and whose radius covers the address, so to test a",
    "booking in an area, sign in as a professional based near it.",
    "",
    `Most accounts are in Hyderabad. Professionals ${101 - IN_TOWNS.providers}–100 (three per town) and`,
    `customers ${51 - IN_TOWNS.customers}–50 (one per town) are in other Telangana towns: ${TOWNS.map((t) => t.name).join(", ")}.`,
    "A town customer's booking only finds professionals in that town who offer the service.",
    "",
    `## Professionals (${providers.length})`,
    "",
    "| # | Name | Email | Password | Phone | Based in | Radius | Services |",
    "|---|---|---|---|---|---|---|---|",
    ...providers.map(
      (p, i) =>
        `| ${i + 1} | ${p.name} | ${p.email} | ${p.password} | ${p.phone} | ${place(p.area)} | ${p.radiusKm} km | ${p.skills.map(label).join(", ")} |`
    ),
    "",
    `## Customers (${customers.length})`,
    "",
    "Each has a saved home address in the area shown.",
    "",
    "| # | Name | Email | Password | Phone | Home area |",
    "|---|---|---|---|---|---|",
    ...customers.map((c, i) => `| ${i + 1} | ${c.name} | ${c.email} | ${c.password} | ${c.phone} | ${place(c.area)} |`),
    "",
  ];
  const out = path.join(__dirname, "..", "..", "DEMO_ACCOUNTS.md");
  fs.writeFileSync(out, lines.join("\n"));
  console.log(`Created ${customers.length} customers and ${providers.length} professionals.`);
  console.log(`Logins written to ${path.relative(process.cwd(), out)}`);
  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error("Seeding failed:", err.message);
  await mongoose.disconnect();
  process.exit(1);
});
