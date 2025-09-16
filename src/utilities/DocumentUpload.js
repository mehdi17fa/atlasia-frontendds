import React, { useState, useEffect, useCallback, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { DocumentUploadDebugger } from '../utils/documentUploadDebug';
import SectionTitle from '../components/shared/SectionTitle';

const REQUIRED_DOCUMENTS = [
  { id: 'kbis', name: 'KBIS (moins de 3 mois)', description: 'Extrait KBIS de votre auto-entreprise daté de moins de 3 mois', required: true },
  { id: 'identity', name: 'Pièce d\'identité', description: 'Carte nationale d\'identité, passeport ou permis de conduire', required: true },
  { id: 'address', name: 'Justificatif de domicile', description: 'Facture ou attestation récente', required: true },
  { id: 'insurance', name: 'Attestation d\'assurance', description: 'Attestation d\'assurance responsabilité civile professionnelle', required: true },
];

const ACCEPTED_FORMATS = ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export default function DocumentUpload() {
  const { token } = useContext(AuthContext);
  const [documents, setDocuments] = useState({});
  const [uploadProgress, setUploadProgress] = useState({});
  const [errors, setErrors] = useState({});
  const [dragOver, setDragOver] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  useEffect(() => {
    return () => {
      Object.values(documents).forEach(files => {
        files.forEach(doc => doc?.previewUrl && URL.revokeObjectURL(doc.previewUrl));
      });
    };
  }, [documents]);

  const validateFile = (file) => {
    const ext = file.name.split('.').pop().toLowerCase();
    if (!ACCEPTED_FORMATS.includes(ext)) return `Format non supporté: ${ACCEPTED_FORMATS.join(', ').toUpperCase()}`;
    if (file.size > MAX_FILE_SIZE) return 'Fichier trop volumineux. Max: 10MB';
    return null;
  };

  const handleFileSelect = useCallback((files, documentId) => {
    const newDocs = Array.from(files).map(file => {
      const error = validateFile(file);
      if (error) {
        setErrors(prev => ({ ...prev, [documentId]: error }));
        return null;
      }
      return {
        file,
        name: file.name,
        size: file.size,
        type: file.type,
        previewUrl: URL.createObjectURL(file),
      };
    }).filter(Boolean);

    if (newDocs.length === 0) return;

    setErrors(prev => ({ ...prev, [documentId]: null }));
    setDocuments(prev => ({
      ...prev,
      [documentId]: [...(prev[documentId] || []), ...newDocs],
    }));
  }, []);

  const handleDrop = useCallback((e, documentId) => {
    e.preventDefault();
    setDragOver(null);
    handleFileSelect(e.dataTransfer.files, documentId);
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e, documentId) => {
    e.preventDefault();
    setDragOver(documentId);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setDragOver(null);
  }, []);

  const removeDocument = (documentId, index) => {
    setDocuments(prev => {
      const newDocs = [...(prev[documentId] || [])];
      newDocs[index]?.previewUrl && URL.revokeObjectURL(newDocs[index].previewUrl);
      newDocs.splice(index, 1);
      return { ...prev, [documentId]: newDocs };
    });
    setErrors(prev => ({ ...prev, [documentId]: null }));
    setUploadProgress(prev => ({ ...prev, [documentId]: 0 }));
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const canSubmit = REQUIRED_DOCUMENTS.every(doc => documents[doc.id]?.length > 0);

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Run debug check first
      const debuggerInstance = new DocumentUploadDebugger();
      const debugInfo = await debuggerInstance.getDebugInfo();
      console.log("🔍 Debug info before upload:", debugInfo);

      const formData = new FormData();
      const documentTypes = [];

      // Add files and build documentTypes array in the same order
      REQUIRED_DOCUMENTS.forEach(reqDoc => {
        if (documents[reqDoc.id] && documents[reqDoc.id].length > 0) {
          documents[reqDoc.id].forEach(doc => {
            formData.append("files", doc.file);
            documentTypes.push(reqDoc.id);
          });
        }
      });

      // Backend expects documentTypes as an array - append each type individually
      documentTypes.forEach(type => {
        formData.append("documentTypes", type);
      });

      console.log("📤 Submitting with documentTypes:", documentTypes);
      console.log("📊 Files count:", documentTypes.length);
      console.log("📊 DocumentTypes count:", documentTypes.length);
      console.log("📋 FormData entries:");
      for (let pair of formData.entries()) {
        console.log(`  ${pair[0]}: ${pair[1].name || pair[1]}`);
      }
      
      // Validate that we have exactly 4 files and 4 document types
      if (documentTypes.length !== 4) {
        console.error("❌ Expected exactly 4 files and 4 document types, got:", documentTypes.length);
        throw new Error(`Expected exactly 4 documents, but got ${documentTypes.length}`);
      }
      
      // Validate that all required document types are present
      const requiredTypes = ['kbis', 'identity', 'address', 'insurance'];
      const missingTypes = requiredTypes.filter(type => !documentTypes.includes(type));
      if (missingTypes.length > 0) {
        console.error("❌ Missing required document types:", missingTypes);
        throw new Error(`Missing required document types: ${missingTypes.join(', ')}`);
      }

      // Use environment variable for API URL
      const API_BASE_URL = process.env.REACT_APP_API_URL ? `${process.env.REACT_APP_API_URL}/api` : 'http://localhost:4000/api';
      
      const response = await axios.post(
        `${API_BASE_URL}/documents/upload`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${token}`
          },
          onUploadProgress: progressEvent => {
            const percent = Math.floor((progressEvent.loaded / progressEvent.total) * 100);
            Object.keys(documents).forEach(docId =>
              setUploadProgress(prev => ({ ...prev, [docId]: percent }))
            );
          },
          timeout: 30000 // 30 second timeout
        }
      );

      console.log("✅ Upload successful:", response.data);
      setSubmitted(true);
    } catch (err) {
      console.error("❌ Submit error:", err);
      console.error("📥 Error response:", err.response?.data);
      console.error("📥 Error status:", err.response?.status);
      console.error("📥 Error headers:", err.response?.headers);
      
      let errorMessage = "Erreur lors de l'envoi des documents.";
      
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.code === 'ECONNABORTED') {
        errorMessage = "Timeout: Le serveur met trop de temps à répondre. Veuillez réessayer.";
      } else if (err.code === 'NETWORK_ERROR' || !err.response) {
        errorMessage = "Erreur de connexion: Impossible de joindre le serveur. Vérifiez votre connexion internet.";
      } else if (err.response?.status === 401) {
        errorMessage = "Session expirée. Veuillez vous reconnecter.";
      } else if (err.response?.status === 403) {
        errorMessage = "Accès refusé. Votre compte n'a pas les permissions nécessaires.";
      } else if (err.response?.status === 413) {
        errorMessage = "Fichiers trop volumineux. La taille totale ne doit pas dépasser 10MB.";
      } else if (err.response?.status >= 500) {
        errorMessage = "Erreur serveur. Veuillez réessayer plus tard.";
      }
      
      setSubmitError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => window.history.back();

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Documents envoyés !</h2>
          <p className="text-gray-600 mb-6">Vos documents ont été envoyés avec succès et sont en cours de vérification.</p>
          <button 
            onClick={() => window.location.href = '/dashboard'} 
            className="w-full bg-green-600 text-white py-3 px-4 rounded-xl font-medium hover:bg-green-700 transition-colors"
          >
            Continuer vers le tableau de bord
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto relative">
        <button 
          onClick={handleBack} 
          className="absolute top-0 left-0 p-2 bg-gray-800 text-white rounded-full hover:bg-gray-700 transition-colors" 
          title="Retour"
        >
          <div className="w-6 h-6 flex items-center justify-center">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </div>
        </button>
        
        <div className="text-center mb-8">
          <SectionTitle title="Vérification de votre compte" />
          <p className="text-gray-600 max-w-2xl mx-auto">
            Pour activer votre compte auto-entrepreneur, veuillez télécharger les documents suivants.
          </p>
        </div>

        {/* Debug Info */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
            <h4 className="font-semibold text-green-800 mb-2">Debug Info:</h4>
            {/* <p className="text-sm text-green-600">Token: {token ? 'Present' : 'Missing'}</p> */}
            <p className="text-sm text-green-600">Documents ready: {Object.keys(documents).length}/4</p>
            <p className="text-sm text-green-600">Can submit: {canSubmit ? 'Yes' : 'No'}</p>
          </div>
        )}

        {submitError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 font-medium">Erreur d'envoi:</p>
            <p className="text-red-600 text-sm">{submitError}</p>
          </div>
        )}

        <div className="space-y-6">
          {REQUIRED_DOCUMENTS.map(doc => {
            const docFiles = documents[doc.id] || [];
            const progress = uploadProgress[doc.id];
            const error = errors[doc.id];
            const isDragOver = dragOver === doc.id;

            return (
              <div key={doc.id} className="bg-white rounded-2xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{doc.name}</h3>
                    <p className="text-sm text-gray-600">{doc.description}</p>
                  </div>
                  {docFiles.length > 0 && (
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </div>

                <div
                  className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                    isDragOver 
                      ? 'border-green-500 bg-green-50' 
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  onDrop={e => handleDrop(e, doc.id)}
                  onDragOver={e => handleDragOver(e, doc.id)}
                  onDragLeave={handleDragLeave}
                >
                  <input 
                    type="file" 
                    multiple 
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" 
                    onChange={e => handleFileSelect(e.target.files, doc.id)} 
                    className="hidden" 
                    id={`file-${doc.id}`} 
                  />
                  <label 
                    htmlFor={`file-${doc.id}`} 
                    className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 cursor-pointer transition-colors"
                  >
                    Sélectionner un ou plusieurs fichiers
                  </label>
                  <p className="text-sm text-gray-500 mt-2">
                    Ou glisser-déposer ici • Formats: PDF, JPG, PNG, DOC • Max: 10MB
                  </p>
                </div>

                {docFiles.length > 0 && docFiles.map((document, index) => (
                  <div key={index} className="border rounded-xl p-4 mt-3">
                    <div className="flex items-center space-x-4">
                      <div>
                        {document.type?.startsWith('image/') ? (
                          <img 
                            src={document.previewUrl} 
                            alt="" 
                            className="w-12 h-12 object-cover rounded" 
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gray-200 flex items-center justify-center rounded text-gray-500 font-semibold">
                            DOC
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 truncate">{document.name}</p>
                        <p className="text-sm text-gray-500">{formatFileSize(document.size)}</p>
                      </div>
                      <button 
                        onClick={() => removeDocument(doc.id, index)} 
                        className="p-2 text-red-500 hover:text-red-700 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}

                {progress > 0 && progress < 100 && (
                  <div className="mt-3 w-full bg-gray-200 h-2 rounded-full">
                    <div 
                      className="bg-green-600 h-2 rounded-full transition-all" 
                      style={{ width: `${progress}%` }} 
                    />
                  </div>
                )}

                {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
              </div>
            );
          })}
        </div>

        <div className="mt-8 text-center">
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button 
              onClick={handleSubmit} 
              disabled={!canSubmit || isSubmitting} 
              className={`px-8 py-4 rounded-xl font-semibold text-lg transition-all ${
                canSubmit && !isSubmitting 
                  ? 'bg-green-600 text-white hover:bg-green-700 shadow-lg' 
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {isSubmitting ? 'Envoi en cours...' : 'Envoyer les documents'}
            </button>
            
            <button 
              onClick={async () => {
                const debuggerInstance = new DocumentUploadDebugger();
                const info = await debuggerInstance.getDebugInfo();
                console.log('🔍 Document Upload Debug Report:', info);
                alert(`Debug info logged to console. Check browser console for details.\n\nStatus: ${info.tests.upload.success ? 'SUCCESS' : 'FAILED'}\nError: ${info.tests.upload.error || 'None'}`);
              }}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition-colors"
            >
              🔍 Debug Upload
            </button>
          </div>
          
          {!canSubmit && (
            <p className="text-sm text-gray-500 mt-2">
              Veuillez ajouter au moins un fichier pour chaque type de document requis
            </p>
          )}
        </div>
      </div>
    </div>
  );
}