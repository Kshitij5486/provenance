// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IVerifier {
    function verifyProof(
        uint[2] calldata a,
        uint[2][2] calldata b,
        uint[2] calldata c,
        uint[7] calldata pubSignals
    ) external view returns (bool);
}

contract Registry {
    IVerifier public verifier;

    struct Attestation {
        uint256 envCommitment;
        uint256 policyId;
        uint64  timestamp;
        bool    exists;
    }
    mapping(uint256 => Attestation) public attestations;

    event AttestationSubmitted(uint256 indexed artifactHash, uint256 policyId);

    constructor(address verifierAddress) {
        verifier = IVerifier(verifierAddress);
    }

    function submitAttestation(
        uint[2] calldata a,
        uint[2][2] calldata b,
        uint[2] calldata c,
        uint[7] calldata pub
    ) external {
        // pub layout: [0]=envCommitment [1]=imagesRoot [2]=toolchainsRoot
        //             [3]=minIsolation  [4]=sourceCommit [5]=policyId [6]=artifactHash
        uint256 envCommitment = pub[0];
        uint256 policyId      = pub[5];
        uint256 artifactHash  = pub[6];

        require(!attestations[artifactHash].exists, "Already attested");
        require(verifier.verifyProof(a, b, c, pub), "Invalid proof");

        attestations[artifactHash] = Attestation({
            envCommitment: envCommitment,
            policyId:      policyId,
            timestamp:     uint64(block.timestamp),
            exists:        true
        });

        emit AttestationSubmitted(artifactHash, policyId);
    }

    function getAttestation(uint256 artifactHash)
        external view
        returns (bool found, uint256 policyId, uint64 timestamp)
    {
        Attestation memory at = attestations[artifactHash];
        return (at.exists, at.policyId, at.timestamp);
    }
}
