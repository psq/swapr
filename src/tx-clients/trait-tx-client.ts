const BigNum = require('bn.js')
import { readFileSync } from 'fs'
import {
  makeSmartContractDeploy,
  makeContractCall,
  TransactionVersion,
  FungibleConditionCode,

  serializeCV,
  deserializeCV,
  standardPrincipalCV,
  uintCV,

  BooleanCV,
  // PrincipalCV,
  UIntCV,

  ChainID,
  makeStandardSTXPostCondition,
  makeContractSTXPostCondition,
  StacksTestnet,
  broadcastTransaction,
} from '@blockstack/stacks-transactions'

import {
  wait,
  waitForTX,
} from '../tx-utils'
import { replaceKey } from '../utils'



export class TraitTXClient {
  keys: any
  network: any
  contract_name: string

  constructor(keys, network) {
    this.keys = keys
    this.network = network
    this.contract_name = 'token-transfer-trait'
  }

	async deployContract() {
	  const fee = new BigNum(2154)
    const contract_trait_body = readFileSync('./contracts/token-transfer-trait.clar').toString()

	  console.log("deploying trait contract")
	  const transaction_deploy_trait = await makeSmartContractDeploy({
	    contractName: this.contract_name,
	    codeBody: contract_trait_body,
	    senderKey: this.keys.secretKey,
	    network: this.network,
	    fee,
	    // nonce: new BigNum(0),
	  })
	  const tx_id = await broadcastTransaction(transaction_deploy_trait, this.network)
	  const tx = await waitForTX(this.network.coreApiUrl, tx_id, 10000)

    const result = deserializeCV(Buffer.from(tx.tx_result.substr(2), "hex"))
    return result
	}

}
