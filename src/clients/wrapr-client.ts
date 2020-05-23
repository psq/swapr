import { Client, Provider, Receipt, Result } from '@blockstack/clarity'
import {
  TransferError,
} from '../errors'

import {
  parse,
  unwrapXYList,
  unwrapSome,
  unwrapOK,
} from '../utils'

export class WraprClient extends Client {
  constructor(provider: Provider) {
    super(
      'SP3MT6QYRJ51YDNEEHCKA0232QHQCWSW4N5S8M370.wrapr',
      'wrapr',
      provider
    );
  }

  async wrap(amount: number, params: { sender: string }): Promise<Receipt> {
    const tx = this.createTransaction({
      method: { name: "wrap", args: [`u${amount}`] }
    });
    await tx.sign(params.sender)
    const receipt = await this.submitTransaction(tx)
    if (receipt.success) {
      // console.log(receipt.debugOutput)
      const result = Result.unwrap(receipt)
      return result.startsWith('Transaction executed and committed. Returned: true')
    }
    throw TransferError
  }

  async unwrap(amount: number, params: { sender: string }): Promise<Receipt> {
    const tx = this.createTransaction({
      method: { name: "unwrap", args: [`u${amount}`] }
    });
    await tx.sign(params.sender)
    const receipt = await this.submitTransaction(tx)
    if (receipt.success) {
      // console.log("debugOutput", receipt.debugOutput)
      const result = Result.unwrap(receipt)
      return result.startsWith('Transaction executed and committed. Returned: true')
    }
    throw TransferError
  }

  async totalSupply(): Promise<number> {
    const query = this.createQuery({
      method: {
        name: 'get-total-supply',
        args: [],
      },
    })
    const receipt = await this.submitQuery(query)
    return Result.unwrapUInt(receipt)
  }


}
