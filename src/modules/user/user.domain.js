import { AppError } from "../../utils/error.class.js";

function setRoleAndType(type) {
  let rootRole, rootRelatedType, firstName, lastName;
  switch (type) {
    case "serviceProvider":
      firstName = "root";
      lastName = "serviceProvider";
      rootRole = "service_provider_root";
      rootRelatedType = "ServiceProvider";
      break;
    case "employer":
      firstName = "root";
      lastName = "employer";
      rootRole = "employer_root";
      rootRelatedType = "Employer";
      break;
    default:
      throw new AppError(400, "failed to set role", false);
  }
  return { rootRole, rootRelatedType, firstName, lastName };
}
function setRoleAndTypeRep(parentRole) {
  let role, relatedType;
  switch (parentRole) {
    case "service_provider_root":
      role = "service_provider_rep";
      relatedType = "ServiceProvider";
      break;
    case "employer_root":
      role = "employer_rep";
      relatedType = "Employer";
      break;
    default:
      throw new AppError(400, "failed to set role", false);
  }
  return { role, relatedType };
}
const userDomain = {
  setRoleAndTypeRep,
  setRoleAndType,
};
export default userDomain;
