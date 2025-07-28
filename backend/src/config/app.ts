import fs from 'fs';
import path from 'path';

interface AppConfig {
  pagination: {
    defaultLimit: number;
    maxLimit: number;
  };
  rateLimit: {
    windowMs: number;
    max: number;
  };
  jwt: {
    accessTokenExpiry: string;
    refreshTokenExpiry: string;
  };
}

let appConfig: AppConfig;

export function loadAppConfig(): AppConfig {
  if (appConfig) {
    return appConfig;
  }

  try {
    const configPath = path.join(process.cwd(), 'config', 'app.json');
    if (fs.existsSync(configPath)) {
      appConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    } else {
      throw new Error('App config file not found');
    }
  } catch {
    // Fallback to default configuration
    appConfig = {
      pagination: {
        defaultLimit: 20,
        maxLimit: 100
      },
      rateLimit: {
        windowMs: 900000, // 15 minutes
        max: 100
      },
      jwt: {
        accessTokenExpiry: '1h',
        refreshTokenExpiry: '7d'
      }
    };
  }

  return appConfig;
}

export function getAppConfig(): AppConfig {
  if (!appConfig) {
    return loadAppConfig();
  }
  return appConfig;
}