import { ethers } from 'ethers';

// The Sepolia contract address you deployed
export const CONTRACT_ADDRESS = '0x38325654513D16f56a96E537242FBB6A8238a27A';

// We use Ethers.js Human-Readable ABI for clean, maintainable code
export const COFFEE_TRACEABILITY_ABI = [
  // --- Core Functions ---
  "function createBatch(string _batchId, string _origin, string _variety) external",
  "function logCultivation(string _batchId, string _actor, string _location, string _description, string _ipfsHash) external",
  "function logProcessing(string _batchId, string _actor, string _location, string _description, string _ipfsHash) external",
  "function logQuality(string _batchId, string _actor, string _location, string _description, string _ipfsHash) external",
  "function logExport(string _batchId, string _actor, string _location, string _description, string _ipfsHash) external",
  
  // --- View Functions (Using standard tuple syntax for structs) ---
  "function getBatchHistory(string _batchId) external view returns (tuple(uint8 stage, uint256 timestamp, string actor, string location, string description, string ipfsHash)[])",
  "function getBatchDetails(string _batchId) external view returns (tuple(string batchId, string origin, string variety, bool isInitialized, bool isExported))",
  
  // --- Events ---
  "event BatchCreated(string indexed batchId, string origin, string variety, uint256 timestamp)",
  "event StageLogged(string indexed batchId, uint8 stage, string actor, uint256 timestamp)"
];

/**
 * Helper to safely get env variables in both Node.js (Express) and Vite (React)
 */
const getEnv = (key: string) => {
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key];
  }
  if (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env[key]) {
    return (import.meta as any).env[key];
  }
  return undefined;
};

/**
 * Helper to get a read-only instance of the contract
 */
export const getBlockchainReader = () => {
  // Use Alchemy/Infura or a public Sepolia RPC endpoint
  const rpcUrl = getEnv('VITE_SEPOLIA_RPC_URL') || 'https://ethereum-sepolia-rpc.publicnode.com';
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  return new ethers.Contract(CONTRACT_ADDRESS, COFFEE_TRACEABILITY_ABI, provider);
};

/**
 * Helper to get a write-capable instance of the contract (requires private key)
 */
export const getBlockchainSigner = () => {
  const rpcUrl = getEnv('VITE_SEPOLIA_RPC_URL') || 'https://ethereum-sepolia-rpc.publicnode.com';
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  
  // In production, the private key must be injected via secure environment variables
  // WARNING: Never commit real private keys!
  const privateKey = getEnv('BLOCKCHAIN_PRIVATE_KEY');
  if (!privateKey) {
    throw new Error('BLOCKCHAIN_PRIVATE_KEY environment variable is missing.');
  }

  const wallet = new ethers.Wallet(privateKey, provider);
  return new ethers.Contract(CONTRACT_ADDRESS, COFFEE_TRACEABILITY_ABI, wallet);
};
