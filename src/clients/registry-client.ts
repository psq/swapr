import { Client, Provider, Receipt, Result } from '@blockstack/clarity'
import {
  NotOKErr,
} from '../errors'

import {
  parse,
  unwrapList,
  unwrapXYList,
  unwrapSome,
  unwrapOK,
} from '../utils'

export class RegistryClient extends Client {
  constructor(provider: Provider) {
    super(
      'SP1XY88EQMX4CKK4VD7FGS235N6PASR0ACF68GK01.swapr-registry',
      'swapr-registry',
      provider
    );
  }

  // (define-read-only (get-pair-details (contract-address principal))
  async getPairDetails(contract_address: string): Promise<number> {
    const query = this.createQuery({
      method: {
        name: 'get-pair-details',
        args: [`'${contract_address}`],
      },
    })
    const receipt = await this.submitQuery(query)
    console.log("receipt", receipt)
    return Result.unwrapUInt(receipt)  // TODO(psq)
  }

  // (define-read-only (get-pairs)
  async getPairs(string): Promise<number> {
    const query = this.createQuery({
      method: {
        name: 'get-pairs',
        args: [],
      },
    })
    const receipt = await this.submitQuery(query)
    console.log("receipt", receipt)
    return unwrapList(unwrapOK(parse(Result.unwrap(receipt))))
  }


  // (define (add-pair (contract-address principal) (name-x (buff 128)) (token-x principal) (name-y (buff 128)) (token-y principal))
  async addPair(contract_address: string, name_x: string, token_x: string, name_y: string, token_y: string, params: { sender: string }): Promise<boolean> {
    const tx = this.createTransaction({
      method: { name: "add-pair", args: [`'${contract_address}`, `"${name_x}"`, `'${token_x}`, `"${name_y}"`, `'${token_y}`] }
    })
    await tx.sign(params.sender)
    const receipt = await this.submitTransaction(tx)
    console.log(receipt)
    if (receipt.success) {
      console.log("debugOutput", receipt.debugOutput)
      const result = Result.unwrap(receipt)
      return result.startsWith('Transaction executed and committed. Returned: true')  // TODO(psq)
    }
    throw new NotOKErr()
  }




  // (define-read-only (get-token-details (contract-address principal))
  async getTokenDetails(contract_address: string): Promise<number> {
    const query = this.createQuery({
      method: {
        name: 'get-token-details',
        args: [`'${contract_address}`],
      },
    })
    const receipt = await this.submitQuery(query)
    console.log("receipt", receipt)
    return Result.unwrapUInt(receipt)  // TODO(psq)
  }

  // (define-read-only (get-tokens)
  async getTokens(): Promise<number> {
    const query = this.createQuery({
      method: {
        name: 'get-tokens',
        args: [],
      },
    })
    const receipt = await this.submitQuery(query)
    console.log("receipt", receipt)
    return unwrapList(unwrapOK(parse(Result.unwrap(receipt))))
  }

  // (define (add-token (name (buff 128)) (contract-address principal))
  async addToken(name: string, contract_address: string, params: { sender: string }): Promise<boolean> {
    const tx = this.createTransaction({
      method: { name: "add-token", args: [`"${name}"`, `'${contract_address}`] }
    })
    await tx.sign(params.sender)
    const receipt = await this.submitTransaction(tx)
    console.log(receipt)
    if (receipt.success) {
      console.log("debugOutput", receipt.debugOutput)
      const result = Result.unwrap(receipt)
      return result.startsWith('Transaction executed and committed. Returned: true')  // TODO(psq)
    }
    throw new NotOKErr()
  }

  // (define (rename-token (contract-address principal) (name (buff 128)))
  async renameToken(contract_address: string, name: string, params: { sender: string }): Promise<boolean> {
    const tx = this.createTransaction({
      method: { name: "rename-token", args: [`'${contract_address}`, `"${name}"`] }
    })
    await tx.sign(params.sender)
    const receipt = await this.submitTransaction(tx)
    console.log(receipt)
    if (receipt.success) {
      console.log("debugOutput", receipt.debugOutput)
      const result = Result.unwrap(receipt)
      return result.startsWith('Transaction executed and committed. Returned: true')  // TODO(psq)
    }
    throw new NotOKErr()
  }

}
