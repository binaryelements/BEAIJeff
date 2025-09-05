import type { Route } from "./+types/dashboard.analytics";
import { useLoaderData } from "react-router";
import { 
  BarChart3,
  TrendingUp,
  Download,
  Calendar,
  Filter
} from "lucide-react";
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { ApiClient } from "~/lib/api.server";
import { getSession } from "~/lib/session.server";
import { redirect } from "react-router";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Analytics - VoiceAI Dashboard" },
    { name: "description", content: "Call analytics and insights" },
  ];
}

export async function loader({ request }: Route.LoaderArgs) {
  const session = await getSession(request);
  
  if (!session.has("userId")) {
    return redirect("/login");
  }
  
  const params = new URLSearchParams();
  
  // Get stats for last 30 days
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);
  
  params.set("startDate", startDate.toISOString());
  params.set("endDate", endDate.toISOString());
  
  try {
    const stats = await ApiClient.getCallStats(params, request);
    return { stats, error: null };
  } catch (error: any) {
    console.error("Failed to fetch stats:", error);
    return { 
      stats: {
        totalCalls: 0,
        completedCalls: 0,
        inProgressCalls: 0,
        transferredCalls: 0,
        satisfiedCustomers: 0,
        averageDuration: 0,
        departmentBreakdown: {
          sales: 0,
          support: 0,
          billing: 0,
          technical: 0
        }
      }, 
      error: error.error || "Failed to load analytics" 
    };
  }
}

export default function Analytics() {
  const { stats, error } = useLoaderData<typeof loader>();
  const performanceData = [
    { month: "Jan", calls: 4890, resolved: 4652, satisfaction: 92 },
    { month: "Feb", calls: 5200, resolved: 4988, satisfaction: 94 },
    { month: "Mar", calls: 5890, resolved: 5712, satisfaction: 95 },
    { month: "Apr", calls: 6234, resolved: 6078, satisfaction: 96 },
    { month: "May", calls: 6890, resolved: 6756, satisfaction: 97 },
    { month: "Jun", calls: 7234, resolved: 7125, satisfaction: 98 },
  ];

  const departmentPerformance = [
    { department: "Sales", efficiency: 95, avgTime: "3:45" },
    { department: "Support", efficiency: 88, avgTime: "8:23" },
    { department: "Billing", efficiency: 92, avgTime: "5:12" },
    { department: "General", efficiency: 85, avgTime: "4:30" },
  ];

  const sentimentData = [
    { name: "Positive", value: 68, color: "#10b981" },
    { name: "Neutral", value: 24, color: "#6366f1" },
    { name: "Negative", value: 8, color: "#ef4444" },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Analytics & Reports</h1>
        <p className="text-slate-600 mt-1">Comprehensive insights into your call center performance.</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <button className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50">
          <Calendar className="h-4 w-4" />
          Last 30 Days
        </button>
        <button className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50">
          <Filter className="h-4 w-4" />
          All Departments
        </button>
        <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition ml-auto">
          <Download className="h-4 w-4" />
          Export Report
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-6">Call Volume Trend</h2>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={performanceData}>
              <defs>
                <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} />
              <Tooltip />
              <Area type="monotone" dataKey="calls" stroke="#6366f1" fillOpacity={1} fill="url(#colorVolume)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-6">Resolution Rate</h2>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} />
              <Tooltip />
              <Line type="monotone" dataKey="resolved" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981' }} />
              <Line type="monotone" dataKey="calls" stroke="#6366f1" strokeWidth={2} dot={{ fill: '#6366f1' }} strokeDasharray="5 5" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-6">Customer Sentiment</h2>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={sentimentData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
              >
                {sentimentData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-4">
            {sentimentData.map((item) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="h-3 w-3 rounded-full mr-2" style={{ backgroundColor: item.color }} />
                  <span className="text-sm text-slate-600">{item.name}</span>
                </div>
                <span className="text-sm font-medium text-slate-900">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-6">Department Performance</h2>
          <div className="space-y-4">
            {departmentPerformance.map((dept) => (
              <div key={dept.department} className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-900">{dept.department}</span>
                    <span className="text-sm text-slate-600">Avg: {dept.avgTime}</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                      style={{ width: `${dept.efficiency}%` }}
                    />
                  </div>
                </div>
                <span className="ml-4 text-sm font-medium text-slate-900">{dept.efficiency}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <TrendingUp className="h-8 w-8" />
          </div>
          <p className="text-3xl font-bold">98.2%</p>
          <p className="text-indigo-100 text-sm mt-1">Customer Satisfaction</p>
          <p className="text-xs text-indigo-200 mt-2">+2.1% from last month</p>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <BarChart3 className="h-8 w-8" />
          </div>
          <p className="text-3xl font-bold">4:23</p>
          <p className="text-green-100 text-sm mt-1">Avg Handle Time</p>
          <p className="text-xs text-green-200 mt-2">-18s from last month</p>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <TrendingUp className="h-8 w-8" />
          </div>
          <p className="text-3xl font-bold">87%</p>
          <p className="text-orange-100 text-sm mt-1">First Call Resolution</p>
          <p className="text-xs text-orange-200 mt-2">+5% from last month</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <BarChart3 className="h-8 w-8" />
          </div>
          <p className="text-3xl font-bold">42k</p>
          <p className="text-purple-100 text-sm mt-1">Total Calls</p>
          <p className="text-xs text-purple-200 mt-2">This month</p>
        </div>
      </div>
    </div>
  );
}