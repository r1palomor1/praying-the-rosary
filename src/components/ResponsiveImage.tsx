import React from 'react';

interface ResponsiveImageProps {
    imageUrl?: string | {
        sm: string;
        md: string;
        lg: string;
    };
    alt?: string;
    className?: string;
    loading?: 'lazy' | 'eager';
}

export const ResponsiveImage: React.FC<ResponsiveImageProps> = ({
    imageUrl,
    alt,
    className = '',
    loading = 'lazy'
}) => {
    // Handle undefined imageUrl
    if (!imageUrl) {
        return null;
    }

    // If imageUrl is a string, use it directly (backward compatibility)
    if (typeof imageUrl === 'string') {
        return (
            <img
                src={imageUrl}
                alt={alt || ''}
                className={className}
                loading={loading}
                decoding="async"
            />
        );
    }

    // Otherwise, use responsive picture element
    return (
        <picture>
            <source
                media="(max-width: 640px)"
                srcSet={imageUrl.sm}
            />
            <source
                media="(max-width: 1024px)"
                srcSet={imageUrl.md}
            />
            <img
                src={imageUrl.lg}
                alt={alt || ''}
                className={className}
                loading={loading}
                decoding="async"
            />
        </picture>
    );
};

export default ResponsiveImage;
