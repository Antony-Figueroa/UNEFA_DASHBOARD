/**
 * @file VisitRegistration.tsx
 * @description Página para el registro de visitas de seguimiento.
 */

import { useParams, useNavigate } from 'react-router';
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import PageMeta from "../../components/common/PageMeta";
import Button from "../../components/ui/button/Button";
import { ArrowLeftIcon } from "../../icons/actions";

export default function VisitRegistration() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    return (
        <>
            <PageMeta
                title="Registro de Visitas"
                description="Registro detallado de visitas de seguimiento"
            />
            <PageBreadcrumb pageTitle="Registro de Visitas" />

            <div className="mb-6">
                <Button 
                    variant="outline" 
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2"
                >
                    <ArrowLeftIcon className="w-5 h-5" />
                    Volver al Seguimiento
                </Button>
            </div>

            <ComponentCard title={`Registro de Visitas - Seguimiento #${id}`}>
                <div className="p-8 text-center border-2 border-dashed border-border-light dark:border-white/5 rounded-xl">
                    <p className="text-text-secondary dark:text-text-tertiary">
                        Módulo de Registro de Visitas para el seguimiento ID: <span className="font-mono font-bold text-brand-500">{id}</span>
                    </p>
                    <p className="mt-2 text-sm text-text-tertiary">
                        Esta es una vista de ejemplo para el registro de visitas.
                    </p>
                </div>
            </ComponentCard>
        </>
    );
}
