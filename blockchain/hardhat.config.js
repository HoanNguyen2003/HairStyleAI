require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    ganache: {
      url: "HTTP://127.0.0.1:7545",
      accounts: [
        // Thay bằng private key từ Ganache accounts của bạn
        "0x2b39650a2abe9878f74174ad62c65885a1c202eaae0c92f508564b6d473c79af"
      ],
      chainId: 1337
    },
    development: {
      url: "HTTP://127.0.0.1:7545",
      network_id: "*"
    }
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  }
};