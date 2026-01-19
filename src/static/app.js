let isLoggedIn = false;
let currentUser = "";

document.addEventListener("DOMContentLoaded", () => {
  const userBtn = document.getElementById("user-btn");
  const loginModal = document.getElementById("login-modal");
  const closeModalBtn = document.getElementById("close-modal");
  const loginForm = document.getElementById("login-form");
  const userInfo = document.getElementById("user-info");
  const logoutBtn = document.getElementById("logout-btn");
  const signupContainer = document.getElementById("signup-container");
  const studentSignupContainer = document.getElementById("student-signup-container");
  const adminForm = document.getElementById("admin-form");
  const activitiesList = document.getElementById("activities-list");
  const adminActivitySelect = document.getElementById("admin-activity");
  const adminMessage = document.getElementById("admin-message");

  // User button click
  userBtn.addEventListener("click", () => {
    if (isLoggedIn) {
      // Show logout option
      userInfo.classList.remove("hidden");
      loginModal.classList.add("hidden");
    } else {
      // Show login modal
      loginModal.classList.remove("hidden");
      userInfo.classList.add("hidden");
    }
  });

  // Close modal
  closeModalBtn.addEventListener("click", () => {
    loginModal.classList.add("hidden");
  });

  // Login form submission
  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    const loginMessage = document.getElementById("login-message");

    try {
      const response = await fetch("/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        isLoggedIn = true;
        currentUser = username;
        
        // Update UI
        loginModal.classList.add("hidden");
        userInfo.classList.remove("hidden");
        document.querySelector("#logged-in-user strong").textContent = currentUser;
        
        // Show admin controls
        signupContainer.classList.remove("hidden");
        studentSignupContainer.classList.add("hidden");
        
        // Refresh activities to show delete buttons
        fetchActivities();
        
        loginForm.reset();
      } else {
        loginMessage.textContent = "Invalid username or password";
        loginMessage.className = "error";
        loginMessage.classList.remove("hidden");
      }
    } catch (error) {
      loginMessage.textContent = "Login failed. Please try again.";
      loginMessage.className = "error";
      loginMessage.classList.remove("hidden");
      console.error("Error logging in:", error);
    }
  });

  // Logout
  logoutBtn.addEventListener("click", () => {
    isLoggedIn = false;
    currentUser = "";
    
    // Update UI
    userInfo.classList.add("hidden");
    signupContainer.classList.add("hidden");
    studentSignupContainer.classList.remove("hidden");
    
    // Refresh activities to hide delete buttons
    fetchActivities();
  });

  // Admin form submission
  adminForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("student-email").value;
    const activity = document.getElementById("admin-activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}&is_admin=${isLoggedIn}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        adminMessage.textContent = result.message;
        adminMessage.className = "success";
        adminForm.reset();
        fetchActivities();
      } else {
        adminMessage.textContent = result.detail || "An error occurred";
        adminMessage.className = "error";
      }

      adminMessage.classList.remove("hidden");
      setTimeout(() => {
        adminMessage.classList.add("hidden");
      }, 5000);
    } catch (error) {
      adminMessage.textContent = "Failed to register student. Please try again.";
      adminMessage.className = "error";
      adminMessage.classList.remove("hidden");
      console.error("Error registering:", error);
    }
  });

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      adminActivitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft =
          details.max_participants - details.participants.length;

        // Create participants HTML
        const participantsHTML =
          details.participants.length > 0
            ? `<div class="participants-section">
              <h5>Participants (${details.participants.length}/${details.max_participants}):</h5>
              <ul class="participants-list">
                ${details.participants
                  .map(
                    (email) =>
                      `<li><span class="participant-email">${email}</span>${
                        isLoggedIn
                          ? `<button class="delete-btn" data-activity="${name}" data-email="${email}">❌</button>`
                          : ""
                      }</li>`
                  )
                  .join("")}
              </ul>
            </div>`
            : `<p><em>No participants yet</em></p>`;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants-container">
            ${participantsHTML}
          </div>
        `;

        activitiesList.appendChild(activityCard);

        // Add option to admin select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        adminActivitySelect.appendChild(option);
      });

      // Add event listeners to delete buttons only for admin
      if (isLoggedIn) {
        document.querySelectorAll(".delete-btn").forEach((button) => {
          button.addEventListener("click", handleUnregister);
        });
      }
    } catch (error) {
      activitiesList.innerHTML =
        "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle unregister functionality (admin only)
  async function handleUnregister(event) {
    const button = event.target;
    const activity = button.getAttribute("data-activity");
    const email = button.getAttribute("data-email");

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/unregister?email=${encodeURIComponent(email)}&is_admin=${isLoggedIn}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (response.ok) {
        adminMessage.textContent = result.message;
        adminMessage.className = "success";

        // Refresh activities list to show updated participants
        fetchActivities();
      } else {
        adminMessage.textContent = result.detail || "An error occurred";
        adminMessage.className = "error";
      }

      adminMessage.classList.remove("hidden");
      setTimeout(() => {
        adminMessage.classList.add("hidden");
      }, 5000);
    } catch (error) {
      adminMessage.textContent = "Failed to unregister. Please try again.";
      adminMessage.className = "error";
      adminMessage.classList.remove("hidden");
      console.error("Error unregistering:", error);
    }
  }

  // Initialize app
  fetchActivities();
});
