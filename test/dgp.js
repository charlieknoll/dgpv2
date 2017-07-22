var Dgp = artifacts.require("./Dgp.sol");

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
       console.log('balance: ' + balance);
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
  });

  
});
