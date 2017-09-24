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


function deployTrialContract() {
   var trialContract = web3.eth.contract(trialAbi);
  var trial = trialContract.new(_bigPharma, _numOfPatients, _researcher,
     { from: pharmAccount, data: trialBin, gas: defaultGas }, function (error1, contract1){
     if (error1) {
        console.error("could not mine clinical trial contract");
        process.exit(0);
     }
     if(contract1.address === undefined) {return;}

     console.log('Clinical trial contract mined! address: ' + contract1.address + ' transactionHash: ' + contract1.transactionHash);
  });
}

function registerPatient() {
   var trial = trialContract.at(trialContractAddress);

   console.log("stage");
   console.log(trial.stage.call());

   trial.registerPatient.sendTransaction({from: patientAccount1, gas: defaultGas},
      function (error1, txHash) {
         if(error1) {
            console.error("error registering patient", error1);
            process.exit(1);
         }
         console.log("registering patient",txHash);
      }
   )
}

function setPlaceboEncryptedMappingHash() {
   var trial = trialContract.at(trialContractAddress);
   trial.setPlaceboEncryptedMappingHash.sendTransaction(mappingHash, {from: pharmAccount, gas: defaultGas},
      function (error1, txHash) {
         if(error1) {
            console.error("error setting mapping hash", error1);
            process.exit(1);
         }
         console.log("setting mapping hash",txHash);
      }
   )
}

function recordEntry() {
   var trial = trialContract.at(trialContractAddress);
   trial.recordEntry.sendTransaction(entryHash, {from: patientAccount1, gas: defaultGas},
      function (error1, txHash) {
         if(error1) {
            console.error("error recordEntry", error1);
            process.exit(1);
         }
         console.log("setting recordEntry",txHash);
      }
   )
}

function recordFinal() {
   var trial = trialContract.at(trialContractAddress);
   trial.recordFinal.sendTransaction(entryHashFinal, {from: patientAccount1, gas: defaultGas},
      function (error1, txHash) {
         if(error1) {
            console.error("error recordFinal", error1);
            process.exit(1);
         }
         console.log("setting recordFinal",txHash);
      }
   )
}

function recordMetric() {
   var trial = trialContract.at(trialContractAddress);
   trial.recordMetric.sendTransaction(patientAccount1, metric, {from: researcherAccount, gas: defaultGas},
      function (error1, txHash) {
         if(error1) {
            console.error("error recordMetric", error1);
            process.exit(1);
         }
         console.log("setting recordMetric",txHash);
      }
   )
}

function revealPlaceboOrPill() {
   var trial = trialContract.at(trialContractAddress);
   trial.revealPlaceboOrPill.sendTransaction(patientAccount1, isPlacebo, {from: pharmAccount, gas: defaultGas},
      function (error1, txHash) {
         if(error1) {
            console.error("error revealPlaceboOrPill", error1);
            process.exit(1);
         }
         console.log("setting revealPlaceboOrPill",txHash);
      }
   )
}

function readResults() {
   var trial = trialContract.at(trialContractAddress);
   trial.results(function (error1, data) {
      
      console.log(data);
      
      data[0] = hex2string(data[0]);
      data[1] = hex2string(data[1]);
      console.log("Results: avgPlacebo = ",data[0]," avgPills = ", data[1]);
   })
   console.log(trial.stage.call());
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

main();
