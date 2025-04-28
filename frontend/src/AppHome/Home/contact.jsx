"use client"

import { useState } from "react"
import { Mail, MapPin, Phone, Send, Map } from 'lucide-react'
import Navbar from "../NavBar/Nav"
import Footer from "../Footer/Footer"
import "./contact.css"

const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  })
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [activeMap, setActiveMap] = useState(0)
  const locations = [
    {
      name: "ArabSoft - Rue Khaireddine Pacha",
      address: "Rue Khaireddine Pacha, Tunis",
      embedUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3193.831741649754!2d10.191839175688699!3d36.822551672240806!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x12fd34f36a57a2cf%3A0x1c543ce6b716220a!2sArab%20Soft!5e0!3m2!1sfr!2stn!4v1744723282871!5m2!1sfr!2stn"
    },
    {
      name: "ArabSoft - Lac",
      address: "Lac, Tunis",
      embedUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3193.1162401875113!2d10.239667675689464!3d36.839692072235856!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x12fd35d07ee57843%3A0x9c95dcb60ed3bdf1!2sArabsoft!5e0!3m2!1sfr!2stn!4v1744723499789!5m2!1sfr!2stn"
    }
  ]

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value,
    })

    // Clear error for this field
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: null,
      })
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = "Le nom est requis"
    }

    if (!formData.email.trim() || !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email invalide"
    }

    if (!formData.subject.trim()) {
      newErrors.subject = "Le sujet est requis"
    }

    if (!formData.message.trim()) {
      newErrors.message = "Le message est requis"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (validateForm()) {
      setIsSubmitting(true)

      // Simulate API call
      try {
        await new Promise((resolve) => setTimeout(resolve, 1500))
        setSubmitSuccess(true)
        resetForm()
      } catch (error) {
        console.error("Error submitting form:", error)
      } finally {
        setIsSubmitting(false)
      }
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      subject: "",
      message: "",
    })
    setErrors({})
  }

  return (
    <div className="contact-page">
      <Navbar />

      {/* Hero Section */}
      <section className="contact-hero">
        <div className="contact-hero-content">
          <h1>Contactez-Nous</h1>
          <p>
            Nous sommes là pour répondre à vos questions et vous aider à trouver les solutions adaptées à vos besoins.
          </p>
        </div>
      </section>

      {/* Contact Info Section */}
      <section className="contact-info-section">
        <div className="section-container">
          <div className="contact-info-grid">
            <div className="contact-info-card">
              <div className="contact-icon">
                <Phone size={24} />
              </div>
              <h3>Téléphone</h3>
              <p>+216 71 123 456</p>
              <p>+216 71 789 012</p>
            </div>

            <div className="contact-info-card">
              <div className="contact-icon">
                <Mail size={24} />
              </div>
              <h3>Email</h3>
              <p>contact@arabsoft.com</p>
              <p>support@arabsoft.com</p>
            </div>

          
          </div>
        </div>
      </section>

      {/* Contact Form Section */}
      <section className="contact-form-section">
        <div className="section-container">
          <div className="contact-form-container">
            <div className="contact-form-content">
              <div className="form-header">
                <h2>Envoyez-nous un message</h2>
                <p>Remplissez le formulaire ci-dessous et notre équipe vous répondra dans les plus brefs délais.</p>
              </div>

              {submitSuccess ? (
                <div className="success-message">
                  <div className="success-icon">✓</div>
                  <h3>Message Envoyé!</h3>
                  <p>Merci de nous avoir contactés. Notre équipe vous répondra dans les plus brefs délais.</p>
                  <button className="primary-button" onClick={() => setSubmitSuccess(false)}>
                    Envoyer un autre message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="contact-form">
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="name">Nom Complet *</label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className={errors.name ? "error" : ""}
                      />
                      {errors.name && <span className="error-message">{errors.name}</span>}
                    </div>

                    <div className="form-group">
                      <label htmlFor="email">Email *</label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className={errors.email ? "error" : ""}
                      />
                      {errors.email && <span className="error-message">{errors.email}</span>}
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="phone">Téléphone</label>
                      <input type="tel" id="phone" name="phone" value={formData.phone} onChange={handleChange} />
                    </div>

                    <div className="form-group">
                      <label htmlFor="subject">Sujet *</label>
                      <input
                        type="text"
                        id="subject"
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        className={errors.subject ? "error" : ""}
                      />
                      {errors.subject && <span className="error-message">{errors.subject}</span>}
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="message">Message *</label>
                    <textarea
                      id="message"
                      name="message"
                      rows="5"
                      value={formData.message}
                      onChange={handleChange}
                      className={errors.message ? "error" : ""}
                    ></textarea>
                    {errors.message && <span className="error-message">{errors.message}</span>}
                  </div>

                  <button type="submit" className="submit-button" disabled={isSubmitting}>
                    {isSubmitting ? (
                      "Envoi en cours..."
                    ) : (
                      <>
                        Envoyer le Message <Send size={16} />
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>

            <div className="contact-map-container">
              <div className="map-switcher">
                <button 
                  className={`map-toggle ${activeMap === 0 ? 'active' : ''}`}
                  onClick={() => setActiveMap(0)}
                >
                  <Map size={16} /> Rue Khaireddine Pacha
                </button>
                <button 
                  className={`map-toggle ${activeMap === 1 ? 'active' : ''}`}
                  onClick={() => setActiveMap(1)}
                >
                  <Map size={16} /> Lac
                </button>
              </div>
              
              <div className="map-info">
                <h3>{locations[activeMap].name}</h3>
                <p>{locations[activeMap].address}</p>
              </div>

              <div className="contact-map">
                <iframe
                  src={locations[activeMap].embedUrl}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen=""
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title={`ArabSoft Location - ${locations[activeMap].name}`}
                ></iframe>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="faq-section">
        <div className="section-container">
          <div className="section-header">
            <h2>Questions Fréquentes</h2>
            <p>Trouvez rapidement des réponses aux questions les plus courantes</p>
          </div>

          <div className="faq-grid">
            <div className="faq-item">
              <h3>Quels sont vos délais de réponse?</h3>
              <p>
                Nous nous efforçons de répondre à toutes les demandes dans un délai de 24 à 48 heures ouvrables. Pour
                les demandes urgentes, n'hésitez pas à nous appeler directement.
              </p>
            </div>

            <div className="faq-item">
              <h3>Proposez-vous des consultations gratuites?</h3>
              <p>
                Oui, nous offrons une consultation initiale gratuite pour évaluer vos besoins et vous proposer les
                solutions les plus adaptées à votre situation.
              </p>
            </div>

            <div className="faq-item">
              <h3>Comment se déroule un projet avec ArabSoft?</h3>
              <p>
                Notre processus comprend une phase de découverte, une proposition détaillée, le développement, les tests
                et le déploiement. Nous assurons également un suivi post-lancement.
              </p>
            </div>

            <div className="faq-item">
              <h3>Travaillez-vous avec des entreprises à l'international?</h3>
              <p>
                Absolument! Nous collaborons avec des clients du monde entier et avons l'expérience nécessaire pour
                gérer des projets à distance tout en maintenant une communication efficace.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

export default Contact
