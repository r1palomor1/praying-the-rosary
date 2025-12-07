# Intro Prayers Image Implementation

## Summary
Added the Jesus and Mary image to all 6 intro prayers in both Classic and Cinematic layouts.

## Changes Made

### 1. Image Conversion
- **Source**: Uploaded image `uploaded_image_1765069317860.jpg`
- **Destination**: `public/images/intro-prayers.jpg`
- **Optimized**: Converted to WebP format → `public/images/intro-prayers.webp`
- **Script Updated**: Enhanced `scripts/convert-images.js` to process images in both `/public/images/` and `/public/images/mysteries/` directories

### 2. Prayer Flow Engine (`src/utils/prayerFlowEngine.ts`)
Added `imageUrl: '/images/intro-prayers.webp'` to the following 6 intro prayer steps:
1. **Sign of the Cross** (`sign_of_cross_start`)
2. **Opening Invocation** (`opening_invocation`)
3. **Act of Contrition** (`act_of_contrition`)
4. **Apostles' Creed** (`apostles_creed`)
5. **Invocation to the Holy Spirit** (`invocation_holy_spirit`)
6. **Moment of Intentions** (`intention_placeholder`)

### 3. Mystery Screen Component (`src/components/MysteryScreen.tsx`)
Updated intro prayer rendering to support images in both layouts:

#### Classic Mode
- Displays image above prayer text using the `MysteryImage` component
- Uses the same card layout as mystery announcements
- Image is contained within `.mystery-image-container`

#### Cinematic Mode
- Full immersive background image with overlay
- Prayer text overlaid on the image
- Matches the same cinematic style used for mystery announcements

## File Structure
```
public/images/
├── intro-prayers.jpg (144 KB - original)
├── intro-prayers.webp (154 KB - optimized)
└── mysteries/
    └── [mystery images...]
```

## Testing Checklist
- [ ] Classic mode displays intro prayer images correctly
- [ ] Cinematic mode displays intro prayer images correctly
- [ ] Images load with lazy loading optimization
- [ ] All 6 intro prayers show the same Jesus and Mary image
- [ ] Image quality is appropriate
- [ ] No console errors
- [ ] Responsive on mobile devices

## Technical Details
- **Image Format**: WebP (optimized for web)
- **Lazy Loading**: Enabled via `loading="lazy"` attribute
- **Async Decoding**: Enabled via `decoding="async"` attribute
- **Fallback**: Card layout without image if `imageUrl` is not present
