# Distribruted Giving Project Phase 2
Application to enable management and verification of funds for a charitable organization using the Ethereum blockchain

## Glossary

### User types
- SuperAdmin: the contract deployer (DGP organization).
- Admin: Either a service provider account or DGP, the user who sets up vendors and clients.
- Client: A receiver of USD tokens (DUST). The client only spend DUST at registered vendors according to vesting rules.
- Vendor: A registered participant who has agreed to recieve DUST from clients for payment of goods or services.  The Admin will send real USD to the vendor upon the Vendor's redemption of DUST
- Supporter: Someone who wishes to donate ETH to the contract to pay for client & vendor expenses

## Concepts
- Disbursement rule: how much DUST becomes available to spend at a given interval
- Checking Account Balance: the vested remaining spendable DUST available to the client
- Savings Account Balance: the unvested DUST

## Events
Events are raised when transactions occur that need to be logged for reporting purposes

- USDDonation: records a USD transfer into a Service Provider's bank account
- UnlockedDeposit: records an immediately spendable deposit of DUST to a client
- LockedDeposit: records a deposit to the client's savings account which is subject to disbursement rules 
- RemoveClient: records a removal of a client from the contract, all client's DUST is made available to be reallocated to other clients, could be used to reset a client after a period of inactivity
- Purchase: records a client purchase from a vendor
- Refund: records a Vendor refunding a client
- Redemption: records a Vendor requesting redememption of their DUST to USD
- SupporterETHDonation: records an ETH deposit to the contract, will be used for contract expenses (gas costs)
- Transfer: records an ETH transfer out of the contract

## Gas Estimates

- { step: 'register donation', gas: 43205 },
-  { step: 'register client', gas: 103055 },
-  { step: 'register client', gas: 88055 },
-  { step: 'register vendor', gas: 43475 },
-  { step: 'make purchase', gas: 86586 },
-  { step: 'make 2nd purchase', gas: 41586 },
-  { step: 'make 3rd purchase', gas: 41586 },
-  { step: 'redeem purchases', gas: 23873 },
-  { step: 'redeem purchases for vendor', gas: 40231 } 

At 4 Gwei and $225/ETH it will cost approximately .05 USD per purchase assuming a rolling average of 52,000 gas per purchase [eth gasstation calculator ](http://ethgasstation.info/calculator.php)


## Testing

- Console1: Run testrpc
- Open 2nd console
- npm install
- truffle migrate --reset
- node burnBalance-node.js (example to set client accounts to zero balance to mimic unfunded clients)
- truffle test .\\test\\dgp.js

