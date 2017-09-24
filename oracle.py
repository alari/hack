from npre import bbs98
import ipfsapi
import json

### Init
# Generate keys

pre = bbs98.PRE()

# Oracle register
sk_b = pre.gen_priv(dtype=bytes)
pk_b = pre.priv2pub(sk_b)

print("Oracle public key:");
print(pre.load_key(pk_b));


### Get Params
# IPFS Data_ID
# Encrypted message
# Keys e_b, rk_ae

# res_id = ''
reencrypted_data = input("\nPlease enter encrypted test measurements\n")
e_b = input("\nPlease enter e_b key\n")

# Get measurements from IPFS
api = ipfsapi.connect('127.0.0.1', 5001)
#input_params = api.get_json(res_id) # message_b and e_b should come from there, but ...

# Decrypt data
d_sk_e = pre.decrypt(sk_b, e_b);
decrypted_data = pre.decrypt(d_sk_e, reencrypted_data);

# Calculate metrics
measurements = decrypted_data.split('-')
metric = sum(measurements) / float(len(measurements))

print("\nCalculated metrics\n")
print(metric)

# Put metric to contract on Qtum
#call(["ls", "-l"])