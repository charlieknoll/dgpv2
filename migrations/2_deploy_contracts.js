var ConvertLib = artifacts.require("./ConvertLib.sol");
var Dgp = artifacts.require("./Dgp.sol");

module.exports = function(deployer,network, accounts) {
  deployer.deploy(Dgp, accounts[1]);
  //deployer.deploy(ConvertLib);
  //deployer.link(ConvertLib, MetaCoin);
  //deployer.deploy(MetaCoin);
};
