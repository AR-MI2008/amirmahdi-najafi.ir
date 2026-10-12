// @vitest-environment jsdom
import React from 'react';
import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
vi.mock('@/app/admin/content/actions', () => ({ saveAdminContent: vi.fn() }));
import { ContentEditor } from '@/app/admin/content/content-editor';
afterEach(cleanup);
it('creates article blocks without JSON editing and serializes bilingual text', () => {
  const { container } = render(<ContentEditor kind="post" />);
  fireEvent.change(screen.getByLabelText('شناسهٔ لاتین'), { target: { value: 'test-post' } });
  fireEvent.click(screen.getByRole('button', { name: 'افزودن به بخش‌های مقاله' }));
  expect(screen.getByText('بخش مقاله')).toBeInTheDocument();
  expect(
    JSON.parse((container.querySelector('[name=content]') as HTMLInputElement).value).slug,
  ).toBe('test-post');
  fireEvent.click(screen.getByRole('button', { name: 'حذف مورد 1' }));
  expect(
    JSON.parse((container.querySelector('[name=content]') as HTMLInputElement).value).blocks,
  ).toEqual([]);
});
it('locks the original slug while editing', () => {
  render(<ContentEditor kind="post" version="abc" originalSlug="test" />);
  expect(screen.getByLabelText('شناسهٔ لاتین')).toBeDisabled();
});
