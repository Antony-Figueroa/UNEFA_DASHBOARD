import ConfigLayout from "@/pages/Config/ConfigLayout";
import OldDashboardConfigurator from "@/pages/Dashboard/Configurator";

// TODO: refactor OldDashboardConfigurator to follow config page patterns
export default function DashboardPage() {
  return <ConfigLayout><OldDashboardConfigurator /></ConfigLayout>;
}
