import { Client, Provider, Receipt, Result } from '@blockstack/clarity'
import {
  ClarityParseError,
  NoLiquidityError,
  NotOwnerError,
  NotOKErr,
  NotSomeErr,
} from '../errors'

function parse(value: string) {
  let index = 0
  function sub() {
    const keywords = []
    let current = index
    function saveKeyword() {
      if (index - 1 > current) {
        keywords.push(value.slice(current, index - 1))
      }
    }
    while (index < value.length) {
      const c = value[index++]
      // console.log("c", c, index)
      if (c === '(') {
        keywords.push(sub())
        current = index
      } else if (c === ')') {
        saveKeyword()
        return keywords
      } else if (c === ' ') {
        saveKeyword()
        current = index
      }
    }
    saveKeyword()
    return keywords
  }
  return sub()[0]
}

function unwrapXYList(tree: Array) {
  // console.log("unwrapXYList", tree)
  return {
    x: parseInt(tree[0].substring(1)),
    y: parseInt(tree[1].substring(1)),
  }
}

function unwrapSome(tree: Array) {
  // console.log("unwrapSome", tree)
  if (tree[0] === 'some') {
    return tree[1]
  } else {
    throw NotSomeErr
  }
}

function unwrapOK(tree) {
  // console.log("unwrapOK", tree)
  if (tree[0] === 'ok') {
    return tree[1]
  } else {
    throw NotOKErr
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
    // console.log(receipt.debugOutput)
    const result = Result.unwrap(receipt)
    return result.startsWith('Transaction executed and committed. Returned: true')
  }

  async reducePosition(percent: number, params: { sender: string }): Promise<Receipt> {
    const tx = this.createTransaction({
      method: { name: "reduce-position", args: [`u${percent}`] }
    });
    await tx.sign(params.sender)
    const receipt = await this.submitTransaction(tx)
    // console.log("debugOutput", receipt.debugOutput)
    const result = Result.unwrap(receipt)

    if (result.startsWith('Transaction executed and committed. Returned: ')) {
      const start_of_list = result.substring('Transaction executed and committed. Returned: '.length)  // keep a word so unwrapXYList will behave like it was with 'ok'
      const parsed = parse(start_of_list.substring(0, start_of_list.indexOf(')') + 1))
      return unwrapXYList(parsed)
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
    return unwrapXYList(unwrapOK(parse(Result.unwrap(receipt))))
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
      return unwrapXYList(unwrapOK(parse(result)))
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

  async setFeeTo(address: string, params: { sender: string }): Promise<Receipt> {
    const tx = this.createTransaction({
      method: { name: "set-fee-to-address", args: [`'${address}`] }
    });
    await tx.sign(params.sender)
    const receipt = await this.submitTransaction(tx)
    // console.log("receipt", receipt)
    // console.log("debugOutput", receipt.debugOutput)
    if (receipt.success) {
      const result = Result.unwrap(receipt)
      // console.log("result", result)
      if (result.startsWith('Transaction executed and committed. Returned: ')) {
        const start = result.substring('Transaction executed and committed. Returned: '.length)
        const extracted = start.substring(0, start.indexOf('\n'))
        // console.log("extracted", `=${extracted}=`)
        if (extracted === 'true') {
          return true
        }
      }
    }
    throw new NotOwnerError()
  }

  async resetFeeTo(params: { sender: string }): Promise<Receipt> {
    const tx = this.createTransaction({
      method: { name: "reset-fee-to-address", args: [] }
    });
    await tx.sign(params.sender)
    const receipt = await this.submitTransaction(tx)
    // console.log("receipt", receipt)
    // console.log("debugOutput", receipt.debugOutput)
    if (receipt.success) {
      const result = Result.unwrap(receipt)
      // console.log("result", result)
      if (result.startsWith('Transaction executed and committed. Returned: ')) {
        const start = result.substring('Transaction executed and committed. Returned: '.length)
        const extracted = start.substring(0, start.indexOf('\n'))
        // console.log("extracted", `=${extracted}=`)
        if (extracted === 'true') {
          return true
        }
      }
    }
    throw new NotOwnerError()
  }

  async getFeeTo(): Promise<number> {
    const query = this.createQuery({
      atChaintip: true,
      method: { name: "get-fee-to-address", args: [] }
    })
    const result = await this.submitQuery(query)
    console.log("getFeeTo", Result.unwrap(result))
    const value = unwrapOK(parse(Result.unwrap(result)))
    return value === 'none' ? null : unwrapSome(value)
  }
}
