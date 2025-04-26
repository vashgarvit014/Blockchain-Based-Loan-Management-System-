// Dashboard functionality
let dashboardData = {
  totalLoans: 0,
  totalLent: 0,
  repaidLoans: 0,
  successRate: 0,
  loansByStatus: {
    pending: 0,
    approved: 0,
    repaid: 0,
    rejected: 0
  },
  loansByAmount: {
    small: 0,  // 0-1 EDU
    medium: 0, // 1-5 EDU
    large: 0   // 5+ EDU
  },
  recentActivity: []
};

// Initialize dashboard
async function initDashboard() {
  // Add help button functionality
  document.getElementById('help-btn').addEventListener('click', showHelp);

  // Check if wallet is connected
  if (window.web3 && window.contract) {
    // Load real dashboard data
    await refreshDashboard();
  } else {
    // Show connection message
    showAlert('Please connect your wallet to view dashboard data', 'warning');

    // Set up event listener for wallet connection
    window.addEventListener('walletConnected', async () => {
      await refreshDashboard();
    });
  }

  // Add animation to stat values
  animateCounters();
}

// Refresh dashboard data
async function refreshDashboard() {
  if (!window.web3 || !window.contract) {
    showAlert('Please connect your wallet first', 'warning');
    return;
  }

  try {
    // Show loading state
    document.getElementById('total-loans').innerHTML = '<div class="spinner"></div>';
    document.getElementById('total-lent').innerHTML = '<div class="spinner"></div>';
    document.getElementById('repaid-loans').innerHTML = '<div class="spinner"></div>';
    document.getElementById('success-rate').innerHTML = '<div class="spinner"></div>';

    // Get all loans
    const loans = await window.contract.methods.getAllLoanRequests().call();

    // Calculate dashboard metrics
    dashboardData.totalLoans = loans.length;

    let totalLentWei = 0;
    let repaidCount = 0;
    let approvedCount = 0;
    let pendingCount = 0;

    // Reset loan status counters
    dashboardData.loansByStatus.pending = 0;
    dashboardData.loansByStatus.approved = 0;
    dashboardData.loansByStatus.repaid = 0;
    dashboardData.loansByStatus.rejected = 0;

    // Reset loan amount counters
    dashboardData.loansByAmount.small = 0;
    dashboardData.loansByAmount.medium = 0;
    dashboardData.loansByAmount.large = 0;

    // Process each loan
    loans.forEach(loan => {
      const amountEdu = parseFloat(window.web3.utils.fromWei(loan.amount, 'ether'));

      // Count by status
      if (loan.repaid) {
        repaidCount++;
        dashboardData.loansByStatus.repaid++;
      } else if (loan.approved) {
        approvedCount++;
        dashboardData.loansByStatus.approved++;
        totalLentWei = window.web3.utils.toBN(totalLentWei).add(window.web3.utils.toBN(loan.amount)).toString();
      } else {
        pendingCount++;
        dashboardData.loansByStatus.pending++;
      }

      // Count by amount
      if (amountEdu <= 1) {
        dashboardData.loansByAmount.small++;
      } else if (amountEdu <= 5) {
        dashboardData.loansByAmount.medium++;
      } else {
        dashboardData.loansByAmount.large++;
      }
    });

    // Calculate success rate
    dashboardData.successRate = loans.length > 0 ? Math.round((approvedCount / loans.length) * 100) : 0;

    // Convert total lent to EDU
    dashboardData.totalLent = parseFloat(window.web3.utils.fromWei(totalLentWei.toString(), 'ether')).toFixed(2);
    dashboardData.repaidLoans = repaidCount;

    // Sort loans by timestamp (newest first) for recent activity
    const sortedLoans = [...loans].sort((a, b) => parseInt(b.timestamp) - parseInt(a.timestamp));
    dashboardData.recentActivity = sortedLoans.slice(0, 3);

    // Update UI
    updateDashboardUI();

    // Show success message
    showAlert('Dashboard data refreshed successfully', 'success');

  } catch (err) {
    console.error('Error refreshing dashboard:', err);
    showAlert(`Failed to refresh dashboard: ${err.message}`, 'error');
  }
}

// Update dashboard UI with current data
function updateDashboardUI() {
  // Update stat cards
  document.getElementById('total-loans').textContent = dashboardData.totalLoans;
  document.getElementById('total-lent').textContent = dashboardData.totalLent;
  document.getElementById('repaid-loans').textContent = dashboardData.repaidLoans;
  document.getElementById('success-rate').textContent = `${dashboardData.successRate}%`;

  // Update loan amount distribution
  const totalLoanCount = dashboardData.totalLoans || 1; // Avoid division by zero

  const smallPercent = Math.round((dashboardData.loansByAmount.small / totalLoanCount) * 100);
  const mediumPercent = Math.round((dashboardData.loansByAmount.medium / totalLoanCount) * 100);
  const largePercent = Math.round((dashboardData.loansByAmount.large / totalLoanCount) * 100);

  document.getElementById('small-loans-percent').textContent = `${smallPercent}%`;
  document.getElementById('medium-loans-percent').textContent = `${mediumPercent}%`;
  document.getElementById('large-loans-percent').textContent = `${largePercent}%`;

  document.getElementById('small-loans-bar').style.width = `${smallPercent}%`;
  document.getElementById('medium-loans-bar').style.width = `${mediumPercent}%`;
  document.getElementById('large-loans-bar').style.width = `${largePercent}%`;

  // Update pie chart (using CSS conic-gradient)
  const pendingPercent = Math.round((dashboardData.loansByStatus.pending / totalLoanCount) * 100);
  const approvedPercent = Math.round((dashboardData.loansByStatus.approved / totalLoanCount) * 100);
  const repaidPercent = Math.round((dashboardData.loansByStatus.repaid / totalLoanCount) * 100);
  // Use the rejected percent for the remaining portion of the pie chart
  const rejectedOrOtherPercent = 100 - pendingPercent - approvedPercent - repaidPercent;

  const pieChart = document.querySelector('.pie-chart');
  if (pieChart) {
    pieChart.style.background = `conic-gradient(
      var(--primary-color) 0% ${pendingPercent}%,
      var(--secondary-color) ${pendingPercent}% ${pendingPercent + approvedPercent}%,
      var(--success) ${pendingPercent + approvedPercent}% ${pendingPercent + approvedPercent + repaidPercent}%,
      var(--warning) ${pendingPercent + approvedPercent + repaidPercent}% 100%
    )`;
  }

  // Update recent activity timeline
  if (dashboardData.recentActivity.length > 0) {
    dashboardData.recentActivity.forEach((loan, index) => {
      if (index < 3) { // We only have 3 timeline items in the UI
        const date = new Date(parseInt(loan.timestamp) * 1000).toLocaleString();
        // Handle the amount - for demo data we'll just use the amount directly if it's a number
        let amountEdu;
        if (typeof loan.amount === 'number') {
          amountEdu = loan.amount.toFixed(2);
        } else if (typeof loan.amount === 'string' && loan.amount.includes('EDU')) {
          amountEdu = loan.amount.replace(' EDU', '');
        } else {
          // Assume it's in wei format
          amountEdu = (parseInt(loan.amount) / 1e18).toFixed(2);
        }

        let status = 'Pending';
        if (loan.repaid) status = 'Repaid';
        else if (loan.approved) status = 'Approved';

        document.getElementById(`timeline-date-${index + 1}`).textContent = date;
        document.getElementById(`timeline-title-${index + 1}`).textContent = `${amountEdu} EDU Loan - ${status}`;
        document.getElementById(`timeline-desc-${index + 1}`).textContent =
          `Borrower ${shortenAddress(loan.borrower)} requested a loan of ${amountEdu} EDU. Current status: ${status}`;
      }
    });
  }
}

// Animate counter values
function animateCounters() {
  const counters = document.querySelectorAll('.animate-count');

  counters.forEach(counter => {
    const target = parseInt(counter.textContent);
    let count = 0;
    const duration = 1500; // ms
    const frameDuration = 1000 / 60; // 60fps
    const totalFrames = Math.round(duration / frameDuration);
    const increment = target / totalFrames;

    const animate = () => {
      count += increment;
      if (count < target) {
        counter.textContent = Math.floor(count);
        requestAnimationFrame(animate);
      } else {
        counter.textContent = target;
      }
    };

    animate();
  });
}

// Export dashboard data
function exportData() {
  try {
    const dataStr = JSON.stringify(dashboardData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);

    const exportFileDefaultName = 'loanchain-dashboard-data.json';

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();

    showAlert('Dashboard data exported successfully', 'success');
  } catch (err) {
    console.error('Error exporting data:', err);
    showAlert(`Failed to export data: ${err.message}`, 'error');
  }
}

// Show help modal
function showHelp() {
  showAlert(`
    <strong>Dashboard Help</strong><br>
    This dashboard provides an overview of your loan portfolio.<br>
    - Use the "Refresh Dashboard" button to update the data<br>
    - Export data allows you to download the current metrics<br>
    - The pie chart shows the distribution of loan statuses<br>
    - The progress bars show the distribution of loan amounts
  `, 'info');
}

// Helper function to shorten addresses for display
function shortenAddress(address) {
  if (!address) return '';
  return address.substring(0, 6) + '...' + address.substring(address.length - 4);
}

// Show alert message
function showAlert(message, type = 'error') {
  const alertBox = document.getElementById('alert-box');
  if (!alertBox) return;

  alertBox.innerHTML = message;
  alertBox.style.display = 'block';

  if (type === 'success') {
    alertBox.classList.add('success');
    alertBox.classList.remove('error', 'warning', 'info');
  } else if (type === 'warning') {
    alertBox.classList.add('warning');
    alertBox.classList.remove('error', 'success', 'info');
  } else if (type === 'info') {
    alertBox.classList.add('info');
    alertBox.classList.remove('error', 'success', 'warning');
  } else {
    alertBox.classList.add('error');
    alertBox.classList.remove('success', 'warning', 'info');
  }

  // Auto hide after 5 seconds for non-info alerts
  if (type !== 'info') {
    setTimeout(() => {
      alertBox.style.display = 'none';
    }, 5000);
  }
}

// Add animation to UI elements
function initAnimations() {
  // Add animation to buttons
  const buttons = document.querySelectorAll('button');
  buttons.forEach(button => {
    button.addEventListener('mouseover', function() {
      this.classList.add('animate-pulse');
    });
    button.addEventListener('mouseout', function() {
      this.classList.remove('animate-pulse');
    });
  });
}

// Initialize dashboard on page load
document.addEventListener('DOMContentLoaded', function() {
  initDashboard();
  initAnimations();
});
