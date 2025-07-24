document.getElementById("signupForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  if (!name || !email || !password) {
    alert("Please fill in all fields.");
    return;
  }

  try {
    const response = await fetch("http://localhost:4000/user/signUp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: name,
        email,
        password,
      }),
    });

    const data = await response.json();

    if (response.status === 201) {
      alert("Sign-up successful: " + data.message);
      window.location.href = "../views/login.html";
    } else {
      alert("Error: " + data.message);
    }
  } catch (err) {
    alert("An error occurred: " + err.message);
  }
});
