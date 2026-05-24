// Bio validation helpers.
// Prevents users from gaming the minimum character count by padding with
// whitespace, repeated characters, or single-letter "words".

export const MIN_BIO_CHARS = 150;
export const MIN_BIO_WORDS = 25;

/** Collapse all whitespace runs to a single space, then trim. */
export const normalizeBio = (bio: string): string =>
  (bio || "").replace(/\s+/g, " ").trim();

/** Effective character count, ignoring padding whitespace. */
export const bioCharCount = (bio: string): number => normalizeBio(bio).length;

/** Count words of 2+ characters (single letters don't count). */
export const bioWordCount = (bio: string): number => {
  const normalized = normalizeBio(bio);
  if (!normalized) return 0;
  return normalized.split(" ").filter((w) => w.length >= 2).length;
};

export interface BioValidationResult {
  valid: boolean;
  error?: string;
  charCount: number;
  wordCount: number;
  charsNeeded: number;
  wordsNeeded: number;
}

export const validateBio = (bio: string): BioValidationResult => {
  const charCount = bioCharCount(bio);
  const wordCount = bioWordCount(bio);
  const charsNeeded = Math.max(0, MIN_BIO_CHARS - charCount);
  const wordsNeeded = Math.max(0, MIN_BIO_WORDS - wordCount);

  if (charCount < MIN_BIO_CHARS) {
    return {
      valid: false,
      error: `Your bio needs ${charsNeeded} more characters (whitespace doesn't count).`,
      charCount, wordCount, charsNeeded, wordsNeeded,
    };
  }
  if (wordCount < MIN_BIO_WORDS) {
    return {
      valid: false,
      error: `Please write at least ${MIN_BIO_WORDS} real words. ${wordsNeeded} to go.`,
      charCount, wordCount, charsNeeded, wordsNeeded,
    };
  }
  return { valid: true, charCount, wordCount, charsNeeded, wordsNeeded };
};
