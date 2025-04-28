import { useState, useEffect } from "react";
import { ArrowRight, Briefcase, Calendar, ChevronDown, MapPin, Search, X } from "lucide-react";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Navbar from "../NavBar/Nav";
import Footer from "../Footer/Footer";
import ApplicationModal from "./ApplicationModal";
import { API_URL } from "../../config";
import "./careers.css";

const Careers = () => {
  const [jobOpenings, setJobOpenings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCandidatureId, setSelectedCandidatureId] = useState("");
  const [filters, setFilters] = useState({
    department: "",
    search: "",
  });
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const jobsPerPage = 5;

  useEffect(() => {
    const fetchJobOpenings = async () => {
      try {
        const response = await fetch(`${API_URL}/api/candidatures/disponibles`);
        if (!response.ok) {
          throw new Error("Failed to fetch job openings");
        }
        const data = await response.json();
        if (!Array.isArray(data)) {
          throw new Error("Invalid data format received from the server");
        }
        setJobOpenings(data);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchJobOpenings();
  }, []);

  const handleSubmitApplication = async (formData) => {
    try {
      const toastId = toast.loading("Submitting your application...");

      if (!formData.cv) {
        throw new Error("Please select a CV file to upload.");
      }

      if (formData.cv.size > 5 * 1024 * 1024) {
        throw new Error("CV file size exceeds 5MB limit");
      }

      const allowedTypes = [
        "application/pdf",
        "text/plain",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ];
      if (!allowedTypes.includes(formData.cv.type)) {
        throw new Error("Only PDF, TXT, or DOCX files are allowed");
      }

      const candidatFormData = new FormData();
      candidatFormData.append("nom", formData.nom);
      candidatFormData.append("prenom", formData.prenom);
      candidatFormData.append("age", formData.age);
      candidatFormData.append("email", formData.email);
      candidatFormData.append("numTel", formData.numTel);
      candidatFormData.append("candidatureId", formData.candidatureId);
      candidatFormData.append("cv", formData.cv);

      const response = await fetch(`${API_URL}/api/candidats`, {
        method: "POST",
        body: candidatFormData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to submit application");
      }

      const result = await response.json();
      
      toast.update(toastId, {
        render: "Application submitted successfully!",
        type: "success",
        isLoading: false,
        autoClose: 5000,
        closeButton: true,
      });
      
      setIsModalOpen(false);
    } catch (error) {
      console.error("Application error:", error);
      toast.error(`Submission failed: ${error.message}`, {
        autoClose: 5000,
        closeButton: true,
      });
    }
  };

  const handleApplyClick = (candidatureId) => {
    setSelectedCandidatureId(candidatureId);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedCandidatureId("");
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({
      department: "",
      search: "",
    });
    setCurrentPage(1);
  };

  const departments = [...new Set(jobOpenings.map((job) => job.service))];

  const filteredJobs = jobOpenings.filter((job) => {
    const matchesDepartment = !filters.department || job.service === filters.department;
    const matchesSearch =
      !filters.search ||
      job.description.toLowerCase().includes(filters.search.toLowerCase()) ||
      job.exigences.toLowerCase().includes(filters.search.toLowerCase());

    return matchesDepartment && matchesSearch;
  });

  const indexOfLastJob = currentPage * jobsPerPage;
  const indexOfFirstJob = indexOfLastJob - jobsPerPage;
  const currentJobs = filteredJobs.slice(indexOfFirstJob, indexOfLastJob);
  const totalPages = Math.ceil(filteredJobs.length / jobsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div className="careers-page">
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
      
      <Navbar />

      <section className="careers-hero">
        <div className="careers-hero-content">
          <h1>Rejoignez Notre Équipe</h1>
          <p>
            Découvrez des opportunités passionnantes et contribuez à façonner l'avenir de la technologie avec ArabSoft
          </p>
        </div>
      </section>

      <section className="why-join-section">
        <div className="section-container">
          <div className="section-header">
            <h2>Pourquoi Rejoindre ArabSoft?</h2>
            <p>Nous offrons plus qu'un simple emploi - nous offrons une carrière enrichissante</p>
          </div>

          <div className="benefits-grid">
            <div className="benefit-card">
              <div className="benefit-icon">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M2 20h.01"></path>
                  <path d="M7 20v-4"></path>
                  <path d="M12 20v-8"></path>
                  <path d="M17 20v-6"></path>
                  <path d="M22 20V8"></path>
                </svg>
              </div>
              <h3>Croissance Professionnelle</h3>
              <p>Opportunités d'apprentissage continu et voies d'avancement de carrière pour tous les employés.</p>
            </div>

            <div className="benefit-card">
              <div className="benefit-icon">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 2v8"></path>
                  <path d="m16 6-4 4-4-4"></path>
                  <path d="M8 16H4a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-4"></path>
                  <path d="M12 12v6"></path>
                  <path d="M12 18a2 2 0 1 0 0 4 2 2 0 0 0 0-4z"></path>
                </svg>
              </div>
              <h3>Culture d'Innovation</h3>
              <p>Travailler sur des projets de pointe et contribuer vos idées dans un environnement collaboratif.</p>
            </div>

            <div className="benefit-card">
              <div className="benefit-icon">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 22a10 10 0 1 1 0-20 10 10 0 0 1 0 20z"></path>
                  <path d="M12 6v6l4 2"></path>
                </svg>
              </div>
              <h3>Équilibre Vie Pro-Perso</h3>
              <p>Arrangements de travail flexibles et politiques qui respectent votre temps personnel.</p>
            </div>

            <div className="benefit-card">
              <div className="benefit-icon">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
                  <path d="M2 17l10 5 10-5"></path>
                  <path d="M2 12l10 5 10-5"></path>
                </svg>
              </div>
              <h3>Avantages Compétitifs</h3>
              <p>Assurance santé complète, plans de retraite et autres avantages précieux.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="job-listings-section">
        <div className="section-container">
          <div className="section-header">
            <h2>Postes Disponibles</h2>
            <p>Explorez nos opportunités actuelles et trouvez votre prochain défi professionnel</p>
          </div>

          <div className="jobs-container">
            <div className="jobs-filter-bar">
              <div className="search-filter">
                <Search size={18} />
                <input
                  type="text"
                  placeholder="Rechercher par mot-clé..."
                  name="search"
                  value={filters.search}
                  onChange={handleFilterChange}
                />
              </div>

              <div className="filter-controls">
                <div className="filter-dropdown">
                  <select
                    name="department"
                    value={filters.department}
                    onChange={handleFilterChange}
                    className="filter-select"
                  >
                    <option value="">Tous les départements</option>
                    {departments.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={16} className="select-icon" />
                </div>

                {(filters.department || filters.search) && (
                  <button className="clear-filters" onClick={clearFilters}>
                    <X size={16} /> Effacer les filtres
                  </button>
                )}

                <button className="filter-toggle" onClick={() => setShowFilters(!showFilters)}>
                  {showFilters ? "Masquer les filtres" : "Afficher les filtres"}
                </button>
              </div>
            </div>

            {loading ? (
              <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Chargement des offres d'emploi...</p>
              </div>
            ) : error ? (
              <div className="error-container">
                <div className="error-icon">!</div>
                <h3>Une erreur est survenue</h3>
                <p>{error}</p>
                <button className="retry-button" onClick={() => window.location.reload()}>
                  Réessayer
                </button>
              </div>
            ) : filteredJobs.length === 0 ? (
              <div className="no-jobs">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                </svg>
                <h3>Aucune offre d'emploi disponible</h3>
                <p>
                  {filters.department || filters.search
                    ? "Aucun poste ne correspond à vos critères de recherche. Veuillez essayer d'autres filtres."
                    : "Aucune offre d'emploi disponible pour le moment. Veuillez vérifier ultérieurement pour de nouvelles opportunités."}
                </p>
              </div>
            ) : (
              <>
                <div className="jobs-grid">
                  {currentJobs.map((job) => (
                    <div className="job-card" key={job.id}>
                      <div className="job-header">
                        <h3>{job.description}</h3>
                        <span className="job-department">{job.service}</span>
                      </div>

                      <div className="job-meta">
  <div className="job-meta-item">
    <MapPin size={16} />
    <span>{job.emplacement || "Tunis, Tunisie"}</span>
  </div>
  <div className="job-meta-item">
    <Briefcase size={16} />
    <span>
      {job.anneeExperiences > 0 
        ? `${job.anneeExperiences} an(s) d'expérience` 
        : "Débutant accepté"}
    </span>
  </div>
  <div className="job-meta-item">
    <Calendar size={16} />
    <span>
      {job.dateFermeturePostulation 
        ? `Clôture: ${new Date(job.dateFermeturePostulation).toLocaleDateString('fr-FR')}`
        : "Immédiat"}
    </span>
  </div>
  <div className="job-meta-item">
    <span className={`status-badge ${job.status === 'disponible' ? 'available' : 'closed'}`}>
      {job.status === 'disponible' ? 'Disponible' : 'Fermé'}
    </span>
  </div>
</div>

                      <div className="job-description">
                        <p>{job.exigences}</p>
                      </div>

                      <div className="job-skills">
                        <h4>Compétences Requises:</h4>
                        <div className="skills-tags">
                          {Object.keys(job.skillsWithPercentage).map((skill) => (
                            <span key={skill} className="skill-tag">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="job-footer">
                        <button className="apply-button" onClick={() => handleApplyClick(job.id)}>
                          Postuler Maintenant <ArrowRight size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="pagination">
                    <button
                      onClick={() => paginate(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="pagination-button"
                    >
                      Précédent
                    </button>

                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((number) => (
                      <button
                        key={number}
                        onClick={() => paginate(number)}
                        className={`pagination-button ${currentPage === number ? "active" : ""}`}
                      >
                        {number}
                      </button>
                    ))}

                    <button
                      onClick={() => paginate(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="pagination-button"
                    >
                      Suivant
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </section>

      <ApplicationModal
        isOpen={isModalOpen}
        onClose={closeModal}
        candidatureId={selectedCandidatureId}
        onSubmit={handleSubmitApplication}
      />

      <Footer />
    </div>
  );
};

export default Careers;