/**
 * ProfileForge Interactive Client Script
 * Handles real-time preview sync, 3D card tilt, sample loaders, and toast alerts.
 */

document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const profileForm = document.getElementById('profile-form');
  const liveTarget = document.getElementById('live-card-target');
  const bioInput = document.getElementById('bio');
  const charCount = document.getElementById('char-count');
  const wordCount = document.getElementById('word-count');
  const toastNotice = document.getElementById('toast-notice');
  const toastMessage = document.getElementById('toast-message');
  const avatarTabs = document.querySelectorAll('.avatar-tab-btn');
  const avatarContents = document.querySelectorAll('.avatar-tab-content');
  const avatarTypeInput = document.getElementById('avatar_type');
  const avatarFileInput = document.getElementById('avatar_file');
  const fileNamePreview = document.getElementById('file-name-preview');

  // Initialize 3D Card Tilt on all profile cards
  initCardTilt();

  // Initialize Bio Word Counter
  if (bioInput) {
    updateBioCounters();
    bioInput.addEventListener('input', updateBioCounters);
  }

  // Avatar Tab Switching
  if (avatarTabs.length > 0) {
    avatarTabs.forEach(btn => {
      btn.addEventListener('click', () => {
        avatarTabs.forEach(b => b.classList.remove('active'));
        avatarContents.forEach(c => c.classList.remove('active'));

        btn.classList.add('active');
        const tabKey = btn.dataset.tab;
        const targetContent = document.getElementById(`tab-${tabKey}`);
        if (targetContent) targetContent.classList.add('active');

        if (avatarTypeInput) {
          avatarTypeInput.value = tabKey;
        }

        // Trigger preview update
        triggerServerPreview();
      });
    });
  }

  // File Upload preview
  if (avatarFileInput) {
    avatarFileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        if (fileNamePreview) {
          fileNamePreview.textContent = `Selected: ${file.name} (${Math.round(file.size / 1024)} KB)`;
          fileNamePreview.style.display = 'block';
        }
        triggerServerPreview();
      }
    });
  }

  // Clickable Skill Suggestion Tags
  const suggestTags = document.querySelectorAll('.suggest-tag');
  const skillsInput = document.getElementById('skills');

  if (skillsInput && suggestTags.length > 0) {
    suggestTags.forEach(tag => {
      tag.addEventListener('click', () => {
        const skillText = tag.textContent.replace(/^\+\s*/, '').trim();
        let currentSkills = skillsInput.value
          .split(',')
          .map(s => s.trim())
          .filter(Boolean);

        // Case insensitive check
        const exists = currentSkills.some(s => s.toLowerCase() === skillText.toLowerCase());
        if (!exists) {
          currentSkills.push(skillText);
          skillsInput.value = currentSkills.join(', ');
          showToast(`Added skill: ${skillText}`);
          triggerServerPreview();
        } else {
          showToast(`"${skillText}" is already added!`);
        }
      });
    });
  }

  // Theme Change listener
  const themeRadios = document.querySelectorAll('input[name="theme"]');
  themeRadios.forEach(radio => {
    radio.addEventListener('change', () => {
      triggerServerPreview();
    });
  });

  // Sample Data Profiles
  const sampleData = {
    fullstack: {
      name: 'Elena Rostova',
      headline: 'Senior Full-Stack Architect & Cloud Specialist',
      bio: 'Architecting distributed systems and cloud-native applications. Passionate about developer tooling, performance engineering, and open-source software. #distributed #cloud #golang',
      skills: 'TypeScript, Node.js, Go, Docker, Kubernetes, AWS, PostgreSQL, GraphQL',
      github: 'elena-rostova',
      linkedin: 'elena-rostova-tech',
      twitter: '@elena_dev',
      website: 'https://elena.codes',
      email: 'elena@cloudcraft.io',
      theme: 'dark-glass',
      avatarSeed: 'Elena',
      avatarStyle: 'bottts'
    },
    ai: {
      name: 'Dr. Julian Thorne',
      headline: 'Principal AI Researcher & Machine Learning Engineer',
      bio: 'Investigating multimodal foundation models, reinforcement learning, and neuro-symbolic reasoning. Building safe and transparent artificial intelligence for tomorrow. #ai #neuralnetworks #deeplearning',
      skills: 'Python, PyTorch, JAX, CUDA, Docker, MLflow, FastAPI, TensorFlow',
      github: 'julian-thorne-ai',
      linkedin: 'dr-julian-thorne',
      twitter: '@thorne_ai',
      website: 'https://thorne-research.org',
      email: 'julian@thorne-labs.com',
      theme: 'cyber-neon',
      avatarSeed: 'Julian',
      avatarStyle: 'adventurer'
    },
    design: {
      name: 'Maya Lin',
      headline: 'Staff Product Designer & Design Systems Architect',
      bio: 'Designing visceral, delightful digital experiences with strict attention to typography, micro-interactions, and accessibility standards. Believer in form following feeling. #design #designsystems #ux',
      skills: 'Figma, UI/UX Design, CSS3, Design Systems, Prototyping, Next.js, Framer, User Research',
      github: 'mayalin-design',
      linkedin: 'mayalindesign',
      twitter: '@maya_pixels',
      website: 'https://mayalin.design',
      email: 'maya@designcraft.studio',
      theme: 'sunset-ember',
      avatarSeed: 'Maya',
      avatarStyle: 'lorelei'
    }
  };

  const sampleButtons = document.querySelectorAll('.sample-badge');
  sampleButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const sampleKey = btn.dataset.sample;
      const data = sampleData[sampleKey];
      if (!data) return;

      document.getElementById('full_name').value = data.name;
      document.getElementById('headline').value = data.headline;
      document.getElementById('bio').value = data.bio;
      document.getElementById('skills').value = data.skills;
      document.getElementById('github').value = data.github;
      document.getElementById('linkedin').value = data.linkedin;
      document.getElementById('twitter').value = data.twitter;
      document.getElementById('website').value = data.website;
      document.getElementById('email').value = data.email;

      // Select theme radio
      const themeRadio = document.querySelector(`input[name="theme"][value="${data.theme}"]`);
      if (themeRadio) themeRadio.checked = true;

      // Set avatar style and seed
      const styleSelect = document.getElementById('avatar_style');
      const seedInput = document.getElementById('avatar_seed');
      if (styleSelect) styleSelect.value = data.avatarStyle;
      if (seedInput) seedInput.value = data.avatarSeed;

      // Switch to avatar generator tab
      const dicebearTab = document.querySelector('.avatar-tab-btn[data-tab="dicebear"]');
      if (dicebearTab) dicebearTab.click();

      updateBioCounters();
      triggerServerPreview();
      showToast(`Loaded "${btn.textContent.trim()}" sample data!`);
    });
  });

  // Real-time Preview Server Synchronization
  let debounceTimeout = null;

  function triggerServerPreview() {
    if (!profileForm || !liveTarget) return;

    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(async () => {
      try {
        const formData = new FormData(profileForm);

        // Fetch dynamic card HTML from server endpoint
        const response = await fetch('/api/preview', {
          method: 'POST',
          body: formData
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success && result.html) {
            liveTarget.innerHTML = result.html;
            initCardTilt(); // Re-bind 3D tilt to new card
          }
        }
      } catch (err) {
        console.warn('Real-time preview fetch fallback:', err);
      }
    }, 280);
  }

  // Listen for typing on inputs for instant preview
  if (profileForm) {
    const inputsToWatch = profileForm.querySelectorAll('input:not([type="file"]):not([type="hidden"]), textarea, select');
    inputsToWatch.forEach(input => {
      input.addEventListener('input', triggerServerPreview);
    });
  }

  // Copy Link Buttons
  const copyBtns = document.querySelectorAll('#btn-copy-card-link, #btn-copy-link-main');
  copyBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const fullUrl = window.location.origin + (btn.dataset.url || window.location.pathname);
      navigator.clipboard.writeText(fullUrl).then(() => {
        showToast('Profile permalink copied to clipboard!');
      }).catch(() => {
        prompt('Copy this URL:', fullUrl);
      });
    });
  });

  // Helper: Update bio counters
  function updateBioCounters() {
    if (!bioInput || !charCount || !wordCount) return;
    const text = bioInput.value.trim();
    const chars = text.length;
    const words = text ? text.split(/\s+/).filter(Boolean).length : 0;
    const seconds = Math.max(5, Math.round((words / 200) * 60));
    const readEstimate = seconds < 60 ? `~${seconds}s read` : `~${Math.ceil(seconds / 60)}m read`;

    charCount.textContent = `${chars} characters`;
    wordCount.textContent = `${words} words • ${readEstimate}`;
  }

  // Helper: Interactive 3D Perspective Tilt on Mouse Movement
  function initCardTilt() {
    const cards = document.querySelectorAll('.profile-card');
    cards.forEach(card => {
      card.removeEventListener('mousemove', handleCardMouseMove);
      card.removeEventListener('mouseleave', handleCardMouseLeave);

      card.addEventListener('mousemove', handleCardMouseMove);
      card.addEventListener('mouseleave', handleCardMouseLeave);
    });
  }

  function handleCardMouseMove(e) {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -9; // Max 9 deg
    const rotateY = ((x - centerX) / centerX) * 9;

    card.style.transform = `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale3d(1.02, 1.02, 1.02)`;
  }

  function handleCardMouseLeave(e) {
    const card = e.currentTarget;
    card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
  }

  // Helper: Show Toast Notification
  function showToast(message) {
    if (!toastNotice || !toastMessage) return;
    toastMessage.textContent = message;
    toastNotice.classList.add('show');
    setTimeout(() => {
      toastNotice.classList.remove('show');
    }, 3200);
  }
});
