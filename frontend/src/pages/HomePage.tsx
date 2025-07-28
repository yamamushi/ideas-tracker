import React from 'react';
import { Layout } from '../components/layout/Layout';
import { IdeasList } from '../components/ideas/IdeasList';
import { ErrorBoundary } from '../components/common/ErrorBoundary';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { Plus, TrendingUp, Users, MessageCircle } from 'lucide-react';

export function HomePage() {
  const { isAuthenticated } = useAuth();

  return (
    <Layout>
      <div className="space-y-8">
        {/* Hero Section */}
        <div className="text-center py-8">
          <h1 className="text-4xl font-bold text-white mb-4">
            Welcome to Ideas Tracker
          </h1>
          <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
            A community-driven platform where great ideas come to life. 
            Share your thoughts, vote on others, and help shape the future together.
          </p>
          
          {isAuthenticated ? (
            <Link
              to="/submit"
              className="inline-flex items-center px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-lg transition-colors"
            >
              <Plus className="h-5 w-5 mr-2" />
              Submit Your Idea
            </Link>
          ) : (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/register"
                className="inline-flex items-center px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-lg transition-colors"
              >
                Get Started
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center px-6 py-3 bg-dark-surface hover:bg-dark-border text-white font-medium rounded-lg border border-dark-border transition-colors"
              >
                Sign In
              </Link>
            </div>
          )}
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-dark-surface rounded-lg p-6 text-center">
            <TrendingUp className="h-8 w-8 text-primary-500 mx-auto mb-2" />
            <h3 className="text-lg font-semibold text-white mb-1">Top Ideas</h3>
            <p className="text-gray-400 text-sm">Discover the most popular ideas</p>
          </div>
          
          <div className="bg-dark-surface rounded-lg p-6 text-center">
            <Users className="h-8 w-8 text-success-500 mx-auto mb-2" />
            <h3 className="text-lg font-semibold text-white mb-1">Community</h3>
            <p className="text-gray-400 text-sm">Join thousands of innovators</p>
          </div>
          
          <div className="bg-dark-surface rounded-lg p-6 text-center">
            <MessageCircle className="h-8 w-8 text-warning-500 mx-auto mb-2" />
            <h3 className="text-lg font-semibold text-white mb-1">Discussions</h3>
            <p className="text-gray-400 text-sm">Engage in meaningful conversations</p>
          </div>
        </div>

        {/* Ideas List */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Latest Ideas</h2>
            {isAuthenticated && (
              <Link
                to="/submit"
                className="inline-flex items-center px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-md transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                Submit Idea
              </Link>
            )}
          </div>

          <ErrorBoundary>
            <IdeasList />
          </ErrorBoundary>
        </div>
      </div>
    </Layout>
  );
}