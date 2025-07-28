import request from 'supertest';
import app from '../src/app';

let userCounter = 0;

export function createUniqueUser() {
  userCounter++;
  return {
    username: `testuser${userCounter}`,
    email: `test${userCounter}@example.com`,
    password: 'TestPassword123'
  };
}

export async function createAuthenticatedUser() {
  const user = createUniqueUser();
  
  // Try to register the user
  const registerResponse = await request(app)
    .post('/api/auth/register')
    .send(user);

  let accessToken: string;
  let userId: number;

  if (registerResponse.status === 201) {
    accessToken = registerResponse.body.data.tokens.accessToken;
    userId = registerResponse.body.data.user.id;
  } else {
    // If registration fails, try to login
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        emailOrUsername: user.email,
        password: user.password
      });
    
    if (loginResponse.status === 200) {
      accessToken = loginResponse.body.data.tokens.accessToken;
      userId = loginResponse.body.data.user.id;
    } else {
      throw new Error(`Failed to create authenticated user: ${loginResponse.status} ${loginResponse.text}`);
    }
  }

  return {
    user,
    accessToken,
    userId
  };
}

export async function createTestIdea(accessToken: string) {
  const testIdea = {
    title: `Test Idea ${Date.now()}`,
    description: 'This is a test idea for testing purposes.',
    tags: ['technology']
  };

  const response = await request(app)
    .post('/api/ideas')
    .set('Authorization', `Bearer ${accessToken}`)
    .send(testIdea);

  if (response.status !== 201) {
    throw new Error(`Failed to create test idea: ${response.status} ${response.text}`);
  }

  return {
    idea: response.body.data.idea,
    ideaId: response.body.data.idea.id
  };
}