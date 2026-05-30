# Vitorra Design System
## Adapted from Mastercard — with Playfair Display + Vitorra Gold identity

**Source inspiration:** Mastercard design system (awesome-design-md)
**Adaptation date:** 2026-05-30
**Decision:** Mastercard chosen over Tesla, Ferrari, Wise, Revolut for its multi-product holding company architecture, warm editorial premium feel, and circular portrait treatment.

---

## 1. Core Adaptation Rules

| Mastercard original | Vitorra adaptation | Reason |
|--------------------|--------------------|--------|
| MarkForMC (proprietary) | Playfair Display (serif, headings) | More luxury, African premium brand identity |
| Ink Black CTAs (`#141413`) | **Vitorra Gold `#C5B27A`** CTAs with dark text | Distinctive brand moment on every interaction |
| Canvas Cream `#F3F0EE` | Vitorra Ivory `#F2F2F2` | Nearly identical — warm off-white, never sterile |
| Signal Orange `#CF4500` orbital arcs | **Vitorra Gold `#C5B27A`** orbital arcs | Brand-consistent connection motif |
| Signal Orange accent dot on eyebrows | **Vitorra Gold dot** | Brand-consistent |
| Ink Black footer `#141413` | Vitorra Charcoal `#1E1E1E` | Same dark warmth |

---

## 2. Color Palette

### Brand Colors (Vitorra)
- **Vitorra Gold:** `#C5B27A` — primary CTA, accents, orbital arcs, eyebrow dots
- **Vitorra Gold Light:** `#D4C49A` — hover states on gold
- **Vitorra Gold Dark:** `#A89255` — pressed states, dark sections

### Surface Colors
- **Canvas Ivory:** `#F2F2F2` — default body background (warm, never sterile white)
- **Lifted Ivory:** `#FAFAF8` — nested "raised" sections, cards
- **Pure White:** `#FFFFFF` — floating nav pill, modal cards, satellite CTAs
- **Vitorra Charcoal:** `#1E1E1E` — footer, hero dark sections

### Text Colors
- **Heading / Primary text:** `#1E1E1E` (Charcoal)
- **Body text:** `#454545` — secondary body paragraphs
- **Muted text:** `#696969` — eyebrow alternates, disabled states, captions

### Semantic
- **Destructive / Error:** `oklch(0.577 0.245 27.325)` — kept from shadcn

---

## 3. Typography

### Fonts
- **Headings:** Playfair Display — serif, luxury, weight 600-700, tight -2% letter-spacing
- **Body + UI:** Inter — clean, readable, weight 400/500/600
- **Eyebrow labels:** Inter, 12px, weight 700, +4% tracking, UPPERCASE

### Hierarchy (adapted from Mastercard)

| Role | Font | Size | Weight | Line Height | Letter Spacing |
|------|------|------|--------|-------------|----------------|
| H1 Hero | Playfair Display | 64px | 700 | 1.05 | -1.5% |
| H2 Section | Playfair Display | 40px | 600 | 1.15 | -1% |
| H3 Card title | Playfair Display | 24px | 600 | 1.2 | -0.5% |
| Eyebrow label | Inter | 12px | 700 | 1.0 | +4% (uppercase) |
| Body paragraph | Inter | 16px | 400 | 1.55 | 0 |
| Nav link | Inter | 14px | 500 | 1.0 | -1% |
| Button label | Inter | 15px | 600 | 1.0 | -1% |
| Footer heading | Inter | 11px | 700 | 1.0 | +4% (uppercase) |

---

## 4. Border Radius Scale (Mastercard-inherited)

Mastercard skips 8-16px zone. Vitorra does the same.

| Value | Token | Use |
|-------|-------|-----|
| 0px | `sharp` | Avoided — not Vitorra's language |
| 4-6px | `xs` | Tiny decorative chips only |
| **20px** | `btn` | **All CTAs — Mastercard's signature button** |
| **40px** | `card` | Large containers, hero media frames, stadium shapes |
| **50%** | `circle` | Team portraits, icon containers, satellite CTAs |
| **999px** | `pill` | Floating nav, full-pill chips, tags |

---

## 5. Spacing System

Base unit: **8px**

| Token | Value | Use |
|-------|-------|-----|
| `xs` | 8px | Tight internal gaps |
| `sm` | 16px | Component internal padding |
| `md` | 24px | Card internal padding (small) |
| `lg` | 32-40px | Card internal padding |
| `xl` | 48px | Section sub-padding |
| `2xl` | 64px | Section gaps |
| `3xl` | 96px | Section vertical padding |
| `4xl` | 128px | Hero padding |

---

## 6. Key Visual Gestures (Mastercard-inherited)

### Floating Pill Navigation
- White background, `box-shadow: rgba(0,0,0,0.04) 0px 4px 24px`
- `border-radius: 9999px`
- Floats 24px from viewport top (not flush)
- Logo left, links center, Gold CTA button right

### Ghost Watermark Headlines
- Section theme text at 96-128px
- Color: `#E8E3DC` (ivory-on-ivory, barely visible)
- Layered behind section content
- Creates editorial depth without competing with foreground

### Circular Portrait Cards
- Team photos: `border-radius: 50%`
- With attached white satellite CTA (40px circle, dark arrow) docked bottom-right
- Gold dot + UPPERCASE eyebrow below portrait

### Gold Orbital Arcs
- 1-1.5px curved lines in Vitorra Gold `#C5B27A`
- Connect circular cards horizontally
- Only in sections with circular content
- Imply connection, not literal arrows

### Elevation Philosophy
- No hard shadows anywhere
- Level 0: flat on ivory canvas (95% of surfaces)
- Level 1: `rgba(0,0,0,0.04) 0px 4px 24px` — floating nav only
- Level 2: `rgba(0,0,0,0.08) 0px 24px 48px` — hero frames, featured cards
- Photography provides all visual richness

### Whitespace as Structure
- Generous emptiness signals premium
- "Slow down, read one thing at a time"
- 96-128px section padding — never cramped

---

## 7. Component Specs

### Primary CTA Button
- Background: Vitorra Gold `#C5B27A`
- Text: Charcoal `#1E1E1E`
- Border-radius: 20px (Mastercard signature)
- Padding: 10px 28px
- Font: Inter 15px / weight 600 / -1% tracking
- Hover: Gold Light `#D4C49A`
- Use: every primary conversion action

### Secondary CTA Button
- Background: White `#FFFFFF`
- Text: Charcoal `#1E1E1E`
- Border: 1.5px solid `#1E1E1E`
- Border-radius: 20px
- Same sizing as primary
- Use: secondary actions alongside primary

### Ghost Outline Button (on dark backgrounds)
- Background: transparent
- Text: White
- Border: 1.5px solid rgba(255,255,255,0.5)
- Border-radius: 20px
- Hover: rgba(255,255,255,0.1) background

### Eyebrow Label Pattern
```
• SECTION CATEGORY
```
- Gold dot `#C5B27A` + space + UPPERCASE text
- Inter 12px / weight 700 / +4% tracking
- Use before every section headline

---

## 8. Page Architecture (Mastercard-adapted for Vitorra)

### Homepage sections in order:
1. **Hero** — dark cinema (`#1E1E1E`), Playfair Display headline, Gold CTAs
2. **Gold orbital strip** — trust bar
3. **Products section** — ivory canvas, ghost watermark "Portfolio", 4 stadium-radius cards
4. **Why Vitorra** — lifted ivory, circular icon treatments, 3 columns
5. **Team** — ivory canvas, circular portraits + satellite CTAs, gold orbital arcs
6. **Proof/Certifications** — dark section, gold accent, CTA
7. **Blog preview** — ivory canvas, 3 card layout
8. **Final CTA** — dark stadium card, centered

---

## 9. Responsive Breakpoints

| Breakpoint | Width | Key changes |
|-----------|-------|-------------|
| Mobile | < 768px | Pill nav collapses to logo + hamburger (pill PRESERVED); H1 40px; sections 48px padding; cards 1-up |
| Tablet | 768-1023px | Nav shows 2-3 links; 2-up grids; H1 52px |
| Desktop | ≥ 1024px | Full pill nav; constellation card layouts; H1 64px; 3-4 up grids |
| Wide | ≥ 1440px | Content caps at 1280px, gutters grow |
