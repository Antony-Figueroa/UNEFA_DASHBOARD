import { useAuth } from "../../context/auth";
import { ROLE_LABELS } from "../../features/auth/constants/roles";

export default function UserInfoCard() {
  const { user } = useAuth();

  return (
    <div className="p-5 border border-border-light rounded-2xl dark:border-white/10 lg:p-6 bg-white dark:bg-bg-dark">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between mb-6">
        <div>
          <h4 className="text-lg font-semibold text-text-emphasis dark:text-white">
            Información Personal
          </h4>
          <p className="text-sm text-text-secondary dark:text-text-tertiary mt-1">
            Sus datos personales registrados en el sistema.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-7 2xl:gap-x-32">
        <div>
          <p className="mb-1 text-xs font-medium text-text-secondary dark:text-text-tertiary">
            Nombres
          </p>
          <p className="text-sm font-medium text-text-emphasis dark:text-white">
            {user ? `${user.name} ${user.secondName || ""}`.trim() : "N/A"}
          </p>
        </div>

        <div>
          <p className="mb-1 text-xs font-medium text-text-secondary dark:text-text-tertiary">
            Apellidos
          </p>
          <p className="text-sm font-medium text-text-emphasis dark:text-white">
            {user ? `${user.surname} ${user.secondSurname || ""}`.trim() : "N/A"}
          </p>
        </div>

        <div>
          <p className="mb-1 text-xs font-medium text-text-secondary dark:text-text-tertiary">
            Correo Electrónico
          </p>
          <p className="text-sm font-medium text-text-emphasis dark:text-white">
            {user?.email || "N/A"}
          </p>
        </div>

        <div>
          <p className="mb-1 text-xs font-medium text-text-secondary dark:text-text-tertiary">
            Teléfono
          </p>
          <p className="text-sm font-medium text-text-emphasis dark:text-white">
            {user?.phoneNumber || "N/A"}
          </p>
        </div>

        <div>
          <p className="mb-1 text-xs font-medium text-text-secondary dark:text-text-tertiary">
            Cédula de Identidad
          </p>
          <p className="text-sm font-medium text-text-emphasis dark:text-white">
            {user?.userCi || "N/A"}
          </p>
        </div>

        <div>
          <p className="mb-1 text-xs font-medium text-text-secondary dark:text-text-tertiary">
            Rol
          </p>
          <p className="text-sm font-medium text-text-emphasis dark:text-white">
            {ROLE_LABELS[user?.role ?? -1] ?? "Desconocido"}
          </p>
        </div>
      </div>
    </div>
  );
}
