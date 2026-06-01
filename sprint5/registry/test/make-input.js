// test/make-input.js — build a valid circuit input (a legit "approved" build)
const { buildPoseidon } = require("circomlibjs");

const DEPTH = 10;

// Build a fixed-depth Poseidon Merkle tree (your Sprint 3 logic).
async function buildTree(poseidon, leaves, depth) {
  const F = poseidon.F;
  const size = 2 ** depth;
  const layer0 = leaves.slice();
  while (layer0.length < size) layer0.push(0n); // pad empty slots with 0
  const layers = [layer0];
  let cur = layer0;
  for (let d = 0; d < depth; d++) {
    const next = [];
    for (let i = 0; i < cur.length; i += 2) {
      next.push(F.toObject(poseidon([cur[i], cur[i + 1]])));
    }
    layers.push(next);
    cur = next;
  }
  return { root: cur[0], layers };
}

// Get the sibling path + directions for the leaf at `index` (your Sprint 3 getProof).
function getProof(layers, index, depth) {
  const pathElements = [];
  const pathIndices = [];
  let idx = index;
  for (let d = 0; d < depth; d++) {
    const isRight = idx & 1;
    const sibling = layers[d][isRight ? idx - 1 : idx + 1];
    pathElements.push(sibling.toString());
    pathIndices.push(isRight.toString());
    idx = Math.floor(idx / 2);
  }
  return { pathElements, pathIndices };
}

// Build a complete, VALID circuit input.
async function makeInput() {
  const poseidon = await buildPoseidon();
  const F = poseidon.F;

  // pretend "approved" sets — just numbers standing in for image/toolchain ids
  const imageItems     = [101n, 102n, 103n, 104n];
  const toolchainItems = [201n, 202n, 203n, 204n];

  // leaves = Poseidon(item)  (single-input hash, like Sprint 3)
  const imageLeaves     = imageItems.map((x) => F.toObject(poseidon([x])));
  const toolchainLeaves = toolchainItems.map((x) => F.toObject(poseidon([x])));

  const imgTree = await buildTree(poseidon, imageLeaves, DEPTH);
  const tcTree  = await buildTree(poseidon, toolchainLeaves, DEPTH);

  // we'll use image index 1 (item 102) and toolchain index 2 (item 203)
  const imgIdx = 1, tcIdx = 2;
  const imgPath = getProof(imgTree.layers, imgIdx, DEPTH);
  const tcPath  = getProof(tcTree.layers, tcIdx, DEPTH);

  const input = {
    // private witness
    baseImageHash:   imageLeaves[imgIdx].toString(),
    toolchainHash:   toolchainLeaves[tcIdx].toString(),
    isolationLevel:  "5",
    networkDisabled: "1",
    salt:            "12345",
    imagePathElements:     imgPath.pathElements,
    imagePathIndices:      imgPath.pathIndices,
    toolchainPathElements: tcPath.pathElements,
    toolchainPathIndices:  tcPath.pathIndices,
    // public inputs
    imagesRoot:     imgTree.root.toString(),
    toolchainsRoot: tcTree.root.toString(),
    minIsolation:   "3",
    sourceCommit:   "777",
    policyId:       "42",
    artifactHash:   "999",
  };
  return input;
}

module.exports = { makeInput };