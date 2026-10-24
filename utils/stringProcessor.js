/**
 * String manipulation, sanitization, and formatting utilities
 * for the User Profile Card Generator.
 */

// Simple HTML entity escaping to prevent XSS
function sanitizeHtml(str) {
  if (!str || typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Convert a string to Title Case (e.g., "sarah jane connor" -> "Sarah Jane Connor")
function toTitleCase(str) {
  if (!str || typeof str !== 'string') return '';
  return str
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Extract uppercase initials from name (e.g. "John Doe" -> "JD", "Alan" -> "A")
function extractInitials(name) {
  if (!name || typeof name !== 'string') return 'U';
  const clean = name.trim().replace(/[^a-zA-Z\s]/g, '');
  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length === 0) return 'U';
  if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

// Generate URL slug from name (e.g. "John Doe" -> "john-doe-4a9b")
function generateSlug(name) {
  const base = (name || 'profile')
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'user';
  
  const randomSuffix = Math.random().toString(36).substring(2, 6);
  return `${base}-${randomSuffix}`;
}

// Parse, sanitize, trim, deduplicate and categorize skills
function processSkills(skillsInput) {
  if (!skillsInput) return [];
  
  let rawSkills = [];
  if (Array.isArray(skillsInput)) {
    rawSkills = skillsInput;
  } else if (typeof skillsInput === 'string') {
    // Support comma separated, semicolon separated, or newlines
    rawSkills = skillsInput.split(/[,;\n]+/);
  }

  const seen = new Set();
  const processed = [];

  for (let s of rawSkills) {
    const trimmed = s.trim();
    if (!trimmed) continue;
    const lower = trimmed.toLowerCase();
    if (!seen.has(lower)) {
      seen.add(lower);
      // Clean display name (keep capitalized conventions if recognized or capitalize first letter)
      const formatted = formatSkillName(trimmed);
      processed.push({
        name: formatted,
        slug: lower.replace(/\s+/g, '-'),
        colorClass: getSkillColorClass(formatted)
      });
    }
  }

  return processed;
}

// Standardize common tech casing (e.g. "javascript" -> "JavaScript", "nodejs" -> "Node.js")
function formatSkillName(str) {
  const dictionary = {
    'javascript': 'JavaScript',
    'js': 'JavaScript',
    'typescript': 'TypeScript',
    'ts': 'TypeScript',
    'nodejs': 'Node.js',
    'node.js': 'Node.js',
    'react': 'React',
    'react.js': 'React.js',
    'vue': 'Vue.js',
    'vuejs': 'Vue.js',
    'nextjs': 'Next.js',
    'next.js': 'Next.js',
    'html': 'HTML5',
    'html5': 'HTML5',
    'css': 'CSS3',
    'css3': 'CSS3',
    'python': 'Python',
    'docker': 'Docker',
    'kubernetes': 'Kubernetes',
    'k8s': 'Kubernetes',
    'aws': 'AWS',
    'gcp': 'GCP',
    'azure': 'Azure',
    'mongodb': 'MongoDB',
    'sql': 'SQL',
    'postgresql': 'PostgreSQL',
    'postgres': 'PostgreSQL',
    'sqlite': 'SQLite',
    'graphql': 'GraphQL',
    'rest': 'REST API',
    'rest api': 'REST API',
    'tailwind': 'Tailwind CSS',
    'git': 'Git',
    'github': 'GitHub',
    'figma': 'Figma',
    'ui/ux': 'UI/UX Design',
    'ui ux': 'UI/UX Design'
  };

  const key = str.toLowerCase();
  if (dictionary[key]) {
    return dictionary[key];
  }
  // Otherwise title case
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Generate consistent aesthetic color tag classes for skills
function getSkillColorClass(skillName) {
  const colors = [
    'badge-cyan',
    'badge-violet',
    'badge-emerald',
    'badge-amber',
    'badge-rose',
    'badge-indigo',
    'badge-sky'
  ];
  let hash = 0;
  for (let i = 0; i < skillName.length; i++) {
    hash = skillName.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

// Process and format bio: word count, reading time, extract hashtags, handle newlines
function processBio(bio) {
  if (!bio || typeof bio !== 'string') {
    return {
      text: '',
      cleanHtml: '',
      wordCount: 0,
      charCount: 0,
      readingTime: '10s read',
      hashtags: []
    };
  }

  const trimmed = bio.trim();
  const words = trimmed.split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const charCount = trimmed.length;

  // Reading time (~200 words per min)
  const seconds = Math.max(5, Math.round((wordCount / 200) * 60));
  const readingTime = seconds < 60 ? `${seconds}s read` : `${Math.ceil(seconds / 60)} min read`;

  // Extract hashtags (e.g. #developer, #web3)
  const hashtagMatches = trimmed.match(/#[a-zA-Z0-9_]+/g) || [];
  const hashtags = Array.from(new Set(hashtagMatches.map(h => h.toLowerCase())));

  // Clean HTML escaping with preserved line breaks
  const cleanHtml = sanitizeHtml(trimmed).replace(/\n/g, '<br/>');

  return {
    text: trimmed,
    cleanHtml,
    wordCount,
    charCount,
    readingTime,
    hashtags
  };
}

// Normalize social link URLs and handles
function processSocialLinks(links = {}) {
  const processed = {};

  // GitHub
  if (links.github) {
    let gh = links.github.trim();
    if (gh) {
      // Remove trailing slash
      gh = gh.replace(/\/+$/, '');
      let handle = gh;
      if (gh.includes('github.com/')) {
        handle = gh.split('github.com/').pop().replace(/[@/]/g, '');
      } else {
        handle = gh.replace(/^@/, '');
      }
      processed.github = {
        url: `https://github.com/${handle}`,
        handle: `@${handle}`
      };
    }
  }

  // LinkedIn
  if (links.linkedin) {
    let li = links.linkedin.trim();
    if (li) {
      li = li.replace(/\/+$/, '');
      let handle = li;
      if (li.includes('linkedin.com/in/')) {
        handle = li.split('linkedin.com/in/').pop().replace(/[/]/g, '');
      } else {
        handle = li.replace(/^@/, '');
      }
      processed.linkedin = {
        url: li.startsWith('http') ? li : `https://linkedin.com/in/${handle}`,
        handle: handle.length > 20 ? `${handle.substring(0, 18)}...` : handle
      };
    }
  }

  // Twitter / X
  if (links.twitter) {
    let tw = links.twitter.trim();
    if (tw) {
      tw = tw.replace(/\/+$/, '');
      let handle = tw;
      if (tw.includes('twitter.com/')) {
        handle = tw.split('twitter.com/').pop().replace(/[@/]/g, '');
      } else if (tw.includes('x.com/')) {
        handle = tw.split('x.com/').pop().replace(/[@/]/g, '');
      } else {
        handle = tw.replace(/^@/, '');
      }
      processed.twitter = {
        url: `https://x.com/${handle}`,
        handle: `@${handle}`
      };
    }
  }

  // Portfolio / Website
  if (links.website) {
    let site = links.website.trim();
    if (site) {
      if (!/^https?:\/\//i.test(site)) {
        site = 'https://' + site;
      }
      try {
        const parsed = new URL(site);
        processed.website = {
          url: site,
          handle: parsed.hostname.replace(/^www\./, '')
        };
      } catch {
        processed.website = {
          url: site,
          handle: site.replace(/^https?:\/\//, '')
        };
      }
    }
  }

  // Email
  if (links.email) {
    let em = links.email.trim();
    if (em && em.includes('@')) {
      processed.email = {
        url: `mailto:${em}`,
        handle: em
      };
    }
  }

  return processed;
}

// Generate SVG Avatar data URI if no external avatar is selected
function generateSvgAvatar(initials, theme = 'dark-glass') {
  const gradientMap = {
    'dark-glass': ['#06b6d4', '#8b5cf6'],
    'cyber-neon': ['#ec4899', '#8b5cf6'],
    'sunset-ember': ['#f97316', '#e11d48'],
    'emerald-luxe': ['#10b981', '#06b6d4'],
    'midnight-aurora': ['#3b82f6', '#9333ea']
  };

  const colors = gradientMap[theme] || gradientMap['dark-glass'];

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
    <defs>
      <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${colors[0]}"/>
        <stop offset="100%" stop-color="${colors[1]}"/>
      </linearGradient>
      <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="6" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over"/>
      </filter>
    </defs>
    <rect width="120" height="120" rx="60" fill="url(#grad)" />
    <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(255,255,255,0.25)" stroke-width="2" />
    <text x="50%" y="54%" font-family="'Outfit', 'Plus Jakarta Sans', system-ui, sans-serif" font-weight="700" font-size="44" fill="#ffffff" text-anchor="middle" dominant-baseline="middle" letter-spacing="1">
      ${initials}
    </text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

module.exports = {
  sanitizeHtml,
  toTitleCase,
  extractInitials,
  generateSlug,
  processSkills,
  formatSkillName,
  getSkillColorClass,
  processBio,
  processSocialLinks,
  generateSvgAvatar
};
