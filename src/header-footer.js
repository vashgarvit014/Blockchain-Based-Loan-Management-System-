// Common header and footer for all pages

document.addEventListener('DOMContentLoaded', function() {
  insertHeader();
  insertFooter();
  setupActiveNavLinks();
  setupPageTransitions();
});

// Insert header into all pages
function insertHeader() {
  const headerContainer = document.createElement('header');
  headerContainer.classList.add('site-header', 'page-transition', 'header-transition');
  
  headerContainer.innerHTML = `
    <nav class="navbar">
      <div class="navbar-brand">
        <img src="logo.svg" alt="LoanChain Logo" class="navbar-logo">
        <span class="gradient-text">LoanChain</span>
      </div>
      <div class="navbar-links">
        <a href="./landing.html" class="nav-link">Home</a>
        <a href="./dashboard.html" class="nav-link">Dashboard</a>
        <a href="./borrower.html" class="nav-link">Borrower</a>
        <a href="./admin.html" class="nav-link">Admin</a>
        <a href="./loans.html" class="nav-link">Loans</a>
      </div>
      <div class="navbar-actions">
        <button class="btn-glass btn-sm" id="connect-wallet">
          <span class="wallet-indicator"></span>
          Connect Wallet
        </button>
      </div>
    </nav>
  `;
  
  // Insert at the beginning of the body
  document.body.insertBefore(headerContainer, document.body.firstChild);
  
  // Setup wallet connection
  setupWalletConnection();
}

// Insert footer into all pages
function insertFooter() {
  const footerContainer = document.createElement('footer');
  footerContainer.classList.add('site-footer', 'page-transition', 'footer-transition');
  
  footerContainer.innerHTML = `
    <div class="footer-content">
      <div class="footer-brand">
        <div class="footer-logo">
          <img src="logo.svg" alt="LoanChain Logo" class="navbar-logo">
          <span class="gradient-text">LoanChain</span>
        </div>
        <p class="footer-tagline">
          Empowering the future of finance with blockchain technology
        </p>
        <div class="footer-social">
          <a href="#" class="social-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path>
            </svg>
          </a>
          <a href="#" class="social-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
              <rect x="2" y="9" width="4" height="12"></rect>
              <circle cx="4" cy="4" r="2"></circle>
            </svg>
          </a>
          <a href="#" class="social-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
            </svg>
          </a>
        </div>
      </div>
      
      <div class="footer-links">
        <div class="footer-links-column">
          <h4 class="footer-links-title">Quick Links</h4>
          <ul class="footer-links-list">
            <li><a href="./landing.html">Home</a></li>
            <li><a href="./dashboard.html">Dashboard</a></li>
            <li><a href="./borrower.html">Borrower</a></li>
            <li><a href="./admin.html">Admin</a></li>
          </ul>
        </div>
        
        <div class="footer-links-column">
          <h4 class="footer-links-title">Resources</h4>
          <ul class="footer-links-list">
            <li><a href="#">Documentation</a></li>
            <li><a href="#">API Reference</a></li>
            <li><a href="#">Smart Contracts</a></li>
            <li><a href="#">Whitepaper</a></li>
          </ul>
        </div>
      </div>
    </div>
    
    <div class="footer-bottom">
      <div class="footer-copyright">
        &copy; 2023 LoanChain. All rights reserved.
      </div>
      <div class="footer-disclaimer">
        LoanChain is a decentralized platform. Always do your own research before making financial decisions.
      </div>
    </div>
  `;
  
  // Append to the end of the body
  document.body.appendChild(footerContainer);
}

// Setup active navigation links
function setupActiveNavLinks() {
  const currentPath = window.location.pathname;
  const navLinks = document.querySelectorAll('.nav-link');
  
  navLinks.forEach(link => {
    const linkPath = link.getAttribute('href');
    if (currentPath.includes(linkPath)) {
      link.classList.add('active');
    }
  });
}

// Setup page transitions
function setupPageTransitions() {
  const navLinks = document.querySelectorAll('.nav-link');
  
  navLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      // Only for internal links
      if (this.hostname === window.location.hostname) {
        e.preventDefault();
        const href = this.getAttribute('href');
        
        // Create transition overlay
        const overlay = document.createElement('div');
        overlay.classList.add('page-transition-overlay');
        document.body.appendChild(overlay);
        
        // Activate overlay
        setTimeout(() => {
          overlay.classList.add('active');
        }, 10);
        
        // Navigate after transition
        setTimeout(() => {
          window.location.href = href;
        }, 300);
      }
    });
  });
}

// Setup wallet connection
function setupWalletConnection() {
  const connectWalletBtn = document.getElementById('connect-wallet');
  const walletIndicator = document.querySelector('.wallet-indicator');
  
  if (!connectWalletBtn) return;
  
  // Check if wallet is already connected
  const isConnected = localStorage.getItem('walletConnected') === 'true';
  
  if (isConnected) {
    connectWalletBtn.innerHTML = `
      <span class="wallet-indicator connected"></span>
      Wallet Connected
    `;
    walletIndicator.classList.add('connected');
  }
  
  connectWalletBtn.addEventListener('click', function() {
    // Simulate wallet connection
    const isNowConnected = localStorage.getItem('walletConnected') === 'true';
    
    if (!isNowConnected) {
      // Show loading
      const loadingOverlay = document.createElement('div');
      loadingOverlay.classList.add('loading-overlay');
      loadingOverlay.innerHTML = `
        <div class="loading-spinner"></div>
        <div class="loading-text">Connecting to wallet...</div>
      `;
      document.body.appendChild(loadingOverlay);
      
      setTimeout(() => {
        loadingOverlay.classList.add('show');
      }, 10);
      
      // Simulate connection delay
      setTimeout(() => {
        localStorage.setItem('walletConnected', 'true');
        
        connectWalletBtn.innerHTML = `
          <span class="wallet-indicator connected"></span>
          Wallet Connected
        `;
        
        // Remove loading overlay
        loadingOverlay.classList.remove('show');
        setTimeout(() => {
          loadingOverlay.remove();
        }, 300);
        
        // Show success notification
        showNotification('Wallet connected successfully!', 'success');
      }, 1500);
    } else {
      // Disconnect wallet
      localStorage.removeItem('walletConnected');
      
      connectWalletBtn.innerHTML = `
        <span class="wallet-indicator"></span>
        Connect Wallet
      `;
      
      // Show notification
      showNotification('Wallet disconnected', 'info');
    }
  });
}

// Show notification
function showNotification(message, type = 'info') {
  // Create notification element if it doesn't exist
  let notification = document.querySelector('.notification');
  
  if (!notification) {
    notification = document.createElement('div');
    notification.classList.add('notification', `notification-${type}`);
    document.body.appendChild(notification);
  } else {
    // Update existing notification
    notification.className = '';
    notification.classList.add('notification', `notification-${type}`);
  }
  
  // Set notification content
  notification.innerHTML = `
    <div class="notification-icon">
      ${getNotificationIcon(type)}
    </div>
    <div class="notification-content">
      ${message}
    </div>
    <button class="notification-close">
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
    </button>
  `;
  
  // Show notification
  setTimeout(() => {
    notification.classList.add('show');
  }, 10);
  
  // Add close button event
  const closeButton = notification.querySelector('.notification-close');
  closeButton.addEventListener('click', () => {
    notification.classList.remove('show');
    notification.classList.add('hide');
    
    setTimeout(() => {
      notification.remove();
    }, 500);
  });
  
  // Auto remove after 5 seconds
  setTimeout(() => {
    if (notification.parentNode) {
      notification.classList.remove('show');
      notification.classList.add('hide');
      
      setTimeout(() => {
        if (notification.parentNode) {
          notification.remove();
        }
      }, 500);
    }
  }, 5000);
}

// Get notification icon based on type
function getNotificationIcon(type) {
  switch (type) {
    case 'success':
      return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
        <polyline points="22 4 12 14.01 9 11.01"></polyline>
      </svg>`;
    case 'error':
      return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="15" y1="9" x2="9" y2="15"></line>
        <line x1="9" y1="9" x2="15" y2="15"></line>
      </svg>`;
    case 'warning':
      return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
        <line x1="12" y1="9" x2="12" y2="13"></line>
        <line x1="12" y1="17" x2="12.01" y2="17"></line>
      </svg>`;
    case 'info':
    default:
      return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="16" x2="12" y2="12"></line>
        <line x1="12" y1="8" x2="12.01" y2="8"></line>
      </svg>`;
  }
}

// Make functions available globally
window.showNotification = showNotification;
