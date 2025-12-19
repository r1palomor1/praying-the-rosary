import { Plus, Minus, Settings } from 'lucide-react';
import { useState } from 'react';

interface DebugOpacitySliderProps {
    baseOpacity: number;
    secondaryOpacity: number;
    onBaseOpacityChange: (value: number) => void;
    onSecondaryOpacityChange: (value: number) => void;
    visible: boolean;
}

export function DebugOpacitySlider({
    baseOpacity,
    secondaryOpacity,
    onBaseOpacityChange,
    onSecondaryOpacityChange,
    visible
}: DebugOpacitySliderProps) {
    const [isExpanded, setIsExpanded] = useState(true);

    if (!visible) return null;

    const handleBaseIncrement = () => {
        const newValue = Math.min(100, baseOpacity + 1);
        onBaseOpacityChange(newValue);
    };

    const handleBaseDecrement = () => {
        const newValue = Math.max(0, baseOpacity - 1);
        onBaseOpacityChange(newValue);
    };

    const handleSecondaryIncrement = () => {
        const newValue = Math.min(100, secondaryOpacity + 0.5);
        onSecondaryOpacityChange(newValue);
    };

    const handleSecondaryDecrement = () => {
        const newValue = Math.max(0, secondaryOpacity - 0.5);
        onSecondaryOpacityChange(newValue);
    };

    // Collapsed state - just show icon
    if (!isExpanded) {
        return (
            <button
                onClick={() => setIsExpanded(true)}
                style={{
                    position: 'fixed',
                    bottom: '90px',
                    right: '20px',
                    zIndex: 100,
                    background: 'rgba(76, 110, 245, 0.9)',
                    backdropFilter: 'blur(10px)',
                    padding: '12px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
                    border: '2px solid rgba(255, 255, 255, 0.2)',
                    cursor: 'pointer',
                    color: 'white'
                }}
                aria-label="Open debug controls"
            >
                <Settings size={24} />
            </button>
        );
    }

    const SliderRow = ({
        label,
        value,
        onChange,
        onIncrement,
        onDecrement,
        step = 1,
        max = 100
    }: {
        label: string;
        value: number;
        onChange: (val: number) => void;
        onIncrement: () => void;
        onDecrement: () => void;
        step?: number;
        max?: number;
    }) => (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            width: '100%'
        }}>
            {/* Top Row: Label, Value, +/- Buttons */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%'
            }}>
                {/* Label */}
                <div style={{
                    fontSize: '13px',
                    color: '#999',
                    fontWeight: 600
                }}>
                    {label}
                </div>

                {/* Right side: Value and buttons */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                }}>
                    {/* Minus Button */}
                    <button
                        onClick={onDecrement}
                        style={{
                            background: '#4C6EF5',
                            border: 'none',
                            borderRadius: '6px',
                            width: '32px',
                            height: '32px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            color: 'white',
                            flexShrink: 0
                        }}
                        aria-label={`Decrease ${label}`}
                    >
                        <Minus size={18} />
                    </button>

                    {/* Value Display */}
                    <div style={{
                        color: '#4C6EF5',
                        fontWeight: 600,
                        fontSize: '15px',
                        minWidth: '55px',
                        textAlign: 'center'
                    }}>
                        {value.toFixed(1)}%
                    </div>

                    {/* Plus Button */}
                    <button
                        onClick={onIncrement}
                        style={{
                            background: '#4C6EF5',
                            border: 'none',
                            borderRadius: '6px',
                            width: '32px',
                            height: '32px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            color: 'white',
                            flexShrink: 0
                        }}
                        aria-label={`Increase ${label}`}
                    >
                        <Plus size={18} />
                    </button>
                </div>
            </div>

            {/* Bottom Row: Slider (full width) */}
            <div style={{ width: '100%', paddingLeft: '4px', paddingRight: '4px' }}>
                <input
                    type="range"
                    min="0"
                    max={max}
                    step={step}
                    value={value}
                    onChange={(e) => onChange(parseFloat(e.target.value))}
                    style={{
                        width: '100%',
                        height: '8px',
                        borderRadius: '4px',
                        outline: 'none',
                        background: `linear-gradient(to right, #4C6EF5 0%, #4C6EF5 ${(value / max) * 100}%, #333 ${(value / max) * 100}%, #333 100%)`,
                        cursor: 'pointer',
                        WebkitAppearance: 'none',
                        appearance: 'none'
                    }}
                    aria-label={`${label} slider`}
                />
            </div>
        </div>
    );

    return (
        <div style={{
            position: 'fixed',
            bottom: '80px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 100,
            background: 'rgba(0, 0, 0, 0.9)',
            backdropFilter: 'blur(10px)',
            padding: '16px 20px',
            borderRadius: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            maxWidth: '90%',
            width: '450px'
        }}>
            {/* Header with Title and Collapse Button */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '4px'
            }}>
                <div style={{
                    fontSize: '13px',
                    color: '#4C6EF5',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                }}>
                    🎨 Debug Opacity Controls
                </div>
                <button
                    onClick={() => setIsExpanded(false)}
                    style={{
                        background: 'transparent',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '6px',
                        padding: '4px 8px',
                        cursor: 'pointer',
                        color: '#999',
                        fontSize: '11px',
                        fontWeight: 600
                    }}
                    aria-label="Collapse debug controls"
                >
                    Collapse
                </button>
            </div>

            {/* Base Gradient Slider */}
            <SliderRow
                label="Base Gradient"
                value={baseOpacity}
                onChange={onBaseOpacityChange}
                onIncrement={handleBaseIncrement}
                onDecrement={handleBaseDecrement}
                step={1}
                max={100}
            />

            {/* Secondary Overlay Slider */}
            <SliderRow
                label="Secondary Layer"
                value={secondaryOpacity}
                onChange={onSecondaryOpacityChange}
                onIncrement={handleSecondaryIncrement}
                onDecrement={handleSecondaryDecrement}
                step={0.5}
                max={20}
            />

            {/* Help Text */}
            <div style={{
                fontSize: '13px',
                color: 'white',
                textAlign: 'center',
                marginTop: '4px',
                fontStyle: 'italic'
            }}>
                Lower = Brighter • Higher = Darker
            </div>

            {/* Add CSS for better slider styling */}
            <style>{`
                input[type="range"]::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    appearance: none;
                    width: 20px;
                    height: 20px;
                    border-radius: 50%;
                    background: #4C6EF5;
                    cursor: pointer;
                    border: 2px solid white;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
                }
                
                input[type="range"]::-moz-range-thumb {
                    width: 20px;
                    height: 20px;
                    border-radius: 50%;
                    background: #4C6EF5;
                    cursor: pointer;
                    border: 2px solid white;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
                }
            `}</style>
        </div>
    );
}
