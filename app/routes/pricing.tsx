import type { Route } from "./+types/pricing";
import { Link } from "react-router";
import { 
  Phone,
  Check,
  X,
  ArrowRight,
  Zap,
  Building,
  Rocket
} from "lucide-react";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Pricing - VoiceAI" },
    { name: "description", content: "Simple, transparent pricing for businesses of all sizes" },
  ];
}

export default function Pricing() {
  const plans = [
    {
      name: "Starter",
      price: "$49",
      period: "per month",
      description: "Perfect for small businesses",
      icon: Zap,
      color: "from-blue-500 to-cyan-500",
      features: [
        { name: "Up to 500 calls/month", included: true },
        { name: "Basic call routing", included: true },
        { name: "Voicemail transcription", included: true },
        { name: "Email support", included: true },
        { name: "Basic analytics", included: true },
        { name: "2 team members", included: true },
        { name: "API access", included: false },
        { name: "Custom integrations", included: false },
        { name: "Priority support", included: false },
      ],
    },
    {
      name: "Professional",
      price: "$149",
      period: "per month",
      description: "For growing teams",
      icon: Building,
      color: "from-indigo-500 to-purple-500",
      popular: true,
      features: [
        { name: "Up to 2,500 calls/month", included: true },
        { name: "Advanced call routing", included: true },
        { name: "Voicemail transcription", included: true },
        { name: "Priority email support", included: true },
        { name: "Advanced analytics", included: true },
        { name: "10 team members", included: true },
        { name: "API access", included: true },
        { name: "5 integrations", included: true },
        { name: "Priority support", included: false },
      ],
    },
    {
      name: "Enterprise",
      price: "Custom",
      period: "contact sales",
      description: "For large organizations",
      icon: Rocket,
      color: "from-purple-500 to-pink-500",
      features: [
        { name: "Unlimited calls", included: true },
        { name: "Custom call routing", included: true },
        { name: "Voicemail transcription", included: true },
        { name: "24/7 phone support", included: true },
        { name: "Custom analytics", included: true },
        { name: "Unlimited team members", included: true },
        { name: "Full API access", included: true },
        { name: "Unlimited integrations", included: true },
        { name: "Dedicated account manager", included: true },
      ],
    },
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
              Simple, Transparent Pricing
            </h1>
            <p className="text-xl text-slate-600">
              Choose the perfect plan for your business. No hidden fees.
            </p>
            <div className="mt-8 inline-flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-full">
              <Check className="h-5 w-5 mr-2" />
              14-day free trial • No credit card required • Cancel anytime
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative bg-white rounded-2xl shadow-xl overflow-hidden ${
                  plan.popular ? 'ring-2 ring-indigo-600' : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute top-0 right-0 bg-indigo-600 text-white px-3 py-1 text-sm font-medium rounded-bl-lg">
                    Most Popular
                  </div>
                )}
                
                <div className={`h-2 bg-gradient-to-r ${plan.color}`} />
                
                <div className="p-8">
                  <div className="flex items-center justify-between mb-4">
                    <plan.icon className="h-10 w-10 text-indigo-600" />
                    <span className="text-lg font-semibold text-slate-900">{plan.name}</span>
                  </div>
                  
                  <div className="mb-4">
                    <span className="text-4xl font-bold text-slate-900">{plan.price}</span>
                    <span className="text-slate-600 ml-2">{plan.period}</span>
                  </div>
                  
                  <p className="text-slate-600 mb-6">{plan.description}</p>
                  
                  <Link
                    to="/signup"
                    className={`w-full flex items-center justify-center px-6 py-3 rounded-lg font-medium transition ${
                      plan.popular
                        ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    Get Started
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                  
                  <div className="mt-8 space-y-3">
                    <p className="text-sm font-medium text-slate-900 mb-4">Everything in {plan.name}:</p>
                    {plan.features.map((feature, index) => (
                      <div key={index} className="flex items-start">
                        {feature.included ? (
                          <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                        ) : (
                          <X className="h-5 w-5 text-slate-300 flex-shrink-0 mt-0.5" />
                        )}
                        <span className={`ml-3 text-sm ${
                          feature.included ? 'text-slate-700' : 'text-slate-400'
                        }`}>
                          {feature.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-16 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-8 text-center">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">
              Need a custom solution?
            </h2>
            <p className="text-slate-600 mb-6">
              We offer tailored plans for enterprises with specific requirements
            </p>
            <button className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition">
              Contact Sales
              <ArrowRight className="ml-2 h-5 w-5" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}