import { useLoaderData, Link, useFetcher } from "react-router";
import type { Route } from "./+types/dashboard.callbacks";
import { Calendar, Clock, Phone, User, CheckCircle, AlertCircle, XCircle, ArrowRight, MoreVertical, PhoneCall, Ban } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "~/lib/utils";
import { useState } from "react";

interface Callback {
  id: number;
  callbackId: string;
  phoneNumber: string;
  preferredTime: string;
  topic: string;
  status: 'pending' | 'scheduled' | 'completed' | 'cancelled';
  createdAt: string;
  scheduledFor: string | null;
  completedAt: string | null;
  callSid: string | null;
}

export async function loader({ request }: Route.LoaderArgs) {
  try {
    const response = await fetch('http://private-api:3000/api/callbacks');
    if (!response.ok) {
      throw new Error('Failed to fetch callbacks');
    }
    const callbacks = await response.json();
    return { callbacks };
  } catch (error) {
    console.error('Error loading callbacks:', error);
    return { callbacks: [] };
  }
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const intent = formData.get('intent');
  const callbackId = formData.get('callbackId');
  
  if (intent === 'updateStatus') {
    const status = formData.get('status');
    try {
      const response = await fetch(`http://private-api:3000/api/callbacks/${callbackId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update callback status');
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error updating callback:', error);
      return { error: 'Failed to update callback status' };
    }
  }
  
  if (intent === 'schedule') {
    const scheduledFor = formData.get('scheduledFor');
    try {
      const response = await fetch(`http://private-api:3000/api/callbacks/${callbackId}/schedule`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scheduledFor }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to schedule callback');
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error scheduling callback:', error);
      return { error: 'Failed to schedule callback' };
    }
  }
  
  return null;
}

export default function Callbacks() {
  const { callbacks } = useLoaderData<typeof loader>();
  const fetcher = useFetcher();
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'scheduled':
        return <Calendar className="h-4 w-4 text-blue-500" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      scheduled: 'bg-blue-50 text-blue-700 border-blue-200',
      completed: 'bg-green-50 text-green-700 border-green-200',
      cancelled: 'bg-red-50 text-red-700 border-red-200',
    };
    
    return (
      <span className={cn(
        "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border",
        styles[status as keyof typeof styles] || 'bg-gray-50 text-gray-700 border-gray-200'
      )}>
        {getStatusIcon(status)}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const formatTime = (dateString: string | null) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const pendingCallbacks = callbacks.filter((cb: Callback) => cb.status === 'pending');
  const scheduledCallbacks = callbacks.filter((cb: Callback) => cb.status === 'scheduled');
  const completedCallbacks = callbacks.filter((cb: Callback) => cb.status === 'completed');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Callbacks</h1>
          <p className="text-sm text-gray-500 mt-1">Manage scheduled callbacks and follow-ups</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="h-5 w-5 text-yellow-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-500">Pending</p>
              <p className="text-2xl font-bold text-gray-900">{pendingCallbacks.length}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Calendar className="h-5 w-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-500">Scheduled</p>
              <p className="text-2xl font-bold text-gray-900">{scheduledCallbacks.length}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-500">Completed</p>
              <p className="text-2xl font-bold text-gray-900">{completedCallbacks.length}</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Callbacks List */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">All Callbacks</h2>
        </div>
        
        {callbacks.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No callbacks scheduled</p>
            <p className="text-sm text-gray-400 mt-1">Callbacks will appear here when scheduled during calls</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {callbacks.map((callback: Callback, index: number) => (
              <motion.div
                key={callback.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="px-6 py-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-2">
                      <span className="text-sm font-medium text-gray-900">
                        #{callback.callbackId}
                      </span>
                      {getStatusBadge(callback.status)}
                      {callback.callSid && (
                        <Link
                          to={`/dashboard/calls/${callback.callSid}`}
                          className="text-xs text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                        >
                          View Call
                          <ArrowRight className="h-3 w-3" />
                        </Link>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600">{callback.phoneNumber}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600">
                          {callback.preferredTime || formatTime(callback.scheduledFor)}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600 truncate">{callback.topic}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span>Created: {formatTime(callback.createdAt)}</span>
                      {callback.completedAt && (
                        <span>Completed: {formatTime(callback.completedAt)}</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="ml-4 relative">
                    <button 
                      onClick={() => setOpenDropdown(openDropdown === callback.callbackId ? null : callback.callbackId)}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>
                    
                    {openDropdown === callback.callbackId && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                        {callback.status === 'pending' && (
                          <>
                            <fetcher.Form method="post">
                              <input type="hidden" name="intent" value="updateStatus" />
                              <input type="hidden" name="callbackId" value={callback.callbackId} />
                              <input type="hidden" name="status" value="scheduled" />
                              <button
                                type="submit"
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                              >
                                <Calendar className="h-4 w-4" />
                                Mark as Scheduled
                              </button>
                            </fetcher.Form>
                            <fetcher.Form method="post">
                              <input type="hidden" name="intent" value="updateStatus" />
                              <input type="hidden" name="callbackId" value={callback.callbackId} />
                              <input type="hidden" name="status" value="cancelled" />
                              <button
                                type="submit"
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                              >
                                <Ban className="h-4 w-4" />
                                Cancel Callback
                              </button>
                            </fetcher.Form>
                          </>
                        )}
                        {callback.status === 'scheduled' && (
                          <>
                            <fetcher.Form method="post">
                              <input type="hidden" name="intent" value="updateStatus" />
                              <input type="hidden" name="callbackId" value={callback.callbackId} />
                              <input type="hidden" name="status" value="completed" />
                              <button
                                type="submit"
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                              >
                                <CheckCircle className="h-4 w-4" />
                                Mark as Completed
                              </button>
                            </fetcher.Form>
                            <button
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                            >
                              <PhoneCall className="h-4 w-4" />
                              Initiate Call
                            </button>
                          </>
                        )}
                        {callback.callSid && (
                          <Link
                            to={`/dashboard/calls/${callback.callSid}`}
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                          >
                            <ArrowRight className="h-4 w-4" />
                            View Original Call
                          </Link>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}