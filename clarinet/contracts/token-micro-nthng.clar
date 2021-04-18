(define-fungible-token micro-nothing)

(define-data-var total-supply uint u0)

(define-read-only (get-total-supply)
  (var-get total-supply))

(define-private (mint! (account principal) (amount uint))
  (if (<= amount u0)
      (err u0)
      (begin
        (var-set total-supply (+ (var-get total-supply) amount))
        (ft-mint? micro-nothing amount account))))


(define-public (transfer (to principal) (amount uint))
  (if
    (> (ft-get-balance micro-nothing tx-sender) u0)
    (ft-transfer? micro-nothing amount tx-sender to)
    (err u0)))

(mint! 'SP1AWFMSB3AGMFZY9JBWR9GRWR6EHBTMVA9JW4M20 u20000000000000)
(mint! 'SP1K1A1PMGW2ZJCNF46NWZWHG8TS1D23EGH1KNK60 u20000000000000)
(mint! 'SP2F2NYNDDJTAXFB62PJX351DCM4ZNEVRYJSC92CT u20000000000000)
(mint! 'SP32AEEF6WW5Y0NMJ1S8SBSZDAY8R5J32NBZFPKKZ u20000000000000)
(mint! 'SPT9JHCME25ZBZM9WCGP7ZN38YA82F77YM5HM08B  u20000000000000)

(mint! 'ST2SVRCJJD90TER037VCSAFA781HQTCPFK9YRA6J5 u100000000000000)
(mint! 'ST1HTBVD3JG9C05J7HBJTHGR0GGW7KXW28M5JS8QE u100000000000000)
