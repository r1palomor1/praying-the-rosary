import { Plus, Minus } from 'lucide-react';

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
            alignItems: 'center',
            gap: '12px',
            width: '100%'
        }}>
            {/* Label */}
            <div style={{
                fontSize: '13px',
                color: '#999',
                minWidth: '100px',
                textAlign: 'left',
                fontWeight: 600
            }}>
                {label}
            </div>

            {/* Minus Button */}
            <button
                onClick={onDecrement}
                style={{
                    background: '#4C6EF5',
                    border: 'none',
                    borderRadius: '6px',
                    width: '28px',
                    height: '28px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: 'white',
                    flexShrink: 0
                }}
                aria-label={`Decrease ${label}`}
            >
                <Minus size={16} />
            </button>

            {/* Slider */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <input
                    type="range"
                    min="0"
                    max={max}
                    step={step}
                    value={value}
                    onChange={(e) => onChange(parseFloat(e.target.value))}
                    style={{
                        width: '100%',
                        height: '4px',
                        borderRadius: '2px',
                        outline: 'none',
                        background: `linear-gradient(to right, #4C6EF5 0%, #4C6EF5 ${(value / max) * 100}%, #333 ${(value / max) * 100}%, #333 100%)`,
                        cursor: 'pointer'
                    }}
                    aria-label={`${label} slider`}
                />
            </div>

            {/* Value Display */}
            <div style={{
                color: '#4C6EF5',
                fontWeight: 600,
                fontSize: '15px',
                minWidth: '50px',
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
                    width: '28px',
                    height: '28px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: 'white',
                    flexShrink: 0
                }}
                aria-label={`Increase ${label}`}
            >
                <Plus size={16} />
            </button>
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
            gap: '12px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            maxWidth: '90%',
            width: '500px'
        }}>
            {/* Title */}
            <div style={{
                fontSize: '13px',
                color: '#4C6EF5',
                fontWeight: 700,
                textAlign: 'center',
                marginBottom: '4px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
            }}>
                🎨 Debug Opacity Controls
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
        </div>
    );
}
