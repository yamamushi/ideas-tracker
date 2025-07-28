import { body, param, ValidationChain } from 'express-validator';

export const voteValidation: ValidationChain[] = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Idea ID must be a positive integer'),
  
  body('voteType')
    .isIn(['upvote', 'downvote'])
    .withMessage('Vote type must be either "upvote" or "downvote"')
];

export const removeVoteValidation: ValidationChain[] = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Idea ID must be a positive integer')
];

export const getVoteStatsValidation: ValidationChain[] = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Idea ID must be a positive integer')
];