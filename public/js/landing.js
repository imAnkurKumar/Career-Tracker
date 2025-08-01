document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("token");

  //   if (token) {
  //     window.location.href = "/dashboard";
  //     return;
  //   }

  // Navbar buttons
  document.getElementById("jobSeekerBtnNav")?.addEventListener("click", () => {
    window.location.href = "/signUp";
  });

  document.getElementById("recruiterBtnNav")?.addEventListener("click", () => {
    window.location.href = "/recruiter/signUp";
  });

  // Hero buttons
  document.getElementById("jobSeekerBtn")?.addEventListener("click", () => {
    window.location.href = "/signUp";
  });

  document.getElementById("recruiterBtn")?.addEventListener("click", () => {
    window.location.href = "/recruiter/signUp";
  });
});
