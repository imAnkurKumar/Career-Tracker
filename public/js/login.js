document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  try {
    const response = await axios.post("/user/login", {
      email,
      password,
    });

    const token = response.data.token;
    localStorage.setItem("token", token);
    alert("Login successful: " + response.data.message);
    window.location.href = "/views/dashboard.html";
  } catch (err) {
    alert(
      "Login failed: " + (err.response?.data?.message || "Something went wrong")
    );
  }
});
