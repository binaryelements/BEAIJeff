import type { Route } from "./+types/login";
import { Link, Form, redirect, useActionData, useNavigation } from "react-router";
import { motion } from "framer-motion";
import { Phone } from "lucide-react";
import { getSession, commitSession } from "~/lib/session.server";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Login - VoiceAI" },
    { name: "description", content: "Sign in to your VoiceAI account" },
  ];
}

export async function loader({ request }: Route.LoaderArgs) {
  const session = await getSession(request);
  
  // If already logged in, redirect to dashboard
  if (session.has("userId")) {
    return redirect("/dashboard");
  }
  
  return null;
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email and password are required" };
  }

  try {
    // Call the authentication API
    const { ApiClient } = await import("~/lib/api.server");
    const authResult = await ApiClient.login(email, password);
    
    // Create session with user data
    const session = await getSession(request);
    session.set("userId", authResult.user.id.toString());
    session.set("companyId", authResult.user.companyId.toString());
    session.set("email", authResult.user.email);
    session.set("role", authResult.user.role);
    
    return redirect("/dashboard", {
      headers: {
        "Set-Cookie": await commitSession(session),
      },
    });
  } catch (error: any) {
    console.error("Login error:", error);
    if (error?.status === 401) {
      return { error: "Invalid email or password" };
    }
    return { error: error?.error || "An error occurred during login" };
  }
}

export default function Login() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <div className="min-h-screen bg-white flex">
      <div className="flex-1 flex items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-sm"
        >
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-2 mb-8">
              <Phone className="h-8 w-8 text-gray-900" />
              <span className="text-2xl font-semibold text-gray-900">VoiceAI</span>
            </Link>
            <h2 className="text-2xl font-semibold text-gray-900">Welcome back</h2>
            <p className="text-gray-600 mt-2">Sign in to your account</p>
          </div>

          <Form method="post" className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                placeholder="john@example.com"
                defaultValue="admin@caller.com"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                placeholder="••••••••"
                required
              />
            </div>

            {actionData?.error && (
              <div className="rounded-md bg-red-50 p-4">
                <p className="text-sm text-red-600">{actionData.error}</p>
              </div>
            )}

            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input type="checkbox" className="rounded border-gray-300 text-gray-900 focus:ring-gray-900" />
                <span className="ml-2 text-sm text-gray-600">Remember me</span>
              </label>
              <a href="#" className="text-sm text-gray-600 hover:text-gray-900">
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2 px-4 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 disabled:opacity-50"
            >
              {isSubmitting ? "Signing in..." : "Sign in"}
            </button>
          </Form>

          <div className="text-xs text-center text-gray-500 mt-4">
            Default: admin@caller.com / admin123
          </div>

          <p className="text-center text-sm text-gray-600 mt-6">
            Don't have an account?{" "}
            <Link to="/signup" className="text-gray-900 hover:underline font-medium">
              Sign up
            </Link>
          </p>
        </motion.div>
      </div>

      <div className="hidden lg:block lg:w-1/2 bg-gray-50">
        <div className="h-full flex items-center justify-center p-12">
          <div className="max-w-md">
            <h3 className="text-2xl font-semibold text-gray-900 mb-4">
              Transform your customer service
            </h3>
            <p className="text-gray-600 leading-relaxed">
              Join thousands of businesses using VoiceAI to provide exceptional customer experiences with intelligent voice reception.
            </p>
            <div className="mt-8 space-y-4">
              <div className="flex items-start gap-3">
                <div className="h-2 w-2 rounded-full bg-gray-400 mt-1.5" />
                <p className="text-sm text-gray-600">24/7 availability</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="h-2 w-2 rounded-full bg-gray-400 mt-1.5" />
                <p className="text-sm text-gray-600">Natural conversations</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="h-2 w-2 rounded-full bg-gray-400 mt-1.5" />
                <p className="text-sm text-gray-600">Intelligent routing</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}