// Common components for all pages

// Initialize components when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  initPageLoader();
  initNavigation();
  initStaggeredAnimations();
  initTooltips();
  initPageTransitions();
});

// Page loader
function initPageLoader() {
  const loader = document.querySelector('.page-loader');
  if (!loader) return;
  
  // Hide loader after page is fully loaded
  window.addEventListener('load', function() {
    setTimeout(function() {
      loader.classList.add('loaded');
    }, 500);
  });
}

// Navigation active state
function initNavigation() {
  const currentPath = window.location.pathname;
  const navLinks = document.querySelectorAll('.navbar-links a');
  
  navLinks.forEach(link => {
    const linkPath = link.getAttribute('href');
    if (currentPath.includes(linkPath) && linkPath !== './landing.html') {
      link.classList.add('active');
    } else if (currentPath.endsWith('/') && linkPath === './landing.html') {
      link.classList.add('active');
    } else if (currentPath.endsWith('index.html') && linkPath === './landing.html') {
      link.classList.add('active');
    }
    
    // Add transition effect when clicking links
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

// Staggered animations for lists
function initStaggeredAnimations() {
  const staggerItems = document.querySelectorAll('.stagger-item');
  
  if (staggerItems.length === 0) return;
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, index) => {
      if (entry.isIntersecting) {
        setTimeout(() => {
          entry.target.classList.add('visible');
        }, 100 * index);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });
  
  staggerItems.forEach(item => {
    observer.observe(item);
  });
}

// Initialize tooltips
function initTooltips() {
  const tooltips = document.querySelectorAll('[data-tooltip]');
  
  tooltips.forEach(tooltip => {
    // Already has the tooltip class
    if (tooltip.classList.contains('tooltip')) return;
    
    tooltip.classList.add('tooltip');
  });
}

// Page transitions
function initPageTransitions() {
  // Add transition classes to main elements
  const header = document.querySelector('nav.navbar');
  const main = document.querySelector('main') || document.querySelector('.container');
  const footer = document.querySelector('footer');
  
  if (header) {
    header.classList.add('page-transition', 'header-transition');
  }
  
  if (main) {
    main.classList.add('page-transition', 'content-transition');
  }
  
  if (footer) {
    footer.classList.add('page-transition', 'footer-transition');
  }
}

// Create a notification
function showNotification(message, type = 'info', duration = 5000) {
  // Remove any existing notifications
  const existingNotifications = document.querySelectorAll('.notification');
  existingNotifications.forEach(notification => {
    notification.remove();
  });
  
  // Create notification element
  const notification = document.createElement('div');
  notification.classList.add('notification', `notification-${type}`);
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
  
  // Add to document
  document.body.appendChild(notification);
  
  // Add close button event
  const closeButton = notification.querySelector('.notification-close');
  closeButton.addEventListener('click', () => {
    notification.style.opacity = '0';
    setTimeout(() => {
      notification.remove();
    }, 300);
  });
  
  // Auto remove after duration
  setTimeout(() => {
    notification.style.opacity = '0';
    setTimeout(() => {
      notification.remove();
    }, 300);
  }, duration);
  
  return notification;
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

// Export functions to window
window.showNotification = showNotification;
