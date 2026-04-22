const API_BASE = "https://TON-API.ngrok.io";

function hex(buffer) {
  return [...new Uint8Array(buffer)]
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

async function sha256(file) {
  const buf = await file.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", buf);
  return hex(digest);
}

async function stamp() {
  const file = document.getElementById("fileInput").files[0];
  if (!file) return alert("Choisis un fichier");

  const result = document.getElementById("result");
  result.textContent = "Calcul du hash…";

  const hash = await sha256(file);
  result.textContent = "Hash : " + hash + "\nEnvoi au serveur…";

  const res = await fetch(`${API_BASE}/timestamp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ hash })
  });

  const data = await res.json();
  result.textContent += `\nID : ${data.id}\nStatus : ${data.status}`;

  // Téléchargement automatique du .ots
  const proofRes = await fetch(`${API_BASE}/timestamp/${data.id}/proof`);
  const blob = await proofRes.blob();
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `${data.id}.ots`;
  a.click();

  result.textContent += `\nPreuve téléchargée : ${data.id}.ots`;

  // Vérification côté navigateur
  result.textContent += "\nVérification locale…";

  try {
    const verifyRes = await fetch(`${API_BASE}/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        hash,
        ots: await blobToBase64(blob)
      })
    });

    const verifyData = await verifyRes.json();
    result.textContent += `\nVérifié : ${verifyData.verified}`;
  } catch (e) {
    result.textContent += "\nErreur de vérification locale.";
  }
}

function blobToBase64(blob) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result.split(",")[1]);
    reader.readAsDataURL(blob);
  });
}
