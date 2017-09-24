require('babel-register');
require('babel-polyfill');

const Web3 = require('web3');
const fs = require('fs');
const Q = require('q');
const moment = require('moment');
const ipfs = require('ipfs');

const ipfsNode = new ipfs();

const web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8547'));

const trialBin = fs.readFileSync('./contract.bin', 'utf8');
const trialAbi = require('./contract-abi.json');

var trialContractAddress;
const trialContract = web3.eth.contract(trialAbi);

const defaultGas = 4700000;

const pharmAccount = '0x7125e93d19079c4174473651681a072311000415';
const researcherAccount = '0x0ed09b0147820eda3df5c736330a86a1d5378d18';

var numOfPatients;

const patients = [
  '0xa97720dcd6ac4e5ffbc85744d9677cce1fa73126',
  '0xee8fc1b17c98de61ab04e080c41813fa0a27c583',
  '0x38e1dd8c8e36138c15483fa7a897f8e00b6ec87a',
  '0x10696a3024ce6fc1024e18163fe97914e9d58d99',
  '0xb891ff0adf5fd40223ce7c94c6ef1b6d77c89b63'
]


console.log("Connecting to node");
console.log("===================================");

web3.eth.getBlockNumber(function (error, number) {
  console.log("blockNumber= " + number);
});

// Ugly helper to run web3 actions inside a Promise and benefit from async/await feature
function runPromise(cb) {
  return new Promise((resolve, reject) => cb((err, res) =>
    !!err ? reject(err) : resolve(res)
  ))
}

// At first, one should deploy a contract.
// Researcher address, pharm company address, and number of patients to join the trial are provided there.
async function deployTrialContract(_numOfPatients) {
  numOfPatients = _numOfPatients;
  return runPromise(cb => trialContract.new(pharmAccount, _numOfPatients, researcherAccount,
    {from: pharmAccount, data: trialBin, gas: defaultGas}, (err, contract) => {
      if (!contract.address) return;

      // On deployment, save contract address for further use.
      // It should be known for all parties
      if (!!contract && !!contract.address) trialContractAddress = contract.address
      cb(err, contract)
    }))
}

async function registerPatient() {
  // Each patient sends "registerPatient" transaction, saving patient's address to the list.
  // When the list is full and there's enough patients to run trial, pharm should choose who will get placebo, and who take pills
  return Promise.all(patients.slice(0, numOfPatients).map(p => runPromise(cb =>
    trialContract.at(trialContractAddress)
      .registerPatient.sendTransaction({from: p, gas: defaultGas}, cb))))

}

async function setPlaceboEncryptedMappingHash(_hash) {
  // Encrypting and decrypting is too expensive in the means of gas for ethereum.
  // So pharm company stores the mapping from patient addresses to encrypted (in non-determenistic way) flags, whether patient takes placebo or not
  // Hash of this mapping (e.g. Merkle root) is stored here, in order to prevent further changes
  return runPromise(cb =>
    trialContract.at(trialContractAddress)
      .setPlaceboEncryptedMappingHash.sendTransaction(_hash, {from: pharmAccount, gas: defaultGas}, cb))
}

async function recordEntry(_entryHash) {
  // Each patient passes some medical tests on the beginning of trial.
  // Tests could be huge. Tests data is to be stored somewhere, e.g. on Fluence or in IPFS.
  // Then patient provides hash of the data, e.g. Merkle root of it, to prevent any change
  return Promise.all(patients.slice(0, numOfPatients).map((p, i) => runPromise(cb =>
    trialContract.at(trialContractAddress)
      .recordEntry.sendTransaction(_entryHash[i], {from: p, gas: defaultGas}, cb)
  )))
}

async function recordFinal(_hash) {
  // After the course of pills or placebo is taken, each patient pass some medical tests again,
  // to see whether pills cure or not.
  return Promise.all(patients.slice(0, numOfPatients).map((p, i) => runPromise(cb =>
    trialContract.at(trialContractAddress)
      .recordFinal.sendTransaction(_hash[i], {from: p, gas: defaultGas}, cb)
  )))
}

async function recordMetric(_metric) {
  // Researcher looks the data of patients, and for each patient adds a numerical metric,
  // which refers to success rate of healing. Note: researcher still can't know who have been taking placebo.
  // Metrics are added without encryption: it's safe.
  return Promise.all(patients.slice(0, numOfPatients).map((p, i) => runPromise(cb =>
    trialContract.at(trialContractAddress)
      .recordMetric.sendTransaction(p, _metric[i], {from: researcherAccount, gas: defaultGas}, cb)
  )))
}

async function revealPlaceboOrPill(_isPlacebo) {
  // After metrics are collected, pharm company reveals who was taking pills, and who are not.
  // This data could be checked with the data stored on external DB on the beginning.
  return Promise.all(patients.slice(0, numOfPatients).map((p, i) => runPromise(cb =>
    trialContract.at(trialContractAddress)
      .revealPlaceboOrPill.sendTransaction(p, _isPlacebo[i], {from: pharmAccount, gas: defaultGas}, cb)
  )))
}

async function readResults() {
  // Now all the data is collected on a contract.
  // Contract provides a simple view of the results.
  // For demo purposes, it's just average of metric for both groups of patients.
  return runPromise(cb =>
    trialContract.at(trialContractAddress)
      .results.call((err, data) => {
      if (!!data) data = {avgPlacebo: data[0].toNumber(), avgPills: data[1].toNumber()}
      cb(err, data)
    })
  )
}

async function trial() {

  console.log("Deploying Clinical Trial contract...")
  const contract = await deployTrialContract(2);
  console.log("Deployed at: ", contract.address)

  const data = fs.readFileSync('./data.txt', 'utf8').split('\n');

  const mappingHash = data[0]
  const entryHash = data[1].split('|')
  const finalHash = data[2].split('|')
  const metric = data[3].split('|').map(s => parseInt(s))
  const isPlacebo = data[4].split('|').map(ip => ip.toLowerCase() === "true")

  // console.log("mappingHash", mappingHash)
  // console.log("entryHash", entryHash)
  // console.log("finalHash", finalHash)
  // console.log("metric", metric)
  // console.log("isPlacebo", isPlacebo)

  console.log("Registering patients...")
  await registerPatient()

  console.log("Pharma company provides encrypted mapping's hash...")
  await setPlaceboEncryptedMappingHash(mappingHash)

  console.log("Patients record theirs entry medical test data hashes...")
  await recordEntry(entryHash)

  console.log("Patients record theirs final medical test data hashes...")
  await recordFinal(finalHash)

  console.log("Researcher calculates metrics for each patient...")
  await recordMetric(metric)

  console.log("Pharm company reveals information about placebo takers...")
  await revealPlaceboOrPill(isPlacebo)

  console.log("Calculating average results")
  const results = await readResults()

  console.log("Results: ", results)
}

console.log("Clinical Trial")

trial()