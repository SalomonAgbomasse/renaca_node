const ID_TOKEN_KEY = "id_token" as string;
const ID_USER_KEY = "id_user" as string;
const USER_INFO = "user_info" as string;
const ID_PHONE_KEY = "user_phone" as string;
const USER_NAME = "user_name" as string;
const USER_EMAIL = "user_email" as string;
const USER_PRIVILEGE = "user_privilege" as string;

/**
 * @description get token form localStorage
 */
export const getToken = (): string | null => {
  return window.localStorage.getItem(ID_TOKEN_KEY);
};
export const saveUserPhone = (telephone: string): void => {
  window.localStorage.setItem(ID_PHONE_KEY, telephone);
};

/**
 * @description get privilige form localStorage
 */
export const getPrivilege = () => {
  const privlg = window.localStorage.getItem(USER_PRIVILEGE);
  let privlgTable= [];
  if (privlg != null) {
     privlgTable = JSON.parse(privlg) ;
  }
  return privlgTable;
};

export const destroyUserPrivilege = (): void => {
  window.localStorage.removeItem(USER_PRIVILEGE);
};
export const savePrivilege = (privilege: string): void => {
  window.localStorage.setItem(USER_PRIVILEGE, privilege);
};

export const getUserPhone = (): string | null => {
  return window.localStorage.getItem(ID_PHONE_KEY);
};

export const setUserEmail = (email: string): void => {
  window.localStorage.setItem(USER_EMAIL, email);
}

export const getUserEmail = (): string | null => {
  return window.localStorage.getItem(USER_EMAIL);
};

export const destroyUserEmail = (): void => {
  window.localStorage.removeItem(USER_EMAIL);
};

/**
 * @description get user form localStorage
 */
export const getUser = (): string | null => {
  return window.localStorage.getItem(ID_USER_KEY);
};

export const getUserName = (): string | null => {
  return window.localStorage.getItem(USER_NAME);
};

export const saveUserName = (name: string): void => {
  window.localStorage.setItem(USER_NAME, name);
};

export const destroyUserPhone = (): void => {
  window.localStorage.removeItem(ID_PHONE_KEY);
};

export const destroyUserName = (): void => {
  window.localStorage.removeItem(ID_PHONE_KEY);
};

/**
 * @description save token into localStorage
 * @param token: string
 */
export const saveToken = (token: string): void => {
  window.localStorage.setItem(ID_TOKEN_KEY, token);
};

/**
 * @description save user into localStorage
 * @param user: string
 */
export const saveUser = (user: string): void => {
  window.localStorage.setItem(ID_USER_KEY, user);
};

export const saveUserInfo = (user_info: string): void => {
  window.localStorage.setItem(USER_INFO, user_info);
};

export const getUserInfo = (): string | null => {
  return window.localStorage.getItem(USER_INFO);
};

export const destroyUserINfo = (): void => {
  window.localStorage.removeItem(USER_INFO);
};
/**
 * @description remove token form localStorage
 */
export const destroyToken = (): void => {
  window.localStorage.removeItem(ID_TOKEN_KEY);
};

/**
 * @description remove user form localStorage
 */
export const destroyUser = (): void => {
  window.localStorage.removeItem(ID_USER_KEY);
};

export default {destroyUserPrivilege,getPrivilege, savePrivilege, getToken,saveUserName,setUserEmail, getUserEmail,destroyUserEmail,getUserName,getUserPhone,saveUserPhone,destroyUserPhone,destroyUserName, saveToken, destroyToken, saveUser ,destroyUser,getUser };
