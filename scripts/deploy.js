const hre = require("hardhat");

async function main() {
  console.log("Deploying LegacyVault contract...");

  const [deployer] = await hre.ethers.getSigners();
  console.log(`Deploying with account: ${deployer.address}`);

  // Get account balance
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log(`Account balance: ${hre.ethers.formatEther(balance)} ETH\n`);

  // Deploy LegacyVault contract
  const LegacyVault = await hre.ethers.getContractFactory("LegacyVault");
  const legacyVault = await LegacyVault.deploy();

  // Wait for deployment to finish
  await legacyVault.waitForDeployment();
  const contractAddress = await legacyVault.getAddress();

  console.log("✅ LegacyVault deployed successfully!");
  console.log(`📍 Contract Address: ${contractAddress}`);
  console.log(`🔗 Network: ${hre.network.name}`);

  // Print deployment info
  console.log("\n=== Deployment Info ===");
  console.log(`Owner: ${deployer.address}`);
  console.log(`Contract: ${contractAddress}`);
  console.log(`Network: ${hre.network.name}`);
  console.log(`Block: ${await hre.ethers.provider.getBlockNumber()}`);

  console.log("\n=== Next Steps ===");
  console.log("1. Initialize the vault with: legacyVault.initialize(inactivityPeriodInSeconds)");
  console.log("   Example: initialize(2592000) for 30 days");
  console.log("2. Deposit ETH: legacyVault.depositETH({ value: ethAmount })");
  console.log("3. Add heirs: legacyVault.addHeir(heirAddress, points)");
  console.log("4. Heirs can claim after inactivity period expires\n");

  // Save deployment info
  const deploymentInfo = {
    contractAddress: contractAddress,
    deployer: deployer.address,
    network: hre.network.name,
    blockNumber: await hre.ethers.provider.getBlockNumber(),
    timestamp: new Date().toISOString(),
  };

  const fs = require("fs");
  const deploymentPath = `./deployments/${hre.network.name}.json`;
  const deploymentDir = "./deployments";

  if (!fs.existsSync(deploymentDir)) {
    fs.mkdirSync(deploymentDir);
  }

  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
  console.log(`✅ Deployment info saved to: ${deploymentPath}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
