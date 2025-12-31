import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Input from "../../../components/form/input/InputField";
import MultiSelect from "../../../components/form/MultiSelect";
import { Modal } from "../../../components/ui/modal";
import { Career } from "../types";
import { useTheme } from "../../../context/ThemeContext";

interface CareerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (career: Omit<Career, "careerId" | "creationDate">) => void;
  editingCareer?: Career | null;
  internshipOptions: { value: string; text: string }[];
}

const careerSchema = z.object({
  careerName: z.string().min(1, "El nombre de la carrera es obligatorio"),
  careerCode: z.string().min(1, "El código es obligatorio"),
  minimumGrade: z.union([
    z.string().min(1, "La nota mínima es obligatoria").refine((val) => !isNaN(Number(val)), "Debe ser un número válido"),
    z.number()
  ]),
  careerAbbreviation: z.string().min(1, "La abreviatura es obligatoria"),
  internshipTypeIds: z.array(z.string()).optional().default([]),
});

type CareerFormData = z.infer<typeof careerSchema>;

export default function CareerModal({
  isOpen,
  onClose,
  onSave,
  editingCareer,
  internshipOptions,
}: CareerModalProps) {
  const { colorMode } = useTheme();
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitted },
  } = useForm<CareerFormData>({
    resolver: zodResolver(careerSchema),
    defaultValues: {
      careerName: "",
      careerCode: "",
      minimumGrade: "",
      careerAbbreviation: "",
      internshipTypeIds: [],
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (editingCareer) {
        reset({
          careerName: editingCareer.careerName,
          careerCode: editingCareer.careerCode,
          minimumGrade: editingCareer.minimumGrade,
          careerAbbreviation: editingCareer.careerAbbreviation,
          internshipTypeIds: (editingCareer.internshipTypeIds ?? []).map(String),
        });
      } else {
        reset({
          careerName: "",
          careerCode: "",
          minimumGrade: "",
          careerAbbreviation: "",
          internshipTypeIds: [],
        });
      }
    }
  }, [isOpen, editingCareer, reset]);

  const onSubmit = (data: CareerFormData) => {
    onSave({
      ...data,
      minimumGrade: Number(data.minimumGrade),
      status: editingCareer?.status ?? true,
    } as Omit<Career, "careerId" | "creationDate">);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className={`max-w-xl p-6 ${colorMode === 'dark' ? 'dark' : ''}`} showCloseButton>
      <div className="flex flex-col px-2 overflow-y-auto custom-scrollbar">
        <div>
          <h5 className="mb-2 font-semibold text-gray-800 modal-title text-theme-xl dark:text-white/90 lg:text-2xl">
            {editingCareer ? "Editar Carrera" : "Registrar Carrera"}
          </h5>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {editingCareer ? "Modifica los detalles de la carrera." : "Ingresa los detalles de la nueva carrera."}
          </p>
        </div>

        <form id="career-form" onSubmit={handleSubmit(onSubmit)} className="mt-8">
          <div className="rounded-2xl border border-gray-200 bg-white shadow-default dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="border-b border-gray-200 py-4 px-6.5 dark:border-gray-800">
              <h3 className="font-medium text-black dark:text-white">Detalles de la Carrera</h3>
            </div>
            <div className="p-6.5">
              <div className="space-y-4.5">
                <div className="grid grid-cols-1 gap-4.5 md:grid-cols-2">
                  <div>
                    <label className="mb-2.5 block text-black dark:text-white font-medium">Nombre de carrera</label>
                    <Input
                      {...register("careerName")}
                      type="text"
                      placeholder="Ingrese el nombre"
                      error={!!errors.careerName}
                      hint={isSubmitted ? errors.careerName?.message : undefined}
                    />
                  </div>
                  <div>
                    <label className="mb-2.5 block text-black dark:text-white font-medium">Código</label>
                    <Input
                      {...register("careerCode")}
                      type="text"
                      placeholder="Código"
                      error={!!errors.careerCode}
                      hint={isSubmitted ? errors.careerCode?.message : undefined}
                    />
                  </div>
                  <div>
                    <label className="mb-2.5 block text-black dark:text-white font-medium">Nota mínima</label>
                    <Input
                      {...register("minimumGrade")}
                      type="text"
                      placeholder="Nota mínima"
                      error={!!errors.minimumGrade}
                      hint={isSubmitted ? errors.minimumGrade?.message : undefined}
                    />
                  </div>
                  <div>
                    <label className="mb-2.5 block text-black dark:text-white font-medium">Abreviatura</label>
                    <Input
                      {...register("careerAbbreviation")}
                      type="text"
                      placeholder="Ej: TSU-ENF"
                      error={!!errors.careerAbbreviation}
                      hint={isSubmitted ? errors.careerAbbreviation?.message : undefined}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Controller
                      name="internshipTypeIds"
                      control={control}
                      render={({ field }) => (
                        <MultiSelect
                          label="Tipos de Prácticas"
                          options={internshipOptions}
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Seleccione los tipos"
                        />
                      )}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>

        <div className="flex justify-end gap-4.5 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="flex justify-center rounded border border-stroke py-2 px-6 font-medium text-black hover:shadow-1 dark:border-strokedark dark:text-white"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="career-form"
            className="flex justify-center items-center rounded-lg bg-brand-500 px-6 py-2.5 font-medium text-white hover:bg-brand-600 disabled:bg-brand-400 disabled:cursor-not-allowed"
          >
            {editingCareer ? "Actualizar" : "Guardar"}
          </button>
        </div>
      </div>
    </Modal>
  );
}