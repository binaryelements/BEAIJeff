import { useLoaderData, Link, Form, useFetcher } from "react-router";
import type { Route } from "./+types/dashboard.internal-contacts";
import { Users, Search, Phone, Mail, Building, Shield, PhoneForwarded, Plus, Filter, ChevronRight, Edit2, ToggleLeft, ToggleRight } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "~/lib/utils";
import { useState } from "react";
import { getCompanyId, getAuthHeaders } from '~/lib/auth';

interface InternalContact {
  id: number;
  name: string;
  phoneNumber: string;
  email: string | null;
  department: string | null;
  role: string | null;
  directExtension: string | null;
  isInternal: boolean;
  allowCallTransfer: boolean;
  totalCalls: number;
  lastContactedAt: string | null;
  createdAt: string;
}

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const allowCallTransfer = url.searchParams.get('allowCallTransfer');
  const companyId = getCompanyId(); // Get dynamic company ID
  
  try {
    let apiUrl = `http://private-api:3000/api/contacts/company/${companyId}/internal`;
    if (allowCallTransfer !== null) {
      apiUrl += `?allowCallTransfer=${allowCallTransfer}`;
    }
    
    const response = await fetch(apiUrl, {
      headers: getAuthHeaders()
    });
    if (!response.ok) {
      throw new Error('Failed to fetch internal contacts');
    }
    const contacts = await response.json();
    
    return { contacts, filterTransferable: allowCallTransfer };
  } catch (error) {
    console.error('Error loading internal contacts:', error);
    return { contacts: [], filterTransferable: null };
  }
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const contactId = formData.get('contactId');
  const field = formData.get('field');
  const value = formData.get('value');
  
  if (!contactId || !field) {
    return { error: 'Missing required fields' };
  }
  
  try {
    const updateData: any = {};
    updateData[field as string] = value === 'true';
    
    const response = await fetch(`http://private-api:3000/api/contacts/${contactId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData),
    });
    
    if (!response.ok) {
      throw new Error('Failed to update contact');
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error updating contact:', error);
    return { error: 'Failed to update contact' };
  }
}

export default function InternalContacts() {
  const { contacts, filterTransferable } = useLoaderData<typeof loader>();
  const fetcher = useFetcher();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredContacts = contacts.filter((contact: InternalContact) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      contact.name.toLowerCase().includes(query) ||
      contact.phoneNumber.includes(query) ||
      contact.email?.toLowerCase().includes(query) ||
      contact.department?.toLowerCase().includes(query) ||
      contact.directExtension?.includes(query)
    );
  });

  const formatTime = (dateString: string | null) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  const handleToggle = (contactId: number, field: string, currentValue: boolean) => {
    fetcher.submit(
      {
        contactId: contactId.toString(),
        field,
        value: (!currentValue).toString(),
      },
      { method: "post" }
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between sm:w-auto">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Internal Contacts</h1>
          <p className="text-sm text-gray-500 mt-1">Manage internal team members and their call transfer settings</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all duration-200 sm:w-auto">
          <Plus className="h-4 w-4" />
          Add Internal Contact
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search internal contacts..."
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <Link
              to={filterTransferable === 'true' ? '?' : '?allowCallTransfer=true'}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors text-sm",
                filterTransferable === 'true'
                  ? "bg-green-50 border-green-300 text-green-700"
                  : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
              )}
            >
              <PhoneForwarded className="h-4 w-4" />
              Call Transfer Allowed
            </Link>
            <Link
              to={filterTransferable === 'false' ? '?' : '?allowCallTransfer=false'}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors text-sm",
                filterTransferable === 'false'
                  ? "bg-red-50 border-red-300 text-red-700"
                  : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
              )}
            >
              <Shield className="h-4 w-4" />
              Direct Only
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-500">Total Internal</p>
              <p className="text-2xl font-bold text-gray-900">{contacts.length}</p>
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
            <div className="p-2 bg-green-100 rounded-lg">
              <PhoneForwarded className="h-5 w-5 text-green-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-500">Call Transfer Allowed</p>
              <p className="text-2xl font-bold text-gray-900">
                {contacts.filter((c: InternalContact) => c.allowCallTransfer).length}
              </p>
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
            <div className="p-2 bg-purple-100 rounded-lg">
              <Shield className="h-5 w-5 text-purple-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-500">Direct Only</p>
              <p className="text-2xl font-bold text-gray-900">
                {contacts.filter((c: InternalContact) => !c.allowCallTransfer).length}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Phone className="h-5 w-5 text-orange-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-500">Total Calls</p>
              <p className="text-2xl font-bold text-gray-900">
                {contacts.reduce((sum: number, c: InternalContact) => sum + c.totalCalls, 0)}
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Contacts List */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {filteredContacts.length} Internal Team Members
          </h2>
        </div>
        
        {filteredContacts.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No internal contacts found</p>
            <p className="text-sm text-gray-400 mt-1">
              {searchQuery ? 'Try adjusting your search' : 'Add internal team members to get started'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredContacts.map((contact: InternalContact, index: number) => (
              <motion.div
                key={contact.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: Math.min(index * 0.05, 0.3) }}
                className="px-6 py-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-sm font-semibold text-gray-900">
                        {contact.name}
                      </h3>
                      {contact.directExtension && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full text-xs font-medium">
                          Ext: {contact.directExtension}
                        </span>
                      )}
                      <span className={cn(
                        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
                        contact.allowCallTransfer
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-700"
                      )}>
                        {contact.allowCallTransfer ? (
                          <>
                            <PhoneForwarded className="h-3 w-3" />
                            Call Transfer Allowed
                          </>
                        ) : (
                          <>
                            <Shield className="h-3 w-3" />
                            Direct Only
                          </>
                        )}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                      <div className="flex items-center gap-2">
                        <Phone className="h-3.5 w-3.5 text-gray-400" />
                        <span className="text-gray-600">{contact.phoneNumber}</span>
                      </div>
                      
                      {contact.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-3.5 w-3.5 text-gray-400" />
                          <span className="text-gray-600 truncate">{contact.email}</span>
                        </div>
                      )}
                      
                      {contact.department && (
                        <div className="flex items-center gap-2">
                          <Building className="h-3.5 w-3.5 text-gray-400" />
                          <span className="text-gray-600">{contact.department}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span>{contact.totalCalls} calls</span>
                      <span>Last contact: {formatTime(contact.lastContactedAt)}</span>
                      {contact.role && <span>{contact.role}</span>}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 ml-4">
                    <button
                      onClick={() => handleToggle(contact.id, 'allowCallTransfer', contact.allowCallTransfer)}
                      className="group relative"
                      title={contact.allowCallTransfer ? "Disable call transfers" : "Enable call transfers"}
                    >
                      {contact.allowCallTransfer ? (
                        <ToggleRight className="h-8 w-8 text-green-600 group-hover:text-green-700 transition-colors" />
                      ) : (
                        <ToggleLeft className="h-8 w-8 text-gray-400 group-hover:text-gray-600 transition-colors" />
                      )}
                    </button>
                    
                    <Link
                      to={`/dashboard/contacts/${contact.id}`}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Link>
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