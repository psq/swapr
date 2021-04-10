;; wrap the native STX token into an SRC20 compatible token to be usable along other tokens
(impl-trait 'ST1HTBVD3JG9C05J7HBJTHGR0GGW7KXW28M5JS8QE.sip-010.ft-trait)

;; get the token balance of owner
(define-read-only (get-balance-of (owner principal))
  (begin
    (ok (print (stx-get-balance owner)))
  )
)

(define-read-only (get-total-supply)
  (ok stx-liquid-supply)
)

;; returns the token name
(define-read-only (get-name)
  (ok "stx")
)

(define-read-only (get-symbol)
  (ok "STX")
)

;; the number of decimals used
(define-read-only (get-decimals)
  (ok u6)
)

(define-read-only (get-token-uri)
  (ok (some u"https://swapr.finance/tokens/stx.json"))
)
;; {
;;   "name":"STX",
;;   "description":"STX token, as a SIP-010 compatible token",
;;   "image":"https://swapr.finance/tokens/stx.png"
;; }

;; Transfers tokens to a recipient
(define-public (transfer (amount uint) (sender principal) (recipient principal))
  (begin
    (asserts! (is-eq tx-sender sender) (err u255)) ;; too strict?
    (stx-transfer? amount tx-sender recipient)
  )
)
