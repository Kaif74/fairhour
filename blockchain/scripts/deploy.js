import hardhat from 'hardhat';
const { ethers } = hardhat;

async function main() {
  console.log("Preparing to deploy TimeBankLedger...");

  const Ledger = await ethers.getContractFactory("TimeBankLedger");
  const ledger = await Ledger.deploy();

  await ledger.waitForDeployment();

  const address = await ledger.getAddress();
  console.log("-----------------------------------------");
  console.log("TimeBankLedger deployed to:", address);
  console.log("-----------------------------------------");
  console.log("Please copy this address and add it to your server/.env file as:");
  console.log(`CONTRACT_ADDRESS="${address}"`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
