var fs = require('fs');
var Web3 = require("web3");
var BN = require("bignumber.js");
var web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
var dgpSpec = JSON.parse(fs.readFileSync('build/contracts/dgp.json', 'utf8'));
//var Dgp = new web3.eth.Contract(dgpSpec.abi);
var dgpAddress = '0xac1262f40427841de8b6da01affd27f2f1156875';
//var dgp = Dgp.at(dgpAddress);
var dgp = new web3.eth.Contract(dgpSpec.abi,dgpAddress);

// var deploy = function(from) {
//   return dgp.deploy(
//    {
//      from: from,
//      data: dgpSpec.unlinked_binary
//    })
//   .send({ from: from,
//           gas: 4000000 })
//   .on('transactionHash', function(transactionHash){ 
//       console.log(transactionHash); })
//   .on('receipt', function(receipt){
//       console.log(receipt.gasUsed)});
// };


// web3.eth.getAccounts().then(a=>{return a;})
// .then(a=>{
//   return deploy(a[0]);
// })
// .then(i=>{
//       console.log(i.options.address);
// });

    // event USDDonation(uint32 _value);
    // event UnlockedDeposit(address indexed _to, uint32 _value);
    // event LockedDeposit(address indexed _to, uint32 _value);
    // event RemoveClient(address indexed _removed, uint32 _value);
    // event Purchase(address indexed _client, address indexed _vendor, uint32 _value);
    // event Refund(address indexed _vendor, address _client, uint32 _value);
    // event Redemption(address indexed _vendor, uint32 _value);
    // event PurchaseDonation(address indexed _vendor, uint32 _value);
    // event SupporterETHDonation(address indexed _supporter, uint _value);
    // event RunningOutOfGas(address indexed _client);
    // event Transfer(address _recipient, uint _value);
//http://web3js.readthedocs.io/en/1.0/web3-eth-contract.html#once
console.log('testing...');
dgp.getPastEvents('allEvents',{ fromBlock: 0})
.then(events => {
    console.log(JSON.stringify(events));
});
 
function done() { console.log('done'); }
setTimeout(done, 10000);