// Simplified app.js without npm dependencies
// This file replaces the original app.js with a version that doesn't use imports

// Mock contract ABI (simplified version)
const contractABI = [
  {
    "inputs": [],
    "name": "admin",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getAllLoanRequests",
    "outputs": [{"components": [{"internalType": "uint256", "name": "id", "type": "uint256"}, {"internalType": "address", "name": "borrower", "type": "address"}, {"internalType": "uint256", "name": "amount", "type": "uint256"}, {"internalType": "bool", "name": "approved", "type": "bool"}, {"internalType": "bool", "name": "repaid", "type": "bool"}, {"internalType": "uint256", "name": "timestamp", "type": "uint256"}], "internalType": "struct LoanContract.Loan[]", "name": "", "type": "tuple[]"}],
    "stateMutability": "view",
    "type": "function"
  }
];

const contractAddress = "0xd1e3D48B720928235fCCDae0631EcAc748434CcC";
let web3;
let contract;
let account;
let isConnected = false;

// Mock Web3 for testing without npm
class MockWeb3 {
  constructor() {
    this.eth = {
      getAccounts: async () => {
        return ["0x123456789012345678901234567890123456789"];
      },
      getBalance: async () => {
        return "1000000000000000000"; // 1 ETH in wei
      },
      Contract: function(abi, address) {
        return {
          methods: {
            admin: () => ({
              call: async () => "0x123456789012345678901234567890123456789"
            }),
            getAllLoanRequests: () => ({
              call: async () => []
            }),
            totalLent: () => ({
              call: async () => "5000000000000000000" // 5 ETH in wei
            })
          }
        };
      }
    };
    this.utils = {
      fromWei: (wei, unit) => {
        if (unit === 'ether') {
          return (parseInt(wei) / 1000000000000000000).toString();
        }
        return wei;
      },
      toWei: (eth, unit) => {
        if (unit === 'ether') {
          return (parseFloat(eth) * 1000000000000000000).toString();
        }
        return eth;
      }
    };
  }
}

// Mock ethereum provider for testing
const mockEthereum = {
  request: async ({ method, params }) => {
    if (method === 'eth_requestAccounts') {
      return ["0x123456789012345678901234567890123456789"];
    }
    if (method === 'wallet_switchEthereumChain') {
      return null;
    }
    if (method === 'wallet_addEthereumChain') {
      return null;
    }
    return null;
  }
};

// Use mock ethereum if window.ethereum is not available
if (!window.ethereum) {
  window.ethereum = mockEthereum;
}

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
  if (!window.ethereum) {
    showAlert("Please install MetaMask or use a Web3 browser.", "warning");
    
    // For testing without MetaMask, create a mock connection
    web3 = new MockWeb3();
    account = "0x123456789012345678901234567890123456789";
    isConnected = true;
    localStorage.setItem('connectedAccount', account);
    
    document.getElementById('account').innerText = account;
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
    
    showAlert('Mock wallet connected for testing!', 'success');
    
    // Dispatch wallet connected event
    window.dispatchEvent(new Event('walletConnected'));
    
    return;
  }

  // Show loading state
  const connectBtn = document.getElementById('connect-wallet');
  const originalBtnText = connectBtn ? connectBtn.innerHTML : '';
  if (connectBtn) {
    connectBtn.innerHTML = `
      <div class="spinner"></div>
      Connecting...
    `;
    connectBtn.disabled = true;
  }

  try {
    await switchToEduChain();
    
    // Use the real Web3 if available
    if (window.Web3) {
      web3 = new Web3(window.ethereum);
    } else {
      // Fallback to mock Web3
      web3 = new MockWeb3();
    }
    
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    account = accounts[0];
    
    // Create contract instance if Web3 is available
    if (window.Web3) {
      contract = new web3.eth.Contract(contractABI, contractAddress);
    }
    
    isConnected = true;
    localStorage.setItem('connectedAccount', account);

    const accountEl = document.getElementById('account');
    if (accountEl) {
      accountEl.innerText = account;
    }
    
    if (connectBtn) {
      connectBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 6L9 17l-5-5"></path>
        </svg>
        Wallet Connected
      `;
      connectBtn.disabled = true;
    }

    // Show success message
    showAlert('Wallet connected successfully!', 'success');

    // Dispatch wallet connected event
    window.dispatchEvent(new Event('walletConnected'));
  } catch (err) {
    console.error("Wallet connection failed:", err);
    if (connectBtn) {
      connectBtn.innerHTML = originalBtnText;
      connectBtn.disabled = false;
    }
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
  if (!window.ethereum && !window.Web3) {
    console.log("No Web3 provider detected, using mock data");
    web3 = new MockWeb3();
  } else if (window.ethereum) {
    web3 = new Web3(window.ethereum);
  }
  
  const storedAccount = localStorage.getItem('connectedAccount');
  if (!storedAccount) return;

  try {
    const accounts = await web3.eth.getAccounts();
    if (accounts[0]?.toLowerCase() === storedAccount.toLowerCase()) {
      account = accounts[0];
      contract = new web3.eth.Contract(contractABI, contractAddress);
      isConnected = true;

      const accountEl = document.getElementById('account');
      if (accountEl) {
        accountEl.innerText = account;
      }
      
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

      // Dispatch wallet connected event
      window.dispatchEvent(new Event('walletConnected'));
    }
  } catch (err) {
    console.error("Error initializing:", err);
  }
}

// Check if loan repayment is delayed
async function checkLoanRepaymentDelay() {
  if (!isConnected) {
    return { error: "Wallet not connected" };
  }
  
  // For demo purposes, return mock data
  return {
    delayed: true,
    amount: "5.0",
    dueDate: "2023-12-01",
    daysPastDue: 30
  };
}

// Make functions available globally
window.connectWallet = connectWallet;
window.showAlert = showAlert;
window.checkLoanRepaymentDelay = checkLoanRepaymentDelay;

// Initialize on page load
document.addEventListener('DOMContentLoaded', init);
