document
  .getElementById("adminSignUpForm")
  .addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {
      const response = await fetch("/admin/signUp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await response.json();
      if (response.ok) {
        alert("Admin account created successfully. Please login.");
        window.location.href = "/admin/login";
      } else {
        alert(`Error: ${data.message}`);
      }
    } catch (error) {
      alert("An error occurred during sign up.");
    }
  });
