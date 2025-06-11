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
        "0x774e8c6405a8f7e0e2445422c2112d8556a7caca6687c3e7113617d9cbb7eca7"
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