import React from 'react';
import ComponentCard from '../../../../../components/common/ComponentCard';
import Button from '../../../../../components/ui/button/Button';

interface MissionVisionFormData {
  missionTitle: string;
  missionText: string;
  visionTitle: string;
  visionText: string;
}

interface MissionVisionEditorProps {
  missionVision: MissionVisionFormData;
  onChange: (field: keyof MissionVisionFormData, value: string) => void;
  onSave: () => void;
  saving: boolean;
}

const MissionVisionEditor: React.FC<MissionVisionEditorProps> = ({ missionVision, onChange, onSave, saving }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <ComponentCard title="Misión" className="mb-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-emphasis mb-1">Título</label>
            <input
              type="text"
              value={missionVision.missionTitle}
              onChange={(e) => onChange('missionTitle', e.target.value)}
              className="w-full px-4 py-2 border border-border-light dark:border-border-dark rounded-lg bg-white dark:bg-gray-800 text-text-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-emphasis mb-1">Descripción</label>
            <textarea
              value={missionVision.missionText}
              onChange={(e) => onChange('missionText', e.target.value)}
              rows={6}
              className="w-full px-4 py-2 border border-border-light dark:border-border-dark rounded-lg bg-white dark:bg-gray-800 text-text-primary"
            />
          </div>
        </div>
      </ComponentCard>

      <ComponentCard title="Visión" className="mb-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-emphasis mb-1">Título</label>
            <input
              type="text"
              value={missionVision.visionTitle}
              onChange={(e) => onChange('visionTitle', e.target.value)}
              className="w-full px-4 py-2 border border-border-light dark:border-border-dark rounded-lg bg-white dark:bg-gray-800 text-text-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-emphasis mb-1">Descripción</label>
            <textarea
              value={missionVision.visionText}
              onChange={(e) => onChange('visionText', e.target.value)}
              rows={6}
              className="w-full px-4 py-2 border border-border-light dark:border-border-dark rounded-lg bg-white dark:bg-gray-800 text-text-primary"
            />
          </div>
        </div>
      </ComponentCard>

      <div className="md:col-span-2 flex justify-end">
        <Button
          variant="primary"
          onClick={onSave}
          disabled={saving}
          loading={saving}
          loadingText="Guardando..."
        >
          Guardar Misión/Visión
        </Button>
      </div>
    </div>
  );
};

export default MissionVisionEditor;
