// hash-demo.js — watch Poseidon turn inputs into a fingerprint
const { buildPoseidon } = require("circomlibjs");

async function main() {
  // buildPoseidon() loads the Poseidon hasher (it's async — takes a moment to initialize)
  const poseidon = await buildPoseidon();

  // hash a single value
  const h1 = poseidon([5]);
  // hash two values together (this is what tree-building uses: Hash(left, right))
  const h2 = poseidon([5, 6]);

  // Poseidon returns its result in an internal field format;
  // poseidon.F.toObject(...) converts it into a normal big number we can read
  console.log("Poseidon([5])    =", poseidon.F.toObject(h1));
  console.log("Poseidon([5, 6]) =", poseidon.F.toObject(h2));

  // prove determinism: same input -> same fingerprint
  console.log("Poseidon([5]) again =", poseidon.F.toObject(poseidon([5])));

  // prove the avalanche effect: tiny change -> totally different fingerprint
  console.log("Poseidon([5, 7]) =", poseidon.F.toObject(poseidon([5, 7])));
}

main();