const BASE_URL = "http://localhost:3000";

interface LoginResponse {
  message?: string;
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
  };
  token?: string;
  role?: string;
  [key: string]: any;
}

// Token management functions
function setAuthToken(token: string, remember: boolean = false): void {
  if (remember) {
    localStorage.setItem('authToken', token);
  } else {
    sessionStorage.setItem('authToken', token);
  }
}

function clearAuthToken(): void {
  localStorage.removeItem('authToken');
  sessionStorage.removeItem('authToken');
}

document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm") as HTMLFormElement | null;
  const loginBtn = document.getElementById("loginBtn") as HTMLButtonElement | null;
  const btnLoader = document.getElementById("btnLoader") as HTMLElement | null;
  const togglePassword = document.getElementById("togglePassword") as HTMLButtonElement | null;
  const passwordInput = document.getElementById("password") as HTMLInputElement | null;

  // Toggle password visibility
  if (togglePassword && passwordInput) {
    togglePassword.addEventListener("click", () => {
      const type = passwordInput.type === "password" ? "text" : "password";
      passwordInput.type = type;
      togglePassword.innerHTML =
        type === "password"
          ? '<i class="fas fa-eye"></i>'
          : '<i class="fas fa-eye-slash"></i>';
    });
  }

  // Form submission handler
  if (loginForm && loginBtn && btnLoader) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      // Disable form and show loader
      loginBtn.disabled = true;
      btnLoader.style.display = "inline-block";

      // Get form values
      const emailInput = document.getElementById("email") as HTMLInputElement | null;
      const passwordInput = document.getElementById("password") as HTMLInputElement | null;
      const rememberInput = document.getElementById("remember") as HTMLInputElement | null;

      const email = emailInput?.value.trim() || "";
      const password = passwordInput?.value || "";
      const remember = rememberInput?.checked || false;

      // Validate inputs
      if (!email || !password) {
        alert("Please enter both email and password.");
        loginBtn.disabled = false;
        btnLoader.style.display = "none";
        return;
      }

      try {
        console.log("Attempting login for:", email);

        const response = await fetch(`${BASE_URL}/auth/login`, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json" 
          },
          body: JSON.stringify({ email, password }),
        });

        console.log("Login response status:", response.status);

        let result: LoginResponse = { message: "Unknown error" };
        
        // Check if response is JSON
        const contentType = response.headers.get("content-type");
        if (contentType?.includes("application/json")) {
          result = await response.json();
        } else {
          const textResponse = await response.text();
          console.error("Non-JSON response:", textResponse);
          throw new Error("Server returned invalid response");
        }

        console.log("Login result:", result);

        if (response.ok) {
          // Check if we received a token
          if (result.token) {
            // Store the token
            setAuthToken(result.token, remember);
            console.log("Token stored successfully");
          } else {
            console.warn("No token received from server");
          }

          // Determine redirect based on user role
          const userRole = result.user?.role || result.role;
          
          console.log("User role:", userRole);

          // Show success message
          alert(`Welcome back, ${result.user?.name || 'User'}!`);
          
          // Redirect based on role
          if (userRole === "ADMIN") {
            window.location.href = "../dashboard/adminDashboard.html";
          } else if (userRole === "USER") {
            window.location.href = "../dashboard/userDashboard.html";
          } else {
            // Fallback redirect if role is not recognized
            console.warn("Unknown user role:", userRole);
            window.location.href = "../dashboard/userDashboard.html";
          }
        } else {
          // Handle login failure
          let errorMessage = "Login failed";
          
          if (result.message) {
            errorMessage = result.message;
          } else if (response.status === 401) {
            errorMessage = "Invalid email or password";
          } else if (response.status === 429) {
            errorMessage = "Too many login attempts. Please try again later.";
          } else if (response.status >= 500) {
            errorMessage = "Server error. Please try again later.";
          }
          
          alert(errorMessage);
        }
      } catch (error) {
        console.error("Login error:", error);
        
        let errorMessage = "An error occurred during login.";
        
        if (error instanceof TypeError && error.message.includes("fetch")) {
          errorMessage = "Cannot connect to server. Please check if the server is running.";
        } else if (error instanceof Error) {
          errorMessage = error.message;
        }
        
        alert(errorMessage);
      } finally {
        // Re-enable form
        loginBtn.disabled = false;
        btnLoader.style.display = "none";
      }
    });
  }

  // Clear any existing tokens on login page load
  clearAuthToken();
});