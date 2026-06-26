import { useState } from "react";
import { useNavigate } from "react-router";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { Modal } from "../ui/modal";
import { useAuth } from "../../context/auth";
import { useTabs } from "../../context/tab";

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
  const { openTab } = useTabs();

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
        <div className="flex items-center justify-center overflow-hidden rounded-full w-9 h-9 min-w-9 min-h-9 bg-linear-to-br from-brand-400 to-brand-600 text-white font-semibold text-sm shrink-0">
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
        <div className="px-3 py-3  border-border-light/50 dark:border-white/5">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 min-w-10 min-h-10 rounded-full bg-linear-to-br from-brand-400 to-brand-600 text-white font-semibold shrink-0">
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
              onClick={() => openTab("/profile", "Mi Perfil")}
              onItemClick={closeDropdown}
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
