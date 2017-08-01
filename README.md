# Distribruted Giving Project Phase 2
Application to enable management and verification of funds for a charitable organization using the Ethereum blockchain

Specifications here

## Testing

- Console1: Run testrpc
- Open 2nd console
- npm install
- truffle migrate --reset
- node burnBalance-node.js (example to set accounts[1,2] to zero balance to mimic unfunded clients)
- truffle test .\\test\\dgp.js

