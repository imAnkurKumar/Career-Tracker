// public/js/adminDashboard.js
document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "/admin/login";
    return;
  }

  // --- DOM Element References ---
  const sectionTitle = document.getElementById("sectionTitle");
  const statsSection = document.getElementById("statsSection");
  const usersSection = document.getElementById("usersSection");
  const jobsSection = document.getElementById("jobsSection");
  const navLinks = document.querySelectorAll(".sidebar-nav a");

  // --- State ---
  let currentJobsPage = 1;

  // --- Helper Functions ---
  const showSection = (section, title) => {
    // Ensure all sections exist before trying to hide them
    [statsSection, usersSection, jobsSection].forEach((s) => {
      if (s) s.classList.add("hidden");
    });
    if (section) {
      section.classList.remove("hidden");
      sectionTitle.innerText = title;
    }
  };

  const setActiveLink = (clickedLink) => {
    navLinks.forEach((link) => link.classList.remove("active"));
    if (clickedLink) clickedLink.classList.add("active");
  };

  // --- Event Listeners ---
  document.getElementById("dashboardBtn").addEventListener("click", (e) => {
    e.preventDefault();
    setActiveLink(e.currentTarget);
    showSection(statsSection, "Dashboard");
    loadDashboardStats();
  });

  document.getElementById("usersBtn").addEventListener("click", (e) => {
    e.preventDefault();
    setActiveLink(e.currentTarget);
    showSection(usersSection, "User Management");
    loadUsers();
  });

  document.getElementById("jobsBtn").addEventListener("click", (e) => {
    e.preventDefault();
    setActiveLink(e.currentTarget);
    showSection(jobsSection, "Job Management");
    loadJobs(); // Load first page by default
  });

  document.getElementById("logoutBtn").addEventListener("click", () => {
    localStorage.removeItem("token");
    window.location.href = "/";
  });

  // --- API Fetcher ---
  async function fetchAdminData(url, options = {}) {
    const response = await fetch(url, {
      ...options,
      headers: { ...options.headers, Authorization: `Bearer ${token}` },
    });
    if (response.status === 403) {
      alert("Access Denied. You are not an admin.");
      window.location.href = "/";
      throw new Error("Access Denied"); // Stop further execution
    }
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to fetch data");
    }
    return response.json();
  }

  // --- Data Loading Functions ---
  async function loadDashboardStats() {
    try {
      const data = await fetchAdminData("/admin/stats");
      const totalUsersEl = document.getElementById("totalUsers");
      const totalJobsEl = document.getElementById("totalJobs");
      const totalApplicationsEl = document.getElementById("totalApplications");

      if (totalUsersEl) totalUsersEl.innerText = data.userCount;
      if (totalJobsEl) totalJobsEl.innerText = data.jobCount;
      if (totalApplicationsEl)
        totalApplicationsEl.innerText = data.applicationCount;
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  }

  async function loadUsers() {
    try {
      const users = await fetchAdminData("/admin/users");
      const tableBody = usersSection.querySelector("#usersTable tbody");
      if (!tableBody) {
        console.error("Could not find the user table body.");
        return;
      }

      tableBody.innerHTML = ""; // Clear existing rows
      users.forEach((user) => {
        const row = tableBody.insertRow();
        row.innerHTML = `
                    <td>${user.name}</td>
                    <td>${user.email}</td>
                    <td>${user.role}</td>
                    <td><button class="delete-btn" data-id="${user._id}">Delete</button></td>
                `;
      });
      addUserDeleteListeners();
    } catch (error) {
      console.error("Error loading users:", error);
    }
  }

  async function loadJobs(page = 1) {
    currentJobsPage = page;
    const jobsGrid = document.getElementById("jobsGridContainer");
    if (!jobsGrid) return;
    jobsGrid.innerHTML = `<p>Loading jobs...</p>`;

    try {
      const data = await fetchAdminData(`/admin/jobs?page=${page}`);
      jobsGrid.innerHTML = ""; // Clear loading message

      if (data.jobs && data.jobs.length > 0) {
        data.jobs.forEach((job) => {
          const card = document.createElement("div");
          card.className = "admin-job-card";
          card.innerHTML = `
                        <div>
                            <h3>${job.title}</h3>
                            <p><strong>Company:</strong> ${job.company}</p>
                            <p><strong>Location:</strong> ${job.location}</p>
                        </div>
                        <div>
                            <p class="job-meta">
                                Posted by: ${
                                  job.postedBy ? job.postedBy.name : "N/A"
                                } on ${new Date(
            job.postedAt
          ).toLocaleDateString()}
                            </p>
                            <div class="job-actions">
                                <button class="delete-btn" data-id="${
                                  job._id
                                }">Delete</button>
                            </div>
                        </div>
                    `;
          jobsGrid.appendChild(card);
        });
        renderJobsPagination(data.currentPage, data.totalPages);
        addJobDeleteListeners();
      } else {
        jobsGrid.innerHTML = "<p>No jobs found.</p>";
      }
    } catch (error) {
      console.error("Error loading jobs:", error);
      jobsGrid.innerHTML = "<p>Error loading jobs.</p>";
    }
  }

  // --- Pagination Renderer ---
  function renderJobsPagination(currentPage, totalPages) {
    const paginationContainer = document.getElementById(
      "jobsPaginationControls"
    );
    if (!paginationContainer) return;
    paginationContainer.innerHTML = "";
    if (totalPages <= 1) return;

    const prevButton = document.createElement("button");
    prevButton.innerText = "Previous";
    prevButton.disabled = currentPage === 1;
    prevButton.addEventListener("click", () => loadJobs(currentPage - 1));
    paginationContainer.appendChild(prevButton);

    const pageInfo = document.createElement("span");
    pageInfo.innerText = `Page ${currentPage} of ${totalPages}`;
    paginationContainer.appendChild(pageInfo);

    const nextButton = document.createElement("button");
    nextButton.innerText = "Next";
    nextButton.disabled = currentPage === totalPages;
    nextButton.addEventListener("click", () => loadJobs(currentPage + 1));
    paginationContainer.appendChild(nextButton);
  }

  // --- Action Listener Setters ---
  function addUserDeleteListeners() {
    document.querySelectorAll("#usersTable .delete-btn").forEach((button) => {
      // To prevent adding multiple listeners, we replace the button with a clone
      const newButton = button.cloneNode(true);
      button.parentNode.replaceChild(newButton, button);

      newButton.addEventListener("click", async (e) => {
        const userId = e.target.dataset.id;
        if (confirm("Are you sure you want to delete this user?")) {
          try {
            await fetchAdminData(`/admin/users/${userId}`, {
              method: "DELETE",
            });
            loadUsers(); // Refresh the list
          } catch (error) {
            console.error("Error deleting user:", error);
            alert("Failed to delete user.");
          }
        }
      });
    });
  }

  function addJobDeleteListeners() {
    document
      .querySelectorAll("#jobsGridContainer .delete-btn")
      .forEach((button) => {
        // Replace with clone to avoid multiple listeners
        const newButton = button.cloneNode(true);
        button.parentNode.replaceChild(newButton, button);

        newButton.addEventListener("click", async (e) => {
          const jobId = e.target.dataset.id;
          if (
            confirm(
              "Are you sure you want to delete this job? This will also delete all applications for it."
            )
          ) {
            try {
              await fetchAdminData(`/admin/jobs/${jobId}`, {
                method: "DELETE",
              });
              loadJobs(currentJobsPage); // Refresh the current page
            } catch (error) {
              console.error("Error deleting job:", error);
              alert("Failed to delete job.");
            }
          }
        });
      });
  }

  // --- Initial Load ---
  loadDashboardStats();
});
