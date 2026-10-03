import { CheckCircle2Icon, ClockIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import type { Enums } from "@/lib/supabase/database.types"

export function StatusBadge({ status }: { status: Enums<"form_status"> }) {
  return status === "reviewed" ? (
    <Badge className="bg-success/15 text-brand-green-800">
      <CheckCircle2Icon data-icon="inline-start" />
      Reviewed
    </Badge>
  ) : (
    <Badge className="bg-warning/25 text-warning-foreground">
      <ClockIcon data-icon="inline-start" />
      Submitted
    </Badge>
  )
}
