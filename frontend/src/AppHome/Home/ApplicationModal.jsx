import { useState, useEffect } from "react"
import { X, Upload, User, Mail, Phone, Calendar, FileText, Info, Check, AlertCircle } from "lucide-react"
import "./ApplicationModal.css"

const ApplicationModal = ({ isOpen, onClose, candidatureId, onSubmit }) => {
  const [formData, setFormData] = useState({
    nom: "",
    prenom: "",
    age: "",
    email: "",
    numTel: "",
    candidatureId: candidatureId || "",
    cv: null,
  })
  const [cvFileName, setCvFileName] = useState("")
  const [errors, setErrors] = useState({})
  const [validFields, setValidFields] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [step, setStep] = useState(1)
  const totalSteps = 2
  const [validationMessage, setValidationMessage] = useState(null)
  const [touchedFields, setTouchedFields] = useState({})

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      candidatureId: candidatureId || "",
    }))
  }, [candidatureId])

  const handleChange = (e) => {
    const { name, value } = e.target

    // Format phone number as user types
    let formattedValue = value
    if (name === "numTel") {
      // Remove all non-digit characters
      const digits = value.replace(/\D/g, "")
      // Format as XX XXX XXX (max 8 digits)
      if (digits.length <= 2) {
        formattedValue = digits
      } else if (digits.length <= 5) {
        formattedValue = `${digits.slice(0, 2)} ${digits.slice(2)}`
      } else {
        formattedValue = `${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5, 8)}`
      }
    }

    setFormData((prev) => ({
      ...prev,
      [name]: formattedValue,
    }))

    // Clear error for this field when user types
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  const validatePhoneNumber = (phoneNumber) => {
    const digits = phoneNumber.replace(/\D/g, "")

    if (digits.length === 0) {
      return { isValid: false, message: "Le numéro de téléphone est requis" }
    } else if (digits.length !== 8) {
      return { isValid: false, message: "Le numéro doit contenir 8 chiffres" }
    } else {
      return { isValid: true }
    }
  }

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    if (!email.trim()) {
      return { isValid: false, message: "L'email est requis" }
    } else if (!emailRegex.test(email)) {
      return { isValid: false, message: "Format d'email invalide" }
    } else {
      return { isValid: true }
    }
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      // Validate file type before setting
      const allowedTypes = [
        "application/pdf",
        "text/plain",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ]
      if (!allowedTypes.includes(file.type)) {
        setValidationMessage({
          type: "error",
          text: "Format de fichier non supporté. Veuillez télécharger un fichier PDF, DOCX ou TXT.",
        })
        return
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setValidationMessage({
          type: "error",
          text: "Le fichier est trop volumineux (max 5MB). Veuillez choisir un fichier plus petit.",
        })
        return
      }

      setFormData((prev) => ({
        ...prev,
        cv: file,
      }))
      setCvFileName(file.name)

      // Show success validation message
      setValidationMessage({
        type: "success",
        text: "CV téléchargé avec succès!",
      })

      // Clear error for CV
      if (errors.cv) {
        setErrors((prev) => {
          const newErrors = { ...prev }
          delete newErrors.cv
          return newErrors
        })
      }
    }
  }

  const validateStep = (stepNumber) => {
    const newErrors = {}
    let isValid = true

    if (stepNumber === 1) {
      if (!formData.nom.trim()) {
        newErrors.nom = "Le nom est requis"
        isValid = false
      }

      if (!formData.prenom.trim()) {
        newErrors.prenom = "Le prénom est requis"
        isValid = false
      }

      if (!formData.age) {
        newErrors.age = "L'âge est requis"
        isValid = false
      } else if (isNaN(formData.age) || Number.parseInt(formData.age) < 18) {
        newErrors.age = "Vous devez avoir au moins 18 ans pour postuler"
        isValid = false
      }
    }

    setErrors((prev) => ({ ...prev, ...newErrors }))

    if (!isValid) {
      setValidationMessage({
        type: "error",
        text: "Veuillez corriger les erreurs avant de continuer",
      })
    }

    return isValid
  }

  const nextStep = () => {
    if (validateStep(step)) {
      setStep((prev) => prev + 1)
      setValidationMessage({
        type: "info",
        text: "Veuillez remplir vos informations de contact et télécharger votre CV",
      })
    }
  }

  const prevStep = () => {
    setStep((prev) => prev - 1)
    setValidationMessage(null)
  }

  const validateFinalStep = () => {
    const newErrors = {}
    let isValid = true

    // Validate email
    const emailValidation = validateEmail(formData.email)
    if (!emailValidation.isValid) {
      newErrors.email = emailValidation.message
      isValid = false
    }

    // Validate phone
    const phoneValidation = validatePhoneNumber(formData.numTel)
    if (!phoneValidation.isValid) {
      newErrors.numTel = phoneValidation.message
      isValid = false
    }

    // Validate CV
    if (!formData.cv) {
      newErrors.cv = "Veuillez télécharger votre CV"
      isValid = false
    }

    setErrors(newErrors)

    if (!isValid) {
      setValidationMessage({
        type: "error",
        text: "Veuillez corriger les erreurs avant de soumettre",
      })
    }

    return isValid
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // First validate step 1 fields if we're on step 2
    if (step === 2) {
      const step1Valid = validateStep(1)
      if (!step1Valid) {
        setStep(1)
        return
      }
    }

    // Then validate current step (step 2) fields
    if (step === totalSteps) {
      if (!validateFinalStep()) {
        return
      }
    } else {
      if (!validateStep(step)) {
        return
      }
      setStep((prev) => prev + 1)
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmit(formData)
      onClose()
      resetForm()
    } catch (error) {
      console.error("Error submitting form:", error)
      setValidationMessage({
        type: "error",
        text: `Une erreur est survenue lors de la soumission: ${error.message || "Erreur inconnue"}`,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setFormData({
      nom: "",
      prenom: "",
      age: "",
      email: "",
      numTel: "",
      candidatureId: candidatureId || "",
      cv: null,
    })
    setCvFileName("")
    setErrors({})
    setValidFields({})
    setTouchedFields({})
    setStep(1)
    setValidationMessage(null)
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <h2>{candidatureId ? "Postuler pour ce poste" : "Candidature Spontanée"}</h2>
          <button className="close-button" onClick={onClose} aria-label="Fermer">
            <X size={20} />
          </button>
        </div>

        <div className="modal-progress">
          <div className="progress-steps">
            {Array.from({ length: totalSteps }, (_, i) => (
              <div
                key={i}
                className={`progress-step ${i + 1 === step ? "active" : ""} ${i + 1 < step ? "completed" : ""}`}
              >
                <div className="step-number">{i + 1 < step ? "✓" : i + 1}</div>
                <div className="step-label">{i === 0 ? "Informations Personnelles" : "Contact & CV"}</div>
              </div>
            ))}
          </div>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${((step - 1) / (totalSteps - 1)) * 100}%` }}
              role="progressbar"
              aria-valuenow={step}
              aria-valuemin={1}
              aria-valuemax={totalSteps}
            ></div>
          </div>
        </div>

        <div className="modal-body">
          {validationMessage && (
            <div className={`validation-message validation-${validationMessage.type}`}>
              <span className="validation-icon">
                {validationMessage.type === "error" && <AlertCircle size={18} />}
                {validationMessage.type === "success" && <Check size={18} />}
                {validationMessage.type === "info" && <Info size={18} />}
                {validationMessage.type === "warning" && <AlertCircle size={18} />}
              </span>
              <span className="validation-text">{validationMessage.text}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {step === 1 && (
              <div className="form-step">
                <div className="form-group">
                  <label htmlFor="nom">
                    <User size={16} className="input-icon" />
                    Nom *
                  </label>
                  <div className="input-wrapper">
                    <input
                      type="text"
                      id="nom"
                      name="nom"
                      value={formData.nom}
                      onChange={handleChange}
                      className={errors.nom ? "error" : ""}
                      placeholder="Entrez votre nom"
                      aria-invalid={!!errors.nom}
                      aria-describedby={errors.nom ? "nom-error" : undefined}
                    />
                  </div>
                  {errors.nom && (
                    <span id="nom-error" className="error-message">
                      {errors.nom}
                    </span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="prenom">
                    <User size={16} className="input-icon" />
                    Prénom *
                  </label>
                  <div className="input-wrapper">
                    <input
                      type="text"
                      id="prenom"
                      name="prenom"
                      value={formData.prenom}
                      onChange={handleChange}
                      className={errors.prenom ? "error" : ""}
                      placeholder="Entrez votre prénom"
                      aria-invalid={!!errors.prenom}
                      aria-describedby={errors.prenom ? "prenom-error" : undefined}
                    />
                  </div>
                  {errors.prenom && (
                    <span id="prenom-error" className="error-message">
                      {errors.prenom}
                    </span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="age">
                    <Calendar size={16} className="input-icon" />
                    Âge *
                  </label>
                  <div className="input-wrapper">
                    <input
                      type="number"
                      id="age"
                      name="age"
                      value={formData.age}
                      onChange={handleChange}
                      min="18"
                      max="100"
                      className={errors.age ? "error" : ""}
                      placeholder="Entrez votre âge"
                      aria-invalid={!!errors.age}
                      aria-describedby={errors.age ? "age-error" : undefined}
                    />
                  </div>
                  {errors.age && (
                    <span id="age-error" className="error-message">
                      {errors.age}
                    </span>
                  )}
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="form-step">
                <div className="form-group">
                  <label htmlFor="email">
                    <Mail size={16} className="input-icon" />
                    Email *
                  </label>
                  <div className="input-wrapper">
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className={errors.email ? "error" : ""}
                      placeholder="exemple@domaine.com"
                      aria-invalid={!!errors.email}
                      aria-describedby={errors.email ? "email-error" : undefined}
                    />
                  </div>
                  {errors.email && (
                    <span id="email-error" className="error-message">
                      {errors.email}
                    </span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="numTel">
                    <Phone size={16} className="input-icon" />
                    Téléphone * (8 chiffres)
                  </label>
                  <div className="input-wrapper">
                    <input
                      type="tel"
                      id="numTel"
                      name="numTel"
                      value={formData.numTel}
                      onChange={handleChange}
                      placeholder="** *** ***"
                      className={errors.numTel ? "error" : ""}
                      aria-invalid={!!errors.numTel}
                      aria-describedby={errors.numTel ? "numTel-error" : undefined}
                      maxLength="10" // XX XXX XXX
                    />
                  </div>
                  {errors.numTel && (
                    <span id="numTel-error" className="error-message">
                      {errors.numTel}
                    </span>
                  )}
                  <span className="input-hint">Format: XX XXX XXX (exemple: 20 369 415)</span>
                </div>

                <div className="form-group">
                  <label htmlFor="cv">
                    <FileText size={16} className="input-icon" />
                    CV (PDF, DOCX, TXT) *
                  </label>
                  <div className="file-input-container">
                    <input
                      type="file"
                      id="cv"
                      name="cv"
                      onChange={handleFileChange}
                      accept=".pdf,.docx,.txt"
                      className="file-input"
                      aria-invalid={!!errors.cv}
                      aria-describedby={errors.cv ? "cv-error" : undefined}
                    />
                    <label
                      htmlFor="cv"
                      className={`file-input-label ${errors.cv ? "error" : ""}`}
                    >
                      <span>{cvFileName || "Choisir un fichier"}</span>
                      <span className="browse-button">
                        <Upload size={16} /> Parcourir
                      </span>
                    </label>
                  </div>
                  {errors.cv && (
                    <span id="cv-error" className="error-message">
                      {errors.cv}
                    </span>
                  )}
                  <div className="file-requirements">Formats acceptés: PDF, DOCX, TXT - Taille maximale: 5MB</div>
                </div>
              </div>
            )}

            <div className="form-actions">
              {step > 1 && (
                <button type="button" className="back-button" onClick={prevStep} disabled={isSubmitting}>
                  Précédent
                </button>
              )}

              {step < totalSteps ? (
                <button type="submit" className="next-button" disabled={isSubmitting}>
                  Suivant
                </button>
              ) : (
                <button type="submit" className="submit-button" disabled={isSubmitting}>
                  {isSubmitting ? "Envoi en cours..." : "Envoyer ma candidature"}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default ApplicationModal