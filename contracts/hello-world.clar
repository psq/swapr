(use-trait can-transfer-tokens
    'SP2NC4YKZWM2YMCJV851VF278H9J50ZSNM33P3JM1.token-transfer-trait.can-transfer-tokens)

;; Storage
;; (define-map allowances
;;   ((spender principal) (owner principal))
;;   ((allowance uint)))
(define-data-var counter uint u0)
;; (define-data-var token <can-transfer-tokens> 'SP2NC4YKZWM2YMCJV851VF278H9J50ZSNM33P3JM1.my-token)


(define-public (say-hi)
   (ok "hello world"))

(define-public (echo-number (val int))
   (ok val))

(define-public (increment-1 (number int))
   (ok (+ number 1)))

(define-public (add-to-position (x uint) (y uint))
   (let ((contract-address (as-contract tx-sender)) (back (- x u3)))
      ;; (print "aaaa")
      ;; (print x)
      ;; (print back)
      ;; (print "bbbb")
      ;; (print tx-sender)
      ;; (print "cccc")
      ;; (print contract-address)
      (print (unwrap! (contract-call? 'SP2NC4YKZWM2YMCJV851VF278H9J50ZSNM33P3JM1.my-token balance-of 'SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7) (err u1)))
      (print (unwrap! (contract-call? 'SP2NC4YKZWM2YMCJV851VF278H9J50ZSNM33P3JM1.my-token balance-of contract-address) (err u1)))
      (print (contract-call? 'SP2NC4YKZWM2YMCJV851VF278H9J50ZSNM33P3JM1.my-token transfer contract-address x))
      (print (unwrap! (contract-call? 'SP2NC4YKZWM2YMCJV851VF278H9J50ZSNM33P3JM1.my-token balance-of 'SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7) (err u3)))
      (print (unwrap! (contract-call? 'SP2NC4YKZWM2YMCJV851VF278H9J50ZSNM33P3JM1.my-token balance-of contract-address) (err u4)))
      ;; (print "dddd")
      (as-contract (print (contract-call? 'SP2NC4YKZWM2YMCJV851VF278H9J50ZSNM33P3JM1.my-token transfer 'SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7 back)))
      ;; (print "ffff")
      (print (unwrap! (contract-call? 'SP2NC4YKZWM2YMCJV851VF278H9J50ZSNM33P3JM1.my-token balance-of 'SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7) (err u3)))
      (print (unwrap! (contract-call? 'SP2NC4YKZWM2YMCJV851VF278H9J50ZSNM33P3JM1.my-token balance-of contract-address) (err u4)))
      ;; (print "gggg")

      (ok u0)
   )
)

(define-public (info (arg0 principal))
  (begin
    (print tx-sender)
    (print (stx-transfer? u1 'ST11NJTTKGVT6D1HY4NJRVQWMQM7TVAR091EJ8P2Y arg0))
    (print (unwrap! (contract-call? 'SP2NC4YKZWM2YMCJV851VF278H9J50ZSNM33P3JM1.my-token balance-of 'SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7) (err u1)))
    (print contract-caller)
    (print block-height)
    (print arg0)
    (ok true)
  )
)

(define-public (increment-counter!)
  (begin
    (var-set counter (+ u1 (var-get counter)))
    (ok true)
  )
)

(define-public (get-counter)
  (ok (var-get counter)))
