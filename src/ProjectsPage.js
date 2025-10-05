import React from 'react';
import { Link } from 'react-router-dom';

// You can expand this list with all your projects in the future
const allProjects = [
    {
        title: "Social-Chat",
        description: "A full-stack social media application that allows users to share posts, upload pictures, follow other users, like and comment on posts. Designed with an intuitive interface and real-time updates to create an engaging social experience.",
        imageUrl: "/Socialchat.png",
        githubLink: "https://github.com/Jayashree-25/Social-Chat",
        liveDemoLink: "#"
    },
    {
        title: "Journal_Web",
        description: "A personal journal application that enables users to create, read, update, and delete their own entries. Focused on simplicity and privacy, allowing users to manage and revisit their thoughts easily.",
        imageUrl: "/Journal_web.png",
        githubLink: "https://github.com/Jayashree-25/Journal_Web",
        liveDemoLink: "https://journal-web-nu.vercel.app/"
    },
    {
        title: "Pokedex",
        description: "A web app displaying data for over 800 Pokémon with detailed information and search functionality. Designed for smooth browsing and quick lookup of Pokémon stats, abilities, and types.",
        imageUrl: "/Pokedex.png",
        githubLink: "https://github.com/Jayashree-25/Pokedex",
        liveDemoLink: "https://pokedex-jet-nu.vercel.app/"
    },
    {
        title: "SkyCast",
        description: "A weather application that displays real-time weather information for more than 50 cities around the world. Users can check temperature, humidity, cloud coverage, and general weather conditions in a sleek, easy-to-use interface.",
        imageUrl: "/SkyCast.png",
        githubLink: "https://github.com/Jayashree-25/SkyCast",
        liveDemoLink: "https://sky-cast-mocha.vercel.app/"
    },
    {
        title: "Nexus E1",
        description: "will upload soon",
        imageUrl: "/Default.png",
        githubLink: "https://github.com/Jayashree-25/Nexus-E1",
        liveDemoLink: "#"
    },
    // ... Add more projects here
];

const ProjectsPage = () => {
    return (
        <div className="projects-page-container">
            <Link to="/" className="back-button">
                &larr; Back to Home
            </Link>
            <h1>All Projects</h1>
            <div className="projects-grid">
                {allProjects.map((project) => (
                    <a key={project.title} href={project.link} className="project-card" target="_blank" rel="noopener noreferrer">
                        <img src={project.imageUrl} alt={project.title} className="project-image" />
                        <div className="project-content">
                            <h3 className="project-title">{project.title}</h3>
                            <p className="project-description">{project.description}</p>
                            <div className="project-links">
                                <a href={project.githubLink} className="project-button github-button" target="_blank" rel="noopener noreferrer">GitHub</a>
                                <a href={project.liveDemoLink} className="project-button demo-button" target="_blank" rel="noopener noreferrer">Live Demo</a>
                            </div>
                        </div>
                    </a>
                ))}
            </div>
        </div>
    );
};

export default ProjectsPage;