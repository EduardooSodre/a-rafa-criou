import Image from 'next/image'

type PaymentMethod = 'visa' | 'mastercard' | 'amex' | 'pix' | 'paypal'

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
    paypal: 'PayPal'
}

/**
 * Componente para exibir ícones de métodos de pagamento.
 * 
 * Usa SVGs oficiais otimizados baseados nas guidelines das marcas.
 * Todos os logos são marcas registradas de suas respectivas empresas.
 * 
 * @example
 * ```tsx
 * <PaymentIcon method="visa" />
 * <PaymentIcon method="pix" width={56} height={40} />
 * ```
 */
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

/**
 * Componente que exibe todos os métodos de pagamento aceitos.
 * 
 * @example
 * ```tsx
 * <PaymentMethods />
 * <PaymentMethods className="gap-3" iconSize="large" />
 * ```
 */
export function PaymentMethods({
    className = 'flex flex-wrap gap-2',
    iconSize = 'default'
}: {
    className?: string
    iconSize?: 'small' | 'default' | 'large'
}) {
    const methods: PaymentMethod[] = ['visa', 'mastercard', 'amex', 'pix', 'paypal']

    const sizes = {
        small: { width: 36, height: 24, class: 'h-4 sm:h-5' },
        default: { width: 48, height: 32, class: 'h-5 sm:h-6' },
        large: { width: 60, height: 40, class: 'h-6 sm:h-7' }
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
