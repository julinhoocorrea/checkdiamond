export function VendaCliente() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
        <h1 className="text-3xl font-bold text-center text-slate-900 mb-4">
          Diamantes Kwai
        </h1>
        <p className="text-center text-slate-600 mb-8">
          Compre diamantes para o Kwai de forma rápida e segura
        </p>
        <div className="text-center">
          <p className="text-2xl font-bold text-green-600">R$ 6,89</p>
          <p className="text-slate-600">100 Diamantes</p>
        </div>
      </div>
    </div>
  );
}
