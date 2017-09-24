from npre import bbs98
import ipfsapi
import json

api = ipfsapi.connect('127.0.0.1', 5001)
pre = bbs98.PRE()
# patient keys
sk_a = pre.gen_priv(dtype=bytes)
pk_a = pre.priv2pub(sk_a)
# researcher keys
sk_b = pre.gen_priv(dtype=bytes)
pk_b = pre.priv2pub(sk_b)


def serializeResults(results):
  return '-'.join(map(str, results))

def writefile(str):
  with open("./data.txt", 'a') as file:
    file.write(str + "\n")  
    file.close()

def encryptTestResults(msg):
  # Alice puts test results data
  emsg = pre.encrypt(pk_a, msg)
  # Alice delegate access to Bob by generating rk_ar and e_b
  # Alice gives rk_ae and e_b to proxy
  sk_e = pre.gen_priv(dtype=bytes)
  rk_ae = pre.rekey(sk_a, sk_e)
  e_b = pre.encrypt(pk_b, sk_e)
  # Proxy reencrypts and gives also e_b
  emsg_b = pre.reencrypt(rk_ae, emsg)
  return emsg_b, e_b

def timestampMatching(matching):
  res_id = api.add_json(json.dumps(matching))
  writefile(str(matching))


def calculateMetrics(decrypted_data):
  measurements = decrypted_data.decode().split('-')
  measurements = list(map(int, measurements))
  metric = sum(measurements) / float(len(measurements))
  writefile(str(metric))
  return metric

def provideDataForResearcher(msg):
  msg = serializeResults(msg)

  emsg_b, e_b = encryptTestResults(msg)
  # put to decentralized database
  res_id = api.add_json(msg); # should be encrypted_data, but hz how to save fucking bytes
  print("Patient encrypted measurements saved in IPFS");
  print("http://localhost:8080/ipfs/" + res_id)
  writefile(res_id)

  return emsg_b, e_b

def decryptTestResults(emsg_b, e_b):
  # Bob decrypt e_b and decrypt emsg_b with this key
  d_sk_e = pre.decrypt(sk_b, e_b);
  return pre.decrypt(d_sk_e, emsg_b);



# define params
entryTestResult = [1, 2, 3, 4, 5, 6, 7, 8, 9]
finalTestResult = [5, 6, 7, 8, 9, 10, 11, 12, 13]
metric = 0
matching = True



########## PATIENT #########

print("Patient encrypts entryTestResult and finalTestResult and send them with encryption keys to Researcher, send hashes to Contract")

# provide data for entry test
entryTestResult_b, entryTestResult_e_b = provideDataForResearcher(entryTestResult)
print("\n\nEncrypted entryTestResult")
print(entryTestResult_b)
print("\nKey")
print(entryTestResult_e_b)

# provide data for final test
finalTestResult_b, finalTestResult_e_b = provideDataForResearcher(finalTestResult)
print("\n\nEncrypted entryTestResult")
print(finalTestResult_b)
print("\nKey")
print(finalTestResult_e_b)

input("\n\nProceed")

########## RESEARCHER #########

print("\n\nResearcher receives encrypted results and key from Patient, decrypts it and calculated metric")

# calculate metric based on provided data
decrypted_data = decryptTestResults(finalTestResult_b, finalTestResult_e_b)
print("\n\nDecrypted results")
print(decrypted_data)

metric = calculateMetrics(decrypted_data)
print("\n\nCalculated metric for the patient, sends to Contract")
print(metric)

input("\n\nProceed")


########## PHARMA ###########

print("\n\nPharma time stamps encrypted matching <patient, is_placebo> to decentralized database, sends to Contract")

# time stamp encrypted matching to decentralized database
timestampMatching(matching)

print("\n\nNow let's deploy a contract")

input("\n\nProceed")
