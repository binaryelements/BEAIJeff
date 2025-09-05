import type { Route } from "./+types/home";
import { Link } from "react-router";
import { motion } from "framer-motion";
import { 
  Phone, 
  ArrowRight, 
  Users, 
  BarChart3, 
  Shield,
  Globe
} from "lucide-react";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "VoiceAI - Smart Voice Reception System" },
    { name: "description", content: "Transform your business communication with AI-powered voice reception" },
  ];
}

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 z-50 w-full bg-white/90 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                <Phone className="h-6 w-6 text-gray-900" />
              </motion.div>
              <span className="text-lg font-semibold text-gray-900">VoiceAI</span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <Link to="/features" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Features</Link>
              <Link to="/pricing" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Pricing</Link>
              <Link to="/login" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Login</Link>
              <Link 
                to="/signup" 
                className="text-sm px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h1 className="text-5xl md:text-6xl font-semibold text-gray-900 leading-tight mb-6">
              AI Voice Reception
              <span className="block text-gray-400 mt-2">for modern businesses</span>
            </h1>
            
            <p className="text-lg text-gray-600 mb-10 max-w-2xl mx-auto">
              Never miss a call. Handle every customer professionally with intelligent call routing and natural conversations.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Link 
                  to="/signup"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-all"
                >
                  Start Free Trial
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </motion.div>
              
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <button className="px-6 py-3 text-gray-700 border border-gray-200 rounded-lg hover:border-gray-300 hover:bg-gray-50 transition-all">
                  View Demo
                </button>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 border-y border-gray-100">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: "99.9%", label: "Uptime" },
              { value: "50+", label: "Languages" },
              { value: "24/7", label: "Support" },
              { value: "500+", label: "Customers" }
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="text-3xl font-semibold text-gray-900 mb-1">{stat.value}</div>
                <div className="text-sm text-gray-500">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl font-semibold text-gray-900 mb-4">
              Everything you need
            </h2>
            <p className="text-gray-600">
              Professional call handling with enterprise-grade features
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Phone,
                title: "Natural Conversations",
                description: "AI understands context and handles complex requests"
              },
              {
                icon: Users,
                title: "Smart Routing",
                description: "Automatically route calls to the right department"
              },
              {
                icon: BarChart3,
                title: "Analytics",
                description: "Track metrics and gain customer insights"
              },
              {
                icon: Shield,
                title: "Secure",
                description: "Bank-level encryption and compliance"
              },
              {
                icon: Globe,
                title: "Multilingual",
                description: "Support for 50+ languages"
              },
              {
                icon: ArrowRight,
                title: "Easy Setup",
                description: "Get started in minutes with no technical expertise"
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
                viewport={{ once: true }}
                className="group"
              >
                <div className="p-6 rounded-xl hover:bg-gray-50 transition-all">
                  <feature.icon className="h-8 w-8 text-gray-400 mb-4 group-hover:text-gray-600 transition-colors" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-sm text-gray-600">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Dashboard Preview */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden"
          >
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-gray-300" />
                <div className="h-3 w-3 rounded-full bg-gray-300" />
                <div className="h-3 w-3 rounded-full bg-gray-300" />
              </div>
            </div>
            
            <div className="p-8">
              <div className="grid md:grid-cols-3 gap-6">
                <div className="space-y-4">
                  <div className="h-32 bg-gray-100 rounded-lg animate-gentle-pulse" />
                  <div className="h-20 bg-gray-50 rounded-lg" />
                </div>
                <div className="space-y-4">
                  <div className="h-20 bg-gray-50 rounded-lg" />
                  <div className="h-32 bg-gray-100 rounded-lg animate-gentle-pulse" />
                </div>
                <div className="space-y-4">
                  <div className="h-24 bg-gray-100 rounded-lg animate-gentle-pulse" />
                  <div className="h-28 bg-gray-50 rounded-lg" />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-semibold text-gray-900 mb-4">
              Ready to transform your reception?
            </h2>
            <p className="text-gray-600 mb-8">
              Join hundreds of businesses using VoiceAI
            </p>
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="inline-block"
            >
              <Link 
                to="/signup"
                className="inline-flex items-center gap-2 px-8 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-all"
              >
                Start Your Free Trial
                <ArrowRight className="h-4 w-4" />
              </Link>
            </motion.div>
            <p className="text-sm text-gray-500 mt-4">No credit card required</p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-12">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Phone className="h-5 w-5 text-gray-600" />
                <span className="font-medium text-gray-900">VoiceAI</span>
              </div>
              <p className="text-sm text-gray-600">Intelligent voice reception</p>
            </div>
            <div>
              <h3 className="font-medium mb-3 text-gray-900 text-sm">Product</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><Link to="/features" className="hover:text-gray-900 transition-colors">Features</Link></li>
                <li><Link to="/pricing" className="hover:text-gray-900 transition-colors">Pricing</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium mb-3 text-gray-900 text-sm">Company</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><a href="#" className="hover:text-gray-900 transition-colors">About</a></li>
                <li><a href="#" className="hover:text-gray-900 transition-colors">Blog</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium mb-3 text-gray-900 text-sm">Support</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><a href="#" className="hover:text-gray-900 transition-colors">Help</a></li>
                <li><a href="#" className="hover:text-gray-900 transition-colors">Contact</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-100 mt-8 pt-8 text-center">
            <p className="text-sm text-gray-600">&copy; 2024 VoiceAI. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}