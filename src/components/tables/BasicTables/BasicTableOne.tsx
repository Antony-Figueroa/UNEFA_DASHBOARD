import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../ui/table";
import Badge from "../../ui/badge/Badge";
import { ChevronDownIcon } from "../../../icons";

interface Order {
  id: number;
  user: {
    image: string;
    name: string;
    role: string;
  };
  projectName: string;
  team: {
    images: string[];
  };
  status: string;
  budget: string;
}

// Datos de ejemplo para la simulación
const sampleData: Order[] = [
  {
    id: 1,
    user: {
      image: "/images/user/user-17.jpg",
      name: "Lindsey Curtis",
      role: "Web Designer",
    },
    projectName: "Agency Website",
    team: {
      images: [
        "/images/user/user-22.jpg",
        "/images/user/user-23.jpg",
        "/images/user/user-24.jpg",
      ],
    },
    budget: "3.9K",
    status: "Active",
  },
  {
    id: 2,
    user: {
      image: "/images/user/user-18.jpg",
      name: "Kaiya George",
      role: "Project Manager",
    },
    projectName: "Technology",
    team: {
      images: ["/images/user/user-25.jpg", "/images/user/user-26.jpg"],
    },
    budget: "24.9K",
    status: "Pending",
  },
  {
    id: 3,
    user: {
      image: "/images/user/user-17.jpg",
      name: "Zain Geidt",
      role: "Content Writing",
    },
    projectName: "Blog Writing",
    team: {
      images: ["/images/user/user-27.jpg"],
    },
    budget: "12.7K",
    status: "Active",
  },
  {
    id: 4,
    user: {
      image: "/images/user/user-20.jpg",
      name: "Abram Schleifer",
      role: "Digital Marketer",
    },
    projectName: "Social Media",
    team: {
      images: [
        "/images/user/user-28.jpg",
        "/images/user/user-29.jpg",
        "/images/user/user-30.jpg",
      ],
    },
    budget: "2.8K",
    status: "Cancel",
  },
  {
    id: 5,
    user: {
      image: "/images/user/user-21.jpg",
      name: "Carla George",
      role: "Front-end Developer",
    },
    projectName: "Website",
    team: {
      images: [
        "/images/user/user-31.jpg",
        "/images/user/user-32.jpg",
        "/images/user/user-33.jpg",
      ],
    },
    budget: "4.5K",
    status: "Active",
  },
];

export default function BasicTableOne() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [data, setData] = useState<Order[]>([]);
  const [error, setError] = useState<Error | null>(null);
  const [isErrorDetailsOpen, setIsErrorDetailsOpen] = useState(false);

  useEffect(() => {
    const fetchApiData = () => {
      setStatus('loading');
      // Simula una demora en la llamada a la API
      setTimeout(() => {
        // Para probar diferentes escenarios, puedes cambiar el valor de 'scenario'
        // 'success-data': La API devuelve datos
        // 'success-empty': La API no devuelve datos
        // 'error': La llamada a la API falla
        const scenario = 'success-data'; // Se cambia a 'success-data' para un build exitoso

        try {
          if (scenario === 'success-data') {
            // Simula una llamada a la API exitosa con datos
            setData(sampleData);
            setStatus('success');
          } else if (scenario === 'success-empty') {
            // Simula una llamada a la API exitosa sin datos
            setData([]);
            setStatus('success');
          } else if (scenario === 'error') {
            // Simula un error en la llamada a la API
            throw new Error("Error de conexión: No se pudo conectar a la API o la base de datos.");
          }
        } catch (e: unknown) {
          const err = e instanceof Error ? e : new Error("Error desconocido");
          setError(err);
          setStatus('error');
        }
      }, 1500);
    };

    fetchApiData();
  }, []);

  if (status === 'error') {
    return (
      <div className="rounded-xl border border-red-300 bg-red-50 p-4 text-center dark:border-red-800 dark:bg-red-900/20">
        <p className="font-medium text-red-600 dark:text-red-400">¡Ocurrió un error al cargar los datos!</p>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">La API o la base de datos no está disponible.</p>
        <button
          onClick={() => setIsErrorDetailsOpen(!isErrorDetailsOpen)}
          className="mt-3 inline-flex items-center gap-2 text-sm text-blue-600 hover:underline dark:text-blue-400"
        >
          {isErrorDetailsOpen ? 'Ocultar detalles' : 'Mostrar detalles'}
          <ChevronDownIcon className={`w-4 h-4 transition-transform ${isErrorDetailsOpen ? 'rotate-180' : ''}`} />
        </button>
        {isErrorDetailsOpen && error && <pre className="mt-4 rounded-lg bg-red-100 p-3 text-left text-xs text-red-700 dark:bg-red-900/30 dark:text-red-300">{error.message}</pre>}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      <div className="max-w-full overflow-x-auto">
        <Table>
          {/* Table Header */}
          <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
            <TableRow>
              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                User
              </TableCell>
              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Project Name
              </TableCell>
              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Team
              </TableCell>
              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Status
              </TableCell>
              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Budget
              </TableCell>
            </TableRow>
          </TableHeader>

          {/* Table Body */}
          <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
            {status === 'loading' ? (
              <TableRow>
                <td colSpan={5} className="py-10 text-center text-gray-500 dark:text-gray-400">
                  Cargando datos...
                </td>
              </TableRow>
            ) : data.length > 0 ? (
              data.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="px-5 py-4 sm:px-6 text-start">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 overflow-hidden rounded-full">
                        <img
                          width={40}
                          height={40}
                          src={order.user.image}
                          alt={order.user.name}
                        />
                      </div>
                      <div>
                        <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
                          {order.user.name}
                        </span>
                        <span className="block text-gray-500 text-theme-xs dark:text-gray-400">
                          {order.user.role}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                    {order.projectName}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                    <div className="flex -space-x-2">
                      {order.team.images.map((teamImage, index) => (
                        <div
                          key={index}
                          className="w-6 h-6 overflow-hidden border-2 border-white rounded-full dark:border-gray-900"
                        >
                          <img
                            width={24}
                            height={24}
                            src={teamImage}
                            alt={`Team member ${index + 1}`}
                            className="w-full size-6"
                          />
                        </div>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                    <Badge
                      size="sm"
                      color={
                        order.status === "Active"
                          ? "success"
                          : order.status === "Pending"
                            ? "warning"
                            : "error"
                      }
                    >
                      {order.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                    {order.budget}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <td colSpan={5} className="py-10 text-center text-gray-500 dark:text-gray-400">
                  No hay datos para mostrar.
                </td>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
