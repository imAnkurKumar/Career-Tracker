// public/js/recruiterDashboard.js
document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("token");

  if (!token) {
    alert("Please login to access your recruiter dashboard.");
    window.location.href = "/recruiter/login";
    return;
  }

  const sectionTitle = document.getElementById("sectionTitle");
  const navLinks = document.querySelectorAll(".sidebar-nav a");

  const postJobSection = document.getElementById("postJobSection");
  const myPostedJobsSection = document.getElementById("myPostedJobsSection");
  const recruiterProfileSection = document.getElementById(
    "recruiterProfileSection"
  );

  // Function to show a specific section and hide others
  const showSection = (sectionElement, titleText) => {
    // Hide all sections
    postJobSection.classList.add("hidden");
    myPostedJobsSection.classList.add("hidden");
    recruiterProfileSection.classList.add("hidden");

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
      loadMyPostedJobs(); // Call the function to load jobs
      setActiveLink(event.currentTarget);
    });

  document
    .getElementById("recruiterProfileBtn")
    .addEventListener("click", (event) => {
      showSection(recruiterProfileSection, "My Profile");
      loadRecruiterProfile(); // Call the function to load profile
      setActiveLink(event.currentTarget);
    });

  // Attach event listener for the post job form (now that it's always in HTML)
  document
    .getElementById("postJobForm")
    .addEventListener("submit", handlePostJob);

  // Initial load: Default to showing the "Post New Job" form
  document.getElementById("postJobBtn").click();
});

async function handlePostJob(event) {
  event.preventDefault();

  const title = document.getElementById("jobTitle").value;
  const company = document.getElementById("companyName").value;
  const location = document.getElementById("jobLocation").value;
  const description = document.getElementById("jobDescription").value;
  const requirements = document.getElementById("jobRequirements").value;
  const salary = document.getElementById("jobSalary").value;
  const type = document.getElementById("jobType").value;

  // Basic validation
  if (!title || !company || !location || !description || !requirements) {
    alert(
      "Please fill in all required fields (Title, Company, Location, Description, Requirements)."
    );
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
      // Clear the form after successful submission
      document.getElementById("postJobForm").reset();
      // Optionally, switch to "My Posted Jobs" view after posting
      document.getElementById("myPostedJobsBtn").click();
    } else {
      alert("Error: " + (data.message || "Failed to post job."));
    }
  } catch (error) {
    console.error("Error posting job:", error);
    alert("An error occurred while posting the job.");
  }
}

async function loadMyPostedJobs() {
  const container = document.getElementById("postedJobsList");
  container.innerHTML = `<p>Fetching your posted jobs...</p>`;

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
        container.innerHTML = ""; // Clear loading message
        data.jobs.forEach((job) => {
          const jobCard = document.createElement("div");
          jobCard.classList.add("job-card"); // Add a class for styling
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
              <button class="view-applicants-btn" data-job-id="${
                job._id
              }">View Applicants</button>
              <button class="edit-job-btn" data-job-id="${
                job._id
              }">Edit</button>
              <button class="delete-job-btn" data-job-id="${
                job._id
              }">Delete</button>
            </div>
          `;
          container.appendChild(jobCard);
        });
        // Add event listeners for new buttons (View Applicants, Edit, Delete)
        addJobActionListeners();
      } else {
        container.innerHTML = "<p>You haven't posted any jobs yet.</p>";
      }
    } else {
      container.innerHTML = `<p>Error: ${
        data.message || "Failed to load jobs."
      }</p>`;
      alert("Error: " + (data.message || "Failed to load your posted jobs."));
    }
  } catch (error) {
    console.error("Error fetching posted jobs:", error);
    container.innerHTML = `<p>An error occurred while fetching your jobs.</p>`;
    alert("An error occurred while fetching your jobs.");
  }
}

function addJobActionListeners() {
  document.querySelectorAll(".view-applicants-btn").forEach((button) => {
    button.addEventListener("click", (e) => {
      const jobId = e.target.dataset.jobId;
      alert(`View Applicants for Job ID: ${jobId} (Feature to be implemented)`);
      // TODO: Implement logic to load applicants for this job
    });
  });

  document.querySelectorAll(".edit-job-btn").forEach((button) => {
    button.addEventListener("click", (e) => {
      const jobId = e.target.dataset.jobId;
      alert(`Edit Job ID: ${jobId} (Feature to be implemented)`);
      // TODO: Implement logic to edit this job
    });
  });

  document.querySelectorAll(".delete-job-btn").forEach((button) => {
    button.addEventListener("click", (e) => {
      const jobId = e.target.dataset.jobId;
      if (confirm(`Are you sure you want to delete this job (ID: ${jobId})?`)) {
        alert(`Deleting Job ID: ${jobId} (Feature to be implemented)`);
        // TODO: Implement logic to delete this job
      }
    });
  });
}

function loadRecruiterProfile() {
  const container = document.getElementById("recruiterProfileDetails");
  container.innerHTML = `<p>Loading recruiter profile...</p>`;
  // TODO: Implement fetching logic here
}
