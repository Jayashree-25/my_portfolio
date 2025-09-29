import React, { useState, useEffect, useRef } from 'react';
import { Renderer, Program, Mesh, Triangle } from 'ogl';

// --- Plasma Component (No changes needed here) ---
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

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <div className="App" id="home">
      <style jsx="true">{`
    .App {
      background-color: #000;
      color: white;
    }
    
    /* --- UPDATED SECTION --- */
    .App-header {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      padding: 20px 50px;
      box-sizing: border-box;
      z-index: 10;
      display: flex;
      justify-content: space-between;
      align-items: center;
      
      /* Replaced 'transition: all' with specific properties */
      transition: width 0.4s ease-in-out, 
                  top 0.4s ease-in-out, 
                  padding 0.4s ease-in-out, 
                  background-color 0.4s ease-in-out, 
                  backdrop-filter 0.4s ease-in-out;

      /* Added a performance hint for the browser */
      will-change: width, top, padding;
    }
    /* --- END OF UPDATE --- */

    .App-header.scrolled {
        background-color: rgba(10, 10, 10, 0.7);
        backdrop-filter: blur(10px);
        padding: 15px 50px;
        top: 15px;
        left: 50%;
        transform: translateX(-50%);
        width: 95%;
        max-width: 1200px;
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
    }

    .logo {
        font-size: 1.8rem;
        font-weight: bold;
        color: white;
        text-decoration: none;
        transition: font-size 0.4s ease;
    }

    .App-header.scrolled .logo {
        font-size: 1.5rem;
    }

    /* ... (rest of the CSS is the same) ... */

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
    .hero-name-overlay { position: absolute; top: 0; left: 0; width: 100%; height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center; pointer-events: none; z-index: 1; }
    .hero-name-overlay h1 { font-size: 4rem; margin-bottom: 10px; text-align: center; }
    .hero-name-overlay p { font-size: 1.2rem; color: #ccc; text-align: center; }
    .content-section { min-height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center; padding: 100px 50px; box-sizing: border-box; position: relative; }
    .content-section h1 { font-size: 4rem; margin-bottom: 20px; text-align: center; }
    .content-section p { font-size: 1.2rem; max-width: 600px; text-align: center; color: #ccc; }
    @media (max-width: 768px) {
        .App-header { padding: 20px 30px; }
        .App-header.scrolled { padding: 10px 20px; width: 90%; }
        .main-nav { display: none; }
        .main-nav.open { display: flex; flex-direction: column; justify-content: center; align-items: center; position: fixed; top: 0; right: 0; width: 100%; height: 100vh; background: rgba(0, 0, 0, 0.98); }
        .main-nav a { font-size: 2rem; margin: 2rem 0; }
        .hamburger { display: flex; }
        .content-section h1, .hero-name-overlay h1 { font-size: 2.5rem; }
    }
`}
      </style>
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
          <a href="#contact" onClick={() => setIsMenuOpen(false)}>Contact</a>
        </nav>
        <button className={`hamburger ${isMenuOpen ? 'open' : ''}`} onClick={() => setIsMenuOpen(!isMenuOpen)} aria-label="Open navigation menu">
          <div className="line"></div>
          <div className="line"></div>
          <div className="line"></div>
        </button>
      </header>

      {/* === NAME OVERLAY === */}
      <div className="hero-name-overlay">
        <h1>Jayashree Das</h1>
        <p>Creative Developer & Designer</p>
      </div>

      <main>
        {/* No home section here, so "About" is the first content block */}
        <section id="about" className="content-section" style={{ backgroundColor: '#000' }}>
          <h1>About Me</h1>
          <p>This section will contain information about your skills, experience, and passion.</p>
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