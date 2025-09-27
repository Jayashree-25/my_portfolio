import React, { useState, useEffect } from 'react';
import './App.css';

const App = () => {
  const [stage, setStage] = useState('welcome');
  const [text, setText] = useState('');
  const fullText = '> Initializing UI... Done.';
  const typingSpeed = 50; // Milliseconds per character

  useEffect(() => {
    // Stage 1: "Welcome"
    if (stage === 'welcome') {
      const timer = setTimeout(() => {
        setStage('typing');
      }, 2000); // Display "Welcome" for 2 seconds
      return () => clearTimeout(timer);
    }

    // Stage 2: "Typing"
    if (stage === 'typing') {
      let i = 0;
      const typeInterval = setInterval(() => {
        if (i < fullText.length) {
          setText(prevText => prevText + fullText.charAt(i));
          i++;
        } else {
          clearInterval(typeInterval);
          setTimeout(() => {
            setStage('glitch'); // Move to the next stage
          }, 1000);
        }
      }, typingSpeed);
      return () => clearInterval(typeInterval);
    }
  }, [stage]);

  return (
    <div className="app-container">
      {/* Conditionally render based on the stage */}
      {stage === 'welcome' && (
        <div className="welcome-text fade-in-out">
          Welcome
        </div>
      )}

      {(stage === 'typing' || stage === 'glitch') && (
        <div className="terminal-container">
          <p className="typing-text">{text}
            <span className="blinking-cursor">_</span>
          </p>
        </div>
      )}
    </div>
  );
};

export default App;