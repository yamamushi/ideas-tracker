import React from 'react';
import { LoginForm } from '../components/auth/LoginForm';
import { Layout } from '../components/layout/Layout';

export function LoginPage() {
  return (
    <Layout>
      <div className="min-h-[calc(100vh-200px)] flex items-center justify-center">
        <LoginForm />
      </div>
    </Layout>
  );
}