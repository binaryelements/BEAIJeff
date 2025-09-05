import type { Route } from "./+types/dashboard.calls.$id";
import { useLoaderData, Link, useNavigate } from "react-router";
import { 
  ArrowLeft,
  Phone, 
  Calendar,
  Clock,
  User,
  Building,
  Hash,
  FileText,
  Volume2,
  Download,
  MessageSquare,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  XCircle,
  Activity,
  Sparkles,
  ChevronRight
} from "lucide-react";
import { ApiClient } from "~/lib/api.server";
import { getSession } from "~/lib/session.server";
import { redirect } from "react-router";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "~/lib/utils";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Call Details - VoiceAI Dashboard" },
    { name: "description", content: "View detailed call information" },
  ];
}

export async function loader({ request, params }: Route.LoaderArgs) {
  const session = await getSession(request);
  
  if (!session.has("userId")) {
    return redirect("/login");
  }
  
  const { id } = params;
  
  try {
    // Fetch call details
    const call = await ApiClient.getCall(id!, request);
    
    // Try to fetch transcripts
    let transcripts = [];
    try {
      transcripts = await ApiClient.getCallTranscripts(call.callSid, request);
    } catch (error) {
      console.log("No transcripts available for this call");
    }
    
    return { call, transcripts, error: null };
  } catch (error: any) {
    console.error("Failed to fetch call details:", error);
    return { call: null, transcripts: [], error: error.error || "Failed to load call details" };
  }
}

export default function CallDetails() {
  const { call, transcripts, error } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"overview" | "transcript" | "events">("overview");

  if (error || !call) {
    return (
      <div>
        <motion.div 
          className="mb-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <Link to="/dashboard/calls" className="inline-flex items-center gap-1.5 text-xs text-gray-600 hover:text-gray-900 mb-3 group">
            <ArrowLeft className="h-3 w-3 group-hover:-translate-x-0.5 transition-transform" />
            Back to Calls
          </Link>
          <div className="p-3 bg-red-50/50 border border-red-200/50 rounded-md">
            <p className="text-xs text-red-600">{error || "Call not found"}</p>
          </div>
        </motion.div>
      </div>
    );
  }

  // Format duration from seconds to mm:ss
  const formatDuration = (seconds?: number) => {
    if (!seconds) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Format date and time
  const formatDateTime = (dateStr?: string | Date) => {
    if (!dateStr) return "Unknown";
    const date = new Date(dateStr);
    return date.toLocaleString('en-US', { 
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true 
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-3.5 w-3.5 text-green-500" />;
      case 'missed':
        return <XCircle className="h-3.5 w-3.5 text-red-500" />;
      case 'in_progress':
        return <AlertCircle className="h-3.5 w-3.5 text-yellow-500" />;
      default:
        return <AlertCircle className="h-3.5 w-3.5 text-gray-500" />;
    }
  };

  const getSentimentColor = (satisfied?: boolean | null) => {
    if (satisfied === true) return "text-green-600 bg-green-100";
    if (satisfied === false) return "text-red-600 bg-red-100";
    return "text-gray-600 bg-gray-100";
  };

  const getSentimentText = (satisfied?: boolean | null) => {
    if (satisfied === true) return "Positive";
    if (satisfied === false) return "Negative";
    return "Neutral";
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <motion.div 
        className="mb-4"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Link 
          to="/dashboard/calls" 
          className="inline-flex items-center gap-1.5 text-xs text-gray-600 hover:text-gray-900 mb-3 group"
        >
          <ArrowLeft className="h-3 w-3 group-hover:-translate-x-0.5 transition-transform" />
          Back to Calls
        </Link>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-medium text-gray-900">
              Call Details
            </h1>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: "spring" }}
            >
              {getStatusIcon(call.status || 'unknown')}
            </motion.div>
          </div>
          
          <motion.button 
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-md hover:shadow-md transition-all"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Download className="h-3.5 w-3.5" />
            Export
          </motion.button>
        </div>
        <p className="text-[10px] text-gray-500 mt-1">ID: {call.callSid}</p>
      </motion.div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        {[
          {
            icon: Phone,
            label: "Phone",
            value: call.phoneNumber || "Unknown",
            color: "from-blue-500 to-indigo-600"
          },
          {
            icon: Clock,
            label: "Duration",
            value: formatDuration(call.duration),
            color: "from-purple-500 to-pink-600"
          },
          {
            icon: Building,
            label: "Department",
            value: call.department || "General",
            color: "from-green-500 to-emerald-600"
          },
          {
            icon: TrendingUp,
            label: "Sentiment",
            value: getSentimentText(call.customerSatisfied),
            color: "from-orange-500 to-red-600",
            sentiment: call.customerSatisfied
          }
        ].map((metric, index) => (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2, delay: 0.1 + index * 0.03 }}
            whileHover={{ scale: 1.02 }}
            className="relative bg-white rounded-lg border border-gray-100 p-3 overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-5 transition-opacity" 
                 className={cn("bg-gradient-to-br", metric.color)} />
            
            <div className="relative">
              <div className="flex items-center justify-between mb-2">
                <div className={cn(
                  "p-1 rounded bg-gradient-to-br",
                  metric.color,
                  "bg-opacity-10"
                )}>
                  <metric.icon className="h-3 w-3 text-gray-700" />
                </div>
                <span className="text-[10px] text-gray-500">{metric.label}</span>
              </div>
              
              {metric.sentiment !== undefined ? (
                <div className="flex items-center gap-1.5">
                  <div className={cn(
                    "h-1.5 w-1.5 rounded-full",
                    metric.sentiment === true ? "bg-green-500" :
                    metric.sentiment === false ? "bg-red-500" :
                    "bg-yellow-500"
                  )} />
                  <span className="text-xs font-medium text-gray-900">{metric.value}</span>
                </div>
              ) : (
                <p className="text-xs font-medium text-gray-900 truncate">{metric.value}</p>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Tabs */}
      <motion.div 
        className="bg-white rounded-lg border border-gray-100 flex-1 flex flex-col min-h-0"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <div className="border-b border-gray-100 flex-shrink-0">
          <nav className="flex gap-6 px-4" aria-label="Tabs">
            {[
              { id: "overview", label: "Overview", icon: FileText },
              { id: "transcript", label: `Transcript${transcripts.length > 0 ? ` (${transcripts.length})` : ''}`, icon: MessageSquare },
              { id: "events", label: "Events", icon: Activity }
            ].map((tab) => (
              <motion.button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "relative py-3 px-1 text-xs font-medium transition-colors",
                  activeTab === tab.id
                    ? "text-indigo-600"
                    : "text-gray-500 hover:text-gray-700"
                )}
                whileHover={{ y: -1 }}
                whileTap={{ y: 0 }}
              >
                <div className="flex items-center gap-1.5">
                  <tab.icon className="h-3 w-3" />
                  {tab.label}
                </div>
                {activeTab === tab.id && (
                  <motion.div
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-500 to-purple-600"
                    layoutId="activeTab"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
              </motion.button>
            ))}
          </nav>
        </div>

        <div className="p-4 flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
          {activeTab === "overview" && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
              className="h-full overflow-y-auto"
            >
              <div className="space-y-4">
                {/* Call Information */}
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
                    <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
                    Call Information
                  </h3>
                  <dl className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-gray-50/50 rounded-md p-2.5">
                      <dt className="text-[10px] font-medium text-gray-500">Started At</dt>
                      <dd className="mt-0.5 text-xs text-gray-900">{formatDateTime(call.startedAt)}</dd>
                    </div>
                    <div className="bg-gray-50/50 rounded-md p-2.5">
                      <dt className="text-[10px] font-medium text-gray-500">Ended At</dt>
                      <dd className="mt-0.5 text-xs text-gray-900">{call.endedAt ? formatDateTime(call.endedAt) : "N/A"}</dd>
                    </div>
                    <div className="bg-gray-50/50 rounded-md p-2.5">
                      <dt className="text-[10px] font-medium text-gray-500">Called Number</dt>
                      <dd className="mt-0.5 text-xs text-gray-900">{call.calledNumber || "N/A"}</dd>
                    </div>
                    <div className="bg-gray-50/50 rounded-md p-2.5">
                      <dt className="text-[10px] font-medium text-gray-500">Transfer Reason</dt>
                      <dd className="mt-0.5 text-xs text-gray-900">{call.transferReason || "N/A"}</dd>
                    </div>
                    <div className="bg-gray-50/50 rounded-md p-2.5">
                      <dt className="text-[10px] font-medium text-gray-500">Resolution</dt>
                      <dd className="mt-0.5 text-xs text-gray-900">{call.resolution || "N/A"}</dd>
                    </div>
                    <div className="bg-gray-50/50 rounded-md p-2.5">
                      <dt className="text-[10px] font-medium text-gray-500">Status</dt>
                      <dd className="mt-0.5">
                        <span className={cn(
                          "inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium",
                          call.status === 'completed' ? 'bg-green-50 text-green-700' :
                          call.status === 'missed' ? 'bg-red-50 text-red-700' :
                          call.status === 'in_progress' ? 'bg-yellow-50 text-yellow-700' :
                          'bg-gray-50 text-gray-700'
                        )}>
                          {call.status}
                        </span>
                      </dd>
                    </div>
                    {call.contactId && (
                      <div className="bg-gray-50/50 rounded-md p-2.5">
                        <dt className="text-[10px] font-medium text-gray-500">Contact</dt>
                        <dd className="mt-0.5">
                          <Link 
                            to={`/dashboard/contacts/${call.contactId}`}
                            className="text-xs text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                          >
                            View Contact
                            <ChevronRight className="h-3 w-3" />
                          </Link>
                        </dd>
                      </div>
                    )}
                </dl>
              </div>

                {/* Collected Data */}
                {call.collectedData && Object.keys(call.collectedData).length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <h3 className="text-sm font-medium text-gray-900 mb-2 flex items-center gap-2">
                      <User className="h-3.5 w-3.5 text-blue-500" />
                      Collected Information
                    </h3>
                    <div className="bg-gradient-to-br from-blue-50/50 to-cyan-50/50 rounded-md p-3 border border-blue-100/50">
                      <dl className="grid grid-cols-2 gap-2">
                        {call.collectedData.callerName && (
                          <div>
                            <dt className="text-[10px] font-medium text-gray-500">Caller Name</dt>
                            <dd className="text-xs text-gray-900">{call.collectedData.callerName}</dd>
                          </div>
                        )}
                        {call.collectedData.companyName && (
                          <div>
                            <dt className="text-[10px] font-medium text-gray-500">Company</dt>
                            <dd className="text-xs text-gray-900">{call.collectedData.companyName}</dd>
                          </div>
                        )}
                        {call.collectedData.contactNumber && (
                          <div>
                            <dt className="text-[10px] font-medium text-gray-500">Contact Number</dt>
                            <dd className="text-xs text-gray-900">{call.collectedData.contactNumber}</dd>
                          </div>
                        )}
                        {call.collectedData.email && (
                          <div>
                            <dt className="text-[10px] font-medium text-gray-500">Email</dt>
                            <dd className="text-xs text-gray-900">{call.collectedData.email}</dd>
                          </div>
                        )}
                        {call.collectedData.reasonForCalling && (
                          <div className="col-span-2">
                            <dt className="text-[10px] font-medium text-gray-500">Reason for Calling</dt>
                            <dd className="text-xs text-gray-900">{call.collectedData.reasonForCalling}</dd>
                          </div>
                        )}
                        {call.collectedData.customFields && Object.entries(call.collectedData.customFields).map(([key, value]) => (
                          <div key={key}>
                            <dt className="text-[10px] font-medium text-gray-500 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</dt>
                            <dd className="text-xs text-gray-900">{String(value)}</dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                  </motion.div>
                )}

                {/* Conversation Summary */}
                {call.conversationSummary && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                  >
                    <h3 className="text-sm font-medium text-gray-900 mb-2 flex items-center gap-2">
                      <MessageSquare className="h-3.5 w-3.5 text-purple-500" />
                      Summary
                    </h3>
                    <div className="bg-gradient-to-br from-purple-50/50 to-pink-50/50 rounded-md p-3 border border-purple-100/50">
                      <p className="text-xs text-gray-700 leading-relaxed">{call.conversationSummary}</p>
                    </div>
                  </motion.div>
                )}

                {/* Metadata */}
                {call.metadata && Object.keys(call.metadata).length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <h3 className="text-sm font-medium text-gray-900 mb-2 flex items-center gap-2">
                      <Hash className="h-3.5 w-3.5 text-green-500" />
                      Additional Info
                    </h3>
                    <dl className="grid grid-cols-2 gap-2">
                      {Object.entries(call.metadata).map(([key, value], idx) => (
                        <motion.div 
                          key={key}
                          className="bg-gray-50/50 rounded-md p-2"
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.2 + idx * 0.02 }}
                        >
                          <dt className="text-[10px] font-medium text-gray-500 capitalize">{key.replace(/_/g, ' ')}</dt>
                          <dd className="mt-0.5 text-xs text-gray-900 truncate">{String(value)}</dd>
                        </motion.div>
                      ))}
                    </dl>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === "transcript" && (
            <motion.div
              key="transcript"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
              className="h-full flex flex-col"
            >
              {transcripts.length > 0 ? (
                <div className="space-y-2 flex-1 overflow-y-auto pr-2">
                  {transcripts.map((transcript: any, index: number) => (
                    <motion.div
                      key={transcript.id || index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.02 }}
                      className={`flex gap-2 ${
                        transcript.role === 'assistant' ? 'justify-start' : 'justify-end'
                      }`}
                    >
                      <div
                        className={cn(
                          "max-w-[70%] px-3 py-2 rounded-lg",
                          transcript.role === 'assistant'
                            ? 'bg-gray-100 text-gray-900'
                            : 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white'
                        )}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <div className={cn(
                            "h-1.5 w-1.5 rounded-full",
                            transcript.role === 'assistant' ? 'bg-gray-400' : 'bg-white/70'
                          )} />
                          <span className="text-[10px] font-medium">
                            {transcript.role === 'assistant' ? 'AI' : 'Caller'}
                          </span>
                          <span className="text-[10px] opacity-60">
                            {new Date(transcript.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-xs leading-relaxed">{transcript.text}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <MessageSquare className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-xs text-gray-500">No transcript available</p>
                  <p className="text-[10px] text-gray-400 mt-1">Transcripts will appear here when available</p>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === "events" && (
            <motion.div
              key="events"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
              className="h-full flex items-center justify-center"
            >
              <div className="text-center">
                <Activity className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                <p className="text-xs text-gray-500">No events recorded</p>
                <p className="text-[10px] text-gray-400 mt-1">Call events will appear here when available</p>
              </div>
            </motion.div>
          )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}