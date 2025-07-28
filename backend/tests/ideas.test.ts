import request from 'supertest';
import app from '../src/app';

describe('Ideas API', () => {
  let accessToken: string;
  let userId: number;
  let ideaId: number;

  const testUser = {
    username: 'ideauser2',
    email: 'ideas2@example.com',
    password: 'TestPassword123'
  };

  const testIdea = {
    title: 'Test Idea for API',
    description: 'This is a test idea to verify the API functionality works correctly.',
    tags: ['technology', 'product']
  };

  beforeAll(async () => {
    // Register and login user
    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send(testUser);

    if (registerResponse.status === 201) {
      accessToken = registerResponse.body.data.tokens.accessToken;
      userId = registerResponse.body.data.user.id;
    } else {
      // User might already exist, try login
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          emailOrUsername: testUser.email,
          password: testUser.password
        });
      
      accessToken = loginResponse.body.data.tokens.accessToken;
      userId = loginResponse.body.data.user.id;
    }
  });

  describe('GET /api/config/tags', () => {
    it('should return available tags', async () => {
      const response = await request(app)
        .get('/api/config/tags')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.tags).toBeDefined();
      expect(Array.isArray(response.body.data.tags)).toBe(true);
      expect(response.body.data.tags.length).toBeGreaterThan(0);
    });
  });

  describe('POST /api/ideas', () => {
    it('should create a new idea with valid data', async () => {
      const response = await request(app)
        .post('/api/ideas')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(testIdea)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.idea.title).toBe(testIdea.title);
      expect(response.body.data.idea.description).toBe(testIdea.description);
      expect(response.body.data.idea.tags).toEqual(testIdea.tags);
      expect(response.body.data.idea.authorId).toBe(userId);
      expect(response.body.data.idea.author).toBeDefined();

      ideaId = response.body.data.idea.id;
    });

    it('should reject idea creation without authentication', async () => {
      const response = await request(app)
        .post('/api/ideas')
        .send(testIdea)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('MISSING_TOKEN');
    });

    it('should reject idea with invalid tags', async () => {
      const response = await request(app)
        .post('/api/ideas')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          ...testIdea,
          tags: ['invalid-tag']
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject idea with short title', async () => {
      const response = await request(app)
        .post('/api/ideas')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          ...testIdea,
          title: 'Hi'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /api/ideas', () => {
    it('should return list of ideas', async () => {
      const response = await request(app)
        .get('/api/ideas')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.ideas).toBeDefined();
      expect(Array.isArray(response.body.data.ideas)).toBe(true);
      expect(response.body.data.total).toBeDefined();
      expect(response.body.data.page).toBe(1);
      expect(response.body.data.limit).toBeDefined();
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/ideas?page=1&limit=5')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.page).toBe(1);
      expect(response.body.data.limit).toBe(5);
      expect(response.body.data.ideas.length).toBeLessThanOrEqual(5);
    });

    it('should support sorting by votes', async () => {
      const response = await request(app)
        .get('/api/ideas?sortBy=votes&sortOrder=desc')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.ideas).toBeDefined();
    });

    it('should support tag filtering', async () => {
      const response = await request(app)
        .get('/api/ideas?tags=technology')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.ideas).toBeDefined();
    });

    it('should support search', async () => {
      const response = await request(app)
        .get('/api/ideas?search=test')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.ideas).toBeDefined();
    });
  });

  describe('GET /api/ideas/:id', () => {
    it('should return specific idea', async () => {
      const response = await request(app)
        .get(`/api/ideas/${ideaId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.idea.id).toBe(ideaId);
      expect(response.body.data.idea.title).toBe(testIdea.title);
      expect(response.body.data.idea.author).toBeDefined();
    });

    it('should return 404 for non-existent idea', async () => {
      const response = await request(app)
        .get('/api/ideas/99999')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('IDEA_NOT_FOUND');
    });
  });

  describe('GET /api/ideas/user/:userId', () => {
    it('should return ideas by specific user', async () => {
      const response = await request(app)
        .get(`/api/ideas/user/${userId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.ideas).toBeDefined();
      expect(Array.isArray(response.body.data.ideas)).toBe(true);
      
      // All ideas should be from the specified user
      response.body.data.ideas.forEach((idea: any) => {
        expect(idea.authorId).toBe(userId);
      });
    });
  });

  describe('PUT /api/ideas/:id', () => {
    it('should update idea by author', async () => {
      const updatedData = {
        title: 'Updated Test Idea',
        description: 'This idea has been updated to test the update functionality.'
      };

      const response = await request(app)
        .put(`/api/ideas/${ideaId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updatedData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.idea.title).toBe(updatedData.title);
      expect(response.body.data.idea.description).toBe(updatedData.description);
    });

    it('should reject update without authentication', async () => {
      const response = await request(app)
        .put(`/api/ideas/${ideaId}`)
        .send({ title: 'Unauthorized Update' })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/ideas/:id', () => {
    it('should delete idea by author', async () => {
      const response = await request(app)
        .delete(`/api/ideas/${ideaId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Idea deleted successfully');
    });

    it('should return 404 when trying to delete non-existent idea', async () => {
      const response = await request(app)
        .delete(`/api/ideas/${ideaId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('IDEA_NOT_FOUND');
    });
  });
});