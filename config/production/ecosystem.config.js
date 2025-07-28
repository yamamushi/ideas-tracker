module.exports = {
  apps: [
    {
      name: 'ideas-tracker-api',
      script: './backend/dist/server.js',
      cwd: './',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      instances: 'max', // Use all CPU cores
      exec_mode: 'cluster',
      max_memory_restart: '500M',
      error_file: './logs/api-error.log',
      out_file: './logs/api-out.log',
      log_file: './logs/api.log',
      time: true,
      autorestart: true,
      watch: false,
      max_restarts: 10,
      min_uptime: '10s',
      kill_timeout: 5000,
      restart_delay: 4000,
      
      // Health monitoring
      health_check_grace_period: 3000,
      health_check_fatal_exceptions: true,
      
      // Environment-specific settings
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001,
        LOG_LEVEL: 'info'
      },
      
      env_staging: {
        NODE_ENV: 'staging',
        PORT: 3001,
        LOG_LEVEL: 'debug'
      }
    }
  ],

  deploy: {
    production: {
      user: 'ideas-tracker',
      host: ['your-server.com'],
      ref: 'origin/main',
      repo: 'https://github.com/your-username/ideas-tracker.git',
      path: '/opt/ideas-tracker',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production',
      'pre-setup': '',
      'ssh_options': 'StrictHostKeyChecking=no'
    },
    
    staging: {
      user: 'ideas-tracker',
      host: ['staging-server.com'],
      ref: 'origin/develop',
      repo: 'https://github.com/your-username/ideas-tracker.git',
      path: '/opt/ideas-tracker-staging',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env staging'
    }
  }
};