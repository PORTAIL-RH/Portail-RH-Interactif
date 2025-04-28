import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { ArrowRight, CheckCircle, Code, Database, Server, Shield, Users, Zap } from "lucide-react"
import Navbar from "../NavBar/Nav"
import Footer from "../Footer/Footer"
import "./Home.css"

const Home = () => {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  return (
    <div className="home-page">
      <Navbar />

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <div className={`hero-text ${isVisible ? "visible" : ""}`}>
            <h1>Solutions Technologiques Innovantes pour l'Ère Numérique</h1>
            <p>
              Nous aidons les entreprises à transformer leurs idées en solutions numériques puissantes. Découvrez
              comment notre expertise peut propulser votre croissance.
            </p>
            <div className="hero-buttons">
              <Link to="/contact" className="primary-button">
                Commencer un Projet
              </Link>
              <Link to="" className="secondary-button">
                Découvrir nos Services <ArrowRight size={16} />
              </Link>
            </div>
          </div>
          <div className={`hero-image ${isVisible ? "visible" : ""}`}>
            <img  src={require("../../assets/solutions.jpeg")} alt="Solutions technologiques ArabSoft" />
          </div>
        </div>

      </section>

      {/* Services Section */}
      <section className="services-section">
        <div className="section-container">
          <div className="section-header">
            <h2>Nos Services</h2>
            <p>Des solutions complètes pour répondre à tous vos besoins technologiques</p>
          </div>

          <div className="services-grid">
            <div className="service-card">
              <div className="service-icon">
                <Code size={24} />
              </div>
              <h3>Développement Logiciel</h3>
              <p>
                Applications web personnalisées, systèmes d'entreprise et solutions e-commerce adaptées à vos besoins
                spécifiques.
              </p>
              <Link to="/services/development" className="service-link">
                En savoir plus <ArrowRight size={16} />
              </Link>
            </div>

            <div className="service-card">
              <div className="service-icon">
                <Server size={24} />
              </div>
              <h3>Solutions Cloud</h3>
              <p>Migration vers le cloud, architecture cloud et services gérés pour optimiser vos opérations.</p>
              <Link to="/services/cloud" className="service-link">
                En savoir plus <ArrowRight size={16} />
              </Link>
            </div>

            <div className="service-card">
              <div className="service-icon">
                <Shield size={24} />
              </div>
              <h3>Cybersécurité</h3>
              <p>
                Protection des données, évaluations de sécurité et solutions de conformité pour sécuriser votre
                entreprise.
              </p>
              <Link to="/services/security" className="service-link">
                En savoir plus <ArrowRight size={16} />
              </Link>
            </div>

            <div className="service-card">
              <div className="service-icon">
                <Database size={24} />
              </div>
              <h3>Intelligence Artificielle</h3>
              <p>
                Solutions d'IA et d'apprentissage automatique pour automatiser les processus et obtenir des insights
                précieux.
              </p>
              <Link to="/services/ai" className="service-link">
                En savoir plus <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="about-section">
        <div className="section-container">
          <div className="about-content">
            <div className="about-image">
              <img src={require("../../assets/logo.png")} alt="À propos d'ArabSoft" />
            </div>
            <div className="about-text">
              <h2>Qui Sommes-Nous</h2>
              <p>
                Depuis plus de 15 ans, ArabSoft fournit des solutions technologiques de pointe aux entreprises de toutes
                tailles. Notre équipe d'experts passionnés s'engage à offrir des services de qualité supérieure qui
                répondent aux défis uniques de nos clients.
              </p>
              <div className="about-stats">
                <div className="stat-item">
                  <span className="stat-number">15+</span>
                  <span className="stat-label">Années d'Expérience</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">200+</span>
                  <span className="stat-label">Projets Réussis</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">50+</span>
                  <span className="stat-label">Experts Tech</span>
                </div>
              </div>
              <Link to="" className="secondary-button">
                En savoir plus sur nous <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="why-choose-section">
        <div className="section-container">
          <div className="section-header">
            <h2>Pourquoi Choisir ArabSoft</h2>
            <p>Ce qui nous distingue et fait de nous le partenaire idéal pour votre transformation numérique</p>
          </div>

          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <Zap size={24} />
              </div>
              <h3>Solutions Innovantes</h3>
              <p>
                Nous utilisons les dernières technologies pour créer des solutions avant-gardistes qui vous donnent un
                avantage concurrentiel.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <Users size={24} />
              </div>
              <h3>Équipe d'Experts</h3>
              <p>
                Notre équipe de développeurs, designers et consultants hautement qualifiés apporte une expertise
                approfondie à chaque projet.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <CheckCircle size={24} />
              </div>
              <h3>Qualité Garantie</h3>
              <p>
                Nous suivons des méthodologies rigoureuses et des processus d'assurance qualité pour livrer des produits
                sans défaut.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="testimonials-section">
        <div className="section-container">
          <div className="section-header">
            <h2>Ce que Disent Nos Clients</h2>
            <p>Découvrez pourquoi nos clients nous font confiance pour leurs besoins technologiques</p>
          </div>

          <div className="testimonials-slider">
            <div className="testimonial-card">
              <div className="testimonial-content">
                <p>
                  "ArabSoft a transformé notre processus commercial avec une solution sur mesure qui a augmenté notre
                  efficacité de 40%. Leur équipe a été professionnelle et réactive tout au long du projet."
                </p>
              </div>
              <div className="testimonial-author">
                <img src={require("../../assets/nous.jpg")} alt="Ahmed Benali" className="author-image" />
                <div className="author-info">
                  <h4>Ahmed Benali</h4>
                  <p>Directeur Technique, TechCorp</p>
                </div>
              </div>
            </div>

            <div className="testimonial-card">
              <div className="testimonial-content">
                <p>
                  "La migration vers le cloud orchestrée par ArabSoft a été transparente et a considérablement réduit
                  nos coûts d'infrastructure. Leur expertise technique et leur approche méthodique ont fait toute la
                  différence."
                </p>
              </div>
              <div className="testimonial-author">
                <img src={require("../../assets/nous.jpg")} alt="Leila Mansour" className="author-image" />
                <div className="author-info">
                  <h4>Leila Mansour</h4>
                  <p>CEO, InnovateNow</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="section-container">
          <div className="cta-content">
            <h2>Prêt à Transformer Votre Entreprise?</h2>
            <p>
              Contactez-nous dès aujourd'hui pour discuter de vos besoins et découvrir comment nous pouvons vous aider à
              atteindre vos objectifs.
            </p>
            <div className="cta-buttons">
              <Link to="/contact" className="primary-button">
                Nous Contacter
              </Link>
              <Link to="" className="outline-button">
                Voir Nos Études de Cas
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

export default Home
