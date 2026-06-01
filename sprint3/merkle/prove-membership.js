// prove-membership.js — prove item 33 (leaf H2) is in the tree, then verify
const { buildPoseidon } = require("circomlibjs");

async function main() {
  const poseidon = await buildPoseidon();
  const F = poseidon.F;
  const hash2 = (a, b) => poseidon([a, b]);

  const items = [11, 22, 33, 44];
  const leaves = items.map((x) => poseidon([x]));

  // rebuild the tree (same as before) so we have the real root to check against
  const H01 = hash2(leaves[0], leaves[1]);
  const H23 = hash2(leaves[2], leaves[3]);
  const root = hash2(H01, H23);

  // ---- THE PROOF for item at index 2 (value 33, leaf H2) ----
  const leaf = leaves[2];               // our leaf, H2
  const pathElements = [leaves[3], H01]; // sibling hashes climbing up: [H3, H01]
  const pathIndices  = [0, 1];           // direction at each step (explained below)

  // ---- VERIFY: recompute the root from leaf + path, step by step ----
  let current = leaf;
  for (let level = 0; level < pathElements.length; level++) {
    const sibling = pathElements[level];
    if (pathIndices[level] === 0) {
      // index 0 = current node is on the LEFT, sibling on the RIGHT
      current = hash2(current, sibling);
    } else {
      // index 1 = current node is on the RIGHT, sibling on the LEFT
      current = hash2(sibling, current);
    }
    console.log(`after level ${level}:`, F.toObject(current));
  }

  // compare our recomputed root to the real root
  const computedRoot = F.toObject(current);
  const realRoot = F.toObject(root);
  console.log("\ncomputed root:", computedRoot);
  console.log("real root:    ", realRoot);
  console.log("MEMBERSHIP VALID?", computedRoot === realRoot);
}

main();