import { Metadata } from 'next'
import UserManagement from '@/components/admin/UserManagement'

export const metadata: Metadata = {
    title: 'Gerenciar Usuários - A Rafa Criou Admin',
    description: 'Gerenciar usuários e permissões administrativas'
}

export default function UsersPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Gerenciar Usuários</h1>
                <p className="text-gray-600">Promover ou demover usuários, controlar permissões</p>
            </div>

            <UserManagement />
        </div>
    )
}