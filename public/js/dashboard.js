// dashboard.js (No changes needed for UI update, but adding active class logic)
document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("token");

  if (!token) {
    alert("Please login to access your dashboard.");
    window.location.href = "/login";
    return;
  }

  const sectionTitle = document.getElementById("sectionTitle");
  const dashboardContent = document.getElementById("dashboardContent");
  const navLinks = document.querySelectorAll(".sidebar-nav a");

  // Function to set active link
  const setActiveLink = (clickedLink) => {
    navLinks.forEach((link) => link.classList.remove("active"));
    clickedLink.classList.add("active");
  };

  // Sidebar button logic
  document.getElementById("logoutBtn").addEventListener("click", () => {
    localStorage.removeItem("token");
    window.location.href = "/";
  });

  document.getElementById("viewJobsBtn").addEventListener("click", (event) => {
    sectionTitle.innerText = "Available Jobs";
    loadJobs();
    setActiveLink(event.currentTarget);
  });

  document
    .getElementById("myApplicationsBtn")
    .addEventListener("click", (event) => {
      sectionTitle.innerText = "My Applications";
      loadApplications();
      setActiveLink(event.currentTarget);
    });

  document.getElementById("profileBtn").addEventListener("click", (event) => {
    sectionTitle.innerText = "My Profile";
    loadProfile();
    setActiveLink(event.currentTarget);
  });

  // Initial load
  // You might want to default to showing jobs or profile on load
  // For now, let's keep the initial message.
  // Example if you want to load jobs by default:
  // document.getElementById("viewJobsBtn").click();
});

function loadJobs() {
  const container = document.getElementById("dashboardContent");
  container.innerHTML = `<p>Loading jobs...</p>`;
  // TODO: Fetch from backend and display
}

function loadApplications() {
  const container = document.getElementById("dashboardContent");
  container.innerHTML = `<p>Loading applications...</p>`;
  // TODO: Fetch from backend and display
}

function loadProfile() {
  const container = document.getElementById("dashboardContent");
  container.innerHTML = `<p>Loading profile...</p>`;
  // TODO: Fetch from backend and display
}
