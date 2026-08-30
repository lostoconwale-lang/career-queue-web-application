import { STATUS_BADGE_CLASS, STATUS_LABEL } from "@/app/admin/applications/status-styles";
import type { JobApplicationStatus } from "@/types/job-application";

export function StatusBadge({ status }: { status: JobApplicationStatus }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_BADGE_CLASS[status]}`}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}
