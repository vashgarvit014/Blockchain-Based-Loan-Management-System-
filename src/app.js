import Web3 from 'web3';
import contractABI from './contractABI.json';
const web3 = new Web3(window.ethereum); // or new Web3(Web3.givenProvider);

const contractAddress = "0xd1e3D48B720928235fCCDae0631EcAc748434CcC";
let web3;
let contract;
let account;
let isConnected = false;

const eduChainConfig = {
  chainId: "0xa045c",
  chainName: "EDU Chain Testnet",
  rpcUrls: ["https://rpc.open-campus-codex.gelato.digital"],
  nativeCurrency: { name: "EDU", symbol: "EDU", decimals: 18 },
  blockExplorerUrls: ["https://opencampus-codex.blockscout.com"]
};

async function switchToEduChain() {
  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: eduChainConfig.chainId }]
    });
  } catch (err) {
    if (err.code === 4902) {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [eduChainConfig]
      });
    } else {
      console.error('Network switch failed:', err);
      throw err;
    }
  }
}

async function connectWallet() {
  if (!window.ethereum) return alert("Please install MetaMask.");

  // Show loading state
  const connectBtn = document.getElementById('connect-wallet');
  const originalBtnText = connectBtn.innerHTML;
  connectBtn.innerHTML = `
    <div class="spinner"></div>
    Connecting...
  `;
  connectBtn.disabled = true;

  try {
    await switchToEduChain();
    web3 = new Web3(window.ethereum);
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    account = accounts[0];
    contract = new web3.eth.Contract(contractABI, contractAddress);
    isConnected = true;
    localStorage.setItem('connectedAccount', account);

    document.getElementById('account').innerText = account;
    const admin = await contract.methods.admin().call();
    document.getElementById('admin').innerText = admin;

    connectBtn.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M20 6L9 17l-5-5"></path>
      </svg>
      Wallet Connected
    `;
    connectBtn.disabled = true;

    // Update stats
    await updateStats();

    // Show success message
    showAlert('Wallet connected successfully!', 'success');

    // Dispatch wallet connected event
    window.dispatchEvent(new Event('walletConnected'));
  } catch (err) {
    console.error("Wallet connection failed:", err);
    connectBtn.innerHTML = originalBtnText;
    connectBtn.disabled = false;
    showAlert(`Connection failed: ${err.message}`, 'error');
  }
}

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

async function init() {
  if (!window.ethereum) return;
  web3 = new Web3(window.ethereum);
  const storedAccount = localStorage.getItem('connectedAccount');
  if (!storedAccount) return;

  const accounts = await web3.eth.getAccounts();
  if (accounts[0]?.toLowerCase() === storedAccount.toLowerCase()) {
    account = accounts[0];
    contract = new web3.eth.Contract(contractABI, contractAddress);
    isConnected = true;

    document.getElementById('account').innerText = account;
    document.getElementById('connect-wallet').innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M20 6L9 17l-5-5"></path>
      </svg>
      Wallet Connected
    `;
    document.getElementById('connect-wallet').disabled = true;

    const admin = await contract.methods.admin().call();
    document.getElementById('admin').innerText = admin;

    // Update stats if elements exist
    await updateStats();

    // Dispatch wallet connected event
    window.dispatchEvent(new Event('walletConnected'));
  }
}

async function updateStats() {
  if (!isConnected) return;

  try {
    // Update total loans count
    const loans = await contract.methods.getAllLoanRequests().call();
    const totalLoansElements = document.querySelectorAll('#total-loans, #admin-total-loans');
    totalLoansElements.forEach(el => {
      if (el) el.innerText = loans.length;
    });

    // Update total lent
    const totalLent = await contract.methods.totalLent().call();
    const totalLentEdu = web3.utils.fromWei(totalLent, 'ether');
    const totalLentElements = document.querySelectorAll('#total-lent, #admin-total-lent');
    totalLentElements.forEach(el => {
      if (el) el.innerText = parseFloat(totalLentEdu).toFixed(2);
    });

    // Update contract balance if on admin page
    const contractBalanceEl = document.getElementById('admin-contract-balance');
    if (contractBalanceEl) {
      const balance = await web3.eth.getBalance(contractAddress);
      const balanceEdu = web3.utils.fromWei(balance, 'ether');
      contractBalanceEl.innerText = parseFloat(balanceEdu).toFixed(2);
    }
  } catch (err) {
    console.error("Error updating stats:", err);
  }
}

function checkConnection() {
  if (!isConnected) {
    alert('Please connect your wallet first.');
    return false;
  }
  return true;
}

// ================== Contract Functions ==================

async function requestLoan() {
  if (!checkConnection()) return;
  const amount = document.getElementById('loan-amount').value;
  if (!amount || isNaN(amount) || Number(amount) <= 0) {
    showAlert("Please enter a valid loan amount", "warning");
    return;
  }

  // Show loading state
  const requestBtn = document.querySelector('button[onclick="requestLoan()"]');
  const originalBtnText = requestBtn.innerHTML;
  requestBtn.innerHTML = `<div class="spinner"></div> Processing...`;
  requestBtn.disabled = true;

  // Show status container
  const statusContainer = document.getElementById('request-status-container');
  if (statusContainer) statusContainer.classList.remove('hidden');

  const wei = web3.utils.toWei(amount, 'ether');
  try {
    const gas = await contract.methods.requestLoan(wei).estimateGas({ from: account });
    await contract.methods.requestLoan(wei).send({ from: account, gas });

    const statusEl = document.getElementById('request-status');
    if (statusEl) {
      statusEl.innerText = `Loan requested: ${amount} EDU`;
      statusEl.className = 'status-tag status-approved';
    }

    showAlert(`Successfully requested loan of ${amount} EDU`, 'success');

    // Update stats
    await updateStats();
  } catch (err) {
    console.error("Error requesting loan:", err);

    const statusEl = document.getElementById('request-status');
    if (statusEl) {
      statusEl.innerText = `Error: ${err.message}`;
      statusEl.className = 'status-tag status-rejected';
    }

    showAlert(`Failed to request loan: ${err.message}`, 'error');
  } finally {
    // Restore button
    requestBtn.innerHTML = originalBtnText;
    requestBtn.disabled = false;
  }
}

async function repayLoan() {
  if (!checkConnection()) return;
  const amount = document.getElementById('repay-amount').value;
  if (!amount || isNaN(amount) || Number(amount) <= 0) {
    showAlert("Please enter a valid repayment amount", "warning");
    return;
  }

  // Show loading state
  const repayBtn = document.querySelector('button[onclick="repayLoan()"]');
  const originalBtnText = repayBtn.innerHTML;
  repayBtn.innerHTML = `<div class="spinner"></div> Processing...`;
  repayBtn.disabled = true;

  // Show status container
  const statusContainer = document.getElementById('repay-status-container');
  if (statusContainer) statusContainer.classList.remove('hidden');

  const wei = web3.utils.toWei(amount, 'ether');
  try {
    const gas = await contract.methods.repayLoan().estimateGas({ from: account, value: wei });
    await contract.methods.repayLoan().send({ from: account, value: wei, gas });

    const statusEl = document.getElementById('repay-status');
    if (statusEl) {
      statusEl.innerText = `Loan repaid: ${amount} EDU`;
      statusEl.className = 'status-tag status-approved';
    }

    showAlert(`Successfully repaid loan with ${amount} EDU`, 'success');

    // Update stats
    await updateStats();
  } catch (err) {
    console.error("Error repaying loan:", err);

    const statusEl = document.getElementById('repay-status');
    if (statusEl) {
      statusEl.innerText = `Error: ${err.message}`;
      statusEl.className = 'status-tag status-rejected';
    }

    showAlert(`Failed to repay loan: ${err.message}`, 'error');
  } finally {
    // Restore button
    repayBtn.innerHTML = originalBtnText;
    repayBtn.disabled = false;
  }
}

async function fundContract() {
  if (!checkConnection()) return;
  const amount = document.getElementById('fund-amount').value;
  if (!amount || isNaN(amount) || Number(amount) <= 0) {
    showAlert("Please enter a valid funding amount", "warning");
    return;
  }

  // Show loading state
  const fundBtn = document.querySelector('button[onclick="fundContract()"]');
  const originalBtnText = fundBtn.innerHTML;
  fundBtn.innerHTML = `<div class="spinner"></div> Processing...`;
  fundBtn.disabled = true;

  // Show status container
  const statusContainer = document.getElementById('fund-status-container');
  if (statusContainer) statusContainer.classList.remove('hidden');

  const wei = web3.utils.toWei(amount, 'ether');
  try {
    const admin = await contract.methods.admin().call();
    if (admin.toLowerCase() !== account.toLowerCase()) throw new Error("Only admin can fund the contract");

    const gas = await contract.methods.fundContract().estimateGas({ from: account, value: wei });
    await contract.methods.fundContract().send({ from: account, value: wei, gas });

    const statusEl = document.getElementById('fund-status');
    if (statusEl) {
      statusEl.innerText = `Funded contract with ${amount} EDU`;
      statusEl.className = 'status-tag status-approved';
    }

    showAlert(`Successfully funded contract with ${amount} EDU`, 'success');

    // Update stats
    await updateStats();
  } catch (err) {
    console.error("Error funding contract:", err);

    const statusEl = document.getElementById('fund-status');
    if (statusEl) {
      statusEl.innerText = `Error: ${err.message}`;
      statusEl.className = 'status-tag status-rejected';
    }

    showAlert(`Failed to fund contract: ${err.message}`, 'error');
  } finally {
    // Restore button
    fundBtn.innerHTML = originalBtnText;
    fundBtn.disabled = false;
  }
}

async function approveLoan() {
  if (!checkConnection()) return;
  const loanId = document.getElementById('loan-id').value;
  if (!loanId || isNaN(loanId)) {
    showAlert("Please enter a valid loan ID", "warning");
    return;
  }

  // Show loading state
  const approveBtn = document.querySelector('button[onclick="approveLoan()"]');
  const originalBtnText = approveBtn.innerHTML;
  approveBtn.innerHTML = `<div class="spinner"></div> Processing...`;
  approveBtn.disabled = true;

  // Show status container
  const statusContainer = document.getElementById('approve-status-container');
  if (statusContainer) statusContainer.classList.remove('hidden');

  try {
    const gas = await contract.methods.approveLoan(loanId).estimateGas({ from: account });
    await contract.methods.approveLoan(loanId).send({ from: account, gas });

    const statusEl = document.getElementById('approve-status');
    if (statusEl) {
      statusEl.innerText = `Loan ${loanId} approved`;
      statusEl.className = 'status-tag status-approved';
    }

    showAlert(`Successfully approved loan #${loanId}`, 'success');

    // Update stats
    await updateStats();
  } catch (err) {
    console.error("Error approving loan:", err);

    const statusEl = document.getElementById('approve-status');
    if (statusEl) {
      statusEl.innerText = `Error: ${err.message}`;
      statusEl.className = 'status-tag status-rejected';
    }

    showAlert(`Failed to approve loan: ${err.message}`, 'error');
  } finally {
    // Restore button
    approveBtn.innerHTML = originalBtnText;
    approveBtn.disabled = false;
  }
}

async function withdrawFunds() {
  if (!checkConnection()) return;
  const amount = document.getElementById('withdraw-amount').value;
  if (!amount || isNaN(amount) || Number(amount) <= 0) {
    showAlert("Please enter a valid withdrawal amount", "warning");
    return;
  }

  // Show loading state
  const withdrawBtn = document.querySelector('button[onclick="withdrawFunds()"]');
  const originalBtnText = withdrawBtn.innerHTML;
  withdrawBtn.innerHTML = `<div class="spinner"></div> Processing...`;
  withdrawBtn.disabled = true;

  // Show status container
  const statusContainer = document.getElementById('withdraw-status-container');
  if (statusContainer) statusContainer.classList.remove('hidden');

  const wei = web3.utils.toWei(amount, 'ether');
  try {
    const gas = await contract.methods.withdrawFunds(wei).estimateGas({ from: account });
    await contract.methods.withdrawFunds(wei).send({ from: account, gas });

    const statusEl = document.getElementById('withdraw-status');
    if (statusEl) {
      statusEl.innerText = `Withdrew ${amount} EDU`;
      statusEl.className = 'status-tag status-approved';
    }

    showAlert(`Successfully withdrew ${amount} EDU`, 'success');

    // Update stats
    await updateStats();
  } catch (err) {
    console.error("Error withdrawing funds:", err);

    const statusEl = document.getElementById('withdraw-status');
    if (statusEl) {
      statusEl.innerText = `Error: ${err.message}`;
      statusEl.className = 'status-tag status-rejected';
    }

    showAlert(`Failed to withdraw funds: ${err.message}`, 'error');
  } finally {
    // Restore button
    withdrawBtn.innerHTML = originalBtnText;
    withdrawBtn.disabled = false;
  }
}

async function checkLoanStatus() {
  if (!checkConnection()) return;

  // Show loading state
  const statusContainer = document.getElementById('loan-status-container');
  if (statusContainer) statusContainer.classList.remove('hidden');

  const statusTable = document.getElementById('loan-status-table');
  if (statusTable) {
    statusTable.innerHTML = `
      <tr>
        <td colspan="4" class="text-center">
          <div class="spinner"></div>
          Loading loan status...
        </td>
      </tr>
    `;
  }

  try {
    const result = await contract.methods.getLoanStatus(account).call();
    const [loanId, amount, approved, repaid, timestamp] = Object.values(result);
    const edu = web3.utils.fromWei(amount, 'ether');
    const time = new Date(Number(timestamp) * 1000).toLocaleString();

    // Determine status class
    let statusClass = 'status-pending';
    let statusText = 'Pending';

    if (repaid) {
      statusClass = 'status-repaid';
      statusText = 'Repaid';
    } else if (approved) {
      statusClass = 'status-approved';
      statusText = 'Approved';
    }

    // Update table if it exists
    if (statusTable) {
      statusTable.innerHTML = `
        <tr>
          <td>${loanId}</td>
          <td>${parseFloat(edu).toFixed(2)} EDU</td>
          <td><span class="status-tag ${statusClass}">${statusText}</span></td>
          <td>${time}</td>
        </tr>
      `;
    } else {
      // Fallback to old display
      const statusEl = document.getElementById('loan-status');
      if (statusEl) {
        statusEl.innerText = `Loan ID: ${loanId}, Amount: ${edu} EDU, Approved: ${approved}, Repaid: ${repaid}, Timestamp: ${time}`;
        statusEl.style.color = '';
      }
    }

    showAlert('Loan status retrieved successfully', 'success');
  } catch (err) {
    console.error("Error checking loan status:", err);

    if (statusTable) {
      statusTable.innerHTML = `
        <tr>
          <td colspan="4" class="text-center">Error: ${err.message}</td>
        </tr>
      `;
    } else {
      const statusEl = document.getElementById('loan-status');
      if (statusEl) {
        statusEl.innerText = `Error: ${err.message}`;
        statusEl.style.color = 'red';
      }
    }

    showAlert(`Failed to check loan status: ${err.message}`, 'error');
  }
}

async function checkExistingLoan() {
  if (!checkConnection()) return;

  // Show loading state
  const statusContainer = document.getElementById('loan-status-container');
  if (statusContainer) statusContainer.classList.remove('hidden');

  const statusTable = document.getElementById('loan-status-table');
  if (statusTable) {
    statusTable.innerHTML = `
      <tr>
        <td colspan="4" class="text-center">
          <div class="spinner"></div>
          Loading loan details...
        </td>
      </tr>
    `;
  }

  try {
    const loanId = await contract.methods.borrowerToLoanId(account).call();
    const loan = await contract.methods.getLoanById(loanId).call();
    const amount = web3.utils.fromWei(loan.amount, 'ether');
    const time = new Date(Number(loan.timestamp) * 1000).toLocaleString();

    // Determine status class
    let statusClass = 'status-pending';
    let statusText = 'Pending';

    if (loan.repaid) {
      statusClass = 'status-repaid';
      statusText = 'Repaid';
    } else if (loan.approved) {
      statusClass = 'status-approved';
      statusText = 'Approved';
    }

    // Update table if it exists
    if (statusTable) {
      statusTable.innerHTML = `
        <tr>
          <td>${loanId}</td>
          <td>${parseFloat(amount).toFixed(2)} EDU</td>
          <td><span class="status-tag ${statusClass}">${statusText}</span></td>
          <td>${time}</td>
        </tr>
      `;
    } else {
      // Fallback to old display
      const statusEl = document.getElementById('loan-status');
      if (statusEl) {
        statusEl.innerText = `Existing Loan - ID: ${loanId}, Borrower: ${loan.borrower}, Amount: ${amount} EDU, Approved: ${loan.approved}, Repaid: ${loan.repaid}, Timestamp: ${time}`;
        statusEl.style.color = '';
      }
    }

    showAlert('Loan details retrieved successfully', 'success');
  } catch (err) {
    console.error("Error checking existing loan:", err);

    if (statusTable) {
      statusTable.innerHTML = `
        <tr>
          <td colspan="4" class="text-center">Error: ${err.message}</td>
        </tr>
      `;
    } else {
      const statusEl = document.getElementById('loan-status');
      if (statusEl) {
        statusEl.innerText = `Error: ${err.message}`;
        statusEl.style.color = 'red';
      }
    }

    showAlert(`Failed to check existing loan: ${err.message}`, 'error');
  }
}

async function getLoanById() {
  if (!checkConnection()) return;
  const loanId = document.getElementById('loan-id-query').value;
  if (!loanId || isNaN(loanId)) return alert("Invalid loan ID");
  try {
    const loan = await contract.methods.getLoanById(loanId).call();
    const amount = web3.utils.fromWei(loan.amount, 'ether');
    const time = new Date(Number(loan.timestamp) * 1000).toLocaleString();
    const info = `Loan ID: ${loanId}, Borrower: ${loan.borrower}, Amount: ${amount} EDU, Approved: ${loan.approved}, Repaid: ${loan.repaid}, Timestamp: ${time}`;
    document.getElementById('loan-by-id-result').innerText = info;
  } catch (err) {
    document.getElementById('loan-by-id-result').innerText = `Error: ${err.message}`;
  }
}

async function getAllLoans() {
  if (!checkConnection()) return;

  // Show loading state
  const loansTableBody = document.getElementById('all-loans-table');
  if (loansTableBody) {
    loansTableBody.innerHTML = `
      <tr>
        <td colspan="5" class="text-center">
          <div class="spinner"></div>
          Loading loans...
        </td>
      </tr>
    `;
  }

  try {
    const loans = await contract.methods.getAllLoanRequests().call();

    // Update the old container for backward compatibility
    const oldContainer = document.getElementById('all-loans');
    if (oldContainer) {
      oldContainer.innerHTML = '';
      if (!loans.length) {
        oldContainer.innerHTML = '<p>No loans found.</p>';
      }
    }

    // Update the table if it exists
    if (loansTableBody) {
      if (!loans.length) {
        loansTableBody.innerHTML = `
          <tr>
            <td colspan="5" class="text-center">No loans found.</td>
          </tr>
        `;
        return;
      }

      loansTableBody.innerHTML = '';
      loans.forEach((loan, i) => {
        const edu = web3.utils.fromWei(loan.amount, 'ether');
        const date = new Date(Number(loan.timestamp) * 1000).toLocaleString();

        // Determine status class
        let statusClass = 'status-pending';
        let statusText = 'Pending';

        if (loan.repaid) {
          statusClass = 'status-repaid';
          statusText = 'Repaid';
        } else if (loan.approved) {
          statusClass = 'status-approved';
          statusText = 'Approved';
        }

        // Create table row
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${i}</td>
          <td>${shortenAddress(loan.borrower)}</td>
          <td>${parseFloat(edu).toFixed(2)} EDU</td>
          <td><span class="status-tag ${statusClass}">${statusText}</span></td>
          <td>${date}</td>
        `;
        loansTableBody.appendChild(row);
      });
    } else if (oldContainer) {
      // Fallback to old display method
      loans.forEach((loan, i) => {
        const edu = web3.utils.fromWei(loan.amount, 'ether');
        const date = new Date(Number(loan.timestamp) * 1000).toLocaleString();
        const p = document.createElement('p');
        p.innerText = `Loan ${i}: Borrower: ${loan.borrower}, Amount: ${edu} EDU, Approved: ${loan.approved}, Repaid: ${loan.repaid}, Timestamp: ${date}`;
        oldContainer.appendChild(p);
      });
    }

    // Update stats after fetching loans
    await updateStats();

  } catch (err) {
    console.error("Error fetching loans:", err);
    if (loansTableBody) {
      loansTableBody.innerHTML = `
        <tr>
          <td colspan="5" class="text-center">Error: ${err.message}</td>
        </tr>
      `;
    }
    if (document.getElementById('all-loans')) {
      document.getElementById('all-loans').innerHTML = `<p>Error: ${err.message}</p>`;
    }
    showAlert(`Failed to fetch loans: ${err.message}`, 'error');
  }
}

// Helper function to shorten addresses for display
function shortenAddress(address) {
  if (!address) return '';
  return address.substring(0, 6) + '...' + address.substring(address.length - 4);
}

// ================== Expose to Window ==================

window.connectWallet = connectWallet;
window.requestLoan = requestLoan;
window.repayLoan = repayLoan;
window.fundContract = fundContract;
window.approveLoan = approveLoan;
window.withdrawFunds = withdrawFunds;
window.checkLoanStatus = checkLoanStatus;
window.checkExistingLoan = checkExistingLoan;
window.getLoanById = getLoanById;
window.getAllLoans = getAllLoans;
window.showAlert = showAlert;

window.addEventListener('load', init);
// Add loan repayment delay notification functionality

// Function to check if a loan repayment is delayed
async function checkLoanRepaymentDelay() {
  if (!checkConnection()) return;

  try {
    // Get the loan status
    const result = await contract.methods.getLoanStatus(account).call();
    const [loanId, amount, approved, repaid, timestamp] = Object.values(result);

    // If loan is already repaid or not approved, no need to check for delay
    if (repaid || !approved) {
      return { delayed: false };
    }

    const loanDate = new Date(Number(timestamp) * 1000);
    const currentDate = new Date();

    // Calculate due date (for demo purposes, assume 30 days from loan approval)
    const dueDate = new Date(loanDate);
    dueDate.setDate(dueDate.getDate() + 30);

    // Check if current date is past due date
    const isDelayed = currentDate > dueDate;

    if (isDelayed) {
      const edu = web3.utils.fromWei(amount, 'ether');
      return {
        delayed: true,
        loanId,
        amount: edu,
        dueDate: dueDate.toLocaleDateString(),
        daysPastDue: Math.floor((currentDate - dueDate) / (1000 * 60 * 60 * 24))
      };
    }

    return { delayed: false };
  } catch (err) {
    console.error("Error checking loan repayment delay:", err);
    return { delayed: false, error: err.message };
  }
}

// Function to notify friends about delayed repayment
async function notifyFriendsAboutDelayedRepayment() {
  if (!checkConnection()) return;

  // Show loading state
  const notifyBtn = document.querySelector('button[onclick="notifyFriendsAboutDelayedRepayment()"]');
  if (notifyBtn) {
    const originalBtnText = notifyBtn.innerHTML;
    notifyBtn.innerHTML = `<div class="spinner"></div> Notifying...`;
    notifyBtn.disabled = true;

    try {
      // Check if repayment is delayed
      const delayInfo = await checkLoanRepaymentDelay();

      if (!delayInfo.delayed) {
        showAlert("Your loan repayment is not delayed", "info");
        notifyBtn.innerHTML = originalBtnText;
        notifyBtn.disabled = false;
        return;
      }

      // Check if we have the notifyAllFriendsAboutDelayedRepayment function
      if (typeof window.notifyAllFriendsAboutDelayedRepayment !== 'function') {
        showAlert("Friend notification system not available", "error");
        notifyBtn.innerHTML = originalBtnText;
        notifyBtn.disabled = false;
        return;
      }

      // Notify all friends
      const result = window.notifyAllFriendsAboutDelayedRepayment(
        delayInfo.amount,
        delayInfo.dueDate
      );

      if (result.success) {
        showAlert(result.message, "success");
      } else {
        showAlert(result.message, "warning");
      }
    } catch (err) {
      console.error("Error notifying friends:", err);
      showAlert(`Failed to notify friends: ${err.message}`, "error");
    } finally {
      notifyBtn.innerHTML = originalBtnText;
      notifyBtn.disabled = false;
    }
  }
}

// Expose to window
window.checkLoanRepaymentDelay = checkLoanRepaymentDelay;
window.notifyFriendsAboutDelayedRepayment = notifyFriendsAboutDelayedRepayment;