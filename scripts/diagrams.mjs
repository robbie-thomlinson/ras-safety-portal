// Renders every docs/**/*.mmd file to a PNG alongside it.
// Uses docs/puppeteer-config.json if present (needed on Ubuntu, where Chromium's sandbox is blocked).
import { execSync } from "node:child_process"
import { existsSync, readdirSync } from "node:fs"
import path from "node:path"

const docs = path.join(import.meta.dirname, "..", "docs")
const puppeteerConfig = path.join(docs, "puppeteer-config.json")
const configArg = existsSync(puppeteerConfig) ? `-p "${puppeteerConfig}"` : ""

const diagrams = readdirSync(docs, { recursive: true }).filter((f) => f.endsWith(".mmd"))

for (const file of diagrams) {
  const input = path.join(docs, file)
  const output = input.replace(/\.mmd$/, ".png")
  console.log(`Rendering ${path.relative(process.cwd(), output)}`)
  execSync(`npx -y @mermaid-js/mermaid-cli -i "${input}" -o "${output}" ${configArg}`, {
    stdio: "inherit",
  })
}
