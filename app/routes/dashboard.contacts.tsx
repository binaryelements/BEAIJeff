import { useLoaderData, Form, useSearchParams, useFetcher, Link, Outlet, useLocation, useRevalidator } from "react-router";
import type { Route } from "./+types/dashboard.contacts";
import { Search, Plus, Filter, Star, Users, Phone, Ban, Mail, Building, ChevronRight, Edit, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from 'react';
import { cn } from "~/lib/utils";
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
  lastContactedAt: string | null;
  totalCalls: number;
  isVip: boolean;
  isBlocked: boolean;
  tags: string[];
  customFields: Record<string, any>;
}

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const query = url.searchParams.get("q") || "";
  
  try {
    const response = await fetch(
      `http://private-api:3000/api/contacts?q=${encodeURIComponent(query)}`,
      {
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );
    
    if (!response.ok) {
      console.error('Failed to fetch contacts:', response.status, response.statusText);
      return {
        contacts: [],
        query,
      };
    }
    
    const contacts = await response.json();
    
    return {
      contacts: contacts || [],
      query,
    };
  } catch (error) {
    console.error('Error loading contacts:', error);
    return {
      contacts: [],
      query,
    };
  }
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const action = formData.get('_action');
  
  try {
    if (action === 'create') {
      const data = JSON.parse(formData.get('data') as string);
      const response = await fetch('http://private-api:3000/api/contacts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...data, companyId: 1 }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create contact');
      }
      
      return { success: true };
    }
    
    if (action === 'update') {
      const id = formData.get('id');
      const data = JSON.parse(formData.get('data') as string);
      const response = await fetch(`http://private-api:3000/api/contacts/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update contact');
      }
      
      return { success: true };
    }
    
    if (action === 'delete') {
      const id = formData.get('id');
      const response = await fetch(`http://private-api:3000/api/contacts/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete contact');
      }
      
      return { success: true };
    }
  } catch (error) {
    console.error('Action error:', error);
    return { error: error instanceof Error ? error.message : 'An error occurred' };
  }
  
  return null;
}

export default function Contacts() {
  const location = useLocation();
  const isDetailPage = location.pathname.includes('/dashboard/contacts/');
  
  // If we're on a detail page, render the Outlet for nested route
  if (isDetailPage) {
    return <Outlet />;
  }
  
  // Otherwise render the contacts list
  return <ContactsList />;
}

function ContactsList() {
  const { contacts, query } = useLoaderData<typeof loader>();
  const [searchParams] = useSearchParams();
  const fetcher = useFetcher();
  const revalidator = useRevalidator();
  const [filterVip, setFilterVip] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [deletingContact, setDeletingContact] = useState<Contact | null>(null);

  const filteredContacts = filterVip
    ? contacts.filter((c: Contact) => c.isVip)
    : contacts;

  const formatTime = (dateString: string | null) => {
    if (!dateString) return "Never";
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  return (
    <>
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contacts</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your customer contacts and call history</p>
        </div>
        <button 
          onClick={() => {
            setEditingContact(null);
            setShowForm(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all duration-200">
          <Plus className="h-4 w-4" />
          Add Contact
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <Form className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="search"
                name="q"
                defaultValue={query}
                placeholder="Search contacts by name, phone, email, or company..."
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
              />
            </div>
          </Form>
          
          <div className="flex gap-2">
            <button
              onClick={() => setFilterVip(!filterVip)}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors text-sm",
                filterVip 
                  ? "bg-yellow-50 border-yellow-300 text-yellow-700"
                  : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
              )}
            >
              <Star className="h-4 w-4" />
              VIP Only
            </button>
            <button className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors text-sm">
              <Filter className="h-4 w-4" />
              More Filters
            </button>
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
              <p className="text-sm text-gray-500">Total Contacts</p>
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
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Star className="h-5 w-5 text-yellow-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-500">VIP Contacts</p>
              <p className="text-2xl font-bold text-gray-900">
                {contacts.filter((c: Contact) => c.isVip).length}
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
            <div className="p-2 bg-green-100 rounded-lg">
              <Phone className="h-5 w-5 text-green-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-500">Total Calls</p>
              <p className="text-2xl font-bold text-gray-900">
                {contacts.reduce((sum: number, c: Contact) => sum + c.totalCalls, 0)}
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
            <div className="p-2 bg-red-100 rounded-lg">
              <Ban className="h-5 w-5 text-red-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-500">Blocked</p>
              <p className="text-2xl font-bold text-gray-900">
                {contacts.filter((c: Contact) => c.isBlocked).length}
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Contacts List */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {filteredContacts.length} Contacts
          </h2>
        </div>
        
        {filteredContacts.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No contacts found</p>
            <p className="text-sm text-gray-400 mt-1">
              {query ? 'Try adjusting your search' : 'Add your first contact to get started'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredContacts.map((contact: Contact, index: number) => (
              <motion.div
                key={contact.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: Math.min(index * 0.05, 0.3) }}
                className="group"
              >
                <div className="px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <Link
                      to={`/dashboard/contacts/${contact.id}`}
                      className="flex-1 block">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-sm font-semibold text-gray-900">
                          {contact.name}
                        </h3>
                        {contact.isVip && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
                            <Star className="h-3 w-3" />
                            VIP
                          </span>
                        )}
                        {contact.isBlocked && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                            <Ban className="h-3 w-3" />
                            Blocked
                          </span>
                        )}
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
                        
                        {contact.companyName && (
                          <div className="flex items-center gap-2">
                            <Building className="h-3.5 w-3.5 text-gray-400" />
                            <span className="text-gray-600 truncate">{contact.companyName}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <span>{contact.totalCalls} calls</span>
                        <span>Last contact: {formatTime(contact.lastContactedAt)}</span>
                        {contact.department && <span>{contact.department}</span>}
                        {contact.role && <span>{contact.role}</span>}
                      </div>
                      
                      {contact.customFields && Object.keys(contact.customFields).length > 0 && (
                        <div className="flex gap-2 mt-2">
                          {Object.entries(contact.customFields).slice(0, 3).map(([key, value]) => (
                            <span key={key} className="inline-flex px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                              {key}: {String(value)}
                            </span>
                          ))}
                        </div>
                      )}
                    </Link>
                    
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setEditingContact(contact);
                          setShowForm(true);
                        }}
                        className="p-2 hover:bg-gray-200 rounded-lg transition-colors z-10"
                        type="button"
                      >
                        <Edit className="h-4 w-4 text-gray-600" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setDeletingContact(contact);
                        }}
                        className="p-2 hover:bg-red-100 rounded-lg transition-colors z-10"
                        type="button"
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </button>
                      <Link to={`/dashboard/contacts/${contact.id}`}>
                        <ChevronRight className="h-4 w-4 text-gray-400 ml-2" />
                      </Link>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>

    {/* Contact Form Modal */}
    {showForm && (
      <ContactForm
        contact={editingContact}
        onSubmit={async (data) => {
          const formData = new FormData();
          formData.append('_action', editingContact ? 'update' : 'create');
          if (editingContact?.id) {
            formData.append('id', editingContact.id.toString());
          }
          formData.append('data', JSON.stringify(data));
          
          fetcher.submit(formData, { method: 'post' });
          setShowForm(false);
          setEditingContact(null);
          
          // Force revalidation after a short delay
          setTimeout(() => {
            revalidator.revalidate();
          }, 500);
        }}
        onCancel={() => {
          setShowForm(false);
          setEditingContact(null);
        }}
        isLoading={fetcher.state === 'submitting'}
      />
    )}

    {/* Delete Confirmation Dialog */}
    {deletingContact && (
      <DeleteContactDialog
        contactName={deletingContact.name}
        onConfirm={() => {
          const formData = new FormData();
          formData.append('_action', 'delete');
          formData.append('id', deletingContact.id.toString());
          
          fetcher.submit(formData, { method: 'post' });
          setDeletingContact(null);
          
          // Force revalidation after a short delay
          setTimeout(() => {
            revalidator.revalidate();
          }, 500);
        }}
        onCancel={() => setDeletingContact(null)}
        isDeleting={fetcher.state === 'submitting'}
      />
    )}
    </>
  );
}