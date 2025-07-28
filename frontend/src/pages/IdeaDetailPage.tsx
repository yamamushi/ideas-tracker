import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { ArrowLeft, Edit, Trash2, User, Tag as TagIcon } from 'lucide-react';
import { Layout } from '../components/layout/Layout';
import { VoteButtons } from '../components/ideas/VoteButtons';
import { TagBadge } from '../components/ideas/TagBadge';
import { CommentsList } from '../components/comments/CommentsList';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorMessage } from '../components/common/ErrorMessage';
import { IdeaService } from '../services/ideaService';
import { AdminService } from '../services/adminService';
import { DeleteButton } from '../components/admin/DeleteButton';
import { Idea, VoteStats, Tag } from '../types/idea';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export function IdeaDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [idea, setIdea] = useState<Idea | null>(null);
  const [tags, setTags] = useState<{ [key: string]: Tag }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [voteStats, setVoteStats] = useState<VoteStats>({
    upvotes: 0,
    downvotes: 0,
    total: 0,
    userVote: null
  });

  const ideaId = id ? parseInt(id) : null;

  useEffect(() => {
    const loadData = async () => {
      if (!ideaId) {
        setError('Invalid idea ID');
        setLoading(false);
        return;
      }

      try {
        setError(null);
        
        // Load idea and tags in parallel
        const [ideaData, tagsData] = await Promise.all([
          IdeaService.getIdeaById(ideaId),
          IdeaService.getTags()
        ]);

        setIdea(ideaData);
        setVoteStats({
          upvotes: 0,
          downvotes: 0,
          total: ideaData.voteCount,
          userVote: null
        });

        // Convert tags array to object for easy lookup
        const tagsMap = tagsData.reduce((acc, tag) => {
          acc[tag.id] = tag;
          return acc;
        }, {} as { [key: string]: Tag });
        setTags(tagsMap);

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load idea');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [ideaId]);

  const handleVoteChange = (newStats: VoteStats) => {
    setVoteStats(newStats);
  };

  const handleEdit = () => {
    // TODO: Implement edit functionality
    toast.info('Edit functionality will be implemented in a future task');
  };

  const handleDelete = async () => {
    if (!idea || !window.confirm('Are you sure you want to delete this idea?')) {
      return;
    }

    try {
      await IdeaService.deleteIdea(idea.id);
      toast.success('Idea deleted successfully');
      navigate('/');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete idea');
    }
  };

  const handleAdminDelete = async () => {
    if (!idea) return;
    
    try {
      await AdminService.deleteIdea(idea.id);
      toast.success('Idea deleted successfully');
      navigate('/');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete idea');
      throw err; // Re-throw to let DeleteButton handle the loading state
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <LoadingSpinner />
        </div>
      </Layout>
    );
  }

  if (error || !idea) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <ErrorMessage message={error || 'Idea not found'} />
          <div className="mt-4">
            <Link
              to="/"
              className="inline-flex items-center text-primary-400 hover:text-primary-300"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Ideas
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  const isAuthor = user?.id === idea.authorId;
  const canEdit = isAuthor;
  const canDelete = isAuthor || user?.isAdmin;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Back Button */}
        <div className="mb-6">
          <Link
            to="/"
            className="inline-flex items-center text-primary-400 hover:text-primary-300 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Ideas
          </Link>
        </div>

        {/* Main Content */}
        <div className="card p-8 mb-8">
          <div className="flex gap-6">
            {/* Vote Buttons */}
            <VoteButtons
              ideaId={idea.id}
              initialStats={voteStats}
              onVoteChange={handleVoteChange}
              className="flex-shrink-0"
            />

            {/* Content */}
            <div className="flex-1 min-w-0">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1 min-w-0">
                  <h1 className="text-2xl font-bold text-white mb-3">
                    {idea.title}
                  </h1>
                  
                  <div className="flex items-center text-sm text-gray-400 space-x-2">
                    <Link
                      to={`/profile/${idea.authorId}`}
                      className="flex items-center hover:text-primary-400 transition-colors"
                    >
                      <User className="h-4 w-4 mr-1" />
                      {idea.author?.username || 'Unknown'}
                    </Link>
                    <span>•</span>
                    <time title={new Date(idea.createdAt).toLocaleString()}>
                      {formatDistanceToNow(new Date(idea.createdAt), { addSuffix: true })}
                    </time>
                    {idea.updatedAt !== idea.createdAt && (
                      <>
                        <span>•</span>
                        <span title={`Updated ${new Date(idea.updatedAt).toLocaleString()}`}>
                          edited
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                {(canEdit || canDelete || user?.isAdmin) && (
                  <div className="flex items-center space-x-2 ml-4">
                    {canEdit && (
                      <button
                        onClick={handleEdit}
                        className="p-2 text-gray-400 hover:text-primary-400 hover:bg-primary-400/10 rounded transition-colors"
                        title="Edit idea"
                      >
                        <Edit className="h-5 w-5" />
                      </button>
                    )}
                    {canDelete && (
                      <button
                        onClick={handleDelete}
                        className="p-2 text-gray-400 hover:text-error-400 hover:bg-error-400/10 rounded transition-colors"
                        title="Delete idea"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    )}
                    {/* Admin Delete Button */}
                    <DeleteButton
                      onDelete={handleAdminDelete}
                      itemType="idea"
                      itemTitle={idea.title}
                      size="lg"
                    />
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="text-gray-300 mb-6 whitespace-pre-wrap text-lg leading-relaxed">
                {idea.description}
              </div>

              {/* Tags */}
              {idea.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                  <TagIcon className="h-4 w-4 text-gray-400 mt-1" />
                  {idea.tags.map(tagId => {
                    const tag = tags[tagId];
                    if (!tag) return null;
                    
                    return (
                      <TagBadge
                        key={tagId}
                        tag={tag}
                      />
                    );
                  })}
                </div>
              )}

              {/* Stats */}
              <div className="flex items-center space-x-6 text-sm text-gray-400 border-t border-gray-700 pt-4">
                <span>{voteStats.upvotes} upvotes</span>
                <span>{voteStats.downvotes} downvotes</span>
                <span>{voteStats.total} total votes</span>
              </div>
            </div>
          </div>
        </div>

        {/* Comments Section */}
        <CommentsList ideaId={idea.id} />
      </div>
    </Layout>
  );
}