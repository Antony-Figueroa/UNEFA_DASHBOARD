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
    title: "ENFERMERÍA",
    image: "/unefa-img/enfermeria.jpg",
    color: "info",
    extension: "Extensión Acarigua",
    category: "T.S.U",
  },
];


const CommunityInfoSection: React.FC = () => {
  const allowedCareers = [
    "AGRONÓMICA",
    "AGROINDUSTRIAL",
    "ENFERMERÍA",
  ];

  const filteredSectors = sectors.filter((sector) =>
    allowedCareers.includes(sector.title)
  );

  return (
    <section id="ofertas" className="py-24 bg-gray-50 dark:bg-bg-dark/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header animado */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="space-y-4">
            <h2 className="text-3xl font-bold text-text-emphasis sm:text-4xl transition-all duration-700 ease-in-out">
              Oferta Académica: Extensión Acarigua
            </h2>
            <p className="max-w-2xl text-lg text-text-secondary">
              Explora las carreras disponibles exclusivamente en nuestra sede Acarigua. Formación de excelencia para el desarrollo de la región.
            </p>
          </div>
          {/* <div className="hidden md:block">
            <Badge color="primary" variant="light" size="md" className="px-4 py-2">
              Sede Exclusiva: Acarigua
            </Badge>
          </div> */}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {filteredSectors.map((sector) => (
            <div key={sector.title} className="relative group rounded-2xl overflow-hidden shadow-theme-md bg-white dark:bg-bg-dark border border-border-light dark:border-border-dark">
              <img
                src={sector.image}
                alt={sector.title}
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                loading="lazy"
              />
              <div className="absolute bottom-0 left-0 w-full p-4 bg-linear-to-t from-black/60 to-transparent">
                <Badge color={sector.color} className="mb-2 transition-transform duration-200 group-hover:scale-110">
                  {sector.title}
                </Badge>
                <p className="text-xs text-white font-semibold">
                  {sector.extension} - {sector.category}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CommunityInfoSection;
