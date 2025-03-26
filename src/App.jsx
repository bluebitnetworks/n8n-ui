/** Claude Assistant UI with Deploy-to-n8n Support (API Key via .env) */
import { useState } from "react";

export default function App() {
  const [message, setMessage] = useState("");
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [deployStatus, setDeployStatus] = useState("");

  async function sendToMCP() {
    setLoading(true);
    setResponse(null);
    setDeployStatus("");

    try {
      const res = await fetch("http://localhost:5050/mcp/task", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_message: message,
          task_type: "build"
        })
      });
      const json = await res.json();
      setResponse(json);
    } catch (err) {
      setResponse({ error: "Failed to reach MCP." });
    } finally {
      setLoading(false);
    }
  }

  async function deployToN8N(workflowJson) {
    setDeployStatus("Deploying...");
    try {
      const res = await fetch(`${import.meta.env.VITE_N8N_API_URL}/workflows`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${import.meta.env.VITE_N8N_API_KEY}`
        },
        body: JSON.stringify(workflowJson)
      });

      if (res.ok) {
        const json = await res.json();
        setDeployStatus(`✅ Workflow deployed with ID: ${json.id}`);
      } else {
        const err = await res.text();
        setDeployStatus(`❌ Deploy failed: ${err}`);
      }
    } catch (err) {
      setDeployStatus(`❌ Error: ${err.message}`);
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold">Claude → n8n Assistant</h1>
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        className="w-full p-2 border rounded text-sm"
        rows={5}
        placeholder="Describe the workflow you want Claude to build..."
      />
      <button
        onClick={sendToMCP}
        disabled={loading}
        className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800"
      >
        {loading ? "Thinking..." : "Send to Claude"}
      </button>

      {response && (
        <>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
            {JSON.stringify(response, null, 2)}
          </pre>

          {response.workflow_json && (
            <button
              onClick={() => deployToN8N(response.workflow_json)}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 mt-2"
            >
              🚀 Deploy to n8n
            </button>
          )}
        </>
      )}

      {deployStatus && (
        <p className="text-sm font-medium text-blue-600">{deployStatus}</p>
      )}
    </div>
  );
}
