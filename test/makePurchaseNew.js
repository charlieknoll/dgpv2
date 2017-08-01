var fs = require('fs');
var Web3 = require("web3");
var BN = require("bignumber.js");
var web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
var dgpSpec = JSON.parse(fs.readFileSync('build/contracts/dgp.json', 'utf8'));
var dgp = new web3.eth.Contract(dgpSpec.abi);

var deploy = function(from) {
  return dgp.deploy(
   {
     from: from,
     data: dgpSpec.unlinked_binary
   })
  .send({ from: from,
          gas: 4000000 })
  .on('transactionHash', function(transactionHash){ 
      console.log(transactionHash); })
  .on('receipt', function(receipt){
      console.log(receipt.gasUsed)});
};


web3.eth.getAccounts().then(a=>{return a;})
.then(a=>{
  return deploy(a[0]);
})
.then(i=>{
      console.log(i.options.address);
});
    
