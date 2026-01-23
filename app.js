const SUPABASE_URL = "YOUR_SUPABASE_URL_HERE";
const SUPABASE_KEY = "YOUR_ANON_KEY_HERE";
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let selectedType = "Expense";

// 1. Fetch Projects from your Backend
async function loadProjects() {
  const { data, error } = await supabase.from('projects').select('*');
  if (data) {
    const select = document.getElementById('projectSelect');
    select.innerHTML = data.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
  }
}

// 2. Set Income vs Expense
function setType(type) {
  selectedType = type;
  document.getElementById('btnExp').style.opacity = type === 'Expense' ? "1" : "0.5";
  document.getElementById('btnInc').style.opacity = type === 'Income' ? "1" : "0.5";
}

// 3. Save to Database
document.getElementById('submitBtn').onclick = async () => {
  const projectId = document.getElementById('projectSelect').value;
  const amount = document.getElementById('amount').value;

  if (!amount) return alert("Enter amount!");

  const { error } = await supabase.from('entries').insert([
    { project_id: projectId, amount: parseFloat(amount), type: selectedType }
  ]);

  if (error) alert("Error: " + error.message);
  else {
    alert("Saved Successfully!");
    document.getElementById('amount').value = "";
  }
};

loadProjects();
