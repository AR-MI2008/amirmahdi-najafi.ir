export function getContentMode(): 'typed' | 'sqlite' {
  const mode = process.env.CONTENT_SOURCE ?? 'typed';
  if (mode !== 'typed' && mode !== 'sqlite') throw new Error('Invalid CONTENT_SOURCE');
  return mode;
}
