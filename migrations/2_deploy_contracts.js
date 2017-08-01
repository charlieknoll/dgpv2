var ConvertLib = artifacts.require("./ConvertLib.sol");
var Dgp = artifacts.require("./Dgp.sol");

module.exports = function(deployer) {
  deployer.deploy(Dgp);
  //deployer.deploy(ConvertLib);
  //deployer.link(ConvertLib, MetaCoin);
  //deployer.deploy(MetaCoin);
};
