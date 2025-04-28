import { useState, useEffect } from "react";
import { Search, Download, FileText, FileClock, FileCheck, Filter, Calendar, Star, Clock, Share2 } from 'lucide-react';
import "./Documents.css";
import Sidebar from "../Sidebar/Sidebar";
import Navbar from "../Navbar/Navbar";

export default function EmployeeDocumentsPage() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [theme, setTheme] = useState("light");
  const [sortBy, setSortBy] = useState("date");
  const [viewMode, setViewMode] = useState("grid");
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

        const response = await fetch(`http://localhost:8080/api/demande-document/personnel/${userId}/files-reponse`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        // Transform the API data to match your expected format
        const transformedDocuments = data.map(doc => ({
          id: doc.id || doc.documentId, // Use whichever field your API provides
          title: doc.title || doc.fileName,
          category: doc.category || "uncategorized", // Default category if not provided
          date: doc.date || doc.uploadDate || new Date().toISOString().split('T')[0],
          status: doc.status || "available", // Default status if not provided
          fileType: doc.fileType || doc.fileName.split('.').pop().toUpperCase(),
          size: doc.size || "N/A",
          isStarred: doc.isStarred || false,
          downloadUrl: doc.downloadUrl || doc.fileUrl // Add download URL if available
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

  // Filter documents based on active category and search query
  const filteredDocuments = documents.filter((doc) => {
    const matchesCategory = activeCategory === "all" || doc.category === activeCategory;
    const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Sort documents
  const sortedDocuments = [...filteredDocuments].sort((a, b) => {
    if (sortBy === "date") {
      return new Date(b.date) - new Date(a.date);
    } else if (sortBy === "name") {
      return a.title.localeCompare(b.title);
    } else if (sortBy === "type") {
      return a.fileType.localeCompare(b.fileType);
    } else if (sortBy === "status") {
      return a.status.localeCompare(b.status);
    }
    return 0;
  });

  // Get unique categories for the filter
  const categories = ["all", ...new Set(documents.map((doc) => doc.category))];

  // Handle document download
  const handleDownload = async (documentId, downloadUrl) => {
    try {
      if (downloadUrl) {
        // If the API provides direct download URLs
        window.open(downloadUrl, '_blank');
      } else {
        // If you need to call a separate download endpoint
        const response = await fetch(`http://localhost:8080/api/documents/${documentId}/download`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (!response.ok) throw new Error('Download failed');
        
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        
        const document = documents.find(doc => doc.id === documentId);
        link.download = document?.title || `document-${documentId}`;
        
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('Download error:', err);
      alert('Failed to download document');
    }
  };

  // Handle document preview (simulated)
  const handlePreview = (documentId) => {
    console.log(`Previewing document with ID: ${documentId}`);
    // In a real application, this would open a preview modal
    alert(`Document preview opened!`);
  };

  // Handle document share (simulated)
  const handleShare = (documentId) => {
    console.log(`Sharing document with ID: ${documentId}`);
    // In a real application, this would open a share modal
    alert(`Document share dialog opened!`);
  };

  // Get document icon based on status
  const getDocumentIcon = (status, size = 24) => {
    switch (status) {
      case "pending":
        return <FileClock size={size} />;
      case "signed":
      case "completed":
      case "active":
        return <FileCheck size={size} />;
      default:
        return <FileText size={size} />;
    }
  };

  // Format date for better display
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
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
                  aria-label="Grid view"
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
                  aria-label="List view"
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
                        aria-label={`Preview ${doc.title}`}
                      >
                        <FileText size={18} />
                        <span className="action-text">Preview</span>
                      </button>
                      <button 
                        className="action-btn share-btn"
                        onClick={() => handleShare(doc.id)}
                        aria-label={`Share ${doc.title}`}
                      >
                        <Share2 size={18} />
                        <span className="action-text">Share</span>
                      </button>
                      <button 
                        className="action-btn download-btn"
                        onClick={() => handleDownload(doc.id, doc.downloadUrl)}
                        aria-label={`Download ${doc.title}`}
                      >
                        <Download size={18} />
                        <span className="action-text">Download</span>
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