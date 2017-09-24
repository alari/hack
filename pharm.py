from npre import bbs98
import ipfsapi
import json

# Generate keys

pre = bbs98.PRE()

sk_a = pre.gen_priv(dtype=bytes)
pk_a = pre.priv2pub(sk_a)


# Declare matching 
matching_data = [
	{
		'patient_id': '[56348997325562554470681415641540411453527787607986293755673291397875591827192, 92927746515173504618438724092329033726208273724656575417176850861077609349347]',
		'is_placebo': 1
	}
]

#encrypted_data = pre.encrypt(pk_a, matching_data)

# Save matching data to IPFS
api = ipfsapi.connect('127.0.0.1', 5001)
res_id = api.add_json(json.dumps(matching_data))

print("Encrypted matching saved in IPFS");
print("http://localhost:8080/ipfs/" + res_id)



# Put matching res_id to contract on Qtum to prove that data in IPFS
#call(["ls", "-l"])


# Put source matching data to contract on Qtum to calculate final results
#call(["ls", "-l"])