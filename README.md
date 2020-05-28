# swapr: trustless token exchange

An exploration on how to implement an automated token exchange modeled after [Uniswap](https://uniswap.exchange) in Clarity for [Stacks 2.0](https://github.com/blockstack/stacks-blockchain)

Of special interest, reading the [x-y-k paper](https://github.com/runtimeverification/verified-smart-contracts/blob/uniswap/uniswap/x-y-k.pdf) and [V2 whitepaper](https://uniswap.org/whitepaper.pdf) would provide some background on understanding how things work (some things have been simplified, notably the initial burning of 1000 times the minimum pool share to prevent attacks right after the first addition to the liquidity pool)

The API has been reimagined, and hopefully simplified to its minima, withough impeding on proper functioning of the trustless exchange.

So that you can also exchange STX with other tokens, a separate contract, `wrapr`, is also included, and can be used on its own.  This contract will allow you to wrap STX into a fungible token, in a fashion similar to what `WETH` provides in the `ETH` world.


## Wrapr contract API

You can find the contract [here](contracts/wrapr.clar).

### `(wrap (amount uint))`
Wrap `amount` of STX from sender into a fungible-token and transfer that token back to sender

### `(unwrap (amount uint))`
Unwraps the STX tokens held for the sender, and sends back `amount` of STX if below the amount held by sender

### `(transfer (recipient principal) (amount uint))`
Transfer `amount` of `wrapr` token to `recipient`

### `(get-total-supply)`  read-only
Get the total amount of STX currently wrapped by all

### `(balance-of (owner principal))` read-only
Get the balance of `wrapr` owned by `principal`

## Wrapr contract notes
Unfortunately, as of writing this, there is no way to add STX to an address in the testing framework, so only minimal testing is provided.

However, there is a scenario that shows how to use `wrapr` on a real node (testnet/mocknet for now) under test/integration

## Swapr contract API

You can find the contract [here](contracts/swapr.clar).

### `(add-to-position (x uint) (y uint))`
Add x amount of the X token, and y amount of Y token by transfering from the sender.  Currently does not check that the exchange rate makes sense, so could lead to losses.  Eventually, you'll be able to specify `u0` for either `x` or `y` and the contract will calculate the proper amount to send to match the current exchange rate.

### `(reduce-position (percent uint))`
Transfer back to the sender, up to 100% of what the sender owns.

### `(swap-exact-x-for-y (x uint))`
Send x of the X token, and gets back an amount of token Y based on current exchange rate, give or take slippage
Returns `y`.

### `(swap-x-for-exact-y (y uint))`
Send the amount of X token necessary to get back y of token Y at current exchange rate, give or take slippage
Returns `x`.

### `(swap-exact-y-for-x (y uint))`
Send y of the Y token, and gets back an amount of token X based on current exchange rate, give or take slippage
Returns `x`.

### `(swap-y-for-exact-x (x uint))`
Send the amount of Y token necessary to get back x of token X at current exchange rate, give or take slippage
Returns `y`.

### `(get-position-of (owner principal))`  read-only
Get the X and Y token positions for `owner`

### `(get-positions)`  read-only
Get the X and Y token for the contract, the sums of positions owned by all liquidity providers

### `(get-balances-of (owner principal))`  read-only
Get the share of the pool owned by `owner`

### `(get-balances)`  read-only
Get the total of shares of the pool collectively owned by all liquidity providers

### `(set-fee-to-address (address principal))`
When set, the contract will collect a 5 basis point (bp) fee to benefit the contract operator.  `none` by default.

### `(reset-fee-to-address)`
Clear the contract fee addres

### `(get-fee-to-address)`  read-only
Get the current address used to collect a fee, if set

### `(get-fees)`  read-only
Get the amount of fees charged on x-token and y-token exchanges that have not been collected yet

### `(collect-fees)`
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
...  # TODO(psq): add the contracts as well
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

### Runing the unit tests

```
npm test
```

### Runing the `wrapr` integration tests using `@blockstack/stacks-transactions`

```
npm wrapr
```

### Runing the `swapr` integration tests using `@blockstack/stacks-transactions`

```
npm swapr
```

## setup with sidecar
TBD, but definitely needed to run the integration tests



## Further thoughts
Solidity does not make it easy to implement `sqrt`, although the "egyptian" method seems fine, however not having loops in Clarity makes it impractical to implement, so the contract uses the old method, but if the x pair is a lot less valuable than the y pair, rounding issues may occur.  Rahter, I would hope `sqrt` can be added as a prinitive to Clarity (see section 3.4 of the V2 whitepaper)

The current design of the Clarity traits makes it quite impractical to implement exchanging multiple pairs with single contracts, so a contract will need to be custom written (easy to automate) and deployed for each pair.

I disagree with the formula showed in section 3.3.2 of the x-y-k paper (the `+ 1` should not be there), so unless someone can explain why it is there, I'm using my own formula, which re-calculated several times.  The modeling I did in a spreadsheet was clearly showing that with small numbers, the formula would be way off using the one from the x-y-k paper...  Story to be continued.

Some web app would be nice, and should be next step
