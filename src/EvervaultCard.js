import React, { useState, useEffect } from "react";
import { useMotionValue, useMotionTemplate, motion } from "framer-motion";
import clsx from 'clsx';

const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
const generateRandomString = (length) => {
  let result = "";
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

// CORRECTED CardPattern component
export const CardPattern = ({ mouseX, mouseY, randomString, isHovered }) => {
  let maskImage = useMotionTemplate`radial-gradient(250px at ${mouseX}px ${mouseY}px, white, transparent)`;
  let style = { maskImage, WebkitMaskImage: maskImage };

  return (
    <div className="pointer-events-none">
      <div className={clsx("evervault-mask", { "is-hovered": isHovered })}></div>
      <motion.div
        className={clsx("evervault-gradient", { "is-hovered": isHovered })}
        style={style}
      />
      <motion.div
        className={clsx("evervault-blend-overlay", { "is-hovered": isHovered })}
        style={style}
      >
        <p className="absolute inset-x-0 text-xs h-full break-words whitespace-pre-wrap text-white font-mono font-bold">
          {randomString}
        </p>
      </motion.div>
    </div>
  );
};

export const EvervaultCard = ({ text, imageUrl, className }) => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const [randomString, setRandomString] = useState("");
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    let str = generateRandomString(1500);
    setRandomString(str);
  }, []);

  function onMouseMove({ currentTarget, clientX, clientY }) {
    let { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
    const str = generateRandomString(1500);
    setRandomString(str);
  }

  return (
    <div className={`evervault-wrapper ${className || ''}`}>
      <div
        onMouseMove={onMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="evervault-card"
      >
        <CardPattern
          mouseX={mouseX}
          mouseY={mouseY}
          randomString={randomString}
          isHovered={isHovered} // Pass hover state down
        />
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