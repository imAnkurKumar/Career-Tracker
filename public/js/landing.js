document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("token");

  if (token) {
    window.location.href = "/dashboard";
    return;
  }

  const navSignUpBtn = document.getElementById("navSignUpBtn");
  const navLoginBtn = document.getElementById("navLoginBtn");
  const heroSignUpBtn = document.getElementById("heroSignUpBtn");
  const heroLoginBtn = document.getElementById("heroLoginBtn");

  if (navSignUpBtn) {
    navSignUpBtn.addEventListener("click", () => {
      window.location.href = "/signUp";
    });
  }

  if (heroSignUpBtn) {
    heroSignUpBtn.addEventListener("click", () => {
      window.location.href = "/signUp";
    });
  }

  if (navLoginBtn) {
    navLoginBtn.addEventListener("click", () => {
      window.location.href = "/login";
    });
  }

  if (heroLoginBtn) {
    heroLoginBtn.addEventListener("click", () => {
      window.location.href = "/login";
    });
  }
});
