// public/js/dashboard.js
document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("token");

  if (!token) {
    alert("Please login to access your dashboard.");
    window.location.href = "/login";
    return;
  }

  // --- DOM Element References ---
  const sectionTitle = document.getElementById("sectionTitle");
  const navLinks = document.querySelectorAll(".sidebar-nav a");

  const availableJobsSection = document.getElementById("availableJobsSection");
  const myApplicationsSection = document.getElementById(
    "myApplicationsSection"
  );
  const profileSection = document.getElementById("profileSection");
  const jobDetailsSection = document.getElementById("jobDetailsSection"); // New: Job Details Section
  const jobDetailsContent = document.getElementById("jobDetailsContent"); // New: Job Details Content

  const jobsListContainer = document.getElementById("jobsList");
  const applicationsListContainer = document.getElementById("applicationsList");
  const profileDetailsContainer = document.getElementById("profileDetails");
  const paginationControlsContainer =
    document.getElementById("paginationControls"); // For Browse Jobs
  const jobsPerPageSelect = document.getElementById("jobsPerPageSelect");
  const totalJobsCountSpan = document.getElementById("totalJobsCount");

  const paginationControlsApplicationsContainer = document.getElementById(
    "paginationControlsApplications"
  ); // For My Applications
  const applicationsPerPageSelect = document.getElementById(
    "applicationsPerPageSelect"
  );
  const totalApplicationsCountSpan = document.getElementById(
    "totalApplicationsCount"
  );
  const backToApplicationsBtn = document.getElementById(
    "backToApplicationsBtn"
  ); // New: Back button

  // Filter input references
  const searchInput = document.getElementById("searchInput");
  const locationInput = document.getElementById("locationInput");
  const jobTypeFilter = document.getElementById("jobTypeFilter");
  const minSalaryInput = document.getElementById("minSalaryInput");
  const maxSalaryInput = document.getElementById("maxSalaryInput");
  const applyFiltersBtn = document.getElementById("applyFiltersBtn");

  // --- Pagination & Filter State Variables ---
  let currentPage = 1; // For Browse Jobs
  let currentJobsPerPage = parseInt(jobsPerPageSelect.value); // Initialize from select value

  let currentApplicationPage = 1; // For My Applications
  let currentApplicationsPerPage = parseInt(applicationsPerPageSelect.value); // Initialize from select value

  // Store current filter values
  let currentSearch = "";
  let currentLocation = "";
  let currentJobType = "All";
  let currentMinSalary = "";
  let currentMaxSalary = "";

  // --- Helper Functions ---

  /**
   * Shows a specific dashboard section and hides others.
   * Updates the main section title.
   * @param {HTMLElement} sectionElement - The section to show.
   * @param {string} titleText - The title to set for the section.
   */
  const showSection = (sectionElement, titleText) => {
    // Hide all sections
    availableJobsSection.classList.add("hidden");
    myApplicationsSection.classList.add("hidden");
    profileSection.classList.add("hidden");
    jobDetailsSection.classList.add("hidden"); // New: Hide Job Details section

    // Show the target section
    sectionElement.classList.remove("hidden");
    sectionTitle.innerText = titleText;
  };

  /**
   * Sets the active class on the clicked sidebar link.
   * @param {HTMLElement} clickedLink - The sidebar link element that was clicked.
   */
  const setActiveLink = (clickedLink) => {
    navLinks.forEach((link) => link.classList.remove("active"));
    clickedLink.classList.add("active");
  };

  // --- Event Listeners for Sidebar Navigation ---

  document.getElementById("logoutBtn").addEventListener("click", () => {
    localStorage.removeItem("token");
    window.location.href = "/";
  });

  document.getElementById("viewJobsBtn").addEventListener("click", (event) => {
    showSection(availableJobsSection, "Available Jobs");
    backToApplicationsBtn.classList.add("hidden"); // Ensure back button is hidden
    currentPage = 1; // Reset to first page when Browse jobs
    // Load jobs with current filter settings
    loadJobs(
      currentPage,
      currentJobsPerPage,
      currentSearch,
      currentLocation,
      currentJobType,
      currentMinSalary,
      currentMaxSalary
    );
    setActiveLink(event.currentTarget);
  });

  document
    .getElementById("myApplicationsBtn")
    .addEventListener("click", (event) => {
      showSection(myApplicationsSection, "My Applications");
      backToApplicationsBtn.classList.add("hidden"); // Ensure back button is hidden
      currentApplicationPage = 1; // Reset to first page when viewing applications
      loadApplications(currentApplicationPage, currentApplicationsPerPage); // Pass pagination parameters
      setActiveLink(event.currentTarget);
    });

  document.getElementById("profileBtn").addEventListener("click", (event) => {
    showSection(profileSection, "My Profile");
    backToApplicationsBtn.classList.add("hidden"); // Ensure back button is hidden
    loadProfile();
    setActiveLink(event.currentTarget);
  });

  // Event listener for "Jobs per page" select dropdown
  jobsPerPageSelect.addEventListener("change", (event) => {
    currentJobsPerPage = parseInt(event.target.value);
    currentPage = 1; // Reset to first page when items per page changes
    loadJobs(
      currentPage,
      currentJobsPerPage,
      currentSearch,
      currentLocation,
      currentJobType,
      currentMinSalary,
      currentMaxSalary
    );
  });

  // Event listener for "Applications per page" select dropdown
  applicationsPerPageSelect.addEventListener("change", (event) => {
    currentApplicationsPerPage = parseInt(event.target.value);
    currentApplicationPage = 1; // Reset to first page when items per page changes
    loadApplications(currentApplicationPage, currentApplicationsPerPage);
  });

  // Event listener for Apply Filters button
  applyFiltersBtn.addEventListener("click", () => {
    currentSearch = searchInput.value.trim();
    currentLocation = locationInput.value.trim();
    currentJobType = jobTypeFilter.value;
    currentMinSalary = minSalaryInput.value.trim();
    currentMaxSalary = maxSalaryInput.value.trim();
    currentPage = 1; // Reset to first page on new filter
    loadJobs(
      currentPage,
      currentJobsPerPage,
      currentSearch,
      currentLocation,
      currentJobType,
      currentMinSalary,
      currentMaxSalary
    );
  });

  // New: Event listener for the "Back to My Applications" button
  if (backToApplicationsBtn) {
    backToApplicationsBtn.addEventListener("click", () => {
      showSection(myApplicationsSection, "My Applications");
      backToApplicationsBtn.classList.add("hidden"); // Hide the button
      loadApplications(currentApplicationPage, currentApplicationsPerPage);
    });
  }

  // --- Initial Load ---
  // Default to showing the "Browse Jobs" section on page load
  document.getElementById("viewJobsBtn").click();

  // --- Function Implementations ---

  /**
   * Fetches and displays all available job listings with pagination and filters.
   * @param {number} page - The current page number to fetch.
   * @param {number} limit - The number of jobs per page.
   * @param {string} search - Keyword for search.
   * @param {string} location - Location filter.
   * @param {string} type - Job type filter.
   * @param {string} minSalary - Minimum salary filter.
   * @param {string} maxSalary - Maximum salary filter.
   */
  async function loadJobs(
    page,
    limit,
    search,
    location,
    type,
    minSalary,
    maxSalary
  ) {
    jobsListContainer.innerHTML = `<p>Loading available jobs...</p>`;
    jobsListContainer.classList.add("jobs-grid");
    applicationsListContainer.classList.remove("jobs-grid"); // Ensure other grid is removed

    // Clear previous pagination controls and total count for jobs section
    paginationControlsContainer.innerHTML = "";
    totalJobsCountSpan.innerText = "Total Jobs: Loading...";

    try {
      // Build query string with all parameters
      const queryParams = new URLSearchParams();
      queryParams.append("page", page);
      queryParams.append("limit", limit);
      if (search) queryParams.append("search", search);
      if (location) queryParams.append("location", location);
      if (type && type !== "All") queryParams.append("type", type);
      if (minSalary) queryParams.append("minSalary", minSalary);
      if (maxSalary) queryParams.append("maxSalary", maxSalary);

      const response = await fetch(`/user/getJobs?${queryParams.toString()}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        if (data.jobs && data.jobs.length > 0) {
          jobsListContainer.innerHTML = ""; // Clear loading message
          data.jobs.forEach((job) => {
            const jobCard = document.createElement("div");
            jobCard.classList.add("job-card");
            jobCard.innerHTML = `
              <h3>${job.title}</h3>
              <p><strong>Company:</strong> ${job.company}</p>
              <p><strong>Location:</strong> ${job.location}</p>
              <p><strong>Type:</strong> ${job.type}</p>
              <p><strong>Salary:</strong> ${
                job.minSalary > 0 || job.maxSalary > 0
                  ? `$${job.minSalary.toLocaleString()} - $${job.maxSalary.toLocaleString()}`
                  : "N/A"
              }</p>
              <p><strong>Description:</strong> ${job.description}</p>
              <p><strong>Requirements:</strong> ${job.requirements}</p>
              <p class="posted-date">Posted on: ${new Date(
                job.postedAt
              ).toLocaleDateString()}</p>
              <div class="job-actions">
                <button class="apply-job-btn" data-job-id="${
                  job._id
                }">Apply Now</button>
              </div>
            `;
            jobsListContainer.appendChild(jobCard);
          });
          addJobActionListeners(); // Attach listeners to newly created buttons
          renderJobsPaginationControls(
            data.currentPage,
            data.totalPages,
            data.totalJobs
          ); // Render pagination controls
          totalJobsCountSpan.innerText = `Total Jobs: ${data.totalJobs}`; // Update total jobs count
        } else {
          jobsListContainer.innerHTML =
            "<p>No jobs available matching your criteria.</p>"; // Updated message
          paginationControlsContainer.innerHTML = ""; // Clear controls if no jobs
          totalJobsCountSpan.innerText = "Total Jobs: 0";
        }
      } else {
        jobsListContainer.innerHTML = `<p>Error: ${
          data.message || "Failed to load jobs."
        }</p>`;
        alert("Error: " + (data.message || "Failed to load available jobs."));
        totalJobsCountSpan.innerText = "Total Jobs: Error";
      }
    } catch (error) {
      console.error("Error fetching jobs:", error);
      jobsListContainer.innerHTML = `<p>An error occurred while fetching jobs.</p>`;
      alert("An error occurred while fetching jobs.");
      totalJobsCountSpan.innerText = "Total Jobs: Error";
    }
  }

  /**
   * Renders the pagination controls for job listings.
   * @param {number} currentPageData - The current active page from API response.
   * @param {number} totalPagesData - The total number of available pages from API response.
   * @param {number} totalJobsData - The total number of jobs from API response.
   */
  function renderJobsPaginationControls(
    currentPageData,
    totalPagesData,
    totalJobsData
  ) {
    paginationControlsContainer.innerHTML = ""; // Clear existing controls

    const prevButton = document.createElement("button");
    prevButton.innerText = "Previous";
    prevButton.disabled = currentPageData === 1;
    prevButton.addEventListener("click", () => {
      currentPage = currentPageData - 1; // Update global currentPage
      loadJobs(
        currentPage,
        currentJobsPerPage,
        currentSearch,
        currentLocation,
        currentJobType,
        currentMinSalary,
        currentMaxSalary
      ); // Pass filters
    });
    paginationControlsContainer.appendChild(prevButton);

    const pageInfo = document.createElement("span");
    pageInfo.innerText = `Page ${currentPageData} of ${totalPagesData}`;
    paginationControlsContainer.appendChild(pageInfo);

    const nextButton = document.createElement("button");
    nextButton.innerText = "Next";
    nextButton.disabled = currentPageData === totalPagesData;
    nextButton.addEventListener("click", () => {
      currentPage = currentPageData + 1; // Update global currentPage
      loadJobs(
        currentPage,
        currentJobsPerPage,
        currentSearch,
        currentLocation,
        currentJobType,
        currentMinSalary,
        currentMaxSalary
      ); // Pass filters
    });
    paginationControlsContainer.appendChild(nextButton);
  }

  /**
   * Attaches event listeners to action buttons on job cards (e.g., Apply Now).
   */
  function addJobActionListeners() {
    document.querySelectorAll(".apply-job-btn").forEach((button) => {
      button.addEventListener("click", async (e) => {
        const jobId = e.target.dataset.jobId;
        const token = localStorage.getItem("token");

        if (!token) {
          alert("You must be logged in to apply for a job.");
          window.location.href = "/login";
          return;
        }

        const confirmApply = confirm(
          "Are you sure you want to apply for this job?"
        );
        if (!confirmApply) {
          return;
        }

        try {
          const response = await fetch("/user/apply-job", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ jobId }),
          });

          const data = await response.json();

          if (response.ok) {
            alert(data.message);
            e.target.disabled = true;
            e.target.innerText = "Applied";
            e.target.classList.remove("apply-job-btn");
            e.target.classList.add("applied-btn");
            // After applying, refresh My Applications list if currently viewed
            if (myApplicationsSection.classList.contains("active")) {
              loadApplications(
                currentApplicationPage,
                currentApplicationsPerPage
              );
            }
          } else {
            alert(
              "Error applying: " + (data.message || "Failed to apply for job.")
            );
          }
        } catch (error) {
          console.error("Error applying for job:", error);
          alert("An error occurred while applying for the job.");
        }
      });
    });
  }

  /**
   * Fetches and displays job applications for the current job seeker with pagination.
   * @param {number} page - The current page number to fetch.
   * @param {number} limit - The number of applications per page.
   */
  async function loadApplications(page, limit) {
    applicationsListContainer.innerHTML = `<p>Loading your applications...</p>`;
    applicationsListContainer.classList.add("jobs-grid"); // Apply grid styling for applications
    jobsListContainer.classList.remove("jobs-grid"); // Ensure other grid is removed
    jobDetailsContent.innerHTML = ""; // Clear content if navigating back from job details

    // Clear pagination controls and total count for applications section
    paginationControlsContainer.innerHTML = ""; // Clear jobs pagination
    totalJobsCountSpan.innerText = ""; // Clear jobs total count
    paginationControlsApplicationsContainer.innerHTML = ""; // Clear previous applications pagination
    totalApplicationsCountSpan.innerText = "Total Applications: Loading...";

    try {
      const response = await fetch(
        `/user/my-applications?page=${page}&limit=${limit}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      const data = await response.json();

      if (response.ok) {
        if (data.applications && data.applications.length > 0) {
          applicationsListContainer.innerHTML = ""; // Clear loading message
          data.applications.forEach((app) => {
            const applicationCard = document.createElement("div");
            applicationCard.classList.add("job-card"); // Reuse job-card styling for consistency
            applicationCard.innerHTML = `
              <h3>${app.job.title}</h3>
              <p><strong>Company:</strong> ${app.job.company}</p>
              <p><strong>Location:</strong> ${app.job.location}</p>
              <p><strong>Status:</strong> <span class="status-${app.status.toLowerCase()}">${
              app.status
            }</span></p>
              <p class="posted-date">Applied on: ${new Date(
                app.appliedAt
              ).toLocaleDateString()}</p>
              <div class="job-actions">
                <button class="view-job-details-btn" data-job-id="${
                  app.job._id
                }">View Job Details</button>
              </div>
            `;
            applicationsListContainer.appendChild(applicationCard);
          });
          addViewJobDetailsListeners(); // Attach listeners for new buttons
          renderApplicationsPaginationControls(
            data.currentPage,
            data.totalPages,
            data.totalApplications
          ); // Render pagination controls
          totalApplicationsCountSpan.innerText = `Total Applications: ${data.totalApplications}`; // Update total applications count
        } else {
          applicationsListContainer.innerHTML =
            "<p>You haven't submitted any applications yet.</p>";
          paginationControlsApplicationsContainer.innerHTML = ""; // Clear controls if no apps
          totalApplicationsCountSpan.innerText = "Total Applications: 0";
        }
      } else {
        applicationsListContainer.innerHTML = `<p>Error: ${
          data.message || "Failed to load applications."
        }</p>`;
        alert(
          "Error: " + (data.message || "Failed to load your applications.")
        );
        totalApplicationsCountSpan.innerText = "Total Applications: Error";
      }
    } catch (error) {
      console.error("Error fetching applications:", error);
      applicationsListContainer.innerHTML = `<p>An error occurred while fetching your applications.</p>`;
      alert("An error occurred while fetching your applications.");
      totalApplicationsCountSpan.innerText = "Total Applications: Error";
    }
  }

  /**
   * Renders the pagination controls for job applications.
   * @param {number} currentPageData - The current active page from API response.
   * @param {number} totalPagesData - The total number of available pages from API response.
   * @param {number} totalApplicationsData - The total number of applications from API response.
   */
  function renderApplicationsPaginationControls(
    currentPageData,
    totalPagesData,
    totalApplicationsData
  ) {
    paginationControlsApplicationsContainer.innerHTML = ""; // Clear existing controls

    const prevButton = document.createElement("button");
    prevButton.innerText = "Previous";
    prevButton.disabled = currentPageData === 1;
    prevButton.addEventListener("click", () => {
      currentApplicationPage = currentPageData - 1; // Update global currentApplicationPage
      loadApplications(currentApplicationPage, currentApplicationsPerPage);
    });
    paginationControlsApplicationsContainer.appendChild(prevButton);

    const pageInfo = document.createElement("span");
    pageInfo.innerText = `Page ${currentPageData} of ${totalPagesData}`;
    paginationControlsApplicationsContainer.appendChild(pageInfo);

    const nextButton = document.createElement("button");
    nextButton.innerText = "Next";
    nextButton.disabled = currentPageData === totalPagesData;
    nextButton.addEventListener("click", () => {
      currentApplicationPage = currentPageData + 1; // Update global currentApplicationPage
      loadApplications(currentApplicationPage, currentApplicationsPerPage);
    });
    paginationControlsApplicationsContainer.appendChild(nextButton);
  }

  /**
   * Attaches event listeners for viewing job details from application cards.
   */
  function addViewJobDetailsListeners() {
    document.querySelectorAll(".view-job-details-btn").forEach((button) => {
      button.addEventListener("click", (e) => {
        const jobId = e.target.dataset.jobId;
        loadJobDetails(jobId);
      });
    });
  }

  /**
   * Loads and displays details for a specific job.
   * @param {string} jobId - The ID of the job to fetch details for.
   */
  async function loadJobDetails(jobId) {
    showSection(jobDetailsSection, "Job Details");
    backToApplicationsBtn.classList.remove("hidden");
    jobDetailsContent.innerHTML = `<p>Loading job details...</p>`;

    try {
      const response = await fetch(`/user/jobs/${jobId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      const data = await response.json();

      if (response.ok && data.job) {
        const job = data.job;
        jobDetailsContent.innerHTML = `
          <div class="job-card">
            <h3>${job.title}</h3>
            <p><strong>Company:</strong> ${job.company}</p>
            <p><strong>Location:</strong> ${job.location}</p>
            <p><strong>Type:</strong> ${job.type}</p>
            <p><strong>Salary:</strong> ${
              job.minSalary > 0 || job.maxSalary > 0
                ? `$${job.minSalary.toLocaleString()} - $${job.maxSalary.toLocaleString()}`
                : "N/A"
            }</p>
            <p><strong>Description:</strong> ${job.description}</p>
            <p><strong>Requirements:</strong> ${job.requirements}</p>
            <p class="posted-date">Posted on: ${new Date(
              job.postedAt
            ).toLocaleDateString()}</p>
          </div>
        `;
      } else {
        jobDetailsContent.innerHTML = `<p>Error: ${
          data.message || "Failed to load job details."
        }</p>`;
        alert("Error: " + (data.message || "Failed to load job details."));
      }
    } catch (error) {
      console.error("Error fetching job details:", error);
      jobDetailsContent.innerHTML = `<p>An error occurred while fetching job details.</p>`;
      alert("An error occurred while fetching job details.");
    }
  }

  /**
   * Loads and displays the job seeker's profile details and resume management.
   */
  async function loadProfile() {
    const profileNameSpan = document.getElementById("profileName");
    const profileEmailSpan = document.getElementById("profileEmail");
    const currentResumeLink = document.getElementById("currentResumeLink");
    const resumeUploadForm = document.getElementById("resumeUploadForm");
    const resumeFile = document.getElementById("resumeFile");
    const resumeStatusDiv = document.getElementById("resumeStatus");

    // Clear previous status messages and show loading indicators
    profileNameSpan.innerText = "Loading...";
    profileEmailSpan.innerText = "Loading...";
    currentResumeLink.innerText = "Loading...";
    if (resumeStatusDiv) resumeStatusDiv.innerText = ""; // Ensure div exists

    // Remove grid classes from other containers when profile is loaded
    jobsListContainer.classList.remove("jobs-grid");
    applicationsListContainer.classList.remove("jobs-grid");
    paginationControlsContainer.innerHTML = ""; // Hide pagination for profile section
    totalJobsCountSpan.innerText = ""; // Clear total jobs count for this section
    paginationControlsApplicationsContainer.innerHTML = ""; // Hide applications pagination
    totalApplicationsCountSpan.innerText = ""; // Clear applications total count
    jobDetailsContent.innerHTML = ""; // Clear job details content

    try {
      // Fetch user profile data
      const userResponse = await fetch("/user/profile", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const userData = await userResponse.json();

      if (userResponse.ok && userData.user) {
        profileNameSpan.innerText = userData.user.name;
        profileEmailSpan.innerText = userData.user.email;

        if (userData.user.resumeUrl) {
          currentResumeLink.innerHTML = `<a href="${userData.user.resumeUrl}" target="_blank" class="text-blue-500 hover:underline">View Current Resume</a>`;
        } else {
          currentResumeLink.innerText = "No resume uploaded yet.";
        }
      } else {
        profileNameSpan.innerText = "Error";
        profileEmailSpan.innerText = "Error";
        currentResumeLink.innerText = "Error";
        if (resumeStatusDiv) {
          resumeStatusDiv.innerText = `Error loading profile: ${
            userData.message || "Failed to fetch profile."
          }`;
          resumeStatusDiv.style.color = "red";
        }
        return;
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      profileNameSpan.innerText = "Error";
      profileEmailSpan.innerText = "Error";
      currentResumeLink.innerText = "Error";
      if (resumeStatusDiv) {
        resumeStatusDiv.innerText =
          "An error occurred while loading your profile.";
        resumeStatusDiv.style.color = "red";
      }
      return;
    }

    // Attach event listener for resume upload form submission (only once)
    if (resumeUploadForm && !resumeUploadForm.dataset.listenerAttached) {
      resumeUploadForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        if (resumeStatusDiv) {
          resumeStatusDiv.innerText = "Uploading...";
          resumeStatusDiv.style.color = "orange";
        }

        const file = resumeFile.files[0];
        if (!file) {
          if (resumeStatusDiv) {
            resumeStatusDiv.innerText = "Please select a file to upload.";
            resumeStatusDiv.style.color = "red";
          }
          return;
        }

        const formData = new FormData();
        formData.append("resume", file); // 'resume' must match the field name in multer setup

        try {
          const response = await fetch("/user/upload-resume", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
              // Do NOT set Content-Type for FormData, browser sets it automatically
            },
            body: formData,
          });

          const data = await response.json();

          if (response.ok) {
            if (resumeStatusDiv) {
              resumeStatusDiv.innerText = data.message;
              resumeStatusDiv.style.color = "green";
            }
            currentResumeLink.innerHTML = `<a href="${data.resumeUrl}" target="_blank" class="text-blue-500 hover:underline">View Current Resume</a>`;
            resumeFile.value = ""; // Clear the file input
          } else {
            if (resumeStatusDiv) {
              resumeStatusDiv.innerText =
                "Upload failed: " + (data.message || "Unknown error.");
              resumeStatusDiv.style.color = "red";
            }
          }
        } catch (error) {
          console.error("Error uploading resume:", error);
          if (resumeStatusDiv) {
            resumeStatusDiv.innerText = "An error occurred during upload.";
            resumeStatusDiv.style.color = "red";
          }
        }
      });
      resumeUploadForm.dataset.listenerAttached = "true"; // Mark listener as attached
    }
  }
}); // End of DOMContentLoaded
