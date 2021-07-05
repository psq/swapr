(use-trait flash-loan 'ST1HTBVD3JG9C05J7HBJTHGR0GGW7KXW28M5JS8QE.flash-loan-trait.flash-loan-trait)
(use-trait sip-010-token 'ST1HTBVD3JG9C05J7HBJTHGR0GGW7KXW28M5JS8QE.sip-010.ft-trait)

(define-constant balance-and-fee-not-returned-err (err u100))
(define-constant funding-err (err u101))
(define-constant loan-err (err u102))
(define-constant repay-err (err u103))


(define-public (loan (loan-id uint) (loan-user <flash-loan>) (loan-amount uint) (token <sip-010-token>) (loan-fee-num uint) (loan-fee-den uint))
  (begin
    ;; TODO(psq): check amount is valid
    ;; TODO(psq): prevent any other things that make sense (like using the pair the money comes from)
    ;; transfer
    (unwrap! (as-contract (contract-call? token transfer loan-amount tx-sender (contract-of loan-user))) funding-err)
    ;; record balance
    (let
      (
        (balance (stx-get-balance (as-contract tx-sender)))
        (fee (/ (* loan-amount loan-fee-num) loan-fee-den))  ;; 50 basis point
      )

      ;; call the flash loand operation
      (unwrap! (contract-call? loan-user use-loan loan-id (as-contract tx-sender) loan-amount fee) loan-err)

      ;; check transferred back with fee
      (print "unwinding")
      (print { amount: loan-amount, balance: balance, fee: fee, new-balance: (stx-get-balance (as-contract tx-sender)) })
      (asserts! (>= (unwrap! (contract-call? token get-balance-of (as-contract tx-sender)) repay-err) (+ balance loan-amount fee)) balance-and-fee-not-returned-err)
      (ok fee)
    )
  )
)

;; TOOD(psq): adjust loan fee
;; TODO(psq): need kill switch just for flash loans, in case something can go wrong...