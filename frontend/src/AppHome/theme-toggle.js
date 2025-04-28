// Theme toggle functionality
document.addEventListener("DOMContentLoaded", () => {
    // Check for saved theme preference
    const savedTheme = localStorage.getItem("theme")
  
    // Apply theme based on saved preference
    if (savedTheme === "dark") {
      document.documentElement.classList.add("dark-theme")
    }
  
    // Create theme toggle button
    const createThemeToggle = () => {
      // Find or create navbar-right container
      const navbarContainer = document.querySelector(".navbar-container")
      if (!navbarContainer) return
  
      let navbarRight = document.querySelector(".navbar-right")
      if (!navbarRight) {
        navbarRight = document.createElement("div")
        navbarRight.className = "navbar-right"
        navbarContainer.appendChild(navbarRight)
      }
  
      // Create toggle button if it doesn't exist
      if (!document.querySelector(".theme-toggle")) {
        const themeToggle = document.createElement("button")
        themeToggle.className = "theme-toggle"
        themeToggle.setAttribute("aria-label", "Toggle dark mode")
  
        // Set initial icon based on current theme
        updateThemeToggleIcon(themeToggle)
  
        // Add click event listener
        themeToggle.addEventListener("click", () => {
          document.documentElement.classList.toggle("dark-theme")
  
          // Save preference to localStorage
          const isDarkMode = document.documentElement.classList.contains("dark-theme")
          localStorage.setItem("theme", isDarkMode ? "dark" : "light")
  
          // Update icon after theme change
          updateThemeToggleIcon(themeToggle)
        })
  
        navbarRight.appendChild(themeToggle)
      }
    }
  
    // Function to update the theme toggle icon based on current theme
    function updateThemeToggleIcon(button) {
      const isDarkMode = document.documentElement.classList.contains("dark-theme")
  
      if (isDarkMode) {
        button.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`
      } else {
        button.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`
      }
    }
  
    // Create theme toggle initially
    createThemeToggle()
  
    // Try again after a short delay in case the DOM is still loading
    setTimeout(createThemeToggle, 500)
  })
  