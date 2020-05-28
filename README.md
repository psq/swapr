# swapr: trustless token exchange

An exploration on how to implement an automated token exchange modeled after [Uniswap](https://uniswap.exchange) in Clarity for [Stacks 2.0](https://github.com/blockstack/stacks-blockchain)

Of special interest, reading the [x-y-k paper](https://github.com/runtimeverification/verified-smart-contracts/blob/uniswap/uniswap/x-y-k.pdf) and [V2 whitepaper](https://uniswap.org/whitepaper.pdf) would provide some background on understanding how things work (some things have been simplified, notably the initial burning of 1000 times the minimum pool share to prevent attacks right after the first addition to the liquidity pool)

The API has been reimagined, and hopefully simplified to its minima, withough impeding on proper functioning of the trustless exchange.

So that you can also exchange STX with other tokens, a separate contract, `wrapr`, is also included, and can be used on its own.


## Wrapr contract API

You can find the contract [here](contracts/wrapr.clar)

### `(wrap (amount uint))`
### `(unwrap (amount uint))`
### `(transfer (recipient principal) (amount uint))`
### `(get-total-supply)`  read-only
### `(balance-of (owner principal))` read-only


## Swapr contract API

You can find the contract [here](contracts/swapr.clar)


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

See the contract for other available methods

## Wrapr contract
Additionally, a contract to wrap STX (a la WETH) is also included so people could create pairs against STX.  Unfortunately, as of writing this, there is no way to add STX to an address in the testing framework, so only minimal testing is provided.

However, there is a scenario that shows how to use `wrapr` on a real node (testnet/mocknet for now) under test/integration

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
