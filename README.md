# hack clinical trials on blockchain

## INSTALL NUCYPHER

```
brew install python3
brew install gmp
git clone https://github.com/nucypher/nucypher-pre-python.git
cd nucypher-pre-python
pip3 install -e .
```

## INSTALL IPFS

`cd ../`

Download the package from https://ipfs.io/docs/install/ and execute the following commands

```
tar xvfz go-ipfs.tar.gz
mv go-ipfs/ipfs /usr/local/bin/ipfs
ipfs init
ipfs daemon
```

Install PY IPFS

https://github.com/ipfs/py-ipfs-api

`pip install ipfsapi`

## INSTALL JS

`npm i`

## RUN

Run ethereum node

`./start-ethereum-node.sh`

Run code

```
python3 console.py
node trial.js
```