# Closing Prayers Image Implementation

## Summary
Added the Jesus walking on beach image to all closing prayers (except litanies) in both **Classic** and **Cinematic** layouts, using the same unboxed text + boxed image pattern as intro prayers.

## Changes Made

### 1. Image Conversion
- **Source**: Uploaded image `uploaded_image_1765070258021.jpg`
- **Destination**: `public/images/closing-prayers.jpg`
- **Optimized**: Converted to WebP format → `closing-prayers.webp`

### 2. Prayer Flow Engine (`src/utils/prayerFlowEngine.ts`)
Added `imageUrl: '/images/closing-prayers.webp'` to the following closing prayer steps:
1. **Final Jaculatory** (`final_jaculatory_start`)
2. **Final Hail Mary 1-4** (`final_hail_mary_intro`)
3. **Hail Holy Queen** (`hail_holy_queen`)
4. **Under Your Protection** (`closing_under_your_protection`)
5. **Final Prayer** (`final_collect`)
6. **Sign of the Cross (End)** (`sign_of_cross_end`)

**Note**: Litany of Loreto does NOT have an image (as requested)

### 3. Mystery Screen Component (`src/components/MysteryScreen.tsx`)

#### Added Closing Prayer Detection
- Created `closingPrayerTypes` array to identify closing prayers
- Added `isClosingPrayer` boolean helper

#### Updated Rendering (Both Modes)

**Classic Mode:**
- Prayer text (title, divider, text) - **NOT boxed**, centered using `mystery-prayer-card`
- Image - **Boxed separately** below via `renderMysteryImageFooter()`
- Special handling for Final Hail Marys with two-part text (invocation + prayer)

**Cinematic Mode:**
- Full immersive background with the Jesus walking image
- Prayer text overlaid on image
- Special handling for Final Hail Marys with styled two-part text

### 4. Updated `renderMysteryImageFooter()`
Extended to render boxed images for:
- Intro prayers (existing)
- **Closing prayers (new)**
- Decade prayers (existing)

## File Structure
```
public/images/
├── intro-prayers.webp (Jesus and Mary)
├── closing-prayers.webp (Jesus walking on beach)
└── mysteries/
    └── [mystery images...]
```

## Layout Pattern
All intro and closing prayers now follow the same consistent pattern:

### Classic Mode
1. Unboxed, centered prayer text
2. Boxed image below

### Cinematic Mode
1. Full-screen background image
2. Overlaid centered prayer text

## Prayers with Images

### Intro Prayers (Jesus and Mary image)
- Sign of the Cross
- Opening Invocation
- Act of Contrition
- Apostles' Creed
- Invocation to the Holy Spirit
- Moment of Intentions

### Closing Prayers (Jesus walking image)
- Final Jaculatory
- Final Hail Mary 1-4
- Hail Holy Queen
- Under Your Protection
- Final Prayer
- Sign of the Cross (End)

### Excluded
- **Litany of Loreto** - No image (as requested)
- Decade prayers - Use mystery-specific images

## Technical Details
- **Image Format**: WebP (optimized for web)
- **Lazy Loading**: Enabled via `loading="lazy"` attribute
- **Async Decoding**: Enabled via `decoding="async"` attribute
- **Consistent Styling**: Same centered layout as Our Father and other mystery prayers
