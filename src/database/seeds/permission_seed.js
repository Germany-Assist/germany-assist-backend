import Permission from "../models/permission.js";
// important notes
// 1. super refers to the ability to take action without ownership
// 2. ownership means the ownership of the resource or the ownership of the parent resource
// (example in serviceProvider table the owner is the user related to the same serviceProvider id
//  but in the services the owner is the owner of the serviceProvider who is the parent of the service)
// 3. approve and reject represents the approval of an (admin  or superAdmin), approve means that it can be used.
// 4. superAdmin, admin, superUser are deferent
// 6.super user can access everything but its written here to illustrate the point
const permissionsData = [
  // Asset permissions
  { action: "create", resource: "asset", description: "Create new assets" }, //ownership:admin,root,rep,superAdmin
  { action: "delete", resource: "asset", description: "Remove assets" }, //ownership:admin,root  //super:superAdmin
  { action: "update", resource: "asset", description: "Modify assets" }, //ownership:admin,root //super:superAdmin
  { action: "read", resource: "asset", description: "View assets" }, //public //ownership ## this requires a lot of discussion.
  { action: "restore", resource: "asset", description: "Restore assets" }, //super:admin,superAdmin
  { action: "statistical", resource: "asset", description: "statistical info" }, //ownership:root,rep //super:admin,superAdmin

  {
    action: "access",
    resource: "financial",
    description: "statistical info about the finance",
  },

  // Contract permissions
  { action: "create", resource: "contract", description: "Create contracts" }, //super:admin,superAdmin
  { action: "read", resource: "contract", description: "View contracts" }, //public
  { action: "approve", resource: "contract", description: "Approve contracts" }, //super:admin,superAdmin
  { action: "reject", resource: "contract", description: "Reject contracts" }, //super:admin,superAdmin

  // { action: "accept", resource: "order", description: "Accept order" },
  // { action: "reject", resource: "order", description: "Reject order" }, // client can only
  { action: "create", resource: "order", description: "Create order" },
  { action: "create", resource: "offer", description: "Create offer" },
  { action: "withdraw", resource: "offer", description: "withdraw offer" },

  // Coupon permissions
  { action: "create", resource: "coupon", description: "Create coupons" }, //super:admin,superAdmin
  { action: "read", resource: "coupon", description: "View coupons" }, //super:admin,superAdmin
  { action: "apply", resource: "coupon", description: "Apply coupons" }, //root,rep
  { action: "deactivate", resource: "coupon", description: "Deactivate " }, //super:admin,superAdmin
  { action: "approve", resource: "coupon", description: "Approve coupons" }, //super:admin,superAdmin
  { action: "reject", resource: "coupon", description: "Reject coupons" }, //super:admin,superAdmin

  // Service permissions
  { action: "create", resource: "service", description: "Create services" }, //ownership:admin,root,rep,superAdmin
  { action: "read", resource: "service", description: "View services" }, //public
  { action: "update", resource: "service", description: "Modify services" }, //ownership:admin,root
  { action: "delete", resource: "service", description: "Remove services" }, //ownership:admin,root  //super:superAdmin
  { action: "pause", resource: "service", description: "Publish services" }, //ownership:admin,root  //super:superAdmin,admin
  { action: "resume", resource: "service", description: "Unpublish" }, //ownership:admin,root  //super:superAdmin,admin
  { action: "approve", resource: "service", description: "Approve services" }, //super:admin,superAdmin
  { action: "reject", resource: "service", description: "Reject services" }, //super:admin,superAdmin
  { action: "statistical", resource: "service", description: "statistical" }, //ownership:root,rep //super:admin,superAdmin
  { action: "restore", resource: "service", description: "restore" }, //ownership:root,rep //super:admin,superAdmin
  // Review permissions
  { action: "create", resource: "review", description: "Create reviews" }, //client
  { action: "read", resource: "review", description: "View reviews" }, //public
  { action: "update", resource: "review", description: "Edit reviews" }, //ownership:client
  { action: "delete", resource: "review", description: "Remove reviews" }, //ownership:client //super:superAdmin,admin

  // Post permissions
  { action: "create", resource: "post", description: "Create posts" }, //ownership:admin,root,rep,superAdmin
  { action: "read", resource: "post", description: "View posts" }, //public
  { action: "update", resource: "post", description: "Edit posts" }, //ownership:admin,root,rep,superAdmin
  { action: "delete", resource: "post", description: "Remove posts" }, //ownership:admin,root,superAdmin
  { action: "restore", resource: "post", description: "Restore deleted posts" }, //ownership:admin,root //super:superAdmin
  { action: "publish", resource: "post", description: "Publish posts" }, //ownership:admin,root,superAdmin
  { action: "unpublish", resource: "post", description: "Unpublish posts" }, //ownership:admin,root,superAdmin
  { action: "approve", resource: "post", description: "Approve" }, //super:admin,superAdmin
  { action: "reject", resource: "post", description: "Reject" }, //super:admin,superAdmin
  { action: "statistical", resource: "post", description: "statistical" }, //ownership:root,rep //super:admin,superAdmin

  // Permission management
  { action: "create", resource: "permission", description: "create" }, //super:superUser
  { action: "delete", resource: "permission", description: "delete" }, //super:superUser
  { action: "assign", resource: "permission", description: "Assign " }, //ownership:root //super:superAdmin //(only permissions that they hold by default)//super:superUser
  { action: "revoke", resource: "permission", description: "Revoke " }, //ownership:root //super:superAdmin //(only permissions that they hold by default)//super:superUser
  { action: "list", resource: "permission", description: "List" }, //ownership:root //super:superAdmin //(only permissions that they hold by default)//super:superUser

  // Comment permissions
  { action: "create", resource: "comment", description: "Create comments" }, //client
  { action: "read", resource: "comment", description: "View comments" }, //public
  { action: "update", resource: "comment", description: "Edit comments" }, //ownership:client
  { action: "delete", resource: "comment", description: "Delete comments" }, //ownership:client

  // serviceProvider permissions
  {
    action: "create",
    resource: "serviceProvider",
    description: "Create serviceProvideres",
  }, //public
  {
    action: "read",
    resource: "serviceProvider",
    description: "View serviceProvideres",
  }, //public
  {
    action: "update",
    resource: "serviceProvider",
    description: "Edit serviceProvideres",
  }, //ownership:admin,root,rep,superAdmin
  {
    action: "delete",
    resource: "serviceProvider",
    description: "Remove serviceProvideres",
  }, //ownership:root,rep //super:admin,superAdmin
  { action: "restore", resource: "serviceProvider", description: "Restore" }, //super:admin,superAdmin
  { action: "verify", resource: "serviceProvider", description: "verify" }, //super:admin,superAdmin,or future automated roll

  // Users permissions
  { action: "create", resource: "user", description: "Create user" }, //ownership:root (can create representatives) //super:admin,superAdmin
  { action: "read", resource: "user", description: "View user" }, //ownership:root (can view representatives) //super:admin,superAdmin
  { action: "update", resource: "user", description: "Edit user" }, //ownership:root,rep,superAdmin,admin (only certain fields in certain way) //critical fields like verification and password will be discussed later
  { action: "delete", resource: "user", description: "Remove user" }, //ownership:root //super:admin,superAdmin
  { action: "restore", resource: "user", description: "Restore" }, //super:admin,superAdmin
  { action: "verify", resource: "user", description: "verify" }, //super:admin,superAdmin,or future automated roll

  // category/contract permissions
  { action: "create", resource: "category", description: "Create category" }, //ownership:root //super:admin,superAdmin
  { action: "update", resource: "contract", description: "Update category" }, //ownership:root //super:admin,superAdmin
  { action: "update", resource: "category", description: "Update category" }, //ownership:root //superAdmin
  { action: "delete", resource: "category", description: "delete category" }, //ownership:root //superAdmin
  // Analytics permissions
  {
    action: "view",
    resource: "analytics",
    description: "View analytics and reports",
  }, //super:admin,superAdmin
];

/*
missing:
1.chat
2.utils
*/

export default async function seedPermissions() {
  await Permission.bulkCreate(permissionsData);
}
