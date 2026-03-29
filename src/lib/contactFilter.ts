/**
 * Detects contact information in user-submitted text.
 * Returns a description of what was found, or null if clean.
 */
export const detectContactInfo = (text: string): string | null => {
  const lower = text.toLowerCase().replace(/\s+/g, ' ');
  const normalized = text.replace(/[\s\-().]/g, '');

  // Phone numbers (7+ consecutive digits)
  if (/(\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}/.test(text) && /\d{7,}/.test(normalized)) {
    return "phone numbers";
  }

  // Email addresses
  if (/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(text)) {
    return "email addresses";
  }

  // Social media handles/platforms
  const socialPatterns = [
    /(?:facebook|fb)[\s.:\/]*(?:\.com|me|profile|@|\w{3,})/i,
    /(?:instagram|ig|insta)[\s.:\/]*(?:\.com|@|\w{3,})/i,
    /(?:twitter|x\.com)[\s.:\/]*(?:\.com|@|\w{3,})/i,
    /(?:whatsapp|whats\s*app|wa\.me|viber|telegram|tg)[\s.:\/]*(?:\.me|@|\+?\d|\w{3,})/i,
    /(?:snapchat|snap|tiktok|tik\s*tok)[\s.:\/]*(?:\.com|@|\w{3,})/i,
    /(?:line|wechat|kakaotalk|kakao)[\s.:\/]*(?:\.me|id|@|\w{3,})/i,
    /(?:skype|discord|zoom)[\s.:\/]*(?:\.com|@|#|\w{3,})/i,
    /@[a-zA-Z0-9._]{3,}/, // Generic @username
  ];
  for (const pattern of socialPatterns) {
    if (pattern.test(text)) return "social media accounts";
  }

  // URLs
  if (/(?:https?:\/\/|www\.)[^\s]+/i.test(text)) {
    return "links or URLs";
  }

  // Evasion phrases
  if (/(?:add|find|reach|contact|message|text|call|hit)\s+(?:me|us)\s+(?:on|at|in|via)/i.test(lower)) {
    return "contact sharing";
  }
  if (/(?:my|here'?s?\s+my|send\s+(?:me\s+)?(?:your|ur))\s+(?:number|phone|cell|mobile|email|e-mail|ig|insta|fb|snap|tiktok|line|whatsapp|viber|telegram|discord|skype|account|handle|username)/i.test(lower)) {
    return "contact sharing";
  }

  return null;
};
