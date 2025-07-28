import { body, param, ValidationChain } from 'express-validator';

export const deleteIdeaValidation: ValidationChain[] = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Idea ID must be a positive integer')
];

export const deleteCommentValidation: ValidationChain[] = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Comment ID must be a positive integer')
];

export const bulkDeleteIdeasValidation: ValidationChain[] = [
  body('ideaIds')
    .isArray({ min: 1, max: 50 })
    .withMessage('Idea IDs must be an array with 1-50 items')
    .custom((ideaIds: any[]) => {
      if (!ideaIds.every(id => Number.isInteger(Number(id)) && Number(id) > 0)) {
        throw new Error('All idea IDs must be positive integers');
      }
      return true;
    })
];

export const bulkDeleteCommentsValidation: ValidationChain[] = [
  body('commentIds')
    .isArray({ min: 1, max: 100 })
    .withMessage('Comment IDs must be an array with 1-100 items')
    .custom((commentIds: any[]) => {
      if (!commentIds.every(id => Number.isInteger(Number(id)) && Number(id) > 0)) {
        throw new Error('All comment IDs must be positive integers');
      }
      return true;
    })
];