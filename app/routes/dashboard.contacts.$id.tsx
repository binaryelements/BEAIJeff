import { useLoaderData, Link, useNavigate, useFetcher } from "react-router";
import type { Route } from "./+types/dashboard.contacts.$id";
import { ArrowLeft, Phone, Mail, Building, Calendar, Star, Ban, Edit, Trash2, PhoneCall } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from 'react';
import { cn } from "~/lib/utils";
import { getAuthHeaders } from '~/lib/auth';
import { ContactForm } from '~/components/ContactForm';
import { DeleteContactDialog } from '~/components/DeleteContactDialog';

interface Contact {
  id: number;
  name: string;
  phoneNumber: string;
  email: string | null;
  companyName: string | null;
  department: string | null;
  role: string | null;
  preferredContactMethod: string | null;
  notes: string | null;
  tags: string[];
  customFields: Record<string, any>;
  lastContactedAt: string | null;
  totalCalls: number;
  averageCallDuration: number;
  isVip: boolean;
  isBlocked: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Call {
  id: number;
  callSid: string;
  phoneNumber: string;
  status: string;
  department: string | null;
  conversationSummary: string | null;
  startedAt: string;
  duration: number | null;
}

export async function loader({ params }: Route.LoaderArgs) {
  const { id } = params;
  
  try {
    // Fetch contact details with auth
    const contactResponse = await fetch(`http://private-api:3000/api/contacts/${id}`, {
      headers: getAuthHeaders()
    });
    if (!contactResponse.ok) {
      throw new Error('Contact not found');
    }
    const contact = await contactResponse.json();
    
    // Fetch contact's call history with auth
    const callsResponse = await fetch(`http://private-api:3000/api/contacts/${id}/calls`, {
      headers: getAuthHeaders()
    });
    const calls = callsResponse.ok ? await callsResponse.json() : [];
    
    return { contact, calls };
  } catch (error) {
    console.error('Error loading contact:', error);
    throw new Response("Contact not found", { status: 404 });
  }
}

export async function action({ request, params }: Route.ActionArgs) {
  const { id } = params;
  const formData = await request.formData();
  const action = formData.get('_action');
  
  try {
    if (action === 'update') {
      const data = JSON.parse(formData.get('data') as string);
      const response = await fetch(`http://private-api:3000/api/contacts/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update contact');
      }
      
      return { success: true };
    }
    
    if (action === 'delete') {
      const response = await fetch(`http://private-api:3000/api/contacts/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete contact');
      }
      
      // Redirect to contacts list after successful deletion
      return new Response(null, {
        status: 302,
        headers: {
          Location: '/dashboard/contacts'
        }
      });
    }
  } catch (error) {
    console.error('Action error:', error);
    return { error: error instanceof Error ? error.message : 'An error occurred' };
  }
  
  return null;
}

export default function ContactDetails() {
  const { contact, calls } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const fetcher = useFetcher();
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateString));
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '-';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/dashboard/contacts')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-4 w-4 text-gray-600" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{contact.name}</h1>
              {contact.isVip && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium">
                  <Star className="h-4 w-4" />
                  VIP
                </span>
              )}
              {contact.isBlocked && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
                  <Ban className="h-4 w-4" />
                  Blocked
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-1">Contact Details</p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <button 
            onClick={() => setShowEditForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Edit className="h-4 w-4" />
            Edit
          </button>
          <button 
            onClick={() => setShowDeleteDialog(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contact Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl border border-gray-200 shadow-sm p-6"
          >
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h2>
            
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Phone Number</p>
                  <p className="text-sm font-medium text-gray-900">{contact.phoneNumber}</p>
                </div>
              </div>
              
              {contact.email && (
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Email</p>
                    <p className="text-sm font-medium text-gray-900">{contact.email}</p>
                  </div>
                </div>
              )}
              
              {contact.companyName && (
                <div className="flex items-center gap-3">
                  <Building className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Company</p>
                    <p className="text-sm font-medium text-gray-900">{contact.companyName}</p>
                  </div>
                </div>
              )}
              
              {contact.department && (
                <div className="flex items-center gap-3">
                  <div className="h-4 w-4" />
                  <div>
                    <p className="text-xs text-gray-500">Department</p>
                    <p className="text-sm font-medium text-gray-900">{contact.department}</p>
                  </div>
                </div>
              )}
              
              {contact.role && (
                <div className="flex items-center gap-3">
                  <div className="h-4 w-4" />
                  <div>
                    <p className="text-xs text-gray-500">Role</p>
                    <p className="text-sm font-medium text-gray-900">{contact.role}</p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* Custom Fields */}
          {contact.customFields && Object.keys(contact.customFields).length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-xl border border-gray-200 shadow-sm p-6"
            >
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Additional Information</h2>
              
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(contact.customFields).map(([key, value]) => (
                  <div key={key}>
                    <p className="text-xs text-gray-500 capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </p>
                    <p className="text-sm font-medium text-gray-900">{String(value)}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Notes */}
          {contact.notes && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-xl border border-gray-200 shadow-sm p-6"
            >
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Notes</h2>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{contact.notes}</p>
            </motion.div>
          )}
        </div>

        {/* Stats Sidebar */}
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl border border-gray-200 shadow-sm p-6"
          >
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Statistics</h2>
            
            <div className="space-y-4">
              <div>
                <p className="text-xs text-gray-500">Total Calls</p>
                <p className="text-2xl font-bold text-gray-900">{contact.totalCalls}</p>
              </div>
              
              <div>
                <p className="text-xs text-gray-500">Average Call Duration</p>
                <p className="text-lg font-semibold text-gray-900">
                  {formatDuration(contact.averageCallDuration)}
                </p>
              </div>
              
              <div>
                <p className="text-xs text-gray-500">Last Contacted</p>
                <p className="text-sm font-medium text-gray-900">
                  {formatDate(contact.lastContactedAt)}
                </p>
              </div>
              
              <div>
                <p className="text-xs text-gray-500">Contact Created</p>
                <p className="text-sm font-medium text-gray-900">
                  {formatDate(contact.createdAt)}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Tags */}
          {contact.tags && contact.tags.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-xl border border-gray-200 shadow-sm p-6"
            >
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Tags</h2>
              <div className="flex flex-wrap gap-2">
                {contact.tags.map((tag: string) => (
                  <span
                    key={tag}
                    className="inline-flex px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Call History */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-xl border border-gray-200 shadow-sm"
      >
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Call History</h2>
        </div>
        
        {calls.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <PhoneCall className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No call history</p>
            <p className="text-sm text-gray-400 mt-1">Calls will appear here when this contact calls</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {calls.map((call: Call) => (
              <Link
                key={call.id}
                to={`/dashboard/calls/${call.callSid}`}
                className="block px-6 py-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-sm font-medium text-gray-900">
                        Call #{call.callSid.slice(0, 8)}...
                      </span>
                      <span className={cn(
                        "inline-flex px-2 py-0.5 rounded-full text-xs font-medium",
                        call.status === 'completed' && "bg-green-100 text-green-700",
                        call.status === 'in_progress' && "bg-blue-100 text-blue-700",
                        call.status === 'failed' && "bg-red-100 text-red-700",
                        !['completed', 'in_progress', 'failed'].includes(call.status) && "bg-gray-100 text-gray-700"
                      )}>
                        {call.status}
                      </span>
                      {call.department && (
                        <span className="text-xs text-gray-500">
                          → {call.department}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-1">
                      {call.conversationSummary || 'No summary available'}
                    </p>
                    <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                      <span>{formatDate(call.startedAt)}</span>
                      <span>Duration: {formatDuration(call.duration)}</span>
                    </div>
                  </div>
                  <PhoneCall className="h-4 w-4 text-gray-400" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </motion.div>

      {/* Contact Form Modal */}
      {showEditForm && (
        <ContactForm
          contact={contact}
          onSubmit={async (data) => {
            const formData = new FormData();
            formData.append('_action', 'update');
            formData.append('data', JSON.stringify(data));
            
            fetcher.submit(formData, { method: 'post' });
            setShowEditForm(false);
          }}
          onCancel={() => setShowEditForm(false)}
          isLoading={fetcher.state === 'submitting'}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && (
        <DeleteContactDialog
          contactName={contact.name}
          onConfirm={() => {
            const formData = new FormData();
            formData.append('_action', 'delete');
            
            fetcher.submit(formData, { method: 'post' });
            setShowDeleteDialog(false);
          }}
          onCancel={() => setShowDeleteDialog(false)}
          isDeleting={fetcher.state === 'submitting'}
        />
      )}
    </div>
  );
}