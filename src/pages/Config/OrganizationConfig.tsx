import React from "react";
import PageMeta from "../../components/common/PageMeta";
import ComponentCard from "../../components/common/ComponentCard";

const OrganizationConfig: React.FC = () => {
  return (
    <>
      <PageMeta
        title="Configuración de la Organización"
        description="Administrar información de la organización"
      />
      <div className="space-y-6">
        <ComponentCard title="Configuración de la Organización">
          <p className="text-text-secondary">
            Esta sección permite configurar los datos de la organización,
            incluyendo logo, nombre comercial e información institucional.
          </p>
        </ComponentCard>
      </div>
    </>
  );
};

export default OrganizationConfig;
