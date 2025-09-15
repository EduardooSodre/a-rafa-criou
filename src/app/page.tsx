import { WelcomeCard } from '@/components/welcome-card';

export default function HomePage() {
  return (
    <main className='container mx-auto min-h-screen p-6'>
      <div className='mx-auto max-w-4xl space-y-8'>
        {/* Header */}
        <div className='text-center'>
          <h1 className='mb-4 text-4xl font-bold text-foreground'>
            A Rafa Criou
          </h1>
          <p className='text-lg text-muted-foreground'>
            E-commerce de PDFs - Base do Projeto Configurada
          </p>
        </div>

        {/* Welcome Card */}
        <WelcomeCard />

        {/* Design System Preview */}
        <div className='rounded-lg border bg-card p-6 shadow-sm'>
          <h2 className='mb-4 text-2xl font-semibold'>🎨 Design System</h2>
          
          <div className='grid grid-cols-1 gap-6 md:grid-cols-3'>
            {/* Cores */}
            <div>
              <h3 className='mb-3 font-medium'>Cores</h3>
              <div className='space-y-2'>
                <div className='flex items-center gap-3'>
                  <div className='h-6 w-6 rounded-full' style={{ backgroundColor: '#F4F4F4' }}></div>
                  <span className='text-sm'>Background (#F4F4F4)</span>
                </div>
                <div className='flex items-center gap-3'>
                  <div className='h-6 w-6 rounded-full' style={{ backgroundColor: '#FED466' }}></div>
                  <span className='text-sm'>Primária (#FED466)</span>
                </div>
                <div className='flex items-center gap-3'>
                  <div className='h-6 w-6 rounded-full' style={{ backgroundColor: '#FD9555' }}></div>
                  <span className='text-sm'>Secundária (#FD9555)</span>
                </div>
              </div>
            </div>

            {/* Tipografia */}
            <div>
              <h3 className='mb-3 font-medium'>Tipografia</h3>
              <div className='space-y-1'>
                <div className='text-2xl font-bold'>Heading 1</div>
                <div className='text-xl font-semibold'>Heading 2</div>
                <div className='text-lg font-medium'>Heading 3</div>
                <div className='text-base'>Body Text (16px)</div>
                <div className='text-sm text-muted-foreground'>Small Text</div>
              </div>
            </div>

            {/* Stack Técnica */}
            <div>
              <h3 className='mb-3 font-medium'>Stack</h3>
              <div className='space-y-1 text-sm'>
                <div>✅ Next.js 15 (App Router)</div>
                <div>✅ TypeScript</div>
                <div>✅ Tailwind CSS</div>
                <div>✅ Shadcn UI</div>
                <div>✅ Drizzle ORM</div>
                <div>✅ Auth.js</div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className='text-center text-sm text-muted-foreground'>
          <p>
            Desenvolvido com ❤️ para A Rafa Criou
          </p>
        </div>
      </div>
    </main>
  );
}
