import PageMeta from "../../components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";
import SignUpForm from "../../components/auth/SignUpForm";

export default function SignUp() {
  return (
    <>
      <PageMeta
        title="Registro"
        description="Página de registro del sistema de gestión de la UNEFA"
      />
      <AuthLayout>
        <SignUpForm />
      </AuthLayout>
    </>
  );
}
