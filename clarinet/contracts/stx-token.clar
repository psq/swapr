;; wrap the native STX token into an SRC20 compatible token to be usable along other tokens
;; (use-trait src20-token .src20-trait.src20-trait)
(impl-trait 'ST000000000000000000002AMW42H.sip-010.ft-trait)

;; get the token balance of owner
(define-read-only (get-balance-of (owner principal))
  (begin
    (ok (print (stx-get-balance owner)))
  )
)

;; returns the total number of tokens
;; TODO(psq): we don't have access yet, but once POX is available, this should be a value that
;; is available from Clarity
(define-read-only (get-total-supply)
  (ok u0)
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
    (print "stx.transfer")
    (print amount)
    (print tx-sender)
    (print recipient)
    (asserts! (is-eq tx-sender sender) (err u255)) ;; too strict?
    (print (stx-transfer? amount tx-sender recipient))
  )
)
