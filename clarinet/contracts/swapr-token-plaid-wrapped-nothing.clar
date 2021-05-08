;; ;; we implement the sip-010 + a mint function
(impl-trait 'ST1HTBVD3JG9C05J7HBJTHGR0GGW7KXW28M5JS8QE.swapr-trait.swapr-trait)

;; ;; we can use an ft-token here, so use it!
(define-fungible-token plaid-wrapped-nothing-token)

(define-constant no-acccess-err u40)

;; implement all functions required by sip-010

(define-public (transfer (amount uint) (sender principal) (recipient principal))
  (begin
    (ft-transfer? plaid-wrapped-nothing-token amount tx-sender recipient)
  )
)

(define-read-only (get-name)
  (ok "Plaid STX swapr")
)

(define-read-only (get-symbol)
  (ok "plaid-wmno-swapr")
)

;; the number of decimals used
(define-read-only (get-decimals)
  (ok u6)  ;; arbitrary, or ok?
)

(define-read-only (get-balance-of (owner principal))
  (ok (ft-get-balance plaid-wrapped-nothing-token owner))
)

(define-read-only (get-total-supply)
  (ok (ft-get-supply plaid-wrapped-nothing-token))
)

(define-read-only (get-token-uri)
  (ok (some u"https://swapr.finance/tokens/plaid-wrapped-nothing-token.json"))
)
;; {
;;   "name":"Plaid-STX",
;;   "description":"Plaid-STX swapr token",
;;   "image":"https://swapr.finance/tokens/plaid-stx.png",
;;   "vector":"https://swapr.finance/tokens/plaid-stx.svg"
;; }

;; one stop function to gather all the data relevant to the swapr token in one call
(define-read-only (get-data (owner principal))
  (ok {
    name: (unwrap-panic (get-name)),
    symbol: (unwrap-panic (get-symbol)),
    decimals: (unwrap-panic (get-decimals)),
    uri: (unwrap-panic (get-token-uri)),
    supply: (unwrap-panic (get-total-supply)),
    balance: (unwrap-panic (get-balance-of owner))
  })
)

;; the extra mint method used by swapr when adding liquidity
;; can only be used by swapr main contract
(define-public (mint (recipient principal) (amount uint))
  (begin
    (print "token-swapr.mint")
    (print contract-caller)
    (print amount)
    (asserts! (is-eq contract-caller 'ST1HTBVD3JG9C05J7HBJTHGR0GGW7KXW28M5JS8QE.swapr) (err no-acccess-err))
    (ft-mint? plaid-wrapped-nothing-token amount recipient)
  )
)


;; the extra burn method used by swapr when removing liquidity
;; can only be used by swapr main contract
(define-public (burn (recipient principal) (amount uint))
  (begin
    (print "token-swapr.burn")
    (print contract-caller)
    (print amount)
    (asserts! (is-eq contract-caller 'ST1HTBVD3JG9C05J7HBJTHGR0GGW7KXW28M5JS8QE.swapr) (err no-acccess-err))
    (ft-burn? plaid-wrapped-nothing-token amount recipient)
  )
)
