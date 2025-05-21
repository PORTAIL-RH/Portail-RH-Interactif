import { useRef } from "react"
import { FiCalendar, FiBook, FiClock, FiFileText, FiDollarSign } from "react-icons/fi"
import "./RequestNavBar.css"

const RequestNavBar = ({ activeRequest, onNavigate }) => {
  const scrollRef = useRef(null)

  const requests = [
    { id: "conge", label: "Congé", icon: <FiCalendar />, path: "/CongeChef" },
    { id: "formation", label: "Formation", icon: <FiBook />, path: "/FormationChef" },
    { id: "autorisation", label: "Autorisation", icon: <FiClock />, path: "/AutorisationChef" },
    { id: "document", label: "Document", icon: <FiFileText />, path: "/DocumentChef" },
    { id: "avance", label: "Avance", icon: <FiDollarSign />, path: "/AvanceChef" },
  ]

  const handleRequestClick = (path) => {
    if (onNavigate) {
      onNavigate(path)
    } else {
      window.location.href = path
    }
  }

  const scroll = (direction) => {
    if (scrollRef.current) {
      const { current } = scrollRef
      const scrollAmount = direction === "left" ? -200 : 200
      current.scrollBy({ left: scrollAmount, behavior: "smooth" })
    }
  }

  return (
    <div className="request-nav-container">
      <button className="scroll-button left" onClick={() => scroll("left")}>
        &lt;
      </button>

      <div className="request-nav-scroll" ref={scrollRef}>
        <div className="request-nav-items">
          {requests.map((request) => (
            <div
              key={request.id}
              className={`request-nav-item ${activeRequest === request.id ? "active" : ""}`}
              onClick={() => handleRequestClick(request.path)}
            >
              <div className="request-nav-icon">{request.icon}</div>
              <span className="request-nav-label">{request.label}</span>
            </div>
          ))}
        </div>
      </div>

      <button className="scroll-button right" onClick={() => scroll("right")}>
        &gt;
      </button>
    </div>
  )
}

export default RequestNavBar
