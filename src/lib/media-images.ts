export type TmdbImageSize = 'w500' | 'w780' | 'w1280';

export function resizeTmdbImageSource(value: string, size: TmdbImageSize): string | null {
  if (!/^https?:\/\/image\.tmdb\.org\//i.test(value)) return null;
  const resized = value.replace(/(\/t\/p\/)(?:original|w\d+)(\/)/i, `$1${size}$2`);
  return resized === value && !/\/t\/p\/w\d+\//i.test(value) && !/\/t\/p\/original\//i.test(value)
    ? null
    : resized;
}
