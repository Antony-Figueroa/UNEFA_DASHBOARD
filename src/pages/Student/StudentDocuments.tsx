import { useState, useEffect, useRef } from 'react';
import ComponentCard from '../../components/common/ComponentCard';
import Button from '../../components/ui/button/Button';
import Badge from '../../components/ui/badge/Badge';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '../../components/ui/modal';
import documentsService, { Document, DocumentType } from '../../features/documents/services/documentsService';
import toast from 'react-hot-toast';
import { Upload, FileText, Trash2, AlertCircle, CheckCircle, Clock } from 'lucide-react';

export default function StudentDocuments() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [types, setTypes] = useState<DocumentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    documentType: '',
    title: '',
    description: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [docsData, typesData] = await Promise.all([
        documentsService.getAll(),
        documentsService.getTypes()
      ]);
      setDocuments(docsData);
      setTypes(typesData);
    } catch (err) {
      console.error('[Documents] Error:', err);
      toast.error('Error al cargar documentos');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('El archivo no puede exceder 10MB');
        return;
      }
      setSelectedFile(file);
      if (!formData.title) {
        setFormData(prev => ({ ...prev, title: file.name.replace(/\.[^/.]+$/, '') }));
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !formData.documentType || !formData.title) {
      toast.error('Complete todos los campos requeridos');
      return;
    }

    try {
      setUploading(true);
      await documentsService.upload({
        documentType: formData.documentType,
        title: formData.title,
        description: formData.description,
        file: selectedFile
      });
      toast.success('Documento subido exitosamente');
      setIsModalOpen(false);
      setSelectedFile(null);
      setFormData({ documentType: '', title: '', description: '' });
      fetchData();
    } catch (err) {
      console.error('[Documents] Error uploading:', err);
      toast.error('Error al subir documento');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Esta seguro de eliminar este documento?')) return;

    try {
      await documentsService.delete(id);
      toast.success('Documento eliminado');
      fetchData();
    } catch (err) {
      console.error('[Documents] Error deleting:', err);
      toast.error('Error al eliminar documento');
    }
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return '-';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-VE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-5 h-5 text-success-500" />;
      case 'rejected':
        return <AlertCircle className="w-5 h-5 text-error-500" />;
      default:
        return <Clock className="w-5 h-5 text-warning-500" />;
    }
  };

  const getTypeLabel = (value: string) => {
    return types.find(t => t.value === value)?.label || value;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button
          variant="primary"
          onClick={() => setIsModalOpen(true)}
        >
          <Upload className="w-4 h-4" />
          Subir Documento
        </Button>
      </div>

      <ComponentCard title="Documentos Subidos">
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse h-20 bg-gray-200 dark:bg-gray-700 rounded-lg" />
            ))}
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center py-8 text-text-secondary">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No has subido documentos</p>
            <p className="text-sm mt-1">Sube tu primera carta o informe</p>
          </div>
        ) : (
          <div className="space-y-3">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg"
              >
                <div className="p-3 bg-brand-100 dark:bg-brand-900/30 rounded-lg">
                  <FileText className="w-6 h-6 text-brand-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{doc.title}</p>
                    <Badge
                      color={doc.status === 'approved' ? 'success' : doc.status === 'rejected' ? 'error' : 'warning'}
                      size="sm"
                    >
                      {doc.status === 'approved' ? 'Aprobado' : doc.status === 'rejected' ? 'Rechazado' : 'Pendiente'}
                    </Badge>
                  </div>
                  <p className="text-sm text-text-secondary">
                    {getTypeLabel(doc.type)} - {doc.fileName}
                  </p>
                  <p className="text-xs text-text-secondary">
                    {formatDate(doc.uploadedAt)} - {formatFileSize(doc.fileSize)}
                  </p>
                  {doc.rejectionReason && (
                    <p className="text-xs text-error-500 mt-1">
                      Motivo: {doc.rejectionReason}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(doc.status)}
                  {doc.status === 'pending' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(doc.id)}
                      className="text-error-500 hover:text-error-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </ComponentCard>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} size="md">
        <ModalHeader>Subir Documento</ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Tipo de Documento *
              </label>
              <select
                value={formData.documentType}
                onChange={(e) => setFormData(prev => ({ ...prev, documentType: e.target.value }))}
                className="w-full px-4 py-2 border border-border-light dark:border-border-dark rounded-lg bg-white dark:bg-gray-800"
              >
                <option value="">Seleccionar...</option>
                {types.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Titulo *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-4 py-2 border border-border-light dark:border-border-dark rounded-lg bg-white dark:bg-gray-800"
                placeholder="Nombre del documento"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Descripcion
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-4 py-2 border border-border-light dark:border-border-dark rounded-lg bg-white dark:bg-gray-800"
                rows={2}
                placeholder="Descripcion opcional"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Archivo *
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                onChange={handleFileChange}
                className="w-full px-4 py-2 border border-border-light dark:border-border-dark rounded-lg bg-white dark:bg-gray-800"
              />
              <p className="text-xs text-text-secondary mt-1">
                PDF, Word, JPG o PNG (max 10MB)
              </p>
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="outline" onClick={() => setIsModalOpen(false)}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={handleUpload}
            disabled={uploading || !selectedFile || !formData.documentType || !formData.title}
            loading={uploading}
            loadingText="Subiendo..."
          >
            Subir
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
