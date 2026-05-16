interface PriceDisplayProps {
  priceUsd: number | null
  bestCouponPct: number | null
}

export function PriceDisplay({ priceUsd, bestCouponPct }: PriceDisplayProps) {
  const isFree = priceUsd === null || priceUsd === 0

  if (isFree) {
    return (
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold text-emerald-600">Free</span>
      </div>
    )
  }

  const discountedPrice =
    bestCouponPct != null ? priceUsd * (1 - bestCouponPct / 100) : null

  return (
    <div className="flex items-baseline gap-3">
      <span className="text-2xl font-bold text-foreground">
        ${(discountedPrice ?? priceUsd).toFixed(2)}
      </span>
      {discountedPrice != null && (
        <>
          <span className="text-base text-muted-foreground line-through">
            ${priceUsd.toFixed(2)}
          </span>
          <span className="text-sm font-medium text-emerald-600">
            {bestCouponPct}% off
          </span>
        </>
      )}
    </div>
  )
}
