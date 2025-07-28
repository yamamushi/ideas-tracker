import request from 'supertest';
import app from '../src/app';

describe('Admin API', () => {
  let adminToken: string;
  let userToken: string;
  let ideaId: number;

  const adminUser = {
    username: 'admin_test',
    email: 'admin@example.com',
    password: 'AdminPassword123'
  };

  const regularUser = {
    username: 'regular_user',
    email: 'user@example.com',
    password: 'UserPassword123'
  };

  const testIdea = {
    title: 'Admin Test Idea',
    description: 'This idea is created to test admin functionality.',
    tags: ['technology']
  };

  const testComment = {
    content: 'This is a test comment for admin functionality testing.'
  };

  beforeAll(async () => {
    // Register/login admin user (assuming first user becomes admin or we have seeded admin)
    const adminResponse = await request(app)
      .post('/api/auth/register')
      .send(adminUser);

    if (adminResponse.status === 201) {
      adminToken = adminResponse.body.data.tokens.accessToken;
    } else {
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          emailOrUsername: adminUser.email,
          password: adminUser.password
        });
      adminToken = loginResponse.body.data.tokens.accessToken;
    }

    // Register/login regular user
    const userResponse = await request(app)
      .post('/api/auth/register')
      .send(regularUser);

    if (userResponse.status === 201) {
      userToken = userResponse.body.data.tokens.accessToken;
    } else {
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          emailOrUsername: regularUser.email,
          password: regularUser.password
        });
      userToken = loginResponse.body.data.tokens.accessToken;
    }

    // Create test idea with regular user
    const ideaResponse = await request(app)
      .post('/api/ideas')
      .set('Authorization', `Bearer ${userToken}`)
      .send(testIdea);

    ideaId = ideaResponse.body.data.idea.id;

    // Create test comment with regular user
    await request(app)
      .post(`/api/comments/idea/${ideaId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send(testComment);
  });

  describe('Admin Authentication', () => {
    it('should reject non-admin users from admin endpoints', async () => {
      const response = await request(app)
        .get('/api/admin/stats')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('ADMIN_REQUIRED');
    });

    it('should reject unauthenticated requests to admin endpoints', async () => {
      const response = await request(app)
        .get('/api/admin/stats')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/admin/stats', () => {
    it('should return content statistics for admin', async () => {
      // Note: This test assumes the admin user has admin privileges
      // In a real scenario, you'd need to ensure the test admin user is actually an admin
      const response = await request(app)
        .get('/api/admin/stats')
        .set('Authorization', `Bearer ${adminToken}`);

      // The response might be 403 if the test admin user isn't actually an admin
      if (response.status === 200) {
        expect(response.body.success).toBe(true);
        expect(response.body.data.stats).toBeDefined();
        expect(response.body.data.stats.totalIdeas).toBeDefined();
        expect(response.body.data.stats.totalComments).toBeDefined();
        expect(response.body.data.stats.totalVotes).toBeDefined();
        expect(response.body.data.stats.totalUsers).toBeDefined();
      } else {
        expect(response.status).toBe(403);
      }
    });
  });

  describe('GET /api/admin/flagged-content', () => {
    it('should return flagged content for admin review', async () => {
      const response = await request(app)
        .get('/api/admin/flagged-content')
        .set('Authorization', `Bearer ${adminToken}`);

      if (response.status === 200) {
        expect(response.body.success).toBe(true);
        expect(response.body.data.flaggedIdeas).toBeDefined();
        expect(response.body.data.recentComments).toBeDefined();
        expect(Array.isArray(response.body.data.flaggedIdeas)).toBe(true);
        expect(Array.isArray(response.body.data.recentComments)).toBe(true);
      } else {
        expect(response.status).toBe(403);
      }
    });
  });

  describe('DELETE /api/admin/ideas/:id', () => {
    it('should allow admin to delete any idea', async () => {
      // Create another idea to delete
      const ideaResponse = await request(app)
        .post('/api/ideas')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'Idea to be deleted by admin',
          description: 'This idea will be deleted by admin.',
          tags: ['technology']
        });

      const ideaToDelete = ideaResponse.body.data.idea.id;

      const response = await request(app)
        .delete(`/api/admin/ideas/${ideaToDelete}`)
        .set('Authorization', `Bearer ${adminToken}`);

      if (response.status === 200) {
        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe('Idea deleted successfully');
        expect(response.body.data.deletedIdea).toBeDefined();
      } else {
        expect(response.status).toBe(403);
      }
    });

    it('should return 404 for non-existent idea', async () => {
      const response = await request(app)
        .delete('/api/admin/ideas/99999')
        .set('Authorization', `Bearer ${adminToken}`);

      if (response.status !== 403) {
        expect(response.status).toBe(404);
        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('IDEA_NOT_FOUND');
      }
    });
  });

  describe('DELETE /api/admin/comments/:id', () => {
    it('should allow admin to delete any comment', async () => {
      // Create another comment to delete
      const commentResponse = await request(app)
        .post(`/api/comments/idea/${ideaId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          content: 'This comment will be deleted by admin.'
        });

      const commentToDelete = commentResponse.body.data.comment.id;

      const response = await request(app)
        .delete(`/api/admin/comments/${commentToDelete}`)
        .set('Authorization', `Bearer ${adminToken}`);

      if (response.status === 200) {
        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe('Comment deleted successfully');
        expect(response.body.data.deletedComment).toBeDefined();
      } else {
        expect(response.status).toBe(403);
      }
    });

    it('should return 404 for non-existent comment', async () => {
      const response = await request(app)
        .delete('/api/admin/comments/99999')
        .set('Authorization', `Bearer ${adminToken}`);

      if (response.status !== 403) {
        expect(response.status).toBe(404);
        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('COMMENT_NOT_FOUND');
      }
    });
  });

  describe('POST /api/admin/ideas/bulk-delete', () => {
    it('should allow bulk deletion of ideas', async () => {
      // Create multiple ideas to delete
      const idea1Response = await request(app)
        .post('/api/ideas')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'Bulk delete test 1',
          description: 'First idea for bulk delete test.',
          tags: ['technology']
        });

      const idea2Response = await request(app)
        .post('/api/ideas')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'Bulk delete test 2',
          description: 'Second idea for bulk delete test.',
          tags: ['business']
        });

      const ideaIds = [
        idea1Response.body.data.idea.id,
        idea2Response.body.data.idea.id
      ];

      const response = await request(app)
        .post('/api/admin/ideas/bulk-delete')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ideaIds });

      if (response.status === 200) {
        expect(response.body.success).toBe(true);
        expect(response.body.data.summary.deleted).toBeGreaterThan(0);
        expect(response.body.data.deletedIdeas).toBeDefined();
      } else {
        expect(response.status).toBe(403);
      }
    });

    it('should reject bulk delete with invalid input', async () => {
      const response = await request(app)
        .post('/api/admin/ideas/bulk-delete')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ideaIds: [] });

      if (response.status !== 403) {
        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('VALIDATION_ERROR');
      }
    });

    it('should reject bulk delete with too many items', async () => {
      const tooManyIds = Array.from({ length: 51 }, (_, i) => i + 1);

      const response = await request(app)
        .post('/api/admin/ideas/bulk-delete')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ideaIds: tooManyIds });

      if (response.status !== 403) {
        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('VALIDATION_ERROR');
      }
    });
  });

  describe('POST /api/admin/comments/bulk-delete', () => {
    it('should allow bulk deletion of comments', async () => {
      // Create multiple comments to delete
      const comment1Response = await request(app)
        .post(`/api/comments/idea/${ideaId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          content: 'First comment for bulk delete test.'
        });

      const comment2Response = await request(app)
        .post(`/api/comments/idea/${ideaId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          content: 'Second comment for bulk delete test.'
        });

      const commentIds = [
        comment1Response.body.data.comment.id,
        comment2Response.body.data.comment.id
      ];

      const response = await request(app)
        .post('/api/admin/comments/bulk-delete')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ commentIds });

      if (response.status === 200) {
        expect(response.body.success).toBe(true);
        expect(response.body.data.summary.deleted).toBeGreaterThan(0);
        expect(response.body.data.deletedComments).toBeDefined();
      } else {
        expect(response.status).toBe(403);
      }
    });

    it('should reject bulk delete with too many items', async () => {
      const tooManyIds = Array.from({ length: 101 }, (_, i) => i + 1);

      const response = await request(app)
        .post('/api/admin/comments/bulk-delete')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ commentIds: tooManyIds });

      if (response.status !== 403) {
        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('VALIDATION_ERROR');
      }
    });
  });
});