import { describe, expect, it } from 'vitest';
import { contactSchema, escapeHtml } from '@/lib/validation';

const valid = {
  name: 'Test Person',
  email: 'test@example.com',
  subject: 'A project',
  message: 'This is a message long enough to pass the minimum length rule.',
  website: '',
  renderedAt: Date.now() - 10_000,
};

describe('contactSchema', () => {
  it('accepts a well-formed submission', () => {
    expect(contactSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects CR/LF in single-line fields (email header injection)', () => {
    const attack = { ...valid, subject: 'Hi\r\nBcc: victim@example.com' };
    expect(contactSchema.safeParse(attack).success).toBe(false);
  });

  it('rejects an oversized message', () => {
    expect(contactSchema.safeParse({ ...valid, message: 'x'.repeat(4001) }).success).toBe(false);
  });

  it('rejects a filled honeypot', () => {
    expect(contactSchema.safeParse({ ...valid, website: 'http://spam' }).success).toBe(false);
  });

  it('rejects a malformed email', () => {
    expect(contactSchema.safeParse({ ...valid, email: 'not-an-email' }).success).toBe(false);
  });
});

describe('escapeHtml', () => {
  it('neutralises script payloads', () => {
    expect(escapeHtml('<script>alert(1)</script>')).toBe(
      '&lt;script&gt;alert(1)&lt;/script&gt;',
    );
  });

  it('escapes quotes so attribute contexts stay safe', () => {
    expect(escapeHtml(`" onload='x'`)).toBe('&quot; onload=&#39;x&#39;');
  });
});
