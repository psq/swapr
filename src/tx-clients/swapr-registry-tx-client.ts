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
import { replaceString } from '../utils'


export class SwaprRegistryTXClient {
  keys: any
  network: any
  contract_name: string

  constructor(keys, network) {
    this.keys = keys
    this.network = network
    this.contract_name = 'swapr-registry'
  }

	async deployContract() {
	  const fee = new BigNum(3834)
    const contract_swapr_registry_body = readFileSync('./contracts/swapr-registry.clar').toString()

	  console.log("deploying swapr registry")
	  const transaction_deploy_swapr_registry = await makeSmartContractDeploy({
	    contractName: this.contract_name,
	    codeBody: contract_swapr_registry_body,
	    senderKey: this.keys.secretKey,
	    network: this.network,
	    fee,
	    // nonce: new BigNum(0),
	  })
	  const tx_id = await broadcastTransaction(transaction_deploy_swapr_registry, this.network)
	  const tx = await waitForTX(this.network.coreApiUrl, tx_id, 10000)

    const result = deserializeCV(Buffer.from(tx.tx_result.hex.substr(2), "hex"))
    return result
	}

}
