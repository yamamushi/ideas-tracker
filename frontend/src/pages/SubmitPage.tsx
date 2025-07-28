import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { IdeaForm } from '../components/ideas/IdeaForm';
import { ProtectedRoute } from '../components/auth/ProtectedRoute';
import { ArrowLeft } from 'lucide-react';

export function SubmitPage() {
  const navigate = useNavigate();

  const handleSuccess = () => {
    // Navigate back to home page after successful submission
    navigate('/', { replace: true });
  };

  const handleCancel = () => {
    // Navigate back to previous page or home
    navigate(-1);
  };

  return (
    <ProtectedRoute>
      <Layout>
        <div className="max-w-4xl mx-auto">
          {/* Back Button */}
          <div className="mb-6">
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back
            </button>
          </div>

          {/* Form */}
          <IdeaForm 
            onSuccess={handleSuccess}
            onCancel={handleCancel}
            className="bg-dark-surface rounded-lg p-8"
          />
        </div>
      </Layout>
    </ProtectedRoute>
  );
}