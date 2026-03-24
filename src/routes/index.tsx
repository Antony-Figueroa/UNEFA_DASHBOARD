import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router";
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
const UserManagementPage = lazy(() => import("../pages/Config/UserManagementPage"));
const ListsConfiguration = lazy(() => import("../pages/Config/ListsConfiguration"));
const AuthLogs = lazy(() => import("../pages/Config/AuthLogs"));
const AuditLogsPage = lazy(() => import("../pages/AuditLogs/AuditLogsPage"));
const RolesPermissions = lazy(() => import("../pages/Config/RolesPermissions"));
const Maintenance = lazy(() => import("../pages/Config/Maintenance"));
const Backups = lazy(() => import("../pages/Config/Backups"));
const LandingConfigPage = lazy(() => import("../pages/Config/LandingConfigPage"));
const Culmination = lazy(() => import("../pages/Culmination/Culmination"));
const Reports = lazy(() => import("../pages/Reports/Reports"));
const CulminatedStudentsReport = lazy(() => import("../pages/Reports/CulminatedStudentsReport"));
const Manuals = lazy(() => import("../pages/Manuals/Manuals"));

const TutorDashboard = lazy(() => import("../pages/Tutor/TutorDashboard"));
const TutorStudents = lazy(() => import("../pages/Tutor/TutorStudents"));
const TutorTracking = lazy(() => import("../pages/Tutor/TutorTracking"));
const TutorGrades = lazy(() => import("../pages/Tutor/TutorGrades"));
const TutorReports = lazy(() => import("../pages/Tutor/TutorReports"));
const TutorEvaluation = lazy(() => import("../pages/Tutor/Evaluations/TutorEvaluation"));
const TutorProfile = lazy(() => import("../pages/Tutor/TutorProfile"));

const StudentDashboard = lazy(() => import("../pages/Student/StudentDashboard"));
const StudentRequests = lazy(() => import("../pages/Student/StudentRequests"));
const StudentProfile = lazy(() => import("../pages/Student/StudentProfile"));
const StudentActivityLogs = lazy(() => import("../pages/Student/StudentActivityLogs"));
const StudentDocuments = lazy(() => import("../pages/Student/StudentDocuments"));
const StudentEvaluations = lazy(() => import("../pages/Student/StudentEvaluations"));

const AdminRequests = lazy(() => import("../pages/Admin/AdminRequests"));

const EvaluationsList = lazy(() => import("../pages/Evaluations/EvaluationsList"));

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

            {/* Core Features */}
            <Route path="/profile" element={<UserProfiles />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/blank" element={<Blank />} />
            <Route path="/students" element={<Students />} />
            <Route path="/tutors" element={<Tutors />} />
            <Route path="/institutions" element={<InstitutionsPage />} />

            {/* AI Assistant */}
            <Route path="/ai-assistant" element={<AIAssistant />} />

            {/* Management */}
            <Route path="/period" element={<Period />} />
            <Route path="/careers" element={<CareersPage />} />
            <Route path="/crud-example" element={<CrudExample />} />

            {/* Process */}
            <Route path="/pre-enrollment" element={<PreEnrollmentPage />} />
            <Route path="/enrollment" element={<EnrollmentPage />} />
            <Route path="/tracking" element={<TrackingPage />} />
            <Route path="/visit-registration/:id" element={<VisitRegistration />} />
            <Route path="/activity-logs/:practiceId" element={<ActivityLogPage />} />
            <Route path="/culmination" element={<Culmination />} />
            <Route path="/evaluations" element={<EvaluationsList />} />

            {/* Reports */}
            <Route path="/reports" element={<Reports />} />
            <Route path="/reports/culminated-students" element={<CulminatedStudentsReport />} />

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

            {/* Student Dashboard - Only for Student role (4) */}
            <Route
              path="/student"
              element={
                <ProtectedRoute allowedRoles={[4]}>
                  <StudentDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/requests"
              element={
                <ProtectedRoute allowedRoles={[4]}>
                  <StudentRequests />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/profile"
              element={
                <ProtectedRoute allowedRoles={[4]}>
                  <StudentProfile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/activity-logs/:practiceId"
              element={
                <ProtectedRoute allowedRoles={[4]}>
                  <StudentActivityLogs />
                </ProtectedRoute>
              }
            />
<Route
              path="/student/documents"
              element={
                <ProtectedRoute allowedRoles={[4]}>
                  <StudentDocuments />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/evaluations"
              element={
                <ProtectedRoute allowedRoles={[4]}>
                  <StudentEvaluations />
                </ProtectedRoute>
              }
            />

            {/* Admin Requests - For Admin (1) and Asistente (2) */}
            <Route
              path="/admin/requests"
              element={
                <ProtectedRoute allowedRoles={[0, 1, 2]}>
                  <AdminRequests />
                </ProtectedRoute>
              }
            />

            {/* Configuration - Only for Admin (Role 1) and Master (Role 0) */}
            <Route
              path="/configure/users"
              element={
                <ProtectedRoute allowedRoles={[0, 1]}>
                  <UserManagementPage />
                </ProtectedRoute>
              }
            />
<Route
              path="/configure/lists"
              element={
                <ProtectedRoute allowedRoles={[0, 1]}>
                  <ListsConfiguration />
                </ProtectedRoute>
              }
            />
             <Route
              path="/configure/logs"
              element={
                <ProtectedRoute allowedRoles={[0, 1]}>
                  <AuthLogs />
                </ProtectedRoute>
              }
            />
            <Route
              path="/configure/audit"
              element={
                <ProtectedRoute allowedRoles={[0, 1]}>
                  <AuditLogsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/configure/roles"
              element={
                <ProtectedRoute allowedRoles={[0, 1]}>
                  <RolesPermissions />
                </ProtectedRoute>
              }
            />
            <Route
              path="/configure/maintenance"
              element={
                <ProtectedRoute allowedRoles={[0, 1]}>
                  <Maintenance />
                </ProtectedRoute>
              }
            />
            <Route
              path="/configure/backups"
              element={
                <ProtectedRoute allowedRoles={[0, 1]}>
                  <Backups />
                </ProtectedRoute>
              }
            />
            <Route
              path="/configure/landing"
              element={
                <ProtectedRoute allowedRoles={[0, 1]}>
                  <LandingConfigPage />
                </ProtectedRoute>
              }
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
