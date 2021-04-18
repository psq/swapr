;; ;; we implement the sip-010 + a mint function
(impl-trait 'ST1HTBVD3JG9C05J7HBJTHGR0GGW7KXW28M5JS8QE.swapr-trait.swapr-trait)

;; ;; we can use an ft-token here, so use it!
(define-fungible-token tokensoft-stx-token)

(define-constant no-acccess-err u40)

;; implement all functions required by sip-010

(define-public (transfer (amount uint) (sender principal) (recipient principal))
  (begin
    (ft-transfer? tokensoft-stx-token amount tx-sender recipient)
  )
)

(define-read-only (get-name)
  (ok "xBTC Thing swapr")
)

(define-read-only (get-symbol)
  (ok "xbtc-stx-swapr")
)

;; the number of decimals used
(define-read-only (get-decimals)
  (ok u6)  ;; arbitrary, or ok?
)

(define-read-only (get-balance-of (owner principal))
  (ok (ft-get-balance tokensoft-stx-token owner))
)

(define-read-only (get-total-supply)
  (ok u0)
;;   (contract-call? 'ST1HTBVD3JG9C05J7HBJTHGR0GGW7KXW28M5JS8QE.swapr get-total-supply 'ST1HTBVD3JG9C05J7HBJTHGR0GGW7KXW28M5JS8QE.plaid-token 'ST1HTBVD3JG9C05J7HBJTHGR0GGW7KXW28M5JS8QE.thing-token)
)

(define-read-only (get-token-uri)
  (ok (some u"https://swapr.finance/tokens/tokensoft-stx-token.json"))
)
;; {
;;   "name":"Plaid-Thing",
;;   "description":"Plaid-Thing swapr token",
;;   "image":"https://swapr.finance/tokens/plaid-thing.png",
;;   "vector":"https://swapr.finance/tokens/plaid-thing.svg"
;; }


;; the extra mint method used by swapr
;; can only be used by swapr main contract
(define-public (mint (recipient principal) (amount uint))
  (begin
    (print "token-swapr.mint")
    (print contract-caller)
    (print amount)
    (if (is-eq contract-caller 'ST1HTBVD3JG9C05J7HBJTHGR0GGW7KXW28M5JS8QE.swapr)
      (ft-mint? tokensoft-stx-token amount recipient)
      (err no-acccess-err)
    )
  )
)
