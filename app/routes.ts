import { type RouteConfig, index, route, layout } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("login", "routes/login.tsx"),
  route("signup", "routes/signup.tsx"),
  route("pricing", "routes/pricing.tsx"),
  route("features", "routes/features.tsx"),
  route("dashboard", "routes/dashboard.tsx", [
    index("routes/dashboard._index.tsx"),
    route("calls", "routes/dashboard.calls.tsx"),
    route("calls/:id", "routes/dashboard.calls.$id.tsx"),
    route("callbacks", "routes/dashboard.callbacks.tsx"),
    route("data-collection", "routes/dashboard.data-collection.tsx"),
    route("contacts", "routes/dashboard.contacts.tsx"),
    route("contacts/:id", "routes/dashboard.contacts.$id.tsx"),
    route("internal-contacts", "routes/dashboard.internal-contacts.tsx"),
    route("analytics", "routes/dashboard.analytics.tsx"),
    route("settings", "routes/dashboard.settings.tsx"),
  ]),
] satisfies RouteConfig;
