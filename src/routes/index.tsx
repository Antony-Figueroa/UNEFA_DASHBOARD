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
const Calendar = lazy(() => import("../pages/Calendar"));
const Blank = lazy(() => import("../pages/Blank"));
const Students = lazy(() => import("../pages/Students/students"));
const Tutors = lazy(() => import("../pages/Tutors/tutors"));
const InstitutionsPage = lazy(() => import("../pages/Institutions/institutions"));
const PreEnrollmentPage = lazy(() => import("../pages/PreEnrollment/PreEnrollment"));
const EnrollmentPage = lazy(() => import("../pages/Enrollment/Enrollment"));
const TrackingPage = lazy(() => import("../pages/Tracking/Tracking"));
const VisitRegistration = lazy(() => import("../pages/Tracking/VisitRegistration"));
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
const NotFound = lazy(() => import("../pages/OtherPage/NotFound"));

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
            
            {/* Management */}
            <Route path="/period" element={<Period />} />
            <Route path="/careers" element={<CareersPage />} />
            <Route path="/crud-example" element={<CrudExample />} />
            
            {/* Process */}
            <Route path="/pre-enrollment" element={<PreEnrollmentPage />} />
            <Route path="/enrollment" element={<EnrollmentPage />} />
            <Route path="/tracking" element={<TrackingPage />} />
            <Route path="/visit-registration" element={<VisitRegistration />} />

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
