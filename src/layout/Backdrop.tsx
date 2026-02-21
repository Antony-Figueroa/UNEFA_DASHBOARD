import { useSidebar } from "../context/sidebar";

const Backdrop: React.FC = () => {
  const { isMobileOpen, toggleMobileSidebar } = useSidebar();

  if (!isMobileOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 lg:hidden"
      style={{ zIndex: 45 }}
      onClick={toggleMobileSidebar}
    />
  );
};

export default Backdrop;
