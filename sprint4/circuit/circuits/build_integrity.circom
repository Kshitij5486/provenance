pragma circom 2.1.6;

include "../node_modules/circomlib/circuits/poseidon.circom";
include "../node_modules/circomlib/circuits/comparators.circom";

// Proves `leaf` sits under `root`, given its sibling path.
// This is your Sprint 3 climb loop, expressed as circuit constraints.
template MerkleInclusion(depth) {
    signal input leaf;
    signal input pathElements[depth];
    signal input pathIndices[depth];   // 0 = we're the LEFT child, 1 = RIGHT
    signal output root;

    signal cur[depth + 1];
    cur[0] <== leaf;

    component hashers[depth];
    signal left[depth];
    signal right[depth];

    for (var i = 0; i < depth; i++) {
        pathIndices[i] * (pathIndices[i] - 1) === 0;

        left[i]  <== cur[i] + pathIndices[i] * (pathElements[i] - cur[i]);
        right[i] <== pathElements[i] + pathIndices[i] * (cur[i] - pathElements[i]);

        hashers[i] = Poseidon(2);
        hashers[i].inputs[0] <== left[i];
        hashers[i].inputs[1] <== right[i];
        cur[i + 1] <== hashers[i].out;
    }

    root <== cur[depth];
}
// The main circuit: proves a build met policy without revealing the environment.
template BuildIntegrity(depth) {
    // ---- PRIVATE witness: the actual build environment (stays secret) ----
    signal input baseImageHash;
    signal input toolchainHash;
    signal input isolationLevel;
    signal input networkDisabled;
    signal input salt;

    signal input imagePathElements[depth];
    signal input imagePathIndices[depth];
    signal input toolchainPathElements[depth];
    signal input toolchainPathIndices[depth];

    // ---- PUBLIC inputs: the policy + what we're attesting to ----
    signal input imagesRoot;
    signal input toolchainsRoot;
    signal input minIsolation;
    signal input sourceCommit;
    signal input policyId;
    signal input artifactHash;

    // ---- PUBLIC output ----
    signal output envCommitment;

    // CLAIM 1: the base image is in the approved set
    component imgProof = MerkleInclusion(depth);
    imgProof.leaf <== baseImageHash;
    for (var i = 0; i < depth; i++) {
        imgProof.pathElements[i] <== imagePathElements[i];
        imgProof.pathIndices[i]  <== imagePathIndices[i];
    }
    imgProof.root === imagesRoot;

    // CLAIM 2: the toolchain is in the approved set
    component tcProof = MerkleInclusion(depth);
    tcProof.leaf <== toolchainHash;
    for (var i = 0; i < depth; i++) {
        tcProof.pathElements[i] <== toolchainPathElements[i];
        tcProof.pathIndices[i]  <== toolchainPathIndices[i];
    }
    tcProof.root === toolchainsRoot;

    // CLAIM 3: network was disabled during the build
    networkDisabled === 1;

    // CLAIM 4: isolation level met the policy minimum
    component iso = GreaterEqThan(8);
    iso.in[0] <== isolationLevel;
    iso.in[1] <== minIsolation;
    iso.out === 1;

    // BIND IT ALL: commit to the private env + public facts
    component commit = Poseidon(8);
    commit.inputs[0] <== baseImageHash;
    commit.inputs[1] <== toolchainHash;
    commit.inputs[2] <== isolationLevel;
    commit.inputs[3] <== networkDisabled;
    commit.inputs[4] <== sourceCommit;
    commit.inputs[5] <== policyId;
    commit.inputs[6] <== artifactHash;
    commit.inputs[7] <== salt;
    envCommitment <== commit.out;
}

component main {
    public [imagesRoot, toolchainsRoot, minIsolation, sourceCommit, policyId, artifactHash]
} = BuildIntegrity(10);