import type { Route } from "./+types/dashboard.data-collection";
import { useLoaderData } from "react-router";
import { ApiClient } from "~/lib/api.server";
import { getSession } from "~/lib/session.server";
import { redirect } from "react-router";
import { 
  Database,
  Download,
  Upload,
  FileText,
  BarChart3,
  Settings,
  Plus,
  Search,
  Filter
} from "lucide-react";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Data Collection - VoiceAI Dashboard" },
    { name: "description", content: "Manage and collect call data" },
  ];
}

interface DataCollectionCollection {
  id: number;
  callerName: string;
  companyName: string;
  contactNumber: string;
  email: string;
  reasonForCalling: string;
}

export async function loader({ request }: Route.LoaderArgs) {
  const session = await getSession(request);
  
  if (!session.has("userId")) {
    return redirect("/login");
  }
  
  const companyId = session.get("companyId");
  if (!companyId) {
    return redirect("/login");
  }
  
  const params = new URLSearchParams();
  params.set("companyId", companyId!);
  
  try {
    const dataCollection = await (ApiClient as any).getDataCollection(params, request);
    return { dataCollection, error: null };
  } catch (error: any) {
    console.error("Failed to fetch data collection:", error);
    // Return empty array as fallback
    return { dataCollection: [], error: error.error || "Failed to load data collection" };
  }
}

export default function DataCollection() {
  const { dataCollection, error } = useLoaderData<typeof loader>();

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-lg font-medium text-gray-900">Data Collection</h1>
        <p className="text-xs text-gray-500 mt-0.5">Manage and organize your call data collection processes</p>
      </div>

      {/* Summary Stats */}
      {dataCollection.length > 0 && (
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-indigo-600" />
              <span className="text-xs text-gray-500">Total Records</span>
            </div>
            <p className="text-lg font-semibold text-gray-900 mt-1">{dataCollection.length}</p>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-green-600" />
              <span className="text-xs text-gray-500">Companies</span>
            </div>
            <p className="text-lg font-semibold text-gray-900 mt-1">
              {new Set(dataCollection.map((item: DataCollectionCollection) => item.companyName)).size}
            </p>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-purple-600" />
              <span className="text-xs text-gray-500">Unique Callers</span>
            </div>
            <p className="text-lg font-semibold text-gray-900 mt-1">
              {new Set(dataCollection.map((item: DataCollectionCollection) => item.callerName)).size}
            </p>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-red-50/50 border border-red-200/50 rounded-md">
          <p className="text-xs text-red-600">{error}</p>
        </div>
      )}

      {/* Data Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-gray-900">Collected Data</h2>
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-1.5 px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50">
                <Search className="h-3 w-3" />
                Search
              </button>
              <button className="flex items-center gap-1.5 px-2 py-1 text-xs bg-indigo-600 text-white rounded hover:bg-indigo-700">
                <Download className="h-3 w-3" />
                Export
              </button>
            </div>
          </div>
        </div>

        {dataCollection.length === 0 ? (
          <div className="text-center py-12">
            <Database className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-sm font-medium text-gray-900 mb-2">No data collected yet</h3>
            <p className="text-xs text-gray-500 mb-4">Start collecting data from your calls.</p>
           
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-4 py-3 text-[10px] font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="text-left px-4 py-3 text-[10px] font-medium text-gray-500 uppercase tracking-wider">Company</th>
                  <th className="text-left px-4 py-3 text-[10px] font-medium text-gray-500 uppercase tracking-wider">Contact Number</th>
                  <th className="text-left px-4 py-3 text-[10px] font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="text-left px-4 py-3 text-[10px] font-medium text-gray-500 uppercase tracking-wider">Reason for Calling</th>
                  <th className="text-left px-4 py-3 text-[10px] font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {dataCollection.map((collection: DataCollectionCollection) => (
                  <tr key={collection.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">{collection.callerName}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{collection.companyName}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{collection.contactNumber}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{collection.email}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{collection.reasonForCalling}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      <button className="p-1 text-gray-400 hover:text-gray-600">
                        <Settings className="h-3 w-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}