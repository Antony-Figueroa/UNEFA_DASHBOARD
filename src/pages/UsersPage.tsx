import React from "react";
import UserList from "../components/UserList/UserList";
import Breadcrumb from "../components/common/PageBreadCrumb";
import LayoutContent from "../layout/AppLayout";

const UsersPage = () => {
  return (
    <LayoutContent>
      {/* El componente Breadcrumb es estándar en TailAdmin para la navegación */}
      <Breadcrumb pageName="Lista de Usuarios" />

      <div className="flex flex-col gap-10">
        {/* Aquí se renderiza el componente de la lista de usuarios */}
        <UserList />
      </div>
    </LayoutContent>
  );
};

export default UsersPage;
