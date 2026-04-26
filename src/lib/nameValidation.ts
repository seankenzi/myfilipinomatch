// Validates that a name uses Latin script only.
// Rejects Chinese/Japanese/Korean/Cyrillic/Arabic/etc. characters.
// Allows: Latin letters (with accents), spaces, hyphens, apostrophes, dots.

const ALLOWED_NAME_REGEX = /^[\p{Script=Latin}\s'’\-.\u00B7]+$/u;

export interface NameValidationResult {
  valid: boolean;
  error?: string;
}

export const validateName = (name: string, fieldLabel = "Name"): NameValidationResult => {
  const trimmed = (name || "").trim();
  if (!trimmed) {
    return { valid: false, error: `${fieldLabel} is required.` };
  }
  if (trimmed.length < 2) {
    return { valid: false, error: `${fieldLabel} must be at least 2 characters.` };
  }
  if (trimmed.length > 50) {
    return { valid: false, error: `${fieldLabel} must be less than 50 characters.` };
  }
  if (!ALLOWED_NAME_REGEX.test(trimmed)) {
    return {
      valid: false,
      error: `${fieldLabel} must use Latin letters only (no Chinese, Japanese, Korean, or other non-Latin scripts).`,
    };
  }
  return { valid: true };
};
