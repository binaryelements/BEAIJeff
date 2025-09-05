import type { Route } from "./+types/dashboard.routing";
import { useState } from "react";
import { 
  Route as RouteIcon,
  Plus,
  Settings,
  Clock,
  Users,
  Phone,
  MessageSquare,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  Edit,
  Trash2,
  ToggleLeft,
  ToggleRight
} from "lucide-react";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Call Routing - VoiceAI Dashboard" },
    { name: "description", content: "Configure intelligent call routing rules" },
  ];
}

export default function Routing() {
  const [activeTab, setActiveTab] = useState("rules");

  const routingRules = [
    {
      id: 1,
      name: "Business Hours - Sales",
      description: "Route sales inquiries during business hours",
      conditions: ["9:00 AM - 6:00 PM", "Monday - Friday", "Contains: pricing, demo, trial"],
      destination: "Sales Department",
      priority: "High",
      enabled: true,
      calls: 234
    },
    {
      id: 2,
      name: "After Hours - Voicemail",
      description: "Send to voicemail outside business hours",
      conditions: ["6:00 PM - 9:00 AM", "Weekends"],
      destination: "Voicemail",
      priority: "Low",
      enabled: true,
      calls: 89
    },
    {
      id: 3,
      name: "VIP Customers",
      description: "Priority routing for enterprise clients",
      conditions: ["VIP List", "Enterprise Tag"],
      destination: "Account Manager",
      priority: "Urgent",
      enabled: true,
      calls: 45
    },
    {
      id: 4,
      name: "Technical Support",
      description: "Route technical issues to support team",
      conditions: ["Contains: bug, error, technical, API"],
      destination: "Technical Support",
      priority: "High",
      enabled: true,
      calls: 156
    },
    {
      id: 5,
      name: "Language Preference - Spanish",
      description: "Route Spanish speakers to bilingual agents",
      conditions: ["Language: Spanish"],
      destination: "Spanish Support Team",
      priority: "Normal",
      enabled: false,
      calls: 23
    },
  ];

  const greetings = [
    {
      id: 1,
      name: "Default Greeting",
      type: "Business Hours",
      message: "Thank you for calling VoiceAI. How may I direct your call today?",
      voice: "Professional Female",
      active: true
    },
    {
      id: 2,
      name: "After Hours Message",
      type: "After Hours",
      message: "Thank you for calling VoiceAI. Our office is currently closed. Please leave a message or call back during business hours.",
      voice: "Professional Male",
      active: true
    },
    {
      id: 3,
      name: "Holiday Greeting",
      type: "Holiday",
      message: "Happy holidays from VoiceAI! Our team is currently away. We'll return on January 2nd.",
      voice: "Friendly Female",
      active: false
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Call Routing Configuration</h1>
        <p className="text-slate-600 mt-1">Set up intelligent routing rules and customize greetings.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 mb-6">
        <div className="border-b border-slate-200">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            <button
              onClick={() => setActiveTab("rules")}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition ${
                activeTab === "rules"
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
              }`}
            >
              Routing Rules
            </button>
            <button
              onClick={() => setActiveTab("greetings")}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition ${
                activeTab === "greetings"
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
              }`}
            >
              Greetings & Messages
            </button>
            <button
              onClick={() => setActiveTab("overflow")}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition ${
                activeTab === "overflow"
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
              }`}
            >
              Overflow Settings
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === "rules" && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <p className="text-sm text-slate-600">
                  Define rules to automatically route calls based on conditions
                </p>
                <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition">
                  <Plus className="h-4 w-4" />
                  Add Rule
                </button>
              </div>

              <div className="space-y-4">
                {routingRules.map((rule) => (
                  <div key={rule.id} className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-medium text-slate-900">{rule.name}</h3>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            rule.priority === 'Urgent' ? 'bg-red-100 text-red-800' :
                            rule.priority === 'High' ? 'bg-orange-100 text-orange-800' :
                            rule.priority === 'Normal' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {rule.priority}
                          </span>
                          {rule.enabled ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-slate-400" />
                          )}
                        </div>
                        <p className="text-sm text-slate-600 mb-3">{rule.description}</p>
                        
                        <div className="flex flex-wrap gap-2 mb-3">
                          {rule.conditions.map((condition, index) => (
                            <span key={index} className="inline-flex items-center px-2.5 py-1 bg-slate-100 text-slate-700 text-xs rounded-lg">
                              {condition}
                            </span>
                          ))}
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-1">
                            <ChevronRight className="h-4 w-4 text-slate-400" />
                            <span className="font-medium text-slate-700">{rule.destination}</span>
                          </div>
                          <div className="flex items-center gap-1 text-slate-500">
                            <Phone className="h-3 w-3" />
                            <span>{rule.calls} calls today</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 ml-4">
                        <button 
                          className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                          onClick={() => {}}
                        >
                          {rule.enabled ? (
                            <ToggleRight className="h-5 w-5 text-indigo-600" />
                          ) : (
                            <ToggleLeft className="h-5 w-5" />
                          )}
                        </button>
                        <button className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg">
                          <Edit className="h-4 w-4" />
                        </button>
                        <button className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "greetings" && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <p className="text-sm text-slate-600">
                  Customize greetings and messages for different scenarios
                </p>
                <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition">
                  <Plus className="h-4 w-4" />
                  Add Greeting
                </button>
              </div>

              <div className="space-y-4">
                {greetings.map((greeting) => (
                  <div key={greeting.id} className="border border-slate-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-medium text-slate-900">{greeting.name}</h3>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                            {greeting.type}
                          </span>
                          {greeting.active && (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          )}
                        </div>
                        <p className="text-sm text-slate-600 mb-2 italic">"{greeting.message}"</p>
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                          <MessageSquare className="h-4 w-4" />
                          <span>Voice: {greeting.voice}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <button className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg">
                          <Edit className="h-4 w-4" />
                        </button>
                        <button className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "overflow" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-slate-900 mb-4">Overflow Mode Settings</h3>
                <p className="text-sm text-slate-600 mb-6">
                  Configure how calls are handled during high volume periods
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                  <div>
                    <p className="font-medium text-slate-900">Enable Overflow Mode</p>
                    <p className="text-sm text-slate-600">Automatically activate when queue exceeds threshold</p>
                  </div>
                  <button className="p-2">
                    <ToggleRight className="h-6 w-6 text-indigo-600" />
                  </button>
                </div>

                <div className="p-4 border border-slate-200 rounded-lg">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Queue Threshold
                  </label>
                  <input
                    type="number"
                    className="w-32 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none"
                    defaultValue="10"
                  />
                  <p className="text-xs text-slate-500 mt-1">Number of calls in queue to trigger overflow</p>
                </div>

                <div className="p-4 border border-slate-200 rounded-lg">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Wait Time Message
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none"
                    rows={3}
                    defaultValue="All of our agents are currently busy. Your estimated wait time is approximately [WAIT_TIME]. Please hold or press 1 to leave a callback number."
                  />
                </div>

                <div className="p-4 border border-slate-200 rounded-lg">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Callback Option
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input type="checkbox" className="h-4 w-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500" defaultChecked />
                      <span className="ml-2 text-sm text-slate-700">Offer callback when wait time exceeds 5 minutes</span>
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" className="h-4 w-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500" defaultChecked />
                      <span className="ml-2 text-sm text-slate-700">Send SMS confirmation for callbacks</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}