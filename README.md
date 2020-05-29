# swapr: trustless token exchange

An exploration on how to implement an automated token exchange modeled after [Uniswap](https://uniswap.exchange) in Clarity for [Stacks 2.0](https://github.com/blockstack/stacks-blockchain)

Of special interest, reading the [x-y-k paper](https://github.com/runtimeverification/verified-smart-contracts/blob/uniswap/uniswap/x-y-k.pdf) and [V2 whitepaper](https://uniswap.org/whitepaper.pdf) would provide some background on understanding how things work (some things have been simplified, notably the initial burning of 1000 times the minimum pool share to prevent attacks right after the first addition to the liquidity pool).

Basically, when doing an exchange, the contract will maintain the invariant `(amount of tokenx) * (amount of tokeny) = k`, or for short `x * y = k`, so when exchanging `dx` for `dy`, you need to also have `(x + dx) * (y - dy) = k`.  Of course if dx is close to x, the total liquidity available, the exchange rate will not be favorable.  Liquidity providers earn a small fee (25 to 30 basis points whether the operator takes a cut of 5 basis points or not).

The API has been reimagined, and hopefully simplified to its minima, withough impeding on proper functioning of the trustless exchange.

So that you can also exchange STX with other tokens, a separate contract, `wrapr`, is also included, and can be used on its own.  This contract will allow you to wrap STX into a fungible token, in a fashion similar to what `WETH` provides in the `ETH` world.

## *Important note:* to run the integration tests, you need my custome version of Sidecar, see [instructions](https://github.com/psq/swapr#setup-with-sidecar) below.  This versions exposes the returned value from the transaction, which the current of version of Sidecar does not.

## Wrapr contract API

You can find the contract [here](contracts/wrapr.clar).

#### `(wrap (amount uint))`
Wrap `amount` of STX from sender into a fungible-token (called "wrapr token") and transfer that token amount back to sender

#### `(unwrap (amount uint))`
Unwrap the STX tokens held for the sender in the wrapr token, and sends back `amount` of STX if below the amount held by sender

#### `(transfer (recipient principal) (amount uint))`
Transfer `amount` of `wrapr` token to `recipient`

#### `(get-total-supply)`  read-only
Get the total amount of STX currently wrapped by all

#### `(balance-of (owner principal))` read-only
Get the balance of `wrapr` owned by `owner`

## Wrapr contract notes
Unfortunately, as of writing this, there is no way to add STX to an address in the testing framework used for unit testing, so only minimal testing is provided as part of the swapr unit tests

However, there is a scenario that shows how to use `wrapr` on a real node (testnet/mocknet for now) under test/integration

2 Typescript clients are provided to make it easier to interact with the contracts, either via `@blockstack/clarity` or via `@blockstack/stacks-transactions`

## Swapr contract API

You can find the contract [here](contracts/swapr.clar).

#### `(add-to-position (x uint) (y uint))`
Add x amount of the X token, and y amount of Y token by transfering from the sender.  Currently does not check that the exchange rate makes sense, so could lead to losses.  Eventually, you'll be able to specify `u0` for either `x` or `y` and the contract will calculate the proper amount to send to match the current exchange rate.

#### `(reduce-position (percent uint))`
Transfer back proportional amount of token X and token Y to the sender based on the sender's share of the pool, up to 100% of what the sender owns.

#### `(swap-exact-x-for-y (dx uint))`
Send x of the X token, and gets back an amount of token Y based on current exchange rate, give or take slippage

Returns `dy`.

#### `(swap-x-for-exact-y (dy uint))`
Send the amount of X token necessary to get back y of token Y at current exchange rate, give or take slippage

Returns `dx`.

#### `(swap-exact-y-for-x (dy uint))`
Send y of the Y token, and gets back an amount of token X based on current exchange rate, give or take slippage

Returns `dx`.

#### `(swap-y-for-exact-x (dx uint))`
Send the amount of Y token necessary to get back x of token X at current exchange rate, give or take slippage

Returns `dy`.

#### `(get-position-of (owner principal))`  read-only
Get the X and Y token positions for `owner`

#### `(get-positions)`  read-only
Get the X and Y token for the contract, the sums of positions owned by all liquidity providers

#### `(get-balances-of (owner principal))`  read-only
Get the share of the pool owned by `owner`

#### `(get-balances)`  read-only
Get the total of shares of the pool collectively owned by all liquidity providers

#### `(set-fee-to-address (address principal))`
When set, the contract will collect a 5 basis point (bp) fee to benefit the contract operator.  `none` by default.

#### `(reset-fee-to-address)`
Clear the contract fee addres

#### `(get-fee-to-address)`  read-only
Get the current address used to collect a fee, if set

#### `(get-fees)`  read-only
Get the amount of fees charged on x-token and y-token exchanges that have not been collected yet

#### `(collect-fees)`
Send the collected fees the fee-to-address


## setup with mocknet

### setup mocknet with lastest from master

```
git clone https://github.com/blockstack/stacks-blockchain.git
cd stacks-blockchain
cargo testnet start --config=./testnet/stacks-node/Stacks.toml
```

### generate keys

```
cargo run --bin blockstack-cli generate-sk --testnet > keys-alice.json
cargo run --bin blockstack-cli generate-sk --testnet > keys-bob.json
cargo run --bin blockstack-cli generate-sk --testnet > keys-zoe.json
cargo run --bin blockstack-cli generate-sk --testnet > keys-contracts.json
```

Then move the keys to the swapr folder


### setup STX balances

Under `[burnchain]`, add

```
# alice
[[mstx_balance]]
address = "SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7"
amount = 1000000

# bob
[[mstx_balance]]
address = "S02J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKPVKG2CE"
amount = 1000000

# zoe
[[mstx_balance]]
address = "SZ2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKQ9H6DPR"
amount = 1000000
```
by using the addresses generated in `keys-*.json`, not the above which are the ones from the unit tests, you need the private keys :)

### Verify the balances by using
Verify the balances with

- [http://127.0.0.1:20443/v2/accounts/SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7](http://127.0.0.1:20443/v2/accounts/SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7)

again, using the proper addresses

## Running the unit tests

```
npm test
```

## Running the `wrapr` integration tests using `@blockstack/stacks-transactions`

```
npm run wrapr
```
Sidecar is required for running the integration tests. Sidecar is needed to check the state of the transaction.  See [setup instructions](https://github.com/psq/swapr#setup-with-sidecar).

### wrapr test scenario
* Alice sends 100000 STX to wrap them, and receives 100000 wrapr tokens
* Alice unwraps 20000 wrapr token, and receives 20000 STX back
* Alice transfers 50000 wrapr tokens to Bob
* Bob unwraps 20000 wrapr tokens and receives 20000 STX

Check that balances match what is expected as contract calls are made.

## Running the `swapr` integration tests using `@blockstack/stacks-transactions`

```
npm run swapr
```
Sidecar is required for running the integration tests. Sidecar is needed to check the state of the transaction.  See [setup instructions](https://github.com/psq/swapr#setup-with-sidecar).

### swapr test scenario

The test deploys 2 instances of the my-token contract to implement `token1` and `token2`, 1 instance of the wrapr contract, and 2 instances of the swapr contract to implement 2 exchanges, `token1-token2` and `swapr-token1`.

* Alice wraps 800000 STX
* Bob wraps 800000 STX
* Zoe wraps 500000 STX

* Zoe sets the fee address on token1-token2 exchange contract to collect 5 basis point of the 30 basis point exchange fee
* Zoe sets the fee address on swapr-token1 exchange contract

* Alice adds liquidity to swapr-token1 exchange 500000 swapr and 1000000 token1
* Alice adds liquidity to token1-token2 exchange 500000 token1 and 200000 token2
* Alice adds liquidity to token1-token2 exchange 1000000 token1 and 400000 token2

* Alice exchanges token1 for 50000 token2
* Bob exchanges 30000 swapr for token1

* Zoe exchange swapr for 50000 token1
* Zoe exchange 50000 token1 for token2


Check that balances match what is expected as contract calls are made.

## Setup with sidecar
* Clone my custome version of [Sidecar repo](https://github.com/psq/stacks-blockchain-sidecar)
* Switch to the `feature/raw_result` branch *don't miss this step*
* Install the dependencies
* As of this writing, the `dev:integrated` task will not work, so remove `npm run generate:schemas &&` from likne 8 of package.json
* Then start Sidecar with
```
npm run dev:integrated
```

### Funding addresses with STX
Edit the `Stacks-dev.toml` [file](https://github.com/blockstack/stacks-blockchain-sidecar/blob/master/stacks-blockchain/Stacks-dev.toml), and setup STX balances as described [above](#setup-stx-balances)

Restart Sidecar

Note: you need to restart Sidecar each time you want to run the integration tests, so that the contracts can be re-deployed.

## Further thoughts
Solidity does not make it easy to implement `sqrt`, although the "egyptian" method seems fine, however not having loops in Clarity makes it impractical to implement, so the contract uses the old method, but if the x pair is a lot less valuable than the y pair, rounding issues may be more prominent.  Rather, I would hope `sqrt` can be added as a prinitive to Clarity (see section 3.4 of the V2 whitepaper), at least the `isqrt` variant:
```
the integer square root (isqrt) of a positive integer n is the positive integer m which is the greatest integer less than or equal to the square root of n
```
From the [Wikipedia](https://en.wikipedia.org/wiki/Integer_square_root) definition.

The current design of the Clarity traits makes it quite impractical to implement exchanging multiple pairs with a single contract, so a contract will need to be custom written (easy to automate) and deployed for each pair.  There is ongoing work to make traits more usable.  However, to be able to use a single contract for all pairs, there would be a need to keep some reference to a trait so data can be stored and retrieved.  The current implementation forbids to store any references to traits so that you can't call them later on (a valid concern), but maybe being able to keep a hash of a trait would make sense, so that hash can be used as a key into a map to store a pair's data.

Sidecar does not include the return value from the contract, so you need to make extra calls to find out what happened, you can only tell whether the transaction succeeded and committed, and failed and nothing was committed.

I disagree with the formula showed in section 3.3.2 of the x-y-k paper (the `+ 1` should not be there), so I'm using my own formula, which I re-calculated several times.  The modeling I did in a spreadsheet was clearly showing that with small numbers, the formula would be way off using the one from the x-y-k paper...  Story to be continued.

The client code feels very repetitive (whether for `@blockstack/clarity`, for `@blockstack/stacks-transactions`), and there is probably an opportunity to generate the client code from the contract itself, as the patterns used are pretty similar and only depend on the paramter/returnt type.

Some web app would be nice, and should be next step.

And finally, whether this contract ends up being valuable or not will depend on whether a healthy token ecosystem develops on Stacks 2.0 and there is a need to exchange tokens in a trustless manner.

