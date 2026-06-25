import { useEffect } from "react";
import GridShape from "../../components/common/GridShape";
import { useNavigate } from "react-router";
import PageMeta from "../../components/common/PageMeta";

export default function NotFound() {
  useEffect(() => {
    document.documentElement.dataset.hideIaButton = "";
    return () => { delete document.documentElement.dataset.hideIaButton; };
  }, []);
  const navigate = useNavigate();

  const canGoBack = window.history.length > 1;

  return (
    <>
      <PageMeta
        title="Página no encontrada — SIGP UNEFA"
        description="La página que buscas no existe o ha sido movida."
      />
      <div className="relative flex flex-col items-center justify-center min-h-screen p-6 overflow-hidden z-1">
        <GridShape />
        <div className="mx-auto w-full max-w-60.5 text-center sm:max-w-118">
          <h1 className="mb-8 font-bold text-text-primary text-title-md dark:text-text-emphasis xl:text-title-2xl">
            Página no encontrada
          </h1>

          <img src="/images/error/404.svg" alt="404" className="dark:hidden" />
          <img
            src="/images/error/404-dark.svg"
            alt="404"
            className="hidden dark:block"
          />

          <p className="mt-10 mb-8 text-base text-text-secondary dark:text-text-tertiary sm:text-lg">
            La página que buscas no existe o fue movida.
            Revisa la URL o vuelve a intentarlo.
          </p>

          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => { if (canGoBack) navigate(-1); else navigate("/"); }}
              className="inline-flex items-center justify-center rounded-lg border border-border-medium bg-bg-main px-6 py-3.5 text-sm font-medium text-text-secondary shadow-theme-xs hover:bg-bg-secondary hover:text-text-primary dark:border-border-dark dark:bg-bg-dark dark:text-text-tertiary dark:hover:bg-white/3 dark:hover:text-text-emphasis"
            >
              {canGoBack ? "Volver atrás" : "Ir al inicio"}
            </button>
          </div>
        </div>
        <p className="absolute text-sm text-center text-text-secondary -translate-x-1/2 bottom-6 left-1/2 dark:text-text-tertiary">
          &copy; {new Date().getFullYear()} — SIGP UNEFA
        </p>
      </div>
    </>
  );
}
