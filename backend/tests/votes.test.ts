import request from 'supertest';
import app from '../src/app';

describe('Votes API', () => {
  let accessToken1: string;
  let accessToken2: string;
  let userId2: number;
  let ideaId: number;

  const testUser1 = {
    username: 'voter1',
    email: 'voter1@example.com',
    password: 'TestPassword123'
  };

  const testUser2 = {
    username: 'voter2',
    email: 'voter2@example.com',
    password: 'TestPassword123'
  };

  const testIdea = {
    title: 'Voting Test Idea',
    description: 'This idea is created to test the voting functionality.',
    tags: ['technology']
  };

  beforeAll(async () => {
    // Register/login first user
    const registerResponse1 = await request(app)
      .post('/api/auth/register')
      .send(testUser1);

    if (registerResponse1.status === 201) {
      accessToken1 = registerResponse1.body.data.tokens.accessToken;
    } else {
      const loginResponse1 = await request(app)
        .post('/api/auth/login')
        .send({
          emailOrUsername: testUser1.email,
          password: testUser1.password
        });
      accessToken1 = loginResponse1.body.data.tokens.accessToken;
    }

    // Register/login second user
    const registerResponse2 = await request(app)
      .post('/api/auth/register')
      .send(testUser2);

    if (registerResponse2.status === 201) {
      accessToken2 = registerResponse2.body.data.tokens.accessToken;
      userId2 = registerResponse2.body.data.user.id;
    } else {
      const loginResponse2 = await request(app)
        .post('/api/auth/login')
        .send({
          emailOrUsername: testUser2.email,
          password: testUser2.password
        });
      accessToken2 = loginResponse2.body.data.tokens.accessToken;
      userId2 = loginResponse2.body.data.user.id;
    }

    // Create test idea with first user
    const ideaResponse = await request(app)
      .post('/api/ideas')
      .set('Authorization', `Bearer ${accessToken1}`)
      .send(testIdea);

    ideaId = ideaResponse.body.data.idea.id;
  });

  describe('POST /api/votes/:id', () => {
    it('should allow user to upvote an idea', async () => {
      const response = await request(app)
        .post(`/api/votes/${ideaId}`)
        .set('Authorization', `Bearer ${accessToken2}`)
        .send({ voteType: 'upvote' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.vote.voteType).toBe('upvote');
      expect(response.body.data.vote.userId).toBe(userId2);
      expect(response.body.data.vote.ideaId).toBe(ideaId);
      expect(response.body.data.stats.upvotes).toBe(1);
      expect(response.body.data.stats.downvotes).toBe(0);
      expect(response.body.data.stats.total).toBe(1);
      expect(response.body.data.stats.userVote).toBe('upvote');
    });

    it('should allow user to downvote an idea', async () => {
      // First remove the upvote
      await request(app)
        .delete(`/api/votes/${ideaId}`)
        .set('Authorization', `Bearer ${accessToken2}`);

      const response = await request(app)
        .post(`/api/votes/${ideaId}`)
        .set('Authorization', `Bearer ${accessToken2}`)
        .send({ voteType: 'downvote' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.vote.voteType).toBe('downvote');
      expect(response.body.data.stats.upvotes).toBe(0);
      expect(response.body.data.stats.downvotes).toBe(1);
      expect(response.body.data.stats.total).toBe(-1);
      expect(response.body.data.stats.userVote).toBe('downvote');
    });

    it('should update existing vote when user votes again', async () => {
      const response = await request(app)
        .post(`/api/votes/${ideaId}`)
        .set('Authorization', `Bearer ${accessToken2}`)
        .send({ voteType: 'upvote' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.vote.voteType).toBe('upvote');
      expect(response.body.data.stats.upvotes).toBe(1);
      expect(response.body.data.stats.downvotes).toBe(0);
      expect(response.body.data.stats.total).toBe(1);
      expect(response.body.data.stats.userVote).toBe('upvote');
    });

    it('should reject voting without authentication', async () => {
      const response = await request(app)
        .post(`/api/votes/${ideaId}`)
        .send({ voteType: 'upvote' })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('MISSING_TOKEN');
    });

    it('should reject voting on own idea', async () => {
      const response = await request(app)
        .post(`/api/votes/${ideaId}`)
        .set('Authorization', `Bearer ${accessToken1}`)
        .send({ voteType: 'upvote' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('CANNOT_VOTE_OWN_IDEA');
    });

    it('should reject invalid vote type', async () => {
      const response = await request(app)
        .post(`/api/votes/${ideaId}`)
        .set('Authorization', `Bearer ${accessToken2}`)
        .send({ voteType: 'invalid' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject voting on non-existent idea', async () => {
      const response = await request(app)
        .post('/api/votes/99999')
        .set('Authorization', `Bearer ${accessToken2}`)
        .send({ voteType: 'upvote' })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('IDEA_NOT_FOUND');
    });
  });

  describe('GET /api/votes/stats/:id', () => {
    it('should return vote stats for authenticated user', async () => {
      const response = await request(app)
        .get(`/api/votes/stats/${ideaId}`)
        .set('Authorization', `Bearer ${accessToken2}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.stats.upvotes).toBeDefined();
      expect(response.body.data.stats.downvotes).toBeDefined();
      expect(response.body.data.stats.total).toBeDefined();
      expect(response.body.data.stats.userVote).toBeDefined();
    });

    it('should return vote stats for unauthenticated user', async () => {
      const response = await request(app)
        .get(`/api/votes/stats/${ideaId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.stats.upvotes).toBeDefined();
      expect(response.body.data.stats.downvotes).toBeDefined();
      expect(response.body.data.stats.total).toBeDefined();
      expect(response.body.data.stats.userVote).toBeUndefined();
    });

    it('should return 404 for non-existent idea', async () => {
      const response = await request(app)
        .get('/api/votes/stats/99999')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('IDEA_NOT_FOUND');
    });
  });

  describe('PATCH /api/votes/:id/switch', () => {
    it('should switch vote from upvote to downvote', async () => {
      const response = await request(app)
        .patch(`/api/votes/${ideaId}/switch`)
        .set('Authorization', `Bearer ${accessToken2}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.vote.voteType).toBe('downvote');
      expect(response.body.data.stats.userVote).toBe('downvote');
    });

    it('should switch vote from downvote to upvote', async () => {
      const response = await request(app)
        .patch(`/api/votes/${ideaId}/switch`)
        .set('Authorization', `Bearer ${accessToken2}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.vote.voteType).toBe('upvote');
      expect(response.body.data.stats.userVote).toBe('upvote');
    });

    it('should reject switch when no existing vote', async () => {
      // Remove vote first
      await request(app)
        .delete(`/api/votes/${ideaId}`)
        .set('Authorization', `Bearer ${accessToken2}`);

      const response = await request(app)
        .patch(`/api/votes/${ideaId}/switch`)
        .set('Authorization', `Bearer ${accessToken2}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NO_VOTE_TO_SWITCH');
    });
  });

  describe('DELETE /api/votes/:id', () => {
    beforeEach(async () => {
      // Ensure there's a vote to delete
      await request(app)
        .post(`/api/votes/${ideaId}`)
        .set('Authorization', `Bearer ${accessToken2}`)
        .send({ voteType: 'upvote' });
    });

    it('should remove user vote', async () => {
      const response = await request(app)
        .delete(`/api/votes/${ideaId}`)
        .set('Authorization', `Bearer ${accessToken2}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.stats.userVote).toBeNull();
    });

    it('should reject removal when no vote exists', async () => {
      // Remove vote first
      await request(app)
        .delete(`/api/votes/${ideaId}`)
        .set('Authorization', `Bearer ${accessToken2}`);

      const response = await request(app)
        .delete(`/api/votes/${ideaId}`)
        .set('Authorization', `Bearer ${accessToken2}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NO_VOTE_FOUND');
    });
  });

  describe('GET /api/votes/user/me', () => {
    it('should return user votes', async () => {
      // Cast a vote first
      await request(app)
        .post(`/api/votes/${ideaId}`)
        .set('Authorization', `Bearer ${accessToken2}`)
        .send({ voteType: 'upvote' });

      const response = await request(app)
        .get('/api/votes/user/me')
        .set('Authorization', `Bearer ${accessToken2}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.votes).toBeDefined();
      expect(Array.isArray(response.body.data.votes)).toBe(true);
    });

    it('should reject request without authentication', async () => {
      const response = await request(app)
        .get('/api/votes/user/me')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('MISSING_TOKEN');
    });
  });

  describe('GET /api/votes/top', () => {
    it('should return top voted ideas', async () => {
      const response = await request(app)
        .get('/api/votes/top')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.topIdeas).toBeDefined();
      expect(Array.isArray(response.body.data.topIdeas)).toBe(true);
    });

    it('should support limit parameter', async () => {
      const response = await request(app)
        .get('/api/votes/top?limit=5')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.topIdeas.length).toBeLessThanOrEqual(5);
    });
  });
});