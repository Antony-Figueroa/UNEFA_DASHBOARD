import { useState } from "react";
import { useNavigate } from "react-router";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { Modal } from "../ui/modal";
import { useAuth } from "../../context/auth";

const roleLabels: Record<number, string> = {
  0: "Super Admin",
  1: "Administrador",
  2: "Asistente",
  3: "Tutor",
  4: "Estudiante"
};

const roleColors: Record<number, string> = {
  0: "bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400",
  1: "bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-400",
  2: "bg-success-100 text-success-700 dark:bg-success-500/20 dark:text-success-400",
  3: "bg-warning-100 text-warning-700 dark:bg-warning-500/20 dark:text-warning-400",
  4: "bg-gray-100 text-gray-700 dark:bg-gray-500/20 dark:text-gray-400"
};

export default function UserDropdown() {
  const { user, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  function toggleDropdown() {
    setIsOpen(!isOpen);
  }

  function closeDropdown() {
    setIsOpen(false);
  }

  const handleSignOutClick = () => {
    setShowLogoutConfirm(true);
    closeDropdown();
  };

  const confirmSignOut = async () => {
    await signOut();
    navigate("/signin", { replace: true });
  };

  const userRole = user?.role ?? 4;
  const roleLabel = roleLabels[userRole];
  const roleColor = roleColors[userRole];

  return (
    <div className="relative">
      <button
        onClick={toggleDropdown}
        className="flex items-center gap-2.5 py-1.5 px-2 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-all duration-200"
      >
        <div className="flex items-center justify-center overflow-hidden rounded-full size-9 bg-gradient-to-br from-brand-400 to-brand-600 text-white font-semibold text-sm">
          {user ? `${user.name?.charAt(0)}${user.surname?.charAt(0)}` : "U"}
        </div>

        <div className="hidden sm:block text-left">
          <span className="block text-sm font-medium text-text-primary dark:text-white leading-tight">
            {user ? `${user.name} ${user.surname}` : "Usuario"}
          </span>
          <span className="block text-[10px] font-medium text-text-tertiary uppercase tracking-wider">
            {roleLabel}
          </span>
        </div>

        <svg
          className={`size-3.5 text-text-tertiary transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      <Dropdown
        isOpen={isOpen}
        onClose={closeDropdown}
        className="absolute right-0 mt-2 w-72 rounded-2xl border border-border-light/50 bg-white p-2 shadow-xl dark:border-white/10 dark:bg-bg-dark"
      >
        <div className="px-3 py-3 border-b border-border-light/50 dark:border-white/5">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center size-10 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-white font-semibold">
              {user ? `${user.name?.charAt(0)}${user.surname?.charAt(0)}` : "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-text-primary dark:text-white truncate">
                {user ? `${user.name} ${user.surname}` : "Usuario"}
              </p>
              <p className="text-xs text-text-tertiary truncate">
                {user?.email || "Sin correo"}
              </p>
            </div>
          </div>
          <div className="mt-2">
            <span className={`inline-flex px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-full ${roleColor}`}>
              {roleLabel}
            </span>
          </div>
        </div>

        <ul className="py-1">
          <li>
            <DropdownItem
              onItemClick={closeDropdown}
              tag="a"
              to="/profile"
              className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-text-secondary rounded-xl hover:bg-brand-500 hover:text-white dark:text-text-tertiary dark:hover:bg-brand-500 dark:hover:text-white transition-colors"
              icon={
                <svg className="size-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
              }
            >
              Mi Perfil
            </DropdownItem>
          </li>
          <li>
            <DropdownItem
              onItemClick={closeDropdown}
              tag="a"
              to="/profile"
              className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-text-secondary rounded-xl hover:bg-brand-500 hover:text-white dark:text-text-tertiary dark:hover:bg-brand-500 dark:hover:text-white transition-colors"
              icon={
                <svg className="size-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              }
            >
              Configuración
            </DropdownItem>
          </li>
        </ul>

        <div className="pt-1 border-t border-border-light/50 dark:border-white/5">
          <DropdownItem
            onClick={handleSignOutClick}
            className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-error-600 rounded-xl hover:bg-error-50 dark:text-error-400 dark:hover:bg-error-500/10 transition-colors"
            icon={
              <svg className="size-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
              </svg>
            }
          >
            Cerrar Sesión
          </DropdownItem>
        </div>
      </Dropdown>

      <Modal
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        className="max-w-sm"
        showCloseButton={false}
      >
        <div className="p-6">
          <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 rounded-full bg-error-100 dark:bg-error-500/20">
            <svg className="w-6 h-6 text-error-600 dark:text-error-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-center text-text-primary dark:text-white">
            ¿Cerrar sesión?
          </h3>
          <p className="mt-2 text-sm text-center text-text-secondary dark:text-text-tertiary">
            ¿Estás seguro de que deseas cerrar tu sesión?
          </p>
          <div className="mt-6 flex gap-3">
            <button
              onClick={() => setShowLogoutConfirm(false)}
              className="flex-1 px-4 py-2.5 text-sm font-medium rounded-xl text-text-primary bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:text-text-secondary dark:hover:bg-white/10 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={confirmSignOut}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-white rounded-xl bg-error-500 hover:bg-error-600 transition-colors"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
