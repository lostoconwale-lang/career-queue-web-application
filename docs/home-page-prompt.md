# Prompt — Build the Job Board home page UI

Paste everything below the line into Claude Code.

---

Build the public **home page** for this Next.js 15 job board. Light mode only — no dark
variants, no theme toggle, no `dark:` classes anywhere.

## Stack rules

- Next.js 15 App Router, React 19, TypeScript, Tailwind CSS v4 (`@import "tailwindcss"` in
  `app/globals.css`), `framer-motion` — all already installed. **Add no new dependencies**,
  no icon library: draw icons as small inline SVG components.
- Keep it simple: one `app/page.tsx` composing section components in `app/(marketing)/_components/`.
  No context providers, no state managers, no barrel files, minimal comments.
- Every section is a plain server component. Add `"use client"` only to the two or three
  pieces that genuinely need it (scroll-reveal wrapper, search form, testimonial slider).
- Static demo data lives in one file, `app/(marketing)/_data.ts`, typed and exported.

## Design system

Define these as Tailwind v4 theme tokens in `app/globals.css` via `@theme`:

```
--color-brand:      #2563eb   /* primary blue  */
--color-brand-soft: #93c5fd   /* highlight     */
--color-ink:        #0f172a   /* headings      */
--color-body:       #475569   /* paragraphs    */
--color-line:       #e2e8f0   /* borders       */
--color-canvas:     #fafcff   /* page bg       */
--font-sans: "Geist", ui-sans-serif, system-ui, sans-serif
```

Load Geist with `next/font/google` in `app/layout.tsx`.

Visual language — the whole page should read as one system:

- **Page background** `--color-canvas`, with alternating sections on pure white so the
  rhythm is visible without hard dividers.
- **Ambient blobs**: every section gets 2–3 absolutely-positioned, `blur-3xl`,
  `rounded-full` washes of `brand/5` and `brand-soft/20`, `pointer-events-none`,
  `overflow-hidden` on the parent. Slow `animate-pulse` only in the hero.
- **Cards**: white, `rounded-2xl`, `border border-line`, `shadow-[0_1px_2px_rgba(15,23,42,0.04)]`,
  hover lifts to `-translate-y-1` + `shadow-lg shadow-brand/10` over 300ms.
- **Headings**: `text-ink`, `font-semibold`, tight leading. In each section heading, one
  phrase is highlighted with `bg-gradient-to-r from-brand to-brand-soft bg-clip-text
  text-transparent`. Section eyebrow = small pill, `bg-brand/10 text-brand rounded-full
  px-4 py-1.5 text-sm font-medium`.
- **Buttons**: filled = `bg-brand text-white rounded-full px-6 py-3 shadow-lg shadow-brand/25`;
  ghost = `border border-line bg-white text-ink rounded-full`. Both scale to `1.03` on hover.
- **Container**: `mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8`. Section padding
  `py-16 lg:py-24`.
- Focus rings on every interactive element (`focus-visible:ring-2 ring-brand ring-offset-2`).

Make it feel distinctive, not template-generic: prefer an asymmetric hero, generous
whitespace, one oversized number or stat per section, and restrained motion.

## Assets (already generated, in `public/images/`)

| File | Use |
| --- | --- |
| `hero-professional.png` | transparent-background cutout, 1024×1408 — hero subject |
| `avatar-1.png`, `avatar-2.png`, `avatar-3.png` | 512×512 headshots — avatar stack + testimonials |

Use `next/image`; give the hero `priority`.

## Sections, in order

1. **Header** — sticky, transparent over the hero, turning to
   `bg-white/80 backdrop-blur border-b border-line` after ~20px of scroll (client component).
   Wordmark on the left, nav (Find Jobs / Companies / Salaries / For Employers) centered,
   "Sign in" ghost + "Post a Job" filled on the right. Slide-down mobile sheet under `md`.

2. **Hero** — `min-h-[90vh]`, two columns on `lg` (text left, image right), stacked and
   centered below. Headline in three lines with the middle phrase gradient-highlighted, e.g.
   *"Find the work / that fits your life / not the other way around."* One-line subhead,
   then a **search bar**: a white pill card holding keyword input, location input, a divider,
   and a filled "Search" button — collapses to a stacked card on mobile. Under it, four
   quick-filter chips (Remote, Full-time, Internship, Design). Around the image, float three
   glass cards (`bg-white/70 backdrop-blur border rounded-xl shadow-lg`) that drift gently
   with framer-motion: an avatar stack + "4.9 (2.6k reviews)", a "5,000+ Companies" stat,
   and a small check badge. Bottom strip: "Trusted by leading companies" over a row of
   greyscale wordmarks rendered as styled text.

3. **Categories** — eyebrow "Explore", heading "Popular Job Categories". Responsive grid
   (2 / 3 / 4 columns) of 8 cards: inline SVG icon in a `bg-brand/10 rounded-xl` tile,
   category name, "1,204 open roles". Whole card is a link. "View all categories" ghost
   button centered below.

4. **Featured jobs** — heading + a filter row (All / Remote / Full-time / Contract) as
   pill toggles. Grid of 6 job cards: company logo tile (initial letter on a tinted square),
   job title, company · location, salary range, tags, "2d ago", and a bookmark icon button
   in the corner.

5. **How it works** — three numbered steps (Create profile → Match with roles → Get hired)
   connected by a dashed line on `lg`. Each step: big translucent numeral behind the card,
   icon, title, one sentence. Follow with a four-up stat band (10K+ Jobs, 5K+ Companies,
   98% Success Rate, 24/7 Support) on a subtle `from-brand/5` gradient.

6. **Testimonials** — three quote cards using the avatars, 5-star row, name and role.
   Middle card slightly elevated.

7. **CTA** — full-width `rounded-3xl` panel inset in the container, `bg-gradient-to-br
   from-brand to-blue-700`, white text, heading, subline, "Get started" white button +
   "Learn more" outlined button.

8. **Footer** — four link columns + wordmark and short blurb, newsletter input with an
   inline arrow button, bottom bar with copyright and social icons.

## Motion

One tiny client component, `Reveal`, wrapping sections: `framer-motion` `whileInView`
fade + 24px rise, `viewport={{ once: true, amount: 0.2 }}`, 500ms `easeOut`, optional
stagger for grids. Reuse it everywhere instead of per-section animation code. Respect
`prefers-reduced-motion`.

## Done means

- `pnpm typecheck` and `pnpm lint` pass.
- No layout shift and no horizontal scroll at 375px, 768px, 1280px, 1920px.
- All images have real `alt` text; nav and buttons are keyboard reachable.
