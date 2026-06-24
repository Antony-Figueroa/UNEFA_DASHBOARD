import React from "react";
import { Link } from "react-router";

import { smoothScrollTo } from "../../../utils/scrollUtils";

const PublicFooter: React.FC = () => {
  const resources = [
    { name: "Reglamento de Prácticas", path: "/docs/reglamento%20PRACTICAS%20PROFESIONALES%20vigente.pdf" },
    { name: "Carta de Postulación", path: "/docs/CARTA%20DE%20POSTULACION%20PP.pdf" },
    { name: "Actas Evaluativas", path: "/docs/ACTAS%20EVALUATIVAS.pdf" },
    { name: "Estructura del Informe", path: "/docs/ESTRUCTURA%20DEL%20INFORME.pdf" },
    { name: "Guía Metodológica", path: "/docs/METODOLOG%C3%8DA.pdf" },
    { name: "Guía de Prácticas", path: "/docs/PRACTICAS%20PROFESIONALES.pdf" },
    { name: "Plan de la Patria 7T", path: "/docs/plan-de-la-patria-de-las-7t-uv-2.pdf" },
    { name: "Constitución RBV", path: "/docs/CONSTITUCION%20RBV%20(1).pdf" },
    { name: "Plan de la Patria 2019-2025", path: "/docs/Venezuela_Plan%20de%20la%20Patria%202019-2025%20(2019).pdf" },
    { name: "Formato de Membrete", path: "/docs/MEMBRETE.doc" },
    { name: "Anexo: Portada", path: "/docs/ANEXO%20K_PORTADA.doc" },
  ];

  const handleScroll = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    smoothScrollTo(id);
  };

  return (
    <footer id="contacto" className="bg-bg-dark text-white py-12 border-t border-white/5 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12">
          {/* Brand */}
          <div className="space-y-4">
            <a 
              href="#inicio" 
              onClick={(e) => handleScroll(e, "inicio")}
              className="flex items-center gap-2"
            >
              <img
                className="h-12 w-auto"
                src="/logo-nuevo.png"
                alt="UNEFA Logo"
              />
              <span className="text-xl font-bold">UNEFA</span>
            </a>
            <p className="text-gray-400 text-sm leading-relaxed">
              Sistema de Información para la Gestión de Prácticas Profesionales de la UNEFA. Transformando el futuro académico a través de la experiencia profesional.
            </p>
          </div>

          {/* Links 1 */}
          <div>
            <h4 className="font-bold mb-4 text-white">Plataforma</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>
                <Link to="/" className="hover:text-brand-400 transition-colors">
                  Inicio
                </Link>
              </li>
              <li>
                <Link to="/nosotros" className="hover:text-brand-400 transition-colors">
                  Nosotros
                </Link>
              </li>
              <li>
                <Link to="/carreras" className="hover:text-brand-400 transition-colors">
                  Carreras
                </Link>
              </li>
              <li>
                <Link to="/pasantias" className="hover:text-brand-400 transition-colors">
                  Pasantías
                </Link>
              </li>
              <li>
                <a 
                  href="#faq" 
                  onClick={(e) => handleScroll(e, "faq")}
                  className="hover:text-brand-400 transition-colors"
                >
                  Preguntas Frecuentes
                </a>
              </li>
            </ul>
          </div>

          {/* Links 2 */}
          <div>
            <h4 className="font-bold mb-4 text-white">Recursos</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              {resources.map((resource, index) => (
                <li key={index}>
                  <a 
                    href={resource.path} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="hover:text-brand-400 transition-colors"
                  >
                    {resource.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-bold mb-4 text-white">Contacto Acarigua</h4>
            <ul className="space-y-3 text-sm text-gray-400">
              <li className="flex items-start gap-2">
                <span className="wrap-break-word">HQ9J+R7P, Calle 6, Araure 3303, Portuguesa</span>
              </li>
              <li className="flex items-center gap-2">
                <a href="https://www.unefa.edu.ve" target="_blank" rel="noopener noreferrer" className="hover:text-brand-400 break-all">www.unefa.edu.ve</a>
              </li>
              <li className="flex items-center gap-2">
                <a href="https://instagram.com/unefaportuguesa" target="_blank" rel="noopener noreferrer" className="hover:text-brand-400 break-all">@unefaportuguesa</a>
              </li>
              <li className="flex items-start gap-2">
                <div className="flex flex-col min-w-0">
                  <a href="mailto:atencion.egresado.unefa19@gmail.com" className="hover:text-brand-400 break-all">atencion.egresado.unefa19@gmail.com</a>
                  <a href="mailto:registro@unefa.edu.ve" className="hover:text-brand-400 break-all">registro@unefa.edu.ve</a>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <div className="flex flex-col">
                  <span>+58 (212) 908.21.07</span>
                  <span>+58 (212) 908.20.94</span>
                </div>
              </li>
              <li className="flex items-start gap-2 text-xs border-t border-white/5 pt-3 mt-3 italic">
                <span className="leading-relaxed">Trámites específicos se gestionan presencialmente en la sede Acarigua Araure.</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-white/5 text-center text-sm text-gray-500">
          <p>© {new Date().getFullYear()} UNEFA - SIGP. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
};

export default PublicFooter;
