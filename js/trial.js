require('babel-register');
require('babel-polyfill');

var Web3 = require('web3');
var fs = require('fs');
var Q = require('q');
var moment = require('moment');
var ipfs = require('ipfs');

var ipfsNode = new ipfs();

var web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8547'));

var trialBin = fs.readFileSync('./contract.bin', 'utf8');
var trialAbi = require('./contract-abi.json');

var trialContractAddress = '0x6aeade68950e94107bad70a3478de44987bf638b';
var trialContract = web3.eth.contract(trialAbi);

var defaultGas = 4700000;

var pharmAccount = '0x7125e93d19079c4174473651681a072311000415';
var researcherAccount = '0x0ed09b0147820eda3df5c736330a86a1d5378d18';
var patientAccount1 = '0xa97720dcd6ac4e5ffbc85744d9677cce1fa73126';

var _bigPharma = pharmAccount;
var _numOfPatients = 1;
var _researcher = researcherAccount;

var mappingHash = '123';
var entryHash = 'qwe';
var entryHashFinal = 'qwe2';
var metric = 10;
var isPlacebo = true;


console.log("Connecting to node");
console.log("===================================");

web3.eth.getBlockNumber(function(error, number){
   console.log("blockNumber= "+number);
});

function hex2string(hex) {
   hex = hex.slice(2);
   const str = new Buffer(hex, 'hex').toString();
   var ret= "";
   for(var i=0;i<str.length;i++) {
      if(str[i] == String.fromCharCode(0)) { break; }
      ret += str[i];
   }
   return ret;
}

function runPromise(cb) {
  return new Promise((resolve, reject) => cb((err, res) =>
    !!err ? reject(err) : resolve(res)
  ))
}

async function deployTrialContract() {
  return runPromise(cb => trialContract.new(_bigPharma, _numOfPatients, _researcher,
    { from: pharmAccount, data: trialBin, gas: defaultGas }, (err, contract) => {
    if(!contract.address) return;
    if(!!contract && !!contract.address) trialContractAddress = contract.address
      cb(err, contract)
    }))
}

async function registerPatient() {
  return runPromise(cb =>
    trialContract.at(trialContractAddress)
      .registerPatient.sendTransaction({from: patientAccount1, gas: defaultGas},cb))
}

async function setPlaceboEncryptedMappingHash(_hash) {
  return runPromise(cb =>
    trialContract.at(trialContractAddress)
      .setPlaceboEncryptedMappingHash.sendTransaction(_hash, {from: pharmAccount, gas: defaultGas}, cb))
}

async function recordEntry(_entryHash) {
  return runPromise(cb =>
    trialContract.at(trialContractAddress)
      .recordEntry.sendTransaction(_entryHash, {from: patientAccount1, gas: defaultGas}, cb)
  )
}

async function recordFinal(_hash) {
  return runPromise(cb =>
    trialContract.at(trialContractAddress)
      .recordFinal.sendTransaction(_hash, {from: patientAccount1, gas: defaultGas}, cb)
  )
}

async function recordMetric(_metric) {
  return runPromise(cb =>
    trialContract.at(trialContractAddress)
      .recordMetric.sendTransaction(patientAccount1, _metric, {from: researcherAccount, gas: defaultGas}, cb)
  )
}

async function revealPlaceboOrPill(_isPlacebo) {
  return runPromise(cb =>
    trialContract.at(trialContractAddress)
      .revealPlaceboOrPill.sendTransaction(patientAccount1, _isPlacebo, {from: pharmAccount, gas: defaultGas}, cb)
  )
}

async function readResults() {
  return runPromise(cb =>
    trialContract.at(trialContractAddress)
      .results.call((err, data) => {
      if(!!data) data = {avgPlacebo: data[0].toNumber(), avgPills: data[1].toNumber()}
      cb(err, data)
    })
  )
}




function main() {
   if(process.argv.length < 3) {
      console.error("Please specify action to run");
      process.exit(1);
   }

   var cmd = process.argv[2];

   if(cmd === 'deployTrialContract') {
      deployTrialContract();
   }
   else if(cmd === 'registerPatient') {
      registerPatient();
   }
   else if(cmd === 'setPlaceboEncryptedMappingHash') {
      setPlaceboEncryptedMappingHash();
   }
   else if(cmd === 'recordEntry') {
      recordEntry();
   }
   else if(cmd === 'recordFinal') {
      recordFinal();
   }
   else if(cmd === 'recordMetric') {
      recordMetric();
   }
   else if(cmd === 'revealPlaceboOrPill') {
      revealPlaceboOrPill();
   }
   else if(cmd === 'readResults') {
      readResults();
   }
}

//main();

async function trial(){


  const contract = await deployTrialContract();
  console.log("mined: ", contract.address)

  const data = fs.readFileSync('./data.txt', 'utf8').split('\n');

  const mappingHash = data[0]
  const entryHash = data[1]
  const finalHash = data[2]
  const metric = parseInt(data[3])
  const isPlacebo = data[4].toLowerCase() === "true"

  // console.log("mappingHash", mappingHash)
  // console.log("entryHash", entryHash)
  // console.log("finalHash", finalHash)
  // console.log("metric", metric)
  // console.log("isPlacebo", isPlacebo)

  await registerPatient()
  await setPlaceboEncryptedMappingHash(mappingHash)
  await recordEntry(entryHash)
  await recordFinal(finalHash)
  await recordMetric(metric)
  await revealPlaceboOrPill(isPlacebo)
  const results = await readResults()

  console.log("Results: ", results)
}

console.log("hello world")

trial()