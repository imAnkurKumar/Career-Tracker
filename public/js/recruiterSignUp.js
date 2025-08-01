document
  .getElementById("recruiterSignUpForm")
  .addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = document.getElementById("companyName").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {
      const response = await fetch("/recruiter/signUp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role: "employer" }),
      });

      const data = await response.json();
      if (response.ok) {
        alert("Recruiter account created. Please login.");
        window.location.href = "/recruiter/login";
      } else {
        alert(data.message);
      }
    } catch (err) {
      alert("Error creating recruiter account.");
    }
  });
