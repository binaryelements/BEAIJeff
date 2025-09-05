import type { Route } from "./+types/dashboard.calls";
import { useState, useEffect, useRef } from "react";
import { useLoaderData, Form, useNavigate, useSearchParams, Link } from "react-router";
import { 
  Phone, 
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  Download,
  Search,
  Calendar,
  MoreVertical,
  FileText,
  Volume2,
  Clock,
  TrendingUp,
  ChevronRight,
  Activity
} from "lucide-react";
import { ApiClient } from "~/lib/api.server";
import { getSession } from "~/lib/session.server";
import { redirect } from "react-router";
import { motion } from "framer-motion";
import { NumberTicker } from "~/components/ui/number-ticker";
import { cn } from "~/lib/utils";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Calls - VoiceAI Dashboard" },
    { name: "description", content: "Manage and review your calls" },
  ];
}

export async function loader({ request }: Route.LoaderArgs) {
  const session = await getSession(request);
  
  if (!session.has("userId")) {
    return redirect("/login");
  }
  
  const companyId = session.get("companyId");
  const url = new URL(request.url);
  const params = new URLSearchParams();
  
  // Filter by company for multi-tenancy
  params.set("companyId", companyId);
  
  if (url.searchParams.has("status")) {
    params.set("status", url.searchParams.get("status")!);
  }
  
  if (url.searchParams.has("startDate")) {
    params.set("startDate", url.searchParams.get("startDate")!);
  }
  
  if (url.searchParams.has("endDate")) {
    params.set("endDate", url.searchParams.get("endDate")!);
  }

  params.set("limit", "50");
  
  try {
    const calls = await ApiClient.getCalls(params, request);
    return { calls, error: null };
  } catch (error: any) {
    console.error("Failed to fetch calls:", error);
    return { calls: [], error: error.error || "Failed to load calls" };
  }
}

export default function Calls() {
  const { calls, error } = useLoaderData<typeof loader>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const filterStatus = searchParams.get("status") || "all";
  const [searchQuery, setSearchQuery] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const selectedDate = searchParams.get("startDate") || "";
  const datePickerRef = useRef<HTMLDivElement>(null);
  
  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];

  // Close date picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
        setShowDatePicker(false);
      }
    };

    if (showDatePicker) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showDatePicker]);

  // Format duration from seconds to mm:ss
  const formatDuration = (seconds?: number) => {
    if (!seconds) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Format date
  const formatDate = (dateStr?: string | Date) => {
    if (!dateStr) return "Unknown";
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString();
    }
  };

  // Format time
  const formatTime = (dateStr?: string | Date) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };


  // Map API calls to display format
  const allCalls = calls.map((call: any) => ({
    ...call,
    caller: call.phoneNumber || "Unknown",
    number: call.phoneNumber || call.calledNumber || "Unknown",
    agent: "AI Assistant",
    time: formatTime(call.startedAt),
    date: formatDate(call.startedAt),
    duration: formatDuration(call.duration),
    recording: false,
    transcript: false,
    sentiment: call.customerSatisfied ? "positive" : call.customerSatisfied === false ? "negative" : "neutral",
    summary: call.conversationSummary || "No summary available"
  }));

  // Search function to filter calls based on query
  const searchCalls = (calls: any[], query: string) => {
    if (!query.trim()) return calls;
    
    const searchTerm = query.toLowerCase();
    return calls.filter((call: any) => {
      return (
        call.caller?.toLowerCase().includes(searchTerm) ||
        call.number?.toLowerCase().includes(searchTerm) ||
        call.agent?.toLowerCase().includes(searchTerm) ||
        call.department?.toLowerCase().includes(searchTerm) ||
        call.summary?.toLowerCase().includes(searchTerm) ||
        call.status?.toLowerCase().includes(searchTerm)
      );
    });
  };

  // Apply both status filter and search filter
  const statusFilteredCalls = filterStatus === "all" 
    ? allCalls 
    : allCalls.filter((call: any) => call.status === filterStatus);

    const filteredCalls = searchCalls(statusFilteredCalls, searchQuery);

  const handleStatusFilter = (status: string) => {
    const params = new URLSearchParams(searchParams);
    if (status === "all") {
      params.delete("status");
    } else {
      params.set("status", status);
    }
    navigate(`/dashboard/calls?${params.toString()}`);
  };

  // Handle date filter
  const handleDateFilter = (date: string) => {
    const params = new URLSearchParams(searchParams);
    if (date) {
      // Set start date to selected date at 00:00:00
      params.set("startDate", `${date}T00:00:00.000Z`);
      // Set end date to selected date at 23:59:59
      params.set("endDate", `${date}T23:59:59.999Z`);
    } else {
      params.delete("startDate");
      params.delete("endDate");
    }
    navigate(`/dashboard/calls?${params.toString()}`);
    setShowDatePicker(false);
  };

  const clearDateFilter = () => {
    handleDateFilter("");
  };

  return (
    <div>
      <motion.div 
        className="mb-6"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-lg font-medium text-gray-900">Calls</h1>
        <p className="text-xs text-gray-500 mt-0.5">Manage and review your call history</p>
      </motion.div>

      {error && (
        <motion.div 
          className="mb-4 p-3 bg-red-50/50 border border-red-200/50 rounded-md"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <p className="text-xs text-red-600">{error}</p>
        </motion.div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          {
            name: "Total Calls",
            value: calls.length,
            icon: Phone,
            color: "from-blue-500 to-indigo-600",
            trend: "+12%"
          },
          {
            name: "Completed",
            value: calls.filter((c: any) => c.status === 'completed').length,
            icon: PhoneIncoming,
            color: "from-green-500 to-emerald-600",
            trend: "+8%"
          },
          {
            name: "Missed",
            value: calls.filter((c: any) => c.status === 'missed').length,
            icon: PhoneMissed,
            color: "from-red-500 to-rose-600",
            trend: "-5%"
          },
          {
            name: "Avg Duration",
            value: (() => {
              const durations = calls.filter((c: any) => c.duration).map((c: any) => c.duration);
              const avg = durations.length > 0 ? durations.reduce((a: number, b: number) => a + b, 0) / durations.length : 0;
              return formatDuration(Math.round(avg));
            })(),
            icon: Clock,
            color: "from-purple-500 to-pink-600",
            trend: "+2%",
            isTime: true
          }
        ].map((stat, index) => (
          <motion.div
            key={stat.name}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2, delay: index * 0.03 }}
            whileHover={{ scale: 1.02 }}
            className="relative bg-white rounded-lg border border-gray-100 p-4 overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-5 transition-opacity" 
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
                <span className={cn(
                  "text-[10px] font-medium",
                  stat.trend.startsWith('+') ? "text-green-600" : "text-red-600"
                )}>
                  {stat.trend}
                </span>
              </div>
              
              <div className="text-xl font-semibold text-gray-900">
                {!stat.isTime && typeof stat.value === 'number' ? (
                  <NumberTicker value={stat.value}/>
                ) : (
                  stat.value
                )}
              </div>
              <p className="text-[11px] text-gray-500 mt-0.5">{stat.name}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div 
        className="bg-white rounded-lg border border-gray-100"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <div className="px-4 py-3 border-b border-gray-100">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {/* Search bar - full width on mobile */}
            <div className="relative w-full sm:w-48 lg:w-96 xl:w-120">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                type="text"
                className="pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-md focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none w-full"
                placeholder="Search calls..."
              />
            </div>
            
            {/* Controls row */}
            <div className="flex items-center gap-2 sm:gap-2">
              <select 
                value={filterStatus}
                onChange={(e) => handleStatusFilter(e.target.value)}
                className="px-3 py-1.5 text-xs border border-gray-200 rounded-md focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none flex-1 sm:flex-none"
              >
                <option value="all">All Status</option>
                <option value="completed">Completed</option>
                <option value="in_progress">In Progress</option>
                <option value="missed">Missed</option>
                <option value="transferred">Transferred</option>
              </select>

              <div className="relative" ref={datePickerRef}>
                <button 
                  onClick={() => setShowDatePicker(!showDatePicker)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 text-xs border rounded-md transition-colors flex-1 sm:flex-none",
                    selectedDate 
                      ? "border-indigo-200 bg-indigo-50 text-indigo-700" 
                      : "border-gray-200 hover:bg-gray-50"
                  )}
                >
                  <Calendar className="h-3.5 w-3.5" />
                  <span>{selectedDate ? new Date(selectedDate).toLocaleDateString() : "Date"}</span>
                </button>
                
                {/* Date picker */}
                {showDatePicker && (
                  <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 p-3 min-w-[200px]">
                    <div className="mb-2">
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Select Date
                      </label>
                      <input
                        type="date"
                        max={today}
                        value={selectedDate ? selectedDate.split('T')[0] : ""}
                        onChange={(e) => handleDateFilter(e.target.value)}
                        className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                      />
                    </div>
                    
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => handleDateFilter(today)}
                        className="flex-1 px-2 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                      >
                        Today
                      </button>
                      <button
                        onClick={() => handleDateFilter(new Date(Date.now() - 24*60*60*1000).toISOString().split('T')[0])}
                        className="flex-1 px-2 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                      >
                        Yesterday
                      </button>
                    </div>
                    
                    {selectedDate && (
                      <button
                        onClick={clearDateFilter}
                        className="w-full mt-2 px-2 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded transition-colors"
                      >
                        Clear Filter
                      </button>
                    )}
                  </div>
                )}
              </div>

              <motion.button 
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-md hover:shadow-md transition-all flex-1 sm:flex-none"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Download className="h-3.5 w-3.5" />
                Export
              </motion.button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-4 py-2 text-[10px] font-medium text-gray-500 uppercase tracking-wider">Caller</th>
                <th className="text-left px-4 py-2 text-[10px] font-medium text-gray-500 uppercase tracking-wider">Dept</th>
                <th className="text-left px-4 py-2 text-[10px] font-medium text-gray-500 uppercase tracking-wider">Agent</th>
                <th className="text-left px-4 py-2 text-[10px] font-medium text-gray-500 uppercase tracking-wider">Time</th>
                <th className="text-left px-4 py-2 text-[10px] font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="text-left px-4 py-2 text-[10px] font-medium text-gray-500 uppercase tracking-wider">Mood</th>
                <th className="text-left px-4 py-2 text-[10px] font-medium text-gray-500 uppercase tracking-wider"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredCalls.length > 0 ? filteredCalls.map((call, index) => (
                <motion.tr 
                  key={call.id} 
                  className="hover:bg-gray-50/50 cursor-pointer group"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.02 }}
                  onClick={() => navigate(`/dashboard/calls/${call.id || call.callSid}`)}
                >
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-xs font-medium text-gray-900">{call.caller}</p>
                      <p className="text-[10px] text-gray-500">{call.number}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-gray-600">{call.department || 'General'}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-gray-600">{call.agent}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-xs text-gray-600">{call.duration}</p>
                      <p className="text-[10px] text-gray-400">{call.time}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      "inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium",
                      call.status === 'completed' ? 'bg-green-50 text-green-700' :
                      call.status === 'missed' ? 'bg-red-50 text-red-700' :
                      call.status === 'transferred' ? 'bg-blue-50 text-blue-700' :
                      'bg-gray-50 text-gray-700'
                    )}>
                      {call.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {call.sentiment && (
                      <div className="flex items-center gap-1">
                        <div className={cn(
                          "h-1.5 w-1.5 rounded-full",
                          call.sentiment === 'positive' ? 'bg-green-500' :
                          call.sentiment === 'negative' ? 'bg-red-500' :
                          'bg-yellow-500'
                        )} />
                        <span className="text-[10px] text-gray-600 capitalize">
                          {call.sentiment}
                        </span>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {call.recording && (
                        <motion.button 
                          className="p-1 text-gray-500 hover:bg-gray-100 rounded" 
                          title="Play Recording"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Volume2 className="h-3 w-3" />
                        </motion.button>
                      )}
                      {call.transcript && (
                        <motion.button 
                          className="p-1 text-gray-500 hover:bg-gray-100 rounded" 
                          title="View Transcript"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <FileText className="h-3 w-3" />
                        </motion.button>
                      )}
                      <ChevronRight className="h-3 w-3 text-gray-400" />
                    </div>
                  </td>
                </motion.tr>
              )) : (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <Activity className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-xs text-gray-500">
                      {searchQuery ? "No calls match your search" : "No calls found"}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-1">
                      {searchQuery ? "Try adjusting your search terms" : "Calls will appear here when they are logged"}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}