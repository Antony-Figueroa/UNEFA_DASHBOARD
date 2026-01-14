import React from "react";
import { Link } from "react-router";

import { smoothScrollTo } from "../../../utils/scrollUtils";

const PublicFooter: React.FC = () => {
  const handleScroll = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    smoothScrollTo(id);
  };

  return (
    <footer id="contacto" className="bg-bg-dark text-white py-12 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="col-span-1 md:col-span-1 space-y-4">
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
            <p className="text-gray-400 text-sm">
              Sistema de Gestión de Pasantías de la UNEFA. Transformando el futuro académico a través de la experiencia profesional.
            </p>
          </div>

          {/* Links 1 */}
          <div>
            <h4 className="font-bold mb-4">Plataforma</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>
                <a 
                  href="#inicio" 
                  onClick={(e) => handleScroll(e, "inicio")}
                  className="hover:text-brand-400 transition-colors"
                >
                  Inicio
                </a>
              </li>
              <li>
                <a 
                  href="#comunidad" 
                  onClick={(e) => handleScroll(e, "comunidad")}
                  className="hover:text-brand-400 transition-colors"
                >
                  Comunidad
                </a>
              </li>
              <li>
                <a 
                  href="#procesos" 
                  onClick={(e) => handleScroll(e, "procesos")}
                  className="hover:text-brand-400 transition-colors"
                >
                  Procesos
                </a>
              </li>
              <li><Link to="#" className="hover:text-brand-400 transition-colors">Preguntas Frecuentes</Link></li>
            </ul>
          </div>

          {/* Links 2 */}
          <div>
            <h4 className="font-bold mb-4">Recursos</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link to="#" className="hover:text-brand-400 transition-colors">Manual de Usuario</Link></li>
              <li><Link to="#" className="hover:text-brand-400 transition-colors">Reglamento de Pasantías</Link></li>
              <li><Link to="#" className="hover:text-brand-400 transition-colors">Formatos y Planillas</Link></li>
              <li><Link to="#" className="hover:text-brand-400 transition-colors">Soporte Técnico</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-bold mb-4">Contacto</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li className="flex items-center gap-2">
                <span>📍</span> Caracas, Venezuela
              </li>
              <li className="flex items-center gap-2">
                <span>📧</span> contacto@unefa.edu.ve
              </li>
              <li className="flex items-center gap-2">
                <span>📞</span> +58 (212) 123-4567
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
