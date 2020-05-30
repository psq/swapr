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

  async wrap(amount: number, params: { sender: string }): Promise<boolean> {
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
    throw new TransferError()
  }

  async unwrap(amount: number, params: { sender: string }): Promise<boolean> {
    const tx = this.createTransaction({
      method: { name: "unwrap", args: [`u${amount}`] }
    })
    await tx.sign(params.sender)
    const receipt = await this.submitTransaction(tx)
    if (receipt.success) {
      // console.log("debugOutput", receipt.debugOutput)
      const result = Result.unwrap(receipt)
      return result.startsWith('Transaction executed and committed. Returned: true')
    }
    throw new TransferError()
  }

  async transfer(recipient: string, amount: number, params: { sender: string }): Promise<boolean> {
    const tx = this.createTransaction({
      method: { name: "transfer", args: [`'${recipient}`, `u${amount}`] }
    })
    await tx.sign(params.sender)
    const receipt = await this.submitTransaction(tx)
    // console.log(receipt)
    if (receipt.success) {
      // console.log("debugOutput", receipt.debugOutput)
      const result = Result.unwrap(receipt)
      return result.startsWith('Transaction executed and committed. Returned: true')
    }
    throw new TransferError()
  }

  async balanceOf(owner: string): Promise<number> {
    const query = this.createQuery({
      method: {
        name: 'balance-of',
        args: [`'${owner}`],
      },
    })
    const receipt = await this.submitQuery(query)
    console.log("receipt", receipt)
    return Result.unwrapUInt(receipt)
  }

  async totalSupply(): Promise<number> {
    const query = this.createQuery({
      method: {
        name: 'get-total-supply',
        args: [],
      },
    })
    const receipt = await this.submitQuery(query)
    console.log("receipt", receipt)
    return Result.unwrapUInt(receipt)
  }

}
