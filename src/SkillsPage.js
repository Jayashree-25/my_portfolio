import React from 'react';
import { Link } from 'react-router-dom';
import { EvervaultCard } from './EvervaultCard';

const SkillsPage = () => {
  const skillsByCategory = {
    "Frontend": {
      description: "I specialize in building responsive and interactive user interfaces using modern web technologies.",
      skills: [
        { name: "React", imageUrl: "/icons/react.png" },
        { name: "JavaScript", imageUrl: "/icons/javascript.png" },
        { name: "HTML5", imageUrl: "/icons/html.png" },
        { name: "CSS3", imageUrl: "/icons/css.png" },
        { name: "Tailwind CSS", imageUrl: "/icons/tailwind.png" },
      ]
    },
    "Backend": {
      description: "I create robust and scalable server-side applications and APIs to power the frontend.",
      skills: [
        { name: "Node.js", imageUrl: "/icons/node.png" },
        { name: "Express", imageUrl: "/icons/express.png" },
      ]
    },
    "Databases": {
      description: "Experienced in designing and managing NoSQL databases for efficient data storage and retrieval.",
      skills: [
        { name: "MongoDB", imageUrl: "/icons/mongodb.png" },
      ]
    },
    "Languages": {
      description: "I write structured and efficient code with a focus on clarity, performance, and problem-solving.",
      skills: [
        { name: "Java", imageUrl: "/icons/java.png" },
        { name: "Python", imageUrl: "/icons/python.png" },
      ]
    },
    "Tools & Platforms": {
      description: "I utilize development tools and deployment platforms to streamline workflows, improve collaboration, and deliver optimized applications.",
      skills: [
        { name: "Git", imageUrl: "/icons/git.png" },
        { name: "GitHub", imageUrl: "/icons/github.png" },
        { name: "VS Code", imageUrl: "/icons/vsStudio.png" },
        { name: "Postman", imageUrl: "/icons/postman.png" },
        { name: "Vercel", imageUrl: "/icons/vercel.png" },
      ]
    }
  };

  return (
    <div className="skills-page-container">
      <Link to="/" className="back-button">
        &larr; Back to Home
      </Link>
      <h1>All Skills</h1>
      <div className="skill-categories-container">
        {Object.entries(skillsByCategory).map(([category, { description, skills }]) => (
          <div key={category} className="skill-category">
            <h3>{category}</h3>
            <p className="category-description">{description}</p>
            <div className="skills-grid">
        {skills.map((skill) => (
          <EvervaultCard
            key={skill.name}
            text={skill.name}
            imageUrl={skill.imageUrl}
            hoverEffect="zoom" // This tells the card to use the zoom effect
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