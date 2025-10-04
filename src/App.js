import React, { useState, useEffect, useRef } from 'react';
import { Renderer, Program, Mesh, Triangle } from 'ogl';
import { EvervaultCard } from './EvervaultCard';
import { Link, Routes, Route } from 'react-router-dom';
import SkillsPage from './SkillsPage';
import './App.css';

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

const HomePage = () => {
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
        <section id="skills" className="content-section" style={{ backgroundColor: '#000' }}>
          <h1>My Skills</h1>
          <div className="skills-grid">
            {featuredSkills.map((skill) => (
              <EvervaultCard
                key={skill.name}
                text={skill.name}
                imageUrl={skill.imageUrl}
              />
            ))}
            {/* 4. USE <Link> COMPONENT FOR THE "VIEW ALL" CARD */}
            <Link to="/skills" className="view-all-card">
              <span className="plus-icon">+</span>
              <span>View All</span>
            </Link>
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

// --- App Component (Final Version) ---
function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/skills" element={<SkillsPage />} />
    </Routes>
  );
}

export default App;