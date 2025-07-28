import { body, param, query, ValidationChain } from 'express-validator';

export const createCommentValidation: ValidationChain[] = [
  param('ideaId')
    .isInt({ min: 1 })
    .withMessage('Idea ID must be a positive integer'),
  
  body('content')
    .trim()
    .isLength({ min: 1, max: 2000 })
    .withMessage('Comment content must be between 1 and 2000 characters')
    .notEmpty()
    .withMessage('Comment content is required')
];

export const updateCommentValidation: ValidationChain[] = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Comment ID must be a positive integer'),
  
  body('content')
    .trim()
    .isLength({ min: 1, max: 2000 })
    .withMessage('Comment content must be between 1 and 2000 characters')
    .notEmpty()
    .withMessage('Comment content is required')
];

export const getCommentsValidation: ValidationChain[] = [
  param('ideaId')
    .isInt({ min: 1 })
    .withMessage('Idea ID must be a positive integer'),
  
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
];

export const commentIdValidation: ValidationChain[] = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Comment ID must be a positive integer')
];

export const getUserCommentsValidation: ValidationChain[] = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
];