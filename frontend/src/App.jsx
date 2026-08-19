import { useEffect, useState } from "react";

import { createConfig, deleteConfig, getConfig, listConfigs, updateConfig } from "./api/configApi";
import { createDefaultConfig } from "./data/defaultConfig";
import { logout, subscribeToAuth } from "./firebase";
import ConfigEditor from "./pages/ConfigEditor";
import Dashboard from "./pages/Dashboard";
import LoginPage from "./pages/LoginPage";

export default function App() {
  const [configs, setConfigs] = useState([]);
  const [activeConfig, setActiveConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");

  async function refreshConfigs() {
    setLoading(true);
    setError("");
    try {
      setConfigs(await listConfigs());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const unsubscribe = subscribeToAuth((u) => {
      setUser(u);
      if (u) {
        refreshConfigs();
      } else {
        setConfigs([]);
        setActiveConfig(null);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  async function handleCreate() {
    const name = window.prompt("Config name", "My Resume Config");
    if (!name) {
      return;
    }

    const created = await createConfig({
      name,
      description: "",
      snapshot_json: createDefaultConfig(),
      message: "Initial config"
    });
    await refreshConfigs();
    setActiveConfig(created);
  }

  async function handleOpen(configId) {
    setActiveConfig(await getConfig(configId));
  }

  async function handleRename(config) {
    const name = window.prompt("New config name", config.name);
    if (!name || name === config.name) {
      return;
    }
    await updateConfig(config.id, { name });
    await refreshConfigs();
    if (activeConfig?.id === config.id) {
      setActiveConfig(await getConfig(config.id));
    }
  }

  async function handleDelete(config) {
    if (!window.confirm(`Delete "${config.name}"?`)) {
      return;
    }
    await deleteConfig(config.id);
    if (activeConfig?.id === config.id) {
      setActiveConfig(null);
    }
    await refreshConfigs();
  }

  if (!user) {
    return <LoginPage />;
  }

  if (activeConfig) {
    return (
      <ConfigEditor
        config={activeConfig}
        onBack={async () => {
          setActiveConfig(null);
          await refreshConfigs();
        }}
        onConfigChange={setActiveConfig}
      />
    );
  }

  return (
    <Dashboard
      configs={configs}
      error={error}
      loading={loading}
      user={user}
      onLogout={logout}
      onCreate={handleCreate}
      onDelete={handleDelete}
      onOpen={handleOpen}
      onRefresh={refreshConfigs}
      onRename={handleRename}
    />
  );
}
