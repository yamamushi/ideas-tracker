import { test, expect } from '@playwright/test';

test.describe('Comments Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login and navigate to an idea detail page
    await page.goto('/login');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'TestPassword123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/');

    // Click on first idea to go to detail page
    await page.locator('[data-testid="idea-card"] h3 a').first().click();
    await expect(page).toHaveURL(/\/ideas\/\d+/);
  });

  test('should add a new comment', async ({ page }) => {
    // Scroll to comments section
    await page.locator('#comments').scrollIntoViewIfNeeded();

    // Fill comment form
    await page.fill('[placeholder*="Share your thoughts"]', 'This is a test comment from E2E test');

    // Submit comment
    await page.click('text=Post Comment');

    // Should see success message
    await expect(page.locator('text=Comment posted successfully')).toBeVisible();

    // Should see the new comment
    await expect(page.locator('text=This is a test comment from E2E test')).toBeVisible();
  });

  test('should edit own comment', async ({ page }) => {
    // First add a comment
    await page.locator('#comments').scrollIntoViewIfNeeded();
    await page.fill('[placeholder*="Share your thoughts"]', 'Original comment text');
    await page.click('text=Post Comment');
    await expect(page.locator('text=Original comment text')).toBeVisible();

    // Edit the comment
    await page.click('[title="Edit comment"]');
    await page.fill('[value="Original comment text"]', 'Edited comment text');
    await page.click('text=Save');

    // Should see updated comment
    await expect(page.locator('text=Edited comment text')).toBeVisible();
    await expect(page.locator('text=Original comment text')).not.toBeVisible();
  });

  test('should delete own comment', async ({ page }) => {
    // First add a comment
    await page.locator('#comments').scrollIntoViewIfNeeded();
    await page.fill('[placeholder*="Share your thoughts"]', 'Comment to be deleted');
    await page.click('text=Post Comment');
    await expect(page.locator('text=Comment to be deleted')).toBeVisible();

    // Delete the comment
    page.on('dialog', dialog => dialog.accept()); // Accept confirmation dialog
    await page.click('[title="Delete comment"]');

    // Should not see the deleted comment
    await expect(page.locator('text=Comment to be deleted')).not.toBeVisible();
  });

  test('should show comments in chronological order', async ({ page }) => {
    // Add multiple comments
    await page.locator('#comments').scrollIntoViewIfNeeded();
    
    await page.fill('[placeholder*="Share your thoughts"]', 'First comment');
    await page.click('text=Post Comment');
    await expect(page.locator('text=First comment')).toBeVisible();

    await page.fill('[placeholder*="Share your thoughts"]', 'Second comment');
    await page.click('text=Post Comment');
    await expect(page.locator('text=Second comment')).toBeVisible();

    // Check order - first comment should appear before second comment
    const comments = page.locator('[data-testid="comment"]');
    const firstCommentIndex = await comments.locator('text=First comment').first().evaluate(el => {
      return Array.from(el.closest('[data-testid="comment"]')?.parentElement?.children || []).indexOf(el.closest('[data-testid="comment"]') as Element);
    });
    
    const secondCommentIndex = await comments.locator('text=Second comment').first().evaluate(el => {
      return Array.from(el.closest('[data-testid="comment"]')?.parentElement?.children || []).indexOf(el.closest('[data-testid="comment"]') as Element);
    });

    expect(firstCommentIndex).toBeLessThan(secondCommentIndex);
  });

  test('should validate comment input', async ({ page }) => {
    await page.locator('#comments').scrollIntoViewIfNeeded();

    // Submit button should be disabled for empty comment
    const submitButton = page.locator('text=Post Comment');
    await expect(submitButton).toBeDisabled();

    // Add whitespace only
    await page.fill('[placeholder*="Share your thoughts"]', '   ');
    await expect(submitButton).toBeDisabled();

    // Add actual content
    await page.fill('[placeholder*="Share your thoughts"]', 'Valid comment');
    await expect(submitButton).not.toBeDisabled();
  });

  test('should show login prompt for unauthenticated users', async ({ page }) => {
    // Logout first
    await page.click('text=Logout');
    await expect(page.locator('text=Login')).toBeVisible();

    // Navigate back to idea detail page
    await page.goto('/ideas/1'); // Assuming idea with ID 1 exists

    // Should show login prompt instead of comment form
    await expect(page.locator('text=Please log in to leave a comment')).toBeVisible();
    await expect(page.locator('[placeholder*="Share your thoughts"]')).not.toBeVisible();
  });

  test('should load more comments when available', async ({ page }) => {
    await page.locator('#comments').scrollIntoViewIfNeeded();

    // If there's a "Load More Comments" button, click it
    const loadMoreButton = page.locator('text=Load More Comments');
    if (await loadMoreButton.isVisible()) {
      const initialCommentCount = await page.locator('[data-testid="comment"]').count();
      await loadMoreButton.click();
      
      // Should load more comments
      await page.waitForTimeout(1000);
      const newCommentCount = await page.locator('[data-testid="comment"]').count();
      expect(newCommentCount).toBeGreaterThan(initialCommentCount);
    }
  });
});