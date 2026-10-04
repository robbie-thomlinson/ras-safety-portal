import { deleteSites } from "./supabase"

// Sweeps test data before and after the run. Each test cleans up after itself, but a crashed or
// interrupted run can leave some behind, and `npm run test:db` expects no forms in the database.
export default async function globalSetup() {
  await deleteSites()
  return () => deleteSites()
}
