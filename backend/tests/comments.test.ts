import request from 'supertest';
import app from '../src/app';
import { createAuthenticatedUser, createTestIdea } from './testUtils';

describe('Comments API', () => {
  let accessToken: string;
  let accessToken2: string;
  let userId: number;
  let userId2: number;
  let ideaId: number;
  let commentId: number;

  const testComment = {
    content: 'This is a test comment to verify the commenting system works correctly.'
  };

  beforeAll(async () => {
    try {
      // Create first authenticated user
      const user1 = await createAuthenticatedUser();
      accessToken = user1.accessToken;
      userId = user1.userId;

      // Create second authenticated user
      const user2 = await createAuthenticatedUser();
      accessToken2 = user2.accessToken;
      userId2 = user2.userId;

      // Create a test idea using the first user
      const testIdeaResult = await createTestIdea(accessToken);
      ideaId = testIdeaResult.ideaId;
    } catch (error) {
      console.error('Failed to set up comments test:', error);
      throw error;
    }
  });

  describe('POST /api/comments/idea/:ideaId', () => {
    it('should create a new comment with valid data', async () => {
      const response = await request(app)
        .post(`/api/comments/idea/${ideaId}`)
        .set('Authorization', `Bearer ${accessToken2}`)
        .send(testComment)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.comment.content).toBe(testComment.content);
      expect(response.body.data.comment.authorId).toBe(userId2);
      expect(response.body.data.comment.ideaId).toBe(ideaId);
      expect(response.body.data.comment.author).toBeDefined();
      expect(response.body.data.comment.author.username).toBeDefined();

      commentId = response.body.data.comment.id;
    });

    it('should reject comment creation without authentication', async () => {
      const response = await request(app)
        .post(`/api/comments/idea/${ideaId}`)
        .send(testComment)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('MISSING_TOKEN');
    });

    it('should reject comment with empty content', async () => {
      const response = await request(app)
        .post(`/api/comments/idea/${ideaId}`)
        .set('Authorization', `Bearer ${accessToken2}`)
        .send({ content: '' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject comment with too long content', async () => {
      const longContent = 'a'.repeat(2001);
      const response = await request(app)
        .post(`/api/comments/idea/${ideaId}`)
        .set('Authorization', `Bearer ${accessToken2}`)
        .send({ content: longContent })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject comment on non-existent idea', async () => {
      const response = await request(app)
        .post('/api/comments/idea/99999')
        .set('Authorization', `Bearer ${accessToken2}`)
        .send(testComment)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('IDEA_NOT_FOUND');
    });
  });

  describe('GET /api/comments/idea/:ideaId', () => {
    it('should return comments for an idea', async () => {
      const response = await request(app)
        .get(`/api/comments/idea/${ideaId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.comments).toBeDefined();
      expect(Array.isArray(response.body.data.comments)).toBe(true);
      expect(response.body.data.total).toBeDefined();
      expect(response.body.data.page).toBe(1);
      expect(response.body.data.limit).toBeDefined();
      expect(response.body.data.comments.length).toBeGreaterThan(0);
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get(`/api/comments/idea/${ideaId}?page=1&limit=5`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.page).toBe(1);
      expect(response.body.data.limit).toBe(5);
      expect(response.body.data.comments.length).toBeLessThanOrEqual(5);
    });

    it('should return 404 for non-existent idea', async () => {
      const response = await request(app)
        .get('/api/comments/idea/99999')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('IDEA_NOT_FOUND');
    });
  });

  describe('GET /api/comments/:id', () => {
    it('should return specific comment', async () => {
      const response = await request(app)
        .get(`/api/comments/${commentId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.comment.id).toBe(commentId);
      expect(response.body.data.comment.content).toBe(testComment.content);
      expect(response.body.data.comment.author).toBeDefined();
    });

    it('should return 404 for non-existent comment', async () => {
      const response = await request(app)
        .get('/api/comments/99999')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('COMMENT_NOT_FOUND');
    });
  });

  describe('GET /api/comments/idea/:ideaId/count', () => {
    it('should return comment count for an idea', async () => {
      const response = await request(app)
        .get(`/api/comments/idea/${ideaId}/count`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.count).toBeDefined();
      expect(typeof response.body.data.count).toBe('number');
      expect(response.body.data.count).toBeGreaterThan(0);
    });

    it('should return 404 for non-existent idea', async () => {
      const response = await request(app)
        .get('/api/comments/idea/99999/count')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('IDEA_NOT_FOUND');
    });
  });

  describe('PUT /api/comments/:id', () => {
    it('should update comment by author', async () => {
      // Create a new comment for this test
      const createResponse = await request(app)
        .post(`/api/comments/idea/${ideaId}`)
        .set('Authorization', `Bearer ${accessToken2}`)
        .send(testComment);

      const updateCommentId = createResponse.body.data.comment.id;
      const updatedContent = 'This comment has been updated to test the update functionality.';

      const response = await request(app)
        .put(`/api/comments/${updateCommentId}`)
        .set('Authorization', `Bearer ${accessToken2}`)
        .send({ content: updatedContent })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.comment.content).toBe(updatedContent);
      expect(response.body.data.comment.id).toBe(updateCommentId);
    });

    it('should reject update without authentication', async () => {
      const response = await request(app)
        .put(`/api/comments/${commentId}`)
        .send({ content: 'Unauthorized update' })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should reject update by non-author', async () => {
      const response = await request(app)
        .put(`/api/comments/${commentId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ content: 'Unauthorized update' })
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('ACCESS_DENIED');
    });

    it('should reject update with invalid content', async () => {
      const response = await request(app)
        .put(`/api/comments/${commentId}`)
        .set('Authorization', `Bearer ${accessToken2}`)
        .send({ content: '' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /api/comments/user/me', () => {
    it('should return user comments', async () => {
      const response = await request(app)
        .get('/api/comments/user/me')
        .set('Authorization', `Bearer ${accessToken2}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.comments).toBeDefined();
      expect(Array.isArray(response.body.data.comments)).toBe(true);
      expect(response.body.data.total).toBeDefined();
      
      // All comments should be from the authenticated user
      response.body.data.comments.forEach((comment: any) => {
        expect(comment.authorId).toBe(userId2);
      });
    });

    it('should reject request without authentication', async () => {
      const response = await request(app)
        .get('/api/comments/user/me')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('MISSING_TOKEN');
    });
  });

  describe('GET /api/comments/recent', () => {
    it('should return recent comments', async () => {
      const response = await request(app)
        .get('/api/comments/recent')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.comments).toBeDefined();
      expect(Array.isArray(response.body.data.comments)).toBe(true);
    });

    it('should support limit parameter', async () => {
      const response = await request(app)
        .get('/api/comments/recent?limit=5')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.comments.length).toBeLessThanOrEqual(5);
    });
  });

  describe('DELETE /api/comments/:id', () => {
    it('should delete comment by author', async () => {
      const response = await request(app)
        .delete(`/api/comments/${commentId}`)
        .set('Authorization', `Bearer ${accessToken2}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Comment deleted successfully');
    });

    it('should return 404 when trying to delete non-existent comment', async () => {
      const response = await request(app)
        .delete(`/api/comments/${commentId}`)
        .set('Authorization', `Bearer ${accessToken2}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('COMMENT_NOT_FOUND');
    });

    it('should reject deletion without authentication', async () => {
      // Create another comment first
      const commentResponse = await request(app)
        .post(`/api/comments/idea/${ideaId}`)
        .set('Authorization', `Bearer ${accessToken2}`)
        .send(testComment);

      const newCommentId = commentResponse.body.data.comment.id;

      const response = await request(app)
        .delete(`/api/comments/${newCommentId}`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });
});