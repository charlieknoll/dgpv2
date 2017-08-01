var Dgp = artifacts.require("./Dgp.sol");
var gasList = [];
//var Web3 = require("web3");
//var BN = require("bignumber.js");

function Client(c) {
   var result = {};
   result.startTime = parseInt(c[0]);
   result.lastRedemptionBlock = parseInt(c[1]);
   result.checkingBalance = parseInt(c[2]);
   result.depositedEndowments = parseInt(c[3]);
   result.endowmentTotal = parseInt(c[4]);
   return result;
};
function logGas(step,txResult) {
  gasList.push({ step: step, gas: txResult.receipt.gasUsed});
}
// function burnBalance(from, to){
//   //TODO burn to a real address
//   w3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
//  w3.eth.getBalance(from).then(b=>{
//     balance = new BN(b);
//     return w3.eth.getGasPrice();
//   }).then(gP=>{
//     gasPrice = new BN(gP);
//     gasCost = gasPrice.times(21000);
//     sendAmt = balance.minus(gasCost);
//     console.log(balance.toString(10));
//     console.log(sendAmt.toString(10));
//     console.log(gasPrice.toString(10));
//     console.log(gasCost.toString(10));
//     return w3.eth.estimateGas({from: from, to: to, value: sendAmt, gasLimit: 21000, gasPrice: gasPrice })
//   }).then(g=>{
//     console.log(g);
//     return w3.eth.sendTransaction({from: from, to: to, value: sendAmt, gasLimit: 21000, gasPrice: gasPrice })
//   }).then(tx=>{
//     console.log(tx);
//     return w3.eth.getBalance(from);
//   }).then(b=>{
//     console.log(b);
//   });

// }
const increaseTime = addSeconds => web3.currentProvider.send({jsonrpc: "2.0", method: "evm_increaseTime", params: [addSeconds], id: 0});
const increaseDays = addDays => web3.currentProvider.send({jsonrpc: "2.0", method: "evm_increaseTime", params: [addDays*60*60*24], id: 0});
const mineBlock = () => web3.currentProvider.send({jsonrpc: "2.0", method: "evm_mine", params: [], id: 0});

contract('Dgp', function(accounts) {
  var dgp;
  var initDonation = 100000; //cents, $1000.00

  var nonAdminAddr = accounts[1];

  var clientAddr = accounts[2];
  var clientAddr2 = accounts[3];

  //burnBalance(clientAddr, accounts[0]);

  var clientEndowment = 10000; //cents $100.00
  var purchaseAmt = 500; //$5.00
  
  var vendorAddr = accounts[4];
  
  Dgp.deployed().then(i => dgp = i);
  

  it("should have 0 DUST balance upon deployment", function() {
    return dgp.accountBalance().then(b => assert.equal(b.valueOf(), 0, "0 was the initial balance"));
  });
  it("should have 9 ETH after admin funding", function() {
    var tx = web3.eth.sendTransaction({from: accounts[0], to: dgp.address, value: web3.toWei(9, 'ether') });
    var ethBalance = web3.eth.getBalance(dgp.address);
    return  assert.equal(ethBalance, web3.toWei(9, 'ether'), "9 ETH funded");
  });  

  it("should allow admin to register a donation", function() {
     return dgp.registerDonation(initDonation)
     .then(result => {
       logGas('register donation',result);
       return dgp.accountBalance();
      })
     .then(b=> assert.equal(b.valueOf(), initDonation, "1000 is the balance after initial donation"));
  });
   
  it("should not allow other account to register a donation", function() {
     return dgp.registerDonation(initDonation, {from: nonAdminAddr})
     .then(assert.fail)
     .catch(e=> assert(e.message.indexOf('invalid opcode') >= 0, "Non admin accounts can''t register a donation"));
  });
   
  var client;

  it("should allow admin to register a client", function() {
    console.log(web3.fromWei(web3.eth.getBalance(clientAddr),'ether'));

    return dgp.registerClient(clientAddr, clientEndowment, 0)
    .then(r=> {
      logGas('register client',r);
      console.log(web3.fromWei(web3.eth.getBalance(clientAddr),'ether'));
      return dgp.clients.call(clientAddr);
    })
    .then( c=> {
      client = new Client(c);
      assert.equal(client.endowmentTotal, clientEndowment, "newly registered client receives endowment");
      assert.equal(client.startTime, web3.eth.getBlock(web3.eth.blockNumber).timestamp, "newly registered client gets startTime as default block.timestamp");
    });
  });

  it("should not change account balance after registering client", function() {
     return dgp.accountBalance().then(b=>assert.equal(b.valueOf(), initDonation, "account balance = init donation"));
  });

  it("should update allocated after registering client", function() {
     return dgp.allocated().then(a=>assert.equal(a.valueOf(), clientEndowment, "account balance = init donation"));
  });
  it("should set vested to 0 after registering client", function() {
     return dgp.getVested(clientAddr).then(a=>assert.equal(a.valueOf(), 0, "vested = 0"));
  });
  it("should allow admin to register a second client", function() {

    return dgp.registerClient(clientAddr2, clientEndowment, 0)
    .then(r=> {
      logGas('register client',r);
      return dgp.clients.call(clientAddr2);
    })
    .then( c=> {
      var c2 = new Client(c);
      assert.equal(c2.endowmentTotal, clientEndowment, "newly registered client receives endowment");
      assert.equal(c2.startTime, web3.eth.getBlock(web3.eth.blockNumber).timestamp, "newly registered client gets startTime as default block.timestamp");
    });
  });

  it("should have 2 registered clients", function() {
     return dgp.clientCount().then(c=>assert.equal(c,2,"client count = 2"));
     
  });

  it("should not allow a client to be registered twice", function() {
     return dgp.registerClient(clientAddr, clientEndowment, 0)
     .then(assert.fail)
     .catch(e=> assert(e.message.indexOf('invalid opcode') >= 0, "Client can be registered 2x!"));
  });

  it("should set vested to $70 after 1 redepemption period passed", function() {
    increaseDays(8);
    mineBlock();
    //console.log(web3.eth.getBlock(web3.eth.blockNumber).timestamp);
    return dgp.getVested(clientAddr).then(a=>assert.equal(a.valueOf(), 7000, "vested = $70"));
  });

  it("should allow client to make purchase", function() {
    
    return dgp.makePurchase(vendorAddr, purchaseAmt, {from: clientAddr})
    .then(r=> {
      logGas('make purchase',r);
      return dgp.clients.call(clientAddr);
    })
    .then( c=> {
      client = new Client(c);
      assert.equal(client.checkingBalance, 7000 - purchaseAmt, "checking balance reduced by purchase");
      assert.equal(client.depositedEndowments, 7000, "1 endowment deposited");
      console.log('checking: ' + client.checkingBalance);
      console.log(web3.fromWei(web3.eth.getBalance(clientAddr),'ether'));
    });
  });
  it("should reduce vested after purchase", function() {
    return dgp.getVested(clientAddr).then(a=>assert.equal(a.valueOf(), 0, "vested = $0"));
  });
  
  it("should allow client to make a second purchase", function() {
    return dgp.makePurchase(vendorAddr, purchaseAmt+1000, {from: clientAddr})
    .then(r=> {
      logGas('make 2nd purchase',r);
      return dgp.clients.call(clientAddr);
    })
    .then( c=> {
      client = new Client(c);
      console.log('checking: ' + client.checkingBalance);
      assert.equal(client.checkingBalance, 5000, "checking balance reduced by purchase");
      assert.equal(client.depositedEndowments, 7000, "1 endowment deposited");
    });
  });
  it("should set vendor balance after purchase", function() {
    return dgp.vendorBalances(vendorAddr).then( 
      a=> { 
        assert.equal(a.valueOf(), 2000, "total sales = $20");
    });
  });
  it("should allow client to make a third purchase", function() {
    return dgp.makePurchase(vendorAddr, purchaseAmt+1000, {from: clientAddr})
    .then(r=> {
      logGas('make 3rd purchase',r);
      return dgp.clients.call(clientAddr);
    })
    .then( c=> {
      client = new Client(c);
      console.log('checking: ' + client.checkingBalance);
      assert.equal(client.checkingBalance, 3500, "checking balance reduced by purchase");
    });
  });

  it("should allow vendor to request redemption", function() {
    return dgp.redeemPurchases({from: vendorAddr})
    .then(r=> {
      logGas('redeem purchases',r);
      return dgp.vendorBalances(vendorAddr)
    })
    .then( a=> { 
        assert.equal(a.valueOf(), 0, "total sales = $0 after redemption");
        
    });
  });
  
  it("should log gas", function(){
    console.log(gasList);
  });
  
});
