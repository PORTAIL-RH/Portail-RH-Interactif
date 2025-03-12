import { useState, useEffect } from "react"
import  "./ApplicationModal.css"

const ApplicationModal = ({ isOpen, onClose, candidatureId, onSubmit }) => {
  const [formData, setFormData] = useState({
    nom: "",
    prenom: "",
    age: "",
    email: "",
    numTel: "",
    cv: null,
    candidatureId: candidatureId || "",
  })

  // Update candidatureId when prop changes
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      candidatureId: candidatureId || ""
    }))
  }, [candidatureId])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value,
    })
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file && file.size > 5 * 1024 * 1024) {
      // 5MB limit
      alert("File size must be less than 5MB.")
      return
    }
    setFormData({
      ...formData,
      cv: file,
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    await onSubmit(formData)
    onClose() // Close modal after submission
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <h2>Soumettre Votre Candidature</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          <p className="form-intro">
            Veuillez remplir le formulaire ci-dessous pour postuler à un poste chez Société Arab Soft. Nous
            examinerons votre candidature et vous contacterons bientôt.
          </p>
          
          <form className="application-form" onSubmit={handleSubmit}>
            <input
              type="hidden"
              name="candidatureId"
              value={formData.candidatureId}
            />

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="nom">Nom *</label>
                <input
                  type="text"
                  id="nom"
                  name="nom"
                  value={formData.nom}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="prenom">Prénom *</label>
                <input
                  type="text"
                  id="prenom"
                  name="prenom"
                  value={formData.prenom}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="age">Âge *</label>
                <input
                  type="number"
                  id="age"
                  name="age"
                  value={formData.age}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="email">Email *</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="numTel">Numéro de téléphone *</label>
              <input
                type="tel"
                id="numTel"
                name="numTel"
                value={formData.numTel}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="cv">CV (PDF ou DOCX) *</label>
              <input
                type="file"
                id="cv"
                name="cv"
                onChange={handleFileChange}
                accept=".pdf,.docx"
                required
              />
              <p className="file-hint">Taille maximale du fichier : 5MB</p>
            </div>

            <div className="form-actions">
              <button type="button" className="secondary-button" onClick={onClose}>
                Annuler
              </button>
              <button type="submit" className="primary-button">
                Soumettre la candidature
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default ApplicationModal
