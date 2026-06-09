import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'authToken';
const USER_TYPE_KEY = 'userType';
const USER_ID_KEY = 'userId';

export const getToken = async (): Promise<string | null> => {
  return SecureStore.getItemAsync(TOKEN_KEY);
};

export const setToken = async (token: string): Promise<void> => {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
};

export const removeToken = async (): Promise<void> => {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
};

export const getUserType = async (): Promise<string | null> => {
  return SecureStore.getItemAsync(USER_TYPE_KEY);
};

export const setUserType = async (type: string): Promise<void> => {
  await SecureStore.setItemAsync(USER_TYPE_KEY, type);
};

export const getUserId = async (): Promise<string | null> => {
  return SecureStore.getItemAsync(USER_ID_KEY);
};

export const setUserId = async (id: string): Promise<void> => {
  await SecureStore.setItemAsync(USER_ID_KEY, id);
};

export const logout = async (): Promise<void> => {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
  await SecureStore.deleteItemAsync(USER_TYPE_KEY);
  await SecureStore.deleteItemAsync(USER_ID_KEY);
};
