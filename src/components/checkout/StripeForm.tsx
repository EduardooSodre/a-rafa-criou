"use client";

import { useState, FormEvent } from "react";
import { PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";

export function StripeCheckoutForm() {
    const stripe = useStripe();
    const elements = useElements();
    const { data: session, status } = useSession();
    const [isProcessing, setIsProcessing] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!stripe || !elements) return;
        if (!session?.user?.id) {
            setErrorMessage("Você precisa estar logado para finalizar a compra.");
            return;
        }

        setIsProcessing(true);
        setErrorMessage(null);

        const { error } = await stripe.confirmPayment({
            elements,
            confirmParams: {
                return_url: `${window.location.origin}/obrigado`,
            },
            redirect: "always",
        });

        if (error) {
            setErrorMessage(error.message || "Erro ao processar pagamento");
            setIsProcessing(false);
            return;
        }
        setIsProcessing(false);
    };

    if (status === "loading") {
        return <div className="text-center py-12 text-gray-500">Carregando...</div>;
    }
    if (!session?.user?.id) {
        return (
            <div className="rounded-md bg-red-50 border border-red-200 p-4 text-sm text-red-800 text-center">
                Você precisa estar logado para finalizar a compra.
            </div>
        );
    }
    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <PaymentElement />
            {errorMessage && (
                <div className="rounded-md bg-red-50 border border-red-200 p-4 text-sm text-red-800">
                    {errorMessage}
                </div>
            )}
            <Button
                type="submit"
                disabled={!stripe || isProcessing}
                className="w-full bg-[#FED466] hover:bg-[#FED466]/90 text-black font-semibold"
            >
                {isProcessing ? "Processando..." : "Finalizar Pagamento"}
            </Button>
        </form>
    );
}

export default StripeCheckoutForm;
