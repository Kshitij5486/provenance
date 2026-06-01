// build-tree.js — turn a list of items into a Merkle root, layer by layer
const { buildPoseidon } = require("circomlibjs");

async function main() {
  const poseidon = await buildPoseidon();
  const F = poseidon.F; // shortcut to the field helper for printing

  // helper: hash two field elements into one (this is Hash(left, right))
  const hash2 = (a, b) => poseidon([a, b]);

  // our four "approved items" — just numbers standing in for image identifiers
  const items = [11, 22, 33, 44];

  // LAYER 0 (leaves): hash each item on its own to get its leaf hash
  const leaves = items.map((x) => poseidon([x]));
  console.log("LEAVES (layer 0):");
  leaves.forEach((leaf, i) => console.log(`  H${i} =`, F.toObject(leaf)));

  // LAYER 1: pair the leaves and hash each pair
  const H01 = hash2(leaves[0], leaves[1]); // Hash(H0, H1)
  const H23 = hash2(leaves[2], leaves[3]); // Hash(H2, H3)
  console.log("\nLAYER 1:");
  console.log("  H01 =", F.toObject(H01));
  console.log("  H23 =", F.toObject(H23));

  // LAYER 2 (root): hash the two layer-1 nodes into the single root
  const root = hash2(H01, H23); // Hash(H01, H23)
  console.log("\nROOT (layer 2):");
  console.log("  root =", F.toObject(root));
}

main();