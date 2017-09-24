## Read more here
## https://hackernoon.com/proxy-re-encryption-playground-in-python-3bc66170b9bf

from npre import bbs98

pre = bbs98.PRE()

# Alice
sk_a = pre.gen_priv(dtype=bytes)
pk_a = pre.priv2pub(sk_a)

# Bob - another console
sk_b = pre.gen_priv(dtype=bytes)
pk_b = pre.priv2pub(sk_b)

# Alice puts test results data
msg = b"""{
		'param1': 'value1',
		'param2': 'value2'
	}""";
emsg = pre.encrypt(pk_a, msg)

# Alice delegate access to Bob by generating rk_ar and e_b
# Alice gives rk_ae and e_b to proxy
sk_e = pre.gen_priv(dtype=bytes)
rk_ae = pre.rekey(sk_a, sk_e)
e_b = pre.encrypt(pk_b, sk_e)

# Bob - asks for data, proxy reencrypts and gives also e_b
emsg_b = pre.reencrypt(rk_ae, emsg)

# Bob decrypt e_b and decrypt emsg_b with this key
d_sk_e = pre.decrypt(sk_b, e_b);

print(pre.decrypt(d_sk_e, emsg_b));