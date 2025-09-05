import type { Route } from "./+types/signup";
import { Link, useNavigate } from "react-router";
import { useState } from "react";
import { Phone, Mail, Lock, User, Building, ArrowRight, CheckCircle } from "lucide-react";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Sign Up - VoiceAI" },
    { name: "description", content: "Create your VoiceAI account" },
  ];
}

export default function Signup() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    password: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate("/dashboard");
  };

  const features = [
    "14-day free trial",
    "No credit card required",
    "Cancel anytime",
    "24/7 support"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-5xl">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="lg:grid lg:grid-cols-2">
            <div className="p-8 lg:p-12">
              <Link to="/" className="flex items-center mb-8">
                <Phone className="h-10 w-10 text-indigo-600" />
                <span className="ml-2 text-2xl font-bold text-slate-900">VoiceAI</span>
              </Link>
              
              <h2 className="text-3xl font-bold text-slate-900 mb-2">Get started free</h2>
              <p className="text-slate-600 mb-8">Join 500+ businesses transforming their communication</p>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-2">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <input
                      id="name"
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition"
                      placeholder="John Doe"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                    Work Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition"
                      placeholder="john@company.com"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="company" className="block text-sm font-medium text-slate-700 mb-2">
                    Company Name
                  </label>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <input
                      id="company"
                      type="text"
                      value={formData.company}
                      onChange={(e) => setFormData({...formData, company: e.target.value})}
                      className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition"
                      placeholder="Acme Inc."
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                  <p className="mt-2 text-sm text-slate-500">Must be at least 8 characters</p>
                </div>
                
                <div>
                  <label className="flex items-start">
                    <input type="checkbox" className="h-4 w-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 mt-1" required />
                    <span className="ml-2 text-sm text-slate-600">
                      I agree to the{" "}
                      <a href="#" className="text-indigo-600 hover:text-indigo-700">Terms of Service</a>
                      {" "}and{" "}
                      <a href="#" className="text-indigo-600 hover:text-indigo-700">Privacy Policy</a>
                    </span>
                  </label>
                </div>
                
                <button
                  type="submit"
                  className="w-full flex items-center justify-center px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition"
                >
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </button>
              </form>
              
              <p className="mt-6 text-center text-sm text-slate-600">
                Already have an account?{" "}
                <Link to="/login" className="text-indigo-600 hover:text-indigo-700 font-medium">
                  Sign in
                </Link>
              </p>
            </div>
            
            <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-8 lg:p-12 text-white">
              <h3 className="text-2xl font-bold mb-6">Start your 14-day free trial</h3>
              
              <div className="space-y-4 mb-8">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-indigo-200 flex-shrink-0" />
                    <span className="ml-3">{feature}</span>
                  </div>
                ))}
              </div>
              
              <div className="bg-white/10 backdrop-blur rounded-xl p-6 mb-6">
                <p className="text-lg font-semibold mb-2">Join 500+ companies</p>
                <p className="text-indigo-100">
                  Transform your customer communication with AI-powered voice reception
                </p>
              </div>
              
              <div className="space-y-4">
                <div className="bg-white/10 backdrop-blur rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm">Average call handling time</span>
                    <span className="text-sm font-bold">-65%</span>
                  </div>
                  <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                    <div className="h-full w-4/5 bg-white rounded-full" />
                  </div>
                </div>
                
                <div className="bg-white/10 backdrop-blur rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm">Customer satisfaction</span>
                    <span className="text-sm font-bold">+42%</span>
                  </div>
                  <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                    <div className="h-full w-11/12 bg-white rounded-full" />
                  </div>
                </div>
                
                <div className="bg-white/10 backdrop-blur rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm">Missed calls</span>
                    <span className="text-sm font-bold">-98%</span>
                  </div>
                  <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                    <div className="h-full w-full bg-white rounded-full" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}