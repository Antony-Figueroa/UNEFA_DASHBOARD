import { lazy } from "react";

// ─── Helper: create lazy component + store import thunk ───────────────────

type ImportThunk = () => Promise<{ default: React.ComponentType<any> }>;

const ALL_IMPORTS: ImportThunk[] = [];

function lazyPreload(imp: ImportThunk): React.LazyExoticComponent<React.ComponentType<any>> {
  ALL_IMPORTS.push(imp);
  return lazy(imp);
}

// ─── Static route map ────────────────────────────────────────────────────

export const routeComponents: Record<
  string,
  React.LazyExoticComponent<React.ComponentType<any>>
> = {
  "/dashboard": lazyPreload(() => import("../pages/Dashboard/Home")),
  "/students": lazyPreload(() => import("../pages/Students/students")),
  "/tutors": lazyPreload(() => import("../pages/Tutors/tutors")),
  "/institutions": lazyPreload(() => import("../pages/Institutions/institutions")),
  "/period": lazyPreload(() => import("../pages/Period/period")),
  "/careers": lazyPreload(() => import("../pages/Careers/careers")),
  "/pre-enrollment": lazyPreload(() => import("../pages/PreEnrollment/PreEnrollment")),
  "/enrollment": lazyPreload(() => import("../pages/Enrollment/Enrollment")),
  "/tracking": lazyPreload(() => import("../pages/Tracking/Tracking")),
  "/evaluations": lazyPreload(() => import("../pages/EvaluationsAndCulmination/EvaluationsAndCulmination")),
  "/reports": lazyPreload(() => import("../pages/Reports/Reports")),
  "/reports/culminated-students": lazyPreload(() => import("../pages/Reports/CulminatedStudentsReport")),
  "/manuals": lazyPreload(() => import("../pages/Manuals/Manuals")),
  "/profile": lazyPreload(() => import("../pages/UserProfiles")),
  "/calendar": lazyPreload(() => import("../pages/Calendar")),
  "/ai-assistant": lazyPreload(() => import("../pages/AIAssistant/AIAssistant")),
  "/admin/requests": lazyPreload(() => import("../pages/Admin/AdminRequests")),
  "/notifications": lazyPreload(() => import("../pages/Notifications/NotificationsPage")),
  "/configure/users": lazyPreload(() => import("../pages/Config/sections/admin/UsersPage")),
  "/configure/lists": lazyPreload(() => import("../pages/Config/sections/system/ListsPage")),
  "/configure/auditoria": lazyPreload(() => import("../pages/Config/sections/admin/AuditPage")),
  "/configure/roles": lazyPreload(() => import("../pages/Config/sections/admin/RolesPage")),
  "/configure/settings": lazyPreload(() => import("../pages/Config/sections/system/ParametersPage")),
  "/configure/maintenance": lazyPreload(() => import("../pages/Config/sections/system/MaintenancePage")),
  "/configure/backups": lazyPreload(() => import("../pages/Config/sections/system/BackupsPage")),
  "/configure/landing": lazyPreload(() => import("../pages/Config/sections/customize/LandingPage")),
  "/configure/organizacion": lazyPreload(() => import("../pages/Config/sections/system/OrganizationPage")),
  "/configure/academic": lazyPreload(() => import("../pages/Config/sections/system/AcademicPage")),
  "/configure/reminders": lazyPreload(() => import("../pages/Config/sections/customize/RemindersPage")),
  "/dashboard/configure": lazyPreload(() => import("../pages/Config/sections/customize/DashboardPage")),
  "/tutor": lazyPreload(() => import("../pages/Tutor/TutorDashboard")),
  "/tutor/students": lazyPreload(() => import("../pages/Tutor/TutorStudents")),
  "/tutor/tracking": lazyPreload(() => import("../pages/Tutor/TutorTracking")),
  "/tutor/grades": lazyPreload(() => import("../pages/Tutor/TutorGrades")),
  "/tutor/reports": lazyPreload(() => import("../pages/Tutor/TutorReports")),
  "/tutor/profile": lazyPreload(() => import("../pages/Tutor/TutorProfile")),
  "/student": lazyPreload(() => import("../pages/Student/StudentDashboard")),
  "/student/requests": lazyPreload(() => import("../pages/Student/StudentRequests")),
  "/student/profile": lazyPreload(() => import("../pages/Student/StudentProfile")),
  "/student/documents": lazyPreload(() => import("../pages/Student/StudentDocuments")),
  "/student/evaluations": lazyPreload(() => import("../pages/Student/StudentEvaluations")),
  "/form-elements": lazyPreload(() => import("../pages/Forms/FormElements")),
  "/basic-tables": lazyPreload(() => import("../pages/Tables/BasicTables")),
  "/alerts": lazyPreload(() => import("../pages/UiElements/Alerts")),
  "/avatars": lazyPreload(() => import("../pages/UiElements/Avatars")),
  "/badge": lazyPreload(() => import("../pages/UiElements/Badges")),
  "/buttons": lazyPreload(() => import("../pages/UiElements/Buttons")),
  "/images": lazyPreload(() => import("../pages/UiElements/Images")),
  "/videos": lazyPreload(() => import("../pages/UiElements/Videos")),
  "/line-chart": lazyPreload(() => import("../pages/Charts/LineChart")),
  "/bar-chart": lazyPreload(() => import("../pages/Charts/BarChart")),
  "/blank": lazyPreload(() => import("../pages/Blank")),
  "/crud-example": lazyPreload(() => import("../pages/Management/CrudExample")),
};

// ─── Dynamic route patterns ──────────────────────────────────────────────

export interface DynamicRoutePattern {
  pattern: RegExp;
  key: string;
  component: React.LazyExoticComponent<React.ComponentType<any>>;
}

export const dynamicRoutePatterns: DynamicRoutePattern[] = [
  {
    pattern: /^\/visit-registration\/(\d+)$/,
    key: "/visit-registration/:id",
    component: lazyPreload(() => import("../pages/Tracking/VisitRegistration")),
  },
  {
    pattern: /^\/activity-logs\/(\d+)$/,
    key: "/activity-logs/:practiceId",
    component: lazyPreload(() => import("../pages/ActivityLogs/ActivityLogPage")),
  },
  {
    pattern: /^\/tutor\/evaluations\/(\d+)$/,
    key: "/tutor/evaluations/:enrollmentId",
    component: lazyPreload(() => import("../pages/Tutor/Evaluations/TutorEvaluation")),
  },
  {
    pattern: /^\/student\/activity-logs\/(\d+)$/,
    key: "/student/activity-logs/:practiceId",
    component: lazyPreload(() => import("../pages/Student/StudentActivityLogs")),
  },
];

/**
 * Trigger the dynamic import for every registered route so that
 * React.lazy() finds them cached on first use.
 *
 * Call this once after the user is authenticated and the app has
 * painted. Uses requestIdleCallback (or setTimeout) to avoid
 * competing with the critical initial render.
 *
 * React.lazy() deduplicates import() promises — calling import()
 * here BEFORE the lazy component renders means the lazy() wrapper
 * reuses the same cached module.
 */
export function preloadRoutes(): void {
  const doPreload = () => {
    for (const imp of ALL_IMPORTS) {
      imp().catch(() => {
        /* preload failures are non-critical */
      });
    }
  };

  if (typeof window !== "undefined" && "requestIdleCallback" in window) {
    requestIdleCallback(doPreload, { timeout: 3000 });
  } else {
    setTimeout(doPreload, 2000);
  }
}

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
