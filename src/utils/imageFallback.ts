interface KeywordImageOptions {
  keywords: Array<string | undefined | null>;
  defaultKeywords: string[];
  width: number;
  height: number;
}

export function buildKeywordImageUrl(options: KeywordImageOptions): string {
  const query = options.keywords
    .filter(Boolean)
    .map((keyword) => String(keyword).trim())
    .filter((keyword) => keyword.length > 0)
    .join(',');

  const finalQuery = query || options.defaultKeywords.join(',');
  return `https://source.unsplash.com/${options.width}x${options.height}/?${encodeURIComponent(finalQuery)}`;
}

export function buildSeedFallbackUrl(seed: string, width: number, height: number): string {
  return `https://picsum.photos/seed/${encodeURIComponent(seed)}/${width}/${height}`;
}