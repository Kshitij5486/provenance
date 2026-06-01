// test/try-proof.js — generate a real proof from our input and self-verify it
const path = require("path");
const snarkjs = require("snarkjs");
const { makeInput } = require("./make-input");

async function main() {
  const input = await makeInput();

  const wasm = path.join(__dirname, "../build/build_integrity_js/build_integrity.wasm");
  const zkey = path.join(__dirname, "../build/bi_final.zkey");
  const vkeyPath = path.join(__dirname, "../build/verification_key.json");

  console.log("Generating proof...");
  const { proof, publicSignals } = await snarkjs.groth16.fullProve(input, wasm, zkey);

  const vKey = require(vkeyPath);
  const ok = await snarkjs.groth16.verify(vKey, publicSignals, proof);

  console.log("publicSignals:", publicSignals);
  console.log("PROOF VALID?", ok);
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });