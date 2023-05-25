const {ethers} = require ("hardhat");
const{LINK_TOKEN,KEY_HASH,VRF_COORDINATOR,FEE} = require("../constants/index");

async function main(){
  const randomWinnerGame = await ethers.getContractFactory("RandomWinnerGame");
  const deployedRandomWinnerGame = await randomWinnerGame.deploy(
    VRF_COORDINATOR,
    LINK_TOKEN,
    KEY_HASH,
    FEE
  );

  await deployedRandomWinnerGame.deployed();
  console.log("Verify Contarct Address",deployedRandomWinnerGame.address);
  console.log("Sleeping...");
  await sleep(30000);

  await hre.run("verify:verify",{
    address:deployedRandomWinnerGame.address,
    constructorArguments:[VRF_COORDINATOR,LINK_TOKEN,KEY_HASH,FEE],
  });
}
  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
  
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });