import { ethers } from 'ethers';

// Contract ABI containing the event and the recordTransaction function structure
const contractABI = [
  "event TransactionRecorded(address indexed provider, address indexed receiver, uint256 credits, uint256 occupationCode, uint256 timestamp)",
  "function recordTransaction(address provider, address receiver, uint256 hoursWorked, uint256 credits, uint256 occupationCode) public",
  "function getTransactionCount() public view returns (uint256)",
  "function balances(address) public view returns (int256)"
];

class BlockchainService {
  private provider: ethers.JsonRpcProvider | null = null;
  private wallet: ethers.Wallet | null = null;
  private contract: ethers.Contract | null = null;
  private isConfigured: boolean = false;

  constructor() {
    this.init();
  }

  /**
   * Initialize ethers connection using environment variables
   */
  private init() {
    try {
      const rpcUrl = process.env.SEPOLIA_RPC;
      const privateKey = process.env.PRIVATE_KEY;
      const contractAddress = process.env.CONTRACT_ADDRESS;

      // Ensure all necessary configs are present, otherwise log a warning and run in degraded mode
      if (!rpcUrl || !privateKey || !contractAddress) {
        console.warn('⚠️ Blockchain implementation is missing config (SEPOLIA_RPC, PRIVATE_KEY, or CONTRACT_ADDRESS). Blockchain logging skipped.');
        this.isConfigured = false;
        return;
      }

      this.provider = new ethers.JsonRpcProvider(rpcUrl);
      this.wallet = new ethers.Wallet(privateKey, this.provider);
      this.contract = new ethers.Contract(contractAddress, contractABI, this.wallet);
      this.isConfigured = true;

      console.log(`✅ Blockchain service configured for contract: ${contractAddress}`);
    } catch (error) {
      console.error('❌ Failed to initialize Blockchain service:', error);
      this.isConfigured = false;
    }
  }

  /**
   * Records a completed service transaction on the Ethereum (Sepolia) blockchain.
   * Resolves with the transaction hash upon success, or null if it fails or is not configured.
   */
  async recordServiceTransaction(params: {
    providerWallet: string;
    receiverWallet: string;
    hours: number;
    credits: number;
    occupationCode: string;
  }): Promise<string | null> {
    if (!this.isConfigured || !this.contract) {
      console.warn('⚠️ Blockchain not configured, skipping on-chain logging.');
      return null;
    }

    try {
      console.log(`🔗 Submitting transaction to Sepolia... Provider: ${params.providerWallet}, Receiver: ${params.receiverWallet}`);
      
      // Convert numeric properties ensuring they align with what solidity expects (uint256 usually handled automatically by ethers or explicitly via ethers.parseUnits/BigInt).
      // Since our values are small numbers we use Math.floor to avoid decimals because Solidity uint256 doesn't handle floats directly.
      // E.g. 1.5 hours -> multiplied or stored simply. If the contract supports exact numbers, BigInt is safer.
      // For this demo, assuming base unit scaling or scaling by 100 for decimals.
      
      // Convert to integer avoiding precision loss (Solidity expects uint256)
      const scaledHours = Math.floor(params.hours * 100); 
      const scaledCredits = Math.floor(params.credits * 100);
      
      // Usually occupation code string contains hyphen e.g "2512-01". We will hash it or strip it.
      // Easiest is to parse numeric or hash it to a uint256. For simplicity, we convert non-numeric to numbers or just hash.
      const occCodeNumeric = BigInt(ethers.id(params.occupationCode || 'unknown'));

      const tx = await this.contract.recordTransaction(
        params.providerWallet,
        params.receiverWallet,
        scaledHours,
        scaledCredits,
        occCodeNumeric
      );

      console.log(`⏳ Waiting for block confirmation... Tx Hash: ${tx.hash}`);
      
      const receipt = await tx.wait(1); // wait for 1 confirmation
      
      console.log(`✅ Transaction logged on-chain. Block: ${receipt.blockNumber}`);
      
      return tx.hash;
      
    } catch (error) {
      console.error('❌ Error recording transaction to blockchain:', error);
      // We return null instead of throwing so that the regular off-chain fairhour flow still completes
      return null;
    }
  }
}

export const blockchainService = new BlockchainService();
