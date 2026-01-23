// REPLACE THESE WITH YOUR ACTUAL SUPABASE KEYS
const SUPABASE_URL = "https://sbqyxvxpeqipcuavryhb.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNicXl4dnhwZXFpcGN1YXZyeWhiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkxNTk0NjcsImV4cCI6MjA4NDczNTQ2N30.XWbqg5fwC3TDFt-G79H-SGg-9WMdV08qkZ6OzdPK8f8";
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// 1. ROUTER SYSTEM
function router(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('page-active'));
    document.getElementById(pageId).classList.add('page-active');
    
    // Auto-refresh data based on page
    if (pageId === 'dashboard') loadDashboard();
    if (pageId === 'projects-page') loadProjectsTab();
    if (pageId === 'add-expense' || pageId === 'add-income') populateProjectDropdowns();
}

// 2. DASHBOARD LOGIC (6 CARDS)
async function loadDashboard() {
    const { data: projects } = await supabase.from('projects').select('*');
    const { data: expenses } = await supabase.from('expenses').select('amount');
    const { data: income } = await supabase.from('payments').select('amount');

    const totalEx = expenses.reduce((s, e) => s + (e.amount || 0), 0);
    const totalIn = income.reduce((s, i) => s + (i.amount || 0), 0);
    const totalPortfolio = projects.reduce((s, p) => s + (p.contract_value || 0), 0);

    // Update the UI Cards
    document.getElementById('stat-portfolio').innerText = "$" + totalPortfolio.toLocaleString();
    document.getElementById('stat-active').innerText = projects.filter(p => p.status === 'ongoing').length;
    document.getElementById('stat-done').innerText = projects.filter(p => p.status === 'completed').length;
    document.getElementById('stat-income').innerText = "$" + totalIn.toLocaleString();
    document.getElementById('stat-expense').innerText = "$" + totalEx.toLocaleString();
    document.getElementById('stat-balance').innerText = "$" + (totalIn - totalEx).toLocaleString();
}

// 3. PROJECTS TAB LOGIC
async function loadProjectsTab() {
    const { data: projects } = await supabase.from('projects').select('*').order('created_at', { ascending: false });
    const container = document.getElementById('all-projects-list');
    
    container.innerHTML = projects.map(p => `
        <div onclick="viewProject('${p.id}')" class="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex justify-between items-center active:scale-95 transition-transform">
            <div>
                <h4 class="font-black text-slate-800 text-lg">${p.name}</h4>
                <p class="text-[10px] text-slate-400 font-bold uppercase tracking-wider">${p.location || 'Site Location N/A'}</p>
            </div>
            <div class="text-right">
                <p class="text-xs font-black text-slate-900">$${p.contract_value?.toLocaleString()}</p>
                <span class="text-[8px] px-2 py-0.5 rounded-full font-bold uppercase ${p.status === 'ongoing' ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'}">
                    ${p.status}
                </span>
            </div>
        </div>
    `).join('') || '<p class="text-slate-400 text-center py-10">No projects found.</p>';
}

// 4. ADD PROJECT LOGIC
async function saveNewProject() {
    const name = document.getElementById('p-name').value;
    const value = document.getElementById('p-contract').value;
    const location = document.getElementById('p-loc').value;

    if(!name || !value) return alert("Please fill Name and Value");

    const { error } = await supabase.from('projects').insert([{
        name, contract_value: parseFloat(value), location, status: 'ongoing'
    }]);

    if (!error) {
        alert("Project Created!");
        router('projects-page');
        document.getElementById('p-name').value = '';
        document.getElementById('p-contract').value = '';
    }
}

// 5. TRANSACTION LOGIC (INCOME/EXPENSE) + REDIRECT
async function populateProjectDropdowns() {
    const { data } = await supabase.from('projects').select('id, name');
    const options = data.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
    document.getElementById('exp-p-id').innerHTML = options;
    document.getElementById('inc-p-id').innerHTML = options;
}

async function saveTransaction(type) {
    const pId = type === 'expense' ? document.getElementById('exp-p-id').value : document.getElementById('inc-p-id').value;
    const amt = type === 'expense' ? document.getElementById('exp-amt').value : document.getElementById('inc-amt').value;
    const date = type === 'expense' ? document.getElementById('exp-date').value : document.getElementById('inc-date').value;
    const note = type === 'expense' ? document.getElementById('exp-note').value : document.getElementById('inc-note').value;
    
    if(!amt) return alert("Enter amount");

    let error;
    if (type === 'expense') {
        const res = await supabase.from('expenses').insert([{
            project_id: pId, amount: parseFloat(amt), date, expense_type: document.getElementById('exp-category').value, details: note
        }]);
        error = res.error;
    } else {
        const res = await supabase.from('payments').insert([{
            project_id: pId, amount: parseFloat(amt), received_at: date, details: note
        }]);
        error = res.error;
    }

    if (!error) {
        // Redirection to specific project overview
        viewProject(pId); 
    } else {
        alert("Error: " + error.message);
    }
}

// 6. DETAIL VIEW LOGIC
async function viewProject(id) {
    router('project-detail');
    const { data: project } = await supabase.from('projects').select('*').eq('id', id).single();
    const { data: ex } = await supabase.from('expenses').select('*').eq('project_id', id);
    const { data: pay } = await supabase.from('payments').select('*').eq('project_id', id);

    const totalEx = ex.reduce((s, e) => s + (e.amount || 0), 0);
    const totalIn = pay.reduce((s, i) => s + (i.amount || 0), 0);

    // Render Header
    document.getElementById('detail-header').innerHTML = `
        <h2 class="text-3xl font-black text-slate-900">${project.name}</h2>
        <p class="text-slate-400 font-bold text-xs uppercase">${project.location || ''}</p>
    `;

    // Render Financial Summary
    document.getElementById('detail-stats').innerHTML = `
        <div class="bg-slate-900 text-white p-6 rounded-[2rem] shadow-xl">
            <p class="text-[10px] uppercase opacity-50 font-bold">Current Site Balance</p>
            <p class="text-3xl font-black">$${(totalIn - totalEx).toLocaleString()}</p>
            <div class="flex justify-between mt-6 pt-4 border-t border-slate-700">
                <div class="text-xs">
                    <p class="opacity-50 uppercase tracking-tighter">Total Spent</p>
                    <p class="font-bold text-red-400">-$${totalEx.toLocaleString()}</p>
                </div>
                <div class="text-xs text-right">
                    <p class="opacity-50 uppercase tracking-tighter">Total Received</p>
                    <p class="font-bold text-green-400">+$${totalIn.toLocaleString()}</p>
                </div>
            </div>
        </div>
    `;

    // Render Transaction Logs
    const allLogs = [
        ...ex.map(e => ({ ...e, type: 'EXP', color: 'text-red-500' })),
        ...pay.map(p => ({ ...p, type: 'INC', color: 'text-green-500', expense_type: 'Payment Received' }))
    ].sort((a,b) => new Date(b.created_at) - new Date(a.created_at));

    document.getElementById('detail-logs').innerHTML = allLogs.map(l => `
        <div class="bg-white p-4 rounded-2xl flex justify-between items-center shadow-sm text-sm">
            <div>
                <p class="font-bold">${l.expense_type}</p>
                <p class="text-[10px] text-slate-400">${new Date(l.date || l.received_at).toLocaleDateString()}</p>
            </div>
            <p class="font-black ${l.color}">${l.type === 'EXP' ? '-' : '+'}$${l.amount.toLocaleString()}</p>
        </div>
    `).join('') || '<p class="text-center text-slate-300 py-4 text-xs">No transactions yet.</p>';
}

// Initial Load
loadDashboard();
