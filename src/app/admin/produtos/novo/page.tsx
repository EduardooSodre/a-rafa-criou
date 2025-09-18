import { Metadata } from 'next'
import ProductForm from '@/components/admin/ProductForm'

export const metadata: Metadata = {
    title: 'Novo Produto - A Rafa Criou Admin',
    description: 'Criar um novo produto para o e-commerce'
}

export default function NewProductPage() {
    return (
        <div className="space-y-6">
            <ProductForm />
        </div>
    )
}