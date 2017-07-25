var Dgp = artifacts.require("./Dgp.sol");

function Client(c) {
   var result = {};
   result.startBlock = parseInt(c[0]);
   result.lastRedemptionBlock = parseInt(c[1]);
   result.checkingBalance = parseInt(c[2]);
   result.depositedEndowments = parseInt(c[3]);
   result.endowmentTotal = parseInt(c[4]);
   return result;
};
const increaseTime = addSeconds => web3.currentProvider.send({jsonrpc: "2.0", method: "evm_increaseTime", params: [addSeconds], id: 0});
const increaseDays = addDays => web3.currentProvider.send({jsonrpc: "2.0", method: "evm_increaseTime", params: [addDays*60*60*24], id: 0});

contract('Dgp', function(accounts) {
  var dgp;
  var initDonation = 100000; //cents, $1000.00
  var nonadmin = accounts[1];
  var client = accounts[2];
  var clientEndowment = 10000; //cents $100.00

  var clientStartBlock = 10;
  var vendor = accounts[3];
  
  it("should have 0 balance upon deployment", function() {
    return Dgp.deployed().then(function(instance) {
      console.log("-------------------------instance:");
      //console.log(instance);
      dgp = instance;
      return instance.accountBalance.call();
    }).then(function(balance) {
      assert.equal(balance.valueOf(), 0, "0 was the initial balance");
    });
  });

  it("should allow admin to register a donation", function() {
    console.log('initDonation: ' + initDonation);
     dgp.registerDonation(initDonation).then(function(){
        return dgp.accountBalance.call();
     }).then(function(balance) {
      assert.equal(balance.valueOf(), initDonation, "1000 is the balance after initial donation");
    });
  });

   
  it("should not allow other account to register a donation", function() {
    
     dgp.registerDonation(initDonation, {from: nonadmin})
     .then(assert.fail)
     .catch(function(error) {
                assert(
                    
                    error.message.indexOf('invalid opcode') >= 0,
                    "Non admin accounts can''t register a donation"
                );
     });
  });
   
    it("should allow admin to register a client", function() {
      //web3.eth.getBlockNumber.call().then(b => console.log("BLOCK: " + b));
      console.log(web3.eth.blockNumber);
      console.log(web3.eth.getBlock(web3.eth.blockNumber).timestamp);
      increaseDays(7);
      dgp.registerClient(client, clientEndowment, clientStartBlock).then(function(){
        return dgp.accountBalance.call();
      })
      .then(function(balance) {
        assert.equal(balance.valueOf(), initDonation, "registering client should not change account balance");
      })
      .then(function(){
        return dgp.allocated.call();
      })
      .then(function(allocated){
        assert.equal(allocated.valueOf(), clientEndowment, "registering client should not change account balance");
      })
      .then(function(){
        return dgp.clients.call(client);
      })
      .then(function(c){
        cObj = new Client(c);
      assert.equal(cObj.endowmentTotal, clientEndowment, "newly registered client receives endowment")
      })
      .then(function(){
        
        console.log(web3.eth.getBlock(web3.eth.blockNumber).timestamp);


      })
  });

  
});
