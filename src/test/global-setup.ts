import type { TestProject } from "vitest/node"

import { readLocalSupabase } from "./local-supabase"

declare module "vitest" {
  export interface ProvidedContext {
    supabase: { url: string; publishableKey: string; secretKey: string }
  }
}

export default function setup(project: TestProject) {
  project.provide("supabase", readLocalSupabase())
}
