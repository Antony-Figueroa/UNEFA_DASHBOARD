import React from "react";
import Alert from "../../../components/ui/alert/Alert";
import { useToast } from "../../../context/toast";

const AlertDemo: React.FC = () => {
  const { addToast } = useToast();

  const triggerStudentToast = () => {
    addToast({
      variant: "info",
      category: "ESTUDIANTE",
      title: "Información del Estudiante",
      message: "Esta es una alerta de prueba con la categoría de estudiante y el color unificado #3498db.",
    });
  };

  return (
    <div className="p-8 space-y-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Demo de Sistema de Alertas</h1>
      
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Alertas de Estudiante (Categoría)</h2>
        <Alert
          category="ESTUDIANTE"
          title="Alerta de Estudiante"
          message="Esta alerta utiliza el esquema de color #3498db definido en el sistema de diseño para la categoría de estudiante."
          timestamp={new Date()}
        />
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Toasts de Estudiante</h2>
        <button
          onClick={triggerStudentToast}
          className="px-4 py-2 bg-[#3498db] text-white rounded hover:bg-[#2980b9] transition-colors"
        >
          Lanzar Toast de Estudiante
        </button>
      </section>

      <section className="space-y-4 pt-8 border-t">
        <h2 className="text-xl font-semibold">Comparación con Variantes Estándar</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Alert variant="success" title="Éxito" message="Variante estándar de éxito." />
          <Alert variant="error" title="Error" message="Variante estándar de error." />
          <Alert variant="warning" title="Advertencia" message="Variante estándar de advertencia." />
          <Alert variant="info" title="Información" message="Variante estándar de información." />
        </div>
      </section>
    </div>
  );
};

export default AlertDemo;
