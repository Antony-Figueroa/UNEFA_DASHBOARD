import React, { useMemo } from "react";
import { Carousel, Card } from "../components/AppleCardsCarousel";

type CardData = {
  src: string;
  title: string;
  category: string;
  content: React.ReactNode;
};

const communityImages: CardData[] = [
  {
    src: "/unefa-img/unefa_fachada.jpeg",
    title: "Fachada Principal",
    category: "Infraestructura",
    content: (
      <div className="space-y-4">
        <p className="text-neutral-700 dark:text-neutral-300 text-base leading-relaxed">
          La fachada principal de la UNEFA representa la entrada a un espacio de excelencia académica y formación integral. 
          Aquí es donde miles de estudiantes comienzan su camino hacia el futuro profesional.
        </p>
        <div className="aspect-video rounded-xl overflow-hidden">
          <img 
            src="/unefa-img/unefa_fachada.jpeg" 
            alt="Fachada Principal UNEFA" 
            className="w-full h-full object-cover"
          />
        </div>
      </div>
    ),
  },
  {
    src: "/unefa-img/Graduacion-UNEFA.jpg",
    title: "Forjando el Futuro",
    category: "Graduaciones",
    content: (
      <div className="space-y-4">
        <p className="text-neutral-700 dark:text-neutral-300 text-base leading-relaxed">
          Cada graduación representa la culminación de años de esfuerzo, dedicación y compromiso con la patria. 
          Nuestros graduados llevan consigo los valores de soberanía y conocimiento.
        </p>
        <div className="aspect-video rounded-xl overflow-hidden">
          <img 
            src="/unefa-img/Graduacion-UNEFA.jpg" 
            alt="Graduación UNEFA" 
            className="w-full h-full object-cover"
          />
        </div>
      </div>
    ),
  },
  {
    src: "/unefa-img/Universidad De Las Fuerzas Armadas.jpg",
    title: "Excelencia Educativa",
    category: "Institución",
    content: (
      <div className="space-y-4">
        <p className="text-neutral-700 dark:text-neutral-300 text-base leading-relaxed">
          La Universidad Nacional Experimental Politécnica de la Fuerza Armada abre sus puertas al pueblo venezolano, 
          ofreciendo educación de calidad accesible para todos.
        </p>
        <div className="aspect-video rounded-xl overflow-hidden">
          <img 
            src="/unefa-img/Universidad De Las Fuerzas Armadas.jpg" 
            alt="UNEFA Universidad" 
            className="w-full h-full object-cover"
          />
        </div>
      </div>
    ),
  },
  {
    src: "/unefa-img/Carreras que ofrece la UNEFA en el Distrito Capital - Notilogía.jpg",
    title: "Soberanía Tecnológica",
    category: "Formación",
    content: (
      <div className="space-y-4">
        <p className="text-neutral-700 dark:text-neutral-300 text-base leading-relaxed">
          Nuestra oferta académica está diseñada para formar profesionales comprometidos con el desarrollo 
          tecnológico y la soberanía de la nación.
        </p>
        <div className="aspect-video rounded-xl overflow-hidden">
          <img 
            src="/unefa-img/Carreras que ofrece la UNEFA en el Distrito Capital - Notilogía.jpg" 
            alt="Carreras UNEFA" 
            className="w-full h-full object-cover"
          />
        </div>
      </div>
    ),
  },
  {
    src: "/unefa-img/WhatsApp Image 2024-07-02 at 12-3649.jpg",
    title: "Identidad y Cultura",
    category: "Comunidad",
    content: (
      <div className="space-y-4">
        <p className="text-neutral-700 dark:text-neutral-300 text-base leading-relaxed">
          La comunidad UNEFA cultiva un profundo sentimiento venezolano, fortaleciendo la identidad nacional 
          a través de cada actividad académica y cultural.
        </p>
        <div className="aspect-video rounded-xl overflow-hidden">
          <img 
            src="/unefa-img/WhatsApp Image 2024-07-02 at 12-3649.jpg" 
            alt="Identidad y Cultura UNEFA" 
            className="w-full h-full object-cover"
          />
        </div>
      </div>
    ),
  },
  {
    src: "/unefa-img/WhatsApp Image 2024-07-02 at 12-5425.jpg",
    title: "Disciplina y Compromiso",
    category: "Valores",
    content: (
      <div className="space-y-4">
        <p className="text-neutral-700 dark:text-neutral-300 text-base leading-relaxed">
          La juventud de oro de la UNEFA se caracteriza por su disciplina, compromiso y dedicación. 
          Estos valores son el fundamento de su éxito profesional.
        </p>
        <div className="aspect-video rounded-xl overflow-hidden">
          <img 
            src="/unefa-img/WhatsApp Image 2024-07-02 at 12-5425.jpg" 
            alt="Disciplina y Compromiso UNEFA" 
            className="w-full h-full object-cover"
          />
        </div>
      </div>
    ),
  },
];

const WorkspaceImageGallery: React.FC = () => {
  const cards = useMemo(() => {
    return communityImages.map((card, index) => (
      <Card key={card.title} card={card} index={index} />
    ));
  }, []);

  return (
    <section id="comunidad" className="py-12 bg-brand-50/30 dark:bg-brand-900/10 border-y border-brand-100 dark:border-brand-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-[#2d90c4] dark:text-[#2d90c4]">
            Nuestra Comunidad y Espacios
          </h2>
          <p className="mt-4 text-lg text-text-secondary dark:text-text-tertiary max-w-2xl mx-auto">
            Conoce los espacios donde se forja el futuro profesional de la Patria. 
            La UNEFA es compromiso, disciplina y excelencia.
          </p>
          <div className="mt-4 flex justify-center">
            <div className="h-1 w-20 bg-[#2d90c4] rounded-full"></div>
          </div>
        </div>

        <Carousel items={cards} />
      </div>
    </section>
  );
};

export default WorkspaceImageGallery;
