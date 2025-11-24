
import './BeadCounter.css';

interface BeadCounterProps {
    currentBead: number; // 0 = Our Father, 1-10 = Hail Marys
    onBeadClick: (bead: number) => void;
}

export function BeadCounter({ currentBead, onBeadClick }: BeadCounterProps) {
    return (
        <div className="bead-counter">
            {/* Our Father bead (larger) */}
            <button
                className={`bead bead-our-father ${currentBead === 0 ? 'active' : ''} ${currentBead > 0 ? 'completed' : ''}`}
                onClick={() => onBeadClick(0)}
                aria-label="Our Father"
            />

            {/* 10 Hail Mary beads */}
            <div className="hail-mary-beads">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((bead) => (
                    <button
                        key={bead}
                        className={`bead bead-hail-mary ${currentBead === bead ? 'active' : ''} ${currentBead > bead ? 'completed' : ''}`}
                        onClick={() => onBeadClick(bead)}
                        aria-label={`Hail Mary ${bead}`}
                    />
                ))}
            </div>
        </div>
    );
}
