// Define la estructura de un usuario para mejorar la legibilidad y seguridad del tipo.
interface User {
  avatar: string;
  name: string;
  email: string;
  role: string;
  status: "Active" | "Pending" | "Suspended";
}

// Datos de ejemplo que simulan una respuesta de una API.
const usersData: User[] = [
  {
    avatar: "https://i.pravatar.cc/150?u=ana",
    name: "Ana García",
    email: "ana.garcia@example.com",
    role: "Desarrolladora Frontend",
    status: "Active",
  },
  {
    avatar: "https://i.pravatar.cc/150?u=carlos",
    name: "Carlos López",
    email: "carlos.lopez@example.com",
    role: "Diseñador UX/UI",
    status: "Pending",
  },
  {
    avatar: "https://i.pravatar.cc/150?u=lucia",
    name: "Lucía Méndez",
    email: "lucia.mendez@example.com",
    role: "Product Manager",
    status: "Active",
  },
  {
    avatar: "https://i.pravatar.cc/150?u=jorge",
    name: "Jorge Ruiz",
    email: "jorge.ruiz@example.com",
    role: "Líder de Backend",
    status: "Suspended",
  },
];

const UserList = () => {
  return (
    <div className="rounded-sm border border-stroke bg-white px-5 pt-6 pb-2.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
      <div className="flex justify-between items-center mb-6">
        <h4 className="text-xl font-semibold text-black dark:text-white">
          Top Usuarios
        </h4>
        <button className="flex justify-center rounded bg-primary py-2 px-6 font-medium text-gray hover:bg-opacity-90">
          Añadir Usuario
        </button>
      </div>

      <div className="flex flex-col">
        {/* Cabecera de la tabla */}
        <div className="grid grid-cols-3 rounded-sm bg-gray-2 dark:bg-meta-4 sm:grid-cols-4">
          <div className="p-2.5 xl:p-5">
            <h5 className="text-sm font-medium uppercase xsm:text-base">
              Nombre
            </h5>
          </div>
          <div className="p-2.5 text-center xl:p-5">
            <h5 className="text-sm font-medium uppercase xsm:text-base">Rol</h5>
          </div>
          <div className="hidden p-2.5 text-center sm:block xl:p-5">
            <h5 className="text-sm font-medium uppercase xsm:text-base">
              Email
            </h5>
          </div>
          <div className="p-2.5 text-center xl:p-5">
            <h5 className="text-sm font-medium uppercase xsm:text-base">
              Estado
            </h5>
          </div>
        </div>

        {/* Filas de datos */}
        {usersData.map((user, key) => (
          <div
            className={`grid grid-cols-3 sm:grid-cols-4 ${key === usersData.length - 1
                ? ""
                : "border-b border-stroke dark:border-strokedark"
              }`}
            key={key}
          >
            <div className="flex items-center gap-3 p-2.5 xl:p-5">
              <div className="flex-shrink-0">
                <img
                  src={user.avatar}
                  alt="Avatar"
                  className="w-10 h-10 rounded-full"
                />
              </div>
              <p className="hidden text-black dark:text-white sm:block">
                {user.name}
              </p>
            </div>

            <div className="flex items-center justify-center p-2.5 xl:p-5">
              <p className="text-black dark:text-white">{user.role}</p>
            </div>

            <div className="hidden items-center justify-center p-2.5 sm:flex xl:p-5">
              <p className="text-black dark:text-white">{user.email}</p>
            </div>

            <div className="flex items-center justify-center p-2.5 xl:p-5">
              <p
                className={`inline-flex rounded-full bg-opacity-10 py-1 px-3 text-sm font-medium ${user.status === "Active"
                    ? "bg-success text-success"
                    : user.status === "Suspended"
                      ? "bg-danger text-danger"
                      : "bg-warning text-warning"
                  }`}
              >
                {user.status}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UserList;
