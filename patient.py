from npre import bbs98
import ipfsapi
import json

pre = bbs98.PRE()

# Patient register
sk_a = pre.gen_priv(dtype=bytes)
pk_a = pre.priv2pub(sk_a)

# Patient encrypts test results
patient_data = '-'.join(['1', '2', '3', '4', '5', '6', '7', '8', '9']);
encrypted_data = pre.encrypt(pk_a, patient_data)

# Put measurements to IPFS (save 'decentralized')
api = ipfsapi.connect('127.0.0.1', 5001)
#res = api.add(data_filename)
res_id = api.add_json(patient_data); # should be encrypted_data, but hz how to save fucking bytes
print("Patient encrypted measurements saved in IPFS");
print("http://localhost:8080/ipfs/" + res_id)

### Reencrypt for oracle
# Get oracle public key
pk_b = pre.load_key(str.encode(input("\nEnter oracle public key\n")))

# Reencrypt
sk_e = pre.gen_priv(dtype=bytes)
rk_ae = pre.rekey(sk_a, sk_e)
e_b = pre.encrypt(pk_b, sk_e)
reencrypted_data = pre.reencrypt(rk_ae, encrypted_data)

print("\nData reencrypted for oracle:");
print(reencrypted_data)

print("\ne_b key for oracle:");
print(e_b)


# Put link to contract on Qtum
#call(["ls", "-l"])
