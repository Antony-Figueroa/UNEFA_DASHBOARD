import ConfigLayout from "@/pages/Config/ConfigLayout";
import OldAuditoriaPage from "@/features/activity-logs/pages/AuditoriaPage";

// TODO: refactor OldAuditoriaPage to follow config page patterns (skeleton, headings, confirm dialog)
export default function AuditPage() {
  return <ConfigLayout><OldAuditoriaPage /></ConfigLayout>;
}
