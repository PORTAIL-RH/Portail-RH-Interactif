import { useState, useEffect } from "react";
import { Search, Download, FileText, FileClock, FileCheck, Filter, Calendar, Star, Clock, Mail } from 'lucide-react';
import { toast } from 'react-toastify';
import './Documents.css';
import Sidebar from "../Sidebar/Sidebar";
import Navbar from "../Navbar/Navbar";
import { API_URL } from "../../../config"

export default function EmployeeDocumentsPage() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [theme, setTheme] = useState("light");
  const [sortBy, setSortBy] = useState("date");
  const [viewMode, setViewMode] = useState("grid");
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [previewState, setPreviewState] = useState({
    fileId: null,
    url: null,
    isLoading: false,
    error: null
  });

  // Theme management
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "light";
    setTheme(savedTheme);
    applyTheme(savedTheme);

    const handleStorageChange = () => {
      const currentTheme = localStorage.getItem("theme") || "light";
      setTheme(currentTheme);
      applyTheme(currentTheme);
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("themeChanged", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("themeChanged", handleStorageChange);
    };
  }, []);

  // Fetch documents from API
  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const userId = localStorage.getItem("userId");
        if (!userId) {
          throw new Error("User ID not found in local storage");
        }

        const response = await fetch(`${API_URL}/api/demande-document/personnel/${userId}/files-reponse`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        const transformedDocuments = data.map(doc => ({
          id: doc.fileId || doc.documentId || Math.random().toString(36).substr(2, 9),
          title: doc.title || doc.filename || "Untitled Document",
          category: doc.category || "uncategorized",
          date: doc.date || doc.uploadDate || new Date().toISOString().split('T')[0],
          status: doc.status || "available",
          fileType: doc.fileType || (doc.filename ? doc.filename.split('.').pop().toUpperCase() : "UNK"),
          size: doc.size || "N/A",
          isStarred: doc.isStarred || false,
          downloadUrl: doc.downloadUrl || doc.fileUrl || "#"
        }));

        setDocuments(transformedDocuments);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching documents:", err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchDocuments();
  }, []);

  const applyTheme = (theme) => {
    document.documentElement.classList.remove("light-theme", "dark-theme");
    document.documentElement.classList.add(`${theme}-theme`);
    document.body.className = `${theme}-theme`;
  };

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    applyTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    window.dispatchEvent(new CustomEvent("themeChanged", { detail: newTheme }));
  };

  // File download function
  const handleDownload = async (fileId, filename = "document") => {
    if (!fileId) {
      toast.warning("No file selected");
      return;
    }

    const toastId = toast.loading("Preparing download...");
    
    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        throw new Error("Authentication token not found");
      }

      const response = await fetch(`${API_URL}/api/files/download/${fileId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `HTTP error: ${response.status}`);
      }

      // Get filename from content-disposition header or use the provided one
      const contentDisposition = response.headers.get('content-disposition');
      let actualFilename = filename;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
        if (filenameMatch && filenameMatch[1]) {
          actualFilename = filenameMatch[1];
        }
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = actualFilename;
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);

      toast.update(toastId, {
        render: "Download started!",
        type: "success",
        isLoading: false,
        autoClose: 2000
      });
    } catch (err) {
      console.error("Download error:", err);
      toast.update(toastId, {
        render: `Download failed: ${err.message}`,
        type: "error",
        isLoading: false,
        autoClose: 3000
      });
    }
  };

  // File preview function
  const handlePreview = async (fileId) => {
    if (!fileId) {
      toast.warning("No file selected");
      return;
    }

    if (previewState.fileId === fileId) {
      cleanupPreview();
      return;
    }

    setPreviewState({
      fileId,
      url: null,
      isLoading: true,
      error: null
    });

    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        throw new Error("Authentication token not found");
      }

      const response = await fetch(`${API_URL}/api/files/download/${fileId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `HTTP error: ${response.status}`);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      setPreviewState({
        fileId,
        url,
        isLoading: false,
        error: null
      });
    } catch (err) {
      console.error("Preview error:", err);
      setPreviewState({
        fileId: null,
        url: null,
        isLoading: false,
        error: err.message
      });
      toast.error(`Preview failed: ${err.message}`);
    }
  };

  const cleanupPreview = () => {
    if (previewState.url) {
      URL.revokeObjectURL(previewState.url);
    }
    setPreviewState({
      fileId: null,
      url: null,
      isLoading: false,
      error: null
    });
  };

  useEffect(() => {
    return () => cleanupPreview();
  }, []);

  // Simple share function using mailto:



  // Document filtering and sorting
  const filteredDocuments = documents.filter((doc) => {
    const matchesCategory = activeCategory === "all" || doc.category === activeCategory;
    const matchesSearch = doc.title && doc.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const sortedDocuments = [...filteredDocuments].sort((a, b) => {
    if (sortBy === "date") return new Date(b.date) - new Date(a.date);
    if (sortBy === "name") return a.title.localeCompare(b.title);
    if (sortBy === "type") return a.fileType.localeCompare(b.fileType);
    if (sortBy === "status") return a.status.localeCompare(b.status);
    return 0;
  });

  const categories = ["all", ...new Set(documents.map((doc) => doc.category).filter(Boolean))];

  // Document icon helper
  const getDocumentIcon = (status, size = 24) => {
    switch (status) {
      case "pending": return <FileClock size={size} />;
      case "signed":
      case "completed":
      case "active": return <FileCheck size={size} />;
      default: return <FileText size={size} />;
    }
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  // Preview component
  const FilePreview = () => {
    if (previewState.isLoading) return (
      <div className="preview-loading">
        <div className="spinner"></div>
        <p>Loading preview...</p>
      </div>
    );

    if (previewState.error) return (
      <div className="preview-error">
        <p>Error: {previewState.error}</p>
      </div>
    );

    if (!previewState.url) return null;

    return (
      <div className="file-preview-modal">
        <div className="file-preview-content">
          <div className="file-preview-header">
            <h3>File Preview</h3>
            <button 
              className="close-preview"
              onClick={cleanupPreview}
            >
              X
            </button>
          </div>
          <div className="file-preview-container">
            <iframe 
              src={previewState.url} 
              title="File Preview"
              className="file-iframe"
            />
          </div>
          <div className="file-preview-footer">
            <button 
              className="btn-download"
              onClick={() => handleDownload(previewState.fileId)}
            >
              <Download size={16} /> Download
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className={`app-container ${theme}-theme`}>
        <Sidebar theme={theme} />
        <div className="main-content-container">
          <Navbar theme={theme} toggleTheme={toggleTheme} />
          <div className="loading-container">
            <p>Loading documents...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`app-container ${theme}-theme`}>
        <Sidebar theme={theme} />
        <div className="main-content-container">
          <Navbar theme={theme} toggleTheme={toggleTheme} />
          <div className="error-container">
            <p>Error loading documents: {error}</p>
            <button onClick={() => window.location.reload()}>Retry</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`app-container ${theme}-theme`}>
      <Sidebar theme={theme} />
      <div className="main-content-container">
        <Navbar theme={theme} toggleTheme={toggleTheme} />
        
        <div className="documents-page">
          <header className="header">
            <div className="header-content">
              <div className="view-options">
                <button 
                  className={`view-option-btn ${viewMode === 'grid' ? 'active' : ''}`}
                  onClick={() => setViewMode('grid')}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
                    <rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
                    <rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
                    <rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                </button>
                <button 
                  className={`view-option-btn ${viewMode === 'list' ? 'active' : ''}`}
                  onClick={() => setViewMode('list')}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M8 6H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    <path d="M8 12H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    <path d="M8 18H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    <path d="M3 6H3.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    <path d="M3 12H3.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    <path d="M3 18H3.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>
            </div>
          </header>

          <main className="main-content">
            <div className="page-title">
              <h1>My Documents</h1>
              <p>View and download your personal documents</p>
            </div>

            <div className="search-filter-container">
              <div className="search-box">
                <Search className="search-icon" size={20} />
                <input
                  type="text"
                  placeholder="Search documents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="filter-sort-container">
                <div className="filter-box">
                  <Filter className="filter-icon" size={18} />
                  <select
                    value={activeCategory}
                    onChange={(e) => setActiveCategory(e.target.value)}
                  >
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="sort-box">
                  <Clock className="sort-icon" size={18} />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                  >
                    <option value="date">Sort by Date</option>
                    <option value="name">Sort by Name</option>
                    <option value="type">Sort by Type</option>
                    <option value="status">Sort by Status</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="categories">
              {categories.map((category) => (
                <button
                  key={category}
                  className={`category-btn ${activeCategory === category ? "active" : ""}`}
                  onClick={() => setActiveCategory(category)}
                >
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </button>
              ))}
            </div>

            {/* File Preview Section */}
            <FilePreview />

            <div className={`documents-container ${viewMode}`}>
              {sortedDocuments.length > 0 ? (
                sortedDocuments.map((doc) => (
                  <div className="document-card" key={doc.id}>
                    <div className="document-icon">
                      {getDocumentIcon(doc.status)}
                    </div>
                    <div className="document-info">
                      <div className="document-title-row">
                        <h3>{doc.title}</h3>
                        {doc.isStarred && <Star className="star-icon" size={16} fill="currentColor" />}
                      </div>
                      <div className="document-meta">
                        <span className="document-date">
                          <Calendar size={14} />
                          {formatDate(doc.date)}
                        </span>
                        <span className="document-type">{doc.fileType}</span>
                        <span className="document-size">{doc.size}</span>
                        <span className={`document-status status-${doc.status}`}>
                          {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                        </span>
                      </div>
                    </div>
                    <div className="document-actions">
                      <button 
                        className="action-btn preview-btn"
                        onClick={() => handlePreview(doc.id)}
                      >
                        <FileText size={18} />
                        <span>Preview</span>
                      </button>
                      <button 
                        className="action-btn download-btn"
                        onClick={() => handleDownload(doc.id, doc.title)}
                      >
                        <Download size={18} />
                        <span>Download</span>
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="no-documents">
                  <FileText size={48} />
                  <p>No documents found matching your criteria.</p>
                  <button 
                    className="reset-filters-btn"
                    onClick={() => {
                      setActiveCategory("all");
                      setSearchQuery("");
                    }}
                  >
                    Reset Filters
                  </button>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}