import React from 'react';
import { Link } from 'react-router-dom';
import { EvervaultCard } from './EvervaultCard';

const SkillsPage = () => {
  // Skills are now grouped by category
  const skillsByCategory = {
    "Frontend": [
      { name: "React", imageUrl: "/icons/react.png" },
      { name: "JavaScript", imageUrl: "/icons/javascript.png" },
      { name: "HTML5", imageUrl: "/icons/html.png" },
      { name: "CSS3", imageUrl: "/icons/css.png" },
      { name: "Tailwind CSS", imageUrl: "/icons/tailwind.png" },
    ],
    "Backend": [
      { name: "Node.js", imageUrl: "/icons/node.png" },
      { name: "Express", imageUrl: "/icons/express.png" },
    ],
    "Databases": [
      { name: "MongoDB", imageUrl: "/icons/mongodb.png" },
    ],
    "Languages": [
      { name: "Java", imageUrl: "/icons/java.png" },
      { name: "Python", imageUrl: "/icons/python.png" },
    ],
    "Tools & Platforms": [
      { name: "Git", imageUrl: "/icons/git.png" },
      { name: "GitHub", imageUrl: "/icons/github.png" },
      { name: "VS Code", imageUrl: "/icons/vsStudio.png" },
      { name: "Socket.io", imageUrl: "/icons/socketio.svg" },
    ]
  };

  return (
    <div className="skills-page-container">
      <Link to="/" className="back-button">
        &larr; Back to Home
      </Link>
      <h1>All Skills</h1>
      <div className="skill-categories-container">
        {Object.entries(skillsByCategory).map(([category, skills]) => (
          <div key={category} className="skill-category">
            <h3>{category}</h3>
            <div className="skills-grid">
              {skills.map((skill) => (
                <EvervaultCard
                  key={skill.name}
                  text={skill.name}
                  imageUrl={skill.imageUrl}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SkillsPage;