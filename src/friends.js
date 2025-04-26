// Friends management functionality

// Database-like structure for friends management
const DB = {
  // Friends collection
  friends: {
    // Get all friends
    getAll: function() {
      return JSON.parse(localStorage.getItem('loanchain_friends') || '[]');
    },

    // Get friends by borrower address
    getByBorrower: function(borrowerAddress) {
      if (!borrowerAddress) return [];
      return this.getAll().filter(friend => friend.borrowerAddress === borrowerAddress);
    },

    // Get friend by ID
    getById: function(id) {
      return this.getAll().find(friend => friend.id === id);
    },

    // Add a new friend
    add: function(friend) {
      const friends = this.getAll();
      friends.push(friend);
      localStorage.setItem('loanchain_friends', JSON.stringify(friends));
      return friend;
    },

    // Update a friend
    update: function(id, updatedFriend) {
      const friends = this.getAll();
      const index = friends.findIndex(friend => friend.id === id);
      if (index !== -1) {
        friends[index] = { ...friends[index], ...updatedFriend };
        localStorage.setItem('loanchain_friends', JSON.stringify(friends));
        return friends[index];
      }
      return null;
    },

    // Remove a friend
    remove: function(id) {
      const friends = this.getAll();
      const newFriends = friends.filter(friend => friend.id !== id);
      localStorage.setItem('loanchain_friends', JSON.stringify(newFriends));
      return newFriends;
    }
  },

  // Notifications collection
  notifications: {
    // Get all notifications
    getAll: function() {
      return JSON.parse(localStorage.getItem('loanchain_notifications') || '[]');
    },

    // Get notifications by borrower address
    getByBorrower: function(borrowerAddress) {
      if (!borrowerAddress) return [];
      return this.getAll().filter(notification => notification.borrowerAddress === borrowerAddress);
    },

    // Add a new notification
    add: function(notification) {
      const notifications = this.getAll();
      notifications.push(notification);
      localStorage.setItem('loanchain_notifications', JSON.stringify(notifications));
      return notification;
    }
  }
};

// Initialize variables
let friends = DB.friends.getAll();
let notificationHistory = DB.notifications.getAll();
let account = null; // Current connected wallet account

// Function to add a new friend
function addFriend() {
  // Check if wallet is connected
  if (!account) {
    const storedAccount = localStorage.getItem('connectedAccount');
    if (storedAccount) {
      account = storedAccount;
    } else {
      showAlert("Please connect your wallet first", "warning");
      return;
    }
  }

  const name = document.getElementById('friend-name').value.trim();
  const address = document.getElementById('friend-address').value.trim();
  const email = document.getElementById('friend-email').value.trim();

  if (!name) {
    showAlert("Please enter your friend's name", "warning");
    return;
  }

  if (!email) {
    showAlert("Please enter your friend's email", "warning");
    return;
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    showAlert("Please enter a valid email address", "warning");
    return;
  }

  // Validate wallet address if provided
  if (address && !address.startsWith('0x')) {
    showAlert("Please enter a valid wallet address starting with '0x'", "warning");
    return;
  }

  // Check if friend with same email already exists for this borrower
  const existingFriends = DB.friends.getByBorrower(account);
  if (existingFriends.some(friend => friend.email.toLowerCase() === email.toLowerCase())) {
    showAlert("A friend with this email already exists", "warning");
    return;
  }

  // Add new friend with borrower association
  const newFriend = {
    id: Date.now().toString(), // Use timestamp as unique ID
    name,
    address,
    email,
    borrowerAddress: account, // Associate friend with current borrower
    dateAdded: new Date().toISOString(),
    status: 'active'
  };

  // Add to database
  DB.friends.add(newFriend);

  // Update local array
  friends = DB.friends.getAll();

  // Clear form
  document.getElementById('friend-name').value = '';
  document.getElementById('friend-address').value = '';
  document.getElementById('friend-email').value = '';

  // Update friends table
  updateFriendsTable();

  showAlert(`Friend ${name} added successfully!`, "success");
}

// Function to remove a friend
function removeFriend(id) {
  // Get friend details before removal for the alert message
  const friend = DB.friends.getById(id);

  // Remove from database
  DB.friends.remove(id);

  // Update local array
  friends = DB.friends.getAll();

  // Update friends table
  updateFriendsTable();

  if (friend) {
    showAlert(`Friend ${friend.name} removed successfully`, "success");
  } else {
    showAlert("Friend removed successfully", "success");
  }
}

// Function to clear the friend form
function clearFriendForm() {
  document.getElementById('friend-name').value = '';
  document.getElementById('friend-address').value = '';
  document.getElementById('friend-email').value = '';
  showAlert("Form cleared", "info");
}

// Function to toggle friend status
function toggleFriendStatus(id) {
  // Get friend from database
  const friend = DB.friends.getById(id);

  if (!friend) {
    showAlert("Friend not found", "error");
    return;
  }

  // Toggle status
  const newStatus = friend.status === 'active' ? 'inactive' : 'active';

  // Update in database
  DB.friends.update(id, { status: newStatus });

  // Update local array
  friends = DB.friends.getAll();

  // Update friends table
  updateFriendsTable();

  showAlert(`Friend ${friend.name} is now ${newStatus}`, "success");
}

// Function to search friends
function searchFriends() {
  const searchTerm = document.getElementById('friend-search').value.toLowerCase();
  const statusFilter = document.getElementById('status-filter').value;

  // Get all friends for current borrower
  if (!account) {
    const storedAccount = localStorage.getItem('connectedAccount');
    if (storedAccount) {
      account = storedAccount;
    }
  }

  let myFriends = account
    ? DB.friends.getByBorrower(account)
    : DB.friends.getAll();

  // Apply status filter
  if (statusFilter !== 'all') {
    myFriends = myFriends.filter(friend => friend.status === statusFilter);
  }

  // Apply search term
  if (searchTerm) {
    myFriends = myFriends.filter(friend =>
      friend.name.toLowerCase().includes(searchTerm) ||
      friend.email.toLowerCase().includes(searchTerm) ||
      (friend.address && friend.address.toLowerCase().includes(searchTerm))
    );
  }

  // Update table with filtered results
  renderFriendsTable(myFriends);
}

// Function to filter friends by status
function filterFriends() {
  searchFriends(); // Reuse search function which also handles status filtering
}

// Function to render the friends table with given data
function renderFriendsTable(friendsList) {
  const tableBody = document.getElementById('friends-table');
  if (!tableBody) return;

  if (friendsList.length === 0) {
    tableBody.innerHTML = '<tr><td colspan="6">No friends found matching your criteria</td></tr>';
    return;
  }

  tableBody.innerHTML = '';

  // Sort friends by name
  friendsList.sort((a, b) => a.name.localeCompare(b.name));

  friendsList.forEach(friend => {
    const row = document.createElement('tr');

    // Format date
    const dateAdded = friend.dateAdded
      ? new Date(friend.dateAdded).toLocaleDateString()
      : 'Unknown';

    // Create status badge
    const statusBadge = friend.status === 'active'
      ? '<span class="status-tag status-approved">Active</span>'
      : '<span class="status-tag status-pending">Inactive</span>';

    row.innerHTML = `
      <td>${friend.name}</td>
      <td>${friend.address ? shortenAddress(friend.address) : 'Not provided'}</td>
      <td>${friend.email}</td>
      <td>${statusBadge}</td>
      <td>${dateAdded}</td>
      <td>
        <div class="action-buttons">
          <button onclick="toggleFriendStatus('${friend.id}')" class="btn-sm btn-outline" title="${friend.status === 'active' ? 'Deactivate' : 'Activate'}">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 12l2 2 4-4"></path>
              <circle cx="12" cy="12" r="10"></circle>
            </svg>
          </button>
          <button onclick="removeFriend('${friend.id}')" class="btn-sm btn-outline" title="Remove">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 6h18"></path>
              <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"></path>
            </svg>
          </button>
        </div>
      </td>
    `;
    tableBody.appendChild(row);
  });

  // Update summary counts
  updateFriendsSummary(friendsList);
}

// Function to update the friends summary
function updateFriendsSummary(friendsList) {
  // Update friend count badge
  const friendCountEl = document.getElementById('friend-count');
  if (friendCountEl) {
    friendCountEl.textContent = friendsList.length;
  }

  // Update total friends count
  const totalFriendsCountEl = document.getElementById('total-friends-count');
  if (totalFriendsCountEl) {
    totalFriendsCountEl.textContent = friendsList.length;
  }

  // Update active friends count
  const activeFriendsCountEl = document.getElementById('active-friends-count');
  if (activeFriendsCountEl) {
    const activeCount = friendsList.filter(friend => friend.status === 'active').length;
    activeFriendsCountEl.textContent = activeCount;
  }

  // Update borrower friend count if on borrower page
  const borrowerFriendCountEl = document.getElementById('borrower-friend-count');
  if (borrowerFriendCountEl) {
    const activeCount = friendsList.filter(friend => friend.status === 'active').length;
    borrowerFriendCountEl.textContent = activeCount;
  }
}

// Function to update the friends table
function updateFriendsTable() {
  // Check if wallet is connected
  if (!account) {
    const storedAccount = localStorage.getItem('connectedAccount');
    if (storedAccount) {
      account = storedAccount;
    }
  }

  // Get friends from database for current borrower
  const myFriends = account
    ? DB.friends.getByBorrower(account)
    : DB.friends.getAll();

  // Render the table
  renderFriendsTable(myFriends);

  // Reset search and filter
  const searchInput = document.getElementById('friend-search');
  if (searchInput) searchInput.value = '';

  const statusFilter = document.getElementById('status-filter');
  if (statusFilter) statusFilter.value = 'all';
}

// Function to search notifications
function searchNotifications() {
  const searchTerm = document.getElementById('notification-search').value.toLowerCase();

  // Get all notifications for current borrower
  if (!account) {
    const storedAccount = localStorage.getItem('connectedAccount');
    if (storedAccount) {
      account = storedAccount;
    }
  }

  let myNotifications = account
    ? DB.notifications.getByBorrower(account)
    : DB.notifications.getAll();

  // Apply search term
  if (searchTerm) {
    myNotifications = myNotifications.filter(notification =>
      (notification.friendName && notification.friendName.toLowerCase().includes(searchTerm)) ||
      (notification.friendEmail && notification.friendEmail.toLowerCase().includes(searchTerm)) ||
      (notification.message && notification.message.toLowerCase().includes(searchTerm))
    );
  }

  // Update table with filtered results
  renderNotificationHistoryTable(myNotifications);
}

// Function to clear notification history
function clearNotificationHistory() {
  if (!account) {
    const storedAccount = localStorage.getItem('connectedAccount');
    if (storedAccount) {
      account = storedAccount;
    } else {
      showAlert("Please connect your wallet first", "warning");
      return;
    }
  }

  // Confirm before clearing
  if (!confirm("Are you sure you want to clear your notification history? This action cannot be undone.")) {
    return;
  }

  // Get all notifications
  const allNotifications = DB.notifications.getAll();

  // Filter out notifications for current borrower
  const otherNotifications = allNotifications.filter(notification => notification.borrowerAddress !== account);

  // Save filtered notifications back to localStorage
  localStorage.setItem('loanchain_notifications', JSON.stringify(otherNotifications));

  // Update local array
  notificationHistory = DB.notifications.getAll();

  // Update notification history table
  updateNotificationHistoryTable();

  showAlert("Notification history cleared successfully", "success");
}

// Function to render the notification history table with given data
function renderNotificationHistoryTable(notificationsList) {
  const tableBody = document.getElementById('notification-history-table');
  if (!tableBody) return;

  if (notificationsList.length === 0) {
    tableBody.innerHTML = '<tr><td colspan="5">No notifications found matching your criteria</td></tr>';

    // Update notification count
    const notificationCountEl = document.getElementById('notification-count');
    if (notificationCountEl) {
      notificationCountEl.textContent = '0';
    }

    // Update total notifications count
    const totalNotificationsCountEl = document.getElementById('total-notifications-count');
    if (totalNotificationsCountEl) {
      totalNotificationsCountEl.textContent = '0';
    }

    // Update last notification date
    const lastNotificationDateEl = document.getElementById('last-notification-date');
    if (lastNotificationDateEl) {
      lastNotificationDateEl.textContent = 'Never';
    }

    return;
  }

  tableBody.innerHTML = '';

  // Sort notifications by date (newest first)
  notificationsList.sort((a, b) => b.timestamp - a.timestamp);

  notificationsList.forEach(notification => {
    const date = new Date(notification.timestamp).toLocaleString();
    const row = document.createElement('tr');

    // Determine status class
    let statusClass = 'status-pending';
    if (notification.status === 'sent') {
      statusClass = 'status-approved';
    } else if (notification.status === 'failed') {
      statusClass = 'status-rejected';
    }

    row.innerHTML = `
      <td>${date}</td>
      <td>${notification.friendName || 'Unknown'}</td>
      <td>${notification.friendEmail || 'Unknown'}</td>
      <td>${notification.message || 'No message'}</td>
      <td><span class="status-tag ${statusClass}">${notification.status}</span></td>
    `;
    tableBody.appendChild(row);
  });

  // Update notification count
  const notificationCountEl = document.getElementById('notification-count');
  if (notificationCountEl) {
    notificationCountEl.textContent = notificationsList.length;
  }

  // Update total notifications count
  const totalNotificationsCountEl = document.getElementById('total-notifications-count');
  if (totalNotificationsCountEl) {
    totalNotificationsCountEl.textContent = notificationsList.length;
  }

  // Update last notification date
  const lastNotificationDateEl = document.getElementById('last-notification-date');
  if (lastNotificationDateEl && notificationsList.length > 0) {
    const lastDate = new Date(notificationsList[0].timestamp).toLocaleDateString();
    lastNotificationDateEl.textContent = lastDate;
  }
}

// Function to update notification history table
function updateNotificationHistoryTable() {
  // Check if wallet is connected
  if (!account) {
    const storedAccount = localStorage.getItem('connectedAccount');
    if (storedAccount) {
      account = storedAccount;
    }
  }

  // Get notifications from database for current borrower
  const myNotifications = account
    ? DB.notifications.getByBorrower(account)
    : DB.notifications.getAll();

  // Render the table
  renderNotificationHistoryTable(myNotifications);

  // Reset search
  const searchInput = document.getElementById('notification-search');
  if (searchInput) searchInput.value = '';
}

// Function to send notification to a friend about delayed repayment
function notifyFriendAboutDelayedRepayment(friendId, loanAmount, dueDate) {
  // Check if wallet is connected
  if (!account) {
    const storedAccount = localStorage.getItem('connectedAccount');
    if (storedAccount) {
      account = storedAccount;
    } else {
      console.error("Wallet not connected");
      return { success: false, message: "Wallet not connected" };
    }
  }

  // Get friend from database
  const friend = DB.friends.getById(friendId);

  if (!friend) {
    console.error("Friend not found");
    return { success: false, message: "Friend not found" };
  }

  // Check if friend belongs to current borrower
  if (friend.borrowerAddress !== account) {
    console.error("Friend does not belong to current borrower");
    return { success: false, message: "Friend does not belong to current borrower" };
  }

  const message = `Your friend's loan repayment of ${loanAmount} EDU due on ${dueDate} is delayed.`;

  // In a real application, this would send an actual email or notification
  // For this demo, we'll just log it and add to notification history
  console.log(`Sending notification to ${friend.name} (${friend.email}): ${message}`);

  // Add to notification history
  const notification = {
    id: Date.now().toString(),
    timestamp: Date.now(),
    borrowerAddress: account,
    friendId: friend.id,
    friendName: friend.name,
    friendEmail: friend.email,
    message: message,
    status: 'sent', // In a real app, this would be 'pending' until confirmed
    loanAmount,
    dueDate
  };

  // Add to database
  DB.notifications.add(notification);

  // Update local array
  notificationHistory = DB.notifications.getAll();

  // Update notification history table
  updateNotificationHistoryTable();

  return { success: true, message: `Notification sent to ${friend.name}` };
}

// Function to notify all friends about delayed repayment
function notifyAllFriendsAboutDelayedRepayment(loanAmount, dueDate) {
  // Check if wallet is connected
  if (!account) {
    const storedAccount = localStorage.getItem('connectedAccount');
    if (storedAccount) {
      account = storedAccount;
    } else {
      return { success: false, message: "Wallet not connected" };
    }
  }

  // Get friends from database for current borrower
  const myFriends = DB.friends.getByBorrower(account);

  if (myFriends.length === 0) {
    return { success: false, message: "No friends to notify" };
  }

  // Only notify active friends
  const activeFriends = myFriends.filter(friend => friend.status === 'active');

  if (activeFriends.length === 0) {
    return { success: false, message: "No active friends to notify" };
  }

  const results = [];

  activeFriends.forEach(friend => {
    const result = notifyFriendAboutDelayedRepayment(friend.id, loanAmount, dueDate);
    results.push(result);
  });

  const successCount = results.filter(r => r.success).length;

  return {
    success: successCount > 0,
    message: `Notifications sent to ${successCount} out of ${activeFriends.length} friends`
  };
}

// Function to initialize the account
function initAccount() {
  const storedAccount = localStorage.getItem('connectedAccount');
  if (storedAccount) {
    account = storedAccount;

    // Update UI to show connected account
    const accountEl = document.getElementById('account');
    if (accountEl) {
      accountEl.innerText = shortenAddress(account);
      accountEl.className = 'status-tag status-approved';
    }

    // Update connect wallet button
    const connectBtn = document.getElementById('connect-wallet');
    if (connectBtn) {
      connectBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 6L9 17l-5-5"></path>
        </svg>
        Wallet Connected
      `;
      connectBtn.disabled = true;
    }

    // Update database references
    friends = DB.friends.getAll();
    notificationHistory = DB.notifications.getAll();
  }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
  initAccount();
  updateFriendsTable();
  updateNotificationHistoryTable();

  // Listen for wallet connection events
  window.addEventListener('walletConnected', function() {
    const storedAccount = localStorage.getItem('connectedAccount');
    if (storedAccount) {
      account = storedAccount;
      updateFriendsTable();
    }
  });
});

// Helper function to shorten addresses for display
function shortenAddress(address) {
  if (!address) return '';
  return address.substring(0, 6) + '...' + address.substring(address.length - 4);
}

// Helper function to show alerts
function showFriendAlert(message, type = 'info') {
  const alertBox = document.getElementById('alert-box');
  if (!alertBox) return;

  // Set alert type class
  let alertClass = 'alert-info';
  if (type === 'success') alertClass = 'alert-success';
  if (type === 'warning') alertClass = 'alert-warning';
  if (type === 'error') alertClass = 'alert-error';

  // Create alert content
  alertBox.className = `alert ${alertClass} show`;
  alertBox.innerHTML = message;

  // Auto-hide after 5 seconds
  setTimeout(() => {
    alertBox.className = 'alert';
  }, 5000);
}

// Use app.js showAlert if available, otherwise use our local version
function showAlert(message, type = 'info') {
  if (typeof window.showAlert === 'function') {
    window.showAlert(message, type);
  } else {
    showFriendAlert(message, type);
  }
}

// Expose functions to window
window.addFriend = addFriend;
window.removeFriend = removeFriend;
window.clearFriendForm = clearFriendForm;
window.toggleFriendStatus = toggleFriendStatus;
window.searchFriends = searchFriends;
window.filterFriends = filterFriends;
window.searchNotifications = searchNotifications;
window.clearNotificationHistory = clearNotificationHistory;
window.notifyFriendAboutDelayedRepayment = notifyFriendAboutDelayedRepayment;
window.notifyAllFriendsAboutDelayedRepayment = notifyAllFriendsAboutDelayedRepayment;
