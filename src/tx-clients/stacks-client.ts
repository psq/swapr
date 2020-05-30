const BigNum = require('bn.js')

export class StacksClient {
  network: any

  constructor(network) {
    this.network = network
  }

  async STXBalance(keys_owner: any) {
  	console.log("STXBalance", keys_owner.stacksAddress)

  	const options = {
  	  method: "GET",
  	  headers: {
  	    "Content-Type": "application/json",
  	  },
  	}
  	const response = await fetch(`${this.network.coreApiUrl}/v2/accounts/${keys_owner.stacksAddress}`, options)

  	if (response.ok) {
  	  const result = await response.json()
      const result_bn = new BigNum(result.balance.substr(2), 16)
      return result_bn
  	} else {
  	  console.log("not 200 response", response)
  	}

  }

}