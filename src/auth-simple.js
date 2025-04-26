// Mock user database (in a real app, this would be on a server)
const users = [
  { username: 'admin', password: 'admin123', role: 'admin', name: 'Admin User', email: 'admin@loanchain.com' },
  { username: 'user', password: 'user123', role: 'user', name: 'Regular User', email: 'user@loanchain.com' }
];

// Check if user is already logged in
function checkAuth() {
  const user = JSON.parse(localStorage.getItem('loanchain_user'));
  if (user) {
    return user;
  }
  return null;
}

// Redirect if not authenticated
function requireAuth() {
  const user = checkAuth();
  if (!user) {
    window.location.href = './login.html';
    return false;
  }
  return user;
}

// Redirect if not admin
function requireAdmin() {
  const user = requireAuth();
  if (!user || user.role !== 'admin') {
    showAlert('You do not have permission to access this page', 'error');
    setTimeout(() => {
      window.location.href = './index.html';
    }, 2000);
    return false;
  }
  return user;
}

// Login function
function login() {
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  
  if (!username || !password) {
    showAlert('Please enter both username and password', 'warning');
    return;
  }
  
  // Find user
  const user = users.find(u => u.username === username && u.password === password);
  
  if (user) {
    // Store user info in localStorage (excluding password)
    const userInfo = {
      username: user.username,
      role: user.role,
      name: user.name,
      email: user.email
    };
    
    localStorage.setItem('loanchain_user', JSON.stringify(userInfo));
    
    showAlert('Login successful! Redirecting...', 'success');
    
    // Redirect based on role
    setTimeout(() => {
      if (user.role === 'admin') {
        window.location.href = './admin.html';
      } else {
        window.location.href = './borrower.html';
      }
    }, 1500);
  } else {
    showAlert('Invalid username or password', 'error');
  }
}

// Register function
function registerUser() {
  const fullname = document.getElementById('fullname')?.value;
  const username = document.getElementById('reg-username')?.value;
  const email = document.getElementById('email')?.value;
  const password = document.getElementById('reg-password')?.value;
  const confirmPassword = document.getElementById('confirm-password')?.value;
  const terms = document.getElementById('terms')?.checked;
  
  if (!fullname || !username || !email || !password || !confirmPassword) {
    showAlert('Please fill in all fields', 'warning');
    return;
  }
  
  if (password !== confirmPassword) {
    showAlert('Passwords do not match', 'error');
    return;
  }
  
  if (!terms) {
    showAlert('Please agree to the Terms and Conditions', 'warning');
    return;
  }
  
  // Check if username already exists
  if (users.some(u => u.username === username)) {
    showAlert('Username already exists', 'error');
    return;
  }
  
  // In a real app, we would send this to a server
  // For this demo, we'll just show a success message
  showAlert('Registration successful! You can now login.', 'success');
  
  setTimeout(() => {
    window.location.href = './login.html';
  }, 2000);
}

// Connect with wallet function
async function connectWithWallet() {
  if (!window.ethereum) {
    showAlert('Please install MetaMask to connect with wallet', 'warning');
    return;
  }
  
  try {
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    const account = accounts[0];
    
    // In a real app, we would verify this address on the server
    // For this demo, we'll create a user with the wallet address
    const userInfo = {
      username: account.substring(0, 8) + '...',
      role: 'user', // Default role for wallet connections
      name: 'Wallet User',
      email: '',
      walletAddress: account
    };
    
    localStorage.setItem('loanchain_user', JSON.stringify(userInfo));
    localStorage.setItem('connectedAccount', account);
    
    showAlert('Wallet connected successfully! Redirecting...', 'success');
    
    setTimeout(() => {
      window.location.href = './borrower.html';
    }, 1500);
  } catch (err) {
    showAlert(`Failed to connect wallet: ${err.message}`, 'error');
  }
}

// Logout function
function logout() {
  localStorage.removeItem('loanchain_user');
  showAlert('Logged out successfully', 'success');
  
  setTimeout(() => {
    window.location.href = './index.html';
  }, 1500);
}

// Register function for the register page
function register() {
  window.location.href = './register.html';
}

// Show alert message
function showAlert(message, type = 'error') {
  const alertBox = document.getElementById('alert-box');
  if (!alertBox) return;
  
  alertBox.innerHTML = message;
  alertBox.style.display = 'block';
  
  if (type === 'success') {
    alertBox.classList.add('success');
    alertBox.classList.remove('error', 'warning');
  } else if (type === 'warning') {
    alertBox.classList.add('warning');
    alertBox.classList.remove('error', 'success');
  } else {
    alertBox.classList.add('error');
    alertBox.classList.remove('success', 'warning');
  }
  
  // Auto hide after 5 seconds
  setTimeout(() => {
    alertBox.style.display = 'none';
  }, 5000);
}

// Update UI based on authentication status
function updateAuthUI() {
  const user = checkAuth();
  const loginBtn = document.getElementById('login-btn');
  const logoutBtn = document.getElementById('logout-btn');
  const userInfoEl = document.getElementById('user-info');
  
  if (user) {
    // User is logged in
    if (loginBtn) loginBtn.style.display = 'none';
    if (logoutBtn) logoutBtn.style.display = 'block';
    if (userInfoEl) {
      userInfoEl.innerHTML = `
        <span class="status-tag status-approved">
          ${user.role === 'admin' ? 'Admin' : 'User'}: ${user.username}
        </span>
      `;
      userInfoEl.style.display = 'block';
    }
    
    // Show/hide elements based on role
    const adminElements = document.querySelectorAll('.admin-only');
    const userElements = document.querySelectorAll('.user-only');
    
    adminElements.forEach(el => {
      el.style.display = user.role === 'admin' ? 'block' : 'none';
    });
    
    userElements.forEach(el => {
      el.style.display = user.role === 'user' ? 'block' : 'none';
    });
  } else {
    // User is not logged in
    if (loginBtn) loginBtn.style.display = 'block';
    if (logoutBtn) logoutBtn.style.display = 'none';
    if (userInfoEl) userInfoEl.style.display = 'none';
    
    // Hide role-specific elements
    document.querySelectorAll('.admin-only, .user-only').forEach(el => {
      el.style.display = 'none';
    });
  }
}

// Initialize auth on page load
function initAuth() {
  updateAuthUI();
  
  // Check if we need to enforce authentication for this page
  const requiresAuth = document.body.hasAttribute('data-require-auth');
  const requiresAdmin = document.body.hasAttribute('data-require-admin');
  
  if (requiresAdmin) {
    requireAdmin();
  } else if (requiresAuth) {
    requireAuth();
  }
}

// Expose functions to window
window.login = login;
window.logout = logout;
window.register = register;
window.registerUser = registerUser;
window.connectWithWallet = connectWithWallet;
window.checkAuth = checkAuth;
window.requireAuth = requireAuth;
window.requireAdmin = requireAdmin;
window.showAlert = showAlert;

// Initialize on page load
document.addEventListener('DOMContentLoaded', initAuth);
