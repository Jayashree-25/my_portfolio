import React, { useState, useEffect, useRef } from 'react';
import { Renderer, Program, Mesh, Triangle } from 'ogl';
import { EvervaultCard } from './EvervaultCard';
import { Link, Routes, Route, useLocation } from 'react-router-dom';
import SkillsPage from './SkillsPage';
import './App.css';
import ProjectsPage from './ProjectsPage';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

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

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
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

  const allProjects = [
    {
      title: "Social-Chat",
      description: "A full-stack social media application that allows users to share posts, upload pictures, follow other users, like and comment on posts. Designed with an intuitive interface and real-time updates to create an engaging social experience.",
      imageUrl: "/Socialchat.png",
      link: "#"
    },
    {
      title: "Journal_Web",
      description: "A personal journal application that enables users to create, read, update, and delete their own entries. Focused on simplicity and privacy, allowing users to manage and revisit their thoughts easily.",
      imageUrl: "/Journal_web.png",
      link: "#"
    },
    {
      title: "Pokedex",
      description: "A web app displaying data for over 800 Pokémon with detailed information and search functionality. Designed for smooth browsing and quick lookup of Pokémon stats, abilities, and types.",
      imageUrl: "/Pokedex.png",
      link: "#"
    }
  ];

  const featuredProjects = allProjects.slice(0, 3);

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

  // ADD THIS NEW useEffect FOR SCROLL ANIMATIONS
  useEffect(() => {
    // Register the ScrollTrigger plugin
    gsap.registerPlugin(ScrollTrigger);

    // Select all content sections to animate
    const sections = document.querySelectorAll('.content-section');

    sections.forEach((section) => {
      // Find the elements inside each section to animate
      const elementsToAnimate = section.querySelectorAll('h1, .about-content, .skills-grid, .projects-grid, .view-all-button, .contact-container');

      // Set the initial state before animating
      gsap.set(elementsToAnimate, { opacity: 0, y: 50 });

      ScrollTrigger.create({
        trigger: section,
        start: "top 80%",
        onEnter: () => gsap.to(elementsToAnimate, {
          opacity: 1,
          y: 0,
          duration: 1,
          ease: "power3.out",
          stagger: 0.2, // Animates elements one after another
        }),
        once: false // Ensures the animation not happens once
      });
    });
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

      <a href="#projects" className="scroll-down-arrow" aria-label="Scroll to next section">
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
          <h1>Tech Stack</h1>
          <div className="skills-grid">
            {featuredSkills.map((skill) => (
              <EvervaultCard
                key={skill.name}
                text={skill.name}
                imageUrl={skill.imageUrl}
              />
            ))}
            {/*  USE <Link> COMPONENT FOR THE "VIEW ALL" CARD */}
            <Link to="/skills" className="view-all-card">
              <span className="plus-icon">+</span>
              <span>View All</span>
            </Link>
          </div>
        </section>

        {/* 3. UPDATED PROJECTS SECTION */}
        <section id="projects" className="content-section">
          <h1>My Projects</h1>
          <div className="projects-grid">
            {featuredProjects.map((project) => (
              <a key={project.title} href={project.link} className="project-card" target="_blank" rel="noopener noreferrer">
                <img src={project.imageUrl} alt={project.title} className="project-image" />
                <div className="project-content">
                  <h3 className="project-title">{project.title}</h3>
                  <p className="project-description">{project.description}</p>
                </div>
              </a>
            ))}
          </div>
          <Link to="/projects" className="view-all-button">
            View All Projects
          </Link>
        </section>

        <section id="contact" className="content-section">
          <div className="contact-container">
            <div className="contact-info">
              <h1>Get in Touch</h1>
              <p className="contact-intro-text">
                I'm always open to discussing new projects, creative ideas, or opportunities to be part of your vision. Feel free to reach out.
              </p>

              <div className="contact-details">
                <p className="contact-detail-item">
                  <svg xmlns="http://www.w3.org/2000/svg" className="contact-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>India</span>
                </p>

                <p className="contact-detail-item">
                  <svg xmlns="http://www.w3.org/2000/svg" className="contact-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span>jayashree.xlite@gmail.com</span>
                </p>
              </div>

              <div className="social-links-container">
                <h3>Follow me</h3>
                <div className="social-icons">
                  <a href={"https://github.com/Jayashree-25"} target="_blank" rel="noopener noreferrer" className="social-icon">
                    <svg /* GitHub Icon SVG */ viewBox="0 0 24 24" fill="currentColor"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>
                  </a>
                  <a href={"https://www.linkedin.com/in/jayashree-das25"} target="_blank" rel="noopener noreferrer" className="social-icon">
                    <svg /* LinkedIn Icon SVG */ viewBox="0 0 24 24" fill="currentColor"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
                  </a>
                </div>
              </div>
            </div>
            <div className="contact-form-wrapper">
              <form className="contact-form">
                <div className="form-group">
                  <label htmlFor="name">Full Name</label>
                  <input type="text" id="name" placeholder="Your Name" className="form-input" />
                </div>
                <div className="form-group">
                  <label htmlFor="email">Email address</label>
                  <input type="email" id="email" placeholder="you@example.com" className="form-input" />
                </div>
                <div className="form-group">
                  <label htmlFor="message">Message</label>
                  <textarea id="message" placeholder="Your message here..." className="form-textarea"></textarea>
                </div>
                <button type="submit" className="submit-button">
                  Get In Touch
                </button>
              </form>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

// --- App Component (Final Version) ---
function App() {
  return (
    <>
      <ScrollToTop /> {/* 3. ADD THE COMPONENT HERE */}
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/skills" element={<SkillsPage />} />
        <Route path="/projects" element={<ProjectsPage />} />
      </Routes>
    </>
  );
}

export default App;