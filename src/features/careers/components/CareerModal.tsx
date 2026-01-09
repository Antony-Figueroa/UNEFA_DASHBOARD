import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Input from "../../../components/form/input/InputField";
import MultiSelect from "../../../components/form/MultiSelect";
import { Modal, ModalHeader, ModalBody, ModalFooter } from "../../../components/ui/modal";
import { Career } from "../types";
import Button from "../../../components/ui/button/Button";

interface CareerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (career: Omit<Career, "careerId" | "creationDate">) => void;
  editingCareer?: Career | null;
  internshipOptions: { value: string; text: string }[];
  isLoading?: boolean;
}

const careerSchema = z.object({
  careerName: z.string().min(1, "El nombre de la carrera es obligatorio"),
  careerCode: z.string().min(1, "El código es obligatorio"),
  minimumGrade: z.union([
    z.string().min(1, "La nota mínima es obligatoria").refine((val) => !isNaN(Number(val)), "Debe ser un número válido"),
    z.number()
  ]),
  careerAbbreviation: z.string().min(1, "La abreviatura es obligatoria"),
  internshipTypeIds: z.array(z.string()),
});

type CareerFormData = z.infer<typeof careerSchema>;

export default function CareerModal({
  isOpen,
  onClose,
  onSave,
  editingCareer,
  internshipOptions,
  isLoading = false,
}: CareerModalProps) {
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
          minimumGrade: String(editingCareer.minimumGrade),
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
    } else {
      reset();
    }
  }, [editingCareer, isOpen, reset]);

  const onSubmit = (data: CareerFormData) => {
    onSave({
      careerName: data.careerName,
      careerCode: data.careerCode,
      careerAbbreviation: data.careerAbbreviation,
      internshipTypeIds: data.internshipTypeIds,
      minimumGrade: Number(data.minimumGrade),
      status: editingCareer?.status ?? true,
    } as Omit<Career, "careerId" | "creationDate">);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} showCloseButton>
      <ModalHeader>
        <div className="max-w-4xl mx-auto w-full">
          <h5 className="mb-1 font-semibold text-text-primary modal-title text-theme-xl dark:text-white/90 lg:text-2xl">
            {editingCareer ? "Editar Carrera" : "Registrar Carrera"}
          </h5>
          <p className="text-sm text-text-secondary dark:text-text-tertiary font-normal">
            {editingCareer ? "Modifica los detalles de la carrera académica." : "Ingresa los detalles de la nueva carrera académica."}
          </p>
        </div>
      </ModalHeader>

      <ModalBody className="bg-bg-secondary/30 dark:bg-bg-dark/50">
        <form id="career-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
            <div>
              <label className="mb-2.5 block text-black dark:text-white font-medium text-sm">Nombre de carrera *</label>
              <Input
                {...register("careerName")}
                type="text"
                placeholder="Ingrese el nombre"
                error={!!errors.careerName}
                hint={isSubmitted ? errors.careerName?.message : undefined}
              />
            </div>
            <div>
              <label className="mb-2.5 block text-black dark:text-white font-medium text-sm">Código *</label>
              <Input
                {...register("careerCode")}
                type="text"
                placeholder="Código"
                error={!!errors.careerCode}
                hint={isSubmitted ? errors.careerCode?.message : undefined}
              />
            </div>
            <div>
              <label className="mb-2.5 block text-black dark:text-white font-medium text-sm">Nota mínima *</label>
              <Input
                {...register("minimumGrade")}
                type="text"
                placeholder="Nota mínima"
                error={!!errors.minimumGrade}
                hint={isSubmitted ? errors.minimumGrade?.message : undefined}
              />
            </div>
            <div>
              <label className="mb-2.5 block text-black dark:text-white font-medium text-sm">Abreviatura *</label>
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
        </form>
      </ModalBody>

      <ModalFooter className="shrink-0 px-6 sm:px-12 py-6 bg-white dark:bg-bg-dark border-t border-border-light dark:border-border-dark">
        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 w-full max-w-4xl mx-auto">
          <Button variant="outline" onClick={onClose} disabled={isLoading} className="w-full sm:w-auto min-h-12">
            Cancelar
          </Button>
          <Button type="submit" form="career-form" loading={isLoading} className="w-full sm:w-auto min-h-12">
            {editingCareer ? "Actualizar Registro" : "Guardar Carrera"}
          </Button>
        </div>
      </ModalFooter>
    </Modal>
  );
}