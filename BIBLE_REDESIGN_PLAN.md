# Bible in a Year Screen Redesign Plan

## Objective
Implement a "Sacred Modernism" redesign based on the provided Tailwind HTML snippet, translating it to the project's CSS architecture. Ensure elements are distinct, spacious, and typographically rich.

## Design Systems

### Typography
- **Headings**: 'Noto Serif', serif (Import from Google Fonts)
- **Body**: 'Manrope', sans-serif (Import from Google Fonts)
- **Icons**: Material Symbols Outlined (Import from Google Fonts)

### Colors (CSS Variables)
- `--color-primary`: `#a87d3e` (Gold / Bronze)
- `--color-bg-dark`: `#191b1f` (Deep Background)
- `--color-surface`: `#2a2c30` (Card Surface)
- `--color-surface-hover`: `#2f3238`
- `--color-text-main`: `#f1f5f9` (Slate 100)
- `--color-text-muted`: `#94a3b8` (Slate 400)
- `--color-liturgical-green`: `#2d3a2e` (Bg) / `#bbf7d0` (Text)

## Implementation Steps

### 1. Global Styles & Assets
- Add font imports to `src/styles/index.css` (or `BibleInYearScreen.css` if scoped).
- Define custom CSS variables for the palette.

### 2. Component Structure Update (`BibleInYearScreen.tsx`)

#### A. Header Section
- **Top Row**: 
  - `Back Button` (Menu icon style)
  - `Title`: "BIBLE IN A YEAR" (Centered, Serif, Uppercase, Tracking-wide)
  - `Settings Button` (Right aligned)
- **Date Row**:
  - `Date Text`: "January 15 • Day 15" (Primary Color, Italic, Serif) + Calendar Icon
- **Action Control Row**:
  - `Play Day Button`: Large FAB style (Gold background, shadow)
  - `Phase Pill`: Outline style with Green accent ("Phase: Patriarchs")
  - `Day Label`: "DIA 16" (Muted text) -> Optional if redundant
- **Progress Bar**:
  - Thin 4px height, rounded.

#### B. Reading Sections
- **Structure**:
  - **Header**: "First Reading" (Serif, Primary Color) --- [Play Section Button]
  - **Cards**:
    - Background: `rgba(42, 44, 48, 0.5)` (Surface/50)
    - Hover Effect: Lighten bg, border hint.
    - Content: Play Icon | Title | Chevron
    - Typography: Manrope font for reading titles.

#### C. Footer Section
- **Flourish**: "Amen" text comfortably spaced with decorative lines.
- **Fixed Action Bar**:
  - Fixed at bottom of screen (`position: fixed; bottom: 0`).
  - Dark glassmorphism background.
  - "Mark as Complete" button: Full width, Gold/Primary background, Uppercase, Bold.

### 3. CSS Implementation (`BibleInYearScreen.css`)
- Clean up old styles causing crunch/shadow issues.
- implement `.bible-chapter-card`, `.bible-section-header`, `.amen-flourish`.
- Ensure padding-bottom on main container to prevent content being hidden behind the fixed footer.

### 4. Assets
- Use `lucide-react` icons where possible to match existing app, or switch to `Material Symbols` if strict adherence is preferred. *Recommendation: Use Lucide for consistency but style them to match the weight of Material Symbols.*

## Revert Point
- Commit hash: `d08b7a9`
