# Badstyle Photography

An elegant, bold editorial website for **Badstyle Photography**, meticulously styled and crafted after the award-winning **Pheebs — Creative Photography Template** by **Elemis Themes** on Dribbble and Framer.

---

## 🌟 Key Features & Sections

### 1. **The Client Experience (4-Step Transformation)** (`#experience`)
- **01. Wardrobe & Style Consult**: Custom digital mood board & full luxury studio client closet access (tailored blazers, moto leather, sheer silks, designer accessories).
- **02. Hair & Makeup Artistry**: In-house pampering and customized camera-calibrated glam (from raw dewy minimalism to sultry smoky drama).
- **03. Fully Directed Shoot**: Millimeter-precision direction down to every breath, chin tilt, and fingertip angle in a judgment-free, music-filled sanctuary.
- **04. Same-Day Reveal & Art Consultation**: Private Cinema Room big-screen premiere immediately following your session, designing bespoke heirloom Italian leather albums and museum-grade acrylic art.

### 2. **Investment & Collections (Transparent 3-Tier Pricing)**
- **The Maverick ($1,200)**: 90-min directed session, 2 looks, hair & makeup, $400 print credit, 8 master high-res digital negatives, same-day reveal, zero hidden costs.
- **The Badstyle Signature ($2,400) — Most Coveted**: Up to 3-hour session, 4 wardrobe looks, hair & makeup with transitions, handcrafted 10x10" Italian Leather Album, $800 print credit, 20 master high-res digital negatives, zero hidden costs.
- **The Haute Couture ($3,900) — VIP Art Commission**: Full-day VIP studio residency, artist on-set, 12x12" masterpiece Italian album, large 24x36" museum-grade wall art, COMPLETE collection of all 45+ high-res negatives, $1,200 print credit, gourmet lunch & champagne, zero hidden costs.
- *Interactive Booking Integration*: Clicking "Book This Collection" on any card routes to the booking form and preselects the chosen tier!

### 3. **Client Guide & FAQs (Interactive Accordion)**
- Detailed answers addressing:
  - **Privacy & Discretion**: Strict non-disclosure agreements, encrypted offline storage, and zero public posting without explicit written release.
  - **Posing Nervousness**: Complete millimeter direction for first-time clients with zero modeling experience.
  - **Non-Lingerie Wardrobe Alternatives**: Power suits, oversized tailoring, vintage leather, sheer organza, and denim.
  - **Natural Skin Retouching**: High-end frequency separation celebrating authentic pores, beauty marks, and radiant natural skin.
  - **Client Closet Consult & Policies**: Details on pre-shoot virtual consults and flexible rescheduling.

### 4. **Editorial Journal & Client Love Notes** (`#journal`)
- **Three Interactive Articles with Full Reading Modal Views**:
  - *The Anti-Boudoir Manifesto: Why Sensuality Doesn't Need Lace*
  - *What to Wear When You Hate Traditional Lingerie: The Editorial Style Guide*
  - *From Citrus Groves to Rain Stages: Creative Direction Behind the Lens*
- **Client Love Notes**: Testimonial feedback cards from real clients (founders, creative directors, stylists) highlighting their transformative experience.

### 5. **Interactive Booking Form** (`#contact`)
- Full Name, Email, and Phone contact fields.
- **Desired Aesthetic Dropdown**: Cinematic Noir & Shadowplay, High-Fashion Tailored & Leather, Raw & Minimalist Editorial, Moody Water & Bathtub, Color Block, or Custom Concept.
- **Preferred Date** picker.
- **Collection Tier Dropdown** with pre-selection support.
- Vision notes & personal story textarea.
- **Mandatory Privacy & Confidentiality Checkbox** guaranteeing 100% private sessions.
- Interactive loading spinner on submission with instant personalized confirmation banner.

### 6. **Portfolio Galleries**
- **People & Portrait** (`#portrait`): 54 original photographs from Badstyle's portfolio.
- **Advertorial** (`#advertorial`): Commercial visual storytelling for brands and editorial fashion.
- **Still Life** (`#still-life`): Geometric, color-saturated, and minimalist still life compositions.

### 7. **Viewing Modes & Lightbox**
- **Horizontal Flow Mode**: Natural mouse-wheel horizontal translation with inertia, drag-to-scroll, and touch swipe.
- **Editorial Grid Mode**: Toggleable multi-column masonry overview.
- **Fullscreen Lightbox**: High-res viewing with captions, category, active counter (`01 / 54`), keyboard arrows (`←`, `→`, `ESC`), and touch swipe.

### 8. **Light & Dark Mode Theming**
- Instant toggle with sun/moon iconography, smooth CSS variable transitions, and `localStorage` persistence.

---

## 🚀 How to Run & Preview

### Option 1: Open Directly in Any Browser
```powershell
Start-Process "index.html"
```

### Option 2: Run with Local Node Server
```powershell
npx serve . -l 3000
```
Then visit `http://localhost:3000`.

---

## 📁 File Structure

```
badstyle-photography/
├── index.html       # Semantic HTML5 markup, navigation, views, modal, footer
├── styles.css       # Complete design system, light/dark mode tokens, animations
├── data.js          # Portfolio catalogs, experience steps, pricing tiers, journal, FAQs
├── app.js           # Client-side router, scroll physics, lightbox, journal modal, booking form
├── images/          # Local photo assets (including portraits/)
├── package.json     # NPM configuration and start scripts
└── README.md        # Documentation and guide
```
