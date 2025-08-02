// public/js/dashboard.js
document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("token");

  if (!token) {
    alert("Please login to access your dashboard.");
    window.location.href = "/login";
    return;
  }

  const sectionTitle = document.getElementById("sectionTitle");
  const navLinks = document.querySelectorAll(".sidebar-nav a");

  const availableJobsSection = document.getElementById("availableJobsSection");
  const myApplicationsSection = document.getElementById(
    "myApplicationsSection"
  );
  const profileSection = document.getElementById("profileSection");

  // Function to show a specific section and hide others
  const showSection = (sectionElement, titleText) => {
    // Hide all sections
    availableJobsSection.classList.add("hidden");
    myApplicationsSection.classList.add("hidden");
    profileSection.classList.add("hidden");

    // Show the target section
    sectionElement.classList.remove("hidden");
    sectionTitle.innerText = titleText;
  };

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
    showSection(availableJobsSection, "Available Jobs");
    loadJobs();
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
    loadProfile(); // This will now load user profile and resume info
    setActiveLink(event.currentTarget);
  });

  // Initial load: Default to showing the "Browse Jobs" section
  document.getElementById("viewJobsBtn").click();
});

async function loadJobs() {
  const container = document.getElementById("jobsList");
  container.innerHTML = `<p>Loading available jobs...</p>`;

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
        container.innerHTML = "";
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
          container.appendChild(jobCard);
        });
        addJobActionListeners();
      } else {
        container.innerHTML =
          "<p>No jobs available at the moment. Please check back later!</p>";
      }
    } else {
      container.innerHTML = `<p>Error: ${
        data.message || "Failed to load jobs."
      }</p>`;
      alert("Error: " + (data.message || "Failed to load available jobs."));
    }
  } catch (error) {
    console.error("Error fetching jobs:", error);
    container.innerHTML = `<p>An error occurred while fetching jobs.</p>`;
    alert("An error occurred while fetching jobs.");
  }
}

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

async function loadApplications() {
  const container = document.getElementById("applicationsList");
  container.innerHTML = `<p>Loading your applications...</p>`;

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
        container.innerHTML = "";
        data.applications.forEach((app) => {
          const applicationCard = document.createElement("div");
          applicationCard.classList.add("job-card");
          applicationCard.innerHTML = `
            <h3>${app.job.title}</h3>
            <p><strong>Company:</strong> ${app.job.company}</p>
            <p><strong>Location:</strong> ${app.job.location}</p>
            <p><strong>Status:</strong> <span style="font-weight: bold; color: ${
              app.status === "Pending"
                ? "#ffc107"
                : app.status === "Reviewed"
                ? "#17a2b8"
                : app.status === "Interviewed"
                ? "#007bff"
                : app.status === "Rejected"
                ? "#dc3545"
                : app.status === "Hired"
                ? "#28a745"
                : "inherit"
            }">${app.status}</span></p>
            <p class="posted-date">Applied on: ${new Date(
              app.appliedAt
            ).toLocaleDateString()}</p>
            <div class="job-actions">
              <button class="view-job-details-btn" data-job-id="${
                app.job._id
              }">View Job Details</button>
            </div>
          `;
          container.appendChild(applicationCard);
        });
        addViewJobDetailsListeners();
      } else {
        container.innerHTML =
          "<p>You haven't submitted any applications yet.</p>";
      }
    } else {
      container.innerHTML = `<p>Error: ${
        data.message || "Failed to load applications."
      }</p>`;
      alert("Error: " + (data.message || "Failed to load your applications."));
    }
  } catch (error) {
    console.error("Error fetching applications:", error);
    container.innerHTML = `<p>An error occurred while fetching your applications.</p>`;
    alert("An error occurred while fetching your applications.");
  }
}

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

async function loadProfile() {
  // Get references to the elements
  const profileNameSpan = document.getElementById("profileName");
  const profileEmailSpan = document.getElementById("profileEmail");
  const currentResumeLink = document.getElementById("currentResumeLink");
  const resumeUploadForm = document.getElementById("resumeUploadForm");
  const resumeFile = document.getElementById("resumeFile");
  const resumeStatusDiv = document.getElementById("resumeStatus");

  // Display a loading message directly on the relevant spans/containers
  profileNameSpan.innerText = "Loading...";
  profileEmailSpan.innerText = "Loading...";
  currentResumeLink.innerText = "Loading...";
  resumeStatusDiv.innerText = ""; // Clear previous status

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
      resumeStatusDiv.innerText = `Error loading profile: ${
        userData.message || "Failed to fetch profile."
      }`;
      resumeStatusDiv.style.color = "red";
      return;
    }
  } catch (error) {
    console.error("Error fetching profile:", error);
    profileNameSpan.innerText = "Error";
    profileEmailSpan.innerText = "Error";
    currentResumeLink.innerText = "Error";
    resumeStatusDiv.innerText = "An error occurred while loading your profile.";
    resumeStatusDiv.style.color = "red";
    return;
  }

  // Attach event listener for resume upload form submission
  // This listener should only be attached ONCE.
  // We'll check if it's already attached to prevent multiple listeners.
  // A simpler way is to ensure loadProfile is called only once, or remove/re-add listener.
  // For now, let's assume it's safe to re-add, but in a larger app, manage listeners carefully.
  // To prevent multiple attachments, you could:
  // 1. Check if the form already has a listener (more complex)
  // 2. Remove the listener before adding it (safer, but requires named function)
  // 3. Only attach it on initial DOMContentLoaded if loadProfile is always called from there.
  // For now, let's just ensure the form is present before adding the listener.
  if (resumeUploadForm && !resumeUploadForm.dataset.listenerAttached) {
    // Check if listener is already attached
    resumeUploadForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      resumeStatusDiv.innerText = "Uploading...";
      resumeStatusDiv.style.color = "orange";

      const file = resumeFile.files[0];
      if (!file) {
        resumeStatusDiv.innerText = "Please select a file to upload.";
        resumeStatusDiv.style.color = "red";
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
          resumeStatusDiv.innerText = data.message;
          resumeStatusDiv.style.color = "green";
          currentResumeLink.innerHTML = `<a href="${data.resumeUrl}" target="_blank" class="text-blue-500 hover:underline">View Current Resume</a>`;
          resumeFile.value = ""; // Clear the file input
        } else {
          resumeStatusDiv.innerText =
            "Upload failed: " + (data.message || "Unknown error.");
          resumeStatusDiv.style.color = "red";
        }
      } catch (error) {
        console.error("Error uploading resume:", error);
        resumeStatusDiv.innerText = "An error occurred during upload.";
        resumeStatusDiv.style.color = "red";
      }
    });
    resumeUploadForm.dataset.listenerAttached = "true"; // Mark listener as attached
  }
}
