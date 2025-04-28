
import { useState } from "react"
import "./JoinUs.css"
import { API_URL } from "../../config"; 

const JobPlatform = () => {
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [selectedType, setSelectedType] = useState("All")

  const jobListings = [
    {
      id: 1,
      title: "Data Analytics Business Analyst",
      category: "Engineering + Remote",
      location: "Ithaca, New York",
      type: "Contract",
      salary: "$65 per hour",
      experience: "5 Years",
      timePosted: "12 Hours ago",
    },
    {
      id: 2,
      title: "Senior Software Engineer",
      category: "Engineering + Remote",
      location: "Mountain View, CA",
      type: "Full-time",
      salary: "$150k - $180k",
      experience: "5 Years",
      timePosted: "1 Day ago",
    },
    {
      id: 3,
      title: "UX Designer",
      category: "Design",
      location: "San Francisco, CA",
      type: "Contract",
      salary: "$75 per hour",
      experience: "3 Years",
      timePosted: "2 Days ago",
    },
    {
      id: 4,
      title: "Product Manager",
      category: "Marketing & Creative",
      location: "New York, NY",
      type: "Full-time",
      salary: "$130k - $160k",
      experience: "4 Years",
      timePosted: "3 Days ago",
    },
    {
      id: 5,
      title: "Frontend Developer",
      category: "Engineering + Remote",
      location: "Remote",
      type: "Full-time",
      salary: "$120k - $150k",
      experience: "3 Years",
      timePosted: "1 Week ago",
    },
  ]

  return (
    <div className="platform-container">
      {/* Header */}
      <header className="platform-header">
        <div className="header-left">
          <div className="logo">M</div>
          <button className="browse-opportunities">Browse Opportunities</button>
        </div>
        <div className="header-right">
          <div className="notifications">
            <span className="notification-icon">🔔</span>
          </div>
          <div className="profile">
            <img src="/placeholder.svg?height=32&width=32" alt="Profile" className="profile-image" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="platform-main">
        {/* Welcome Banner */}
        <div className="welcome-banner">
          <div className="welcome-content">
            <h1>Hi, Welcome!</h1>
            <h2>Your Next Job Opportunity</h2>
          </div>
          <div className="contact-info">
            <div className="contact-person">
              <img src="/placeholder.svg?height=48&width=48" alt="Contact" className="contact-image" />
              <div className="contact-details">
                <p>Account Manager</p>
                <p>+1 650-245-5567</p>
              </div>
            </div>
          </div>
        </div>

        <div className="platform-content">
          {/* Sidebar */}
          <aside className="sidebar">
            <div className="search-box">
              <input type="text" placeholder="Search Jobs" />
              <select defaultValue="All Location">
                <option>All Location</option>
                <option>Remote</option>
                <option>On-site</option>
                <option>Hybrid</option>
              </select>
            </div>

            <div className="filter-section">
              <h3>Employee Type</h3>
              <ul>
                <li>
                  <input type="checkbox" id="fulltime" />
                  <label htmlFor="fulltime">Full-time</label>
                </li>
                <li>
                  <input type="checkbox" id="freelance" />
                  <label htmlFor="freelance">Freelance</label>
                </li>
                <li>
                  <input type="checkbox" id="contract" />
                  <label htmlFor="contract">Contract</label>
                </li>
                <li>
                  <input type="checkbox" id="intern" />
                  <label htmlFor="intern">Intern</label>
                </li>
              </ul>
            </div>

            <div className="filter-section">
              <h3>Job Category</h3>
              <ul>
                <li>
                  <input type="checkbox" id="engineering" />
                  <label htmlFor="engineering">Engineering</label>
                </li>
                <li>
                  <input type="checkbox" id="design" />
                  <label htmlFor="design">Design</label>
                </li>
                <li>
                  <input type="checkbox" id="marketing" />
                  <label htmlFor="marketing">Marketing & Creative</label>
                </li>
                <li>
                  <input type="checkbox" id="finance" />
                  <label htmlFor="finance">Finance & Accounting</label>
                </li>
              </ul>
            </div>

            <div className="filter-section">
              <h3>Experience</h3>
              <ul>
                <li>
                  <input type="checkbox" id="entry" />
                  <label htmlFor="entry">Less than 1 Year</label>
                </li>
                <li>
                  <input type="checkbox" id="junior" />
                  <label htmlFor="junior">1-2 Years</label>
                </li>
                <li>
                  <input type="checkbox" id="mid" />
                  <label htmlFor="mid">3-5 Years</label>
                </li>
                <li>
                  <input type="checkbox" id="senior" />
                  <label htmlFor="senior">5 Years +</label>
                </li>
              </ul>
            </div>

            <div className="filter-section">
              <h3>Last Updated</h3>
              <ul>
                <li>
                  <input type="checkbox" id="recent" />
                  <label htmlFor="recent">Recently</label>
                </li>
                <li>
                  <input type="checkbox" id="24h" />
                  <label htmlFor="24h">24 Hours</label>
                </li>
                <li>
                  <input type="checkbox" id="week" />
                  <label htmlFor="week">1 Week</label>
                </li>
                <li>
                  <input type="checkbox" id="anytime" />
                  <label htmlFor="anytime">Anytime</label>
                </li>
              </ul>
            </div>
          </aside>

          {/* Job Listings */}
          <section className="job-listings">
            {jobListings.map((job) => (
              <div className="job-card" key={job.id}>
                <div className="job-info">
                  <h3>{job.title}</h3>
                  <p className="job-category">{job.category}</p>
                  <div className="job-details">
                    <span className="experience">
                      <span className="icon">⏳</span>
                      {job.experience}
                    </span>
                    <span className="type">
                      <span className="icon">📋</span>
                      {job.type}
                    </span>
                    <span className="salary">
                      <span className="icon">💰</span>
                      {job.salary}
                    </span>
                  </div>
                </div>
                <div className="job-meta">
                  <div className="location">
                    <span className="icon">📍</span>
                    {job.location}
                  </div>
                  <div className="time-posted">{job.timePosted}</div>
                  <button className="apply-button">1 Click Apply</button>
                </div>
              </div>
            ))}

            <div className="pagination">
              <button disabled>← Prev</button>
              <span className="current-page">1</span>
              <button>Next →</button>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}

export default JobPlatform

