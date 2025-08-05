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
  const recruiterProfileDetails = document.getElementById(
    "recruiterProfileDetails"
  );

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
        jobListingsContainer.classList.remove("hidden"); // Show job listings
        applicantsListContainer.classList.add("hidden"); // Hide applicants container
        backButton.classList.add("hidden"); // Hide back button
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
    const company = document.getElementById("companyName").value.trim();
    const location = document.getElementById("jobLocation").value.trim();
    const description = document.getElementById("jobDescription").value.trim();
    const requirements = document
      .getElementById("jobRequirements")
      .value.trim();
    const minSalary = document.getElementById("minJobSalary").value.trim();
    const maxSalary = document.getElementById("maxJobSalary").value.trim();
    const type = document.getElementById("jobType").value;

    if (!title || !company || !location || !description || !requirements) {
      alert("Please fill in all required fields.");
      return;
    }

    if (
      minSalary &&
      maxSalary &&
      parseFloat(minSalary) > parseFloat(maxSalary)
    ) {
      alert("Minimum salary cannot be greater than maximum salary.");
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
          minSalary: minSalary ? parseFloat(minSalary) : 0,
          maxSalary: maxSalary ? parseFloat(maxSalary) : 0,
          type,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert(data.message);
        document.getElementById("postJobForm").reset();
        document.getElementById("myPostedJobsBtn").click();
      } else {
        alert("Error: " + (data.message || "Failed to post job."));
      }
    } catch (error) {
      console.error("An error occurred while posting the job:", error);
      alert("An error occurred while posting the job.");
    }
  }

  /**
   * Fetches and displays jobs posted by the current recruiter.
   */
  async function loadMyPostedJobs() {
    jobListingsContainer.classList.remove("hidden");
    applicantsListContainer.classList.add("hidden");
    backButton.classList.add("hidden");

    jobListingsContainer.classList.add("jobs-grid");
    applicantsListContainer.classList.remove("applicants-grid");

    jobListingsContainer.innerHTML = `<p>Fetching your posted jobs...</p>`;

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
          jobListingsContainer.innerHTML = "";
          data.jobs.forEach((job) => {
            const jobCard = document.createElement("div");
            jobCard.classList.add("job-card");
            jobCard.innerHTML = `
              <h3>${job.title}</h3>
              <div class="job-meta">
                <span>🏢 ${job.company}</span>
                <span>📍 ${job.location}</span>
                <span>💼 ${job.type}</span>
                <span>💲${
                  job.minSalary > 0 || job.maxSalary > 0
                    ? `$${job.minSalary.toLocaleString()} - $${job.maxSalary.toLocaleString()}`
                    : "N/A"
                }</span>
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
          addJobActionListeners();
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
      console.error("An error occurred while fetching your jobs:", error);
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
        currentViewedJobId = jobId;
        currentViewedJobTitle = jobTitle;
        loadApplicantsForJob(jobId, jobTitle);
      });
    });

    document.querySelectorAll(".edit-job-btn").forEach((button) => {
      button.addEventListener("click", (e) => {
        const jobId = e.target.dataset.jobId;
        loadEditJobForm(jobId);
      });
    });

    document.querySelectorAll(".delete-job-btn").forEach((button) => {
      button.addEventListener("click", async (e) => {
        const jobId = e.target.dataset.jobId;
        if (
          confirm(
            `Are you sure you want to delete this job? This action cannot be undone.`
          )
        ) {
          try {
            const response = await fetch(`/recruiter/jobs/${jobId}`, {
              method: "DELETE",
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
            });
            const data = await response.json();
            if (response.ok) {
              alert(data.message);
              loadMyPostedJobs();
            } else {
              alert(
                "Error deleting job: " + (data.message || "Unknown error.")
              );
            }
          } catch (error) {
            console.error("Error deleting job:", error);
            alert("An error occurred while deleting the job.");
          }
        }
      });
    });
  }

  /**
   * Loads and displays the edit job form for a specific job.
   * @param {string} jobId - The ID of the job to edit.
   */
  async function loadEditJobForm(jobId) {
    try {
      const response = await fetch(`/recruiter/my-jobs/${jobId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const data = await response.json();

      if (!response.ok || !data.job) {
        alert(
          "Error fetching job details for editing: " +
            (data.message || "Job not found.")
        );
        return;
      }

      const job = data.job;

      showSection(postJobSection, `Edit Job: ${job.title}`);
      setActiveLink(document.getElementById("postJobBtn"));

      document.getElementById("jobTitle").value = job.title;
      document.getElementById("companyName").value = job.company;
      document.getElementById("jobLocation").value = job.location;
      document.getElementById("jobDescription").value = job.description;
      document.getElementById("jobRequirements").value = job.requirements;
      document.getElementById("minJobSalary").value =
        job.minSalary > 0 ? job.minSalary : "";
      document.getElementById("maxJobSalary").value =
        job.maxSalary > 0 ? job.maxSalary : "";
      document.getElementById("jobType").value = job.type;

      const postJobForm = document.getElementById("postJobForm");
      const submitButton = postJobForm.querySelector('button[type="submit"]');
      submitButton.innerText = "Save Changes";
      submitButton.dataset.jobId = jobId;

      postJobForm.removeEventListener("submit", handlePostJob);
      postJobForm.addEventListener("submit", handleUpdateJob);
    } catch (error) {
      console.error("Error loading edit job form:", error);
      alert("An error occurred while loading the edit form.");
    }
  }

  /**
   * Handles the submission of the updated job form.
   * This function is dynamically attached when editing a job.
   * @param {Event} event - The form submission event.
   */
  async function handleUpdateJob(event) {
    event.preventDefault();

    const jobId = event.submitter.dataset.jobId;

    const title = document.getElementById("jobTitle").value.trim();
    const company = document.getElementById("companyName").value.trim();
    const location = document.getElementById("jobLocation").value.trim();
    const description = document.getElementById("jobDescription").value.trim();
    const requirements = document
      .getElementById("jobRequirements")
      .value.trim();
    const minSalary = document.getElementById("minJobSalary").value.trim();
    const maxSalary = document.getElementById("maxJobSalary").value.trim();
    const type = document.getElementById("jobType").value;

    if (!title || !company || !location || !description || !requirements) {
      alert("Please fill in all required fields.");
      return;
    }

    if (
      minSalary &&
      maxSalary &&
      parseFloat(minSalary) > parseFloat(maxSalary)
    ) {
      alert("Minimum salary cannot be greater than maximum salary.");
      return;
    }

    try {
      const response = await fetch(`/recruiter/jobs/${jobId}`, {
        method: "PATCH",
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
          minSalary: minSalary ? parseFloat(minSalary) : 0,
          maxSalary: maxSalary ? parseFloat(maxSalary) : 0,
          type,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert(data.message);
        document.getElementById("postJobForm").reset();
        const submitButton = document
          .getElementById("postJobForm")
          .querySelector('button[type="submit"]');
        submitButton.innerText = "🚀 Post Job";
        delete submitButton.dataset.jobId;

        document
          .getElementById("postJobForm")
          .removeEventListener("submit", handleUpdateJob);
        document
          .getElementById("postJobForm")
          .addEventListener("submit", handlePostJob);

        document.getElementById("myPostedJobsBtn").click();
      } else {
        alert("Error updating job: " + (data.message || "Unknown error."));
      }
    } catch (error) {
      console.error("Error updating job:", error);
      alert("An error occurred while updating the job.");
    }
  }

  /**
   * Fetches and displays applicants for a specific job.
   * @param {string} jobId - The ID of the job to fetch applicants for.
   * @param {string} jobTitle - The title of the job for display purposes.
   */
  async function loadApplicantsForJob(jobId, jobTitle) {
    jobListingsContainer.classList.add("hidden");
    applicantsListContainer.classList.remove("hidden");
    backButton.classList.remove("hidden");

    jobListingsContainer.classList.remove("jobs-grid");
    applicantsListContainer.classList.add("applicants-grid");

    sectionTitle.innerText = `Applicants for "${jobTitle}"`;
    applicantsListContainer.innerHTML = `<p>Loading applicants...</p>`;

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
          applicantsListContainer.innerHTML = "";
          data.applicants.forEach((app) => {
            const applicantCard = document.createElement("div");
            applicantCard.classList.add("applicant-card");
            applicantCard.dataset.jobId = jobId;
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
          addApplicantActionListeners();
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
      console.error("An error occurred while fetching applicants:", error);
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
        const currentStatus = e.target.dataset.currentStatus;
        const parentJobId = e.target.closest(".applicant-card").dataset.jobId;

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
            loadApplicantsForJob(parentJobId, currentViewedJobTitle);
          } else {
            alert(
              "Error updating status: " +
                (data.message || "Failed to update status.")
            );
          }
        } catch (error) {
          console.error("An error occurred while updating the status:", error);
          alert("An error occurred while updating the status.");
        }
      });
    });
  }

  /**
   * Loads and displays the recruiter's profile details.
   */
  async function loadRecruiterProfile() {
    recruiterProfileDetails.innerHTML = `<p>Loading recruiter profile details...</p>`;

    try {
      const response = await fetch("/recruiter/profile", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        const user = data.user;
        recruiterProfileDetails.innerHTML = `
          <div class="profile-card">
            <h3>Recruiter Information</h3>
            <p><strong>Company Name:</strong> ${user.name}</p>
            <p><strong>Email:</strong> ${user.email}</p>
          </div>
        `;
      } else {
        recruiterProfileDetails.innerHTML = `<p>Error: ${
          data.message || "Failed to load profile."
        }</p>`;
        alert(
          "Error: " + (data.message || "Failed to load recruiter profile.")
        );
      }
    } catch (error) {
      console.error(
        "An error occurred while fetching recruiter profile:",
        error
      );
      recruiterProfileDetails.innerHTML = `<p>An error occurred while fetching recruiter profile.</p>`;
      alert("An error occurred while fetching recruiter profile.");
    }
  }
});
