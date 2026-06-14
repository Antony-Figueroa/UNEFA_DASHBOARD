import { lazy } from "react";

/**
 * Static route-to-component map.
 *
 * Every protected route path inside AppLayout is mapped to its lazy-loaded
 * page component. This map is used by {@link resolveComponent} to render the
 * correct component for each tab.
 */
export const routeComponents: Record<
  string,
  React.LazyExoticComponent<React.ComponentType<any>>
> = {
  "/dashboard": lazy(() => import("../pages/Dashboard/Home")),
  "/students": lazy(() => import("../pages/Students/students")),
  "/tutors": lazy(() => import("../pages/Tutors/tutors")),
  "/institutions": lazy(() => import("../pages/Institutions/institutions")),
  "/period": lazy(() => import("../pages/Period/period")),
  "/careers": lazy(() => import("../pages/Careers/careers")),
  "/pre-enrollment": lazy(() => import("../pages/PreEnrollment/PreEnrollment")),
  "/enrollment": lazy(() => import("../pages/Enrollment/Enrollment")),
  "/tracking": lazy(() => import("../pages/Tracking/Tracking")),
  "/evaluations": lazy(() => import("../pages/EvaluationsAndCulmination/EvaluationsAndCulmination")),
  "/reports": lazy(() => import("../pages/Reports/Reports")),
  "/reports/culminated-students": lazy(() => import("../pages/Reports/CulminatedStudentsReport")),
  "/manuals": lazy(() => import("../pages/Manuals/Manuals")),
  "/profile": lazy(() => import("../pages/UserProfiles")),
  "/calendar": lazy(() => import("../pages/Calendar")),
  "/ai-assistant": lazy(() => import("../pages/AIAssistant/AIAssistant")),
  "/admin/requests": lazy(() => import("../pages/Admin/AdminRequests")),
  "/notifications": lazy(() => import("../pages/Notifications/NotificationsPage")),
  "/configure/users": lazy(() => import("../pages/Config/UserManagementPage")),
  "/configure/lists": lazy(() => import("../pages/Config/ListsConfiguration")),
  "/configure/auditoria": lazy(() => import("../features/activity-logs/pages/AuditoriaPage")),
  "/configure/roles": lazy(() => import("../pages/Config/RolesPermissions")),
  "/configure/settings": lazy(() => import("../pages/Config/SystemSettings")),
  "/configure/maintenance": lazy(() => import("../pages/Config/Maintenance")),
  "/configure/backups": lazy(() => import("../pages/Config/Backups")),
  "/configure/landing": lazy(() => import("../pages/Config/LandingConfigPage")),
  "/configure/reminders": lazy(() => import("../pages/Admin/Reminders/ReminderConfigPage")),
  "/dashboard/configure": lazy(() => import("../pages/Dashboard/Configurator")),
  "/tutor": lazy(() => import("../pages/Tutor/TutorDashboard")),
  "/tutor/students": lazy(() => import("../pages/Tutor/TutorStudents")),
  "/tutor/tracking": lazy(() => import("../pages/Tutor/TutorTracking")),
  "/tutor/grades": lazy(() => import("../pages/Tutor/TutorGrades")),
  "/tutor/reports": lazy(() => import("../pages/Tutor/TutorReports")),
  "/tutor/profile": lazy(() => import("../pages/Tutor/TutorProfile")),
  "/student": lazy(() => import("../pages/Student/StudentDashboard")),
  "/student/requests": lazy(() => import("../pages/Student/StudentRequests")),
  "/student/profile": lazy(() => import("../pages/Student/StudentProfile")),
  "/student/documents": lazy(() => import("../pages/Student/StudentDocuments")),
  "/student/evaluations": lazy(() => import("../pages/Student/StudentEvaluations")),
  "/form-elements": lazy(() => import("../pages/Forms/FormElements")),
  "/basic-tables": lazy(() => import("../pages/Tables/BasicTables")),
  "/alerts": lazy(() => import("../pages/UiElements/Alerts")),
  "/avatars": lazy(() => import("../pages/UiElements/Avatars")),
  "/badge": lazy(() => import("../pages/UiElements/Badges")),
  "/buttons": lazy(() => import("../pages/UiElements/Buttons")),
  "/images": lazy(() => import("../pages/UiElements/Images")),
  "/videos": lazy(() => import("../pages/UiElements/Videos")),
  "/line-chart": lazy(() => import("../pages/Charts/LineChart")),
  "/bar-chart": lazy(() => import("../pages/Charts/BarChart")),
  "/blank": lazy(() => import("../pages/Blank")),
  "/crud-example": lazy(() => import("../pages/Management/CrudExample")),
};

/**
 * Dynamic route patterns — routes with URL parameters (e.g. /visit-registration/:id).
 *
 * Each entry has a regex `pattern` that matches the actual URL, a `key` that
 * describes the parameter names, and the lazy `component` to render.
 */
export const dynamicRoutePatterns: Array<{
  pattern: RegExp;
  key: string;
  component: React.LazyExoticComponent<React.ComponentType<any>>;
}> = [
  {
    pattern: /^\/visit-registration\/(\d+)$/,
    key: "/visit-registration/:id",
    component: lazy(() => import("../pages/Tracking/VisitRegistration")),
  },
  {
    pattern: /^\/activity-logs\/(\d+)$/,
    key: "/activity-logs/:practiceId",
    component: lazy(() => import("../pages/ActivityLogs/ActivityLogPage")),
  },
  {
    pattern: /^\/tutor\/evaluations\/(\d+)$/,
    key: "/tutor/evaluations/:enrollmentId",
    component: lazy(() => import("../pages/Tutor/Evaluations/TutorEvaluation")),
  },
  {
    pattern: /^\/student\/activity-logs\/(\d+)$/,
    key: "/student/activity-logs/:practiceId",
    component: lazy(() => import("../pages/Student/StudentActivityLogs")),
  },
];

/**
 * Resolve a route path to its lazy component and any extracted URL parameters.
 *
 * 1. Tries an exact match in `routeComponents` (static routes).
 * 2. Falls back to `dynamicRoutePatterns` for parameterised routes.
 *
 * @returns `{ component, params }` or `null` if no match is found.
 */
export function resolveComponent(
  path: string,
): {
  component: React.LazyExoticComponent<React.ComponentType<any>>;
  params?: Record<string, string>;
} | null {
  // 1. Exact match in static route map
  if (routeComponents[path]) {
    return { component: routeComponents[path] };
  }

  // 2. Dynamic route patterns — extract params from the URL
  for (const dp of dynamicRoutePatterns) {
    const match = path.match(dp.pattern);
    if (match) {
      const params: Record<string, string> = {};
      const paramNames = (dp.key.match(/:(\w+)/g) || []).map((p) => p.slice(1));
      paramNames.forEach((name, i) => {
        params[name] = match[i + 1] ?? "";
      });
      return { component: dp.component, params };
    }
  }

  return null;
}
