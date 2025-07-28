import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Start from the home page
    await page.goto('/');
  });

  test('should register a new user successfully', async ({ page }) => {
    // Navigate to register page
    await page.click('text=Register');
    await expect(page).toHaveURL('/register');

    // Fill out registration form
    await page.fill('[name="username"]', 'testuser');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'TestPassword123');

    // Submit form
    await page.click('button[type="submit"]');

    // Should redirect to home page after successful registration
    await expect(page).toHaveURL('/');
    
    // Should show user is logged in
    await expect(page.locator('text=testuser')).toBeVisible();
  });

  test('should login existing user successfully', async ({ page }) => {
    // Navigate to login page
    await page.click('text=Login');
    await expect(page).toHaveURL('/login');

    // Fill out login form
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'TestPassword123');

    // Submit form
    await page.click('button[type="submit"]');

    // Should redirect to home page after successful login
    await expect(page).toHaveURL('/');
    
    // Should show user is logged in
    await expect(page.locator('text=testuser')).toBeVisible();
  });

  test('should show validation errors for invalid input', async ({ page }) => {
    // Navigate to register page
    await page.click('text=Register');

    // Try to submit empty form
    await page.click('button[type="submit"]');

    // Should show validation errors
    await expect(page.locator('text=Username is required')).toBeVisible();
    await expect(page.locator('text=Email is required')).toBeVisible();
    await expect(page.locator('text=Password is required')).toBeVisible();
  });

  test('should logout user successfully', async ({ page }) => {
    // First login
    await page.click('text=Login');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'TestPassword123');
    await page.click('button[type="submit"]');

    // Wait for login to complete
    await expect(page.locator('text=testuser')).toBeVisible();

    // Click logout
    await page.click('text=Logout');

    // Should show login/register buttons again
    await expect(page.locator('text=Login')).toBeVisible();
    await expect(page.locator('text=Register')).toBeVisible();
  });
});