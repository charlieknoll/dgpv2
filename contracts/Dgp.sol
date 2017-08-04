pragma solidity ^0.4.11;


contract Dgp {

    struct Client {
        uint256 startTime;
        uint256 lastRedemptionBlock;
        uint256 checkingBalance;
        uint256 depositedEndowments;
        uint256 endowmentTotal;
    }    
    struct Vendor {
        uint8 registered;
        uint256 balance;
    }
    address public superAdmin;
    address public admin;
    uint256 public accountBalance;
    uint256 public allocated;
    uint256 public constant redemptionFrequency = 7; //7 days
    uint256 public constant redemptionAmt = 7000; //DUST (in cents)
    //uint256 public minClientBalance =    3000000000000000; //wei .003 ETH use 2500000000000000 for testing due to truffle gas bug
    // uint256 public clientGasAddAmt =  15000000000000000; //wei .015 ETH PRODUCTION
    uint256 public minClientBalance =   97000000000000000; //wei .0970 ETH use 2500000000000000 for testing due to truffle gas bug
    uint256 public clientGasAddAmt =    100000000000000000; //wei .1 ETH TESTING due to truffle gas bug, just enough for 2 tx's causing a top off before 3rd

    mapping (address => Vendor) public vendors;
    mapping (address => Client) public clients;
    mapping (address => uint256) public supporters;



    // events
    event USDDonation(uint256 _value);
    event UnlockedDeposit(address indexed _to, uint256 _value);
    event LockedDeposit(address indexed _to, uint256 _value);
    event RemoveClient(address indexed _removed, uint256 _value);
    event Purchase(address indexed _client, address indexed _vendor, uint256 _value);
    event Refund(address indexed _vendor, address _client, uint256 _value);
    event Redemption(address indexed _vendor, uint256 _value);
    event SupporterETHDonation(address indexed _supporter, uint256 _value);
    event Transfer(address _recipient, uint256 _value);
    
    //access control
    modifier onlySuperAdmin { 
		if (msg.sender != superAdmin)  revert();
		_; 
	}    
	modifier onlyAdmin { 
		if (msg.sender != admin)  revert();
		_; 
	}

    modifier onlySuperOrAdmin { 
		if ((msg.sender != admin) && (msg.sender != superAdmin))  revert();
		_; 
	}

	modifier onlyClient { 
		if (clients[msg.sender].startTime == 0)  revert();
		_; 
	}
	modifier onlyVendorWithBalance { 
		if (vendors[msg.sender].balance == 0)  revert();
		_; 
	}

        // constructor
    function Dgp(address _admin) 
    {
      superAdmin = msg.sender;
      admin = _admin;
    }
    function registerDonation(uint256 _donationAmt) onlyAdmin() {
        accountBalance += _donationAmt;
        USDDonation(_donationAmt);
    }
    
    function registerClient(address _clientAddress, uint256 _endowmentAmt, uint256 _startTime) onlyAdmin() {
        //never allocate more than account balance
        if (_endowmentAmt <= 0) revert();
        if (_endowmentAmt + allocated > accountBalance) revert();
        if (clients[_clientAddress].endowmentTotal > 0) revert();
        //TODO use safeAdd?
        allocated += _endowmentAmt;
        clients[_clientAddress].checkingBalance = 0;  
        clients[_clientAddress].endowmentTotal = _endowmentAmt;  
        clients[_clientAddress].startTime = _startTime == 0 ? now : _startTime;  
        clients[_clientAddress].lastRedemptionBlock = 0;  
        checkClientFunds(_clientAddress);
        if (_endowmentAmt > 0) LockedDeposit(_clientAddress, _endowmentAmt);
        
    }
    function checkClientFunds(address _clientAddress) internal {
        if (_clientAddress.balance < minClientBalance) _clientAddress.transfer(clientGasAddAmt);
    }
    function registerVendor(address _vendorAddress) onlyAdmin() {
        vendors[_vendorAddress].registered = 1;
    } 

    //Used by admin to give immediately vested DUST to client
    function depositChecking(address _clientAddress, uint256 _amount) onlyAdmin() external {
        if (clients[_clientAddress].endowmentTotal == 0) revert();
        if (allocated + _amount > accountBalance) revert();
        allocated += _amount;
        clients[_clientAddress].checkingBalance += _amount;
        UnlockedDeposit(_clientAddress, _amount);
    }
    function depositSavings(address _clientAddress, uint256 _amount) onlyAdmin() external {
        if (clients[_clientAddress].endowmentTotal == 0) revert();
        if (allocated + _amount > accountBalance) revert();
        allocated += _amount;
        clients[_clientAddress].endowmentTotal += _amount;
        LockedDeposit(_clientAddress, _amount);
    }
    function removeClient(address _clientAddress) onlyAdmin() external {
        if (clients[_clientAddress].endowmentTotal == 0) revert();
        uint256 clientFunds = clients[_clientAddress].checkingBalance +
         clients[_clientAddress].endowmentTotal - clients[_clientAddress].depositedEndowments;
         
        allocated -= clientFunds;
        RemoveClient(_clientAddress, clientFunds);
        delete clients[_clientAddress];
    }
    function getVested(address _clientAddress) constant returns(uint256 vested) {
        if (clients[_clientAddress].endowmentTotal == 0) revert();
        uint256 endowmentDuration = (now - clients[_clientAddress].startTime);
        uint256 earnedEndowments = endowmentDuration / (redemptionFrequency * 1 days);
        return (earnedEndowments * redemptionAmt - clients[_clientAddress].depositedEndowments);
    }
    function getCheckingBalance(address _clientAddress) constant external returns(uint256 checkingBalance) {
        if (clients[_clientAddress].endowmentTotal == 0) revert();
        checkingBalance = getVested(_clientAddress) + clients[_clientAddress].checkingBalance;
    }

    //Returns a virtual savings account balance, i.e. that which has been endowed but that can't be spent, maybe call it TrustBalance?
    function getSavingsBalance(address _clientAddress) constant external returns(uint256 savingsBalance) {
        if (clients[_clientAddress].endowmentTotal == 0) revert();
        savingsBalance = clients[_clientAddress].endowmentTotal -
        getVested(_clientAddress) - clients[_clientAddress].depositedEndowments;
    }

    function makePurchase(address _vendorAddress, uint256 amount) onlyClient() external  {
        if (vendors[_vendorAddress].registered == 0) revert(); //vendor check
        uint256 vested = getVested(msg.sender);
        if (vested + clients[msg.sender].checkingBalance < amount) revert();
        clients[msg.sender].depositedEndowments += vested;
        clients[msg.sender].checkingBalance += vested-amount;
        vendors[_vendorAddress].balance += amount;
        checkClientFunds(msg.sender);
        Purchase(msg.sender, _vendorAddress, amount);
    }
    function refundClient(address _clientAddress, uint256 amount) onlyVendorWithBalance() external {
        if (clients[_clientAddress].endowmentTotal == 0) revert(); //client addr check
        if (vendors[msg.sender].balance < amount) revert();
        clients[_clientAddress].checkingBalance += amount;
        Refund(msg.sender,_clientAddress,amount);
    }

    function makePurchaseForClient(address _vendorAddress, address _clientAddress, uint256 amount)
       onlyAdmin() external {
        if (vendors[_vendorAddress].registered == 0) revert(); //vendor check
        uint256 vested = getVested(_clientAddress);
        if (vested + clients[_clientAddress].checkingBalance < amount) revert();
        clients[_clientAddress].depositedEndowments += vested;
        clients[_clientAddress].checkingBalance += vested-amount;
        vendors[_vendorAddress].balance += amount;
        Purchase(_clientAddress, _vendorAddress, amount);
    }
    
    function redeemPurchases() onlyVendorWithBalance() external {
        uint256 balance = vendors[msg.sender].balance;
        vendors[msg.sender].balance = 0;
        accountBalance -= balance;
        allocated -= balance;
        Redemption(msg.sender,balance);
    }

    function redeemPurchasesForVendor(address _vendorAddress) onlyAdmin() external {
        if (vendors[_vendorAddress].registered == 0) revert(); //vendor check
        uint256 balance = vendors[_vendorAddress].balance;
        vendors[_vendorAddress].balance = 0;
        accountBalance -= balance;
        allocated -= balance;
        Redemption(_vendorAddress,balance);
    }
    function () payable {
        if(msg.value == 0) revert();
        supporters[msg.sender] += msg.value;
        SupporterETHDonation(msg.sender,msg.value);
    }
}
