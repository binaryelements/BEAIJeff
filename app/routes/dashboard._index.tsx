import type { Route } from "./+types/dashboard._index";
import { useLoaderData } from "react-router";
import { 
  Phone, 
  TrendingUp, 
  Users, 
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Zap
} from "lucide-react";
import { motion } from "framer-motion";
import { ApiClient } from "~/lib/api.server";
import { getSession } from "~/lib/session.server";
import { redirect } from "react-router";
import { NumberTicker } from "~/components/ui/number-ticker";
import { cn } from "~/lib/utils";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Dashboard - VoiceAI" },
    { name: "description", content: "VoiceAI Dashboard" },
  ];
}

export async function loader({ request }: Route.LoaderArgs) {
  const session = await getSession(request);
  
  if (!session.has("userId")) {
    return redirect("/login");
  }
  
  const companyId = session.get("companyId");
  
  // Get today's stats
  const params = new URLSearchParams();
  params.set("companyId", companyId);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  params.set("startDate", today.toISOString());
  
  try {
    const [stats, recentCalls] = await Promise.all([
      ApiClient.getCallStats(params, request),
      ApiClient.getCalls(new URLSearchParams({ limit: "5", companyId }), request)
    ]);
    
    return { stats, recentCalls, error: null };
  } catch (error: any) {
    console.error("Failed to fetch dashboard data:", error);
    return { 
      stats: null,
      recentCalls: [],
      error: error.error || "Failed to load dashboard data" 
    };
  }
}

export default function Dashboard() {
  const { stats: apiStats, recentCalls, error } = useLoaderData<typeof loader>();
  
  const stats = [
    {
      name: "Total Calls",
      value: apiStats?.totalCalls || 0,
      displayValue: apiStats?.totalCalls?.toString() || "0",
      change: 12.5,
      icon: Phone,
      color: "from-blue-500 to-indigo-600",
    },
    {
      name: "Avg Duration",
      value: apiStats?.averageDuration || 0,
      displayValue: apiStats ? `${Math.floor(apiStats.averageDuration / 60)}:${(apiStats.averageDuration % 60).toString().padStart(2, '0')}` : "0:00",
      change: -23,
      icon: Clock,
      color: "from-purple-500 to-pink-600",
    },
    {
      name: "Success Rate",
      value: apiStats && apiStats.totalCalls > 0 
        ? Math.round((apiStats.completedCalls / apiStats.totalCalls) * 100)
        : 0,
      displayValue: apiStats && apiStats.totalCalls > 0 
        ? `${Math.round((apiStats.completedCalls / apiStats.totalCalls) * 100)}%` 
        : "0%",
      change: 2.1,
      icon: TrendingUp,
      color: "from-green-500 to-emerald-600",
    },
    {
      name: "Active Now",
      value: apiStats?.satisfiedCustomers || 0,
      displayValue: apiStats?.satisfiedCustomers?.toString() || "0",
      change: 3,
      icon: Activity,
      color: "from-orange-500 to-red-600",
    }
  ];

  // Format recent calls for activity display
  const recentActivity = recentCalls.slice(0, 5).map((call: any, index: number) => ({
    id: call.id || index,
    type: "call",
    description: `Call ${call.phoneNumber ? `from ${call.phoneNumber}` : ''}`,
    time: call.startedAt ? new Date(call.startedAt).toLocaleTimeString() : "Unknown",
    status: call.status || "completed",
    duration: call.duration
  }));

  return (
    <div className="">
      <motion.div 
        className="mb-6"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-lg font-medium text-gray-900">Overview</h1>
        <p className="text-xs text-gray-500 mt-0.5">Real-time performance metrics</p>
      </motion.div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.name}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2, delay: index * 0.03 }}
            whileHover={{ scale: 1.02 }}
            className="relative bg-white rounded-lg border border-gray-100 p-4 overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-5 transition-opacity" 
                 style={{ backgroundImage: `linear-gradient(135deg, var(--tw-gradient-stops))` }}
                 className={cn("bg-gradient-to-br", stat.color)} />
            
            <div className="relative">
              <div className="flex items-start justify-between mb-2">
                <div className={cn(
                  "p-1.5 rounded-md bg-gradient-to-br",
                  stat.color,
                  "bg-opacity-10"
                )}>
                  <stat.icon className="h-3.5 w-3.5 text-gray-700" />
                </div>
                <div className={cn(
                  "flex items-center text-[10px] font-medium",
                  stat.change > 0 ? "text-green-600" : "text-red-600"
                )}>
                  {stat.change > 0 ? (
                    <ArrowUpRight className="h-3 w-3" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3" />
                  )}
                  <span>{Math.abs(stat.change)}%</span>
                </div>
              </div>
              
              <div className="text-xl font-semibold text-gray-900">
                {typeof stat.value === 'number' && stat.name !== "Avg Duration" ? (
                  <NumberTicker value={stat.value} />
                ) : (
                  stat.displayValue
                )}
              </div>
              <p className="text-[11px] text-gray-500 mt-0.5">{stat.name}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
          className="lg:col-span-2 bg-white rounded-lg border border-gray-100 p-4"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-gray-900">Call Distribution</h2>
            <Zap className="h-3.5 w-3.5 text-gray-400" />
          </div>
          <div className="space-y-3">
            {apiStats?.departmentBreakdown && Object.entries(apiStats.departmentBreakdown).map(([dept, count], idx) => {
              const total = Object.values(apiStats.departmentBreakdown).reduce((a: any, b: any) => a + b, 0) as number;
              const percentage = total > 0 ? ((count as number) / total) * 100 : 0;
              const colors = [
                "from-blue-500 to-indigo-600",
                "from-purple-500 to-pink-600",
                "from-green-500 to-emerald-600",
                "from-orange-500 to-red-600"
              ];
              return (
                <motion.div 
                  key={dept}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + idx * 0.05 }}
                >
                  <div className="flex justify-between text-xs mb-1">
                    <span className="capitalize text-gray-700 font-medium">{dept}</span>
                    <span className="text-gray-500">{count as number}</span>
                  </div>
                  <div className="relative w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ duration: 0.6, delay: 0.3 + idx * 0.05, ease: "easeOut" }}
                      className={cn("h-1.5 rounded-full bg-gradient-to-r", colors[idx % colors.length])}
                    />
                  </div>
                </motion.div>
              );
            })}
            {!apiStats?.departmentBreakdown && (
              <div className="text-center py-8">
                <Activity className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                <p className="text-xs text-gray-500">No data available</p>
              </div>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="bg-white rounded-lg border border-gray-100 p-4"
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-gray-900">Live Activity</h2>
            <motion.div 
              className="h-2 w-2 bg-green-500 rounded-full"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
            />
          </div>
          <div className="space-y-2.5">
            {recentActivity.length > 0 ? recentActivity.map((activity, index) => (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, delay: 0.25 + index * 0.03 }}
                className="flex items-center gap-2 group cursor-pointer hover:bg-gray-50 p-1.5 -m-1.5 rounded-md transition-colors"
              >
                <motion.div 
                  className={cn(
                    "h-1.5 w-1.5 rounded-full flex-shrink-0",
                    activity.status === 'completed' ? 'bg-green-500' :
                    activity.status === 'missed' ? 'bg-red-500' :
                    'bg-blue-500'
                  )}
                  whileHover={{ scale: 1.5 }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-700 truncate group-hover:text-gray-900">
                    {activity.description}
                  </p>
                  <p className="text-[10px] text-gray-400">
                    {activity.time}
                    {activity.duration && ` • ${Math.floor(activity.duration / 60)}m`}
                  </p>
                </div>
              </motion.div>
            )) : (
              <div className="text-center py-8">
                <Phone className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                <p className="text-xs text-gray-500">No recent calls</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}