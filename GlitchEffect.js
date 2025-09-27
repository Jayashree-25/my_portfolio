import React, { useEffect } from 'react';
import './GlitchEffect.css';

const GlitchEffect = ({ onAnimationComplete }) => {
  useEffect(() => {
    // This is the total duration for the glitch effect
    const timer = setTimeout(() => {
      onAnimationComplete();
    }, 800); 

    return () => clearTimeout(timer);
  }, [onAnimationComplete]);

  return (
    <div className="glitch-container fade-in-out">
      <div className="glitch-text" data-text="LOADING">LOADING</div>
    </div>
  );
};

export default GlitchEffect;