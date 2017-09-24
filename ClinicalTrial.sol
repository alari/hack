pragma solidity ^0.4.17;

contract ClinicalTrial {
    enum Stages {
        Registration,// -> patients register themselves
        Presetting,// -> farma adds hash
        Entry,// -> patient(s?) adds hash of entry test
        Process,// -> patient(s?) adds hash of final test
        Research,// -> researcher adds map of PatientID => Indicator
        Revealing,// -> farma adds map of PatientID => isPlacebo
        Done
    }
    
    struct Patient {
        Stages stage;
        address prev;
        string entryHash;
        string finalHash;
        uint metric;
        bool isPlacebo;
    }
    
    struct Result {
        uint avgPlacebo;
        uint avgPills;
    }

    // This is the current stage.
    Stages public stage = Stages.Registration;

    uint numOfPatients;
    uint patientsIterator;
    address lastPatient;

    address public bigPharma;
    address public researcher;
    
    // hash of mapping from public patient ids to encrypted isPlacebo flag
    string public mappingHash; 
    
    // hashes of mapping from public patient ids to encrypted test result
    mapping(address => Patient) internal patients;
    
    function ClinicalTrial(address _bigPharma, uint _numOfPatients, address _researcher) public {
        bigPharma = _bigPharma;
        numOfPatients = _numOfPatients;
        researcher = _researcher;
    }
    
    modifier onlyBy(address _account)
    {
        require(msg.sender == _account);
        _;
    }

    modifier atStage(Stages _stage) {
        require(stage == _stage);
        _;
    }
    
    // This modifier goes to the next stage
    // after the function is done.
    modifier transitionNext()
    {
        _;
        patientsIterator = 0;
        advance();
    }

    modifier iterating()
    {
        require(patientsIterator < numOfPatients);
        _;
        if(patientsIterator == numOfPatients) {
            patientsIterator = 0;
            advance();
        }
    }
    
    modifier patientAtStage(Stages _stage) {
        require(stage == _stage);
        require(patients[msg.sender].stage == _stage);
        _;
    }

    function advance() internal {
        stage = Stages(uint(stage) + 1);
    }
    
    function advancePatient(address _patient, Stages _stage) internal {
        patients[_patient].stage = _stage;
        patientsIterator = patientsIterator + 1;
    }

    // Patient registers himself
    function registerPatient() public 
        iterating
        patientAtStage(Stages.Registration) {
            
            patients[msg.sender].stage = Stages.Entry;
            patientsIterator = patientsIterator + 1;
            if(lastPatient != 0x0) {
                patients[msg.sender].prev = lastPatient;
            }
            lastPatient = msg.sender;
            
        }
    
    // bigPharma has chosen who get placebo, who get pills,
    // encrypted the choices, saved them to external database,
    // hashed the collection, and this is a hash (e.g. mercle root)
    function setPlaceboEncryptedMappingHash(string _mappingHash) public
        onlyBy(bigPharma) 
        atStage(Stages.Presetting)
        transitionNext {
        
        mappingHash = _mappingHash;
        
    }
    
    // patient has passed his entry test, this is a hash of it
    // when all hashes are stored, advance
    function recordEntry(string _entryHash) public
        iterating
        patientAtStage(Stages.Entry) {
            
            patients[msg.sender].entryHash = _entryHash;
            
            // Then patient takes pills, expecting test results to change later
            advancePatient(msg.sender, Stages.Process);
            
        }
        
    // patient has eaten his pills and passed final test,
    // this is a hash of it
    // when all hashes are stored, advance
    function recordFinal(string _finalHash) public
        iterating
        patientAtStage(Stages.Process) {
            
            patients[msg.sender].finalHash = _finalHash;
            
            advancePatient(msg.sender, Stages.Research);
            
        }
       
    // researcher should calculate and add metric for each patient    
    function recordMetric(address _patient, uint _metric) public
        iterating
        onlyBy(researcher)
        atStage(Stages.Research) {
            require(patients[_patient].stage == Stages.Research);
            
            patients[_patient].metric = _metric;
            advancePatient(_patient, Stages.Revealing);
            
        }
      
    function revealPlaceboOrPill(address _patient, bool _isPlacebo) public
        iterating
        onlyBy(bigPharma)
        atStage(Stages.Revealing) {
            require(patients[_patient].stage == Stages.Revealing);
            
            patients[_patient].isPlacebo = _isPlacebo;
            advancePatient(_patient, Stages.Done);
        }
        
    function results() public constant
        atStage(Stages.Done) returns(Result result) {
            
            address addr = lastPatient;
            Patient patient;
            
            uint numPills;
            uint numPlacebo;
            uint sumPills;
            uint sumPlacebo;
            
            while(addr != 0x0) {
                patient = patients[addr];
                
                if(patient.isPlacebo) {
                    numPlacebo = numPlacebo + 1;
                    sumPlacebo = sumPlacebo + patient.metric;
                } else {
                    numPills = numPills + 1;
                    sumPills = sumPills + patient.metric;
                }
                
                addr = patient.prev;
            }
            
            result.avgPlacebo = sumPlacebo / numPlacebo;
            result.avgPills = sumPills / numPills;
            
        }

}
