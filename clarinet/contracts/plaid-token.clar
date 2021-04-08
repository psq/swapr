;; wrap the native STX token into an SRC20 compatible token to be usable along other tokens
;; (use-trait src20-token .src20-trait.src20-trait)
(impl-trait 'ST000000000000000000002AMW42H.sip-010.ft-trait)

(define-fungible-token plaid)

;; get the token balance of owner
(define-read-only (get-balance-of (owner principal))
  (ok (ft-get-balance plaid owner))
)

;; returns the total number of tokens
;; TODO(psq): we don't have access yet, but once POX is available, this should be a value that
;; is available from Clarity
(define-read-only (get-total-supply)
  (ok u0)
)

;; returns the token name
(define-read-only (get-name)
  (ok "Plaid")
)

(define-read-only (get-symbol)
  (ok "PLD")
)

;; the number of decimals used
(define-read-only (get-decimals)
  (ok u8)
)

(define-read-only (get-token-uri)
  (ok (some u"https://swapr.finance/tokens/plaid.json"))
)
;; {
;;   "name":"Plaid",
;;   "description":"Plaid token, uses as a test token",
;;   "image":"https://swapr.finance/tokens/plaid.png"
;; }


;; (transfer (uint principal principal) (response bool uint))
;; amount sender recipient
;; Transfers tokens to a recipient
(define-public (transfer (amount uint) (sender principal) (recipient principal))
  (begin
    (print "plaid.transfer")
    (print amount)
    (print tx-sender)
    (print recipient)
    (asserts! (is-eq tx-sender sender) (err u255)) ;; too strict?
    (print (ft-transfer? plaid amount tx-sender recipient))
  )
)

;; (ft-mint? plaid u100000000000000 'ST3J2GVMMM2R07ZFBJDWTYEYAR8FZH5WKDTFJ9AHA)
;; (ft-mint? plaid u100000000000000 'ST1TWA18TSWGDAFZT377THRQQ451D1MSEM69C761)
;; (ft-mint? plaid u100000000000000 'ST50GEWRE7W5B02G3J3K19GNDDAPC3XPZPYQRQDW)
(ft-mint? plaid u1000000000000 'ST2SVRCJJD90TER037VCSAFA781HQTCPFK9YRA6J5)  ;; expected but clarinet uses ST3AA33M8SS15A30ETXE134ZXD8TNEDHT8Q955G40
(ft-mint? plaid u1000000000000 'ST3AA33M8SS15A30ETXE134ZXD8TNEDHT8Q955G40)  ;; for clarinet, because not the same derivation
