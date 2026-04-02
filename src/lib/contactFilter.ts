/**
 * Detects contact information in user-submitted text.
 * Returns a description of what was found, or null if clean.
 *
 * IMPORTANT: Patterns must avoid false-positives on common English words
 * like "snap", "discord", "zoom", "line", "telegram", etc.
 * Use word boundaries (\b) and require platform-specific context
 * (separators, @-handles, URLs) rather than just the keyword + any word.
 */
export const detectContactInfo = (text: string): string | null => {
  const lower = text.toLowerCase().replace(/\s+/g, " ");

  // Strip spaces/dashes/dots/parens for digit-only checks
  const normalized = text.replace(/[\s\-().]/g, "");

  // ── Phone numbers ──
  // Require 7+ consecutive digits AND a phone-like grouping pattern.
  // Exclude pure date-like sequences (4-digit year followed by 2-2 or 2-2-2 pattern).
  if (/\d{7,}/.test(normalized)) {
    // Skip if text only contains dates (YYYY-MM-DD or DD/MM/YYYY etc.)
    const withoutDates = text.replace(
      /\b\d{1,4}[-\/\.]\d{1,2}[-\/\.]\d{1,4}\b/g,
      ""
    );
    const withoutDatesNorm = withoutDates.replace(/[\s\-().]/g, "");
    if (/\d{7,}/.test(withoutDatesNorm)) {
      // Must also look like a phone grouping
      if (
        /(\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}/.test(
          text
        )
      ) {
        return "phone numbers";
      }
    }
  }

  // ── Email addresses ──
  if (/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(text)) {
    return "email addresses";
  }

  // ── Social media / messaging platforms ──
  // Each pattern requires platform-specific context to avoid matching
  // common English words like "snap a photo" or "sow discord".
  const socialPatterns: [RegExp, string][] = [
    // Facebook — "fb.com", "fb @name", "facebook.com", "facebook me"
    [/\b(?:facebook)\b[\s.:\/]*(?:\.com|me|profile|@|\w{3,})/i, "Facebook"],
    [/(?:^|\s)fb[\s.:\/]+(?:\.com|me|profile|@|\w{3,})/i, "Facebook"],

    // Instagram — "instagram.com", "insta @name"; "ig" only with separator
    [/\b(?:instagram|insta)\b[\s.:\/]*(?:\.com|@|\w{3,})/i, "Instagram"],
    [/(?:^|\s)ig[\s.:\/]+(?:\.com|@|\w{3,})/i, "Instagram"],

    // Twitter/X
    [/\b(?:twitter)\b[\s.:\/]*(?:\.com|@|\w{3,})/i, "Twitter"],
    [/\bx\.com\b/i, "Twitter"],

    // WhatsApp / Viber — full words only
    [/\b(?:whatsapp|whats\s*app)\b/i, "WhatsApp"],
    [/\bwa\.me\b/i, "WhatsApp"],
    [/\bviber\b[\s.:\/]*(?:@|\+?\d|\w{3,})/i, "Viber"],

    // Telegram — require URL/handle context ("t.me/", "telegram @", "telegram:")
    // Avoids "send a telegram" (common English)
    [/\btelegram[\s]*[@:\/]/i, "Telegram"],
    [/\bt\.me\//i, "Telegram"],
    [/(?:^|\s)tg[\s.:\/]+(?:@|\+?\d|\w{3,})/i, "Telegram"],

    // Snapchat — require full word "snapchat", not bare "snap"
    [/\bsnapchat\b/i, "Snapchat"],
    [/\bsnap[\s]*(?:@|id[\s:]+)/i, "Snapchat"],

    // TikTok
    [/\b(?:tiktok|tik\s*tok)\b[\s.:\/]*(?:\.com|@|\w{3,})/i, "TikTok"],

    // Line — require specific context: "line id", "line @", "line: xxx", "line.me"
    [/(?:^|\s)line[\s]*(?:id\b|@|\.me)/i, "Line"],
    [/(?:^|\s)line[\s]*:[\s]*\w{2,}/i, "Line"],

    // WeChat / KakaoTalk — uncommon in English, safe with \b
    [/\b(?:wechat|kakaotalk|kakao)\b[\s.:\/]*(?:\.me|id|@|\w{3,})/i, "WeChat/Kakao"],

    // Skype — safe with \b
    [/\bskype\b[\s.:\/]*(?:\.com|@|:\s*\w{3,}|\w{3,})/i, "Skype"],

    // Discord — require server context: "discord.gg", "discord #", "discord @", "discord:"
    // Avoids "sow discord", "discord among members"
    [/\bdiscord[\s]*(?:\.gg|\.com|[@#:\/])/i, "Discord"],

    // Zoom — require meeting context: "zoom.us", "zoom meeting", "zoom link", "zoom id"
    // Avoids "zoom in", "zoom past", "zoom lens"
    [/\bzoom[\s]*(?:\.us|meeting|link|id\b|call\b)/i, "Zoom"],
    [/\bzoom[\s.:\/]*(?:\.us|\.com)/i, "Zoom"],

    // Generic @username (must start at whitespace/beginning, 3+ chars after @)
    [/(?:^|\s)@[a-zA-Z0-9._]{3,}/, "@handle"],
  ];

  for (const [pattern] of socialPatterns) {
    if (pattern.test(text)) return "social media accounts";
  }

  // ── URLs ──
  if (/(?:https?:\/\/|www\.)[^\s]+/i.test(text)) {
    return "links or URLs";
  }

  // ── Evasion phrases ──
  if (
    /\b(?:add|find|reach|contact|message|text|call|hit)\s+(?:me|us)\s+(?:on|at|in|via)\b/i.test(
      lower
    )
  ) {
    return "contact sharing";
  }
  if (
    /\b(?:my|here'?s?\s+my|send\s+(?:me\s+)?(?:your|ur))\s+(?:number|phone|cell|mobile|email|e-mail|ig|insta|fb|snap|tiktok|line\s+id|whatsapp|viber|telegram|discord|skype|account|handle|username)\b/i.test(
      lower
    )
  ) {
    return "contact sharing";
  }

  return null;
};
