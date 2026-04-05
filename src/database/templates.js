//this will be moved to the database but currently is here for speed of development
//however the mechanics of using it wont change since it will be loaded to the cache
export const roleTemplates = {
  employer_root: [
    // Assets
    { action: "create", resource: "asset" },
    { action: "update", resource: "asset" },
    { action: "delete", resource: "asset" },
    { action: "statistical", resource: "asset" },
    // Services
    { action: "create", resource: "service" },
    { action: "update", resource: "service" },
    { action: "delete", resource: "service" },
    { action: "pause", resource: "service" },
    { action: "resume", resource: "service" },
    { action: "statistical", resource: "service" },
    // Posts
    { action: "create", resource: "post" },
    { action: "update", resource: "post" },
    { action: "delete", resource: "post" },
    { action: "restore", resource: "post" },
    { action: "publish", resource: "post" },
    { action: "unpublish", resource: "post" },
    { action: "statistical", resource: "post" },

    // Permissions
    { action: "assign", resource: "permission" },
    { action: "revoke", resource: "permission" },
    { action: "list", resource: "permission" },

    // serviceProvider
    { action: "update", resource: "serviceProvider" },
    { action: "delete", resource: "serviceProvider" },

    // Users (reps)
    { action: "create", resource: "user" },
    { action: "read", resource: "user" },
    { action: "update", resource: "user" },
    { action: "delete", resource: "user" },
  ],
  // serviceProvider representative
  employer_rep: [
    // Assets
    { action: "create", resource: "asset" },
    { action: "statistical", resource: "asset" },

    // Services
    { action: "create", resource: "service" },
    { action: "update", resource: "service" },
    { action: "statistical", resource: "service" },

    // Posts
    { action: "create", resource: "post" },
    { action: "update", resource: "post" },
    { action: "statistical", resource: "post" },

    // Users rep (their own account only, enforced by middleware)
    { action: "update", resource: "user" },
  ],
  // serviceProvider owner
  service_provider_root: [
    // Assets
    { action: "create", resource: "asset" },
    { action: "update", resource: "asset" },
    { action: "delete", resource: "asset" },
    { action: "statistical", resource: "asset" },
    // Services
    { action: "create", resource: "service" },
    { action: "update", resource: "service" },
    { action: "delete", resource: "service" },
    { action: "pause", resource: "service" },
    { action: "resume", resource: "service" },
    { action: "statistical", resource: "service" },

    // Financial
    { action: "access", resource: "financial" },
    // Posts
    { action: "create", resource: "post" },
    { action: "update", resource: "post" },
    { action: "delete", resource: "post" },
    { action: "restore", resource: "post" },
    { action: "publish", resource: "post" },
    { action: "unpublish", resource: "post" },
    { action: "statistical", resource: "post" },

    // Permissions
    { action: "assign", resource: "permission" },
    { action: "revoke", resource: "permission" },
    { action: "list", resource: "permission" },

    // offer
    { action: "create", resource: "offer" },
    { action: "withdraw", resource: "offer" },
    // order
    { action: "create", resource: "order" },

    // serviceProvider
    { action: "update", resource: "serviceProvider" },
    { action: "delete", resource: "serviceProvider" },

    // Users (reps)
    { action: "create", resource: "user" },
    { action: "read", resource: "user" },
    { action: "update", resource: "user" },
    { action: "delete", resource: "user" },
  ],
  // serviceProvider representative
  service_provider_rep: [
    // Assets
    { action: "create", resource: "asset" },
    { action: "statistical", resource: "asset" },

    // Services
    { action: "create", resource: "service" },
    { action: "update", resource: "service" },
    { action: "statistical", resource: "service" },

    // Posts
    { action: "create", resource: "post" },
    { action: "update", resource: "post" },
    { action: "statistical", resource: "post" },

    // offer
    { action: "create", resource: "offer" },
    { action: "withdraw", resource: "offer" },
    // order
    { action: "create", resource: "order" },

    // Users rep (their own account only, enforced by middleware)
    { action: "update", resource: "user" },
  ],

  // 🔹 Admin (system/serviceProvider moderator)
  admin: [
    // Assets
    { action: "restore", resource: "asset" },
    { action: "statistical", resource: "asset" },
    { action: "update", resource: "asset" },

    // Contracts
    { action: "create", resource: "contract" },

    // Coupons
    { action: "create", resource: "coupon" },
    { action: "read", resource: "coupon" },
    { action: "deactivate", resource: "coupon" },
    // Services
    { action: "approve", resource: "service" },
    { action: "reject", resource: "service" },
    { action: "pause", resource: "service" },
    { action: "resume", resource: "service" },
    { action: "statistical", resource: "service" },
    { action: "restore", resource: "service" },

    // Posts
    { action: "approve", resource: "post" },
    { action: "reject", resource: "post" },
    { action: "statistical", resource: "post" },

    // Reviews
    { action: "delete", resource: "review" },

    // serviceProvider
    { action: "delete", resource: "serviceProvider" },
    { action: "restore", resource: "serviceProvider" },
    { action: "verify", resource: "serviceProvider" },

    // Users
    { action: "create", resource: "user" },
    { action: "read", resource: "user" },
    { action: "update", resource: "user" },
    { action: "delete", resource: "user" },
    { action: "restore", resource: "user" },
    { action: "verify", resource: "user" },
    { action: "create", resource: "category" }, //ownership:root //super:admin,superAdmin
    { action: "update", resource: "contract" }, //ownership:root //super:admin,superAdmin
    // Analytics
    { action: "view", resource: "analytics" },
  ],

  // 🔹 SuperAdmin (everything)
  superAdmin: [
    // Give them all permissions
    // (could just assign permissionsData instead of listing them)
    "*",
  ],

  // 🔹 Client (end-user)
  client: [
    // Reviews
    { action: "create", resource: "review" },
    { action: "update", resource: "review" },
    { action: "delete", resource: "review" },
    // Comments
    { action: "create", resource: "comment" },
    { action: "update", resource: "comment" },
    { action: "delete", resource: "comment" },
    // Asset
    { action: "update", resource: "asset" },
    { action: "delete", resource: "asset" },
    // Coupons
    { action: "apply", resource: "coupon" },
  ],
};
