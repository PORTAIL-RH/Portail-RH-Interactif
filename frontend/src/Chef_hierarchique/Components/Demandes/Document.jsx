import React, { useState, useEffect, useCallback } from "react";
import Sidebar from "../Sidebar/Sidebar";
import Navbar from "../Navbar/Navbar";
import { FiSearch, FiFilter, FiCalendar, FiCheck, FiX, FiClock, FiRefreshCw, FiFileText, FiUpload, FiEye, FiDownload } from "react-icons/fi";
import "./Demandes.css";
import DemandeDetailsModal from "./DemandeDetailsModal";

const DemandesDocument = () => {
  const [demandes, setDemandes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);
  const [filteredDemandes, setFilteredDemandes] = useState([]);
  const [uploadedResponseFiles, setUploadedResponseFiles] = useState({});
  const [selectedDemande, setSelectedDemande] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [theme, setTheme] = useState("light")


    // Theme management
    useEffect(() => {
      const savedTheme = localStorage.getItem("theme") || "light"
      setTheme(savedTheme)
      applyTheme(savedTheme)
  
      // Listen for theme changes
      const handleStorageChange = () => {
        const currentTheme = localStorage.getItem("theme") || "light"
        setTheme(currentTheme)
        applyTheme(currentTheme)
      }
  
      window.addEventListener("storage", handleStorageChange)
      window.addEventListener("themeChanged", (e) => {
        setTheme(e.detail || "light")
        applyTheme(e.detail || "light")
      })
  
      return () => {
        window.removeEventListener("storage", handleStorageChange)
        window.removeEventListener("themeChanged", handleStorageChange)
      }
    }, [])
  
    const applyTheme = (theme) => {
      document.documentElement.classList.remove("light", "dark")
      document.documentElement.classList.add(theme)
      document.body.className = theme
    }
  
    const toggleTheme = () => {
      const newTheme = theme === "light" ? "dark" : "light"
      setTheme(newTheme)
      applyTheme(newTheme)
      localStorage.setItem("theme", newTheme)
      window.dispatchEvent(new CustomEvent("themeChanged", { detail: newTheme }))
    }
    const getUserId = () => {
      try {
        const userData = localStorage.getItem("userId");
        if (!userData) return null;
        
        try {
          const parsed = JSON.parse(userData);
          return parsed?.userId || parsed?.id || null;
        } catch {
          return userData;
        }
      } catch (e) {
        console.error("Error reading userId from localStorage:", e);
        return null;
      }
    };
  
    const userId = getUserId();
  
    const fetchDemandes = useCallback(async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("authToken");
  
        // Clear cache on each fetch to get fresh data
        localStorage.removeItem("demandesAutorisation");
  
        if (!userId) {
          throw new Error("User ID not found in localStorage");
        }
  
        const response = await fetch(
          `http://localhost:8080/api/demande-document/collaborateurs-by-service/${userId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
  
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText || "Failed to fetch demandes");
        }
  
        const data = await response.json();
        
        if (!data.demandes) {
          throw new Error("Invalid response format: demandes array missing");
        }
  
        const demandesFromResponse = Array.isArray(data.demandes) ? data.demandes : [];
        
        setDemandes(demandesFromResponse);
        setFilteredDemandes(demandesFromResponse);
        setLoading(false);
      } catch (error) {
        console.error("Fetch error:", error);
        setError(error.message || "An unknown error occurred");
        setLoading(false);
      }
    }, [userId]);

  useEffect(() => {
    fetchDemandes();
  }, [fetchDemandes]);

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token) return;

    const eventSource = new EventSource(`http://localhost:8080/api/sse/updates`);
    
    eventSource.onmessage = (event) => {
      try {
        const update = JSON.parse(event.data);
        if (["created", "updated", "deleted"].includes(update.type)) {
          fetchDemandes();
        }
      } catch (e) {
        console.error("SSE parse error:", e);
      }
    };

    eventSource.onerror = (error) => {
      console.error("SSE connection error:", error);
      eventSource.close();
    };

    return () => eventSource.close();
  }, [fetchDemandes]);

  useEffect(() => {
    let filtered = demandes;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (demande) =>
          (demande.matPers?.nom?.toLowerCase()?.includes(query)) ||
          (demande.texteDemande?.toLowerCase()?.includes(query))
      );
    }
    if (selectedStatus !== "all") {
      filtered = filtered.filter((demande) => demande.reponseChef === selectedStatus);
    }
    if (startDate && endDate) {
      filtered = filtered.filter((demande) => {
        try {
          const demandeDate = new Date(demande.dateDemande);
          return demandeDate >= new Date(startDate) && demandeDate <= new Date(endDate);
        } catch (e) {
          console.error("Date parsing error:", e);
          return false;
        }
      });
    }
    setFilteredDemandes(filtered);
  }, [selectedStatus, startDate, endDate, demandes, searchQuery]);

  const handleResponseFileChange = (e, demandeId) => {
    try {
      const file = e.target.files?.[0];
      if (file) {
        setUploadedResponseFiles((prev) => ({ ...prev, [demandeId]: file }));
      }
    } catch (error) {
      console.error("File upload error:", error);
    }
  };
  
  const handleConfirmer = async (demandeId) => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        throw new Error("Authentication token not found");
      }
  
      const responseFile = uploadedResponseFiles[demandeId];
      if (!responseFile) {
        alert("Please upload a response document first");
        return;
      }
  
      // First upload the response file
      const formData = new FormData();
      formData.append("file", responseFile);
  
      const uploadResponse = await fetch(
        `http://localhost:8080/api/demande-document/${demandeId}/add-response-file`,
        {
          method: "POST",
          body: formData,
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
  
      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        throw new Error(errorData.error || "Failed to upload file");
      }

      // Then approve the request
      const approveResponse = await fetch(
        `http://localhost:8080/api/demande-document/valider/${demandeId}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
  
      if (!approveResponse.ok) {
        const errorData = await approveResponse.json();
        throw new Error(errorData.error || "Failed to approve request");
      }
  
      alert("Request approved successfully");
      fetchDemandes();
      setUploadedResponseFiles((prev) => {
        const newFiles = { ...prev };
        delete newFiles[demandeId];
        return newFiles;
      });
    } catch (error) {
      console.error("Approval error:", error);
      alert(`Error: ${error.message}`);
    }
  };

  const handleRefuser = async (demandeId) => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        throw new Error("Authentication token not found");
      }

      const response = await fetch(
        `http://localhost:8080/api/demande-document/refuser/${demandeId}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(await response.text());
      }

      alert("Request rejected successfully");
      fetchDemandes();
    } catch (error) {
      console.error("Rejection error:", error);
      alert(`Error: ${error.message}`);
    }
  };

  const handleDownloadResponseFile = async (fileName) => {
    try {
      if (!fileName) {
        throw new Error("No file name provided");
      }
      
      const token = localStorage.getItem("authToken");
      if (!token) {
        throw new Error("Authentication token not found");
      }

      const response = await fetch(
        `http://localhost:8080/api/demande-document/download/${encodeURIComponent(fileName)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to download");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Download error:", error);
      alert(`Error downloading file: ${error.message}`);
    }
  };

  const openModal = (demande) => {
    try {
      if (!demande) return;
      setSelectedDemande({
        ...demande,
        filesReponse: (demande.filesReponse || []).filter(f => f !== null && f.filename)
      });
      setIsModalOpen(true);
    } catch (error) {
      console.error("Error opening modal:", error);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedDemande(null);
  };

  const toggleFilterExpand = () => setIsFilterExpanded(!isFilterExpanded);

  const clearFilters = () => {
    setSelectedStatus("all");
    setStartDate(null);
    setEndDate(null);
    setSearchQuery("");
  };

  if (loading) {
    return (
      <div className={`app-container ${theme}`}>
      <Sidebar theme={theme} />
        <div className="demandes-container">
        <Navbar theme={theme} toggleTheme={toggleTheme}/>
        <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading requests...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`app-container ${theme}`}>
      <Sidebar theme={theme} />
        <div className="demandes-container">
        <Navbar theme={theme} toggleTheme={toggleTheme}/>
        <div className="error-container">
            <div className="error-icon">
              <FiX size={48} />
            </div>
            <h2>Error loading data</h2>
            <p>{error}</p>
            <button className="retry-button" onClick={fetchDemandes}>
              <FiRefreshCw /> Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`app-container ${theme}`}>
      <Sidebar theme={theme} />
      <div className="demandes-container">
      <Navbar theme={theme} toggleTheme={toggleTheme}/>
      <div className="demandes-content">
          <div className="page-header">
            <h1>Document Requests</h1>
            <p>Manage your collaborators' document requests</p>
          </div>

          <div className="filter-tabs-container">
            <div className="filter-tabs">
              {["all", "I", "O", "N"].map((status) => (
                <button
                  key={status}
                  className={`filter-tab ${selectedStatus === status ? "active" : ""}`}
                  onClick={() => setSelectedStatus(status)}
                >
                  {status === "all" ? "All" : status === "I" ? "Pending" : status === "O" ? "Approved" : "Rejected"}
                </button>
              ))}
            </div>
            <div className="filter-toggle" onClick={toggleFilterExpand}>
              <FiFilter />
              <span>Filters</span>
              <span className={`filter-count ${startDate && endDate ? "active" : ""}`}>
                {startDate && endDate ? 1 : 0}
              </span>
            </div>
          </div>

          <div className="search-bar-container">
            <div className="search-bar">
              <FiSearch className="search-icon" />
              <input
                type="text"
                placeholder="Search by name or content..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="stats-cards">
            {[
              { title: "Total Requests", value: demandes.length, icon: <FiFileText /> },
              { title: "Pending", value: demandes.filter(d => d.reponseChef === "I").length, icon: <FiClock /> },
              { title: "Approved", value: demandes.filter(d => d.reponseChef === "O").length, icon: <FiCheck /> }
            ].map((stat, index) => (
              <div key={index} className={`stat-card ${index === 0 ? "total" : index === 1 ? "pending" : "approved"}`}>
                <div className="stat-content">
                  <h3>{stat.title}</h3>
                  <p className="stat-value">{stat.value}</p>
                </div>
                <div className="stat-icon">{stat.icon}</div>
              </div>
            ))}
          </div>

          {isFilterExpanded && (
            <div className="filter-panel expanded">
              <div className="filter-options">
                <div className="filter-group">
                  <label>Date Range</label>
                  <div className="date-inputs">
                    <div className="date-input">
                      <FiCalendar className="date-icon" />
                      <input
                        type="date"
                        value={startDate || ""}
                        onChange={(e) => setStartDate(e.target.value)}
                        placeholder="Start date"
                      />
                    </div>
                    <span className="date-separator">to</span>
                    <div className="date-input">
                      <FiCalendar className="date-icon" />
                      <input
                        type="date"
                        value={endDate || ""}
                        onChange={(e) => setEndDate(e.target.value)}
                        placeholder="End date"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="filter-actions">
                <button className="clear-filters" onClick={clearFilters}>
                  Clear filters
                </button>
              </div>
            </div>
          )}

          <div className="results-summary">
            <p>
              <span className="results-count">{filteredDemandes.length}</span> requests found
            </p>
          </div>

          {filteredDemandes.length > 0 ? (
            <div className="table-container">
              <table className="demandes-table">
                <thead>
                  <tr>
                    <th>Request Date</th>
                    <th>Name</th>
                    <th>Request Text</th>
                    <th>Status</th>
                    <th>Response Document</th>
                    <th>Actions</th>
                    <th>View</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDemandes.map((demande) => (
                    <tr key={demande.id}>
                      <td>
                        <div className="cell-with-icon">
                          <FiCalendar className="cell-icon" />
                          <span>
                            {demande.dateDemande ? new Date(demande.dateDemande).toLocaleDateString() : "N/A"}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className="employee-info">
                          <span className="employee-name">{demande.matPers?.nom || "Unknown"}</span>
                          {demande.matPers?.prenom && (
                            <span className="employee-details">{demande.matPers.prenom}</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="demande-text">
                          {demande.texteDemande || <span className="no-content">No text</span>}
                        </div>
                      </td>
                      <td>
                        <span className={`status-badge ${
                          demande.reponseChef === "I" ? "pending" :
                          demande.reponseChef === "O" ? "approved" : "rejected"
                        }`}>
                          <span className="status-icon">
                            {demande.reponseChef === "I" ? <FiClock /> :
                             demande.reponseChef === "O" ? <FiCheck /> : <FiX />}
                          </span>
                          {demande.reponseChef === "I" ? "Pending" :
                           demande.reponseChef === "O" ? "Approved" : "Rejected"}
                        </span>
                      </td>
                      <td>
                        {demande.filesReponse && demande.filesReponse.length > 0 ? (
                          <div className="response-files">
                            {demande.filesReponse
                              .filter(file => file !== null && file.filename)
                              .map((file, index) => (
                                <div key={index} className="response-file-item">
                                  {file.filePath ? (
                                    <span 
                                      className="file-link"
                                      onClick={() => handleDownloadResponseFile(file.filePath.split('/').pop())}
                                    >
                                      <FiDownload /> {file.filename}
                                    </span>
                                  ) : (
                                    <span className="file-link">
                                      <FiDownload /> {file.filename} (No file available)
                                    </span>
                                  )}
                                </div>
                              ))}
                          </div>
                        ) : demande.reponseChef === "I" ? (
                          <div className="file-input-container">
                            <label
                              htmlFor={`response-file-upload-${demande.id}`}
                              className="file-upload-label"
                            >
                              <FiUpload /> Choose response file
                            </label>
                            <input
                              id={`response-file-upload-${demande.id}`}
                              type="file"
                              onChange={(e) => handleResponseFileChange(e, demande.id)}
                              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                              style={{ display: "none" }}
                            />
                            {uploadedResponseFiles[demande.id] && (
                              <span className="file-name">{uploadedResponseFiles[demande.id].name}</span>
                            )}
                          </div>
                        ) : (
                          <span className="no-file">No response file</span>
                        )}
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button
                            className={`action-button approve ${demande.reponseChef !== "I" ? "disabled-button" : ""}`}
                            onClick={() => handleConfirmer(demande.id)}
                            disabled={demande.reponseChef !== "I" || !uploadedResponseFiles[demande.id]}
                            title={
                              demande.reponseChef !== "I"
                                ? "Action not available"
                                : !uploadedResponseFiles[demande.id]
                                ? "Please upload a response document first"
                                : "Approve this request"
                            }
                          >
                            <FiCheck /> Approve
                          </button>
                          <button
                            className={`action-button reject ${demande.reponseChef !== "I" ? "disabled-button" : ""}`}
                            onClick={() => handleRefuser(demande.id)}
                            disabled={demande.reponseChef !== "I"}
                            title={demande.reponseChef !== "I" ? "Action not available" : "Reject this request"}
                          >
                            <FiX /> Reject
                          </button>
                        </div>
                      </td>
                      <td>
                        <button
                          className="action-button view"
                          onClick={() => openModal(demande)}
                          title="View details"
                        >
                          <FiEye />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="no-results">
              <div className="no-results-icon">
                <FiFilter size={48} />
              </div>
              <h3>No requests found</h3>
              <p>No requests match your search criteria.</p>
              <button className="clear-filters-button" onClick={clearFilters}>
                Clear filters
              </button>
            </div>
          )}

          {isModalOpen && selectedDemande && (
            <DemandeDetailsModal
              demande={selectedDemande}
              onClose={closeModal}
              onApprove={() => handleConfirmer(selectedDemande.id)}
              onReject={() => handleRefuser(selectedDemande.id)}
              isActionable={selectedDemande.reponseChef === "I"}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default DemandesDocument;