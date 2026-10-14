import React, { useState } from 'react';

export default function Card3DTilt({ children, className = '', maxTilt = 10 }) {
    const [style, setStyle] = useState({ transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)' });

    const handleMouseMove = (e) => {
        const card = e.currentTarget;
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const rotateX = ((y - centerY) / centerY) * -maxTilt;
        const rotateY = ((x - centerX) / centerX) * maxTilt;

        setStyle({
            transform: `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale3d(1.02, 1.02, 1.02)`,
            transition: 'transform 0.1s ease-out'
        });
    };

    const handleMouseLeave = () => {
        setStyle({
            transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
            transition: 'transform 0.4s ease-out'
        });
    };

    return (
        <div
            className={`perspective-1000 transform-style-3d ${className}`}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={style}
        >
            {children}
        </div>
    );
}
