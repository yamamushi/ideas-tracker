import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { getAvailableTags, loadTagConfig, getTagConfig } from '../utils/tags';
import { getAppConfig } from '../config/app';

export const getTags = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const tags = getAvailableTags();

  res.json({
    success: true,
    data: {
      tags
    }
  });
});

export const getTagsWithStats = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const tags = getAvailableTags();
  
  // In a real implementation, you'd get usage statistics from the database
  // For now, we'll return the tags with placeholder stats
  const tagsWithStats = tags.map(tag => ({
    ...tag,
    usageCount: 0, // This would be calculated from the database
    lastUsed: null // This would be the last time this tag was used
  }));

  res.json({
    success: true,
    data: {
      tags: tagsWithStats
    }
  });
});

export const reloadTagConfig = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user || !req.user.isAdmin) {
    throw new Error('Admin access required');
  }

  try {
    // Force reload of tag configuration
    const newConfig = loadTagConfig();
    
    console.log(`Admin ${req.user.username} (ID: ${req.user.userId}) reloaded tag configuration`);

    res.json({
      success: true,
      message: 'Tag configuration reloaded successfully',
      data: {
        tags: newConfig.tags
      }
    });
  } catch (error) {
    console.error('Failed to reload tag configuration:', error);
    throw new Error('Failed to reload tag configuration');
  }
});

export const getAppConfiguration = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const config = getAppConfig();
  
  // Return public configuration (hide sensitive data)
  const publicConfig = {
    pagination: config.pagination,
    rateLimit: {
      windowMs: config.rateLimit.windowMs,
      max: config.rateLimit.max
    }
    // Don't expose JWT configuration
  };

  res.json({
    success: true,
    data: {
      config: publicConfig
    }
  });
});

export const validateTagConfiguration = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user || !req.user.isAdmin) {
    throw new Error('Admin access required');
  }

  try {
    const config = getTagConfig();
    const validation = {
      isValid: true,
      errors: [] as string[],
      warnings: [] as string[]
    };

    // Validate tag structure
    if (!config.tags || !Array.isArray(config.tags)) {
      validation.isValid = false;
      validation.errors.push('Tags must be an array');
    } else {
      // Check each tag
      config.tags.forEach((tag, index) => {
        if (!tag.id || typeof tag.id !== 'string') {
          validation.errors.push(`Tag at index ${index} missing or invalid id`);
          validation.isValid = false;
        }
        
        if (!tag.name || typeof tag.name !== 'string') {
          validation.errors.push(`Tag at index ${index} missing or invalid name`);
          validation.isValid = false;
        }
        
        if (tag.color && typeof tag.color !== 'string') {
          validation.warnings.push(`Tag at index ${index} has invalid color format`);
        }
        
        if (tag.color && !tag.color.match(/^#[0-9A-Fa-f]{6}$/)) {
          validation.warnings.push(`Tag "${tag.name}" color should be a valid hex color`);
        }
      });

      // Check for duplicate IDs
      const tagIds = config.tags.map(tag => tag.id);
      const duplicateIds = tagIds.filter((id, index) => tagIds.indexOf(id) !== index);
      if (duplicateIds.length > 0) {
        validation.isValid = false;
        validation.errors.push(`Duplicate tag IDs found: ${duplicateIds.join(', ')}`);
      }

      // Check for duplicate names
      const tagNames = config.tags.map(tag => tag.name);
      const duplicateNames = tagNames.filter((name, index) => tagNames.indexOf(name) !== index);
      if (duplicateNames.length > 0) {
        validation.warnings.push(`Duplicate tag names found: ${duplicateNames.join(', ')}`);
      }
    }

    res.json({
      success: true,
      data: {
        validation,
        totalTags: config.tags?.length || 0
      }
    });
  } catch (error) {
    res.json({
      success: false,
      error: {
        message: 'Failed to validate tag configuration',
        details: error instanceof Error ? error.message : 'Unknown error'
      }
    });
  }
});