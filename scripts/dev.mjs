// Starts the app locally. Installs dependencies first if they're missing,
// then starts local Supabase (needs Docker; no-op if it's already running).
import { execSync } from "node:child_process"
import { existsSync } from "node:fs"
import path from "node:path"

const root = path.join(import.meta.dirname, "..")
const run = (cmd) => execSync(cmd, { cwd: root, stdio: "inherit" })

if (!existsSync(path.join(root, "node_modules"))) run("npm install")
run("npm run db:start")
run("npm run dev")
