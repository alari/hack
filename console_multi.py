from npre import bbs98
import ipfsapi
import json
import numpy

# For simplicity, we use one key for all patients and one reencryption key for researchers

api = ipfsapi.connect('127.0.0.1', 5001)
file = open("./data.txt", 'w')
pre = bbs98.PRE()
# patient keys
sk_a = pre.gen_priv(dtype=bytes)
pk_a = pre.priv2pub(sk_a)
# researcher keys
sk_b = pre.gen_priv(dtype=bytes)
pk_b = pre.priv2pub(sk_b)


def serializeResults(results):
  ser = ''
  for i, result in enumerate(results):
    tmp = map(str, result)
    if(len(ser)):
      ser = ser + '|'

    ser = ser + ('-'.join(tmp));

  return ser

def writefile(str):
  file.write(str + "\n")  

def timestampMapping(mapping):
  res_id = api.add_json(json.dumps(mapping))
  writefile(res_id)

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

def providePlacebo(placebo):
  writefile(str(placebo))


def calculateMetrics(decrypted_data):
  measurements = decrypted_data.decode().split('|')
  
  metrics = []
  for i, result in enumerate(measurements):
    me = result.split('-')
    me = list(map(int, me))
    metrics.append(round(sum(me) / float(len(me))))

  #metric = sum(metrics) / float(len(metrics))
  metric = '|'.join(map(str,metrics))

  writefile(str(metric))
  return metric

def provideDataForResearcher(msg):
  msg = serializeResults(msg)

  emsg_b, e_b = encryptTestResults(msg)
  # put to decentralized database
  res_id = api.add_json(msg); # should be encrypted_data, but hz how to save fucking bytes
  print("\n\nPatient encrypted measurements saved in IPFS");
  print("http://localhost:8080/ipfs/" + res_id)
  writefile(res_id)

  return emsg_b, e_b

def decryptTestResults(emsg_b, e_b):
  # Bob decrypt e_b and decrypt emsg_b with this key
  d_sk_e = pre.decrypt(sk_b, e_b);
  return pre.decrypt(d_sk_e, emsg_b);



# define params

# Mapping that only Pharma knows
mapping = {
'0xa97720dcd6ac4e5ffbc85744d9677cce1fa73126': True,
'0xee8fc1b17c98de61ab04e080c41813fa0a27c583': False,
'0x38e1dd8c8e36138c15483fa7a897f8e00b6ec87a': True,
'0x10696a3024ce6fc1024e18163fe97914e9d58d99': True,
'0xb891ff0adf5fd40223ce7c94c6ef1b6d77c89b63': False,
}

# Placebo
is_placebo = "|".join(str(y) for x, y in mapping.items())

# Results that only patients know and can share with Researcher
# entryTestResult = [
#   [1, 2, 3, 4, 5, 6, 7, 8, 9],
#   [5, 6, 7, 8, 9, 10, 11, 12, 13],
#   [5, 21, 7, 8, 9, 10, 11, 12, 13],
#   [17, 2, 43, 4, 5, 1, 7, 48, 9],
#   [1, 2, 3, 4, 25, 36, 7, 58, 9]
# ]

# finalTestResult = [
#   [5, 6, 7, 8, 9, 10, 11, 12, 13],
#   [5, 6, 7, 8, 9, 10, 11, 12, 13],
#   [5, 21, 7, 8, 9, 10, 11, 12, 13],
#   [17, 2, 43, 4, 5, 1, 7, 48, 9],
#   [1, 2, 3, 4, 25, 36, 7, 58, 9]
# ]

entryTestResult = numpy.random.random_integers(0, 100, (10, 5))
finalTestResult = numpy.random.random_integers(0, 100, (10, 5))


########## PHARMA ###########

print("\n\nPharma time stamps encrypted matching <patient, is_placebo> to decentralized database, sends to Contract")

timestampMapping(mapping)


########## PATIENT #########

print("\n\nPatient encrypts entryTestResult and finalTestResult and send them with encryption keys to Researcher, send hashes to Contract\n")

# provide data for entry test
entryTestResult_b, entryTestResult_e_b = provideDataForResearcher(entryTestResult)
print("\nEncrypted entryTestResult")
print(entryTestResult_b)
print("\nKey")
print(entryTestResult_e_b)

# provide data for final test
finalTestResult_b, finalTestResult_e_b = provideDataForResearcher(finalTestResult)
print("\nEncrypted entryTestResult")
print(finalTestResult_b)
print("\nKey")
print(finalTestResult_e_b)

input("\n\nProceed")

########## RESEARCHER #########

print("\n\nResearcher receives encrypted results and key from Patient, decrypts it and calculated metric")

# calculate metric based on provided data
decrypted_data = decryptTestResults(finalTestResult_b, finalTestResult_e_b)
print("\nDecrypted results")
print(decrypted_data)

metric = calculateMetrics(decrypted_data)
print("\n\nCalculated metric for the patient, sends to Contract")
print(metric)

input("\n\nProceed")


########## PHARMA ###########

print("\n\nPharma disclosures to contract list of Placebo patients")

# time stamp encrypted matching to decentralized database
providePlacebo(is_placebo)

print("\n\nNow let's deploy a contract")

input("\n\nProceed")
