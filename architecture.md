## Project Architecture

![img_20170502_205435](https://cloud.githubusercontent.com/assets/1767009/26088239/375dc9a8-39b3-11e7-8f56-75f6c94df14e.jpg)

### Solidity contracts

#### ServiceProviderCentralBank.sol

* .donate(int amount) - Records a donor donation and creates virtual DUST (Distributed giving Usd Tokens)
* .recordMerchantReimbursement(address merchantAdress, int amount) - reduces total minted DUST to represent merchant reimbursement
* .endowClient(address clientAddress, int amount)
* .availableBalance(address clientAddress) - determines available DUST based on endowment rules
* .transact(address merchantAddress, int amount) - used by ClientApp to pay for goods/services
* .bankAccountBalance() reports total minted DUST minus burned dust

### Client App

* Provides Client Auth (maybe not necessary if we use Token App)
* Provides UI for Client to track DUST
* Provides UI for Client to send DUST to Vendor

### POS App

* Listens to the merchant's deposit address and displays a message when receiving tokens
* Shows a ledger of transactions

### Blockchain Proxy Server Web App

* Provides reporting for Client App (balance information, transaction history, e.g. mobile banking app api)
* Provides Client App tx relaying (maybe not necessary depending on Token App functionality)
* Provides blockchain notification services for the POS App
* Provides reporting for POS App (transaction history, reimbursements)

### CentralBank Local Storage

* The architecture will need some solution to store event logs in a queryable format to support Transaction Reporting

### Admin Parity Dapp

* Provides UI to interact with ServiceProviderCentralBank.sol
* Provides address book functionality

### Utilities

* Load client address names
