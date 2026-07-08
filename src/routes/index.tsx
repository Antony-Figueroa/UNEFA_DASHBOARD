import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router";
import { Analytics } from "@vercel/analytics/react";
import AppLayout from "../layout/AppLayout";
import ScrollToTop from "../components/common/ScrollToTop";
import PageLoader from "../components/ui/loader";
import ProtectedRoute from "../components/auth/ProtectedRoute";
import PublicRoute from "../components/auth/PublicRoute";

// Lazy loading components
const Home = lazy(() => import("../pages/Dashboard/Home"));
const SignIn = lazy(() => import("../pages/AuthPages/SignIn"));
const SignUp = lazy(() => import("../pages/AuthPages/SignUp"));
const FirstLogin = lazy(() => import("../pages/AuthPages/FirstLogin"));
const PasswordRecovery = lazy(() => import("../pages/AuthPages/PasswordRecovery"));
const UserProfiles = lazy(() => import("../pages/UserProfiles"));
const UserManagementPage = lazy(() => import("../pages/Config/sections/admin/UsersPage"));
const ListsPage = lazy(() => import("../pages/Config/sections/system/ListsPage"));
const AuditPage = lazy(() => import("../pages/Config/sections/admin/AuditPage"));
const RolesPermissionsPage = lazy(() => import("../pages/Config/sections/admin/RolesPage"));
const ParametersPage = lazy(() => import("../pages/Config/sections/system/ParametersPage"));
const MaintenancePage = lazy(() => import("../pages/Config/sections/system/MaintenancePage"));
const BackupsPage = lazy(() => import("../pages/Config/sections/system/BackupsPage"));
const LandingConfigPage = lazy(() => import("../pages/Config/sections/customize/LandingConfigPage"));
const RemindersPage = lazy(() => import("../pages/Config/sections/customize/RemindersPage"));
const OrganizationPage = lazy(() => import("../pages/Config/sections/system/OrganizationPage"));
const EvaluationConfigPage = lazy(() => import("../pages/Config/sections/system/EvaluationConfigPage"));

const DashboardConfigurator = lazy(() => import("../pages/Config/sections/customize/DashboardPage"));
const NotificationsPage = lazy(() => import("../pages/Notifications/NotificationsPage"));
const Reports = lazy(() => import("../pages/Reports/Reports"));
const TestEvaluacionFinal = lazy(() => import("../pages/TestEvaluacionFinal"));
const CulminatedStudentsReport = lazy(() => import("../pages/Reports/CulminatedStudentsReport"));
const Manuals = lazy(() => import("../pages/Manuals/Manuals"));

const TutorDashboard = lazy(() => import("../pages/Tutor/TutorDashboard"));
const TutorStudents = lazy(() => import("../pages/Tutor/TutorStudents"));
const TutorTracking = lazy(() => import("../pages/Tutor/TutorTracking"));
const TutorGrades = lazy(() => import("../pages/Tutor/TutorGrades"));
const TutorReports = lazy(() => import("../pages/Tutor/TutorReports"));
const TutorEvaluation = lazy(() => import("../pages/Tutor/Evaluations/TutorEvaluation"));
const TutorProfile = lazy(() => import("../pages/Tutor/TutorProfile"));
const TutorActivityLogs = lazy(() => import("../pages/Tutor/TutorActivityLogs"));

import StudentLayout from "../layout/StudentLayout";
const StudentRequests = lazy(() => import("../pages/Student/StudentRequests"));
const StudentProfile = lazy(() => import("../pages/Student/StudentProfile"));
const StudentActivityLogs = lazy(() => import("../pages/Student/StudentActivityLogs"));
const StudentDocuments = lazy(() => import("../pages/Student/StudentDocuments"));
const StudentEvaluations = lazy(() => import("../pages/Student/StudentEvaluations"));
const StudentTracking = lazy(() => import("../pages/Student/StudentTracking"));

const AdminRequests = lazy(() => import("../pages/Admin/AdminRequests"));

const EvaluationsAndCulmination = lazy(() => import("../pages/EvaluationsAndCulmination/EvaluationsAndCulmination"));

const Calendar = lazy(() => import("../pages/Calendar"));
const Blank = lazy(() => import("../pages/Blank"));
const Students = lazy(() => import("../pages/Students/students"));
const Tutors = lazy(() => import("../pages/Tutors/tutors"));
const InstitutionsPage = lazy(() => import("../pages/Institutions/institutions"));
const PreEnrollmentPage = lazy(() => import("../pages/PreEnrollment/PreEnrollment"));
const EnrollmentPage = lazy(() => import("../pages/Enrollment/Enrollment"));
const TrackingPage = lazy(() => import("../pages/Tracking/Tracking"));
const VisitRegistration = lazy(() => import("../pages/Tracking/VisitRegistration"));
const ActivityLogPage = lazy(() => import("../pages/ActivityLogs/ActivityLogPage"));
const FormElements = lazy(() => import("../pages/Forms/FormElements"));
const BasicTables = lazy(() => import("../pages/Tables/BasicTables"));
const Period = lazy(() => import("../pages/Period/period"));
const CareersPage = lazy(() => import("../pages/Careers/careers"));
const InternshipHome = lazy(() => import("../pages/InternshipHome/InternshipHome"));
const CrudExample = lazy(() => import("../pages/Management/CrudExample"));
const Alerts = lazy(() => import("../pages/UiElements/Alerts"));
const Avatars = lazy(() => import("../pages/UiElements/Avatars"));
const Badges = lazy(() => import("../pages/UiElements/Badges"));
const Buttons = lazy(() => import("../pages/UiElements/Buttons"));
const Images = lazy(() => import("../pages/UiElements/Images"));
const Videos = lazy(() => import("../pages/UiElements/Videos"));
const LineChart = lazy(() => import("../pages/Charts/LineChart"));
const BarChart = lazy(() => import("../pages/Charts/BarChart"));
const AIAssistant = lazy(() => import("../pages/AIAssistant/AIAssistant"));
const NotFound = lazy(() => import("../pages/OtherPage/NotFound"));

// Public Pages
const NosotrosPage = lazy(() => import("../pages/Public/NosotrosPage"));
const CarrerasPage = lazy(() => import("../pages/Public/CarrerasPage"));
const PasantiasPage = lazy(() => import("../pages/Public/PasantiasPage"));

export const AppRoutes = () => {
  const isRender = typeof window !== 'undefined' && window.location.hostname.includes('onrender.com');

  return (
    <>
      {!isRender && <Analytics />}
      <ScrollToTop />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public Landing Page */}
          <Route path="/" element={<InternshipHome />} />
          
          {/* Public Info Pages */}
          <Route path="/nosotros" element={<NosotrosPage />} />
          <Route path="/carreras" element={<CarrerasPage />} />
          <Route path="/pasantias" element={<PasantiasPage />} />

          {/* Auth Routes (Public but restricted for logged-in users) */}
          <Route
            path="/signin"
            element={
              <PublicRoute>
                <SignIn />
              </PublicRoute>
            }
          />
          <Route
            path="/signup"
            element={
              <PublicRoute>
                <SignUp />
              </PublicRoute>
            }
          />
          <Route
            path="/first-login"
            element={
              <PublicRoute>
                <FirstLogin />
              </PublicRoute>
            }
          />
          <Route
            path="/password-recovery"
            element={
              <PublicRoute>
                <PasswordRecovery />
              </PublicRoute>
            }
          />
          <Route
            path="/reset-password"
            element={
              <PublicRoute>
                <PasswordRecovery />
              </PublicRoute>
            }
          />

          {/* Protected Dashboard Routes */}
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<Home />} />
            <Route
              path="/dashboard/configure"
              element={
                <ProtectedRoute requiredPermissions={['config:view']}>
                  <DashboardConfigurator />
                </ProtectedRoute>
              }
            />

            {/* Core Features */}
            <Route path="/profile" element={<UserProfiles />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/blank" element={<Blank />} />
            <Route path="/students" element={<ProtectedRoute requiredPermissions={['students:view']}><Students /></ProtectedRoute>} />
            <Route path="/tutors" element={<ProtectedRoute requiredPermissions={['tutors:view']}><Tutors /></ProtectedRoute>} />
            <Route path="/institutions" element={<ProtectedRoute requiredPermissions={['institutions:view']}><InstitutionsPage /></ProtectedRoute>} />

            {/* AI Assistant */}
            <Route path="/ai-assistant" element={<AIAssistant />} />

            {/* Management */}
            <Route path="/period" element={<ProtectedRoute requiredPermissions={['periods:view']}><Period /></ProtectedRoute>} />
            <Route path="/careers" element={<ProtectedRoute requiredPermissions={['careers:view']}><CareersPage /></ProtectedRoute>} />
            <Route path="/crud-example" element={<CrudExample />} />

            {/* Process */}
            <Route path="/pre-enrollment" element={<ProtectedRoute requiredPermissions={['enrollments:view']}><PreEnrollmentPage /></ProtectedRoute>} />
            <Route path="/enrollment" element={<ProtectedRoute requiredPermissions={['enrollments:view']}><EnrollmentPage /></ProtectedRoute>} />
            <Route path="/tracking" element={<ProtectedRoute requiredPermissions={['tracking:view']}><TrackingPage /></ProtectedRoute>} />
            <Route path="/visit-registration/:id" element={<ProtectedRoute requiredPermissions={['tracking:view']}><VisitRegistration /></ProtectedRoute>} />
            <Route path="/activity-logs/:practiceId" element={<ProtectedRoute requiredPermissions={['activity-logs:view']}><ActivityLogPage /></ProtectedRoute>} />
            <Route path="/evaluations" element={<ProtectedRoute requiredPermissions={['evaluations:view']}><EvaluationsAndCulmination /></ProtectedRoute>} />

            {/* Reports */}
            <Route path="/reports" element={<ProtectedRoute requiredPermissions={['reports:view']}><Reports /></ProtectedRoute>} />
            <Route path="/reports/culminated-students" element={<ProtectedRoute requiredPermissions={['reports:view']}><CulminatedStudentsReport /></ProtectedRoute>} />

            {/* Test route — remove after testing */}
            <Route path="/test-evaluacion-final" element={<TestEvaluacionFinal />} />

{/* Manuals */}
            <Route path="/manuals" element={<Manuals />} />

            {/* Tutor Dashboard - Only for Tutor role (3) */}
            <Route
              path="/tutor"
              element={
                <ProtectedRoute allowedRoles={[3]}>
                  <TutorDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tutor/students"
              element={
                <ProtectedRoute allowedRoles={[3]}>
                  <TutorStudents />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tutor/tracking"
              element={
                <ProtectedRoute allowedRoles={[3]}>
                  <TutorTracking />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tutor/grades"
              element={
                <ProtectedRoute allowedRoles={[3]}>
                  <TutorGrades />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tutor/reports"
              element={
                <ProtectedRoute allowedRoles={[3]}>
                  <TutorReports />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tutor/evaluations/:enrollmentId"
              element={
                <ProtectedRoute allowedRoles={[3]}>
                  <TutorEvaluation />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tutor/profile"
              element={
                <ProtectedRoute allowedRoles={[3]}>
                  <TutorProfile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tutor/activity-logs"
              element={
                <ProtectedRoute allowedRoles={[3]}>
                  <TutorActivityLogs />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tutor/visits/:id"
              element={
                <ProtectedRoute allowedRoles={[3]}>
                  <VisitRegistration />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tutor/activity-logs/:id"
              element={
                <ProtectedRoute allowedRoles={[3]}>
                  <ActivityLogPage />
                </ProtectedRoute>
              }
            />
  
            {/* Student routes - wrapped in StudentLayout */}
            <Route element={<ProtectedRoute allowedRoles={[4]}><StudentLayout /></ProtectedRoute>}>
              <Route index path="/student" element={<Navigate to="/student/requests" replace />} />
              <Route path="/student/requests" element={<StudentRequests />} />
              <Route path="/student/profile" element={<StudentProfile />} />
              <Route path="/student/activity-logs/:practiceId" element={<StudentActivityLogs />} />
              <Route path="/student/documents" element={<StudentDocuments />} />
              <Route path="/student/evaluations" element={<StudentEvaluations />} />
              <Route path="/student/tracking" element={<StudentTracking />} />
            </Route>

            {/* Admin Requests */}
            <Route
              path="/admin/requests"
              element={
                <ProtectedRoute requiredPermissions={['requests:view']}>
                  <AdminRequests />
                </ProtectedRoute>
              }
            />

            {/* Configuration — based on permissions */}
            <Route
              path="/configure/users"
              element={
                <ProtectedRoute requiredPermissions={['users:view']}>
                  <UserManagementPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/configure/lists"
              element={
                <ProtectedRoute requiredPermissions={['lists:view']}>
                  <ListsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/configure/auditoria"
              element={
                <ProtectedRoute requiredPermissions={['activity-logs:view']}>
                  <AuditPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/configure/roles"
              element={
                <ProtectedRoute requiredPermissions={['roles:manage']}>
                  <RolesPermissionsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/configure/settings"
              element={
                <ProtectedRoute requiredPermissions={['config:view']}>
                  <ParametersPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/configure/maintenance"
              element={
                <ProtectedRoute requiredPermissions={['config:view']}>
                  <MaintenancePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/configure/backups"
              element={
                <ProtectedRoute requiredPermissions={['backups:view']}>
                  <BackupsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/configure/landing"
              element={
                <ProtectedRoute requiredPermissions={['config:view']}>
                  <LandingConfigPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/configure/organizacion"
              element={
                <ProtectedRoute requiredPermissions={['config:view']}>
                  <OrganizationPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/configure/evaluacion"
              element={
                <ProtectedRoute requiredPermissions={['evaluations:view']}>
                  <EvaluationConfigPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/configure/reminders"
              element={
                <ProtectedRoute requiredPermissions={['config:view']}>
                  <RemindersPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/notifications"
              element={<NotificationsPage />}
            />

            {/* Forms & Tables */}
            <Route path="/form-elements" element={<FormElements />} />
            <Route path="/basic-tables" element={<BasicTables />} />

            {/* UI Elements */}
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/avatars" element={<Avatars />} />
            <Route path="/badge" element={<Badges />} />
            <Route path="/buttons" element={<Buttons />} />
            <Route path="/images" element={<Images />} />
            <Route path="/videos" element={<Videos />} />

            {/* Charts */}
            <Route path="/line-chart" element={<LineChart />} />
            <Route path="/bar-chart" element={<BarChart />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </>
  );
};
