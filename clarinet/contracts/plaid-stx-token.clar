;; ;; we implement the sip-010 + a mint function
(impl-trait 'ST000000000000000000002AMW42H.swapr-trait.swapr-trait)

;; ;; we can use an ft-token here, so use it!
(define-fungible-token token)

(define-constant no-acccess-err u40)

;; implement all functions required by sip-010

(define-public (transfer (amount uint) (sender principal) (recipient principal))
  (begin
    (ft-transfer? token amount tx-sender recipient)
  )
)

(define-read-only (get-name)
  (ok "plaid-stx-swapr")
;;   (contract-call? 'ST000000000000000000002AMW42H.swapr get-name 'ST000000000000000000002AMW42H.plaid-token 'ST000000000000000000002AMW42H.stx-token)
)

(define-read-only (get-symbol)
  (ok "plaid-stx-swapr")
;;   (contract-call? 'ST000000000000000000002AMW42H.swapr get-symbol 'ST000000000000000000002AMW42H.plaid-token 'ST000000000000000000002AMW42H.stx-token)
)

;; the number of decimals used
(define-read-only (get-decimals)
  (ok u6)  ;; arbitrary, or ok?
)

(define-read-only (get-balance-of (owner principal))
  (ok (ft-get-balance token owner))
)

(define-read-only (get-total-supply)
  (ok u0)
;;   (contract-call? 'ST000000000000000000002AMW42H.swapr get-total-supply 'ST000000000000000000002AMW42H.plaid-token 'ST000000000000000000002AMW42H.stx-token)
)

(define-read-only (get-token-uri)
  (ok (some u"https://swapr.finance/tokens/plaid-stx-token.json"))
)


;; the extra mint method used by swapr
;; can only be used by swapr main contract
(define-public (mint (recipient principal) (amount uint))
  (begin
    (print "token-swapr.mint")
    (print contract-caller)
    (print amount)
    (if (is-eq contract-caller 'ST000000000000000000002AMW42H.swapr)
      (ft-mint? token amount recipient)
      (err no-acccess-err)
    )
  )
)
