import { User } from './interfaces/userInterface';

// Elements
const form = document.getElementById("registerForm") as HTMLFormElement;
const userName = document.getElementById("userName") as HTMLInputElement;
const email = document.getElementById("email") as HTMLInputElement;
const password = document.getElementById("password") as HTMLInputElement;
const confirmPassword = document.getElementById("confirmPassword") as HTMLInputElement;
const terms = document.getElementById("terms") as HTMLInputElement;
const registerBtn = document.getElementById("registerBtn") as HTMLButtonElement;

const profileInput = document.getElementById("profilePic") as HTMLInputElement;
const previewImg = document.getElementById("profilePreview") as HTMLImageElement;
const previewContainer = document.getElementById("profilePreviewContainer") as HTMLDivElement;

// Password toggle
const togglePassword = document.getElementById("togglePassword") as HTMLButtonElement;
const toggleConfirmPassword = document.getElementById("toggleConfirmPassword") as HTMLButtonElement;

togglePassword?.addEventListener("click", () => {
  password.type = password.type === "password" ? "text" : "password";
});

toggleConfirmPassword?.addEventListener("click", () => {
  confirmPassword.type = confirmPassword.type === "password" ? "text" : "password";
});

// Password strength check
const passwordStrength = document.getElementById("passwordStrength") as HTMLElement;
const strengthBar = passwordStrength.querySelector(".strength-fill") as HTMLElement;
const strengthText = passwordStrength.querySelector(".strength-text") as HTMLElement;

password.addEventListener("input", () => {
  const value = password.value;
  let strength = 0;
  if (value.length > 7) strength++;
  if (/[A-Z]/.test(value)) strength++;
  if (/[0-9]/.test(value)) strength++;
  if (/[^A-Za-z0-9]/.test(value)) strength++;

  strengthBar.style.width = `${(strength / 4) * 100}%`;

  const messages = ["Weak", "Moderate", "Good", "Strong"];
  strengthText.textContent = messages[strength - 1] || "Very Weak";

  strengthBar.style.backgroundColor = ["#f44336", "#ff9800", "#03a9f4", "#4caf50"][strength - 1] || "#ccc";
});

// Profile pic preview
profileInput?.addEventListener("change", () => {
  const file = profileInput.files?.[0];
  if (file && file.type.startsWith("image/")) {
    const reader = new FileReader();
    reader.onload = (e) => {
      previewImg.src = e.target?.result as string;
      previewContainer.style.display = "block";
    };
    reader.readAsDataURL(file);
  } else {
    previewImg.src = "";
    previewContainer.style.display = "none";
  }
});

// Form validation helper
function showError(id: string, message: string) {
  const el = document.getElementById(`${id}-error`);
  if (el) el.textContent = message;
}

function clearErrors() {
  const errors = document.querySelectorAll(".error-message");
  errors.forEach((e) => (e.textContent = ""));
}

// Form submit
form?.addEventListener("submit", (e) => {
  e.preventDefault();
  clearErrors();

  let valid = true;

  if (userName.value.trim() === "") {
    showError("fullName", "Full name is required.");
    valid = false;
  }

  if (email.value.trim() === "") {
    showError("email", "Email is required.");
    valid = false;
  } else if (!/\S+@\S+\.\S+/.test(email.value)) {
    showError("email", "Invalid email format.");
    valid = false;
  }

  if (password.value.length < 8) {
    showError("password", "Password must be at least 8 characters.");
    valid = false;
  }

  if (password.value !== confirmPassword.value) {
    showError("confirmPassword", "Passwords do not match.");
    valid = false;
  }

  if (!terms.checked) {
    showError("terms", "You must accept the terms.");
    valid = false;
  }

  if (valid) {
    // Normally you'd send data to the backend here
    alert("Registration successful!");

    // You can collect the file like this if needed:
    const profileFile = profileInput.files?.[0];
    console.log("Profile picture file:", profileFile);

    form.reset();
    previewImg.src = "";
    previewContainer.style.display = "none";
    strengthBar.style.width = "0";
    strengthText.textContent = "Password strength";
  }
});
