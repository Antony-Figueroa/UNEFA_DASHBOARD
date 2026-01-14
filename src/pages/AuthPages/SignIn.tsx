import PageMeta from "../../components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";
import SignInForm from "../../components/auth/SignInForm";

export default function SignIn() {
  return (
    <>
      <PageMeta
        title="Inicio de sesión"
        description="Inicio de sesión del sistema de gestión de la UNEFA"
      />
      <AuthLayout>
        <SignInForm />
      </AuthLayout>
    </>
  );
}
