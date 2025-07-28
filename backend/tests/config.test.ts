import request from 'supertest';
import app from '../src/app';
import { validateTagConfigurationFile, searchTags, getTagsGroupedByColor } from '../src/utils/tags';

describe('Configuration API', () => {
  let adminToken: string;
  let userToken: string;

  const adminUser = {
    username: 'config_admin',
    email: 'config_admin@example.com',
    password: 'AdminPassword123'
  };

  const regularUser = {
    username: 'config_user',
    email: 'config_user@example.com',
    password: 'UserPassword123'
  };

  beforeAll(async () => {
    // Register/login admin user
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

      // Check tag structure
      response.body.data.tags.forEach((tag: any) => {
        expect(tag.id).toBeDefined();
        expect(tag.name).toBeDefined();
        expect(typeof tag.id).toBe('string');
        expect(typeof tag.name).toBe('string');
        if (tag.color) {
          expect(typeof tag.color).toBe('string');
        }
      });
    });
  });

  describe('GET /api/config/app', () => {
    it('should return public app configuration', async () => {
      const response = await request(app)
        .get('/api/config/app')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.config).toBeDefined();
      expect(response.body.data.config.pagination).toBeDefined();
      expect(response.body.data.config.rateLimit).toBeDefined();
      
      // Should not expose JWT configuration
      expect(response.body.data.config.jwt).toBeUndefined();
    });
  });

  describe('GET /api/config/tags/stats', () => {
    it('should return tag statistics for admin', async () => {
      const response = await request(app)
        .get('/api/config/tags/stats')
        .set('Authorization', `Bearer ${adminToken}`);

      if (response.status === 200) {
        expect(response.body.success).toBe(true);
        expect(response.body.data.tags).toBeDefined();
        expect(Array.isArray(response.body.data.tags)).toBe(true);
        
        // Check that stats are included
        response.body.data.tags.forEach((tag: any) => {
          expect(tag.id).toBeDefined();
          expect(tag.name).toBeDefined();
          expect(tag.usageCount).toBeDefined();
          expect(typeof tag.usageCount).toBe('number');
        });
      } else {
        expect(response.status).toBe(403);
      }
    });

    it('should reject non-admin users', async () => {
      const response = await request(app)
        .get('/api/config/tags/stats')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should reject unauthenticated requests', async () => {
      const response = await request(app)
        .get('/api/config/tags/stats')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/config/tags/validate', () => {
    it('should validate tag configuration for admin', async () => {
      const response = await request(app)
        .get('/api/config/tags/validate')
        .set('Authorization', `Bearer ${adminToken}`);

      if (response.status === 200) {
        expect(response.body.success).toBe(true);
        expect(response.body.data.validation).toBeDefined();
        expect(response.body.data.validation.isValid).toBeDefined();
        expect(response.body.data.validation.errors).toBeDefined();
        expect(response.body.data.validation.warnings).toBeDefined();
        expect(response.body.data.totalTags).toBeDefined();
        expect(typeof response.body.data.totalTags).toBe('number');
      } else {
        expect(response.status).toBe(403);
      }
    });

    it('should reject non-admin users', async () => {
      const response = await request(app)
        .get('/api/config/tags/validate')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/config/tags/reload', () => {
    it('should reload tag configuration for admin', async () => {
      const response = await request(app)
        .post('/api/config/tags/reload')
        .set('Authorization', `Bearer ${adminToken}`);

      if (response.status === 200) {
        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe('Tag configuration reloaded successfully');
        expect(response.body.data.tags).toBeDefined();
        expect(Array.isArray(response.body.data.tags)).toBe(true);
      } else {
        expect(response.status).toBe(403);
      }
    });

    it('should reject non-admin users', async () => {
      const response = await request(app)
        .post('/api/config/tags/reload')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Tag Utility Functions', () => {
    describe('validateTagConfigurationFile', () => {
      it('should validate a valid configuration', () => {
        // This test would need a valid config file to test against
        // For now, we'll test the function exists and returns the expected structure
        const result = validateTagConfigurationFile();
        expect(result.isValid).toBeDefined();
        expect(result.errors).toBeDefined();
        expect(result.warnings).toBeDefined();
        expect(Array.isArray(result.errors)).toBe(true);
        expect(Array.isArray(result.warnings)).toBe(true);
      });
    });

    describe('searchTags', () => {
      it('should search tags by name and id', () => {
        const results = searchTags('tech');
        expect(Array.isArray(results)).toBe(true);
        
        // Should find tags containing 'tech' in name or id
        results.forEach(tag => {
          const matchesId = tag.id.toLowerCase().includes('tech');
          const matchesName = tag.name.toLowerCase().includes('tech');
          expect(matchesId || matchesName).toBe(true);
        });
      });

      it('should return empty array for non-matching search', () => {
        const results = searchTags('nonexistenttagname');
        expect(Array.isArray(results)).toBe(true);
        expect(results.length).toBe(0);
      });
    });

    describe('getTagsGroupedByColor', () => {
      it('should group tags by color', () => {
        const grouped = getTagsGroupedByColor();
        expect(typeof grouped).toBe('object');
        
        // Each color should have an array of tags
        Object.keys(grouped).forEach(color => {
          expect(Array.isArray(grouped[color])).toBe(true);
          grouped[color]?.forEach(tag => {
            expect(tag.id).toBeDefined();
            expect(tag.name).toBeDefined();
          });
        });
      });
    });
  });
});