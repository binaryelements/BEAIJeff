import type { Route } from "./+types/features";
import { Link } from "react-router";
import { 
  Phone,
  Bot,
  Brain,
  Globe,
  Shield,
  Zap,
  Users,
  BarChart3,
  Clock,
  MessageSquare,
  Route as RouteIcon,
  Headphones,
  ArrowRight,
  CheckCircle
} from "lucide-react";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Features - VoiceAI" },
    { name: "description", content: "Discover all the powerful features of VoiceAI" },
  ];
}

export default function Features() {
  const features = [
    {
      icon: Bot,
      title: "AI-Powered Conversations",
      description: "Natural language processing understands context and intent, providing human-like interactions.",
      benefits: [
        "Context-aware responses",
        "Multi-turn conversations",
        "Sentiment analysis"
      ]
    },
    {
      icon: RouteIcon,
      title: "Intelligent Call Routing",
      description: "Automatically route calls to the right department or person based on caller intent.",
      benefits: [
        "Skills-based routing",
        "Priority queuing",
        "Time-based rules"
      ]
    },
    {
      icon: Globe,
      title: "Multi-Language Support",
      description: "Serve customers in over 50 languages with native-level fluency.",
      benefits: [
        "Auto-detect language",
        "Real-time translation",
        "Cultural adaptation"
      ]
    },
    {
      icon: BarChart3,
      title: "Advanced Analytics",
      description: "Get deep insights into call patterns, customer satisfaction, and agent performance.",
      benefits: [
        "Real-time dashboards",
        "Custom reports",
        "Predictive analytics"
      ]
    },
    {
      icon: Shield,
      title: "Enterprise Security",
      description: "Bank-level encryption and compliance with industry standards.",
      benefits: [
        "End-to-end encryption",
        "GDPR compliant",
        "SOC 2 certified"
      ]
    },
    {
      icon: Zap,
      title: "Instant Setup",
      description: "Get started in minutes with our easy setup process and pre-built templates.",
      benefits: [
        "No hardware required",
        "Cloud-based solution",
        "Pre-configured workflows"
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center">
              <Phone className="h-8 w-8 text-indigo-600" />
              <span className="ml-2 text-xl font-bold text-slate-900">VoiceAI</span>
            </Link>
            <div className="flex items-center space-x-8">
              <Link to="/features" className="text-slate-600 hover:text-slate-900">Features</Link>
              <Link to="/pricing" className="text-slate-600 hover:text-slate-900">Pricing</Link>
              <Link to="/login" className="text-slate-600 hover:text-slate-900">Login</Link>
              <Link to="/signup" className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition">
                Start Free Trial
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h1 className="text-4xl font-bold text-slate-900 mb-4">
              Everything You Need for Smart Voice Reception
            </h1>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Powerful features designed to transform your customer communication 
              and streamline your business operations.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
            {features.map((feature, index) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
                <div className="h-12 w-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-indigo-600" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-3">{feature.title}</h3>
                <p className="text-slate-600 mb-4">{feature.description}</p>
                <ul className="space-y-2">
                  {feature.benefits.map((benefit, idx) => (
                    <li key={idx} className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="ml-2 text-sm text-slate-700">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-3xl p-12 text-white">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold mb-6">
                  See VoiceAI in Action
                </h2>
                <p className="text-xl text-indigo-100 mb-8">
                  Experience how our AI receptionist can transform your business communication. 
                  Get a personalized demo tailored to your needs.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link to="/signup" className="inline-flex items-center justify-center px-6 py-3 bg-white text-indigo-600 font-medium rounded-lg hover:bg-indigo-50 transition">
                    Start Free Trial
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                  <button className="inline-flex items-center justify-center px-6 py-3 border-2 border-white text-white font-medium rounded-lg hover:bg-white/10 transition">
                    Schedule Demo
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-white/10 backdrop-blur rounded-xl p-6">
                  <div className="text-3xl font-bold mb-2">98%</div>
                  <div className="text-indigo-100">Customer Satisfaction</div>
                </div>
                <div className="bg-white/10 backdrop-blur rounded-xl p-6">
                  <div className="text-3xl font-bold mb-2">60%</div>
                  <div className="text-indigo-100">Reduced Wait Time</div>
                </div>
                <div className="bg-white/10 backdrop-blur rounded-xl p-6">
                  <div className="text-3xl font-bold mb-2">24/7</div>
                  <div className="text-indigo-100">Always Available</div>
                </div>
                <div className="bg-white/10 backdrop-blur rounded-xl p-6">
                  <div className="text-3xl font-bold mb-2">50+</div>
                  <div className="text-indigo-100">Languages Supported</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}