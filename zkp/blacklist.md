# Blacklisting

We require the ability to blacklist certain people or, more specifically, certain Ethereum
addresses from transacting under our KYC-regulated solution

## Data structures

Two data structures are used for this purpose:
- a Merkle Tree whose leaves are the ethereum public keys of people who have not been blacklisted. This is called the Public Key Tree
- a hash-table list of blacklisted ethereum public keys. This can be edited only by the owner of the shield contract (this is called the Blacklist).

## Protocol

### Mint

Alice, who is not blacklisted, makes a mint transaction. This is done in the same way
as normal Nightfall mint although she also passes in her Ethereum public key.

The shield contract, as well as carrying out its normal mint actions, checks whether Alice's public key corresponds to her Ethereum Address (msg.sender).  If does correspond, the smart contract checks whether her Ethereum public key is in the Blacklist.  Finding that she isn't, it adds her public key to the Public Key Tree.  It also stores an Ethereum Address -> Public key lookup, for ease of blacklisting (this could be avoided by working directly with the Ethereum address but that would require computation of a keccak hash in the proof, which is problematic)

### Transfer or Burn

Later, Alice wishes to transfer funds to Bob.  She creates a conventional Nightfall transfer proof (which may include KYC encryption) but she includes in the proof a stanza to prove that her public key is in the Address Tree, and therefore not blacklisted, and that it is indeed her public key (by proving knowledge of the secret key). Note that nothing here reveals her Ethereum public key, so her identity is still secret.

The smart contract then proceeds as it would for a conventional transfer or burn.

### Blacklisting

To blacklist an address (only owner can do this) a lookup of the Ethereum public key corresponding to the Ethereum address to be blacklisted is done, using the list created during mint (if creating the list uses too much gas, it could be left as calldata and the logs searched). The Ethereum public key is then removed from the Public Key Tree (which will entail re-computation of part of the tree) and added to the Blacklist.  This will have the effect of preventing any further transactions using that key.
