'use client'; // ضروري جداً لتعريف أنه Component يعمل في المتصفح

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-96 text-center">
        <h1 className="text-2xl font-bold mb-4">أهلاً بك في SoufStock</h1>
        <p className="text-gray-600 mb-6">يرجى تسجيل الدخول للوصول إلى النظام</p>
        <button className="w-full bg-blue-600 text-white py-2 rounded">دخول</button>
      </div>
    </div>
  );
}
