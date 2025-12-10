// Utility to get the appropriate image URL based on screen size
export function getResponsiveImageUrl(imageUrl: string | { sm: string; md: string; lg: string }): string {
    // If it's still a string (old format), return it as-is
    if (typeof imageUrl === 'string') {
        return imageUrl;
    }

    // New format: return appropriate size based on screen width
    const width = window.innerWidth;

    if (width <= 640) {
        return imageUrl.sm;
    } else if (width <= 1024) {
        return imageUrl.md;
    } else {
        return imageUrl.lg;
    }
}
