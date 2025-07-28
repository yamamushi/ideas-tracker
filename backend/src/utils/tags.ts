import fs from 'fs';
import path from 'path';

export interface Tag {
  id: string;
  name: string;
  color?: string;
}

export interface TagConfig {
  tags: Tag[];
}

let tagConfig: TagConfig | null = null;

export function loadTagConfig(forceReload: boolean = false): TagConfig {
  if (tagConfig && !forceReload) {
    return tagConfig;
  }

  try {
    const configPath = path.join(process.cwd(), 'config', 'tags.json');
    if (fs.existsSync(configPath)) {
      const configData = fs.readFileSync(configPath, 'utf8');
      const parsedConfig = JSON.parse(configData);
      
      // Validate the configuration structure
      if (!parsedConfig.tags || !Array.isArray(parsedConfig.tags)) {
        throw new Error('Invalid tag configuration: tags must be an array');
      }
      
      // Validate each tag
      parsedConfig.tags.forEach((tag: any, index: number) => {
        if (!tag.id || typeof tag.id !== 'string') {
          throw new Error(`Invalid tag at index ${index}: missing or invalid id`);
        }
        if (!tag.name || typeof tag.name !== 'string') {
          throw new Error(`Invalid tag at index ${index}: missing or invalid name`);
        }
      });
      
      tagConfig = parsedConfig;
      console.log(`Loaded ${tagConfig.tags.length} tags from configuration`);
    } else {
      throw new Error('Tags config file not found');
    }
  } catch (error) {
    // Fallback to default tags
    if (process.env['NODE_ENV'] !== 'test') {
      console.warn('Failed to load tags config, using defaults:', error);
    }
    tagConfig = {
      tags: [
        { id: 'technology', name: 'Technology', color: '#3b82f6' },
        { id: 'business', name: 'Business', color: '#10b981' },
        { id: 'design', name: 'Design', color: '#f59e0b' },
        { id: 'marketing', name: 'Marketing', color: '#ef4444' },
        { id: 'product', name: 'Product', color: '#8b5cf6' },
        { id: 'research', name: 'Research', color: '#06b6d4' },
        { id: 'innovation', name: 'Innovation', color: '#f97316' },
        { id: 'improvement', name: 'Improvement', color: '#84cc16' }
      ]
    };
  }

  return tagConfig;
}

export function getTagConfig(): TagConfig {
  if (!tagConfig) {
    return loadTagConfig();
  }
  return tagConfig;
}

export function getAvailableTags(): Tag[] {
  const config = getTagConfig();
  return config.tags;
}

export function getValidTagIds(): string[] {
  const tags = getAvailableTags();
  return tags.map(tag => tag.id);
}

export function validateTags(tags: string[]): { valid: boolean; invalidTags: string[] } {
  const validTagIds = getValidTagIds();
  const invalidTags = tags.filter(tag => !validTagIds.includes(tag));
  
  return {
    valid: invalidTags.length === 0,
    invalidTags
  };
}

export function getTagById(id: string): Tag | null {
  const tags = getAvailableTags();
  return tags.find(tag => tag.id === id) || null;
}

export function getTagsByIds(ids: string[]): Tag[] {
  const tags = getAvailableTags();
  return ids.map(id => tags.find(tag => tag.id === id)).filter(Boolean) as Tag[];
}

export function reloadTagConfig(): TagConfig {
  tagConfig = null; // Clear cache
  return loadTagConfig(true);
}

export function getTagStatistics(): { totalTags: number; tagIds: string[] } {
  const tags = getAvailableTags();
  return {
    totalTags: tags.length,
    tagIds: tags.map(tag => tag.id)
  };
}

export function searchTags(query: string): Tag[] {
  const tags = getAvailableTags();
  const lowerQuery = query.toLowerCase();
  
  return tags.filter(tag => 
    tag.id.toLowerCase().includes(lowerQuery) || 
    tag.name.toLowerCase().includes(lowerQuery)
  );
}

export function getTagsGroupedByColor(): { [color: string]: Tag[] } {
  const tags = getAvailableTags();
  const grouped: { [color: string]: Tag[] } = {};
  
  tags.forEach(tag => {
    const color = tag.color || '#gray';
    if (!grouped[color]) {
      grouped[color] = [];
    }
    grouped[color].push(tag);
  });
  
  return grouped;
}

export function validateTagConfigurationFile(filePath?: string): { 
  isValid: boolean; 
  errors: string[]; 
  warnings: string[] 
} {
  const configPath = filePath || path.join(process.cwd(), 'config', 'tags.json');
  const result = {
    isValid: true,
    errors: [] as string[],
    warnings: [] as string[]
  };

  try {
    if (!fs.existsSync(configPath)) {
      result.isValid = false;
      result.errors.push('Configuration file does not exist');
      return result;
    }

    const configData = fs.readFileSync(configPath, 'utf8');
    const config = JSON.parse(configData);

    if (!config.tags || !Array.isArray(config.tags)) {
      result.isValid = false;
      result.errors.push('Configuration must have a "tags" array');
      return result;
    }

    const seenIds = new Set<string>();
    const seenNames = new Set<string>();

    config.tags.forEach((tag: any, index: number) => {
      if (!tag.id || typeof tag.id !== 'string') {
        result.isValid = false;
        result.errors.push(`Tag at index ${index}: missing or invalid id`);
      } else {
        if (seenIds.has(tag.id)) {
          result.isValid = false;
          result.errors.push(`Duplicate tag ID: ${tag.id}`);
        }
        seenIds.add(tag.id);
      }

      if (!tag.name || typeof tag.name !== 'string') {
        result.isValid = false;
        result.errors.push(`Tag at index ${index}: missing or invalid name`);
      } else {
        if (seenNames.has(tag.name)) {
          result.warnings.push(`Duplicate tag name: ${tag.name}`);
        }
        seenNames.add(tag.name);
      }

      if (tag.color && typeof tag.color !== 'string') {
        result.warnings.push(`Tag "${tag.name}": color should be a string`);
      } else if (tag.color && !tag.color.match(/^#[0-9A-Fa-f]{6}$/)) {
        result.warnings.push(`Tag "${tag.name}": color should be a valid hex color (e.g., #3b82f6)`);
      }
    });

  } catch (error) {
    result.isValid = false;
    result.errors.push(`Failed to parse configuration: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return result;
}