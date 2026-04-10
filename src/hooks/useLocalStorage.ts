import { useState, useEffect } from 'react';
import { secureStorage, STORAGE_KEYS } from '../utils/storage.utils';

export const useLocalStorage = () => {
  const [apiKey, setApiKeyState] = useState(() => secureStorage.getItem(STORAGE_KEYS.API_KEY));
  const [baseUrl, setBaseUrlState] = useState(
    () => secureStorage.getItem(STORAGE_KEYS.BASE_URL) || 'https://api.openai.com/v1'
  );
  const [model, setModelState] = useState(
    () => secureStorage.getItem(STORAGE_KEYS.MODEL) || 'gpt-4o'
  );
  const [customBaseUrl, setCustomBaseUrlState] = useState(
    () => secureStorage.getItem(STORAGE_KEYS.CUSTOM_BASE_URL)
  );
  const [customModelId, setCustomModelIdState] = useState(
    () => secureStorage.getItem(STORAGE_KEYS.CUSTOM_MODEL_ID)
  );
  const [apiServerUrl, setApiServerUrlState] = useState(
    () => secureStorage.getItem(STORAGE_KEYS.API_SERVER_URL) || 'http://localhost:3100'
  );
  const [adminSecret, setAdminSecretState] = useState(
    () => secureStorage.getItem(STORAGE_KEYS.ADMIN_SECRET)
  );

  useEffect(() => { secureStorage.setItem(STORAGE_KEYS.API_KEY, apiKey); }, [apiKey]);
  useEffect(() => { secureStorage.setItem(STORAGE_KEYS.BASE_URL, baseUrl); }, [baseUrl]);
  useEffect(() => { secureStorage.setItem(STORAGE_KEYS.MODEL, model); }, [model]);
  useEffect(() => { secureStorage.setItem(STORAGE_KEYS.CUSTOM_BASE_URL, customBaseUrl); }, [customBaseUrl]);
  useEffect(() => { secureStorage.setItem(STORAGE_KEYS.CUSTOM_MODEL_ID, customModelId); }, [customModelId]);
  useEffect(() => { secureStorage.setItem(STORAGE_KEYS.API_SERVER_URL, apiServerUrl); }, [apiServerUrl]);
  useEffect(() => { secureStorage.setItem(STORAGE_KEYS.ADMIN_SECRET, adminSecret); }, [adminSecret]);

  return {
    apiKey, setApiKey: setApiKeyState,
    baseUrl, setBaseUrl: setBaseUrlState,
    model, setModel: setModelState,
    customBaseUrl, setCustomBaseUrl: setCustomBaseUrlState,
    customModelId, setCustomModelId: setCustomModelIdState,
    apiServerUrl, setApiServerUrl: setApiServerUrlState,
    adminSecret, setAdminSecret: setAdminSecretState,
  };
};