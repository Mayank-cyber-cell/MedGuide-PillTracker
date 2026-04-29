const http = require('http');

async function run() {
  console.log("Registering user");
  const registerRes = await fetch("http://localhost:3000/api/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "Test User", email: "test" + Date.now() + "@example.com", password: "password123" })
  });
  const regData = await registerRes.json();
  console.log("Register response:", registerRes.status, regData);

  const loginRes = await fetch("http://localhost:3000/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: regData.error ? "test@example.com" : regData.email, password: "password123" })
  });
  
  const loginData = await loginRes.json();
  console.log("Login res:", loginData);

  if (!loginData.token) return;

  const addRes = await fetch("http://localhost:3000/api/medicines", {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      "Authorization": "Bearer " + loginData.token
    },
    body: JSON.stringify({
      name: "Tylenol",
      dosage: "500mg",
      frequency: "Daily",
      reminder_time: "08:00",
      days_of_week: "0,1,2,3,4,5,6",
      start_date: "2026-04-08",
      risk_level: "Low",
      side_effects: "None",
      total_reports: 0,
       serious_cases: 0
    })
  });

  console.log("Add response:", addRes.status, await addRes.text());
}

run();
