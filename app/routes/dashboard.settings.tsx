import type { Route } from "./+types/dashboard.settings";
import { useState, useEffect } from "react";
import { useLoaderData, Form, useNavigation } from "react-router";
import { 
  Building,
  Bell,
  Users,
  Save,
  Phone,
  Bot,
  Plus,
  Trash2,
  MessageSquare,
  Volume2,
  Sliders,
  ArrowRight,
  Check,
  Database,
  FileText
} from "lucide-react";
import { ApiClient } from "~/lib/api.server";
import { getSession } from "~/lib/session.server";
import { redirect } from "react-router";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Settings - VoiceAI Dashboard" },
    { name: "description", content: "Manage your account settings" },
  ];
}

export async function loader({ request }: Route.LoaderArgs) {
  const session = await getSession(request);
  
  if (!session.has("userId")) {
    return redirect("/login");
  }
  
  const companyId = session.get("companyId");
  
  try {
    // Fetch company details and phone numbers
    const [company, phoneNumbers] = await Promise.all([
      ApiClient.getCompany(companyId, request),
      ApiClient.getPhoneNumbers(companyId, request)
    ]);
    
    return { company, phoneNumbers, error: null };
  } catch (error: any) {
    console.error("Failed to fetch settings:", error);
    return { 
      company: null, 
      phoneNumbers: [],
      error: error.error || "Failed to load settings" 
    };
  }
}

export async function action({ request }: Route.ActionArgs) {
  const session = await getSession(request);
  const companyId = session.get("companyId");
  const formData = await request.formData();
  const action = formData.get("action");
  
  try {
    if (action === "updateCompany") {
      await ApiClient.updateCompany(companyId, {
        name: formData.get("name"),
        industry: formData.get("industry"),
        size: formData.get("size"),
        timezone: formData.get("timezone"),
        businessHours: {
          start: formData.get("businessHoursStart"),
          end: formData.get("businessHoursEnd")
        },
        supportNumber: formData.get("supportNumber")
      }, request);
    } else if (action === "updatePhoneNumber") {
      const phoneNumberId = formData.get("phoneNumberId");
      const departments = JSON.parse(formData.get("departments") as string || "[]");
      
      await ApiClient.updatePhoneNumber(phoneNumberId as string, {
        instructions: formData.get("instructions"),
        metadata: {
          departments,
          voiceSettings: {
            voice: formData.get("voice"),
            temperature: parseFloat(formData.get("temperature") as string || "0.8")
          }
        }
      }, request);
    }
    
    return { success: true };
  } catch (error: any) {
    return { error: error.error || "Failed to update settings" };
  }
}

export default function SettingsPage() {
  const { company, phoneNumbers, error } = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  
  const [activeTab, setActiveTab] = useState("company");
  const [selectedPhoneNumber, setSelectedPhoneNumber] = useState(phoneNumbers?.[0]?.id || null);
  const [departments, setDepartments] = useState<any[]>([]);
  const [aiSettings, setAiSettings] = useState({
    instructions: "",
    voice: "alloy",
    temperature: 0.8
  });
  
  const [dataFields, setDataFields] = useState({
    standardFields: {
      callerName: true,
      companyName: true,
      contactNumber: true,
      email: false,
      reasonForCalling: true
    },
    customFields: [] as any[]
  });

  useEffect(() => {
    if (selectedPhoneNumber && phoneNumbers) {
      const phone = phoneNumbers.find((p: any) => p.id === selectedPhoneNumber);
      if (phone) {
        setDepartments(phone.metadata?.departments || [
          { name: "sales", transferNumber: "", description: "Sales inquiries" },
          { name: "support", transferNumber: "", description: "Technical support" },
          { name: "billing", transferNumber: "", description: "Billing questions" }
        ]);
        setAiSettings({
          instructions: phone.instructions || "",
          voice: phone.metadata?.voiceSettings?.voice || "alloy",
          temperature: phone.metadata?.voiceSettings?.temperature || 0.8
        });
      }
    }
  }, [selectedPhoneNumber, phoneNumbers]);

  const tabs = [
    { id: "company", name: "Company", icon: Building },
    { id: "phones", name: "Phone Lines", icon: Phone },
    { id: "ai", name: "AI Assistant", icon: Bot },
    { id: "datacollection", name: "Data Collection", icon: Database },
    { id: "departments", name: "Routing", icon: Users },
    { id: "notifications", name: "Alerts", icon: Bell },
  ];

  const addDepartment = () => {
    setDepartments([...departments, { 
      name: "", 
      transferNumber: "", 
      description: "" 
    }]);
  };

  const updateDepartment = (index: number, field: string, value: string) => {
    const updated = [...departments];
    updated[index] = { ...updated[index], [field]: value };
    setDepartments(updated);
  };

  const removeDepartment = (index: number) => {
    setDepartments(departments.filter((_, i) => i !== index));
  };

  const voiceOptions = [
    { value: "alloy", label: "Alloy", desc: "Neutral" },
    { value: "ash", label: "Ash", desc: "Clear" },
    { value: "ballad", label: "Ballad", desc: "Melodic" },
    { value: "coral", label: "Coral", desc: "Warm" },
    { value: "echo", label: "Echo", desc: "Male" },
    { value: "sage", label: "Sage", desc: "Wise" },
    { value: "shimmer", label: "Shimmer", desc: "Soft" },
    { value: "verse", label: "Verse", desc: "Poetic" }
  ];

  return (
    <div className="max-w-full">
      {/* Minimal Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-slate-900">Settings</h1>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-lg">
          {error}
        </div>
      )}

      {/* Tab Navigation - Horizontal */}
      <div className="border-b border-slate-200 mb-8">
        <nav className="flex gap-8 overflow-x-scroll md:overflow-x-hidden">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-4 px-1 border-b-2 transition-all flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'border-slate-900 text-slate-900'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              <span className="font-medium">{tab.name}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Content Area - Full Width */}
      <div className="max-w-4xl">
        {activeTab === "company" && (
          <Form method="post">
            <input type="hidden" name="action" value="updateCompany" />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Company Name
                </label>
                <input
                  type="text"
                  name="name"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                  defaultValue={company?.name || ""}
                  placeholder="Your company name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Support Number
                </label>
                <input
                  type="tel"
                  name="supportNumber"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                  defaultValue={company?.supportNumber || ""}
                  placeholder="+1234567890"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Timezone
                </label>
                <select 
                  name="timezone"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                  defaultValue={company?.timezone || "America/New_York"}
                >
                  <option value="America/New_York">Eastern Time</option>
                  <option value="America/Chicago">Central Time</option>
                  <option value="America/Denver">Mountain Time</option>
                  <option value="America/Los_Angeles">Pacific Time</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Industry
                </label>
                <select 
                  name="industry"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                  defaultValue={company?.industry || "Technology"}
                >
                  <option>Technology</option>
                  <option>Healthcare</option>
                  <option>Finance</option>
                  <option>Retail</option>
                  <option>Education</option>
                  <option>Other</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Company Size
                </label>
                <select 
                  name="size"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                  defaultValue={company?.size || "51-200"}
                >
                  <option value="1-10">1-10 employees</option>
                  <option value="11-50">11-50 employees</option>
                  <option value="51-200">51-200 employees</option>
                  <option value="201-500">201-500 employees</option>
                  <option value="500+">500+ employees</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Opening Hours
                </label>
                <input
                  type="time"
                  name="businessHoursStart"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                  defaultValue={company?.businessHours?.start || "09:00"}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Closing Hours
                </label>
                <input
                  type="time"
                  name="businessHoursEnd"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                  defaultValue={company?.businessHours?.end || "18:00"}
                />
              </div>
            </div>

            <div className="mt-8">
              <button 
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </Form>
        )}

        {activeTab === "phones" && (
          <div>
            <div className="mb-6">
              <p className="text-sm text-slate-600">
                Select a phone number to configure its AI settings and call routing.
              </p>
            </div>

            <div className="space-y-3">
              {phoneNumbers && phoneNumbers.length > 0 ? (
                phoneNumbers.map((phone: any) => (
                  <button
                    key={phone.id}
                    onClick={() => {
                      setSelectedPhoneNumber(phone.id);
                      setActiveTab("ai");
                    }}
                    className="w-full p-4 bg-white border border-slate-200 rounded-lg hover:border-slate-900 transition-colors text-left group"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-slate-900">{phone.phoneNumber}</p>
                        <p className="text-sm text-slate-500 mt-1">
                          {phone.metadata?.departments?.length || 0} departments • 
                          {phone.instructions ? " Custom prompt" : " Default prompt"}
                        </p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-slate-900 transition" />
                    </div>
                  </button>
                ))
              ) : (
                <div className="text-center py-12 bg-slate-50 rounded-lg">
                  <Phone className="h-12 w-12 mx-auto mb-3 text-slate-400" />
                  <p className="text-slate-600">No phone numbers configured</p>
                  <button className="mt-4 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition">
                    Add Phone Number
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "ai" && (
          <Form method="post">
            <input type="hidden" name="action" value="updatePhoneNumber" />
            <input type="hidden" name="phoneNumberId" value={selectedPhoneNumber || ""} />
            <input type="hidden" name="departments" value={JSON.stringify(departments)} />
            
            {selectedPhoneNumber ? (
              <div className="space-y-8">
                <div className="pb-4 border-b border-slate-200">
                  <p className="text-sm text-slate-500">Configuring</p>
                  <p className="font-medium text-lg text-slate-900">
                    {phoneNumbers?.find((p: any) => p.id === selectedPhoneNumber)?.phoneNumber}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-3">
                    System Prompt
                  </label>
                  <textarea
                    name="instructions"
                    rows={6}
                    className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent font-mono text-sm"
                    placeholder="Leave blank to use default greeting..."
                    value={aiSettings.instructions}
                    onChange={(e) => setAiSettings({...aiSettings, instructions: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-3">
                    Voice
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {voiceOptions.map((voice) => (
                      <label
                        key={voice.value}
                        className={`relative flex items-center justify-between p-3 rounded-lg border cursor-pointer transition ${
                          aiSettings.voice === voice.value
                            ? 'border-slate-900 bg-slate-50'
                            : 'border-slate-200 hover:border-slate-400'
                        }`}
                      >
                        <input
                          type="radio"
                          name="voice"
                          value={voice.value}
                          checked={aiSettings.voice === voice.value}
                          onChange={(e) => setAiSettings({...aiSettings, voice: e.target.value})}
                          className="sr-only"
                        />
                        <div>
                          <p className="font-medium text-sm">{voice.label}</p>
                          <p className="text-xs text-slate-500">{voice.desc}</p>
                        </div>
                        {aiSettings.voice === voice.value && (
                          <Check className="h-4 w-4 text-slate-900" />
                        )}
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-3">
                    Temperature: {aiSettings.temperature}
                  </label>
                  <input
                    type="range"
                    name="temperature"
                    min="0"
                    max="1"
                    step="0.1"
                    className="w-full"
                    value={aiSettings.temperature}
                    onChange={(e) => setAiSettings({...aiSettings, temperature: parseFloat(e.target.value)})}
                  />
                  <div className="flex justify-between text-xs text-slate-500 mt-1">
                    <span>Focused</span>
                    <span>Balanced</span>
                    <span>Creative</span>
                  </div>
                </div>

                <div>
                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? "Saving..." : "Save AI Settings"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 bg-slate-50 rounded-lg">
                <Bot className="h-12 w-12 mx-auto mb-3 text-slate-400" />
                <p className="text-slate-600">Select a phone number first</p>
                <button
                  type="button"
                  onClick={() => setActiveTab("phones")}
                  className="mt-4 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition"
                >
                  Select Phone Number
                </button>
              </div>
            )}
          </Form>
        )}

        {activeTab === "data " && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-slate-900 mb-2">Data Collection Fields</h3>
              <p className="text-sm text-slate-600">
                Configure what information the AI assistant should collect from callers.
              </p>
            </div>

            <div>
              <h4 className="text-sm font-medium text-slate-700 mb-3">Standard Fields</h4>
              <div className="space-y-3">
                {Object.entries(dataFields.standardFields).map(([key, enabled]) => (
                  <label key={key} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg hover:border-slate-300 transition cursor-pointer">
                    <div>
                      <p className="font-medium text-sm text-slate-900">
                        {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      </p>
                      <p className="text-xs text-slate-500">
                        {key === 'callerName' && "The name of the person calling"}
                        {key === 'companyName' && "The company or organization they represent"}
                        {key === 'contactNumber' && "Phone number for callbacks"}
                        {key === 'email' && "Email address for follow-ups"}
                        {key === 'reasonForCalling' && "Why they are calling"}
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={enabled}
                      onChange={(e) => setDataFields({
                        ...dataFields,
                        standardFields: {
                          ...dataFields.standardFields,
                          [key]: e.target.checked
                        }
                      })}
                      className="h-4 w-4 text-slate-900 focus:ring-slate-500 border-slate-300 rounded"
                    />
                  </label>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-slate-700 mb-3">Custom Fields</h4>
              <div className="space-y-3">
                {dataFields.customFields.map((field, index) => (
                  <div key={index} className="p-4 bg-white border border-slate-200 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <input
                        type="text"
                        placeholder="Field name (e.g., accountNumber)"
                        value={field.name}
                        onChange={(e) => {
                          const updated = [...dataFields.customFields];
                          updated[index] = { ...updated[index], name: e.target.value };
                          setDataFields({ ...dataFields, customFields: updated });
                        }}
                        className="px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 text-sm"
                      />
                      <input
                        type="text"
                        placeholder="Display label (e.g., Account Number)"
                        value={field.label}
                        onChange={(e) => {
                          const updated = [...dataFields.customFields];
                          updated[index] = { ...updated[index], label: e.target.value };
                          setDataFields({ ...dataFields, customFields: updated });
                        }}
                        className="px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 text-sm"
                      />
                      <select
                        value={field.type}
                        onChange={(e) => {
                          const updated = [...dataFields.customFields];
                          updated[index] = { ...updated[index], type: e.target.value };
                          setDataFields({ ...dataFields, customFields: updated });
                        }}
                        className="px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 text-sm"
                      >
                        <option value="text">Text</option>
                        <option value="number">Number</option>
                        <option value="email">Email</option>
                        <option value="phone">Phone</option>
                        <option value="select">Select</option>
                        <option value="boolean">Yes/No</option>
                      </select>
                      <div className="flex gap-3 items-center">
                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={field.required}
                            onChange={(e) => {
                              const updated = [...dataFields.customFields];
                              updated[index] = { ...updated[index], required: e.target.checked };
                              setDataFields({ ...dataFields, customFields: updated });
                            }}
                            className="h-4 w-4 text-slate-900 focus:ring-slate-500 border-slate-300 rounded"
                          />
                          Required
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            setDataFields({
                              ...dataFields,
                              customFields: dataFields.customFields.filter((_, i) => i !== index)
                            });
                          }}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <input
                      type="text"
                      placeholder="AI prompt (e.g., Ask for their account number if they have one)"
                      value={field.aiPrompt}
                      onChange={(e) => {
                        const updated = [...dataFields.customFields];
                        updated[index] = { ...updated[index], aiPrompt: e.target.value };
                        setDataFields({ ...dataFields, customFields: updated });
                      }}
                      className="mt-3 w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 text-sm"
                    />
                  </div>
                ))}
                
                <button
                  type="button"
                  onClick={() => {
                    setDataFields({
                      ...dataFields,
                      customFields: [
                        ...dataFields.customFields,
                        { name: '', label: '', type: 'text', required: false, aiPrompt: '' }
                      ]
                    });
                  }}
                  className="w-full p-3 border-2 border-dashed border-slate-300 text-slate-600 rounded-lg hover:border-slate-400 transition"
                >
                  <Plus className="h-4 w-4 inline mr-2" />
                  Add Custom Field
                </button>
              </div>
            </div>

            <Form method="post">
              <input type="hidden" name="action" value="updateDataCollection" />
              <input type="hidden" name="companyId" value={company?.id || ""} />
              <input type="hidden" name="dataCollectionFields" value={JSON.stringify(dataFields)} />
              
              <button 
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Saving..." : "Save Data Collection Settings"}
              </button>
            </Form>
          </div>
        )}

        {activeTab === "departments" && (
          <div>
            {selectedPhoneNumber ? (
              <div className="space-y-6">
                <div className="pb-4 border-b border-slate-200">
                  <p className="text-sm text-slate-500">Managing departments for</p>
                  <p className="font-medium text-lg text-slate-900">
                    {phoneNumbers?.find((p: any) => p.id === selectedPhoneNumber)?.phoneNumber}
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-medium text-sm text-slate-600">
                    <div>Department Name</div>
                    <div>Transfer Number</div>
                    <div>Description</div>
                  </div>

                  {departments.map((dept, index) => (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                      <input
                        type="text"
                        className="px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                        placeholder="e.g., Sales"
                        value={dept.name}
                        onChange={(e) => updateDepartment(index, 'name', e.target.value)}
                      />
                      
                      <input
                        type="tel"
                        className="px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                        placeholder="+1234567890"
                        value={dept.transferNumber}
                        onChange={(e) => updateDepartment(index, 'transferNumber', e.target.value)}
                      />
                      
                      <div className="flex gap-2">
                        <input
                          type="text"
                          className="flex-1 px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                          placeholder="Brief description"
                          value={dept.description}
                          onChange={(e) => updateDepartment(index, 'description', e.target.value)}
                        />
                        <button
                          type="button"
                          onClick={() => removeDepartment(index)}
                          className="p-2.5 text-red-600 hover:bg-red-50 rounded-lg transition"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={addDepartment}
                    className="w-full p-3 border-2 border-dashed border-slate-300 text-slate-600 rounded-lg hover:border-slate-400 transition"
                  >
                    <Plus className="h-4 w-4 inline mr-2" />
                    Add Department
                  </button>
                </div>

                <Form method="post">
                  <input type="hidden" name="action" value="updatePhoneNumber" />
                  <input type="hidden" name="phoneNumberId" value={selectedPhoneNumber || ""} />
                  <input type="hidden" name="departments" value={JSON.stringify(departments)} />
                  <input type="hidden" name="instructions" value={aiSettings.instructions} />
                  <input type="hidden" name="voice" value={aiSettings.voice} />
                  <input type="hidden" name="temperature" value={aiSettings.temperature.toString()} />
                  
                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? "Saving..." : "Save Departments"}
                  </button>
                </Form>
              </div>
            ) : (
              <div className="text-center py-12 bg-slate-50 rounded-lg">
                <Users className="h-12 w-12 mx-auto mb-3 text-slate-400" />
                <p className="text-slate-600">Select a phone number first</p>
                <button
                  type="button"
                  onClick={() => setActiveTab("phones")}
                  className="mt-4 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition"
                >
                  Select Phone Number
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === "notifications" && (
          <div className="space-y-4">
            <div className="mb-6">
              <p className="text-sm text-slate-600">
                Choose how you want to be notified about important events.
              </p>
            </div>

            {[
              { name: "Email Notifications", desc: "Receive email alerts", enabled: true },
              { name: "SMS Alerts", desc: "Text messages for urgent events", enabled: false },
              { name: "Missed Call Alerts", desc: "Notify when calls are missed", enabled: true },
              { name: "Callback Reminders", desc: "Alert before scheduled callbacks", enabled: true },
              { name: "Daily Summary", desc: "Daily activity report", enabled: false }
            ].map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-lg">
                <div>
                  <p className="font-medium text-slate-900">{item.name}</p>
                  <p className="text-sm text-slate-500">{item.desc}</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked={item.enabled} />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-slate-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-slate-900"></div>
                </label>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}