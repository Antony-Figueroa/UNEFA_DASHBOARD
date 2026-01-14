import React, { useState } from "react";
import Badge, { BadgeColor } from "../../../components/ui/badge/Badge";

interface Sector {
  title: string;
  image: string;
  color: BadgeColor;
  extension: string;
  category: "T.S.U" | "Licenciatura" | "Ingeniería";
}

const sectors: Sector[] = [
  {
    title: "AGRONÓMICA",
    image: "/unefa-img/agronomia.jpg",
    color: "success",
    extension: "Extensión Acarigua",
    category: "Ingeniería",
  },
  {
    title: "AGROINDUSTRIAL",
    image: "/unefa-img/agroindustrial.jpg",
    color: "primary",
    extension: "Extensión Acarigua",
    category: "Ingeniería",
  },
  {
    title: "AZÚCAR",
    image: "/unefa-img/azucar.jpg",
    color: "warning",
    extension: "Extensión Acarigua",
    category: "Ingeniería",
  },
  {
    title: "GAS",
    image: "/unefa-img/gas.jpg",
    color: "error",
    extension: "Extensión Acarigua",
    category: "Ingeniería",
  },
  {
    title: "ECONOMÍA SOCIAL",
    image: "/unefa-img/economia.jpg",
    color: "success",
    extension: "Extensión Acarigua",
    category: "Licenciatura",
  },
  {
    title: "ENFERMERÍA",
    image: "/unefa-img/enfermeria.jpg",
    color: "info",
    extension: "Extensión Acarigua",
    category: "T.S.U",
  },
];

const CareerImage: React.FC<{ src: string; alt: string }> = ({ src, alt }) => {
  const [error, setError] = useState(false);
  const fallbackImage = "/unefa-img/unefa_fachada.jpeg";

  return (
    <img
      src={error ? fallbackImage : src}
      alt={alt}
      onError={() => setError(true)}
      className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
      loading="lazy"
    />
  );
};

const CommunityInfoSection: React.FC = () => {
  const allowedCareers = [
    "AGRONÓMICA",
    "AGROINDUSTRIAL",
    "AZÚCAR",
    "GAS",
    "ECONOMÍA SOCIAL",
    "ENFERMERÍA",
  ];

  const filteredSectors = sectors.filter((sector) =>
    allowedCareers.includes(sector.title)
  );

  return (
    <section className="bg-bg-secondary py-24 dark:bg-white/3">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="space-y-4">
            <h2 className="text-3xl font-bold text-text-emphasis sm:text-4xl">
              Oferta Académica: Extensión Acarigua
            </h2>
            <p className="max-w-2xl text-lg text-text-secondary">
              Explora las carreras disponibles exclusivamente en nuestra sede Acarigua. Formación de excelencia para el desarrollo de la región.
            </p>
          </div>
          <div className="hidden md:block">
            <Badge color="primary" variant="light" size="md" className="px-4 py-2">
              Sede Exclusiva: Acarigua
            </Badge>
          </div>
        </div>

        {/* Categories / Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredSectors.map((sector, index) => (
            <div
              key={index}
              className="group relative h-80 overflow-hidden rounded-2xl shadow-theme-md transition-all duration-500 hover:-translate-y-1 hover:shadow-theme-xl cursor-pointer"
            >
              {/* Background Image with Fallback */}
              <CareerImage src={sector.image} alt={sector.title} />
              
              {/* Overlays */}
              <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/40 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />
              <div className="absolute inset-0 border border-white/10 rounded-2xl" />

              {/* Content */}
              <div className="absolute inset-0 p-6 flex flex-col justify-end">
                <div className="flex flex-wrap gap-2 mb-3">
                  <Badge
                    color={sector.color}
                    variant="light"
                    size="sm"
                    className="backdrop-blur-md bg-white/10 text-white border-white/20"
                  >
                    {sector.extension}
                  </Badge>
                  <Badge
                    color="dark"
                    variant="outline"
                    size="sm"
                    shape="rounded"
                    className="backdrop-blur-md bg-black/20 text-white border-white/20"
                  >
                    {sector.category}
                  </Badge>
                </div>
                
                <h3 className="text-xl font-bold text-white mb-2 tracking-tight">
                  {sector.title}
                </h3>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CommunityInfoSection;
