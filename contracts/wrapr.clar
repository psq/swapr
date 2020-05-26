
(impl-trait 'SP2TPZ623K5N2WYF1BWRMP5A93PSBWWADQGKJRJCS.token-transfer-trait.can-transfer-tokens)

(define-data-var total-supply uint u0)

(define-fungible-token wrapped-token)

;; Total number of tokens in existence.
(define-read-only (get-total-supply)
  (ok (var-get total-supply))
)

;; get the token balance of owner
(define-read-only (balance-of (owner principal))
  (begin
    (ok (ft-get-balance wrapped-token owner))
  )
)

;; transfer amount STX and return wrapped fungible token
;; mints new token
(define-public (wrap (amount uint))
  (let ((contract-address (as-contract tx-sender)))
    (if
      (and
        (is-ok (stx-transfer? amount tx-sender contract-address))
        (is-ok (ft-mint? wrapped-token amount tx-sender))
      )
      (begin
        (var-set total-supply (+ (var-get total-supply) amount))
        (print amount)
        (print (var-get total-supply))
        (ok true)
      )
      (begin
        (print u10)
        (err false)
        ;; (err u10)
      )
    )
  )
)

;; unwraps wrapped STX token
;; burns unwrapped token (well, can't burn yet, so will forever increase, good thing there is no limit)
(define-public (unwrap (amount uint))
  (let ((contract-address (as-contract tx-sender)))
    (if
      (and
        (<= amount (var-get total-supply))
        ;; this is where burn would be more appropriate, as trying to reuse tokens or mint
        ;; would make the code more complex for little benefit
        (is-ok (ft-transfer? wrapped-token amount tx-sender contract-address))
        (is-ok (stx-transfer? amount contract-address tx-sender))
      )
      (begin
        (var-set total-supply (- (var-get total-supply) amount))
        (ok true)
      )
      (err false)
    )
  )
)

;; Transfers tokens to a specified principal.
;; just a wrapper to satisfy the `<can-transfer-token>`
(define-public (transfer (recipient principal) (amount uint))
  (ft-transfer? wrapped-token amount tx-sender recipient)
)

