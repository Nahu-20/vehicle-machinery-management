// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title CoffeeTraceability
 * @dev Government-grade blockchain attestation contract for the coffee supply chain.
 * Utilizes Role-Based Access Control (RBAC) to ensure only authorized entities 
 * (or API bridges) can log specific events. Once logged, data is immutable and tamper-proof.
 */
contract CoffeeTraceability is AccessControl {
    
    // --- Roles ---
    bytes32 public constant CULTIVATION_ROLE = keccak256("CULTIVATION_ROLE");
    bytes32 public constant PROCESSING_ROLE = keccak256("PROCESSING_ROLE");
    bytes32 public constant QUALITY_ROLE = keccak256("QUALITY_ROLE");
    bytes32 public constant EXPORT_ROLE = keccak256("EXPORT_ROLE");

    // --- Enums & Structs ---
    enum Stage { CULTIVATION, PROCESSING, QUALITY, EXPORT }

    struct AttestationEvent {
        Stage stage;
        uint256 timestamp;
        string actor;       // e.g., "Gera Cooperative Farmers"
        string location;    // e.g., "Jimma Zone, Oromia"
        string description; // Detailed description of the event
        string ipfsHash;    // Optional: IPFS CID for attached documents/certificates
    }

    struct CoffeeBatch {
        string batchId;
        string origin;
        string variety;
        bool isInitialized;
        bool isExported;
    }

    // --- State Variables ---
    // Mapping from Batch ID to Batch details
    mapping(string => CoffeeBatch) public batches;
    
    // Mapping from Batch ID to an array of chronological events
    mapping(string => AttestationEvent[]) private batchEvents;

    // --- Events ---
    event BatchCreated(string indexed batchId, string origin, string variety, uint256 timestamp);
    event StageLogged(string indexed batchId, Stage stage, string actor, uint256 timestamp);

    /**
     * @dev Constructor grants the deployer the default admin role.
     * The admin can then grant specific roles to the backend wallets or individual officers.
     */
    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        
        // For development convenience, we also grant the deployer all roles.
        // In production, these should be strictly separated.
        _grantRole(CULTIVATION_ROLE, msg.sender);
        _grantRole(PROCESSING_ROLE, msg.sender);
        _grantRole(QUALITY_ROLE, msg.sender);
        _grantRole(EXPORT_ROLE, msg.sender);
    }

    // --- Core Functions ---

    /**
     * @dev Initialize a new coffee batch. Must be done before any events are logged.
     */
    function createBatch(string memory _batchId, string memory _origin, string memory _variety) external onlyRole(CULTIVATION_ROLE) {
        require(!batches[_batchId].isInitialized, "Batch already exists");

        batches[_batchId] = CoffeeBatch({
            batchId: _batchId,
            origin: _origin,
            variety: _variety,
            isInitialized: true,
            isExported: false
        });

        emit BatchCreated(_batchId, _origin, _variety, block.timestamp);
    }

    /**
     * @dev Log Stage 1: Cultivation & Harvest
     */
    function logCultivation(
        string memory _batchId, 
        string memory _actor, 
        string memory _location, 
        string memory _description, 
        string memory _ipfsHash
    ) external onlyRole(CULTIVATION_ROLE) {
        _logEvent(_batchId, Stage.CULTIVATION, _actor, _location, _description, _ipfsHash);
    }

    /**
     * @dev Log Stage 2: Washing & Processing
     */
    function logProcessing(
        string memory _batchId, 
        string memory _actor, 
        string memory _location, 
        string memory _description, 
        string memory _ipfsHash
    ) external onlyRole(PROCESSING_ROLE) {
        _logEvent(_batchId, Stage.PROCESSING, _actor, _location, _description, _ipfsHash);
    }

    /**
     * @dev Log Stage 3: Quality Certification
     */
    function logQuality(
        string memory _batchId, 
        string memory _actor, 
        string memory _location, 
        string memory _description, 
        string memory _ipfsHash
    ) external onlyRole(QUALITY_ROLE) {
        _logEvent(_batchId, Stage.QUALITY, _actor, _location, _description, _ipfsHash);
    }

    /**
     * @dev Log Stage 4: Export Packaging & Shipment
     */
    function logExport(
        string memory _batchId, 
        string memory _actor, 
        string memory _location, 
        string memory _description, 
        string memory _ipfsHash
    ) external onlyRole(EXPORT_ROLE) {
        require(!batches[_batchId].isExported, "Batch already exported");
        
        _logEvent(_batchId, Stage.EXPORT, _actor, _location, _description, _ipfsHash);
        batches[_batchId].isExported = true;
    }

    // --- Internal Helpers ---

    function _logEvent(
        string memory _batchId, 
        Stage _stage, 
        string memory _actor, 
        string memory _location, 
        string memory _description, 
        string memory _ipfsHash
    ) internal {
        require(batches[_batchId].isInitialized, "Batch does not exist");
        require(!batches[_batchId].isExported || _stage == Stage.EXPORT, "Cannot modify exported batch");

        batchEvents[_batchId].push(AttestationEvent({
            stage: _stage,
            timestamp: block.timestamp,
            actor: _actor,
            location: _location,
            description: _description,
            ipfsHash: _ipfsHash
        }));

        emit StageLogged(_batchId, _stage, _actor, block.timestamp);
    }

    // --- View Functions ---

    /**
     * @dev Retrieve the entire history of a specific coffee batch.
     */
    function getBatchHistory(string memory _batchId) external view returns (AttestationEvent[] memory) {
        require(batches[_batchId].isInitialized, "Batch does not exist");
        return batchEvents[_batchId];
    }
    
    /**
     * @dev Retrieve basic batch details.
     */
    function getBatchDetails(string memory _batchId) external view returns (CoffeeBatch memory) {
        require(batches[_batchId].isInitialized, "Batch does not exist");
        return batches[_batchId];
    }
}
