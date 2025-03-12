
import { useState, useEffect } from "react"
import "./Home.css"
import Navbar from "../NavBar/Nav.jsx"
import Footer from "../Footer/Footer.jsx"
import ApplicationModal from "./ApplicationModal.jsx"

const Candidates = () => {
  const [formData, setFormData] = useState({
    nom: "",
    prenom: "",
    age: "",
    email: "",
    numTel: "",
    cvFilePath: "",
    cv: null,
    candidature: {
      id: "", // Initialize as empty
    },
  })

  const [activeTab, setActiveTab] = useState("openings")
  const [jobOpenings, setJobOpenings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedCandidatureId, setSelectedCandidatureId] = useState("")

  // Fetch job openings from the backend API
  useEffect(() => {
    const fetchJobOpenings = async () => {
      try {
        const response = await fetch("http://localhost:8080/api/candidatures")
        if (!response.ok) {
          throw new Error("Failed to fetch job openings")
        }
        const data = await response.json()
        if (!Array.isArray(data)) {
          throw new Error("Invalid data format received from the server")
        }
        setJobOpenings(data)
      } catch (error) {
        setError(error.message)
      } finally {
        setLoading(false)
      }
    }

    fetchJobOpenings()
  }, [])

  const handleSubmitApplication = async (formData) => {
    try {
      // Retrieve the authentication token
      const token = localStorage.getItem("authToken")
      if (!token) {
        throw new Error("Authentication token not found. Please log in.")
      }

      // Ensure a file is selected
      if (!formData.cv) {
        throw new Error("Please select a CV file to upload.")
      }

      // Create a new FormData object for the candidate data
      const candidatFormData = new FormData()
      candidatFormData.append("nom", formData.nom)
      candidatFormData.append("prenom", formData.prenom)
      candidatFormData.append("age", formData.age)
      candidatFormData.append("email", formData.email)
      candidatFormData.append("numTel", formData.numTel)
      candidatFormData.append("candidatureId", formData.candidatureId)
      candidatFormData.append("cv", formData.cv) // Append the CV file

      // Log the FormData for debugging
      for (const [key, value] of candidatFormData.entries()) {
        console.log(key, value)
      }

      // Send the FormData to the backend
      const response = await fetch("http://localhost:8080/api/candidats", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`, // Include the token in the request headers
        },
        body: candidatFormData, // Send FormData as the body
      })

      // Handle the response
      if (!response.ok) {
        const errorData = await response.text() // Handle plain text or JSON responses
        throw new Error(errorData || "Failed to submit application")
      }

      alert("Application submitted successfully!")
      // Reset form data
      setFormData({
        nom: "",
        prenom: "",
        age: "",
        email: "",
        numTel: "",
        cv: null,
        candidature: {
          id: "",
        },
      })
    } catch (error) {
      console.error("Error submitting application:", error)
      alert(error.message || "Failed to submit application. Please try again.")
    }
  }

  const handleApplyClick = (candidatureId) => {
    console.log("Candidature ID:", candidatureId) // Debugging
    setSelectedCandidatureId(candidatureId)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setSelectedCandidatureId("")
  }

  if (loading) {
    return <div className="loading-message">Loading job openings...</div>
  }

  if (error) {
    return <div className="error-message">Error: {error}</div>
  }

  return (
    <div className="candidates-page">
      <Navbar transparent={true} />

      <main>
        <section className="hero-section">
          <div className="container">
            <h1>Rejoignez Notre Équipe d'Innovateurs</h1>
            <p>
              Découvrez des opportunités de carrière passionnantes et participez à notre mission de créer des solutions
              technologiques de pointe.
            </p>
            <button className="primary-button" onClick={() => handleApplyClick("")}>
              Postuler Maintenant
            </button>
          </div>
        </section>

        <section className="why-join-section">
          <div className="container">
            <h2>Pourquoi Rejoindre Société Arab Soft ?</h2>
            <div className="benefits-grid">
              <div className="benefit-card">
                <div className="benefit-icon growth-icon"></div>
                <h3>Croissance Professionnelle</h3>
                <p>Opportunités d'apprentissage continu et voies d'avancement de carrière pour tous les employés.</p>
              </div>
              <div className="benefit-card">
                <div className="benefit-icon innovation-icon"></div>
                <h3>Culture d'Innovation</h3>
                <p>Travailler sur des projets de pointe et contribuer vos idées dans un environnement collaboratif.</p>
              </div>
              <div className="benefit-card">
                <div className="benefit-icon balance-icon"></div>
                <h3>Équilibre Vie Professionnelle-Personnelle</h3>
                <p>Arrangements de travail flexibles et politiques qui respectent votre temps personnel.</p>
              </div>
              <div className="benefit-card">
                <div className="benefit-icon benefits-icon"></div>
                <h3>Avantages Compétitifs</h3>
                <p>Assurance santé complète, plans de retraite et autres avantages précieux.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="tabs-section">
          <div className="container">
            <div className="tabs">
              <button
                className={`tab-button ${activeTab === "openings" ? "active" : ""}`}
                onClick={() => setActiveTab("openings")}
              >
                Offres d'Emploi
              </button>
            </div>

            <div className="tab-content">
              <div className="openings-content">
                <h2>Postes Disponibles</h2>
                <div className="job-listings">
                  {jobOpenings?.length === 0 ? (
                    <p>Aucune offre d'emploi disponible pour le moment.</p>
                  ) : (
                    jobOpenings?.map((job) => (
                      <div className="job-card" key={job.id}>
                        <h3>{job.description}</h3>
                        <div className="job-details">
                          <span className="department">{job.service}</span>
                          <span className="location">Tunis, Tunisie</span>
                        </div>
                        <p className="job-description">{job.exigences}</p>
                        <div className="requirements">
                          <h4>Compétences Requises:</h4>
                          <ul>
                            {job.skills?.map((skill, index) => (
                              <li key={index}>{skill}</li>
                            ))}
                          </ul>
                        </div>
                        <button className="secondary-button" onClick={() => handleApplyClick(job.id)}>
                          Postuler pour ce poste
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <ApplicationModal
        isOpen={isModalOpen}
        onClose={closeModal}
        candidatureId={selectedCandidatureId}
        onSubmit={handleSubmitApplication}
      />

      <Footer />
    </div>
  )
}

export default Candidates

