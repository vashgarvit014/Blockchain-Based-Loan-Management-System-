
# 💰 Blockchain-Based Loan Management System

> A decentralized platform to manage loans securely, transparently, and efficiently using Ethereum smart contracts, MetaMask, and a dark-themed frontend.
---

## 🧠 Project Overview

This system allows:
- 📥 Customers to request loans
- ✅ Admins to approve them
- 🛡️ Guarantors to verify repayment

All interactions are verified and stored immutably on the blockchain. MetaMask ensures seamless user authentication and transaction handling.

---

## 🛠 Tech Stack

- **Smart Contracts:** Solidity
- **Blockchain Network:** Ethereum Testnet (e.g., Sepolia)
- **Frontend:** HTML, CSS (Dark Theme), JavaScript
- **Wallet:** MetaMask
- **Web3 Integration:** Ethers.js / Web3.js

---

## 🧾 Smart Contract Functions

| Function Name         | Description                             |
|-----------------------|-----------------------------------------|
| `requestLoan()`       | Customer requests a loan                |
| `approveLoan()`       | Admin approves a loan                   |
| `repayLoan()`         | Customer repays loan                    |
| `verifyRepayment()`   | Guarantor verifies the repayment        |
| `getLoanStatus()`     | Fetch current loan details              |

---

## ⚙️ Installation

### Prerequisites

- [Node.js](https://nodejs.org/)
- [MetaMask](https://metamask.io/)
- [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer)

---

### Setup Steps


	1.	Deploy LoanManagement.sol via Remix
	2.	Copy the contract address and ABI
	3.	Paste it into app.js
	4.	Run frontend using LocalHost
### FolderStructure
loan-management-dapp/
├── contracts/
│   └── LoanManagement.sol
├── frontend/
│   ├── index.html
│   ├── admin.html
│   ├── customer.html
│   ├── guarantor.html
│   ├── css/
│   │   └── styles.css
│   └── js/
│       └── app.js
├── assets/
│   └── screenshots/
└── README.md


### 📈 Roadmap / Future Enhancements
	•	📲 Mobile Optimization
	•	📊 Analytics Dashboard for Admin
	•	🔐 Chainlink Oracle for Interest Rates
	•	🆔 NFT Loan Certificates
	•	🔎 Enhanced Credit Score Logic
 
