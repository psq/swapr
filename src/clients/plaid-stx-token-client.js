import clarity from '@blockstack/clarity'

const { Client, Provider, Receipt, Result } = clarity

import {
  TransferError,
} from '../errors.js'

import {
  parse,
  unwrapXYList,
  unwrapSome,
  unwrapOK,
} from '../utils.js'

export class PlaidSTXTokenClient extends Client {

  constructor(provider) {
    super(
      `SP3MT6QYRJ51YDNEEHCKA0232QHQCWSW4N5S8M370.plaid-stx-token`,
      'plaid-stx-token',
      provider
    )
  }

  async transfer(recipient, amount, params) {
    const tx = this.createTransaction({
      method: { name: "transfer", args: [`'${recipient}`, `u${amount}`] }
    })
    await tx.sign(params.sender)
    const receipt = await this.submitTransaction(tx)
    if (receipt.success) {
      // console.log("debugOutput", receipt.debugOutput)
      const result = Result.unwrap(receipt)
      return result.startsWith('Transaction executed and committed. Returned: true')
    }
    throw TransferError
  }

  async balanceOf(owner) {
    const query = this.createQuery({
      method: {
        name: 'balance-of',
        args: [`'${owner}`],
      },
    })
    const receipt = await this.submitQuery(query)
    return Result.unwrapUInt(receipt)
  }


}
