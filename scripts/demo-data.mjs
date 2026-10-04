// Fills the local database with two weeks of safety forms so the dashboards have something to show.
// Goes through the app's real path: each seeded framer signs in, uploads photos and calls
// submit_safety_form; an admin then reviews the older ones. Run `npm run db:reset` first for a clean slate.
import { execSync } from "node:child_process"
import { crc32, deflateSync } from "node:zlib"

import { createClient } from "@supabase/supabase-js"

const DAYS = 14
const PASSWORD = "password123"
// Frank and Mei are left without a form today, so both "not submitted" states show up.
const FRAMERS = [
  { email: "framer@ras.test", today: false },
  { email: "priya.sandhu@ras.test", today: true },
  { email: "tom.bergstrom@ras.test", today: true },
  { email: "mei.chen@ras.test", today: false },
]
const CHECKLIST = [
  "hard_hat_worn",
  "vest_worn",
  "boots_worn",
  "eye_protection_worn",
  "fall_protection_inspected",
  "scaffolding_inspected",
  "ladders_inspected",
  "tools_inspected",
  "cords_inspected",
  "hazards_identified",
]
const NOTES = [
  "Wet ground by the north entrance, put down gravel.",
  "Extension cord had a nicked jacket, swapped it out.",
  "Ladder feet worn, tagged out and replaced.",
  "Wind picked up after lunch, paused roof work for an hour.",
  "",
  "",
  "",
]

const status = JSON.parse(
  execSync("npx supabase status -o json", {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  }),
)
const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Vancouver" }).format(new Date())

// Seeded so reruns after a reset produce the same data.
let seed = 42
const random = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646
const pick = (items) => items[Math.floor(random() * items.length)]

function addDays(date, days) {
  const d = new Date(`${date}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

// A small solid-colour PNG with a darker band, standing in for a site photo.
function png(r, g, b, width = 320, height = 240) {
  const chunk = (type, data) => {
    const body = Buffer.concat([Buffer.from(type), data])
    const out = Buffer.alloc(body.length + 8)
    out.writeUInt32BE(data.length, 0)
    body.copy(out, 4)
    out.writeUInt32BE(crc32(body), body.length + 4)
    return out
  }
  const header = Buffer.alloc(13)
  header.writeUInt32BE(width, 0)
  header.writeUInt32BE(height, 4)
  header.set([8, 2, 0, 0, 0], 8)
  const rows = Buffer.alloc((width * 3 + 1) * height)
  for (let y = 0; y < height; y++) {
    const shade = y > height * 0.6 ? 0.6 : 1
    for (let x = 0; x < width; x++)
      rows.set([r * shade, g * shade, b * shade], y * (width * 3 + 1) + 1 + x * 3)
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", header),
    chunk("IDAT", deflateSync(rows)),
    chunk("IEND", Buffer.alloc(0)),
  ])
}

async function signIn(email) {
  const client = createClient(status.API_URL, status.PUBLISHABLE_KEY, {
    auth: { persistSession: false },
  })
  const { data, error } = await client.auth.signInWithPassword({ email, password: PASSWORD })
  if (error) throw new Error(`Couldn't sign in as ${email}: ${error.message}`)
  return { client, userId: data.user.id }
}

const { client: admin } = await signIn("admin@ras.test")
const { data: sites, error: sitesError } = await admin
  .from("job_sites")
  .select("id")
  .is("archived_at", null)
if (sitesError) throw sitesError

let created = 0
for (const framer of FRAMERS) {
  const { client, userId } = await signIn(framer.email)
  for (let offset = DAYS - 1; offset >= 0; offset--) {
    const date = addDays(today, -offset)
    if (offset === 0 ? !framer.today : random() < 0.2) continue

    const photoPaths = []
    for (let i = 0; i < 1 + Math.floor(random() * 3); i++) {
      const path = `${userId}/${crypto.randomUUID()}.png`
      const image = png(40 + random() * 60, 90 + random() * 80, 60 + random() * 50)
      const { error } = await client.storage
        .from("safety-photos")
        .upload(path, image, { contentType: "image/png" })
      if (error) throw error
      photoPaths.push(path)
    }

    const answers = Object.fromEntries(CHECKLIST.map((item) => [`p_${item}`, random() > 0.03]))
    const { error } = await client.rpc("submit_safety_form", {
      p_job_site_id: pick(sites).id,
      p_date: date,
      ...answers,
      p_notes: pick(NOTES),
      p_photo_paths: photoPaths,
    })
    if (error) throw error
    created++
  }
}

// Admins have caught up on everything older than two days.
const { error: reviewError } = await admin
  .from("safety_forms")
  .update({ status: "reviewed" })
  .lt("date", addDays(today, -2))
  .eq("status", "submitted")
if (reviewError) throw reviewError

console.log(`Added ${created} safety forms from ${addDays(today, -(DAYS - 1))} to ${today}.`)
