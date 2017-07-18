var Dgp = artifacts.require("./Dgp.sol");

contract('Dgp', function(accounts) {
  var dgp;
  var initDonation = 1000;
  
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
  var account_one = accounts[1];
  it("should not allow other account to register a donation", function() {
    console.log('account one: ' + accounts[1]);
     dgp.registerDonation(initDonation, {from: account_one})
     .then(assert.fail)
     .catch(function(error) {
                assert(
                    
                    error.message.indexOf('invalid opcode') >= 0,
                    "Non admin accounts can''t register a donation"
                );
     });
  });
});
