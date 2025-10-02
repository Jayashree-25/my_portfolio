import React, { useState, useEffect, useRef } from 'react';
import { Renderer, Program, Mesh, Triangle } from 'ogl';
import { EvervaultCard } from './EvervaultCard';

// --- Plasma Component ---
const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return [1, 0.5, 0.2];
  return [parseInt(result[1], 16) / 255, parseInt(result[2], 16) / 255, parseInt(result[3], 16) / 255];
};

const vertex = `#version 300 es
precision highp float;
in vec2 position;
in vec2 uv;
out vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const fragment = `#version 300 es
precision highp float;
uniform vec2 iResolution;
uniform float iTime;
uniform vec3 uCustomColor;
uniform float uUseCustomColor;
uniform float uSpeed;
uniform float uDirection;
uniform float uScale;
uniform float uOpacity;
uniform vec2 uMouse;
uniform float uMouseInteractive;
out vec4 fragColor;

void mainImage(out vec4 o, vec2 C) {
  vec2 center = iResolution.xy * 0.5;
  C = (C - center) / uScale + center;

  vec2 mouseOffset = (uMouse - center) * 0.0002;
  C += mouseOffset * length(C - center) * step(0.5, uMouseInteractive);

  float i, d, z, T = iTime * uSpeed * uDirection;
  vec3 O, p, S;

  for (vec2 r = iResolution.xy, Q; ++i < 60.; O += o.w/d*o.xyz) {
    p = z*normalize(vec3(C-.5*r,r.y));
    p.z -= 4.;
    S = p;
    d = p.y-T;

    p.x += .4*(1.+p.y)*sin(d + p.x*0.1)*cos(.34*d + p.x*0.05);
    Q = p.xz *= mat2(cos(p.y+vec4(0,11,33,0)-T));
    z+= d = abs(sqrt(length(Q*Q)) - .25*(5.+S.y))/3.+8e-4;
    o = 1.+sin(S.y+p.z*.5+S.z-length(S-p)+vec4(2,1,0,8));
  }

  o.xyz = tanh(O/1e4);
}

bool finite1(float x){ return !(isnan(x) || isinf(x)); }
vec3 sanitize(vec3 c){
  return vec3(
    finite1(c.r) ? c.r : 0.0,
    finite1(c.g) ? c.g : 0.0,
    finite1(c.b) ? c.b : 0.0
  );
}

void main() {
  vec4 o = vec4(0.0);
  mainImage(o, gl_FragCoord.xy);
  vec3 rgb = sanitize(o.rgb);

  float intensity = (rgb.r + rgb.g + rgb.b) / 3.0;
  vec3 customColor = intensity * uCustomColor;
  vec3 finalColor = mix(rgb, customColor, step(0.5, uUseCustomColor));

  float alpha = length(rgb) * uOpacity;
  fragColor = vec4(finalColor, alpha);
}`;

const Plasma = ({
  color = '#ffffff',
  speed = 1,
  direction = 'forward',
  scale = 1,
  opacity = 1,
  mouseInteractive = true
}) => {
  const containerRef = useRef(null);
  const mousePos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!containerRef.current) return;

    const currentContainer = containerRef.current;

    const useCustomColor = color ? 1.0 : 0.0;
    const customColorRgb = color ? hexToRgb(color) : [1, 1, 1];

    const directionMultiplier = direction === 'reverse' ? -1.0 : 1.0;

    const renderer = new Renderer({
      webgl: 2,
      alpha: true,
      antialias: false,
      dpr: Math.min(window.devicePixelRatio || 1, 2)
    });
    const gl = renderer.gl;
    const canvas = gl.canvas;
    canvas.style.display = 'block';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    currentContainer.appendChild(canvas);

    const geometry = new Triangle(gl);

    const program = new Program(gl, {
      vertex: vertex,
      fragment: fragment,
      uniforms: {
        iTime: { value: 0 },
        iResolution: { value: new Float32Array([1, 1]) },
        uCustomColor: { value: new Float32Array(customColorRgb) },
        uUseCustomColor: { value: useCustomColor },
        uSpeed: { value: speed * 0.4 },
        uDirection: { value: directionMultiplier },
        uScale: { value: scale },
        uOpacity: { value: opacity },
        uMouse: { value: new Float32Array([0, 0]) },
        uMouseInteractive: { value: mouseInteractive ? 1.0 : 0.0 }
      }
    });

    const mesh = new Mesh(gl, { geometry, program });

    const handleMouseMove = (e) => {
      if (!mouseInteractive) return;
      const rect = currentContainer.getBoundingClientRect();
      mousePos.current.x = e.clientX - rect.left;
      mousePos.current.y = e.clientY - rect.top;
      const mouseUniform = program.uniforms.uMouse.value;
      mouseUniform[0] = mousePos.current.x;
      mouseUniform[1] = mousePos.current.y;
    };

    if (mouseInteractive) {
      currentContainer.addEventListener('mousemove', handleMouseMove);
    }

    const setSize = () => {
      const rect = currentContainer.getBoundingClientRect();
      const width = Math.max(1, Math.floor(rect.width));
      const height = Math.max(1, Math.floor(rect.height));
      renderer.setSize(width, height);
      const res = program.uniforms.iResolution.value;
      res[0] = gl.drawingBufferWidth;
      res[1] = gl.drawingBufferHeight;
    };

    const ro = new ResizeObserver(setSize);
    ro.observe(currentContainer);
    setSize();

    let raf = 0;
    const t0 = performance.now();
    const loop = (t) => {
      let timeValue = (t - t0) * 0.001;

      if (direction === 'pingpong') {
        const cycle = Math.sin(timeValue * 0.5) * directionMultiplier;
        program.uniforms.uDirection.value = cycle;
      }

      program.uniforms.iTime.value = timeValue;
      renderer.render({ scene: mesh });
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      if (mouseInteractive && currentContainer) {
        currentContainer.removeEventListener('mousemove', handleMouseMove);
      }
      try {
        currentContainer?.removeChild(canvas);
      } catch (e) {
        // Ignore errors on cleanup
      }
    };
  }, [color, speed, direction, scale, opacity, mouseInteractive]);

  return <div ref={containerRef} className="fixed top-0 left-0 w-full h-full -z-10" />;
};


// --- App Component (Final Version) ---
function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [typedText, setTypedText] = useState('');
  const imageRef = useRef(null);

  const typingSpeed = 40;
  const pauseDuration = 1200;

  const textIndexRef = useRef(0);
  const charIndexRef = useRef(0);

  const skills = [
    { name: "HTML5", imageUrl: "/icons/html.png" },
    { name: "CSS3", imageUrl: "/icons/css.png" },
    { name: "JavaScript", imageUrl: "/icons/javascript.png" },
    { name: "React", imageUrl: "/icons/react.png" },
    { name: "Node.js", imageUrl: "/icons/node.png" },
    { name: "Express", imageUrl: "/icons/express.png" },
    { name: "MongoDB", imageUrl: "/icons/mongodb.png" },
    { name: "tailwindcss", imageUrl: "/icons/tailwind.png" },
    { name: "Java", imageUrl: "/icons/java.png" },
    { name: "python", imageUrl: "/icons/python.png" },
    { name: "Git", imageUrl: "/icons/git.png" },
    { name: "GitHub", imageUrl: "/icons/github.png" },
    { name: "Vs Code", imageUrl: "/icons/vsStudio.png" }
  ];

  const featuredSkills = skills.slice(0, 9);

  useEffect(() => {
    const textArray = [
      "MERN Stack Developer || Full-Stack Web Developer",
      "MongoDB & Cloud Integration Engineer || Real-Time App Developer (Socket.io)",
      "Open-Source Contributor || Computer Science Undergraduate Developer"
    ];

    let timeoutId;
    const type = () => {
      const currentString = textArray[textIndexRef.current];
      if (charIndexRef.current < currentString.length) {
        setTypedText(currentString.substring(0, charIndexRef.current + 1));
        charIndexRef.current++;
        timeoutId = setTimeout(type, typingSpeed);
      } else {
        timeoutId = setTimeout(() => {
          textIndexRef.current = (textIndexRef.current + 1) % textArray.length;
          charIndexRef.current = 0;
          setTypedText('');
          timeoutId = setTimeout(type, typingSpeed);
        }, pauseDuration);
      }
    };
    timeoutId = setTimeout(type, typingSpeed);
    return () => clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // NEW useEffect FOR IMAGE TILT & GLOW EFFECT
  useEffect(() => {
    const image = imageRef.current;
    if (!image) return;

    const handleMouseMove = (e) => {
      const { left, top, width, height } = image.getBoundingClientRect();
      const x = e.clientX - left;
      const y = e.clientY - top;

      const mouseXPercent = x / width;
      const mouseYPercent = y / height;

      const rotateY = (mouseXPercent - 0.5) * 2 * 8; // Max 15deg tilt
      const rotateX = -(mouseYPercent - 0.5) * 2 * 8;

      image.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.05, 1.05, 1.05)`;

      image.style.setProperty('--mouse-x', `${x}px`);
      image.style.setProperty('--mouse-y', `${y}px`);
    };

    const handleMouseLeave = () => {
      image.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
    };

    image.addEventListener('mousemove', handleMouseMove);
    image.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      image.removeEventListener('mousemove', handleMouseMove);
      image.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return (
    <div className="App" id="home">
      <style jsx="true">{`
            :global(html) {
              scroll-behavior: smooth;
            }
            .App { background-color: #000; color: white; }
            .App-header { position: fixed; top: 0; left: 0; width: 100%; padding: 20px 50px; box-sizing: border-box; z-index: 10; display: flex; justify-content: space-between; align-items: center; transition: width 0.4s ease-in-out, top 0.4s ease-in-out, padding 0.4s ease-in-out, background-color 0.4s ease-in-out, backdrop-filter 0.4s ease-in-out; will-change: width, top, padding; }
            .App-header.scrolled { background-color: rgba(10, 10, 10, 0.7); backdrop-filter: blur(10px); padding: 15px 50px; top: 15px; left: 50%; transform: translateX(-50%); width: 95%; max-width: 1200px; border-radius: 12px; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2); }
            .logo { font-size: 1.8rem; font-weight: bold; color: white; text-decoration: none; transition: font-size 0.4s ease; }
            .App-header.scrolled .logo { font-size: 1.5rem; }
            .main-nav { display: flex; }
            .main-nav a { color: white; text-decoration: none; margin: 0 15px; font-size: 1.2rem; transition: color 0.3s ease; }
            .main-nav a:last-child { margin-right: 0; }
            .main-nav a:hover { color: #B19EEF; }
            .hamburger { display: none; flex-direction: column; justify-content: space-around; width: 2rem; height: 2rem; background: transparent; border: none; cursor: pointer; padding: 0; z-index: 20; }
            .hamburger:focus { outline: none; }
            .hamburger .line { width: 2rem; height: 0.25rem; background: white; border-radius: 10px; transition: all 0.3s linear; position: relative; transform-origin: 1px; }
            .hamburger.open .line:nth-child(1) { transform: rotate(45deg); }
            .hamburger.open .line:nth-child(2) { opacity: 0; transform: translateX(20px); }
            .hamburger.open .line:nth-child(3) { transform: rotate(-45deg); }
            
            /* CORRECTED HERO OVERLAY - REMOVED POINTER EVENTS */
            .hero-name-overlay { position: absolute; top: 0; left: 0; width: 100%; height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center; z-index: 1; }

            .intro-text { font-size: 1.5rem; color: #ccc; margin: 0; text-align: center; }
            .main-name { font-size: 6rem; margin: 0; text-align: center; line-height: 1.1; }
            .subtitle { font-size: 1.4rem; text-align: center; margin-top: 1rem; color: #ccc; }
            .typewriter-cursor::after { content: '|'; color: white; animation: blink 1s step-end infinite; }
            @keyframes blink { from, to { color: transparent; } 50% { color: white; } }
            .content-section { min-height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center; padding: 100px 50px; box-sizing: border-box; position: relative; }
            .content-section h1 { font-size: 4rem; margin-bottom: 20px; text-align: center; }
            .content-section p { font-size: 1.2rem; max-width: 600px; text-align: center; color: #ccc; }
            .scroll-down-arrow { position: absolute; bottom: 30px; left: 50%; transform: translateX(-50%); z-index: 5; }
            .scroll-down-arrow span { display: block; width: 20px; height: 20px; border-bottom: 2px solid white; border-right: 2px solid white; transform: rotate(45deg); animation: bounce 2s infinite; }
            @keyframes bounce { 0%, 20%, 50%, 80%, 100% { transform: translateY(0) rotate(45deg); } 40% { transform: translateY(-15px) rotate(45deg); } 60% { transform: translateY(-8px) rotate(45deg); } }
            
            .about-content { display: flex; align-items: center; justify-content: center; gap: 50px; max-width: 950px; width: 100%; flex-wrap: wrap; }
            .about-image-wrapper { perspective: 1000px; }
            .about-image { width: 320px; height: 400px; border-radius: 30%; object-fit: cover; border: 3px solid #B19EEF; flex-shrink: 0; position: relative; transition: transform 0.4s ease-out; will-change: transform; }
            .about-image::before { content: ''; position: absolute; top: 0; left: 0; width: 100%; height: 100%; border-radius: inherit; background: radial-gradient( 250px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(177, 158, 239, 0.5), transparent 80% ); opacity: 0; transition: opacity 0.4s ease-out; }
            .about-image:hover::before { opacity: 1; }
            .about-text { flex: 1; min-width: 300px; }
            .about-text h3 { font-size: 2rem; margin-bottom: 15px; color: #B19EEF; }
            .about-text p { text-align: left; line-height: 1.6; max-width: 100%; }

            /* === CSS FOR EVERVAULT SKILL CARDS (CORRECTED) === */
            .skills-grid { 
              display: grid; 
              grid-template-columns: repeat(5, 1fr); 
              gap: 25px; 
              width: 100%; 
              max-width: 1000px; 
            }
            .view-all-card {
              background-color: transparent;
              border: 2px solid rgba(255, 255, 255, 0.2);
              border-radius: 1.5rem;
              aspect-ratio: 1 / 1;
              display: flex;
              align-items: center;
              justify-content: center;
              flex-direction: column;
              color: rgba(255, 255, 255, 0.5);
              font-weight: 700;
              font-size: 1.125rem;
              text-decoration: none;
              transition: all 0.3s ease;
            }
            .view-all-card:hover {
              border-color: linear-gradient(90deg, #886be7, #1a0c47);
              color: #B19EEF;
              background-color: rgba(177, 158, 239, 0.1);
            }
            .plus-icon {
              font-size: 3rem;
              line-height: 1;
              font-weight: 200;
            }
            .evervault-wrapper { background: transparent; aspect-ratio: 1 / 1; display: flex; align-items: center; justify-content: center; position: relative; }
            .evervault-card { border-radius: 1.5rem; width: 100%; position: relative; overflow: hidden; background-color: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); display: flex; align-items: center; justify-content: center; height: 100%; }
            .evervault-mask, .evervault-gradient, .evervault-blend-overlay { position: absolute; inset: 0; border-radius: 1.5rem; opacity: 0; transition: opacity 0.5s ease; }
            .evervault-mask { mask-image: linear-gradient(white, transparent); }
            .evervault-gradient { background-image: linear-gradient(to right, #886be7, #1a0c47); backdrop-filter: blur(16px); }
            .evervault-blend-overlay { mix-blend-mode: overlay; }
            .evervault-blend-overlay p { position: absolute; inset: 0; font-family: monospace; font-weight: 700; color: white; }
            .evervault-content-container { position: relative; z-index: 10; display: flex; align-items: center; justify-content: center; }
            .evervault-content { display: flex; flex-direction: column; align-items: center; justify-content: center; color: white; font-weight: 700; transition: opacity 0.5s ease; }
            .evervault-icon { width: 4rem; height: 4rem; margin-bottom: 0.75rem; }
            .evervault-text { z-index: 20; font-size: 1.125rem; }
            
            .evervault-mask.is-hovered,
            .evervault-gradient.is-hovered,
            .evervault-blend-overlay.is-hovered {
              opacity: 1;
            }
            .evervault-card.is-hovered .evervault-content {
              opacity: 0.2; /* Fade out the content on hover */
            }
            /* === CSS END === */

            @media (max-width: 900px) { .skills-grid { grid-template-columns: repeat(4, 1fr); } }
            @media (max-width: 768px) { .skills-grid { grid-template-columns: repeat(3, 1fr); } }
            @media (max-width: 480px) { .skills-grid { grid-template-columns: repeat(2, 1fr); } }
            @media (max-width: 768px) {
                .App-header { padding: 20px 30px; }
                .App-header.scrolled { padding: 10px 20px; width: 90%; }
                .main-nav { display: none; }
                .main-nav.open { display: flex; flex-direction: column; justify-content: center; align-items: center; position: fixed; top: 0; right: 0; width: 100%; height: 100vh; background: rgba(0, 0, 0, 0.98); }
                .main-nav a { font-size: 2rem; margin: 2rem 0; }
                .hamburger { display: flex; }
                .content-section h1 { font-size: 2.5rem; }
                .main-name { font-size: 3.5rem; }
                .intro-text { font-size: 1.2rem; }
                .about-content { text-align: center; }
                .about-text p { text-align: center; }
            }
      `}</style>
      <Plasma
        color="#B19EEF"
        speed={0.5}
        scale={1.2}
        opacity={1.0}
        mouseInteractive={true}
      />
      <header className={`App-header ${isScrolled ? 'scrolled' : ''}`}>
        <a href="#home" className="logo">My Portfolio</a>
        <nav className={`main-nav ${isMenuOpen ? 'open' : ''}`}>
          <a href="#home" onClick={() => setIsMenuOpen(false)}>Home</a>
          <a href="#about" onClick={() => setIsMenuOpen(false)}>About</a>
          <a href="#skills" onClick={() => setIsMenuOpen(false)}>Skills</a>
          <a href="#contact" onClick={() => setIsMenuOpen(false)}>Contact</a>
        </nav>
        <button className={`hamburger ${isMenuOpen ? 'open' : ''}`} onClick={() => setIsMenuOpen(!isMenuOpen)} aria-label="Open navigation menu">
          <div className="line"></div>
          <div className="line"></div>
          <div className="line"></div>
        </button>
      </header>

      <div className="hero-name-overlay">
        <p className="intro-text">Hello, I am</p>
        <h1 className="main-name">Jayashree Das</h1>
        <p className="subtitle typewriter-cursor">{typedText}</p>
      </div>

      <a href="#about" className="scroll-down-arrow" aria-label="Scroll to next section">
        <span></span>
      </a>

      <main>
        <section id="about" className="content-section" style={{ backgroundColor: '#000' }}>
          <h1>About Me</h1>
          <div className="about-content">
            {/* 3. ADDED WRAPPER DIV */}
            <div className="about-image-wrapper">
              <img
                ref={imageRef}
                src="/profile.png"
                alt="Jayashree"
                className="about-image"
              />
            </div>
            <div className="about-text">
              <h3>MERN Stack Developer</h3>
              <p>
                Hi, I'm a full-stack developer and Computer Science student who loves bringing ideas to life on the web. My journey into the world of code is driven by a deep curiosity for solving real-world problems. I specialize in the MERN stack (MongoDB, Express.js, React, Node.js), building dynamic and responsive web applications from concept to deployment.
              </p>
              <p>
                Outside of my projects, I'm an enthusiastic open-source contributor, as I believe in the power of community and collaborative learning. I'm constantly seeking new challenges that will push my skills to the next level.
              </p>
            </div>
          </div>
        </section>

        {/* === 2. SIMPLIFIED SKILLS SECTION === */}
        <section id="skills" className="content-section" style={{backgroundColor: '#000'}}>
          <h1>My Skills</h1>
          <div className="skills-grid">
            {/* Map over the first 9 skills */}
            {featuredSkills.map((skill) => (
              <EvervaultCard
                key={skill.name}
                text={skill.name}
                imageUrl={skill.imageUrl}
              />
            ))}
            {/* Add the special "View All" card */}
            <a href="/skills" className="view-all-card">
              <span className="plus-icon">+</span>
              <span>View All</span>
            </a>
          </div>
        </section>

        <section id="contact" className="content-section" style={{ backgroundColor: '#000' }}>
          <h1>Contact</h1>
          <p>Here you can add a contact form or links to your social media profiles.</p>
        </section>
      </main>
    </div>
  );
}

export default App;