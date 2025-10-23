const { ethers } = require("hardhat");
const fs = require('fs');
const path = require('path');

async function copyToFrontend() {
  console.log("\n📋 Copying contract files to frontend...");

  try {
    // Paths
    const artifactsDir = './artifacts/contracts';
    const frontendContractsDir = '../salon_hair/src/contracts';
    const frontendPublicDir = '../salon_hair/public';
    const addressesFile = './contractAddress/addresses.json';

    // Create frontend directories if they don't exist
    if (!fs.existsSync(frontendContractsDir)) {
      fs.mkdirSync(frontendContractsDir, { recursive: true });
      console.log("📁 Created frontend contracts directory");
    }

    if (!fs.existsSync(frontendPublicDir)) {
      fs.mkdirSync(frontendPublicDir, { recursive: true });
      console.log("📁 Created frontend public directory");
    }

    // Contract files to copy
    const contracts = [
      'HairStyleNFT.sol/HairStyleNFT.json',
      'Marketplace.sol/Marketplace.json'
    ];

    // Copy contract ABIs
    console.log("\n📄 Copying ABI files...");
    for (const contract of contracts) {
      const sourcePath = path.join(artifactsDir, contract);
      const contractName = contract.split('/')[1];
      const targetPath = path.join(frontendContractsDir, contractName);

      if (fs.existsSync(sourcePath)) {
        fs.copyFileSync(sourcePath, targetPath);
        console.log(`✅ Copied ${contractName} to src/contracts/`);
      } else {
        console.log(`❌ Not found: ${sourcePath}`);
      }
    }

    // Copy contract addresses to public folder
    console.log("\n📍 Copying contract addresses...");
    if (fs.existsSync(addressesFile)) {
      const targetAddressesPath = path.join(frontendPublicDir, 'contractAddresses.json');
      fs.copyFileSync(addressesFile, targetAddressesPath);
      console.log("✅ Copied contract addresses to public/contractAddresses.json");
      
      // Also copy to src for backup
      const backupAddressesPath = path.join(frontendContractsDir, 'addresses.json');
      fs.copyFileSync(addressesFile, backupAddressesPath);
      console.log("✅ Backup copy to src/contracts/addresses.json");
    } else {
      console.log("❌ Contract addresses file not found");
    }

    // Create a deployment info file
    console.log("\n📊 Creating deployment info...");
    const deploymentInfo = {
      lastDeployment: new Date().toISOString(),
      networkInfo: {
        name: "Ganache Local",
        chainId: 1337,
        rpcUrl: "http://127.0.0.1:7545"
      },
      contracts: {
        HairStyleNFT: {
          address: null, // Will be set after deployment
          verified: false
        },
        Marketplace: {
          address: null, // Will be set after deployment
          verified: false
        }
      },
      status: "deployed",
      frontendReady: true
    };

    const deploymentInfoPath = path.join(frontendPublicDir, 'deploymentInfo.json');
    fs.writeFileSync(deploymentInfoPath, JSON.stringify(deploymentInfo, null, 2));
    console.log("✅ Created deployment info file");

    // Verify frontend files
    console.log("\n🔍 Verifying frontend files...");
    const requiredFiles = [
      { path: path.join(frontendPublicDir, 'contractAddresses.json'), name: 'Contract Addresses' },
      { path: path.join(frontendContractsDir, 'HairStyleNFT.json'), name: 'HairStyleNFT ABI' },
      { path: path.join(frontendContractsDir, 'Marketplace.json'), name: 'Marketplace ABI' }
    ];

    let allFilesPresent = true;
    for (const file of requiredFiles) {
      if (fs.existsSync(file.path)) {
        console.log(`✅ ${file.name} - OK`);
      } else {
        console.log(`❌ ${file.name} - Missing`);
        allFilesPresent = false;
      }
    }

    if (allFilesPresent) {
      console.log("\n🎉 All contract files copied successfully!");
      console.log("📱 Frontend is ready to connect to smart contracts!");
    } else {
      console.log("\n⚠️  Some files are missing. Check the errors above.");
    }

    return allFilesPresent;

  } catch (error) {
    console.error("❌ Error copying files to frontend:", error);
    console.log("⚠️  Deploy successful but frontend copy failed.");
    console.log("🔧 Manual copy commands:");
    console.log("   cp ./contractAddress/addresses.json ../salon_hair/public/contractAddresses.json");
    console.log("   cp ./artifacts/contracts/HairStyleNFT.sol/HairStyleNFT.json ../salon_hair/src/contracts/");
    console.log("   cp ./artifacts/contracts/Marketplace.sol/Marketplace.json ../salon_hair/src/contracts/");
    return false;
  }
}

async function updateDeploymentInfo(hairStyleNFTAddress, marketplaceAddress) {
  console.log("\n📊 Updating deployment info...");
  
  try {
    const frontendPublicDir = '../salon_hair/public';
    const deploymentInfoPath = path.join(frontendPublicDir, 'deploymentInfo.json');
    
    let deploymentInfo = {};
    if (fs.existsSync(deploymentInfoPath)) {
      deploymentInfo = JSON.parse(fs.readFileSync(deploymentInfoPath, 'utf8'));
    }
    
    // Update with actual addresses
    deploymentInfo.contracts.HairStyleNFT.address = hairStyleNFTAddress;
    deploymentInfo.contracts.Marketplace.address = marketplaceAddress;
    deploymentInfo.contracts.HairStyleNFT.verified = true;
    deploymentInfo.contracts.Marketplace.verified = true;
    deploymentInfo.lastUpdate = new Date().toISOString();
    
    fs.writeFileSync(deploymentInfoPath, JSON.stringify(deploymentInfo, null, 2));
    console.log("✅ Deployment info updated with contract addresses");
    
  } catch (error) {
    console.warn("⚠️ Could not update deployment info:", error.message);
  }
}

async function main() {
  console.log("🚀 Bắt đầu deploy contracts...");

  // Get deployer account - ethers v6 syntax
  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying contracts with account:", deployer.address);
  
  // Check balance - ethers v6 syntax
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "ETH");

  // Deploy HairStyleNFT với initialOwner - ethers v6 syntax
  console.log("\n🎨 Deploying HairStyleNFT...");
  const HairStyleNFT = await ethers.getContractFactory("HairStyleNFT");
  const hairStyleNFT = await HairStyleNFT.deploy(deployer.address); // Pass initialOwner
  await hairStyleNFT.waitForDeployment(); // ethers v6 syntax
  const hairStyleNFTAddress = await hairStyleNFT.getAddress(); // ethers v6 syntax
  console.log("✅ HairStyleNFT deployed to:", hairStyleNFTAddress);

  // Deploy Marketplace với NFT contract address và initialOwner - ethers v6 syntax
  console.log("\n🏪 Deploying Marketplace...");
  const Marketplace = await ethers.getContractFactory("Marketplace");
  const marketplace = await Marketplace.deploy(hairStyleNFTAddress, deployer.address); // Pass NFT address and initialOwner
  await marketplace.waitForDeployment(); // ethers v6 syntax
  const marketplaceAddress = await marketplace.getAddress(); // ethers v6 syntax
  console.log("✅ Marketplace deployed to:", marketplaceAddress);

  // Save contract addresses
  const addresses = {
    HairStyleNFT: hairStyleNFTAddress,
    Marketplace: marketplaceAddress,
    network: "ganache",
    chainId: 1337,
    deployedAt: new Date().toISOString(),
    deployer: deployer.address
  };

  // Create contractAddress directory if it doesn't exist
  const contractDir = './contractAddress';
  if (!fs.existsSync(contractDir)) {
    fs.mkdirSync(contractDir);
  }

  // Save addresses to JSON file
  fs.writeFileSync(
    './contractAddress/addresses.json',
    JSON.stringify(addresses, null, 2)
  );

  console.log("\n📄 Contract addresses saved to contractAddress/addresses.json");

  // Copy all files to frontend
  const copySuccess = await copyToFrontend();

  // Update deployment info with actual addresses
  await updateDeploymentInfo(hairStyleNFTAddress, marketplaceAddress);

  // Verify deployment
  console.log("\n🔍 Verifying deployment...");
  try {
    const nftName = await hairStyleNFT.name();
    const nftSymbol = await hairStyleNFT.symbol();
    const totalTokens = await hairStyleNFT.getTotalTokens();
    const feePercent = await marketplace.feePercent();
    
    console.log("✅ HairStyleNFT verified:", nftName, "(" + nftSymbol + ")");
    console.log("✅ Total tokens minted:", totalTokens.toString());
    console.log("✅ Marketplace verified: Fee", (Number(feePercent) / 100).toString() + "%");
  } catch (error) {
    console.log("⚠️  Verification skipped:", error.message);
  }

  console.log("\n" + "=".repeat(60));
  console.log("🎉 DEPLOYMENT COMPLETED SUCCESSFULLY!");
  console.log("=".repeat(60));
  console.log("🎨 HairStyleNFT:", hairStyleNFTAddress);
  console.log("🏪 Marketplace:", marketplaceAddress);
  console.log("🌐 Network: Ganache (localhost:7545)");
  console.log("📁 Frontend files:", copySuccess ? "✅ Ready" : "⚠️ Check manually");
  console.log("📱 Frontend status:", copySuccess ? "✅ Ready to start" : "⚠️ May need manual setup");
  console.log("=".repeat(60));
  
  if (copySuccess) {
    console.log("\n🚀 Next steps:");
    console.log("   cd ../salon_hair");
    console.log("   npm start");
    console.log("\n💡 Your DApp is ready to use!");
  } else {
    console.log("\n🔧 Manual setup needed:");
    console.log("   1. Copy contract files manually (see commands above)");
    console.log("   2. cd ../salon_hair");
    console.log("   3. npm start");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deploy failed:", error);
    process.exit(1);
  });