const BigNum = require('bn.js')
import fs from 'fs'
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
  PrincipalCV,
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



export class MyTokenTXClient {
  constructor(contract_name, keys, network) {
    this.keys = keys
    this.network = network
    this.contract_name = contract_name
  }

  async deployContract() {
    const fee = new BigNum(5380)
    const contract_swapr_body = replaceKey(fs.readFileSync('./contracts/my-token.clar').toString(), 'SP2TPZ623K5N2WYF1BWRMP5A93PSBWWADQGKJRJCS', this.keys.stacksAddress)

    console.log(`deploying ${this.contract_name} contract`)
    const transaction_deploy_trait = await makeSmartContractDeploy({
      contractName: this.contract_name,
      codeBody: contract_swapr_body,
      senderKey: this.keys.secretKey,
      network: this.network,
      fee,
      // nonce: new BigNum(0),
    })
    const tx_id = await broadcastTransaction(transaction_deploy_trait, this.network)
    const tx = await waitForTX(this.network.coreApiUrl, tx_id, 10000)
    return tx
  }

}