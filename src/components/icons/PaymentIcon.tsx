import Image from 'next/image'

type PaymentMethod = 'visa' | 'mastercard' | 'amex' | 'pix' | 'paypal' | 'stripe'

interface PaymentIconProps {
    method: PaymentMethod
    className?: string
    width?: number
    height?: number
}

const paymentLabels: Record<PaymentMethod, string> = {
    visa: 'Visa',
    mastercard: 'Mastercard',
    amex: 'American Express',
    pix: 'PIX - Pagamento Instantâneo',
    paypal: 'PayPal',
    stripe: 'Stripe'
}

export function PaymentIcon({
    method,
    className = 'h-5 w-auto',
    width = 48,
    height = 32
}: PaymentIconProps) {
    return (
        <Image
            src={`/payments/${method}.svg`}
            alt={paymentLabels[method]}
            width={width}
            height={height}
            className={className}
            loading="lazy"
        />
    )
}


export function PaymentMethods({
    className = 'flex flex-wrap gap-2',
    iconSize = 'default'
}: {
    className?: string
    iconSize?: 'small' | 'default' | 'large'
}) {
    const methods: PaymentMethod[] = ['visa', 'mastercard', 'amex', 'stripe', 'paypal', 'pix']

    const sizes = {
        small: { width: 48, height: 32, class: 'h-5 sm:h-6' },
        default: { width: 60, height: 40, class: 'h-7 sm:h-8' },
        large: { width: 72, height: 48, class: 'h-9 sm:h-10' }
    }

    const size = sizes[iconSize]

    return (
        <div className={className}>
            {methods.map(method => (
                <div
                    key={method}
                    className="bg-white rounded px-1.5 py-1 flex items-center"
                >
                    <PaymentIcon
                        method={method}
                        width={size.width}
                        height={size.height}
                        className={`${size.class} w-auto`}
                    />
                </div>
            ))}
        </div>
    )
}
