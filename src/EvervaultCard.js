// src/EvervaultCard.js

import React, { useState, useEffect } from "react";
import { useMotionValue, useMotionTemplate, motion } from "framer-motion";
import clsx from 'clsx';

export const CardPattern = ({ mouseX, mouseY, isHovered }) => {
  let maskImage = useMotionTemplate`radial-gradient(250px at ${mouseX}px ${mouseY}px, white, transparent)`;
  let style = { maskImage, WebkitMaskImage: maskImage };

  return (
    <div className="pointer-events-none">
      <div className={clsx("evervault-mask", { "is-hovered": isHovered })}></div>
      <motion.div
        className={clsx("evervault-gradient", { "is-hovered": isHovered })}
        style={style}
      />
    </div>
  );
};

export const EvervaultCard = ({ text, imageUrl, className, hoverEffect = 'evervault' }) => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const [isHovered, setIsHovered] = useState(false);

  function onMouseMove({ currentTarget, clientX, clientY }) {
    if (hoverEffect !== 'evervault') return; // Only run for the default effect
    let { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  return (
    <div className={`evervault-wrapper ${className || ''}`}>
      <div
        onMouseMove={onMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={clsx(
          "evervault-card",
          // Only apply complex hover class if the effect is 'evervault'
          { "is-hovered": isHovered && hoverEffect === 'evervault' },
          // Apply a simple zoom class if the effect is 'zoom'
          { "zoom-hover": hoverEffect === 'zoom' }
        )}
      >
        {/* Only render the complex pattern for the 'evervault' effect */}
        {hoverEffect === 'evervault' && (
            <CardPattern
              mouseX={mouseX}
              mouseY={mouseY}
              isHovered={isHovered}
            />
        )}
        <div className="evervault-content-container">
          <div className="evervault-content">
            <img src={imageUrl} alt={text} className="evervault-icon" />
            <span className="evervault-text">{text}</span>
          </div>
        </div>
      </div>
    </div>
  );
};