// filepath: src/services/ai/local/contentModerator.ts
// Enhanced rule-based content moderation with anti-bullying, strictness levels, and anti-spam

export interface ModerationResult {
  approved: boolean;
  reason: string;
  category: 'workout' | 'nutrition' | 'progress' | 'tip' | 'motivation' | 'rejected';
  confidence: number;
  flags?: {
    bullying: boolean;
    spam: boolean;
    offTopic: boolean;
  };
}

const PROHIBITED_WORDS = [
  'hate', 'kill', 'violence', 'abuse', 'spam', 'scam', 'illegal', 'drugs', 'steroids', 'suicide', 'anorexia', 'bulimia',
  'terror', 'bomb', 'weapon', 'murder', 'assault'
];

const BULLYING_PATTERNS = [
  /\bhate\b.*\b(you|u)\b/i,
  /\b(stupid|loser|idiot|dumb|fat|ugly)\b/gi,
  /\b(kill|hurt|die|shut up)\b.*\b(you|u)\b/gi,
  /(go\s+)?fuck\s*(off|yourself)?/i,
  /\b(nobody|no\s+one)\s+likes\s+you/i,
  /\b(get\s+lost|disappear)\b/i,
  /[!]{3,}/, // excessive exclamation marks (harassment indicator)
  /^(ALL\s+)?CAPS\b/i, // all caps yelling
];

const FITNESS_KEYWORDS = [
  'workout', 'gym', 'exercise', 'run', 'lift', 'muscle', 'protein', 'diet', 'nutrition', 'calories', 'health', 'fitness',
  'yoga', 'stretch', 'cardio', 'squat', 'deadlift', 'bench', 'press', 'sets', 'reps', 'strength', 'endurance', 'training',
  'meal prep', 'macros', 'gains', 'cutting', 'bulking', 'rest day', 'active recovery', 'hiit', 'pilates', 'crossfit'
];

// Post cache for duplicate detection (in-memory, resets on app restart)
const recentPostsCache: Array<{ hash: number; userId: string; timestamp: number }> = [];
const MAX_CACHE_SIZE = 1000;
const SPAM_WINDOW_MS = 5 * 60 * 1000; // 5 minutes
const MAX_POSTS_PER_USER_IN_WINDOW = 3;

export class LocalContentModerator {
  // Simple text hash for duplicate detection
  private hashText(text: string): number {
    let h = 0;
    for (let i = 0; i < text.length; i++) {
      h = ((h << 5) - h) + text.charCodeAt(i);
      h = h & h;
    }
    return Math.abs(h);
  }

  moderatePost(
    text: string,
    options: { strictness?: 1 | 2 | 3; userId?: string } = {}
  ): ModerationResult {
    const { strictness = 1, userId = 'anonymous' } = options;
    const lower = text.toLowerCase().trim();

    // Empty posts are approved (maybe no text, just image)
    if (!lower) {
      return { approved: true, reason: 'Empty content', category: 'workout', confidence: 1 };
    }

    // 1. Check prohibited words (always reject)
    for (const word of PROHIBITED_WORDS) {
      if (lower.includes(word)) {
        return {
          approved: false,
          reason: `Contains prohibited content: "${word}"`,
          category: 'rejected',
          confidence: 0.9,
          flags: { bullying: false, spam: false, offTopic: false }
        };
      }
    }

    const flags: ModerationResult['flags'] = { bullying: false, spam: false, offTopic: false };

    // 2. Cyberbullying detection
    for (const pattern of BULLYING_PATTERNS) {
      if (pattern.test(text)) {
        flags.bullying = true;
        return {
          approved: false,
          reason: 'Content appears to contain bullying or harassment',
          category: 'rejected',
          confidence: 0.85,
          flags
        };
      }
    }

    // 3. Anti-spam checks
    const now = Date.now();
    // Clean old cache entries
    while (recentPostsCache.length > MAX_CACHE_SIZE || (recentPostsCache[0] && now - recentPostsCache[0].timestamp > SPAM_WINDOW_MS)) {
      recentPostsCache.shift();
    }

    // Rate limit: too many posts from same user
    const userRecentPosts = recentPostsCache.filter(entry => entry.userId === userId && now - entry.timestamp < SPAM_WINDOW_MS);
    if (userRecentPosts.length >= MAX_POSTS_PER_USER_IN_WINDOW) {
      flags.spam = true;
      return {
        approved: false,
        reason: 'Posting too quickly. Please wait before posting again.',
        category: 'rejected',
        confidence: 0.9,
        flags
      };
    }

    // Duplicate content detection
    const textHash = this.hashText(text);
    const duplicate = recentPostsCache.find(entry => entry.hash === textHash && now - entry.timestamp < SPAM_WINDOW_MS);
    if (duplicate) {
      flags.spam = true;
      return {
        approved: false,
        reason: 'Duplicate content detected',
        category: 'rejected',
        confidence: 0.95,
        flags
      };
    }

    // Add to cache for future duplicate checks
    recentPostsCache.push({ hash: textHash, userId, timestamp: now });

    // 4. Determine category based on keywords
    let matches = 0;
    for (const kw of FITNESS_KEYWORDS) {
      if (lower.includes(kw)) matches++;
    }

    if (matches === 0) {
      flags.offTopic = true;
      if (strictness >= 2) {
        return {
          approved: false,
          reason: 'Content does not appear related to fitness. Please include fitness-related topics.',
          category: 'rejected',
          confidence: 0.8,
          flags
        };
      }
      // Strictness 1 allows it but low confidence
      return {
        approved: true,
        reason: 'No fitness keywords detected, but allowed (strictness level 1)',
        category: 'tip',
        confidence: 0.3,
        flags
      };
    }

    // At strictness 2, require at least 2 fitness keyword matches
    if (strictness >= 2 && matches < 2) {
      return {
        approved: false,
        reason: 'Please include more fitness-related content (require at least 2 fitness terms)',
        category: 'rejected',
        confidence: 0.7,
        flags
      };
    }

    // At strictness 3, require category to be workout or nutrition only
    if (strictness >= 3) {
      const category = this.guessCategory(lower);
      if (category !== 'workout' && category !== 'nutrition') {
        return {
          approved: false,
          reason: 'Strict mode: only workout and nutrition posts allowed',
          category: 'rejected',
          confidence: 0.9,
          flags
        };
      }
    }

    // Approved
    return {
      approved: true,
      reason: 'Content appropriate for fitness community',
      category: this.guessCategory(lower),
      confidence: Math.min(0.9, 0.5 + matches * 0.1),
      flags
    };
  }

  guessCategory(text: string): 'workout' | 'nutrition' | 'progress' | 'tip' | 'motivation' {
    if (/\b(workout|gym|exercise|train|lifting|cardio|hiit|pilates)\b/.test(text)) return 'workout';
    if (/\b(food|eat|meal|diet|protein|calorie|nutrition|recipe|breakfast|lunch|dinner)\b/.test(text)) return 'nutrition';
    if (/\b(progress|photo|change|transform|before|after|loss|gain|strength)\b/.test(text)) return 'progress';
    if (/\b(tip|advice|how to|recommend|guide|tip)\b/.test(text)) return 'tip';
    return 'motivation';
  }
}

export default new LocalContentModerator();
