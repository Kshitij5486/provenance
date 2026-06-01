// test/registry-test.js — the whole machine: real proof verified on-chain
const { expect } = require("chai");
const { ethers } = require("hardhat");
const path = require("path");
const snarkjs = require("snarkjs");
const { makeInput } = require("./make-input");

describe("Registry (ZK on-chain verification)", function () {
  this.timeout(120000); // proof generation is slow; allow extra time

  let registry, validProof;

  before(async function () {
    // 1. deploy the auto-generated Verifier
    const Verifier = await ethers.getContractFactory("Groth16Verifier");
    const verifier = await Verifier.deploy();
    await verifier.waitForDeployment();

    // 2. deploy Registry, pointing it at the Verifier
    const Registry = await ethers.getContractFactory("Registry");
    registry = await Registry.deploy(await verifier.getAddress());
    await registry.waitForDeployment();

    // 3. generate a real proof from our valid input
    const input = await makeInput();
    const wasm = path.join(__dirname, "../build/build_integrity_js/build_integrity.wasm");
    const zkey = path.join(__dirname, "../build/bi_final.zkey");
    const { proof, publicSignals } = await snarkjs.groth16.fullProve(input, wasm, zkey);

    // 4. format proof + public signals into the shape Solidity expects.
    //    snarkjs gives us a helper that prints exactly the calldata.
    const calldata = await snarkjs.groth16.exportSolidityCallData(proof, publicSignals);
    const parsed = JSON.parse("[" + calldata + "]"); // -> [a, b, c, pubSignals]
    validProof = { a: parsed[0], b: parsed[1], c: parsed[2], pub: parsed[3] };
  });

  it("accepts a valid proof and records the attestation", async function () {
    const { a, b, c, pub } = validProof;
    await expect(registry.submitAttestation(a, b, c, pub))
      .to.emit(registry, "AttestationSubmitted");

    // pub[5] is artifactHash -> check it got recorded
    const artifactHash = pub[6];
    const [found] = await registry.getAttestation(artifactHash);
    expect(found).to.equal(true);
  });

  it("rejects a tampered proof", async function () {
    const { a, b, c, pub } = validProof;
    // flip one bit of the proof -> should fail verification on-chain
    const badA = [a[0], (BigInt(a[1]) ^ 1n).toString()];
    await expect(registry.submitAttestation(badA, b, c, pub))
      .to.be.reverted;
  });
});