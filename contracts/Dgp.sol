pragma solidity ^0.4.11;


contract Dgp {

    struct Client {
        uint256 startBlock;
        uint256 lastRedemptionBlock;
        uint256 checkingBalance;
        uint256 allocatedEndowments;
        uint256 endowmentTotal;
    }    
    address public admin;
    uint256 public accountBalance;
    uint256 public allocated;
    uint256 public constant redemptionFrequency = 7; //7 days
    uint256 public constant redemptionAmt = 7000; //DUST (in cents)
    
    mapping (address => uint256) public vendorBalances;
    mapping (address => Client) public clients;
	mapping (uint256 => uint256) blockTimes;

    // events
    event Donation(uint256 _value);
    event CheckingDeposit(address indexed _to, uint256 _value);
    event Endowment(address indexed _to, uint256 _value);
    event RemoveClient(address indexed _removed, uint256 _value);
    event Purchase(address indexed _client, address indexed _vendor, uint256 _value);
    event Refund(address indexed _from, address indexed _to, uint256 _value);
    event Redemption(address indexed _to, uint256 _value);
    
    //access control
	modifier onlyAdmin { 
		if (msg.sender != admin)  throw;
		_; 
	}
	modifier onlyClient { 
		if (clients[msg.sender].startBlock == 0)  throw;
		_; 
	}
	modifier onlyVendorWithBalance { 
		if (vendorBalances[msg.sender] == 0)  throw;
		_; 
	}

        // constructor
    function Dgp() 
    {
      admin = msg.sender;
    }
    function registerDonation(uint256 _donationAmt) onlyAdmin() {
        accountBalance += _donationAmt;
        Donation(_donationAmt);
    }
    
    function registerClient(address _clientAddress, uint256 _checkingBalance,
    uint256 _endowmentTotal, uint256 _startBlock) onlyAdmin() {
        //never allocate more than account balance
        if (_checkingBalance + _endowmentTotal + allocated> accountBalance) throw;
        //TODO use safeAdd?
        allocated += _checkingBalance + _endowmentTotal;
        clients[_clientAddress].checkingBalance = _checkingBalance;  
        clients[_clientAddress].endowmentTotal = _endowmentTotal;  
        clients[_clientAddress].startBlock = _startBlock;  
        clients[_clientAddress].lastRedemptionBlock = 0;  
        if (_checkingBalance > 0) CheckingDeposit(_clientAddress, _checkingBalance);
        if (_endowmentTotal > 0) Endowment(_clientAddress, _endowmentTotal);
        
    }
    function depositChecking(address _clientAddress, uint256 _amount) onlyAdmin() external {
        if (allocated + _amount > accountBalance) throw;
        allocated += _amount;
        clients[_clientAddress].checkingBalance += _amount;
        CheckingDeposit(_clientAddress, _amount);
    }
    function endow(address _clientAddress, uint256 _amount) onlyAdmin() external {
        if (allocated + _amount > accountBalance) throw;
        allocated += _amount;
        clients[_clientAddress].endowmentTotal += _amount;
        Endowment(_clientAddress, _amount);
    }
    function removeClient(address _clientAddress) onlyAdmin() external {
        uint256 clientFunds = clients[_clientAddress].checkingBalance +
         clients[_clientAddress].endowmentTotal - clients[_clientAddress].allocatedEndowments;
         
        allocated -= clientFunds;
         
        RemoveClient(_clientAddress, clientFunds);
        delete clients[_clientAddress];
    }
    function getVested(address _clientAddress) constant returns(uint256 vested) {
        //wait 60 blocks since last endowment transfer for security (900 second miner fudge factor)
        if (block.number - clients[_clientAddress].lastRedemptionBlock < 60) return 0;
        uint256 startTime = blockTimes[clients[_clientAddress].startBlock];
        if (startTime == 0) return 0;
        uint256 endowmentDuration = (block.timestamp - startTime) * 1 days;
        uint256 earnedEndowments = endowmentDuration / redemptionFrequency;
        return earnedEndowments - clients[_clientAddress].allocatedEndowments;

        //int256 activeDays = clients[_clientAddress].startBlock - msg.blockNumber
        
    }
    function getCheckingBalance(address _clientAddress) constant external returns(uint256 checkingBalance) {
        checkingBalance = getVested(_clientAddress) + clients[_clientAddress].checkingBalance;
    }
    function getSavingsBalance(address _clientAddress) constant external returns(uint256 savingsBalance) {
        savingsBalance = clients[_clientAddress].allocatedEndowments -
        getVested(_clientAddress) - clients[_clientAddress].checkingBalance;
    }

    function makePurchase(address _vendorAddress, uint256 amount) onlyClient() external  {
        uint256 vested = getVested(msg.sender);
        if (vested + clients[msg.sender].checkingBalance < amount) throw;
        clients[msg.sender].allocatedEndowments += vested;
        clients[msg.sender].checkingBalance += clients[msg.sender].allocatedEndowments -amount;
        vendorBalances[_vendorAddress] += amount;
        Purchase(msg.sender, _vendorAddress, amount);
    }
    function refundClient(address _clientAddress, uint256 amount) onlyVendorWithBalance() external {
        
        
    }
    function makePurchaseForClient(address _vendorAddress, address _clientAddress, uint256 amount)
       onlyAdmin() external {
        
        
    }
    
    function redeemPurchases() onlyVendorWithBalance() external {
        
        
    }
    function redeemPurchasesForVendor() onlyAdmin() external {
        
        
    }
    
}
