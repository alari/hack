from npre import bbs98
import ipfsapi
import os,sys
from subprocess import call
import struct

pre = bbs98.PRE()

# Patient register
sk_a = pre.gen_priv(dtype=bytes)
pk_a = pre.priv2pub(sk_a)

# Patient encrypts test results
patient_data = ''.join(["... measurements ..."]);
encrypted_data = pre.encrypt(pk_a, patient_data)

# Save measurements locally
data_filename = './patient-data/patient.txt';
f = open(data_filename,'w')
f.write(patient_data) ## should be encrypted_data if understand how to serialize pk_a
f.close()

print(encrypted_data);

# Put measurements to IPFS (save 'decentralized')
api = ipfsapi.connect('127.0.0.1', 5001)
res = api.add(data_filename)
#res = api.add_json(encrypted_measurements);

# Put link to contract on Qtum
#call(["ls", "-l"])


