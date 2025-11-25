# UX Improvements - Mobile Fixes

## Issues Identified on Mobile Testing

### 1. ✅ Audio Buttons Too Large
**Problem**: Audio control buttons are too big on mobile, causing the continuous button to shift off-screen slightly.

**Solution**: 
- Reduce button size on mobile from 48px to 36px
- Reduce icon size from 24px to 20px
- Adjust gap between buttons

**CSS Changes Needed**:
```css
@media (max-width: 768px) {
    .btn-icon {
        width: 36px;
        height: 36px;
        padding: var(--spacing-xs);
    }
    
    .audio-controls {
        gap: var(--spacing-xs);
    }
    
    .audio-controls svg {
        width: 20px;
        height: 20px;
    }
}
```

### 2. ✅ Prayer Content Doesn't Scroll to Top
**Problem**: When navigating to a new prayer (especially Apostles' Creed), the content starts scrolled down, requiring manual scroll up.

**Solution**: Add scroll-to-top behavior when step changes

**TypeScript Changes Needed** (`MysteryScreen.tsx`):
```typescript
// Add useRef for content container
const contentRef = useRef<HTMLDivElement>(null);

// Add useEffect to scroll to top on step change
useEffect(() => {
    if (contentRef.current) {
        contentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
}, [currentStep]);

// Add ref to content div
<div className="mystery-screen-content" ref={contentRef}>
```

### 3. ✅ Mystery Name & Progress Hard to Read
**Problem**: Mystery name and percentage completion barely visible due to theme color vs background.

**Solution**: 
- Change to white text with text-shadow for contrast
- Increase percentage font size from base to lg
- Add glow effect for better visibility

**CSS Changes**:
```css
.mystery-set-name {
    color: white;
    font-weight: 700;
    text-shadow: 0 2px 8px rgba(0, 0, 0, 0.4), 
                 0 0 20px rgba(124, 58, 237, 0.6);
}

.progress-info {
    font-size: var(--font-size-lg);  /* Increased from base */
    color: white;
    font-weight: 700;
    text-shadow: 0 2px 8px rgba(0, 0, 0, 0.4), 
                 0 0 20px rgba(236, 72, 153, 0.6);
}
```

### 4. ✅ Audio Read-Along Highlighting
**Problem**: Difficult to track where audio is currently reading in the text.

**Solution**: Implement word-by-word or sentence-by-sentence highlighting

**Implementation Options**:

#### Option A: Sentence Highlighting (Simpler, Better UX)
- Split prayer text into sentences
- Highlight current sentence being read
- Use estimated timing based on text length

```typescript
// In MysteryScreen.tsx
const [currentSentence, setCurrentSentence] = useState(0);

// Split text into sentences
const sentences = currentStep.text.split(/[.!?]+/).filter(s => s.trim());

// Estimate timing (avg 3 words per second)
const estimateReadingTime = (text: string) => {
    const words = text.split(' ').length;
    return (words / 3) * 1000; // milliseconds
};

// When audio plays, cycle through sentences
useEffect(() => {
    if (isPlaying && sentences.length > 0) {
        let currentIndex = 0;
        const intervals: NodeJS.Timeout[] = [];
        
        sentences.forEach((sentence, index) => {
            const delay = sentences.slice(0, index)
                .reduce((sum, s) => sum + estimateReadingTime(s), 0);
            
            const timeout = setTimeout(() => {
                setCurrentSentence(index);
            }, delay);
            
            intervals.push(timeout);
        });
        
        return () => intervals.forEach(clearTimeout);
    }
}, [isPlaying, currentStep]);
```

```css
/* Highlighted sentence */
.prayer-text-main .sentence {
    transition: all 0.3s ease;
}

.prayer-text-main .sentence.active {
    background: linear-gradient(120deg, rgba(124, 58, 237, 0.2), rgba(236, 72, 153, 0.2));
    padding: var(--spacing-xs) var(--spacing-sm);
    border-radius: var(--radius-md);
    font-weight: 600;
    color: var(--color-primary);
    box-shadow: 0 0 20px rgba(124, 58, 237, 0.3);
}
```

#### Option B: Word-by-Word (More Complex, More Precise)
- Requires Web Speech API or audio analysis
- More accurate but significantly more complex
- May not work well with TTS audio

**Recommendation**: Implement Option A (Sentence Highlighting)
- Better user experience
- Easier to follow
- Less distracting than word-by-word
- Works well with estimated timing

## Priority Order

1. **High Priority** (Do First):
   - Fix audio button sizes on mobile
   - Fix mystery name/progress visibility
   - Add scroll-to-top on step change

2. **Medium Priority** (Do Next):
   - Implement sentence highlighting for audio read-along

## Testing Checklist

After implementing fixes:
- [ ] Audio buttons fit on screen on mobile (iPhone SE, Android small)
- [ ] Mystery name clearly visible on all backgrounds
- [ ] Progress percentage easy to read
- [ ] Content scrolls to top when changing prayers
- [ ] Sentence highlighting works smoothly with audio
- [ ] No performance issues with highlighting
- [ ] Works in both English and Spanish
