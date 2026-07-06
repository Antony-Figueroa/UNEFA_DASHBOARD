import ConfigLayout from "@/pages/Config/ConfigLayout";
import OldReminderConfigPage from "@/pages/Admin/Reminders/ReminderConfigPage";

// TODO: refactor OldReminderConfigPage to follow config page patterns
export default function RemindersPage() {
  return <ConfigLayout><OldReminderConfigPage /></ConfigLayout>;
}
