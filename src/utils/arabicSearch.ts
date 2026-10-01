// Arabic text normalization for smart search
export function normalizeArabic(text: string): string {
  if (!text) return '';
  return text
    // Remove Arabic diacritics / tashkeel
    .replace(/[\u064B-\u065F\u0670]/g, '')
    // Normalize Alef variants: أ, إ, آ, ٱ -> ا
    .replace(/[إأآٱ]/g, 'ا')
    // Normalize Yaa / Alef Maqsura: ى -> ي
    .replace(/ى/g, 'ي')
    // Normalize Taa Marbuta: ة -> ه
    .replace(/ة/g, 'ه')
    // Trim extra spaces and lowercase (for latin mixed text)
    .toLowerCase();
}

export interface MatchSnippet {
  index: number;
  before: string;
  match: string;
  after: string;
}

export interface ChapterSearchResult {
  chapterId: string;
  chapterTitle: string;
  chapterOrder: number;
  act?: string;
  totalMatches: number;
  snippets: MatchSnippet[];
}

// Find all matches of a query inside a text with contextual surrounding snippets
export function searchInText(text: string, rawQuery: string, maxSnippets = 5): MatchSnippet[] {
  if (!text || !rawQuery.trim()) return [];

  const normalizedQuery = normalizeArabic(rawQuery.trim());
  const normalizedText = normalizeArabic(text);

  if (!normalizedQuery) return [];

  const snippets: MatchSnippet[] = [];
  let startIndex = 0;

  while (startIndex < normalizedText.length) {
    const matchIndex = normalizedText.indexOf(normalizedQuery, startIndex);
    if (matchIndex === -1) break;

    // Get original characters from text corresponding to roughly the match
    // (Note: because tashkeel might alter length slightly, we find the best approximation in original text)
    const matchLen = rawQuery.trim().length;
    const startSnippet = Math.max(0, matchIndex - 35);
    const endSnippet = Math.min(text.length, matchIndex + matchLen + 40);

    const before = (startSnippet > 0 ? '...' : '') + text.substring(startSnippet, matchIndex);
    const match = text.substring(matchIndex, matchIndex + matchLen);
    const after = text.substring(matchIndex + matchLen, endSnippet) + (endSnippet < text.length ? '...' : '');

    snippets.push({
      index: matchIndex,
      before,
      match,
      after,
    });

    if (snippets.length >= maxSnippets) {
      break;
    }

    startIndex = matchIndex + Math.max(1, matchLen);
  }

  return snippets;
}

// Count exact occurrences in text
export function countMatchesInText(text: string, rawQuery: string): number {
  if (!text || !rawQuery.trim()) return 0;
  const normalizedQuery = normalizeArabic(rawQuery.trim());
  const normalizedText = normalizeArabic(text);
  if (!normalizedQuery) return 0;

  let count = 0;
  let pos = 0;
  while ((pos = normalizedText.indexOf(normalizedQuery, pos)) !== -1) {
    count++;
    pos += Math.max(1, normalizedQuery.length);
  }
  return count;
}
