import { InfoForm } from "./components/InfoForm";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
     
      {/* Login Form Section */}
      <div className="py-16">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Get Started</h2>
              <p className="text-gray-600">Enter your details to join a meeting</p>
            </div>
            
            <InfoForm />
          </div>
        </div>
      </div>
    </div>
  );
}
