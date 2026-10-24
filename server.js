/**
 * Main Express Server
 * User Profile Card Generator
 */

const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const db = require('./database');
const {
  toTitleCase,
  extractInitials,
  generateSlug,
  processSkills,
  processBio,
  processSocialLinks,
  generateSvgAvatar
} = require('./utils/stringProcessor');

const app = express();
const PORT = process.env.PORT || 3000;

// Ensure public/uploads directory exists
const uploadDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer storage configuration for avatar uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeName = `avatar-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, safeName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 4 * 1024 * 1024 }, // 4MB max
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp|svg/;
    const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
    const mime = file.mimetype;
    if (allowed.test(ext) && (mime.startsWith('image/') || mime === 'image/svg+xml')) {
      return cb(null, true);
    }
    cb(new Error('Only image files (JPG, PNG, WebP, GIF, SVG) are allowed!'));
  }
});

// Setup EJS view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

/**
 * Helper to process raw form inputs through string manipulation pipeline
 */
function processProfileInput(body, file) {
  // 1. String manipulation: Name capitalization and trimming
  const formattedName = toTitleCase(body.full_name || 'Anonymous Creator');

  // 2. Headline formatting
  const formattedHeadline = (body.headline || 'Full-Stack Developer & Innovator').trim();

  // 3. String manipulation: Bio processing (word count, reading time, hashtags)
  const bioData = processBio(body.bio || '');

  // 4. String manipulation: Extract initials
  const initials = extractInitials(formattedName);

  // 5. String manipulation: Parse and categorize skills
  const skillsList = processSkills(body.skills || '');

  // 6. String manipulation: Format and normalize social links
  const socialLinks = processSocialLinks({
    github: body.github,
    linkedin: body.linkedin,
    twitter: body.twitter,
    website: body.website,
    email: body.email
  });

  // 7. Theme selection
  const theme = body.theme || 'dark-glass';

  // 8. Avatar handling
  let avatarUrl = '';
  let avatarType = body.avatar_type || 'dicebear';

  if (file && file.filename) {
    // Custom uploaded image
    avatarUrl = `/uploads/${file.filename}`;
    avatarType = 'uploaded';
  } else if (body.avatar_type === 'initials') {
    // SVG generated initials avatar
    avatarUrl = generateSvgAvatar(initials, theme);
    avatarType = 'initials';
  } else if (body.avatar_type === 'custom_url' && body.custom_avatar_url) {
    avatarUrl = body.custom_avatar_url.trim();
    avatarType = 'custom_url';
  } else {
    // DiceBear Avatar with selected style & seed
    const style = body.avatar_style || 'bottts';
    const seed = encodeURIComponent(body.avatar_seed || formattedName || 'seed');
    avatarUrl = `https://api.dicebear.com/7.x/${style}/svg?seed=${seed}`;
    avatarType = 'dicebear';
  }

  // 9. Generate unique slug
  const slug = generateSlug(formattedName);

  return {
    slug,
    full_name: formattedName,
    headline: formattedHeadline,
    bio: bioData.text,
    bioData,
    skills: skillsList,
    social_links: socialLinks,
    avatar_url: avatarUrl,
    avatar_type: avatarType,
    initials,
    theme,
    word_count: bioData.wordCount,
    reading_time: bioData.readingTime
  };
}

// Routes

// Home page: Form generator & Live Preview
app.get('/', (req, res) => {
  const recentProfiles = db.getAllProfiles().slice(0, 3);
  res.render('index', {
    title: 'ProfileForge — Modern User Profile Card Generator',
    recentProfiles,
    activeNav: 'create'
  });
});

// Server-side form processing route (POST)
// Processes input data, performs string manipulation, saves to SQLite DB,
// and returns dynamic HTML profile card response.
app.post('/create-card', upload.single('avatar_file'), (req, res) => {
  try {
    const processedData = processProfileInput(req.body, req.file);

    // Save record to SQLite database
    const savedProfile = db.createProfile(processedData);

    // If client requested JSON or AJAX response
    if (req.xhr || req.headers.accept?.includes('application/json')) {
      return res.json({
        success: true,
        redirectUrl: `/p/${savedProfile.slug}`,
        profile: savedProfile
      });
    }

    // Direct dynamic HTML response / redirect to permalink
    res.redirect(`/p/${savedProfile.slug}?created=1`);
  } catch (error) {
    console.error('Error creating profile card:', error);
    res.status(500).render('card-view', {
      title: 'Error Generating Card',
      error: 'Failed to process and generate profile card. Please try again.',
      profile: null,
      activeNav: 'create'
    });
  }
});

// Real-time server-side preview endpoint
app.post('/api/preview', upload.single('avatar_file'), (req, res) => {
  try {
    const processedData = processProfileInput(req.body, req.file);
    // Render dynamic partial HTML card
    res.render('partials/card', { profile: processedData, isPreview: true }, (err, html) => {
      if (err) {
        console.error('Render error:', err);
        return res.status(500).json({ error: 'Rendering error' });
      }
      res.json({
        success: true,
        html,
        data: processedData
      });
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// View dynamic profile card by slug permalink
app.get('/p/:slug', (req, res) => {
  const profile = db.getProfileBySlug(req.params.slug);
  if (!profile) {
    return res.status(404).render('card-view', {
      title: 'Profile Not Found',
      error: 'The requested profile card could not be found.',
      profile: null,
      activeNav: 'gallery'
    });
  }

  res.render('card-view', {
    title: `${profile.full_name} — Profile Card`,
    profile,
    created: req.query.created === '1',
    activeNav: 'card'
  });
});

// View dynamic profile card by ID
app.get('/profile/:id', (req, res) => {
  const profile = db.getProfileById(req.params.id);
  if (!profile) {
    return res.status(404).render('card-view', {
      title: 'Profile Not Found',
      error: 'The requested profile card could not be found.',
      profile: null,
      activeNav: 'gallery'
    });
  }
  res.redirect(`/p/${profile.slug}`);
});

// Showcase Gallery of all saved profiles
app.get('/gallery', (req, res) => {
  const search = req.query.q || '';
  const profiles = db.getAllProfiles(search);

  res.render('gallery', {
    title: 'Profile Gallery — Discover Dynamic Profile Cards',
    profiles,
    searchQuery: search,
    activeNav: 'gallery'
  });
});

// API endpoint to get all profiles JSON
app.get('/api/profiles', (req, res) => {
  const search = req.query.q || '';
  const profiles = db.getAllProfiles(search);
  res.json({ profiles });
});

// Delete profile route
app.post('/api/profiles/:id/delete', (req, res) => {
  const success = db.deleteProfile(req.params.id);
  if (req.xhr || req.headers.accept?.includes('application/json')) {
    return res.json({ success });
  }
  res.redirect('/gallery');
});

// Start the server
const server = app.listen(PORT, () => {
  console.log(`\n🚀 Profile Card Generator server running at: http://localhost:${PORT}`);
  console.log(`✨ Server-side form processing, string manipulation & SQLite active.\n`);
});

module.exports = { app, server };
