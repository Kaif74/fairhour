import { ethers } from 'ethers';

// Contract ABI containing the event and the recordTransaction function structure
const contractABI = [
  'event TransactionRecorded(address indexed provider, address indexed receiver, uint256 credits, uint256 occupationCode, uint256 timestamp, string creditsDisplay, string occupationCodeDisplay)',
  'function recordTransaction(address provider, address receiver, uint256 hoursWorked, uint256 credits, uint256 occupationCode, string creditsDisplay, string occupationCodeDisplay) public',
  'function getTransactionCount() public view returns (uint256)',
  'function balances(address) public view returns (int256)',
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
        console.warn(
          '⚠️ Blockchain implementation is missing config (SEPOLIA_RPC, PRIVATE_KEY, or CONTRACT_ADDRESS). Blockchain logging skipped.'
        );
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
      console.log(
        `🔗 Submitting transaction to Sepolia... Provider: ${params.providerWallet}, Receiver: ${params.receiverWallet}`
      );

      // Keep the on-chain accounting in scaled integer units, but also emit
      // human-readable strings so explorers can show the actual exchange values.
      const scaledHours = Math.round(params.hours * 100);
      const scaledCredits = Math.round(params.credits * 100);
      const creditsDisplay = params.credits.toFixed(2);
      const occupationCodeDisplay = params.occupationCode || 'unknown';
      const occCodeNumeric = BigInt(ethers.id(occupationCodeDisplay));

      const tx = await this.contract.recordTransaction(
        params.providerWallet,
        params.receiverWallet,
        scaledHours,
        scaledCredits,
        occCodeNumeric,
        creditsDisplay,
        occupationCodeDisplay
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
