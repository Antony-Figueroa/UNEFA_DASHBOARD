/**
 * @file useStudents.tsx
 * @description Hook para la gestión de estudiantes en modo demostración.
 * Todas las operaciones son locales y no realizan llamadas a API externas.
 */

import { useState, useEffect, useCallback } from "react";
import { Student } from "../types";
import { useToast } from "../../../context/toast";
import { ChangeComparison, RecordDetails } from "../../../components/ui/alert/AlertContextualContent";

type Status = "loading" | "success" | "error";

const STUDENT_LABELS: Record<string, string> = {
  firstName: "Nombre",
  lastName: "Apellido",
  careerName: "Carrera",
  semester: "Semestre",
  section: "Sección",
  regime: "Régimen",
  identificationNumber: "Cédula",
  email: "Correo",
  phone: "Teléfono",
  sex: "Sexo",
  birthDate: "Fecha de Nacimiento",
  civilStatus: "Estado Civil",
  studentType: "Tipo",
  works: "Trabaja",
};

/**
 * DATOS DE DEMOSTRACIÓN
 * Estos datos simulan la respuesta que vendría de un servidor real.
 */
const DEMO_STUDENTS: Student[] = [
  {
    studentId: "1",
    identificationPrefix: "V",
    identificationNumber: "29968304",
    firstName: "ALBANY",
    middleName: "MITCHEL",
    lastName: "MARTINEZ",
    secondLastName: "COLMENARES",
    sex: "FEMENINO",
    birthDate: "2002-03-01",
    civilStatus: "SOLTERO",
    phone: "04261234567",
    email: "ALBANYMARTINEZ@GMAIL.COM",
    careerId: "1",
    careerName: "T.S.U. EN ENFERMERIA",
    semester: "04",
    section: "236",
    regime: "DIURNO",
    studentType: "CIVIL",
    militaryRank: "NO APLICA",
    works: "NO",
    enrollmentDate: new Date("2023-02-15"),
    status: true,
  },
  {
    studentId: "2",
    identificationPrefix: "V",
    identificationNumber: "29630989",
    firstName: "ALBA",
    middleName: "ROSA",
    lastName: "CARRASCO",
    secondLastName: "PARRA",
    sex: "FEMENINO",
    birthDate: "2003-05-12",
    civilStatus: "SOLTERO",
    phone: "04121234567",
    email: "ALBAROSA@GMAIL.COM",
    careerId: "1",
    careerName: "T.S.U. EN ENFERMERIA",
    semester: "04",
    section: "236",
    regime: "DIURNO",
    studentType: "CIVIL",
    militaryRank: "NO APLICA",
    works: "SI",
    enrollmentDate: new Date("2023-02-18"),
    status: true,
  },
  {
    studentId: "3",
    identificationPrefix: "V",
    identificationNumber: "28456789",
    firstName: "CARLOS",
    middleName: "JOSE",
    lastName: "PEREZ",
    secondLastName: "RODRIGUEZ",
    sex: "MASCULINO",
    birthDate: "2001-08-20",
    civilStatus: "SOLTERO",
    phone: "04147654321",
    email: "CARLOSPEREZ@GMAIL.COM",
    careerId: "2",
    careerName: "INGENIERIA EN SISTEMAS",
    semester: "06",
    section: "301",
    regime: "NOCTURNO",
    studentType: "MILITAR",
    militaryRank: "SARGENTO",
    works: "SI",
    enrollmentDate: new Date("2022-09-10"),
    status: true,
  },
  {
    studentId: "4",
    identificationPrefix: "V",
    identificationNumber: "30123456",
    firstName: "MARIA",
    middleName: "ELENA",
    lastName: "GONZALEZ",
    secondLastName: "LOPEZ",
    sex: "FEMENINO",
    birthDate: "2004-01-15",
    civilStatus: "SOLTERO",
    phone: "04161112233",
    email: "MARIAGONZALEZ@HOTMAIL.COM",
    careerId: "3",
    careerName: "LICENCIATURA EN ADMINISTRACION",
    semester: "02",
    section: "102",
    regime: "MIXTO",
    studentType: "CIVIL",
    militaryRank: "NO APLICA",
    works: "NO",
    enrollmentDate: new Date("2024-01-20"),
    status: true,
  },
  {
    studentId: "5",
    identificationPrefix: "V",
    identificationNumber: "27890123",
    firstName: "JUAN",
    middleName: "BAUTISTA",
    lastName: "RAMIREZ",
    secondLastName: "GARCIA",
    sex: "MASCULINO",
    birthDate: "2000-11-30",
    civilStatus: "CASADO",
    phone: "04245556677",
    email: "JUANRAMIREZ@YAHOO.COM",
    careerId: "2",
    careerName: "INGENIERIA EN SISTEMAS",
    semester: "08",
    section: "401",
    regime: "DIURNO",
    studentType: "CIVIL",
    militaryRank: "NO APLICA",
    works: "SI",
    enrollmentDate: new Date("2021-02-05"),
    status: true,
  },
  {
    studentId: "6",
    identificationPrefix: "V",
    identificationNumber: "31456789",
    firstName: "ANA",
    middleName: "ISABEL",
    lastName: "TORRES",
    secondLastName: "DIAZ",
    sex: "FEMENINO",
    birthDate: "2005-06-25",
    civilStatus: "SOLTERO",
    phone: "04129998877",
    email: "ANATORRES@GMAIL.COM",
    careerId: "1",
    careerName: "T.S.U. EN ENFERMERIA",
    semester: "01",
    section: "101",
    regime: "DIURNO",
    studentType: "CIVIL",
    militaryRank: "NO APLICA",
    works: "NO",
    enrollmentDate: new Date("2024-06-01"),
    status: true,
  },
  {
    studentId: "7",
    identificationPrefix: "V",
    identificationNumber: "26123456",
    firstName: "PEDRO",
    middleName: "ANTONIO",
    lastName: "MENDOZA",
    secondLastName: "SILVA",
    sex: "MASCULINO",
    birthDate: "1998-04-10",
    civilStatus: "DIVORCIADO",
    phone: "04143332211",
    email: "PEDROMENDOZA@GMAIL.COM",
    careerId: "4",
    careerName: "LICENCIATURA EN CONTADURIA",
    semester: "10",
    section: "501",
    regime: "NOCTURNO",
    studentType: "MILITAR",
    militaryRank: "CABO",
    works: "SI",
    enrollmentDate: new Date("2020-09-15"),
    status: true,
  },
  {
    studentId: "8",
    identificationPrefix: "V",
    identificationNumber: "29123456",
    firstName: "LUISA",
    middleName: "FERNANDA",
    lastName: "CASTILLO",
    secondLastName: "ORTEGA",
    sex: "FEMENINO",
    birthDate: "2002-12-05",
    civilStatus: "SOLTERO",
    phone: "04264445566",
    email: "LUISACASTILLO@GMAIL.COM",
    careerId: "2",
    careerName: "INGENIERIA EN SISTEMAS",
    semester: "05",
    section: "302",
    regime: "DIURNO",
    studentType: "CIVIL",
    militaryRank: "NO APLICA",
    works: "NO",
    enrollmentDate: new Date("2022-02-10"),
    status: true,
  },
  {
    studentId: "9",
    identificationPrefix: "V",
    identificationNumber: "28123456",
    firstName: "RICARDO",
    middleName: "ALEXANDER",
    lastName: "SANCHEZ",
    secondLastName: "VARGAS",
    sex: "MASCULINO",
    birthDate: "2001-02-28",
    civilStatus: "SOLTERO",
    phone: "04168887766",
    email: "RICARDOSANCHEZ@GMAIL.COM",
    careerId: "3",
    careerName: "LICENCIATURA EN ADMINISTRACION",
    semester: "07",
    section: "402",
    regime: "MIXTO",
    studentType: "CIVIL",
    militaryRank: "NO APLICA",
    works: "SI",
    enrollmentDate: new Date("2021-09-20"),
    status: true,
  },
  {
    studentId: "10",
    identificationPrefix: "V",
    identificationNumber: "32123456",
    firstName: "SOFIA",
    middleName: "VALENTINA",
    lastName: "RIVAS",
    secondLastName: "BLANCO",
    sex: "FEMENINO",
    birthDate: "2006-03-15",
    civilStatus: "SOLTERO",
    phone: "04126665544",
    email: "SOFIARIVAS@GMAIL.COM",
    careerId: "1",
    careerName: "T.S.U. EN ENFERMERIA",
    semester: "02",
    section: "102",
    regime: "DIURNO",
    studentType: "CIVIL",
    militaryRank: "NO APLICA",
    works: "NO",
    enrollmentDate: new Date("2024-01-15"),
    status: true,
  },
  {
    studentId: "11",
    identificationPrefix: "V",
    identificationNumber: "25123456",
    firstName: "JOSE",
    middleName: "GREGORIO",
    lastName: "HERNANDEZ",
    secondLastName: "MEJIAS",
    sex: "MASCULINO",
    birthDate: "1997-10-26",
    civilStatus: "CASADO",
    phone: "04141112233",
    email: "JOSEHERNANDEZ@GMAIL.COM",
    careerId: "4",
    careerName: "LICENCIATURA EN CONTADURIA",
    semester: "09",
    section: "501",
    regime: "NOCTURNO",
    studentType: "MILITAR",
    militaryRank: "SARGENTO",
    works: "SI",
    enrollmentDate: new Date("2020-02-15"),
    status: false,
  },
  {
    studentId: "12",
    identificationPrefix: "V",
    identificationNumber: "24123456",
    firstName: "CARMEN",
    middleName: "ALICIA",
    lastName: "RONDON",
    secondLastName: "BRITO",
    sex: "FEMENINO",
    birthDate: "1996-05-18",
    civilStatus: "VIUDO",
    phone: "04242223344",
    email: "CARMENRONDON@GMAIL.COM",
    careerId: "3",
    careerName: "LICENCIATURA EN ADMINISTRACION",
    semester: "10",
    section: "502",
    regime: "DIURNO",
    studentType: "CIVIL",
    militaryRank: "NO APLICA",
    works: "SI",
    enrollmentDate: new Date("2019-09-10"),
    status: false,
  },
  {
    studentId: "13",
    identificationPrefix: "V",
    identificationNumber: "23123456",
    firstName: "MANUEL",
    middleName: "ENRIQUE",
    lastName: "GUZMAN",
    secondLastName: "LOPEZ",
    sex: "MASCULINO",
    birthDate: "1995-12-12",
    civilStatus: "DIVORCIADO",
    phone: "04163334455",
    email: "MANUELGUZMAN@GMAIL.COM",
    careerId: "2",
    careerName: "INGENIERIA EN SISTEMAS",
    semester: "08",
    section: "402",
    regime: "MIXTO",
    studentType: "CIVIL",
    militaryRank: "NO APLICA",
    works: "NO",
    enrollmentDate: new Date("2021-02-18"),
    status: false,
  }
];

export const useStudents = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [status, setStatus] = useState<Status>("loading");
  const [loadingAction, setLoadingAction] = useState(false);
  const { addToast } = useToast();

  // Efecto para manejar el timeout de seguridad (30 segundos) en acciones críticas
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    if (loadingAction) {
      timeoutId = setTimeout(() => {
        setLoadingAction(false);
        console.warn("[useStudents] Timeout de 30s alcanzado. Rehabilitando botones.");
      }, 30000);
    }
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [loadingAction]);

  /**
   * Inicialización de datos de demo.
   * En producción, aquí se realizaría el fetch a la API.
   */
  const refreshStudents = useCallback(async () => {
    setStatus("loading");
    // Simulamos un tiempo de carga de 1 segundo para mostrar el spinner
    setTimeout(() => {
      setStudents(DEMO_STUDENTS);
      setStatus("success");
    }, 1000);
  }, []);

  useEffect(() => {
    refreshStudents();
  }, [refreshStudents]);

  /**
   * Simulación de creación de estudiante.
   * @param studentData Datos del nuevo estudiante
   */
  const addStudent = async (studentData: Omit<Student, "studentId" | "enrollmentDate">) => {
    setLoadingAction(true);
    // Simular retraso de red
    await new Promise(resolve => setTimeout(resolve, 800));

    const newStudent: Student = {
      ...studentData,
      studentId: Math.random().toString(36).substr(2, 9),
      enrollmentDate: new Date(),
    };

    setStudents(prev => [newStudent, ...prev]);
    setLoadingAction(false);

    addToast({
      variant: "success",
      title: "Estudiante Creado",
      message: (
        <>
          <p>El estudiante <strong>{newStudent.firstName} {newStudent.lastName}</strong> ha sido registrado correctamente.</p>
          <RecordDetails
            data={newStudent as unknown as Record<string, unknown>}
            labels={STUDENT_LABELS}
            fields={['identificationNumber', 'careerName', 'semester']}
          />
        </>
      ),
      onViewDetails: () => console.log("Ver detalles de:", newStudent.studentId),
      onUndo: () => setStudents(prev => prev.filter(s => s.studentId !== newStudent.studentId))
    });
  };

  /**
   * Simulación de edición de estudiante.
   * @param studentData Datos actualizados
   */
  const editStudent = async (studentData: Student) => {
    setLoadingAction(true);
    await new Promise(resolve => setTimeout(resolve, 800));

    const oldStudent = students.find(s => s.studentId === studentData.studentId);

    setStudents(prev => prev.map(s => s.studentId === studentData.studentId ? studentData : s));
    setLoadingAction(false);

    if (oldStudent) {
      addToast({
        variant: "success",
        title: "Actualización Exitosa",
        message: (
          <>
            <p>Se han guardado los cambios para <strong>{studentData.firstName} {studentData.lastName}</strong>.</p>
            <ChangeComparison
              oldData={oldStudent as unknown as Record<string, unknown>}
              newData={studentData as unknown as Record<string, unknown>}
              labels={STUDENT_LABELS}
            />
          </>
        ),
        onUndo: () => setStudents(prev => prev.map(s => s.studentId === studentData.studentId ? oldStudent : s))
      });
    }
  };

  /**
   * Alternar estado activo/inactivo.
   */
  const toggleStatus = async (student: Student) => {
    setLoadingAction(true);
    await new Promise(resolve => setTimeout(resolve, 600));

    const isInactivating = student.status;
    const oldStatus = student.status;

    setStudents(prev => prev.map(s => s.studentId === student.studentId ? { ...s, status: !s.status } : s));
    setLoadingAction(false);

    addToast({
      variant: isInactivating ? "warning" : "success",
      title: isInactivating ? "Estudiante Inactivado" : "Estudiante Restaurado",
      message: (
        <>
          <p>
            El estudiante <strong>{student.firstName} {student.lastName}</strong> ahora está
            <span className={`font-bold ${isInactivating ? 'text-warning-600' : 'text-success-600'}`}>
              {isInactivating ? ' INACTIVO' : ' ACTIVO'}
            </span>.
          </p>
          {isInactivating && (
            <p className="mt-1 text-xs text-gray-500 italic">
              * El estudiante no aparecerá en las listas de asistencia actuales.
            </p>
          )}
          {!isInactivating && (
            <p className="mt-1 text-xs text-gray-500 italic">
              * El registro ha sido recuperado con todos sus datos previos.
            </p>
          )}
        </>
      ),
      onUndo: () => setStudents(prev => prev.map(s => s.studentId === student.studentId ? { ...s, status: oldStatus } : s))
    });
  };

  /**
   * Acciones masivas de eliminación.
   */
  const bulkRemoveStudents = async (ids: string[]) => {
    setLoadingAction(true);
    await new Promise(resolve => setTimeout(resolve, 1000));

    setStudents(prev => prev.map(s => ids.includes(s.studentId) ? { ...s, status: false } : s));
    setLoadingAction(false);

    addToast({
      variant: "warning",
      title: "Inactivación Masiva",
      message: (
        <p>Se han inactivado <strong>{ids.length}</strong> estudiantes correctamente.</p>
      ),
      onUndo: () => setStudents(prev => prev.map(s => ids.includes(s.studentId) ? { ...s, status: true } : s))
    });
  };

  /**
   * Acciones masivas de restauración.
   */
  const bulkRestoreStudents = async (ids: string[]) => {
    setLoadingAction(true);
    await new Promise(resolve => setTimeout(resolve, 1000));

    setStudents(prev => prev.map(s => ids.includes(s.studentId) ? { ...s, status: true } : s));
    setLoadingAction(false);

    addToast({
      variant: "success",
      title: "Restauración Masiva",
      message: (
        <p>Se han restaurado <strong>{ids.length}</strong> estudiantes exitosamente.</p>
      ),
      onUndo: () => setStudents(prev => prev.map(s => ids.includes(s.studentId) ? { ...s, status: false } : s))
    });
  };

  return {
    students,
    status,
    loadingAction,
    error: null,
    addStudent,
    editStudent,
    toggleStatus,
    bulkRemoveStudents,
    bulkRestoreStudents,
  };
};
