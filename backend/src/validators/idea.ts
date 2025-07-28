import { body, query, param, ValidationChain } from 'express-validator';
import { validateTags } from '../utils/tags';

export const createIdeaValidation: ValidationChain[] = [
  body('title')
    .trim()
    .isLength({ min: 5, max: 255 })
    .withMessage('Title must be between 5 and 255 characters'),
  
  body('description')
    .trim()
    .isLength({ min: 10, max: 5000 })
    .withMessage('Description must be between 10 and 5000 characters'),
  
  body('tags')
    .isArray({ min: 0, max: 10 })
    .withMessage('Tags must be an array with maximum 10 items')
    .custom((tags: string[]) => {
      if (!Array.isArray(tags)) {
        throw new Error('Tags must be an array');
      }
      
      // Check if all tags are strings
      if (!tags.every(tag => typeof tag === 'string')) {
        throw new Error('All tags must be strings');
      }
      
      // Validate against available tags
      const validation = validateTags(tags);
      if (!validation.valid) {
        throw new Error(`Invalid tags: ${validation.invalidTags.join(', ')}`);
      }
      
      return true;
    })
];

export const updateIdeaValidation: ValidationChain[] = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Idea ID must be a positive integer'),
  
  body('title')
    .optional()
    .trim()
    .isLength({ min: 5, max: 255 })
    .withMessage('Title must be between 5 and 255 characters'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ min: 10, max: 5000 })
    .withMessage('Description must be between 10 and 5000 characters'),
  
  body('tags')
    .optional()
    .isArray({ min: 0, max: 10 })
    .withMessage('Tags must be an array with maximum 10 items')
    .custom((tags: string[]) => {
      if (!Array.isArray(tags)) {
        throw new Error('Tags must be an array');
      }
      
      if (!tags.every(tag => typeof tag === 'string')) {
        throw new Error('All tags must be strings');
      }
      
      const validation = validateTags(tags);
      if (!validation.valid) {
        throw new Error(`Invalid tags: ${validation.invalidTags.join(', ')}`);
      }
      
      return true;
    })
];

export const getIdeasValidation: ValidationChain[] = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  query('sortBy')
    .optional()
    .isIn(['votes', 'date', 'alphabetical'])
    .withMessage('Sort by must be one of: votes, date, alphabetical'),
  
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc'),
  
  query('tags')
    .optional()
    .custom((value) => {
      if (typeof value === 'string') {
        // Single tag
        const validation = validateTags([value]);
        if (!validation.valid) {
          throw new Error(`Invalid tag: ${value}`);
        }
      } else if (Array.isArray(value)) {
        // Multiple tags
        if (!value.every(tag => typeof tag === 'string')) {
          throw new Error('All tags must be strings');
        }
        const validation = validateTags(value);
        if (!validation.valid) {
          throw new Error(`Invalid tags: ${validation.invalidTags.join(', ')}`);
        }
      } else if (value !== undefined) {
        throw new Error('Tags must be a string or array of strings');
      }
      return true;
    }),
  
  query('search')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search query must be between 1 and 100 characters'),
  
  query('authorId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Author ID must be a positive integer')
];

export const ideaIdValidation: ValidationChain[] = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Idea ID must be a positive integer')
];

export const userIdValidation: ValidationChain[] = [
  param('userId')
    .isInt({ min: 1 })
    .withMessage('User ID must be a positive integer')
];