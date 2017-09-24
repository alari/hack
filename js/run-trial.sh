#!/bin/bash

pushd .

BASE="node trial.js"
$BASE deployTrialContract
$BASE registerPatient
$BASE setPlaceboEncryptedMappingHash
$BASE recordEntry
$BASE recordFinal
$BASE recordMetric
$BASE revealPlaceboOrPill
$BASE readResults

popd