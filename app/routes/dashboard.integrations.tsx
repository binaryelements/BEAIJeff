import type { Route } from "./+types/dashboard.integrations";
import { 
  Plug,
  CheckCircle,
  XCircle,
  Settings,
  ExternalLink,
  Plus
} from "lucide-react";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Integrations - VoiceAI Dashboard" },
    { name: "description", content: "Manage third-party integrations" },
  ];
}

export default function Integrations() {
  const integrations = [
    {
      id: 1,
      name: "Salesforce",
      description: "Sync calls and contacts with Salesforce CRM",
      category: "CRM",
      status: "connected",
      logo: "SF",
      color: "bg-blue-500"
    },
    {
      id: 2,
      name: "Slack",
      description: "Send call notifications to Slack channels",
      category: "Communication",
      status: "connected",
      logo: "SL",
      color: "bg-purple-500"
    },
    {
      id: 3,
      name: "HubSpot",
      description: "Track calls in HubSpot CRM",
      category: "CRM",
      status: "disconnected",
      logo: "HS",
      color: "bg-orange-500"
    },
    {
      id: 4,
      name: "Microsoft Teams",
      description: "Integrate with Teams calling",
      category: "Communication",
      status: "disconnected",
      logo: "MT",
      color: "bg-indigo-500"
    },
    {
      id: 5,
      name: "Zapier",
      description: "Connect with 5000+ apps via Zapier",
      category: "Automation",
      status: "connected",
      logo: "ZP",
      color: "bg-orange-600"
    },
    {
      id: 6,
      name: "Google Calendar",
      description: "Sync call schedules with Google Calendar",
      category: "Productivity",
      status: "disconnected",
      logo: "GC",
      color: "bg-green-500"
    },
  ];

  const categories = ["All", "CRM", "Communication", "Automation", "Productivity"];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Integrations</h1>
        <p className="text-slate-600 mt-1">Connect VoiceAI with your favorite tools and services.</p>
      </div>

      <div className="flex gap-2 mb-8">
        {categories.map((category) => (
          <button
            key={category}
            className="px-4 py-2 text-sm border border-slate-300 rounded-lg hover:bg-slate-50 transition"
          >
            {category}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {integrations.map((integration) => (
          <div key={integration.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`h-12 w-12 ${integration.color} rounded-lg flex items-center justify-center text-white font-bold`}>
                  {integration.logo}
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">{integration.name}</h3>
                  <span className="text-xs text-slate-500">{integration.category}</span>
                </div>
              </div>
              {integration.status === 'connected' ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-slate-400" />
              )}
            </div>
            
            <p className="text-sm text-slate-600 mb-4">{integration.description}</p>
            
            <div className="flex items-center gap-2">
              {integration.status === 'connected' ? (
                <>
                  <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition">
                    <Settings className="h-4 w-4" />
                    Configure
                  </button>
                  <button className="px-3 py-2 text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition">
                    Disconnect
                  </button>
                </>
              ) : (
                <button className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition">
                  <Plus className="h-4 w-4" />
                  Connect
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-8 text-center">
        <h2 className="text-xl font-semibold text-slate-900 mb-2">Can't find what you're looking for?</h2>
        <p className="text-slate-600 mb-6">Request a new integration or build your own with our API</p>
        <div className="flex justify-center gap-4">
          <button className="px-6 py-2 bg-white text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 transition">
            Request Integration
          </button>
          <button className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition">
            View API Docs
            <ExternalLink className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}