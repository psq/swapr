(use-trait sip-010-token 'ST1HTBVD3JG9C05J7HBJTHGR0GGW7KXW28M5JS8QE.sip-010.ft-trait)

(define-constant token-1-err (err u111))
(define-constant token-2-err (err u112))
(define-constant token-3-err (err u113))
(define-constant reward-transfer-err (err u114))
(define-constant no-reward-err (err u115))
(define-constant already-claimed-err (err u116))
(define-constant token-mismatch-err (err u117))
(define-constant reward-cycle-needs-rollover-err (err u118))
(define-constant future-cycle-err (err u119))
(define-constant nothing-to-rollover-err (err u120))
(define-constant nothing-to-claim-err (err u121))

(define-constant default-principal 'ST1HTBVD3JG9C05J7HBJTHGR0GGW7KXW28M5JS8QE)

;;
;; TODO(psq): all reward management calls need to be white listed
;;
;;
;;

;; TODO(psq): 1 week takes too long on clarity-js-sdk, the only one the deals with time "correctly"
;; (define-constant WEEK (* (* u3600 u24) u7))  ;; 604_800
(define-constant WEEK (* (* u3600 u24) u1))  ;; 604_800

;; TODO(psq): needs to be per pair per cycle
(define-map rewards-amounts
  {
    cycle: uint,
    pair: (string-ascii 32),
    slot: uint,
  }
  {
    token: principal,
    amount: uint,
    claimed: uint,
  }
)

;; TODO(psq): needs to be per pair per cycle
;; if no data for cycle, use cycle u0
(define-map rewards-shares
  {
    cycle: uint,
    pair: (string-ascii 32),
  }
  {
    total-shares: uint,  ;; the total amount of reward shares earned for that cycle
  }
)

;; adding liquidity should mix and match multiplier
;; removing liquidity resets multiplier back to 1x for what is left (removing liquidity is not a desirable event)
;; keep reward share for next 8, or use 3x if no data
;; adding more will add 1x, 2x, 3x values for next 8, and/or add 3x if no next is available
;; beautiful!

;; so, include next 8 cycle values, or assume 3x shares
;; cycle 0 is steady state after specific ramping up slots are done
;; so if {cycle} has a value, use it, otherwise, use {0}
;; TODO(psq): needs to be per pair per cycle
(define-map rewards-provider
  {
    recipient : principal,
    cycle: uint,  ;; when last provide event occured
    pair: (string-ascii 32),
  }
  {
    shares: uint,
  }
)

;; TODO(psq): unfortunately, can't find a solution that could not be abused by
;; either doing lots of (wash) trades, or creating multiple address, so no rewards
;; for users

;; a swapper only gets rewarded for a cycle where an exchange happened
;; an LP gets increasingly rewarded for supplying liquidity longer
;; TODO(psq): can only claim on current, maybe don't store more?
;; TODO(psq): needs to be per pair per cycle
;; (define-map rewards-user
;;   {
;;     recipient : principal,
;;     cycle: uint,
;;     pair: (string-ascii 32),
;;   }
;;   {
;;     shares: uint,
;;   }
;; )

;; TODO(psq):  can only claim on current, maybe don't store more?
;; TODO(psq): needs to be per pair per cycle
(define-map rewards-claim
  {
    recipient : principal,
    cycle : uint,
    pair: (string-ascii 32),
    slot: uint,
  }
  {
    claimed: bool,
  }
)

;; the week number, with week 0 starting at unix epoch start
;; example now = 1621276500, Monday, May 17th 2021, 11:35:00
;; reward cycle = 2680 (which is 2680 * WEEK, starts Wednesday, May 12th 2021, 17:00:00)
;; reward-cycle * <= now < (reward-cycle + 1) * WEEK


;; current reward cycle, need to use previous block as current block data is not available
(define-read-only (get-reward-cycle)
  (/ (unwrap-panic (get-block-info? time (if (> block-height u0) (- block-height u1) u0))) WEEK)
)

;; TODO(psq): debug, remove
(define-read-only (get-block-height)
  block-height
)

;; TODO(psq): debug, remove
(define-read-only (get-block-time)
  (unwrap-panic (get-block-info? time (if (> block-height u0) (- block-height u1) u0)))
)

;; 1x < 4 weeks, 2 x > 4 weeks, 3x > 8 weeks
;; new liq resets multiplier, or maybe not?
;; claim reward => escrow (locked 6-12 months, starts at 6 and gradually ramps up to 12 right away)
;; move unclaimed reward to next cycle
;; claim from escrow, and withdraw
;; claim from escrow, and stake


;; the previous cycle (cycle -1) must exist, and its data will be copied to cycle i
(define-public (check-cylcle-or-create (cycle uint) (pair (string-ascii 32)))
  (let ((shares-opt (map-get? rewards-shares { cycle: cycle, pair: pair })))
    (if (is-none shares-opt)
      (let ((previous-shares (unwrap-panic (map-get? rewards-shares { cycle: (- cycle u1), pair: pair }))))
        (map-set rewards-shares { cycle: cycle, pair: pair } previous-shares)
        (ok true)
      )
      (ok true)
    )
  )
)

;; there should never be a bucket for > current + 8
(define-public (setup-upcoming-cycles (pair (string-ascii 32)))
  (let ((current (get-reward-cycle)))
    (unwrap-panic (check-cylcle-or-create current pair))
    (unwrap-panic (check-cylcle-or-create (+ current u1) pair))
    (unwrap-panic (check-cylcle-or-create (+ current u2) pair))
    (unwrap-panic (check-cylcle-or-create (+ current u3) pair))
    (unwrap-panic (check-cylcle-or-create (+ current u4) pair))
    (unwrap-panic (check-cylcle-or-create (+ current u5) pair))
    (unwrap-panic (check-cylcle-or-create (+ current u6) pair))
    (unwrap-panic (check-cylcle-or-create (+ current u7) pair))

    (unwrap-panic (check-cylcle-or-create u0 pair))
    (ok true)
  )
)

(define-private (add-rewards-1 (cycle uint) (pair (string-ascii 32)) (owner principal) (shares uint))
  ;; add shares to rewards-shares or create for cycle
  ;; add shares to rewards-provider or create for cycle
  (let
    (
      (rewards-shares-opt (map-get? rewards-shares { cycle: cycle, pair: pair }))
      (rewards-provider-opt (map-get? rewards-provider { recipient: owner, cycle: cycle, pair: pair }))
    )
    ;; if none, use 0
    (if (is-none rewards-shares-opt)
      (let
        (
          (ongoing-shares (default-to { total-shares: u0 } (map-get? rewards-shares { cycle: u0, pair: pair })))
        )
        (map-set rewards-shares { cycle: cycle, pair: pair } { total-shares: (+ shares (get total-shares ongoing-shares)) })
      )
      (map-set rewards-shares { cycle: cycle, pair: pair } { total-shares: (+ (get total-shares (unwrap-panic rewards-shares-opt)) shares) })
    )
    ;; if none, use 0
    (if (is-none rewards-provider-opt)
      (let
        (
          (ongoing-rewards-provider (default-to { shares: u0 } (map-get? rewards-provider { recipient: owner, cycle: cycle, pair: pair })))
        )
        (map-set rewards-provider { recipient: owner, cycle: cycle, pair: pair } { shares: (+ shares (get shares ongoing-rewards-provider)) })
      )
      (map-set rewards-provider { recipient: owner, cycle: cycle, pair: pair } { shares: (+ (get shares (unwrap-panic rewards-provider-opt)) shares) })
    )
  )
)

(define-public (add-rewards (pair (string-ascii 32)) (owner principal) (shares uint))
  (let ((current (get-reward-cycle)))
    ;; add 1x for 1, 2, 3
    (add-rewards-1 current pair owner u0)  ;; no reward for this period
    (add-rewards-1 (+ current u1) pair owner shares)
    (add-rewards-1 (+ current u2) pair owner shares)
    (add-rewards-1 (+ current u3) pair owner shares)
    ;; add 2x for 4, 5, 6, 7
    (add-rewards-1 (+ current u4) pair owner (* shares u2))
    (add-rewards-1 (+ current u5) pair owner (* shares u2))
    (add-rewards-1 (+ current u6) pair owner (* shares u2))
    (add-rewards-1 (+ current u7) pair owner (* shares u2))
    ;; add 3x for all others, steady state
    (add-rewards-1 u0 pair owner (* shares u3))
    (ok true)
  )
)

(define-private (cancel-rewards-1 (cycle uint) (pair (string-ascii 32)) (owner principal))
  ;; if rewards-provider data exists for {cycle, owner}
  ;; remove from rewards-shares for {cycle}
  (let
    (
      (rewards-provider-opt (map-get? rewards-provider { recipient: owner, cycle: cycle, pair: pair }))
    )
    (if (is-some rewards-provider-opt)
      (let ((rewards-shares-op (map-get? rewards-shares { cycle: cycle, pair: pair })))
        (if (is-some rewards-shares-op)
          (map-set rewards-shares { cycle: cycle, pair: pair } { total-shares: (- (get shares (unwrap-panic rewards-provider-opt))) })
          false
        )
      )
      false  ;; why is there no variant with only expr1, although what would the value be?  just don't care about value here
    )
  )
)

;; when LP remove-all and then `add-rewards` which resets mulitplier
(define-public (cancel-rewards (pair (string-ascii 32)) (owner principal))
  (let ((current (get-reward-cycle)))
    (cancel-rewards-1 current pair owner)
    (cancel-rewards-1 (+ current u1) pair owner)
    (cancel-rewards-1 (+ current u2) pair owner)
    (cancel-rewards-1 (+ current u3) pair owner)
    (cancel-rewards-1 (+ current u4) pair owner)
    (cancel-rewards-1 (+ current u5) pair owner)
    (cancel-rewards-1 (+ current u6) pair owner)
    (cancel-rewards-1 (+ current u7) pair owner)

    (cancel-rewards-1 (+ current u0) pair owner)
    (ok true)
  )
)

;; total shares for cycle/pair
(define-read-only (claimable-total-shares (cycle uint) (pair (string-ascii 32)))
  (let ((shares-opt (map-get? rewards-shares { cycle: cycle, pair: pair })))
    (if (is-none shares-opt)
      u0
      (get total-shares (unwrap-panic shares-opt))
    )
  )
)

;; shares for owner for cycle/pair
(define-read-only (claimable-share (cycle uint) (pair (string-ascii 32)) (owner principal))
  ;; TODO(psq): implement and use in claim-rewards to calculate how much to transfer
  ;; get rewards-shares
  ;; get rewards-provider
  ;; get rewards-user
  ;; return (rewards-provider + rewards-user) / rewards-shares as (num, den) so it can keep max precision
  (let
    (
      (shares-opt (map-get? rewards-shares { cycle: cycle, pair: pair }))
      ;; use if instead of `default` to avoid loading u0 map value
      (total-shares (if (is-some shares-opt) (get total-shares (unwrap-panic shares-opt)) (get total-shares (default-to { total-shares: u0 } (map-get? rewards-shares { cycle: u0, pair: pair })))))

      (provider-shares-opt (map-get? rewards-provider { recipient: owner, cycle: cycle, pair: pair }))
      (provider-shares (if (is-some provider-shares-opt) (get shares (unwrap-panic provider-shares-opt)) (get shares (default-to { shares: u0 } (map-get? rewards-provider { recipient: owner, cycle: u0, pair: pair })))))

      ;; (user-shares-opt (map-get? rewards-user { recipient: owner, cycle: cycle, pair: pair }))
      ;; (user-shares (if (is-some user-shares-opt) (get shares (unwrap-panic user-shares-opt)) (get shares (default-to { shares: u0 }  (map-get? rewards-user { recipient: owner, cycle: u0, pair: pair })))))
    )

    ;; (list (+ provider-shares user-shares) total-shares)
    (list provider-shares total-shares)
  )
)

;; is there any leftover reward from previous cycle?
(define-read-only (should-rollover-rewards (pair (string-ascii 32)) (slot uint) (previous-cycle uint))
  (let
    (
      (cycle (print (get-reward-cycle)))
      (reward (default-to {token: default-principal, amount: u0, claimed: u0} (print (map-get? rewards-amounts { cycle: (print previous-cycle), pair: pair, slot: slot }))))
    )
    (print "should-rollover-rewards")
    (print cycle)
    (print previous-cycle)
    (print reward)
    (print (> (get amount reward) u0))
  )
)

;; if there any leftover reward from previous cycle, move amount to current cycle
;; can be called by anyone
(define-public (rollover-rewards (pair (string-ascii 32)) (slot uint) (previous-cycle uint))
  (let
    (
      (cycle (get-reward-cycle))
      (reward-previous (unwrap-panic (map-get? rewards-amounts { cycle: previous-cycle, pair: pair, slot: slot })))
      (reward-current (unwrap-panic (map-get? rewards-amounts { cycle: cycle, pair: pair, slot: slot })))
      (rollover-amount (- (get amount reward-previous) (get claimed reward-previous)))
    )
    (asserts! (< previous-cycle cycle) future-cycle-err)
    (asserts! (> rollover-amount u0) nothing-to-rollover-err)
    (map-set rewards-amounts { cycle: cycle, pair: pair, slot: slot } (merge reward-current {amount: (+ rollover-amount (get amount reward-current))}))
    (map-set rewards-amounts { cycle: previous-cycle, pair: pair, slot: slot } (merge reward-previous {amount: u0}))
    (ok true)
  )
)

(define-public (claim-rewards (pair (string-ascii 32)) (slot uint) (token <sip-010-token>))
  ;; TODO(psq)
  ;; check not claimed already
  ;; calculate reward share for provider (either {cycle} or {u0})
  ;; calculate reward sharefor user (either {cycle} or {u0})
  ;; mark reward as claimed
  ;; transfer reward share / total share of weekly reward

  (begin
    (print "claim-rewards")
    (asserts! (not (should-rollover-rewards pair slot (- (get-reward-cycle) u1))) reward-cycle-needs-rollover-err)
    (print "claim-rewards 2")
    (let
      (
        (owner tx-sender)
        (cycle (print (get-reward-cycle)))
        (contract (contract-of token))
        (claimed (get claimed (default-to { claimed: false } (map-get? rewards-claim { recipient: owner, cycle: cycle, pair: pair, slot: slot }))))
        (share (print (claimable-share cycle pair owner)))
        (reward (unwrap-panic (map-get? rewards-amounts { cycle: cycle, pair: pair, slot: slot })))
        (total-shares (print (unwrap-panic (element-at share u1))))
        (amount (if (> total-shares u0) (/ (* (get amount reward) (unwrap-panic (element-at share u0))) total-shares) u0))
        (reward-for-cycle (unwrap-panic (map-get? rewards-amounts { cycle: cycle, pair: pair, slot: slot })))  ;; should exist
      )
      (print {cycle: cycle, claimed: claimed, reward-for-cycle: reward-for-cycle, amount: amount})
      (asserts! (> amount u0) nothing-to-claim-err)
      (asserts! (not claimed) already-claimed-err)
      (asserts! (not (is-eq u0 (unwrap-panic (element-at share u0)))) no-reward-err)
      (asserts! (is-eq contract (get token reward)) token-mismatch-err)
      (map-set rewards-claim { recipient: owner, cycle: cycle, pair: pair, slot: slot } { claimed: true })
      (map-set rewards-amounts { cycle: cycle, pair: pair, slot: slot } (merge reward-for-cycle { claimed: (+ amount (get claimed reward-for-cycle)) }))
      (as-contract (contract-call? token transfer amount tx-sender owner))
    )
  )
)

(define-public (claim-rewards-2 (owner principal) (pair (string-ascii 32)) (token-1 <sip-010-token>) (token-2 <sip-010-token>))
  (begin
    (unwrap! (claim-rewards pair u1 token-1 owner) token-1-err)
    (unwrap! (claim-rewards pair u2 token-2 owner) token-2-err)
    (ok u0)
  )
)

(define-public (claim-rewards-3 (owner principal) (pair (string-ascii 32)) (token-1 <sip-010-token>) (token-2 <sip-010-token>) (token-3 <sip-010-token>))
  (begin
    (unwrap! (claim-rewards pair u1 token-1 owner) token-1-err)
    (unwrap! (claim-rewards pair u2 token-2 owner) token-2-err)
    (unwrap! (claim-rewards pair u3 token-3 owner) token-3-err)
    (ok u0)
  )
)

(define-public (credit-rewards (cycle uint) (pair (string-ascii 32)) (slot uint) (token <sip-010-token>) (amount uint))
  (let
    (
      (contract-address (as-contract tx-sender))
      (reward-opt (map-get? rewards-amounts { cycle: cycle, pair: pair, slot: slot }))
    )
    (if (is-none reward-opt)
      (map-set rewards-amounts { cycle: cycle, pair: pair, slot: slot } { token: (contract-of token), amount: amount, claimed: u0 })
      (let
        (
          (reward (unwrap-panic reward-opt))
          (token-contract (contract-of token))
          (existing-token-contract (get token reward))
          (existing-amount (get amount reward))
        )
        (asserts! (is-eq token-contract existing-token-contract) token-mismatch-err)
        (map-set rewards-amounts { cycle: cycle, pair: pair, slot: slot } { token: existing-token-contract, amount: (+ existing-amount amount), claimed: u0 })
      )
    )
    (unwrap! (contract-call? token transfer amount contract-caller contract-address) reward-transfer-err)
    (ok true)
  )
)

(define-public (credit-rewards-2 (cycle uint) (pair (string-ascii 32)) (token-1 <sip-010-token>) (amount-1 uint) (token-2 <sip-010-token>) (amount-2 uint))
  (begin
    (unwrap! (credit-rewards cycle pair u1 token-1 amount-1) token-1-err)
    (unwrap! (credit-rewards cycle pair u2 token-2 amount-2) token-2-err)
    (ok u0)
  )
)

(define-public (credit-rewards-3 (cycle uint) (pair (string-ascii 32)) (token-1 <sip-010-token>) (amount-1 uint) (token-2 <sip-010-token>) (amount-2 uint) (token-3 <sip-010-token>) (amount-3 uint))
  (begin
    (unwrap! (credit-rewards cycle pair u1 token-1 amount-1) token-1-err)
    (unwrap! (credit-rewards cycle pair u2 token-2 amount-2) token-2-err)
    (unwrap! (credit-rewards cycle pair u3 token-2 amount-2) token-3-err)
    (ok u0)
  )
)

(map-set rewards-shares { cycle: u0, pair: "pair" } {total-shares: u0})
(map-set rewards-shares { cycle: (get-reward-cycle), pair: "pair" } {total-shares: u0})

;; TODO(psq): escrow and claim from escrow