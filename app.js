/**
 * BADSTYLE PHOTOGRAPHY - INTERACTION ENGINE
 * Inspired by Pheebs - Creative Photography Template by Elemis
 */

(function () {
  'use strict';

  // --- State ---
  const state = {
    currentRoute: 'portrait',
    currentLayout: 'horizontal', // 'horizontal' | 'grid'
    theme: localStorage.getItem('badstyle_theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'),
    lightbox: {
      isOpen: false,
      galleryKey: 'portrait',
      currentIndex: 0
    },
    animatedCountersDone: false
  };

  // --- DOM Elements ---
  const htmlEl = document.documentElement;
  const navbarEl = document.querySelector('.navbar');
  const navLinks = document.querySelectorAll('.nav-link, .mobile-nav-link');
  const pageViews = document.querySelectorAll('.page-view');
  const themeToggleBtn = document.getElementById('theme-toggle-btn');
  const layoutToggleBtn = document.getElementById('layout-toggle-btn');
  const mobileToggleBtn = document.getElementById('mobile-toggle-btn');
  const mobileDrawer = document.getElementById('mobile-drawer');
  const footerBar = document.querySelector('.footer-bar');
  const footerHint = document.querySelector('.footer-center');

  // Lightbox elements
  const lightboxModal = document.getElementById('lightbox-modal');
  const lightboxImage = document.getElementById('lightbox-image');
  const lightboxTitle = document.getElementById('lightbox-title');
  const lightboxCounter = document.getElementById('lightbox-counter');
  const lightboxCategory = document.getElementById('lightbox-category');
  const lightboxCloseBtn = document.getElementById('lightbox-close-btn');
  const lightboxPrevBtn = document.getElementById('lightbox-prev-btn');
  const lightboxNextBtn = document.getElementById('lightbox-next-btn');

  // ==========================================================================
  // INITIALIZATION & THEMING
  // ==========================================================================
  function initTheme() {
    htmlEl.setAttribute('data-theme', state.theme);
    updateThemeIcon();
  }

  function toggleTheme() {
    state.theme = state.theme === 'light' ? 'dark' : 'light';
    htmlEl.setAttribute('data-theme', state.theme);
    localStorage.setItem('badstyle_theme', state.theme);
    updateThemeIcon();
  }

  function updateThemeIcon() {
    if (!themeToggleBtn) return;
    const isDark = state.theme === 'dark';
    themeToggleBtn.innerHTML = isDark
      ? `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`
      : `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;
    themeToggleBtn.setAttribute('aria-label', isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme');
  }

  // ==========================================================================
  // PORTFOLIO GALLERIES RENDERING
  // ==========================================================================
  function renderGalleries() {
    renderSingleGallery('portrait', SITE_DATA.galleries.portrait);
    renderSingleGallery('advertorial', SITE_DATA.galleries.advertorial);
  }

  function renderSingleGallery(galleryKey, items) {
    const viewContainer = document.getElementById(`view-${galleryKey}`);
    if (!viewContainer) return;

    const viewport = viewContainer.querySelector('.gallery-viewport');
    if (!viewport) return;

    // Horizontal track
    const track = viewport.querySelector('.horizontal-track');
    // Grid container
    const grid = viewport.querySelector('.grid-container');

    track.innerHTML = '';
    grid.innerHTML = '';

    items.forEach((item, index) => {
      // 1. Horizontal Item
      const hItem = document.createElement('div');
      hItem.className = 'gallery-item';
      hItem.setAttribute('role', 'button');
      hItem.setAttribute('tabindex', '0');
      hItem.setAttribute('aria-label', item.title);
      hItem.innerHTML = `
        <img src="${item.src}" alt="${item.title}" loading="${index < 4 ? 'eager' : 'lazy'}" />
        <div class="item-overlay">
          <div class="item-title">${item.title}</div>
          <div class="item-meta">${item.category} · ${item.year}</div>
        </div>
      `;
      hItem.addEventListener('click', () => openLightbox(galleryKey, index));
      hItem.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openLightbox(galleryKey, index);
        }
      });
      track.appendChild(hItem);

      // 2. Grid Item
      const gItem = document.createElement('div');
      const isWide = parseFloat(item.aspectRatio) > 1.2;
      const isSquare = Math.abs(parseFloat(item.aspectRatio) - 1.0) < 0.1;
      gItem.className = `grid-item ${isWide ? 'wide' : isSquare ? 'square' : ''}`;
      gItem.setAttribute('role', 'button');
      gItem.setAttribute('tabindex', '0');
      gItem.setAttribute('aria-label', item.title);
      gItem.innerHTML = `
        <img src="${item.src}" alt="${item.title}" loading="lazy" />
        <div class="item-overlay">
          <div class="item-title">${item.title}</div>
          <div class="item-meta">${item.category} · ${item.year}</div>
        </div>
      `;
      gItem.addEventListener('click', () => openLightbox(galleryKey, index));
      gItem.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openLightbox(galleryKey, index);
        }
      });
      grid.appendChild(gItem);
    });

    setupHorizontalScroll(track);
  }

  // ==========================================================================
  // HORIZONTAL SCROLL PHYSICS (WHEEL & DRAG-TO-SCROLL)
  // ==========================================================================
  function setupHorizontalScroll(track) {
    let isDown = false;
    let startX = 0;
    let scrollLeft = 0;
    let velX = 0;
    let momentumID = null;

    // Mouse Wheel: Translate vertical wheel to horizontal scroll
    track.addEventListener('wheel', (e) => {
      // Only horizontal scroll if we aren't at track extremes or holding Shift
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        e.preventDefault();
        track.scrollLeft += e.deltaY * 1.5;
      }
    }, { passive: false });

    // Drag to scroll
    track.addEventListener('mousedown', (e) => {
      isDown = true;
      track.classList.add('is-dragging');
      startX = e.pageX - track.offsetLeft;
      scrollLeft = track.scrollLeft;
      cancelAnimationFrame(momentumID);
    });

    window.addEventListener('mouseup', () => {
      if (!isDown) return;
      isDown = false;
      track.classList.remove('is-dragging');
    });

    track.addEventListener('mousemove', (e) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - track.offsetLeft;
      const walk = (x - startX) * 1.5;
      const prevScroll = track.scrollLeft;
      track.scrollLeft = scrollLeft - walk;
      velX = track.scrollLeft - prevScroll;
    });

    track.addEventListener('mouseleave', () => {
      if (isDown) {
        isDown = false;
        track.classList.remove('is-dragging');
      }
    });
  }

  // ==========================================================================
  // ABOUT PAGE RENDERING & ANIMATED COUNTERS
  // ==========================================================================
  function renderAboutPage() {
    const aboutData = SITE_DATA.about;

    // Hero Image
    const heroImgEl = document.getElementById('about-hero-img');
    if (heroImgEl) {
      heroImgEl.src = aboutData.heroImage;
      heroImgEl.alt = "Badstyle Photography Portrait";
    }

    // Facts / Numbers Grid
    const factsGrid = document.getElementById('about-facts-grid');
    if (factsGrid) {
      factsGrid.innerHTML = aboutData.facts.map(fact => `
        <div class="fact-item">
          <div class="fact-number-row">
            <span class="fact-number" data-target="${fact.number}">0</span>
            <span class="fact-suffix">${fact.suffix}</span>
          </div>
          <div class="fact-title">${fact.title}</div>
          <div class="fact-desc">${fact.description}</div>
        </div>
      `).join('');
    }

    // Disciplines
    const disciplinesGrid = document.getElementById('about-disciplines-grid');
    if (disciplinesGrid) {
      disciplinesGrid.innerHTML = aboutData.disciplines.map(d => `
        <div class="discipline-card">
          <span class="discipline-num">${d.number}</span>
          <h3 class="discipline-title">${d.title}</h3>
          <p class="discipline-desc">${d.description}</p>
        </div>
      `).join('');
    }

    // Ticker Marquee Banner
    const tickerTrack = document.getElementById('about-ticker-track');
    if (tickerTrack) {
      const phrase = `${aboutData.ticker} <span class="ticker-star">✦</span> `;
      tickerTrack.innerHTML = Array(8).fill(`<span class="ticker-item">${phrase}</span>`).join('');
    }

    // Awards Table
    const awardsTable = document.getElementById('about-awards-table');
    if (awardsTable) {
      awardsTable.innerHTML = aboutData.awards.map(a => `
        <div class="award-row">
          <div class="award-project">${a.project}</div>
          <div class="award-meta">
            <span class="award-name">${a.recognition}</span>
            <span class="award-badge">${a.category}</span>
          </div>
        </div>
      `).join('');
    }

    // Testimonial
    const testimonialQuote = document.getElementById('about-testimonial-quote');
    const testimonialAuthor = document.getElementById('about-testimonial-author');
    if (testimonialQuote && testimonialAuthor && aboutData.testimonial) {
      testimonialQuote.textContent = aboutData.testimonial.quote;
      testimonialAuthor.innerHTML = `
        <div class="testimonial-stars" style="color: #ffb400; letter-spacing: 3px; font-size: 1.15rem; margin-bottom: 0.5rem;">★★★★★</div>
        <span class="author-name">${aboutData.testimonial.author}</span>
        <span class="author-role">${aboutData.testimonial.role}</span>
      `;
    }

    setupCountersObserver();
  }

  function setupCountersObserver() {
    const factsSection = document.getElementById('about-facts-grid');
    if (!factsSection) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !state.animatedCountersDone) {
          state.animatedCountersDone = true;
          animateCounters();
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.25 });

    observer.observe(factsSection);
  }

  function animateCounters() {
    const counters = document.querySelectorAll('.fact-number');
    counters.forEach(counter => {
      const target = parseInt(counter.getAttribute('data-target'), 10) || 0;
      const duration = 1600;
      const startTime = performance.now();

      function updateNumber(now) {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // Easing out cubic
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const current = Math.floor(easeOut * target);
        counter.textContent = current.toLocaleString();

        if (progress < 1) {
          requestAnimationFrame(updateNumber);
        } else {
          counter.textContent = target.toLocaleString();
        }
      }

      requestAnimationFrame(updateNumber);
    });
  }

  // ==========================================================================
  // CONTACT PAGE RENDERING & INTERACTION
  // ==========================================================================
  function renderContactPage() {
    const contactData = SITE_DATA.contact;

    // FAQs Accordion
    const faqList = document.getElementById('contact-faq-list');
    if (faqList) {
      faqList.innerHTML = contactData.faqs.map((faq, i) => `
        <div class="accordion-item" id="faq-item-${i}">
          <button class="accordion-trigger" aria-expanded="false" aria-controls="faq-ans-${i}">
            <span>${faq.question}</span>
            <span class="accordion-icon">
              <span></span>
              <span></span>
            </span>
          </button>
          <div class="accordion-content" id="faq-ans-${i}">
            <div class="accordion-inner">
              <p>${faq.answer}</p>
            </div>
          </div>
        </div>
      `).join('');

      setupAccordion(faqList);
    }

    setupContactForm();
  }

  function setupAccordion(container) {
    const triggers = container.querySelectorAll('.accordion-trigger');
    triggers.forEach(trigger => {
      trigger.addEventListener('click', () => {
        const item = trigger.closest('.accordion-item');
        const content = item.querySelector('.accordion-content');
        const isOpen = item.classList.contains('open');

        // Close other items
        container.querySelectorAll('.accordion-item').forEach(other => {
          if (other !== item && other.classList.contains('open')) {
            other.classList.remove('open');
            other.querySelector('.accordion-trigger').setAttribute('aria-expanded', 'false');
            other.querySelector('.accordion-content').style.maxHeight = null;
          }
        });

        // Toggle current item
        if (isOpen) {
          item.classList.remove('open');
          trigger.setAttribute('aria-expanded', 'false');
          content.style.maxHeight = null;
        } else {
          item.classList.add('open');
          trigger.setAttribute('aria-expanded', 'true');
          content.style.maxHeight = content.scrollHeight + 'px';
        }
      });
    });
  }

  function setupContactForm() {
    const form = document.getElementById('contact-form');
    const feedback = document.getElementById('form-feedback');
    if (!form || !feedback) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();

      // Check privacy checkbox
      const privacyCheck = document.getElementById('contact-privacy');
      if (privacyCheck && !privacyCheck.checked) {
        feedback.className = 'form-feedback';
        feedback.style.display = 'block';
        feedback.style.backgroundColor = 'rgba(211, 47, 47, 0.12)';
        feedback.style.color = '#d32f2f';
        feedback.style.borderColor = 'rgba(211, 47, 47, 0.3)';
        feedback.innerHTML = '<strong>Required:</strong> Please check the privacy & confidentiality acknowledgment before submitting.';
        privacyCheck.focus();
        return;
      }

      const submitBtn = form.querySelector('.submit-btn');
      const originalText = submitBtn.innerHTML;

      submitBtn.disabled = true;
      submitBtn.innerHTML = `
        <svg style="animation: spin 1s linear infinite; width: 16px; height: 16px;" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <circle cx="12" cy="12" r="10" stroke-opacity="0.25"/>
          <path d="M12 2a10 10 0 0 1 10 10"/>
        </svg> Submitting Booking Inquiry...
      `;

      const clientName = document.getElementById('contact-name')?.value || 'Client';
      const chosenCollection = document.getElementById('contact-collection')?.value || 'Selected Collection';
      const chosenAesthetic = document.getElementById('contact-aesthetic')?.value || 'Custom Vibe';

      setTimeout(() => {
        form.reset();
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
        feedback.className = 'form-feedback success';
        feedback.style.display = 'block';
        feedback.style.backgroundColor = '';
        feedback.style.color = '';
        feedback.style.borderColor = '';
        feedback.innerHTML = `
          <strong>Inquiry Confirmed, ${clientName}!</strong><br>
          We received your request for <em>${chosenCollection}</em> focusing on <em>${chosenAesthetic}</em>.<br>
          Your session details and images are held under strict 100% confidentiality. We will be in touch within 24 hours to schedule your private styling consultation.
        `;
        feedback.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

        setTimeout(() => {
          feedback.style.display = 'none';
        }, 12000);
      }, 1200);
    });
  }


  // ==========================================================================
  // THE CLIENT EXPERIENCE & INVESTMENT RENDERING
  // ==========================================================================
  function renderExperiencePage() {
    const expData = SITE_DATA.experience;
    const invData = SITE_DATA.investment;
    const faqs = SITE_DATA.clientGuideFaqs;

    // 1. Render 4-Step Transformation Cards (Editorial No-Photo Layout)
    const stepsGrid = document.getElementById('experience-steps-grid');
    if (stepsGrid && expData && expData.steps) {
      stepsGrid.innerHTML = expData.steps.map(step => `
        <article class="step-card">
          <div class="step-card-header">
            <span class="step-num-badge">${step.step}</span>
            <span class="step-card-subtitle">${step.subtitle}</span>
          </div>
          <div class="step-card-body">
            <h3 class="step-card-title">${step.title}</h3>
            <p class="step-card-desc">${step.description}</p>
          </div>
        </article>
      `).join('');
    }

    // 2. Render 3-Tier Investment Pricing Cards
    const tiersGrid = document.getElementById('investment-tiers-grid');
    if (tiersGrid && invData && invData.tiers) {
      tiersGrid.innerHTML = invData.tiers.map(tier => `
        <div class="pricing-card ${tier.highlight ? 'featured' : ''}" id="tier-${tier.id}">
          <div>
            <span class="pricing-card-badge">${tier.badge}</span>
            <h3 class="pricing-card-name">${tier.name}</h3>
            <div class="pricing-card-price-row">
              <span class="pricing-card-price">${tier.price}</span>
              <span class="pricing-card-period">/ all-inclusive</span>
            </div>
            <p class="pricing-card-summary">${tier.summary}</p>
            <ul class="pricing-features-list">
              ${tier.inclusions.map(inc => `
                <li class="pricing-feature-item">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  <span>${inc}</span>
                </li>
              `).join('')}
            </ul>
          </div>
          <button type="button" class="pricing-book-btn" data-collection="${tier.name} (${tier.price})">
            ${tier.buttonText}
          </button>
        </div>
      `).join('');

      // Setup click listeners on pricing buttons to route to #contact with selected tier
      tiersGrid.querySelectorAll('.pricing-book-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const collectionVal = btn.getAttribute('data-collection');
          navigateTo('#contact');
          const collectionSelect = document.getElementById('contact-collection');
          if (collectionSelect) {
            // Find option containing collection name
            for (let i = 0; i < collectionSelect.options.length; i++) {
              if (collectionSelect.options[i].text.toLowerCase().includes(collectionVal.split(' ')[1].toLowerCase())) {
                collectionSelect.selectedIndex = i;
                break;
              }
            }
          }
          // Scroll to form smoothly
          setTimeout(() => {
            const formEl = document.getElementById('contact-form');
            if (formEl) formEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }, 150);
        });
      });
    }

    // 3. Render Client Guide FAQs
    const faqList = document.getElementById('experience-faq-list');
    if (faqList && faqs) {
      faqList.innerHTML = faqs.map((faq, i) => `
        <div class="accordion-item" id="exp-faq-item-${i}">
          <button class="accordion-trigger" aria-expanded="false" aria-controls="exp-faq-ans-${i}">
            <span>${faq.question}</span>
            <span class="accordion-icon">
              <span></span>
              <span></span>
            </span>
          </button>
          <div class="accordion-content" id="exp-faq-ans-${i}">
            <div class="accordion-inner">
              <p>${faq.answer}</p>
            </div>
          </div>
        </div>
      `).join('');

      setupAccordion(faqList);
    }
  }

  // ==========================================================================
  // EDITORIAL JOURNAL & CLIENT LOVE NOTES
  // ==========================================================================
  function renderJournalPage() {
    const journalData = SITE_DATA.journal;
    const loveNotes = SITE_DATA.loveNotes;

    // 1. Render 3 Journal Articles
    const journalGrid = document.getElementById('journal-cards-grid');
    if (journalGrid && journalData) {
      journalGrid.innerHTML = journalData.map(post => `
        <article class="journal-card" data-article-id="${post.id}" tabindex="0" role="button" aria-label="Read ${post.title}">
          <div class="journal-cover-wrap">
            <img src="${post.coverImage}" alt="${post.title}" loading="lazy" />
          </div>
          <div class="journal-card-body">
            <div>
              <div class="journal-meta-row">
                <span>${post.date}</span>
                <span>·</span>
                <span>${post.readTime}</span>
              </div>
              <h3 class="journal-card-title">${post.title}</h3>
              <p class="journal-card-excerpt">${post.excerpt}</p>
            </div>
            <span class="journal-read-link">Read Full Story &rarr;</span>
          </div>
        </article>
      `).join('');

      journalGrid.querySelectorAll('.journal-card').forEach(card => {
        const id = card.getAttribute('data-article-id');
        card.addEventListener('click', () => openJournalModal(id));
        card.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            openJournalModal(id);
          }
        });
      });
    }

    // 2. Render Client Love Notes (Testimonial Cards)
    const loveNotesGrid = document.getElementById('love-notes-grid');
    if (loveNotesGrid && loveNotes) {
      loveNotesGrid.innerHTML = loveNotes.map(note => `
        <div class="love-note-card">
          <div class="love-note-header">
            <div class="love-note-stars">${'★'.repeat(note.rating || 5)}</div>
            <span class="love-note-date">${note.date || ''}</span>
          </div>
          <p class="love-note-quote">&ldquo;${note.quote}&rdquo;</p>
          <div class="love-note-footer">
            <div class="love-note-author-info">
              <span class="love-note-author">${note.author}</span>
              <span class="love-note-role">${note.role}</span>
            </div>
            <span class="love-note-tag">${note.collection}</span>
          </div>
        </div>
      `).join('');
    }
  }

  // ==========================================================================
  // BADSTYLE REDBUBBLE SHOP RENDERING & FILTERING
  // ==========================================================================
  function renderShopPage() {
    const shopData = SITE_DATA.shop;
    const grid = document.getElementById('shop-products-grid');
    if (!grid || !shopData) return;

    function filterMatches(item, filter) {
      if (filter === 'all') return true;
      const cat = (item.category || '').toLowerCase();
      if (filter === 'prints') return cat.includes('print') || cat.includes('poster') || cat.includes('wall') || cat.includes('canvas');
      if (filter === 'stickers') return cat.includes('sticker') || cat.includes('magnet');
      if (filter === 'apparel') return cat.includes('apparel') || cat.includes('tee') || cat.includes('street');
      return true;
    }

    function displayProducts(activeFilter) {
      const filtered = shopData.filter(item => filterMatches(item, activeFilter));
      
      grid.innerHTML = filtered.map(item => `
        <article class="shop-product-card" id="${item.id}">
          <div class="shop-card-visual">
            <div class="shop-card-badge-row">
              <span class="shop-badge">${item.badge}</span>
              <span class="shop-cat-tag">${item.category}</span>
            </div>
            <div class="shop-visual-art">
              <span class="shop-art-brand">BADSTYLE · RELEASES</span>
              <h4 class="shop-art-title">${item.title}</h4>
              <span class="shop-art-edition">Archival Fine Art &amp; Street Merch</span>
            </div>
          </div>
          <div class="shop-card-body">
            <div class="shop-card-header">
              <span class="shop-product-price">${item.price}</span>
              <span class="shop-fulfillment">Redbubble Fulfillment</span>
            </div>
            <h3 class="shop-product-title">${item.title}</h3>
            <p class="shop-product-subtitle">${item.subtitle}</p>
            <p class="shop-product-desc">${item.description}</p>
            <div class="shop-card-footer">
              <a href="${item.redbubbleUrl}" target="_blank" rel="noopener noreferrer" class="shop-buy-btn">
                <span>Finish Purchase on Redbubble</span>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                  <polyline points="15 3 21 3 21 9"></polyline>
                  <line x1="10" y1="14" x2="21" y2="3"></line>
                </svg>
              </a>
            </div>
          </div>
        </article>
      `).join('');
    }

    displayProducts('all');

    // Filter Buttons
    const filterBtns = document.querySelectorAll('.shop-filter-btn');
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const filter = btn.getAttribute('data-filter') || 'all';
        displayProducts(filter);
      });
    });
  }

  // ==========================================================================
  // BOUDOIR PHOTOGRAPHY BLOG & AUTOMATED WEEKLY FEED
  // ==========================================================================
  function renderBlogPage() {
    const articlesGrid = document.getElementById('blog-articles-grid');
    const feedStatus = document.getElementById('blog-feed-status');
    const syncBtn = document.getElementById('blog-sync-btn');
    const filterBtns = document.querySelectorAll('.blog-filter-btn');

    let currentArticles = (SITE_DATA.blogFeed && SITE_DATA.blogFeed.articles) ? SITE_DATA.blogFeed.articles : [];
    let activeCategory = 'all';

    function displayArticles(articles, category) {
      if (!articlesGrid) return;
      const filtered = category === 'all'
        ? articles
        : articles.filter(a => a.category && a.category.toLowerCase().includes(category.toLowerCase()));

      if (filtered.length === 0) {
        articlesGrid.innerHTML = `
          <div class="blog-empty-state">
            <p>No articles found under "${category}". Explore other boudoir topics above or check back after the next weekly sync.</p>
          </div>
        `;
        return;
      }

      articlesGrid.innerHTML = filtered.map(article => `
        <article class="blog-article-card" id="${article.id}">
          <div class="blog-card-meta-top">
            <div class="blog-source-pill">
              <span class="source-icon">${article.sourceIcon || 'B'}</span>
              <span class="source-name">${article.source}</span>
            </div>
            <span class="blog-category-tag">${article.category}</span>
          </div>
          <div class="blog-card-body">
            <div class="blog-time-row">
              <span>${article.date}</span>
              <span>·</span>
              <span>${article.readTime}</span>
            </div>
            <h3 class="blog-article-title">
              <a href="${article.url}" target="_blank" rel="noopener noreferrer">${article.title}</a>
            </h3>
            <p class="blog-article-excerpt">${article.excerpt}</p>
            ${article.keyPoints && article.keyPoints.length ? `
              <div class="blog-keypoints">
                <span class="keypoints-title">Core Key Takeaways:</span>
                <ul>
                  ${article.keyPoints.map(kp => `<li>${kp}</li>`).join('')}
                </ul>
              </div>
            ` : ''}
          </div>
          <div class="blog-card-footer">
            <a href="${article.url}" target="_blank" rel="noopener noreferrer" class="blog-external-link">
              <span>Read Full Article on ${article.source}</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                <polyline points="15 3 21 3 21 9"></polyline>
                <line x1="10" y1="14" x2="21" y2="3"></line>
              </svg>
            </a>
          </div>
        </article>
      `).join('');
    }

    // Attempt to load from JSON file first, falling back to SITE_DATA.blogFeed
    fetch('data/blog_feed.json')
      .then(res => {
        if (!res.ok) throw new Error('File not accessible');
        return res.json();
      })
      .then(data => {
        if (data && data.articles && data.articles.length) {
          currentArticles = data.articles;
          if (feedStatus && data.lastScraped) {
            feedStatus.textContent = `Scraped Weekly · ${data.articles.length} Boudoir Articles Live (${data.lastScraped})`;
          }
          displayArticles(currentArticles, activeCategory);
        }
      })
      .catch(() => {
        displayArticles(currentArticles, activeCategory);
      });

    displayArticles(currentArticles, activeCategory);

    // Filter tab clicks
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeCategory = btn.getAttribute('data-category') || 'all';
        displayArticles(currentArticles, activeCategory);
      });
    });

    // Manual Refresh / Sync Button
    if (syncBtn) {
      syncBtn.addEventListener('click', () => {
        const icon = syncBtn.querySelector('svg');
        if (icon) icon.style.animation = 'spin 0.8s linear infinite';
        syncBtn.disabled = true;

        fetch(`data/blog_feed.json?t=${Date.now()}`)
          .then(res => res.json())
          .then(data => {
            if (data && data.articles) {
              currentArticles = data.articles;
              displayArticles(currentArticles, activeCategory);
              if (feedStatus) {
                feedStatus.textContent = `Feed Refreshed · ${data.articles.length} Boudoir Articles Live`;
              }
            }
          })
          .catch(err => {
            console.warn('Feed refresh note:', err);
          })
          .finally(() => {
            setTimeout(() => {
              if (icon) icon.style.animation = '';
              syncBtn.disabled = false;
            }, 750);
          });
      });
    }
  }

  // ==========================================================================
  // ARTICLE READER MODAL LOGIC
  // ==========================================================================
  // ==========================================================================
  function setupJournalModal() {
    const modal = document.getElementById('journal-modal');
    const closeBtn = document.getElementById('journal-modal-close-btn');
    const ctaBookBtn = document.getElementById('journal-cta-book-btn');
    if (!modal) return;

    if (closeBtn) closeBtn.addEventListener('click', closeJournalModal);
    if (ctaBookBtn) {
      ctaBookBtn.addEventListener('click', () => {
        closeJournalModal();
        navigateTo('#contact');
      });
    }

    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeJournalModal();
    });

    window.addEventListener('keydown', (e) => {
      if (modal.classList.contains('open') && e.key === 'Escape') {
        closeJournalModal();
      }
    });
  }

  function openJournalModal(articleId) {
    const post = SITE_DATA.journal.find(j => j.id === articleId);
    if (!post) return;

    const modal = document.getElementById('journal-modal');
    const titleEl = document.getElementById('journal-modal-title');
    const subtitleEl = document.getElementById('journal-modal-subtitle');
    const dateEl = document.getElementById('journal-modal-date');
    const readtimeEl = document.getElementById('journal-modal-readtime');
    const coverEl = document.getElementById('journal-modal-cover');
    const contentEl = document.getElementById('journal-modal-content');

    if (titleEl) titleEl.textContent = post.title;
    if (subtitleEl) subtitleEl.textContent = post.subtitle;
    if (dateEl) dateEl.textContent = post.date;
    if (readtimeEl) readtimeEl.textContent = post.readTime;
    if (coverEl) {
      coverEl.src = post.coverImage;
      coverEl.alt = post.title;
    }
    if (contentEl) {
      contentEl.innerHTML = post.content.map(p => `<p>${p}</p>`).join('');
    }

    modal.classList.add('open');
    modal.scrollTop = 0;
    document.body.classList.add('no-scroll');
  }

  function closeJournalModal() {
    const modal = document.getElementById('journal-modal');
    if (!modal) return;
    modal.classList.remove('open');
    document.body.classList.remove('no-scroll');
  }

  // ==========================================================================
  // FULLSCREEN LIGHTBOX
  // ==========================================================================
  function openLightbox(galleryKey, index) {
    const items = SITE_DATA.galleries[galleryKey === 'still-life' ? 'still_life' : galleryKey];
    if (!items || !items[index]) return;

    state.lightbox.isOpen = true;
    state.lightbox.galleryKey = galleryKey;
    state.lightbox.currentIndex = index;

    updateLightboxContent();
    lightboxModal.classList.add('open');
    document.body.classList.add('no-scroll');
  }

  function closeLightbox() {
    state.lightbox.isOpen = false;
    lightboxModal.classList.remove('open');
    document.body.classList.remove('no-scroll');
  }

  function updateLightboxContent() {
    const key = state.lightbox.galleryKey === 'still-life' ? 'still_life' : state.lightbox.galleryKey;
    const items = SITE_DATA.galleries[key];
    const currentItem = items[state.lightbox.currentIndex];
    if (!currentItem) return;

    lightboxImage.src = currentItem.src;
    lightboxImage.alt = currentItem.title;
    lightboxTitle.textContent = currentItem.title;
    lightboxCounter.textContent = `${String(state.lightbox.currentIndex + 1).padStart(2, '0')} / ${String(items.length).padStart(2, '0')}`;
    if (lightboxCategory) {
      lightboxCategory.textContent = `${currentItem.category} · ${currentItem.year}`;
    }
  }

  function prevLightboxItem() {
    const key = state.lightbox.galleryKey === 'still-life' ? 'still_life' : state.lightbox.galleryKey;
    const items = SITE_DATA.galleries[key];
    state.lightbox.currentIndex = (state.lightbox.currentIndex - 1 + items.length) % items.length;
    updateLightboxContent();
  }

  function nextLightboxItem() {
    const key = state.lightbox.galleryKey === 'still-life' ? 'still_life' : state.lightbox.galleryKey;
    const items = SITE_DATA.galleries[key];
    state.lightbox.currentIndex = (state.lightbox.currentIndex + 1) % items.length;
    updateLightboxContent();
  }

  function setupLightboxEvents() {
    if (lightboxCloseBtn) lightboxCloseBtn.addEventListener('click', closeLightbox);
    if (lightboxPrevBtn) lightboxPrevBtn.addEventListener('click', prevLightboxItem);
    if (lightboxNextBtn) lightboxNextBtn.addEventListener('click', nextLightboxItem);

    // Click outside stage image to close
    lightboxModal.addEventListener('click', (e) => {
      if (e.target === lightboxModal || e.target.classList.contains('lightbox-stage')) {
        closeLightbox();
      }
    });

    // Keyboard navigation
    window.addEventListener('keydown', (e) => {
      if (!state.lightbox.isOpen) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') prevLightboxItem();
      if (e.key === 'ArrowRight') nextLightboxItem();
    });

    // Touch swipe for mobile
    let touchStartX = 0;
    lightboxModal.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    lightboxModal.addEventListener('touchend', (e) => {
      const touchEndX = e.changedTouches[0].screenX;
      const diffX = touchEndX - touchStartX;
      if (Math.abs(diffX) > 45) {
        if (diffX > 0) prevLightboxItem();
        else nextLightboxItem();
      }
    }, { passive: true });
  }

  // ==========================================================================
  // ROUTING & NAVIGATION
  // ==========================================================================
  function navigateTo(routeId) {
    const cleanRoute = (routeId || '').replace('#', '').trim() || 'portrait';

    // Redirect legacy routes seamlessly
    if (cleanRoute === 'still-life') {
      window.location.hash = '#portrait';
      return;
    }
    if (cleanRoute === 'journal') {
      window.location.hash = '#blog';
      return;
    }

    const validRoutes = ['portrait', 'advertorial', 'experience', 'shop', 'blog', 'about', 'contact'];
    const activeRoute = validRoutes.includes(cleanRoute) ? cleanRoute : 'portrait';

    state.currentRoute = activeRoute;

    // Toggle active view
    pageViews.forEach(view => {
      const isTarget = view.id === `view-${activeRoute}`;
      view.classList.toggle('active', isTarget);
    });

    // Toggle active link
    navLinks.forEach(link => {
      const targetHash = link.getAttribute('href');
      link.classList.toggle('active', targetHash === `#${activeRoute}`);
    });

    // Toggle footer hint & layout button visibility (only for photo galleries)
    const isGallery = ['portrait', 'advertorial'].includes(activeRoute);
    if (layoutToggleBtn) {
      layoutToggleBtn.style.display = isGallery ? 'inline-flex' : 'none';
    }
    if (footerBar) {
      footerBar.style.display = isGallery ? 'flex' : 'none';
    }
    if (footerHint) {
      footerHint.style.display = isGallery && state.currentLayout === 'horizontal' ? 'flex' : 'none';
    }

    // Close mobile drawer
    closeMobileDrawer();

    // Reset scroll if not gallery
    if (!isGallery) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Trigger counters if navigating to About
    if (activeRoute === 'about' && !state.animatedCountersDone) {
      setTimeout(setupCountersObserver, 200);
    }
  }

  function setupRouting() {
    window.addEventListener('hashchange', () => {
      navigateTo(window.location.hash);
    });

    // Initialize initial route
    navigateTo(window.location.hash || '#portrait');
  }

  // ==========================================================================
  // VIEW LAYOUT TOGGLE (HORIZONTAL FLOW VS GRID)
  // ==========================================================================
  function toggleLayout() {
    state.currentLayout = state.currentLayout === 'horizontal' ? 'grid' : 'horizontal';
    const isGrid = state.currentLayout === 'grid';

    document.querySelectorAll('.gallery-viewport').forEach(vp => {
      vp.classList.toggle('mode-grid', isGrid);
    });

    if (layoutToggleBtn) {
      layoutToggleBtn.innerHTML = isGrid
        ? `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/></svg>`
        : `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>`;
      layoutToggleBtn.setAttribute('title', isGrid ? 'Switch to Horizontal Flow' : 'Switch to Grid View');
      layoutToggleBtn.setAttribute('aria-label', isGrid ? 'Switch to Horizontal Flow' : 'Switch to Grid View');
    }

    if (footerHint) {
      footerHint.style.display = !isGrid ? 'flex' : 'none';
    }
  }

  // ==========================================================================
  // MOBILE MENU DRAWER
  // ==========================================================================
  function toggleMobileDrawer() {
    const isOpen = mobileDrawer.classList.contains('open');
    if (isOpen) closeMobileDrawer();
    else openMobileDrawer();
  }

  function openMobileDrawer() {
    mobileDrawer.classList.add('open');
    mobileToggleBtn.classList.add('is-active');
    document.body.classList.add('no-scroll');
  }

  function closeMobileDrawer() {
    mobileDrawer.classList.remove('open');
    mobileToggleBtn.classList.remove('is-active');
    document.body.classList.remove('no-scroll');
  }

  // ==========================================================================
  // APP BOOTSTRAP
  // ==========================================================================
  function init() {
    initTheme();
    renderGalleries();
    renderExperiencePage();
    renderShopPage();
    renderBlogPage();
    renderJournalPage();
    renderAboutPage();
    renderContactPage();
    setupJournalModal();
    setupLightboxEvents();
    setupRouting();

    // Event Listeners
    if (themeToggleBtn) themeToggleBtn.addEventListener('click', toggleTheme);
    const mobileThemeBtn = document.getElementById('mobile-theme-btn');
    if (mobileThemeBtn) mobileThemeBtn.addEventListener('click', toggleTheme);

    if (layoutToggleBtn) layoutToggleBtn.addEventListener('click', toggleLayout);
    if (mobileToggleBtn) mobileToggleBtn.addEventListener('click', toggleMobileDrawer);

    // Keyframe spin helper for loading buttons
    const styleEl = document.createElement('style');
    styleEl.textContent = `@keyframes spin { to { transform: rotate(360deg); } }`;
    document.head.appendChild(styleEl);
  }

  // DOM ready check
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
