import { Client, Provider, Receipt, Result } from '@blockstack/clarity'
import { NoLiquidityError } from '../errors'

function unwrapXYList(list) {
  const sub = list.substring(1, list.length - 1).replace(/[u\\(\\)]/g, '') // remove nesting parentheses and 'u's
  const comps = sub.split(' ')
  console.log("comps", comps)
  return {
    x: parseInt(comps[1]),
    y: parseInt(comps[2]),
  }
}

export class SwaprClient extends Client {
  constructor(provider: Provider) {
    super(
      'SP138CBPVKYBQQ480EZXJQK89HCHY32XBQ0T4BCCD.swapr',
      'swapr',
      provider
    );
  }

  async addToPosition(x: number, y: number, params: { sender: string }): Promise<Receipt> {
    const tx = this.createTransaction({
      method: { name: "add-to-position", args: [`u${x}`, `u${y}`] }
    });
    await tx.sign(params.sender)
    const receipt = await this.submitTransaction(tx)
    // console.log(receipt)
    // console.log(receipt.debugOutput)
    const result = Result.unwrap(receipt)

    // console.log("result", result)
    return result.startsWith('Transaction executed and committed. Returned: true')
  }

  async reducePosition(percent: number, params: { sender: string }): Promise<Receipt> {
    const tx = this.createTransaction({
      method: { name: "reduce-position", args: [`u${percent}`] }
    });
    await tx.sign(params.sender)
    const receipt = await this.submitTransaction(tx)
    // console.log(receipt)
    // console.log("debugOutput", receipt.debugOutput)
    const result = Result.unwrap(receipt)

    // console.log("result", result)
    if (result.startsWith('Transaction executed and committed. Returned: ')) {
      const start_of_list = result.substring('Transaction executed and committed.'.length)  // keep a word so unwrapXYList will behave like it was with 'ok'
      // console.log("start_of_list", start_of_list)
      const extracted = start_of_list.substring(0, start_of_list.indexOf(')') + 1)
      // console.log("extracted", extracted)
      return unwrapXYList(extracted)
    }
  }

  async positionOf(owner: string): Promise<number> {
    const query = this.createQuery({
      method: {
        name: 'get-position-of',
        args: [`'${owner}`],
      },
    })
    const receipt = await this.submitQuery(query)
    return Result.unwrapUInt(receipt)
  }

  async balances(): Promise<number> {
    const query = this.createQuery({
      method: {
        name: 'get-balances',
        args: [],
      },
    })
    const receipt = await this.submitQuery(query)
    return unwrapXYList(Result.unwrap(receipt))
  }

  async positions(): Promise<number> {
    const query = this.createQuery({
      method: {
        name: 'get-positions',
        args: [],
      },
    })
    const receipt = await this.submitQuery(query)
    return Result.unwrapUInt(receipt)
  }

  async balancesOf(owner: string): Promise<number> {
    const query = this.createQuery({
      method: {
        name: 'get-balances-of',
        args: [`'${owner}`],
      },
    })
    const receipt = await this.submitQuery(query)
    // console.log("balancesOf", receipt)
    const result = Result.unwrap(receipt)
    if (result.startsWith('(err')) {
      throw new NoLiquidityError()
    } else {
      return unwrapXYList(result)
    }
  }

  async totalSupply(): Promise<number> {
    const query = this.createQuery({
      atChaintip: true,
      method: { name: "get-total-supply", args: [] }
    })
    const res = await this.submitQuery(query)
    return Result.unwrapUInt(res)
  }
}
