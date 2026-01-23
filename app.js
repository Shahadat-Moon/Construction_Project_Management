const SUPABASE_URL = "https://sbqyxvxpeqipcuavryhb.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNicXl4dnhwZXFpcGN1YXZyeWhiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkxNTk0NjcsImV4cCI6MjA4NDczNTQ2N30.XWbqg5fwC3TDFt-G79H-SGg-9WMdV08qkZ6OzdPK8f8";
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Navigation Logic
function showPage(pageId) {
    document.querySelectorAll('section').forEach(s => s.classList.replace('active-page', 'hidden-page'));
    document.getElementById('page-' + pageId).classList.replace('hidden-page', 'active-page');
    document.getElementById('page-title').innerText = pageId.charAt(0).toUpperCase() + pageId.slice(1);
}

// Modal Logic
function openModal() { document.getElementById('entryModal').style.display = 'flex'; }
function closeModal() { document.getElementById('entryModal').style.display = 'none'; }

// Fetch Dashboard Data
async function loadDashboard() {
    // 1. Load Projects into Modal and Dashboard Cards
    const { data: projects } = await supabase.from('projects').select('*');
    
    // Populate Modal Dropdown
    const select = document.getElementById('modalProject');
    select.innerHTML = projects.map(p => `<option value="${p.id}">${p.name}</option>`).join('');

    // Render Ongoing Project Cards
    const cardContainer = document.getElementById('ongoing-cards');
    cardContainer.innerHTML = projects.filter(p => p.status === 'ongoing').map(p => `
        <div class="bg-white p-5 rounded-3xl shadow-sm flex justify-between items-center border border-gray-100">
            <div>
                <p class="font-black text-slate-800">${p.name}</p>
                <p class="text-[10px] text-gray-400">Budget: $${p.contract_value.toLocaleString()}</p>
            </div>
            <div class="h-2 w-16 bg-gray-200 rounded-full overflow-hidden">
                <div class="h-full bg-orange-500" style="width: 45%"></div>
            </div>
        </div>
    `).join('');
}

// Save Entry based on Type
async function saveEntry() {
    const type = document.getElementById('modalType').value;
    const project = document.getElementById('modalProject').value;
    const amount = document.getElementById('modalAmount').value;

    const table = type === 'expense' ? 'expenses' : 'payments';
    
    const { error } = await supabase.from(table).insert([{ 
        project_id: project, 
        amount: parseFloat(amount) 
    }]);

    if (!error) {
        alert("Success!");
        closeModal();
        loadDashboard();
    }
}

loadDashboard();
