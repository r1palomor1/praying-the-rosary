---
description: Final optimization and cleanup tasks before app finalization
---

# Final Optimization & Cleanup Tasks

## 🎨 UI CONSISTENCY & DESIGN SYSTEM (NEW - High Priority)

### 0. **Design System Implementation** ⭐ CRITICAL
Based on external UI consistency review, we have significant design drift issues.

#### **Phase 1: Create Design System Foundation**
- [ ] Create `src/styles/theme.css` with CSS variables:
  - `--font-family-main` (single font for entire app)
  - `--font-size-title`, `--font-size-subtitle`, `--font-size-body`, `--font-size-prayer`
  - `--spacing-xs` (4px), `--spacing-sm` (8px), `--spacing-md` (12px), `--spacing-lg` (16px), `--spacing-xl` (24px)
  - `--color-text-primary`, `--color-text-secondary`, `--color-bg-primary`, etc.
- [ ] Audit current CSS files for inconsistencies:
  - Different font-family declarations
  - Hard-coded spacing values
  - Duplicate margin/padding rules
  - Inconsistent line-heights

#### **Phase 2: Standardize Typography**
- [ ] Create `src/components/ui/Text.tsx` component with variants:
  - `<Text variant="title">` - for all titles
  - `<Text variant="subtitle">` - for subtitles
  - `<Text variant="body">` - for body text
  - `<Text variant="prayer">` - for prayer text
  - `<Text variant="label">` - for labels
- [ ] Replace ALL hard-coded text elements with `<Text>` component
- [ ] Ensure Spanish text (10-30% longer) doesn't break layouts

#### **Phase 3: Standardize Layout Containers**
- [ ] Create reusable layout components:
  - `<PageContainer>` - consistent page wrapper
  - `<CardContainer>` - consistent card styling
  - `<TextBlock>` - consistent text blocks
  - `<ImageContainer>` - consistent image handling
- [ ] Replace all hard-coded layouts with these components

#### **Phase 4: CSS Cleanup**
- [ ] Replace ALL hard-coded margins/paddings with spacing variables
- [ ] Consolidate duplicate CSS rules
- [ ] Remove unused CSS classes
- [ ] Ensure classic/cinematic modes use same base styles

#### **Known Issues to Fix:**
- ❌ Multiple fonts used accidentally (serif, sans-serif, browser defaults)
- ❌ Different spacing across components
- ❌ Spanish text breaks layout in some places
- ❌ Classic vs Cinematic have different base styling

#### **Optional (Future Enhancement):**
- [ ] Consider Storybook for component isolation
- [ ] Consider BackstopJS for visual regression testing
- [ ] Create UI drift release checklist

## 🗂️ File Cleanup & Build Optimization

### 1. **Remove Unnecessary Files from Deployment**
- [ ] Audit all `.md` files in project root and subdirectories
- [ ] Identify which are development-only (README, docs, notes)
- [ ] Create/update `.vercelignore` to exclude:
  - `.agent/` directory (workflow files, task lists)
  - Development markdown files
  - Test files
  - Any other dev-only assets
- [ ] Verify `.gitignore` vs `.vercelignore` - different purposes

### 2. **Image Optimization**
- [ ] Verify all images are in WebP format
- [ ] Check image sizes - ensure they're optimized for web
- [ ] Remove any unused images from `public/images/`
- [ ] Consider lazy loading for images not immediately visible

### 3. **Code Cleanup**
- [ ] Remove unused imports across all files
- [ ] Remove commented-out code
- [ ] Check for unused CSS classes
- [ ] Remove any debug console.logs

## 🔊 TTS Review & Optimization

### 4. **TTS Implementation Audit**
- [ ] Confirm we're ONLY using Web Speech API (browser native)
- [ ] Verify NO Sherpa or other external TTS libraries are imported
- [ ] Check bundle size - ensure no unused TTS dependencies
- [ ] Review `ttsManager.ts` for any legacy code
- [ ] Confirm voice downloads work properly (if applicable)

### 5. **Audio Performance**
- [ ] Test TTS performance on slow connections
- [ ] Verify audio doesn't block UI
- [ ] Check memory usage during long prayer sessions

## 📦 Bundle Size Optimization

### 6. **Dependency Audit**
- [ ] Run `npm ls` to see all dependencies
- [ ] Identify any unused packages
- [ ] Check for duplicate dependencies
- [ ] Consider tree-shaking opportunities
- [ ] Review `package.json` - remove unused packages

### 7. **Build Output Analysis**
- [ ] Run production build: `npm run build`
- [ ] Analyze bundle size
- [ ] Check for code splitting opportunities
- [ ] Verify lazy loading is working

## 🎨 Final Polish

### 8. **UI/UX Final Review**
- [ ] Test all features in both light/dark mode
- [ ] Verify responsive design on mobile/tablet/desktop
- [ ] Check all images display correctly
- [ ] Verify all font sizes are consistent
- [ ] Test calendar functionality thoroughly

### 9. **Performance Testing**
- [ ] Lighthouse audit (Performance, Accessibility, Best Practices, SEO)
- [ ] Test on slow 3G connection
- [ ] Check initial load time
- [ ] Verify offline functionality (if applicable)

## 🐛 Bug Fixes & Edge Cases

### 10. **Known Issues**
- [ ] Calendar yellow circle text color (still showing white in dark mode?)
- [ ] Verify timezone fix is working correctly
- [ ] Test smart mystery selection with multiple completions
- [ ] Verify Progress/Home icons in light mode

### 11. **Edge Case Testing**
- [ ] What happens if user completes 4 different mysteries in one day?
- [ ] Test with no internet connection
- [ ] Test with browser storage disabled
- [ ] Test on different browsers (Chrome, Firefox, Safari, Edge)

## 📱 PWA Considerations

### 12. **Progressive Web App Features**
- [ ] Review manifest.json
- [ ] Check service worker (if implemented)
- [ ] Test "Add to Home Screen" functionality
- [ ] Verify app icons for all sizes
- [ ] Test offline capabilities

## 📝 Documentation

### 13. **User-Facing Documentation**
- [ ] Update README with final features
- [ ] Add usage instructions
- [ ] Document any known limitations
- [ ] Add credits/attributions for images

## 🚀 Deployment Checklist

### 14. **Pre-Deployment**
- [ ] Create `.vercelignore` file
- [ ] Run production build locally
- [ ] Test production build
- [ ] Verify environment variables (if any)

### 15. **Post-Deployment**
- [ ] Test deployed app on Vercel
- [ ] Verify all features work in production
- [ ] Check console for errors
- [ ] Test on mobile device

## 📊 Metrics to Track

- **Current Bundle Size**: ___ KB (to be measured)
- **Target Bundle Size**: < 500 KB (reasonable for this app)
- **Lighthouse Performance Score**: ___ (target: 90+)
- **First Contentful Paint**: ___ ms (target: < 1.5s)
- **Time to Interactive**: ___ ms (target: < 3.5s)

## 🎯 Final Goal

Create a lean, fast, beautiful rosary prayer app that:
- ✅ Loads quickly even on slow connections
- ✅ Works offline (or gracefully handles offline state)
- ✅ Has minimal bundle size
- ✅ Provides excellent user experience
- ✅ Is accessible and responsive
- ✅ Uses only native browser APIs (no external TTS)

---

## Priority Order for Tomorrow

1. **HIGH**: Create `.vercelignore` and audit deployment files
2. **HIGH**: TTS audit - confirm no external libraries
3. **MEDIUM**: Bundle size analysis and optimization
4. **MEDIUM**: Fix remaining UI bugs (calendar text color)
5. **LOW**: Documentation updates
6. **LOW**: PWA enhancements (if time permits)

---

**Estimated Time**: 2-3 hours for high-priority items
**App Status**: ~90% complete, entering final polish phase 🎉
