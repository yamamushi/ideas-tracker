#!/usr/bin/env node

const { Client } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config();

const sampleUsers = [
  { username: 'alice_dev', email: 'alice@example.com', password: 'password123' },
  { username: 'bob_designer', email: 'bob@example.com', password: 'password123' },
  { username: 'charlie_pm', email: 'charlie@example.com', password: 'password123' },
];

const sampleIdeas = [
  {
    title: 'Dark Mode Toggle',
    description: 'Add a toggle button to switch between light and dark themes for better user experience.',
    tags: ['design', 'improvement'],
    authorIndex: 0
  },
  {
    title: 'Mobile App Version',
    description: 'Create a mobile application version of the ideas tracker for iOS and Android.',
    tags: ['technology', 'product'],
    authorIndex: 1
  },
  {
    title: 'Idea Categories',
    description: 'Implement a category system to better organize ideas by department or topic.',
    tags: ['product', 'improvement'],
    authorIndex: 2
  },
  {
    title: 'Email Notifications',
    description: 'Send email notifications when ideas receive comments or votes.',
    tags: ['technology', 'marketing'],
    authorIndex: 0
  },
  {
    title: 'Idea Analytics Dashboard',
    description: 'Create an analytics dashboard showing idea trends, popular tags, and user engagement.',
    tags: ['business', 'technology'],
    authorIndex: 1
  }
];

const sampleComments = [
  { ideaIndex: 0, authorIndex: 1, content: 'Great idea! This would really improve accessibility.' },
  { ideaIndex: 0, authorIndex: 2, content: 'We should also consider system theme detection.' },
  { ideaIndex: 1, authorIndex: 2, content: 'Mobile app would be amazing for on-the-go idea submission.' },
  { ideaIndex: 2, authorIndex: 0, content: 'Categories would help with filtering and organization.' },
  { ideaIndex: 3, authorIndex: 1, content: 'Email notifications should be optional and configurable.' }
];

async function seedDatabase() {
  const client = new Client({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  });

  try {
    await client.connect();
    console.log('🔗 Connected to database');

    // Check if data already exists
    const { rows: existingUsers } = await client.query('SELECT COUNT(*) as count FROM users WHERE is_admin = false');
    if (parseInt(existingUsers[0].count) > 0) {
      console.log('⚠️  Sample data already exists, skipping seed');
      return;
    }

    console.log('🌱 Seeding database with sample data...');

    // Create sample users
    const createdUsers = [];
    for (const user of sampleUsers) {
      const passwordHash = await bcrypt.hash(user.password, 12);
      const { rows: [newUser] } = await client.query(
        'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id',
        [user.username, user.email, passwordHash]
      );
      createdUsers.push(newUser.id);
      console.log(`✅ Created user: ${user.username}`);
    }

    // Create sample ideas
    const createdIdeas = [];
    for (const idea of sampleIdeas) {
      const { rows: [newIdea] } = await client.query(
        'INSERT INTO ideas (title, description, author_id, tags) VALUES ($1, $2, $3, $4) RETURNING id',
        [idea.title, idea.description, createdUsers[idea.authorIndex], idea.tags]
      );
      createdIdeas.push(newIdea.id);
      console.log(`✅ Created idea: ${idea.title}`);
    }

    // Create sample votes
    const voteTypes = ['upvote', 'downvote'];
    for (let i = 0; i < createdIdeas.length; i++) {
      for (let j = 0; j < createdUsers.length; j++) {
        // Skip voting on own ideas sometimes
        if (i % 3 === j % 3) continue;
        
        const voteType = Math.random() > 0.3 ? 'upvote' : 'downvote';
        await client.query(
          'INSERT INTO votes (user_id, idea_id, vote_type) VALUES ($1, $2, $3)',
          [createdUsers[j], createdIdeas[i], voteType]
        );
      }
    }
    console.log('✅ Created sample votes');

    // Create sample comments
    for (const comment of sampleComments) {
      await client.query(
        'INSERT INTO comments (content, author_id, idea_id) VALUES ($1, $2, $3)',
        [comment.content, createdUsers[comment.authorIndex], createdIdeas[comment.ideaIndex]]
      );
    }
    console.log('✅ Created sample comments');

    console.log('🎉 Database seeded successfully!');
    console.log('\nSample users created:');
    sampleUsers.forEach(user => {
      console.log(`  - ${user.username} (${user.email}) - password: ${user.password}`);
    });

  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase };