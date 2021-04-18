;; wrap the native STX token into an SRC20 compatible token to be usable along other tokens
(impl-trait 'ST1HTBVD3JG9C05J7HBJTHGR0GGW7KXW28M5JS8QE.sip-010.ft-trait)

(define-fungible-token thing)

;; get the token balance of owner
(define-read-only (get-balance-of (owner principal))
  (ok (ft-get-balance thing owner))
)

;; returns the total number of tokens
;; TODO(psq): we don't have access yet, but once POX is available, this should be a value that
;; is available from Clarity
(define-read-only (get-total-supply)
  (ok (ft-get-supply thing))
)

;; returns the token name
(define-read-only (get-name)
  (ok "Thing")
)

(define-read-only (get-symbol)
  (ok "THG")
)

;; the number of decimals used
(define-read-only (get-decimals)
  (ok u8)  ;; because we can, and interesting for testing wallets and other clients
)

(define-read-only (get-token-uri)
  (ok (some u"https://swapr.finance/tokens/thing.json"))
)
;; {
;;   "name":"Thing",
;;   "description":"Thing token, used as a test token",
;;   "image":"https://swapr.finance/tokens/thing.png",
;;   "vector":"https://swapr.finance/tokens/thing.svg"
;; }


;; (transfer (uint principal principal) (response bool uint))
;; amount sender recipient
;; Transfers tokens to a recipient
(define-public (transfer (amount uint) (sender principal) (recipient principal))
  (begin
    (print "thing.transfer")
    (print amount)
    (print tx-sender)
    (print recipient)
    (asserts! (is-eq tx-sender sender) (err u255)) ;; too strict?
    (print (ft-transfer? thing amount tx-sender recipient))
  )
)

;; TODO(psq): remove for mainnet, how???
(ft-mint? thing u1000000000000 'ST2SVRCJJD90TER037VCSAFA781HQTCPFK9YRA6J5)
