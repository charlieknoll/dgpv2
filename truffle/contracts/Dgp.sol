pragma solidity ^0.4.11;


contract Dgp {

    struct Client {
        uint256 startTime;
        uint256 lastRedemptionBlock;
        uint256 checkingBalance;
        uint256 depositedEndowments;
        uint256 endowmentTotal;
    }    
    address public admin;
    uint256 public accountBalance;
    uint256 public allocated;
    uint256 public constant redemptionFrequency = 7; //7 days
    uint256 public constant redemptionAmt = 7000; //DUST (in cents)
    
    mapping (address => uint256) public vendorBalances;
    mapping (address => Client) public clients;


    // events
    event Donation(uint256 _value);
    event CheckingDeposit(address indexed _to, uint256 _value);
    event Endowment(address indexed _to, uint256 _value);
    event RemoveClient(address indexed _removed, uint256 _value);
    event Purchase(address indexed _client, address indexed _vendor, uint256 _value);
    event Refund(address indexed _vendor, address _client, uint256 _value);
    event Redemption(address indexed _vendor, uint256 _value);
    
    //access control
	modifier onlyAdmin { 
		if (msg.sender != admin)  throw;
		_; 
	}
	modifier onlyClient { 
		if (clients[msg.sender].startTime == 0)  throw;
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
    
    function registerClient(address _clientAddress, uint256 _endowmentTotal, uint256 _startTime) onlyAdmin() {
        //never allocate more than account balance
        if (_endowmentTotal <= 0) throw;
        if (_endowmentTotal + allocated > accountBalance) throw;
        if (clients[_clientAddress].endowmentTotal > 0) throw;
        //TODO use safeAdd?
        allocated += _endowmentTotal;
        clients[_clientAddress].checkingBalance = 0;  
        clients[_clientAddress].endowmentTotal = _endowmentTotal;  
        clients[_clientAddress].startTime = _startTime == 0 ? now : _startTime;  
        clients[_clientAddress].lastRedemptionBlock = 0;  
        if (_endowmentTotal > 0) Endowment(_clientAddress, _endowmentTotal);
        
    }
    //Used by admin to give immediately vested DUST to client
    function depositChecking(address _clientAddress, uint256 _amount) onlyAdmin() external {
        if (clients[_clientAddress].endowmentTotal == 0) throw;
        if (allocated + _amount > accountBalance) throw;
        allocated += _amount;
        clients[_clientAddress].checkingBalance += _amount;
        CheckingDeposit(_clientAddress, _amount);
    }
    function endow(address _clientAddress, uint256 _amount) onlyAdmin() external {
        if (clients[_clientAddress].endowmentTotal == 0) throw;
        if (allocated + _amount > accountBalance) throw;
        allocated += _amount;
        clients[_clientAddress].endowmentTotal += _amount;
        Endowment(_clientAddress, _amount);
    }
    function removeClient(address _clientAddress) onlyAdmin() external {
        if (clients[_clientAddress].endowmentTotal == 0) throw;
        uint256 clientFunds = clients[_clientAddress].checkingBalance +
         clients[_clientAddress].endowmentTotal - clients[_clientAddress].depositedEndowments;
         
        allocated -= clientFunds;
         
        RemoveClient(_clientAddress, clientFunds);
        delete clients[_clientAddress];
    }
    function getVested(address _clientAddress) constant returns(uint256 vested) {
        if (clients[_clientAddress].endowmentTotal == 0) throw;
        uint256 endowmentDuration = (now - clients[_clientAddress].startTime);
        uint256 earnedEndowments = endowmentDuration / (redemptionFrequency * 1 days);
        return (earnedEndowments * redemptionAmt - clients[_clientAddress].depositedEndowments);
    }
    function getCheckingBalance(address _clientAddress) constant external returns(uint256 checkingBalance) {
        if (clients[_clientAddress].endowmentTotal == 0) throw;
        checkingBalance = getVested(_clientAddress) + clients[_clientAddress].checkingBalance;
    }

    //Returns a virtual savings account balance, i.e. that which has been endowed but that can't be spent, maybe call it TrustBalance?
    function getSavingsBalance(address _clientAddress) constant external returns(uint256 savingsBalance) {
        if (clients[_clientAddress].endowmentTotal == 0) throw;
        savingsBalance = clients[_clientAddress].endowmentTotal -
        getVested(_clientAddress) - clients[_clientAddress].depositedEndowments;
    }

    function makePurchase(address _vendorAddress, uint256 amount) onlyClient() external  {
        //TODO validate vendor, is it necessary?
        uint256 vested = getVested(msg.sender);
        if (vested + clients[msg.sender].checkingBalance < amount) throw;
        clients[msg.sender].depositedEndowments += vested;
        clients[msg.sender].checkingBalance += vested-amount;
        vendorBalances[_vendorAddress] += amount;
        Purchase(msg.sender, _vendorAddress, amount);
    }
    function refundClient(address _clientAddress, uint256 amount) onlyVendorWithBalance() external {
        if (vendorBalances[msg.sender] < amount) throw;
        clients[_clientAddress].checkingBalance += amount;
        Refund(msg.sender,_clientAddress,amount);
    }

    function makePurchaseForClient(address _vendorAddress, address _clientAddress, uint256 amount)
       onlyAdmin() external {
        uint256 vested = getVested(_clientAddress);
        if (vested + clients[_clientAddress].checkingBalance < amount) throw;
        clients[_clientAddress].depositedEndowments += vested;
        clients[_clientAddress].checkingBalance += vested-amount;
        vendorBalances[_vendorAddress] += amount;
        Purchase(_clientAddress, _vendorAddress, amount);
    }
    
    function redeemPurchases() onlyVendorWithBalance() external {
        
        uint256 balance = vendorBalances[msg.sender];
        vendorBalances[msg.sender] = 0;
        accountBalance -= balance;
        allocated -= balance;
        Redemption(msg.sender,balance);
        
    }
    function redeemPurchasesForVendor(address _vendorAddress) onlyAdmin() external {
        
        uint256 balance = vendorBalances[_vendorAddress];
        vendorBalances[_vendorAddress] = 0;
        accountBalance -= balance;
        allocated -= balance;
        Redemption(_vendorAddress,balance);
    }
    
}
