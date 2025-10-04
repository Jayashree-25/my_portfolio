import React, { useState } from "react";
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

export const EvervaultCard = ({ text, imageUrl, className, hoverEffectEnabled = true }) => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const [isHovered, setIsHovered] = useState(false);

  function onMouseMove({ currentTarget, clientX, clientY }) {
    if (!hoverEffectEnabled) return; // Stop if effect is disabled
    let { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  return (
    <div className={`evervault-wrapper ${className || ''}`}>
      <div
        onMouseMove={onMouseMove}
        onMouseEnter={() => hoverEffectEnabled && setIsHovered(true)} // Only set hover if enabled
        onMouseLeave={() => hoverEffectEnabled && setIsHovered(false)} // Only set hover if enabled
        className={clsx("evervault-card", { "is-hovered": isHovered })}
      >
        {/* Render the pattern only if the effect is enabled */}
        {hoverEffectEnabled && (
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