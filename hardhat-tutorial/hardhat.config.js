require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.18",
  networks:{
    mumbai:{
      url:"https://capable-stylish-general.matic-testnet.discover.quiknode.pro/25a44b3acd03554fa9450fe0a0744b1657132cb1/",
      accounts:["8ccca437f0e74b50ea78f4911dd42caad205e17653e040feb97a59187b3f206c"]
    },
  },
  etherscan:{
    apiKey:{
      polygonMumbai:"AURYABM9RVN5D4IV8JR6UIHST1YGB51SU4",
    },
  },
};
