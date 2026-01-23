const SUPABASE_URL = "https://sbqyxvxpeqipcuavryhb.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNicXl4dnhwZXFpcGN1YXZyeWhiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkxNTk0NjcsImV4cCI6MjA4NDczNTQ2N30.XWbqg5fwC3TDFt-G79H-SGg-9WMdV08qkZ6OzdPK8f8";
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// 1. Router Function
function router(targetId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('page-active'));
    document.getElementById(targetId).classList.add('page-active');
    if (targetId === 'dashboard') loadDashboard();
}

// 2. Load Global Dashboard
async function loadDashboard() {
    const { data: projects } = await supabase.from('projects').select('*');
    const { data: expenses } = await supabase.from('expenses').select('amount');
    const { data: income } = await supabase.from('payments').select('amount');

    // Update Cards
    document.getElementById('count-ongoing').innerText = projects.filter(p => p.status === 'ongoing').length;
    document.getElementById('total-contract').innerText = "$" + projects.reduce((sum, p) => sum + (p.contract_value || 0), 0).toLocaleString();
    document.getElementById('total-expense').innerText = "$" + expenses.reduce((sum, e) => sum + (e.amount || 0), 0).toLocaleString();
    document.getElementById('total-income').innerText = "$" + income.reduce((sum, i) => sum + (i.amount || 0), 0).toLocaleString();

    // Project Dropdowns for Forms
    const dropdowns = ['exp-project', 'inc-project'];
    dropdowns.forEach(id => {
        document.getElementById(id).innerHTML = projects.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
    });

    // Dashboard Project List
    document.getElementById('project-list').innerHTML = projects.map(p => `
        <div onclick="viewProject('${p.id}')" class="bg-white p-4 rounded-xl border flex justify-between">
            <span class="font-bold">${p.name}</span>
            <span class="text-blue-600 font-bold">→</span>
        </div>
    `).join('');
}

// 3. Save Expense & Redirect
async function saveExpense() {
    const pId = document.getElementById('exp-project').value;
    const { error } = await supabase.from('expenses').insert([{
        project_id: pId,
        amount: parseFloat(document.getElementById('exp-amount').value),
        expense_type: document.getElementById('exp-type').value,
        details: document.getElementById('exp-detail').value,
        date: document.getElementById('exp-date').value
    }]);
    if (!error) viewProject(pId);
}

// 4. Save Income & Redirect
async function saveIncome() {
    const pId = document.getElementById('inc-project').value;
    const { error } = await supabase.from('payments').insert([{
        project_id: pId,
        amount: parseFloat(document.getElementById('inc-amount').value),
        received_at: document.getElementById('inc-date').value,
        details: document.getElementById('inc-detail').value
    }]);
    if (!error) viewProject(pId);
}

// 5. Specific Project Overview
async function viewProject(projectId) {
    router('project-view');
    const { data: project } = await supabase.from('projects').select('*').eq('id', projectId).single();
    const { data: expenses } = await supabase.from('expenses').select('amount').eq('project_id', projectId);
    const { data: income } = await supabase.from('payments').select('amount').eq('project_id', projectId);

    const totalExp = expenses.reduce((sum, e) => sum + e.amount, 0);
    const totalInc = income.reduce((sum, i) => sum + i.amount, 0);

    document.getElementById('view-project-name').innerText = project.name;
    document.getElementById('project-stats').innerHTML = `
        <div class="bg-white p-6 rounded-2xl border">
            <p class="text-sm text-gray-500">Contract Value: $${project.contract_value.toLocaleString()}</p>
            <div class="mt-4 flex justify-between">
                <span class="text-red-600 font-bold">Spent: $${totalExp.toLocaleString()}</span>
                <span class="text-green-600 font-bold">Received: $${totalInc.toLocaleString()}</span>
            </div>
            <div class="mt-6 p-4 bg-slate-100 rounded-xl">
                <p class="text-center font-black">Net Project Balance: $${(totalInc - totalExp).toLocaleString()}</p>
            </div>
        </div>
    `;
}

loadDashboard();
