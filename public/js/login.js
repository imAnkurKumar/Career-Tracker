document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  try {
    const response = await fetch("/user/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        password,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      const token = data.token;
      localStorage.setItem("token", token);
      alert("Login successful: " + data.message);
      window.location.href = data.redirect || "/views/dashboard.html";
    } else {
      alert("Login failed: " + (data.message || "Something went wrong"));
    }
  } catch (err) {
    alert("An error occurred: " + err.message);
  }
});
