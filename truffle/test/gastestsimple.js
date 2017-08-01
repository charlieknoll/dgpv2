var Web3 = require("web3");
var BN = require("bignumber.js");

var web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));

var balance, gasPrice, gasCost, sendAmt;

var accounts = web3.eth.getAccounts()
  .then((response,error) => {
    return response;
  });


var burnBalance = function (from,to) {
   return web3.eth.getBalance(from).then(b=>{
    balance = new BN(b);
    return web3.eth.getGasPrice();
  }).then(gP=>{
    gasPrice = new BN(gP);
    gasCost = gasPrice.times(21000);
    sendAmt = balance.minus(gasCost);
    return web3.eth.estimateGas({from: from, to: to, value: sendAmt, gasLimit: 21000, gasPrice: gasPrice })
  }).then(g=>{
    console.log(g);
    return web3.eth.sendTransaction({from: from, to: to, value: sendAmt, gasLimit: 21000, gasPrice: gasPrice })
  }).then(tx=>{
    console.log(tx);
    return web3.eth.getBalance(from);
  }).then(b=>{
    console.log(b);
  });
}
accounts
  .then(a=>
    {
      return burnBalance(a[2],a[0]).then(b=>{return a;});
      //return a;
    })
  .then(a=>
    {
      burnBalance(a[3],a[0]); 
      return a;
    });
