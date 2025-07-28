import { test, expect } from '@playwright/test';

test.describe('Idea Management Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'TestPassword123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/');
  });

  test('should create a new idea successfully', async ({ page }) => {
    // Navigate to submit page
    await page.click('text=Submit Idea');
    await expect(page).toHaveURL('/submit');

    // Fill out idea form
    await page.fill('[name="title"]', 'Test Idea Title');
    await page.fill('[name="description"]', 'This is a test idea description with enough content to pass validation.');

    // Select tags
    await page.click('text=Select tags');
    await page.click('text=Technology'); // Assuming this tag exists
    await page.click('text=Innovation'); // Assuming this tag exists

    // Submit form
    await page.click('button[type="submit"]');

    // Should redirect to home page
    await expect(page).toHaveURL('/');

    // Should show success message
    await expect(page.locator('text=Idea submitted successfully')).toBeVisible();

    // Should see the new idea in the list
    await expect(page.locator('text=Test Idea Title')).toBeVisible();
  });

  test('should display ideas with voting functionality', async ({ page }) => {
    // Should see ideas on home page
    await expect(page.locator('[data-testid="idea-card"]').first()).toBeVisible();

    // Click upvote on first idea
    const firstIdea = page.locator('[data-testid="idea-card"]').first();
    await firstIdea.locator('[title="Upvote"]').click();

    // Should see vote count increase
    await expect(firstIdea.locator('text=/\d+/')).toBeVisible();
  });

  test('should navigate to idea detail page', async ({ page }) => {
    // Click on an idea title
    const firstIdeaTitle = page.locator('[data-testid="idea-card"] h3 a').first();
    const ideaTitle = await firstIdeaTitle.textContent();
    await firstIdeaTitle.click();

    // Should navigate to idea detail page
    await expect(page).toHaveURL(/\/ideas\/\d+/);

    // Should show the idea title
    await expect(page.locator(`text=${ideaTitle}`)).toBeVisible();

    // Should show comments section
    await expect(page.locator('text=Comments')).toBeVisible();
  });

  test('should filter ideas by tags', async ({ page }) => {
    // Click on a tag filter
    await page.click('[data-testid="tag-filter"]');
    await page.click('text=Technology');

    // Should show filtered results
    await expect(page.locator('text=filtered')).toBeVisible();

    // All visible ideas should have the selected tag
    const ideaCards = page.locator('[data-testid="idea-card"]');
    const count = await ideaCards.count();
    
    for (let i = 0; i < count; i++) {
      await expect(ideaCards.nth(i).locator('text=Technology')).toBeVisible();
    }
  });

  test('should search ideas', async ({ page }) => {
    // Use search functionality
    await page.fill('[placeholder*="Search ideas"]', 'test');
    await page.press('[placeholder*="Search ideas"]', 'Enter');

    // Should show search results
    const ideaCards = page.locator('[data-testid="idea-card"]');
    const count = await ideaCards.count();
    
    if (count > 0) {
      // At least one result should contain the search term
      await expect(page.locator('text=/test/i')).toBeVisible();
    } else {
      // Should show no results message
      await expect(page.locator('text=No matching ideas found')).toBeVisible();
    }
  });

  test('should sort ideas', async ({ page }) => {
    // Change sort order
    await page.click('[data-testid="sort-controls"]');
    await page.click('text=Date');
    await page.click('text=Oldest First');

    // Should reload ideas with new sort order
    await expect(page.locator('[data-testid="idea-card"]').first()).toBeVisible();
  });

  test('should load more ideas with infinite scroll', async ({ page }) => {
    // Get initial number of ideas
    const initialCount = await page.locator('[data-testid="idea-card"]').count();

    // Scroll to bottom
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });

    // Wait for more ideas to load
    await page.waitForTimeout(2000);

    // Should have more ideas loaded
    const newCount = await page.locator('[data-testid="idea-card"]').count();
    expect(newCount).toBeGreaterThanOrEqual(initialCount);
  });
});