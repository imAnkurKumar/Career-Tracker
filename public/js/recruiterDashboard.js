// public/js/recruiterDashboard.js
document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("token");

  // --- Initial Authentication Check ---
  if (!token) {
    alert("Please login to access your recruiter dashboard.");
    window.location.href = "/recruiter/login";
    return;
  }

  // --- DOM Element References ---
  const sectionTitle = document.getElementById("sectionTitle");
  const navLinks = document.querySelectorAll(".sidebar-nav a");

  const postJobSection = document.getElementById("postJobSection");
  const myPostedJobsSection = document.getElementById("myPostedJobsSection");
  const recruiterProfileSection = document.getElementById(
    "recruiterProfileSection"
  );

  const jobListingsContainer = document.getElementById("jobListingsContainer");
  const applicantsListContainer = document.getElementById(
    "applicantsListContainer"
  );
  const backButton = document.getElementById("backToJobsBtn");

  // Store the current job ID and title when viewing applicants
  // This helps when updating status and needing to reload the specific applicant list
  let currentViewedJobId = null;
  let currentViewedJobTitle = null;

  // --- Helper Functions ---

  /**
   * Shows a specific dashboard section and hides others.
   * Updates the main section title.
   * @param {HTMLElement} sectionElement - The section to show.
   * @param {string} titleText - The title to set for the section.
   */
  const showSection = (sectionElement, titleText) => {
    // Hide all main sections
    postJobSection.classList.add("hidden");
    myPostedJobsSection.classList.add("hidden");
    recruiterProfileSection.classList.add("hidden");

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

  document
    .getElementById("recruiterLogoutBtn")
    .addEventListener("click", () => {
      localStorage.removeItem("token");
      window.location.href = "/recruiter/login";
    });

  document.getElementById("postJobBtn").addEventListener("click", (event) => {
    showSection(postJobSection, "Post New Job");
    setActiveLink(event.currentTarget);
  });

  document
    .getElementById("myPostedJobsBtn")
    .addEventListener("click", (event) => {
      showSection(myPostedJobsSection, "My Posted Jobs");
      loadMyPostedJobs(); // Load jobs when this section is active
      setActiveLink(event.currentTarget);
    });

  document
    .getElementById("recruiterProfileBtn")
    .addEventListener("click", (event) => {
      showSection(recruiterProfileSection, "My Profile");
      loadRecruiterProfile(); // Load profile when this section is active
      setActiveLink(event.currentTarget);
    });

  // Attach event listener for the post job form (it's always in the DOM now)
  document
    .getElementById("postJobForm")
    .addEventListener("submit", handlePostJob);

  // Attach event listener for the back button (only once, as it's a persistent element)
  // Ensure backButton exists before attaching listener
  if (backButton) {
    if (!backButton.dataset.listenerAttached) {
      backButton.addEventListener("click", () => {
        console.log("Back button clicked. Returning to My Posted Jobs.");
        jobListingsContainer.style.display = "block"; // Show job listings
        applicantsListContainer.style.display = "none"; // Hide applicants container
        backButton.style.display = "none"; // Hide back button
        sectionTitle.innerText = "My Posted Jobs"; // Reset title on back
        loadMyPostedJobs(); // Reload the job list to ensure counts are updated if needed
      });
      backButton.dataset.listenerAttached = "true"; // Mark listener as attached
    }
  }

  // --- Initial Load ---
  // Default to showing the "Post New Job" form on page load
  document.getElementById("postJobBtn").click();

  // --- Function Implementations ---

  /**
   * Handles the submission of the "Post New Job" form.
   * @param {Event} event - The form submission event.
   */
  async function handlePostJob(event) {
    event.preventDefault();

    const title = document.getElementById("jobTitle").value.trim();
    const company = document.getElementById("companyName").value.trim(); // Corrected typo and added trim
    const location = document.getElementById("jobLocation").value.trim();
    const description = document.getElementById("jobDescription").value.trim();
    const requirements = document
      .getElementById("jobRequirements")
      .value.trim();
    const salary = document.getElementById("jobSalary").value.trim();
    const type = document.getElementById("jobType").value;

    // Basic validation (now redundant with HTML 'required' but good fallback)
    if (!title || !company || !location || !description || !requirements) {
      alert("Please fill in all required fields.");
      return;
    }

    try {
      const response = await fetch("/recruiter/jobs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          title,
          company,
          location,
          description,
          requirements,
          salary,
          type,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert(data.message);
        document.getElementById("postJobForm").reset(); // Clear form
        document.getElementById("myPostedJobsBtn").click(); // Navigate to "My Posted Jobs"
      } else {
        alert("Error: " + (data.message || "Failed to post job."));
      }
    } catch (error) {
      console.error("An error occurred while posting the job:", error); // More specific console log
      alert("An error occurred while posting the job.");
    }
  }

  /**
   * Fetches and displays jobs posted by the current recruiter.
   */
  async function loadMyPostedJobs() {
    // Show job listings container, hide applicants container and back button
    jobListingsContainer.style.display = "block";
    applicantsListContainer.style.display = "none";
    backButton.style.display = "none"; // Ensure back button is hidden here

    // Add the jobs-grid class to the container
    jobListingsContainer.classList.add("jobs-grid");
    // Remove applicants-grid class if it was previously added
    applicantsListContainer.classList.remove("applicants-grid");

    jobListingsContainer.innerHTML = `<p>Fetching your posted jobs...</p>`; // Show loading message

    try {
      const response = await fetch("/recruiter/my-jobs", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        if (data.jobs && data.jobs.length > 0) {
          jobListingsContainer.innerHTML = ""; // Clear loading message
          data.jobs.forEach((job) => {
            const jobCard = document.createElement("div");
            jobCard.classList.add("job-card");
            jobCard.innerHTML = `
              <h3>${job.title}</h3>
              <div class="job-meta">
                <span>🏢 ${job.company}</span>
                <span>📍 ${job.location}</span>
                <span>💼 ${job.type}</span>
                <span>💲${job.salary || "N/A"}</span>
              </div>
              <p><strong>Description:</strong> ${job.description}</p>
              <p><strong>Requirements:</strong> ${job.requirements}</p>
              <div class="posted-date">Posted on: ${new Date(
                job.postedAt
              ).toLocaleDateString()}</div>
              <div class="job-actions">
                <button class="view-applicants-btn" data-job-id="${
                  job._id
                }" data-job-title="${job.title}">👥 Applicants (${
              job.applicants.length
            })</button>
                <button class="edit-job-btn" data-job-id="${
                  job._id
                }">✏️ Edit</button>
                <button class="delete-job-btn" data-job-id="${
                  job._id
                }">🗑️ Delete</button>
              </div>
            `;
            jobListingsContainer.appendChild(jobCard);
          });
          addJobActionListeners(); // Attach listeners to new job cards
        } else {
          jobListingsContainer.innerHTML = `<div>You haven't posted any jobs yet.</div>`;
        }
      } else {
        jobListingsContainer.innerHTML = `<div>Error: ${
          data.message || "Failed to load jobs."
        }</div>`;
        alert("Error: " + (data.message || "Failed to load your posted jobs."));
      }
    } catch (error) {
      console.error("An error occurred while fetching your jobs:", error); // More specific console log
      jobListingsContainer.innerHTML = `<div>An error occurred while fetching your jobs.</div>`;
      alert("An error occurred while fetching your jobs.");
    }
  }

  /**
   * Attaches event listeners to action buttons on job cards.
   */
  function addJobActionListeners() {
    document.querySelectorAll(".view-applicants-btn").forEach((button) => {
      button.addEventListener("click", (e) => {
        const jobId = e.target.dataset.jobId;
        const jobTitle = e.target.dataset.jobTitle;
        // Store current job details for potential re-load after status update
        currentViewedJobId = jobId;
        currentViewedJobTitle = jobTitle;
        loadApplicantsForJob(jobId, jobTitle);
      });
    });

    document.querySelectorAll(".edit-job-btn").forEach((button) => {
      button.addEventListener("click", (e) => {
        const jobId = e.target.dataset.jobId;
        alert(
          `Edit Job ID: ${button.dataset.jobId} (Feature to be implemented)`
        );
      });
    });

    document.querySelectorAll(".delete-job-btn").forEach((button) => {
      button.addEventListener("click", (e) => {
        const jobId = e.target.dataset.jobId;
        if (confirm(`Are you sure you want to delete this job?`)) {
          alert(
            `Deleting Job ID: ${button.dataset.jobId} (Feature to be implemented)`
          );
        }
      });
    });
  }

  /**
   * Fetches and displays applicants for a specific job.
   * @param {string} jobId - The ID of the job to fetch applicants for.
   * @param {string} jobTitle - The title of the job for display purposes.
   */
  async function loadApplicantsForJob(jobId, jobTitle) {
    // Hide job listings and show applicants container and back button
    jobListingsContainer.style.display = "none";
    applicantsListContainer.style.display = "block";
    backButton.style.display = "block"; // Ensure back button is shown

    // Remove jobs-grid class from jobListingsContainer when hiding it
    jobListingsContainer.classList.remove("jobs-grid");
    // Add applicants-grid class to the applicants container
    applicantsListContainer.classList.add("applicants-grid");

    sectionTitle.innerText = `Applicants for "${jobTitle}"`; // Update main title

    applicantsListContainer.innerHTML = `<p>Loading applicants...</p>`; // Show loading message

    try {
      const response = await fetch(`/recruiter/jobs/${jobId}/applicants`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        if (data.applicants && data.applicants.length > 0) {
          applicantsListContainer.innerHTML = ""; // Clear loading message
          data.applicants.forEach((app) => {
            const applicantCard = document.createElement("div");
            applicantCard.classList.add("applicant-card");
            // Add data-job-id to applicant card for easier reference during status update
            applicantCard.dataset.jobId = jobId; // Set job ID on the applicant card
            applicantCard.innerHTML = `
              <h3>${app.jobSeeker.name}</h3>
              <p><strong>Email:</strong> ${app.jobSeeker.email}</p>
              <p><strong>Application Status:</strong> <span class="status-${app.status.toLowerCase()}">${
              app.status
            }</span></p>
              <div class="applicant-actions">
                ${
                  app.jobSeeker.resumeUrl
                    ? `<a href="${app.jobSeeker.resumeUrl}" target="_blank" class="view-resume-btn">View Resume</a>`
                    : `<span class="no-resume">No Resume Uploaded</span>`
                }
                <button class="update-status-btn" data-application-id="${
                  app._id
                }" data-current-status="${app.status}">Update Status</button>
              </div>
            `;
            applicantsListContainer.appendChild(applicantCard);
          });
          addApplicantActionListeners(); // Attach listeners for applicant actions
        } else {
          applicantsListContainer.innerHTML =
            "<p>No applicants for this job yet.</p>";
        }
      } else {
        applicantsListContainer.innerHTML = `<p>Error: ${
          data.message || "Failed to load applicants."
        }</p>`;
        alert("Error: " + (data.message || "Failed to load applicants."));
      }
    } catch (error) {
      console.error("An error occurred while fetching applicants:", error); // More specific console log
      applicantsListContainer.innerHTML = `<p>An error occurred while fetching applicants.</p>`;
      alert("An error occurred while fetching applicants.");
    }
  }

  /**
   * Attaches event listeners to action buttons on applicant cards.
   */
  function addApplicantActionListeners() {
    document.querySelectorAll(".update-status-btn").forEach((button) => {
      button.addEventListener("click", async (e) => {
        const applicationId = e.target.dataset.applicationId;
        const currentStatus = e.target.dataset.currentStatus; // Corrected: Use dataset.currentStatus
        const parentJobId = e.target.closest(".applicant-card").dataset.jobId; // Get job ID from parent card

        // Prompt for new status
        const newStatus = prompt(
          `Current status: ${currentStatus}\nEnter new status (Pending, Reviewed, Interviewed, Rejected, Hired):`
        );

        if (newStatus === null || newStatus.trim() === "") {
          alert("Status update cancelled.");
          return;
        }

        const validStatuses = [
          "Pending",
          "Reviewed",
          "Interviewed",
          "Rejected",
          "Hired",
        ];
        if (!validStatuses.includes(newStatus)) {
          alert(
            "Invalid status. Please choose from: Pending, Reviewed, Interviewed, Rejected, Hired."
          );
          return;
        }

        try {
          const response = await fetch(
            `/recruiter/applications/${applicationId}/status`,
            {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
              body: JSON.stringify({ status: newStatus }),
            }
          );

          const data = await response.json();

          if (response.ok) {
            alert(data.message);
            // Re-load the specific applicants list to reflect the change
            // Use the globally stored currentViewedJobId and currentViewedJobTitle
            // Or, even better, use parentJobId and currentViewedJobTitle
            loadApplicantsForJob(parentJobId, currentViewedJobTitle); // Use parentJobId for robustness
          } else {
            alert(
              "Error updating status: " +
                (data.message || "Failed to update status.")
            );
          }
        } catch (error) {
          console.error("An error occurred while updating the status:", error); // More specific console log
          alert("An error occurred while updating the status.");
        }
      });
    });
  }

  /**
   * Loads and displays the recruiter's profile details.
   */
  function loadRecruiterProfile() {
    const container = document.getElementById("recruiterProfileDetails");
    container.innerHTML = `<p>Loading recruiter profile details...</p>`;
    // TODO: Implement fetching logic here
  }
}); // End of DOMContentLoaded
