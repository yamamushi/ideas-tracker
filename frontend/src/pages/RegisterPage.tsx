import React from 'react';
import { RegisterForm } from '../components/auth/RegisterForm';
import { Layout } from '../components/layout/Layout';

export function RegisterPage() {
  return (
    <Layout>
      <div className="min-h-[calc(100vh-200px)] flex items-center justify-center">
        <RegisterForm />
      </div>
    </Layout>
  );
}