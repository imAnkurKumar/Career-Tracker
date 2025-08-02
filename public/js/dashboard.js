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

  const jobsListContainer = document.getElementById("jobsList"); // Renamed for clarity
  const applicationsListContainer = document.getElementById("applicationsList"); // Renamed for clarity
  const profileDetailsContainer = document.getElementById("profileDetails"); // Renamed for clarity

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
    loadJobs(); // Call the function to load jobs
    setActiveLink(event.currentTarget);
  });

  document
    .getElementById("myApplicationsBtn")
    .addEventListener("click", (event) => {
      showSection(myApplicationsSection, "My Applications");
      loadApplications(); // This will now fetch and display applications
      setActiveLink(event.currentTarget);
    });

  document.getElementById("profileBtn").addEventListener("click", (event) => {
    showSection(profileSection, "My Profile");
    loadProfile(); // Load profile when this section is active
    setActiveLink(event.currentTarget);
  });

  // --- Initial Load ---
  // Default to showing the "Browse Jobs" section on page load
  document.getElementById("viewJobsBtn").click();

  // --- Function Implementations ---

  /**
   * Fetches and displays all available job listings.
   */
  async function loadJobs() {
    jobsListContainer.innerHTML = `<p>Loading available jobs...</p>`; // Show loading message
    jobsListContainer.classList.add("jobs-grid"); // Apply grid styling
    applicationsListContainer.classList.remove("jobs-grid"); // Ensure other grid is removed

    try {
      const response = await fetch("/user/getJobs", {
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
              <p><strong>Salary:</strong> ${job.salary || "N/A"}</p>
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
        } else {
          jobsListContainer.innerHTML =
            "<p>No jobs available at the moment. Please check back later!</p>";
        }
      } else {
        jobsListContainer.innerHTML = `<p>Error: ${
          data.message || "Failed to load jobs."
        }</p>`;
        alert("Error: " + (data.message || "Failed to load available jobs."));
      }
    } catch (error) {
      console.error("Error fetching jobs:", error);
      jobsListContainer.innerHTML = `<p>An error occurred while fetching jobs.</p>`;
      alert("An error occurred while fetching jobs.");
    }
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
   * Fetches and displays job applications for the current job seeker.
   */
  async function loadApplications() {
    applicationsListContainer.innerHTML = `<p>Loading your applications...</p>`;
    applicationsListContainer.classList.add("jobs-grid"); // Apply grid styling for applications
    jobsListContainer.classList.remove("jobs-grid"); // Ensure other grid is removed

    try {
      const response = await fetch("/user/my-applications", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

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
        } else {
          applicationsListContainer.innerHTML =
            "<p>You haven't submitted any applications yet.</p>";
        }
      } else {
        applicationsListContainer.innerHTML = `<p>Error: ${
          data.message || "Failed to load applications."
        }</p>`;
        alert(
          "Error: " + (data.message || "Failed to load your applications.")
        );
      }
    } catch (error) {
      console.error("Error fetching applications:", error);
      applicationsListContainer.innerHTML = `<p>An error occurred while fetching your applications.</p>`;
      alert("An error occurred while fetching your applications.");
    }
  }

  /**
   * Attaches event listeners for viewing job details from application cards.
   */
  function addViewJobDetailsListeners() {
    document.querySelectorAll(".view-job-details-btn").forEach((button) => {
      button.addEventListener("click", (e) => {
        const jobId = e.target.dataset.jobId;
        alert(
          `Viewing details for Job ID: ${jobId} (Can expand to show full job details in a modal/new section)`
        );
      });
    });
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
