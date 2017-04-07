The DGP will not be the most secure implementation of account ownership in order to allow for ease of use for non technical end users

Terms: 
- MCO Managed Charitable Organization


### Financial Set up

The MCO will have 2 bank accounts, a Primary account to which it will receive USD donations and a 
Token Mirror Account which it will always be in synch with the MCO contract token balance

### MCO Contract Funding

- The MCO Contract will be funded by donations of ETH via the community any excess can be converted to USD and deposited to the
primary account and subsequently transferred to the Token Mirror Account  ABI.defaultHandler

### Token Monetization

- Upon transferring USD from the Primary Account to the Token Mirror Account the Admin will "Mint" DGP tokens matching
those of the deposit.  ABI.Mint(depositAmount)

### Initial auth configuration

- Administrator generates a secret global salt to be used in setting up user accounts
- Saved to configuration file

### User Sign up

- Users visit the DGP website and enter their name and PIN
- Server creates an ethereum account for the user using a password = Sha3(salt+PIN) + PIN
- Server saves Keystore and partialPassword (P1)
- Server responds with the Ethereum Keystore file (containing the public ETH adddress)
  and the partial password (P1) which is saved to user storage
- User account is now in the pending state

### User registration approval

- Administrator will use the admin section of the website to "approve" clients, vendors and service providers
- Upon being notified of a new user registration the admin will send the new account a small amount of ETH to cover transaction fees
- Admin will invoke the MCO Contract and register the ETH address as a client, vendor or service provider ABI.registerClient(address),
ABI.registerVendor(address), ABI.registerServiceProvider(address)

### Client Funding

- TODO

### Client Purchase


### Service Provider Funding

- TODO

### Service Provider Compensates Client

- TODO

### Vendor Withrawal

- TODO

### Vendor Donation

- TODO

### Resetting a user account

In the event of a lost or comprised PIN it will be necessary to reset a client's ETH address/PIN

### Reporting

- Token Allocation showing Vendor Balances, Client Balances, Service Provider Balances and MCO Reserve
- Bank Audit showing total of all Token Allocations equal to current Token Mirror Account USD balance
