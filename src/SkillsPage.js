import React from 'react';
import { Link } from 'react-router-dom';
import { EvervaultCard } from './EvervaultCard';

const SkillsPage = () => {
    // You can move the full skills list here or import it
    const allSkills = [
        { name: "HTML5", imageUrl: "/icons/html.png" },
        { name: "CSS3", imageUrl: "/icons/css.png" },
        { name: "JavaScript", imageUrl: "/icons/javascript.png" },
        { name: "React", imageUrl: "/icons/react.png" },
        { name: "Node.js", imageUrl: "/icons/node.png" },
        { name: "Express", imageUrl: "/icons/express.png" },
        { name: "MongoDB", imageUrl: "/icons/mongodb.png" },
        { name: "Tailwind CSS", imageUrl: "/icons/tailwind.png" },
        { name: "Java", imageUrl: "/icons/java.png" },
        { name: "Python", imageUrl: "/icons/python.png" },
        { name: "Git", imageUrl: "/icons/git.png" },
        { name: "GitHub", imageUrl: "/icons/github.png" },
        { name: "VS Code", imageUrl: "/icons/vsStudio.png" }
        // ...add more skills here in the future
    ];

    return (
        <div className="skills-page-container">
            <Link to="/" className="back-button">
                &larr; Back to Home
            </Link>
            <h1>All Skills</h1>
            <div className="skills-grid">
                {allSkills.map((skill) => (
                    <EvervaultCard
                        key={skill.name}
                        text={skill.name}
                        imageUrl={skill.imageUrl}
                    />
                ))}
            </div>
        </div>
    );
};

export default SkillsPage;