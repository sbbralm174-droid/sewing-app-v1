// Database Models
const userPermissionsSchema = {
  userId: "string",
  permissions: {
    "/dashboard": true,
    "/admin": false,
    "/reports": true,
    "/users": false,
    "/settings": true
  },
  customRoutes: ["/custom-page-1", "/custom-page-2"]
}