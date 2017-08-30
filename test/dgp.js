var Dgp = artifacts.require("./Dgp.sol");
var gasList = [];
var gasPrice = 20000000000;
var gasLimit = 120000;
var skipThrows = false; //throws cost a lot of gas and are incorrectly consumed by truffle/testrpc, don't burn balance if this is set to false
var suppressLogging = true;
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
function Vendor(v) {
   var result = {};
   result.registered = parseInt(v[0]);
   result.balance = parseInt(v[1]);
   return result;
};
function logGas(step,txResult) {
  if (suppressLogging) return;
  gasList.push({ step: step, gas: txResult.receipt.gasUsed});
}
function logBalance(addr, msg) {
  if (suppressLogging) return;
  console.log(msg + ": " + web3.fromWei(web3.eth.getBalance(addr),'ether'));
}
function verifyEvent(logs,eventName,args) {
   logs.forEach(function(log) {
      assert.equal(log.event, eventName, 'Event not found');
   });
}

const increaseTime = addSeconds => web3.currentProvider.send({jsonrpc: "2.0", method: "evm_increaseTime", params: [addSeconds], id: 0});
const increaseDays = addDays => web3.currentProvider.send({jsonrpc: "2.0", method: "evm_increaseTime", params: [addDays*60*60*24], id: 0});
const mineBlock = () => web3.currentProvider.send({jsonrpc: "2.0", method: "evm_mine", params: [], id: 0});

contract('Dgp', function(accounts) {
  var dgp;
  var initDonation = 100000; //cents, $1000.00
  var initFundingAmt = 9; //eth

  var superAdminAddr = accounts[0];
  var adminAddr = accounts[1];
  var nonAdminAddr = accounts[2];

  var clientAddr = accounts[3];
  var clientAddr2 = accounts[4];

  var clientEndowment = 10000; //cents $100.00
  var purchaseAmt = 500; //$5.00
  
  var vendorAddr = accounts[5];
  var unRegisteredVendorAddr = accounts[6];

  var supporterAddr = accounts[7];
  var supporterDonationAmt = 0.1; //eth

  Dgp.deployed().then(i => dgp = i);
  

  it("should have initial setup", async function() {
    logBalance(superAdminAddr, "superAdmin");
    logBalance(adminAddr, "admin");
    logBalance(clientAddr, "client");
    logBalance(vendorAddr, "vendor");
    logBalance(supporterAddr, "supporter");
    logBalance(dgp.address, "contract");


    let s = await dgp.superAdmin();
    assert.equal(s,superAdminAddr, "super set correctly");
    let a = await dgp.admin();
    assert.equal(a,adminAddr, "admin set correctly");
    let b = await dgp.accountBalance();
    assert.equal(b.valueOf(), 0, "0 was the initial balance");
  });

  it("should have 9 ETH after admin funding", function() {
    var tx = web3.eth.sendTransaction({from: accounts[0], to: dgp.address, value: web3.toWei(initFundingAmt, 'ether') });
    var ethBalance = web3.eth.getBalance(dgp.address);
    assert.equal(ethBalance, web3.toWei(initFundingAmt, 'ether'), "9 ETH funded");
  });  

  it("should allow supporter ETH donation", function() {
    var tx = web3.eth.sendTransaction({from: supporterAddr, to: dgp.address, value: web3.toWei(supporterDonationAmt, 'ether') });
    var ethBalance = web3.eth.getBalance(dgp.address);
    assert.equal(ethBalance, web3.toWei(initFundingAmt + supporterDonationAmt, 'ether'), "9.1 ETH funded");
  });

  it("should track supporter 2nd ETH donation",async function() {
    var tx = web3.eth.sendTransaction({from: supporterAddr, to: dgp.address, value: web3.toWei(supporterDonationAmt, 'ether') });
    var ethBalance = web3.eth.getBalance(dgp.address);
    let b = await dgp.supporters(supporterAddr)
    assert.equal(b, web3.toWei(supporterDonationAmt*2, 'ether'), "supporter has 2 donations in contract");
    assert.equal(ethBalance, web3.toWei(initFundingAmt + (2 * supporterDonationAmt), 'ether'), "9.2 ETH funded");
    
  });

  it("should allow admin to register a USD donation", function() {
     return dgp.registerDonation(initDonation,{from: adminAddr, gasPrice: gasPrice})
     .then(result => {
       logGas('register donation',result);
       verifyEvent(result.logs,'USDDonation', [initDonation]);
       return dgp.accountBalance();
      })
     .then(b=> assert.equal(b.valueOf(), initDonation, "$1000 is the balance after initial donation"));
  });
   
  it("should not allow non admin account to register a donation", async function() {
     if (skipThrows) return;
     try {
       let r = await dgp.registerDonation(initDonation, {from: nonAdminAddr, gasPrice: gasPrice});
     } catch (e) {
      assert(e.message.indexOf('invalid opcode') >= 0, "Non admin accounts can''t register a donation");
      return true;
     }
     throw new Error("allowed non admin account to register a donation")
  });
   
  
  it("should allow admin to register a client", async function() {
    let r = await dgp.registerClient(clientAddr, clientEndowment, 0,{from: adminAddr, gasPrice: gasPrice});
    logGas('register client',r);
    logBalance(clientAddr, "client");
    let c = await dgp.clients.call(clientAddr);
    let client = new Client(c);
    assert.equal(client.endowmentTotal, clientEndowment, "newly registered client receives endowment");
    assert.equal(client.startTime, web3.eth.getBlock(web3.eth.blockNumber).timestamp, "newly registered client gets startTime as default block.timestamp");
  });

  it("should not change account balance after registering client", async function() {
    let b = await dgp.accountBalance()
    assert.equal(b.valueOf(), initDonation, "account balance = init donation");
  });

  it("should update allocated after registering client", async function() {
     let a = await dgp.allocated();
     assert.equal(a.valueOf(), clientEndowment, "allocated = client endowment");
  });

  it("should set vested to 0 after registering client", async function() {
     let a = await dgp.getVested(clientAddr);
     assert.equal(a.valueOf(), 0, "vested = 0");
  });

  it("should allow admin to register a second client", async function() {

    let r = await dgp.registerClient(clientAddr2, clientEndowment, 0,{from: adminAddr, gasPrice: gasPrice});
    logGas('register client',r);
    let c = await dgp.clients.call(clientAddr2);
    let c2 = new Client(c);
    assert.equal(c2.endowmentTotal, clientEndowment, "newly registered client receives endowment");
    assert.equal(c2.startTime, web3.eth.getBlock(web3.eth.blockNumber).timestamp, "newly registered client gets startTime as default block.timestamp");
  });

  it("should allow admin to register a vendor", async function() {
    let r = await dgp.registerVendor(vendorAddr,{from: adminAddr, gasPrice: gasPrice});
    logGas('register vendor',r);
    let v = await dgp.vendors(vendorAddr);
    var vendor = new Vendor(v);
    assert.equal(vendor.registered, 1, "newly registered vendor set to registered");
  });

  it("should not allow a client to be registered twice", async function() {
    if (skipThrows) return;
    try {
      let r = await dgp.registerClient(clientAddr, clientEndowment, 0,{from: adminAddr, gasPrice: gasPrice});
    } catch (e) {
      assert(e.message.indexOf('invalid opcode') >= 0, "second registration failed");
      return true;
    }
    throw new Error("Client can be registered 2x!");
  });

  it("should set vested to $70 after 1 redepemption period passed", async function() {
    increaseDays(8);
    mineBlock();
    //console.log(web3.eth.getBlock(web3.eth.blockNumber).timestamp);
    let a = await dgp.getVested(clientAddr);
    assert.equal(a.valueOf(), 7000, "vested = $70");
  });

  it("should allow client to make purchase", async function() {
    logBalance(clientAddr, "client");
    let b = await dgp.minClientBalance();
    let r = await dgp.makePurchase(vendorAddr, purchaseAmt, {from: clientAddr, gasPrice: gasPrice, gasLimit: gasLimit});
    mineBlock();
    logGas('make purchase',r);
    logBalance(clientAddr, "client");
    let c = await dgp.clients.call(clientAddr);
    let client = new Client(c);
    assert.equal(client.checkingBalance, 7000 - purchaseAmt, "checking balance reduced by purchase");
    assert.equal(client.depositedEndowments, 7000, "1 endowment deposited");
  });

  it("should not allow client to purchase from unregistered vendor", async function(){
    if (skipThrows) return;
    try {
      let r = await dgp.makePurchase(unRegisteredVendorAddr, purchaseAmt, {from: clientAddr, gasPrice: gasPrice});
    } catch (e) {
      assert(e.message.indexOf('invalid opcode') >= 0, "purchase failed");
      return true;
    }
    throw new Error("Client can purchase from unregistered vendor!");
  });

  it("should reduce vested after purchase", async function() {
    let a = await dgp.getVested(clientAddr);
    assert.equal(a.valueOf(), 0, "vested = $0");
  });
  
  it("should allow client to make a second purchase", async function() {
    let r = await dgp.makePurchase(vendorAddr, purchaseAmt+1000, {from: clientAddr, gasPrice: gasPrice});
    mineBlock();
    logGas('make 2nd purchase',r);
    logBalance(clientAddr, "client");
    let c = await dgp.clients.call(clientAddr);
    client = new Client(c);
    assert.equal(client.checkingBalance, 5000, "checking balance reduced by purchase");
    assert.equal(client.depositedEndowments, 7000, "1 endowment deposited");
  });

  it("should set vendor balance after purchase", async function() {
    let v = await dgp.vendors(vendorAddr);
    var vendor = new Vendor(v);
    assert.equal(vendor.balance, 2000, "total sales = $20");
  });

  it("should allow client to make a third purchase", async function() {
    let r = await  dgp.makePurchase(vendorAddr, purchaseAmt+1000, {from: clientAddr, gasPrice: gasPrice});
    mineBlock();
    logGas('make 3rd purchase',r);
    logBalance(clientAddr, "client");
    let c = await dgp.clients.call(clientAddr);
    client = new Client(c);
    assert.equal(client.checkingBalance, 3500, "checking balance reduced by purchase");
  });

  it("should allow admin to deposit unlocked DUST",async function(){
    let c = await dgp.clients.call(clientAddr);
    let client = new Client(c);
    var originalBalance = client.checkingBalance;

    let r = await dgp.depositChecking(clientAddr,100,{from: adminAddr});
    c = await dgp.clients.call(clientAddr);
    client = new Client(c);
    assert.equal(originalBalance+100, client.checkingBalance, "checking balance increased");
  });

  it("should allow admin to deposit locked DUST",async function(){
    let c = await dgp.clients.call(clientAddr);
    let client = new Client(c);
    var originalBalance = client.endowmentTotal;
    let r = await dgp.depositSavings(clientAddr,100,{from: adminAddr});
    c = await dgp.clients.call(clientAddr);
    client = new Client(c);
    assert.equal(originalBalance+100, client.endowmentTotal, "savings balance increased");
 });  


  it("should allow vendor to request redemption", async function() {
    let r = await dgp.redeemPurchases({from: vendorAddr, gasPrice: gasPrice});
    logGas('redeem purchases',r);
    let v = await dgp.vendors(vendorAddr);
    var vendor = new Vendor(v);
    assert.equal(vendor.balance, 0, "total sales = $0 after redemption");
  });

  it("should allow admin to request redemption", async function() {
    let r = await dgp.redeemPurchasesForVendor(vendorAddr,{from: adminAddr, gasPrice: gasPrice});
    logGas('redeem purchases for vendor',r);
    let v =  await dgp.vendors(vendorAddr);
    var vendor = new Vendor(v);
    assert.equal(vendor.balance, 0, "total sales = $0 after admin redemption");
  });
  
  it("should allow superAdmin to tranfer contract ETH", async function() {
    let r = await dgp.transferETH(adminAddr, web3.toWei(1,'ether'));
    logGas('transfer ETH',r);
  });

  it("should allow superadmin to selfdestruct", async function() {
    let r = await dgp.terminate();
    logGas('self destruct',r);
  });

  it("should log gas", function(){
    if (!suppressLogging) console.log(gasList);
    if (!suppressLogging) console.log("gas price: " + web3.fromWei(web3.eth.gasPrice,'wei'));
    logBalance(superAdminAddr, "superAdmin");
    logBalance(adminAddr, "admin");
    logBalance(clientAddr, "client");
    logBalance(vendorAddr, "vendor");
    logBalance(supporterAddr, "supporter");
    logBalance(dgp.address, "contract");
    
  });
  
});
