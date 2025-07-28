import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateIdea } from '../../hooks/useIdeas';
import { IdeaService } from '../../services/ideaService';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { Tag } from '../../types/idea';
import { X, Plus, AlertCircle, Check } from 'lucide-react';
import clsx from 'clsx';

interface IdeaFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  className?: string;
}

export function IdeaForm({ onSuccess, onCancel, className }: IdeaFormProps) {
  const navigate = useNavigate();
  const createIdea = useCreateIdea();
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  
  // Auto-save draft
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  
  // UI state
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [isLoadingTags, setIsLoadingTags] = useState(true);
  const [tagSearchQuery, setTagSearchQuery] = useState('');
  const [showTagDropdown, setShowTagDropdown] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  
  // Validation state
  const [errors, setErrors] = useState<{
    title?: string;
    description?: string;
    tags?: string;
  }>({});
  const [touched, setTouched] = useState<{
    title?: boolean;
    description?: boolean;
    tags?: boolean;
  }>({});

  // Load available tags and restore draft
  useEffect(() => {
    const loadTags = async () => {
      try {
        const tags = await IdeaService.getTags();
        setAvailableTags(tags);
      } catch (error) {
        console.error('Failed to load tags:', error);
      } finally {
        setIsLoadingTags(false);
      }
    };

    // Restore draft from localStorage
    const restoreDraft = () => {
      try {
        const draft = localStorage.getItem('idea-form-draft');
        if (draft) {
          const parsed = JSON.parse(draft);
          if (parsed.title) setTitle(parsed.title);
          if (parsed.description) setDescription(parsed.description);
          if (parsed.selectedTags) setSelectedTags(parsed.selectedTags);
          if (parsed.timestamp) setLastSaved(new Date(parsed.timestamp));
        }
      } catch (error) {
        console.error('Failed to restore draft:', error);
      }
    };

    loadTags();
    restoreDraft();
  }, []);

  // Auto-save draft
  useEffect(() => {
    if (title || description || selectedTags.length > 0) {
      const timeoutId = setTimeout(() => {
        const draft = {
          title,
          description,
          selectedTags,
          timestamp: new Date().toISOString()
        };
        localStorage.setItem('idea-form-draft', JSON.stringify(draft));
        setLastSaved(new Date());
      }, 2000); // Save after 2 seconds of inactivity

      return () => clearTimeout(timeoutId);
    }
  }, [title, description, selectedTags]);

  // Real-time validation
  useEffect(() => {
    const newErrors: typeof errors = {};

    if (touched.title) {
      if (!title.trim()) {
        newErrors.title = 'Title is required';
      } else if (title.trim().length < 5) {
        newErrors.title = 'Title must be at least 5 characters long';
      } else if (title.trim().length > 200) {
        newErrors.title = 'Title must be less than 200 characters';
      }
    }

    if (touched.description) {
      if (!description.trim()) {
        newErrors.description = 'Description is required';
      } else if (description.trim().length < 10) {
        newErrors.description = 'Description must be at least 10 characters long';
      } else if (description.trim().length > 2000) {
        newErrors.description = 'Description must be less than 2000 characters';
      }
    }

    if (touched.tags) {
      if (selectedTags.length === 0) {
        newErrors.tags = 'At least one tag is required';
      } else if (selectedTags.length > 5) {
        newErrors.tags = 'Maximum 5 tags allowed';
      }
    }

    setErrors(newErrors);
  }, [title, description, selectedTags, touched]);

  // Filter tags based on search query
  const filteredTags = availableTags.filter(tag =>
    tag.name.toLowerCase().includes(tagSearchQuery.toLowerCase()) ||
    tag.id.toLowerCase().includes(tagSearchQuery.toLowerCase())
  );

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Mark all fields as touched for validation
    setTouched({ title: true, description: true, tags: true });
    
    // Validate all fields
    const titleError = !title.trim() ? 'Title is required' : 
                      title.trim().length < 5 ? 'Title must be at least 5 characters long' :
                      title.trim().length > 200 ? 'Title must be less than 200 characters' : undefined;
    
    const descriptionError = !description.trim() ? 'Description is required' :
                            description.trim().length < 10 ? 'Description must be at least 10 characters long' :
                            description.trim().length > 2000 ? 'Description must be less than 2000 characters' : undefined;
    
    const tagsError = selectedTags.length === 0 ? 'At least one tag is required' :
                     selectedTags.length > 5 ? 'Maximum 5 tags allowed' : undefined;

    if (titleError || descriptionError || tagsError) {
      setErrors({
        title: titleError,
        description: descriptionError,
        tags: tagsError
      });
      
      // Focus on first error field for better UX
      if (titleError) {
        document.getElementById('idea-title')?.focus();
      } else if (descriptionError) {
        document.getElementById('idea-description')?.focus();
      }
      
      return;
    }

    try {
      await createIdea.mutateAsync({
        title: title.trim(),
        description: description.trim(),
        tags: selectedTags
      });

      // Reset form
      setTitle('');
      setDescription('');
      setSelectedTags([]);
      setTouched({});
      setErrors({});
      setTagSearchQuery('');
      setShowTagDropdown(false);

      // Handle success
      if (onSuccess) {
        onSuccess();
      } else {
        navigate('/');
      }
    } catch (error) {
      // Error is handled by the mutation's onError callback
      console.error('Failed to create idea:', error);
    }
  };

  // Handle tag selection
  const handleTagSelect = (tagId: string) => {
    if (!selectedTags.includes(tagId)) {
      setSelectedTags([...selectedTags, tagId]);
      setTagSearchQuery('');
      setShowTagDropdown(false);
      setTouched(prev => ({ ...prev, tags: true }));
    }
  };

  // Handle keyboard navigation in tag search
  const handleTagSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setShowTagDropdown(false);
      setTagSearchQuery('');
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredTags.length > 0 && !selectedTags.includes(filteredTags[0].id)) {
        handleTagSelect(filteredTags[0].id);
      }
    }
  };

  // Handle tag removal
  const handleTagRemove = (tagId: string) => {
    setSelectedTags(selectedTags.filter(id => id !== tagId));
  };

  // Handle cancel
  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      navigate('/');
    }
  };

  const isSubmitting = createIdea.isPending;
  const hasErrors = Object.keys(errors).length > 0;
  const isFormValid = title.trim() && description.trim() && selectedTags.length > 0 && !hasErrors;

  return (
    <div className={clsx('max-w-2xl mx-auto', className)}>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">Share Your Idea</h1>
          <p className="text-gray-400">
            Help shape the future by sharing your innovative ideas with the community
          </p>
        </div>

        {/* Title Field */}
        <div>
          <label htmlFor="idea-title" className="block text-sm font-medium text-gray-300 mb-2">
            Title *
          </label>
          <input
            id="idea-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => setTouched(prev => ({ ...prev, title: true }))}
            placeholder="Enter a compelling title for your idea..."
            className={clsx(
              'w-full px-4 py-3 bg-dark-surface border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors',
              errors.title ? 'border-red-500' : 'border-dark-border focus:border-transparent'
            )}
            maxLength={200}
            disabled={isSubmitting}
          />
          <div className="flex justify-between items-center mt-1">
            {errors.title && (
              <div className="flex items-center text-red-400 text-sm">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.title}
              </div>
            )}
            <div className={clsx(
              "text-xs ml-auto",
              title.length > 180 ? 'text-yellow-400' : 
              title.length > 190 ? 'text-red-400' : 'text-gray-500'
            )}>
              {title.length}/200
            </div>
          </div>
        </div>

        {/* Description Field */}
        <div>
          <label htmlFor="idea-description" className="block text-sm font-medium text-gray-300 mb-2">
            Description *
          </label>
          <textarea
            id="idea-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={() => setTouched(prev => ({ ...prev, description: true }))}
            placeholder="Describe your idea in detail. What problem does it solve? How would it work?"
            rows={6}
            className={clsx(
              'w-full px-4 py-3 bg-dark-surface border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors resize-vertical',
              errors.description ? 'border-red-500' : 'border-dark-border focus:border-transparent'
            )}
            maxLength={2000}
            disabled={isSubmitting}
          />
          <div className="flex justify-between items-center mt-1">
            {errors.description && (
              <div className="flex items-center text-red-400 text-sm">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.description}
              </div>
            )}
            <div className={clsx(
              "text-xs ml-auto",
              description.length > 1800 ? 'text-yellow-400' : 
              description.length > 1900 ? 'text-red-400' : 'text-gray-500'
            )}>
              {description.length}/2000
            </div>
          </div>
        </div>

        {/* Tags Field */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Tags * ({selectedTags.length}/5)
          </label>
          
          {/* Selected Tags */}
          {selectedTags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {selectedTags.map(tagId => {
                const tag = availableTags.find(t => t.id === tagId);
                if (!tag) return null;
                
                return (
                  <div
                    key={tagId}
                    className="inline-flex items-center px-3 py-1 bg-primary-500 text-white text-sm rounded-full"
                  >
                    <span>{tag.name}</span>
                    <button
                      type="button"
                      onClick={() => handleTagRemove(tagId)}
                      className="ml-2 hover:bg-primary-600 rounded-full p-0.5 transition-colors"
                      disabled={isSubmitting}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Tag Selection */}
          <div className="relative">
            <div className="flex">
              <input
                type="text"
                value={tagSearchQuery}
                onChange={(e) => setTagSearchQuery(e.target.value)}
                onFocus={() => setShowTagDropdown(true)}
                onBlur={() => setTouched(prev => ({ ...prev, tags: true }))}
                onKeyDown={handleTagSearchKeyDown}
                placeholder="Search and select tags..."
                className={clsx(
                  'flex-1 px-4 py-3 bg-dark-surface border rounded-l-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors',
                  errors.tags ? 'border-red-500' : 'border-dark-border focus:border-transparent'
                )}
                disabled={isSubmitting || selectedTags.length >= 5}
                aria-describedby="tags-help"
              />
              <button
                type="button"
                onClick={() => setShowTagDropdown(!showTagDropdown)}
                className={clsx(
                  'px-4 py-3 bg-dark-surface border-t border-r border-b rounded-r-lg text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors',
                  errors.tags ? 'border-red-500' : 'border-dark-border'
                )}
                disabled={isSubmitting || selectedTags.length >= 5}
              >
                <Plus className="h-5 w-5" />
              </button>
            </div>

            {/* Tag Dropdown */}
            {showTagDropdown && !isLoadingTags && (
              <div className="absolute z-10 w-full mt-1 bg-dark-surface border border-dark-border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {filteredTags.length > 0 ? (
                  <div className="py-2">
                    {filteredTags.map(tag => (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => handleTagSelect(tag.id)}
                        disabled={selectedTags.includes(tag.id)}
                        className={clsx(
                          'w-full px-4 py-2 text-left hover:bg-dark-bg transition-colors',
                          selectedTags.includes(tag.id)
                            ? 'text-gray-500 cursor-not-allowed'
                            : 'text-gray-300 hover:text-white'
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span>{tag.name}</span>
                          {selectedTags.includes(tag.id) && (
                            <Check className="h-4 w-4 text-primary-500" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="px-4 py-3 text-gray-400 text-center">
                    {tagSearchQuery ? 'No tags found' : 'No tags available'}
                  </div>
                )}
              </div>
            )}

            {/* Loading tags */}
            {isLoadingTags && (
              <div className="absolute z-10 w-full mt-1 bg-dark-surface border border-dark-border rounded-lg shadow-lg">
                <div className="px-4 py-3 flex items-center justify-center text-gray-400">
                  <LoadingSpinner size="sm" className="mr-2" />
                  Loading tags...
                </div>
              </div>
            )}
          </div>

          {errors.tags && (
            <div className="flex items-center text-red-400 text-sm mt-1">
              <AlertCircle className="h-4 w-4 mr-1" />
              {errors.tags}
            </div>
          )}
          
          <div id="tags-help" className="text-xs text-gray-500 mt-1">
            Type to search tags, press Enter to select the first match, or click to select from dropdown
          </div>
        </div>

        {/* Preview Toggle */}
        {isFormValid && (
          <div className="pt-4">
            <button
              type="button"
              onClick={() => setShowPreview(!showPreview)}
              className="text-primary-400 hover:text-primary-300 text-sm font-medium transition-colors"
            >
              {showPreview ? 'Hide Preview' : 'Show Preview'}
            </button>
          </div>
        )}

        {/* Preview */}
        {showPreview && isFormValid && (
          <div className="bg-dark-bg border border-dark-border rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Preview</h3>
            <div className="space-y-4">
              <div>
                <h4 className="text-xl font-semibold text-white mb-2">{title}</h4>
                <p className="text-gray-300 whitespace-pre-wrap">{description}</p>
              </div>
              
              {selectedTags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedTags.map(tagId => {
                    const tag = availableTags.find(t => t.id === tagId);
                    if (!tag) return null;
                    
                    return (
                      <span
                        key={tagId}
                        className="inline-flex items-center px-3 py-1 bg-primary-500/20 text-primary-300 text-sm rounded-full border border-primary-500/30"
                      >
                        {tag.name}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Form Actions */}
        <div className="flex flex-col sm:flex-row gap-4 pt-6">
          <button
            type="submit"
            disabled={!isFormValid || isSubmitting}
            className="flex-1 flex items-center justify-center px-6 py-3 bg-primary-500 hover:bg-primary-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-dark-bg"
          >
            {isSubmitting ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Submitting...
              </>
            ) : (
              'Submit Idea'
            )}
          </button>
          
          <button
            type="button"
            onClick={handleCancel}
            disabled={isSubmitting}
            className="flex-1 sm:flex-none px-6 py-3 bg-dark-surface hover:bg-dark-border disabled:opacity-50 disabled:cursor-not-allowed text-gray-300 hover:text-white border border-dark-border rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-dark-bg"
          >
            Cancel
          </button>
        </div>
      </form>

      {/* Click outside to close dropdown */}
      {showTagDropdown && (
        <div
          className="fixed inset-0 z-5"
          onClick={() => setShowTagDropdown(false)}
        />
      )}
    </div>
  );
}