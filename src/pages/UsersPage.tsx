import UserList from "../components/UserList/UserList";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import PeriodStatusChart from "../features/periods/components/PeriodStatusChart";

const UsersPage = () => {
  return (
    <>
      {/* El componente Breadcrumb es estándar en TailAdmin para la navegación */}
      <PageBreadcrumb pageTitle="Lista de Usuarios" />

      <div className="mb-10 max-w-2xl mx-auto">
        <PeriodStatusChart />
      </div>

      <div className="flex flex-col gap-10">
        {/* Aquí se renderiza el componente de la lista de usuarios */}
        <UserList />
      </div>
    </>
  );
};

export default UsersPage;
