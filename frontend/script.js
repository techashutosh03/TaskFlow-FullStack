// ==========================================
// API CONFIGURATION
// ==========================================
const API_URL = 'https://taskflow-fullstack-1-3f1f.onrender.com';

// ==========================================
// STATE
// ==========================================
let allTasks = [];
let activeFilter = "all";
let taskToDelete = null;
let taskDependencies = {};
let blockedTasks = new Set();
let customTemplates = [];
let currentDepTaskId = null;
let currentGroup = "none";
let pomodoroInterval = null;
let pomodoroTime = 25 * 60;
let isPomodoroRunning = false;
let focusModeActive = false;
let selectedTaskId = null;

// Gamification State
let userStats = {
    level: 1,
    xp: 0,
    coins: 0,
    tasksCompleted: 0,
    streak: 0,
    lastCompletionDate: null
};

// ==========================================
// DOM ELEMENTS
// ==========================================
const taskList = document.getElementById("taskList");
const taskForm = document.getElementById("taskForm");
const taskInput = document.getElementById("taskInput");
const searchInput = document.getElementById("searchInput");
const categorySelect = document.getElementById("categorySelect");
const prioritySelect = document.getElementById("prioritySelect");
const groupSelect = document.getElementById("groupSelect");

// Modal Elements
const deleteModal = document.getElementById("deleteModal");
const cancelBtn = document.getElementById("cancelDeleteBtn");
const confirmDeleteBtn = document.getElementById("confirmDeleteBtn");
const deleteTaskTitle = document.getElementById("deleteTaskTitle");

// Dependency Modal Elements
const dependencyModal = document.getElementById("dependencyModal");
const depSelect = document.getElementById("depSelect");
const depTaskName = document.getElementById("depTaskName");
const currentDeps = document.getElementById("currentDeps");
const closeDepBtn = document.getElementById("closeDepModal");
const addDepBtn = document.getElementById("addDepBtn");

// Template Modal Elements
const templateModal = document.getElementById("templateModal");
const closeTemplateBtn = document.getElementById("closeTemplateModal");
const saveTemplateBtn = document.getElementById("saveTemplateBtn");
const templateNameInput = document.getElementById("templateName");
const templateTasksInput = document.getElementById("templateTasks");
const templateCategorySelect = document.getElementById("templateCategory");

// Focus Mode Elements
const focusToggle = document.getElementById("focusToggle");
const focusLabel = document.getElementById("focusLabel");
const pomodoroDisplay = document.getElementById("pomodoroDisplay");
const pomodoroTimeDisplay = document.getElementById("pomodoroTime");
const pomodoroStart = document.getElementById("pomodoroStart");
const pomodoroReset = document.getElementById("pomodoroReset");

// Gamification Elements
const userLevel = document.getElementById("userLevel");
const userXP = document.getElementById("userXP");
const userCoins = document.getElementById("userCoins");
const xpProgress = document.getElementById("xpProgress");
const nextLevelXP = document.getElementById("nextLevelXP");

// ==========================================
// ICON MAPPING
// ==========================================
const icons = {
    Work: "briefcase-business",
    Shopping: "shopping-cart",
    Study: "book-open",
    Personal: "user"
};

// ==========================================
// TEMPLATES
// ==========================================
const templates = {
    weekly: {
        name: 'Weekly Report',
        tasks: ['Collect data from team', 'Analyze weekly metrics', 'Create presentation', 'Write summary', 'Send report to manager']
    },
    project: {
        name: 'Project Plan',
        tasks: ['Define project scope', 'Set timeline and milestones', 'Assign team roles', 'Create budget', 'Set up project management tools', 'Kickoff meeting']
    },
    study: {
        name: 'Study Session',
        tasks: ['Review notes from last session', 'Read chapter', 'Take practice quiz', 'Review mistakes', 'Create summary flashcards']
    },
    event: {
        name: 'Event Planning',
        tasks: ['Choose venue', 'Send invitations', 'Plan menu', 'Arrange decorations', 'Confirm RSVPs', 'Create schedule', 'Follow up with attendees']
    }
};

// ==========================================
// GAMIFICATION SYSTEM
// ==========================================
function loadGamification() {
    try {
        const saved = localStorage.getItem('userStats');
        if (saved) {
            userStats = JSON.parse(saved);
            updateGamificationUI();
        }
    } catch (e) {
        console.error('Error loading gamification:', e);
    }
}

function saveGamification() {
    localStorage.setItem('userStats', JSON.stringify(userStats));
}

function updateGamificationUI() {
    userLevel.textContent = userStats.level;
    userXP.textContent = userStats.xp;
    userCoins.textContent = userStats.coins;
    
    const xpNeeded = userStats.level * 100;
    const progress = Math.min((userStats.xp / xpNeeded) * 100, 100);
    xpProgress.style.width = progress + '%';
    nextLevelXP.textContent = xpNeeded;
}

function addXP(amount) {
    userStats.xp += amount;
    let xpNeeded = userStats.level * 100;
    
    // Level up
    while (userStats.xp >= xpNeeded) {
        userStats.xp -= xpNeeded;
        userStats.level++;
        xpNeeded = userStats.level * 100;
        // Bonus coins on level up
        userStats.coins += userStats.level * 5;
        showNotification(`🎉 Level Up! You're now level ${userStats.level}!`);
        
        // Confetti effect
        createConfetti();
    }
    
    saveGamification();
    updateGamificationUI();
}

function addCoins(amount) {
    userStats.coins += amount;
    saveGamification();
    updateGamificationUI();
}

function createConfetti() {
    const colors = ['#f4c04d', '#e74c3c', '#2ecc71', '#3498db', '#9b59b6', '#f39c12'];
    for (let i = 0; i < 50; i++) {
        const confetti = document.createElement('div');
        confetti.style.cssText = `
            position: fixed;
            width: 10px;
            height: 10px;
            background: ${colors[Math.floor(Math.random() * colors.length)]};
            left: ${Math.random() * 100}vw;
            top: -10px;
            border-radius: ${Math.random() > 0.5 ? '50%' : '2px'};
            z-index: 99999;
            pointer-events: none;
            animation: confettiFall ${2 + Math.random() * 2}s linear forwards;
        `;
        document.body.appendChild(confetti);
        setTimeout(() => confetti.remove(), 4000);
    }
}

// Add confetti animation to style.css dynamically
const confettiStyle = document.createElement('style');
confettiStyle.textContent = `
    @keyframes confettiFall {
        0% { transform: translateY(0) rotate(0deg) scale(1); opacity: 1; }
        100% { transform: translateY(100vh) rotate(720deg) scale(0.5); opacity: 0; }
    }
`;
document.head.appendChild(confettiStyle);

function showNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: rgba(20, 20, 35, 0.95);
        backdrop-filter: blur(12px);
        border: 1px solid var(--gold);
        border-radius: 12px;
        padding: 16px 24px;
        color: white;
        font-weight: 600;
        z-index: 99999;
        animation: slideIn 0.5s ease;
        box-shadow: 0 8px 32px rgba(0,0,0,0.3);
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.5s ease forwards';
        setTimeout(() => notification.remove(), 500);
    }, 3000);
}

// Add notification animations
const notifStyle = document.createElement('style');
notifStyle.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100px); opacity: 0; }
    }
`;
document.head.appendChild(notifStyle);

// ==========================================
// LOAD TASKS
// ==========================================
async function loadTasks() {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error('Failed to fetch tasks');
        allTasks = await response.json();
        loadDependencies();
        updateBlockedTasks();
        renderTasks();
        updateCounts();
        updateCategoryCounts();
        updateAnalytics();
        renderDependencies();
    } catch (error) {
        console.error('Error loading tasks:', error);
        taskList.innerHTML = `
            <div class="empty-state">
                <i data-lucide="alert-circle"></i>
                <h3>Connection Error</h3>
                <p>Make sure the backend server is running on http://localhost:3000</p>
            </div>
        `;
        lucide.createIcons();
    }
}

// ==========================================
// RENDER TASKS WITH GROUPING
// ==========================================
function renderTasks() {
    const search = searchInput.value.toLowerCase();

    let filtered = allTasks.filter(task => {
        const matchesSearch = task.title.toLowerCase().includes(search);
        const matchesFilter =
            activeFilter === "all" ||
            (activeFilter === "pending" && task.status === "Pending") ||
            (activeFilter === "completed" && task.status === "Completed");
        return matchesSearch && matchesFilter;
    });

    // Apply grouping
    let groupedTasks = {};
    if (currentGroup !== "none") {
        filtered.forEach(task => {
            let key;
            if (currentGroup === "category") key = task.category || 'General';
            else if (currentGroup === "priority") key = task.priority || 'Medium';
            else if (currentGroup === "status") key = task.status || 'Pending';
            if (!groupedTasks[key]) groupedTasks[key] = [];
            groupedTasks[key].push(task);
        });
    }

    if (filtered.length === 0) {
        taskList.innerHTML = `
            <div class="empty-state">
                <i data-lucide="inbox"></i>
                <h3>No tasks found</h3>
                <p>${allTasks.length === 0 ? 'Add a new task to get started!' : 'Try changing your filters.'}</p>
            </div>
        `;
        lucide.createIcons();
        return;
    }

    let html = '';

    if (currentGroup !== "none") {
        // Grouped view
        for (const [groupName, tasks] of Object.entries(groupedTasks)) {
            html += `
                <div class="group-header" style="padding: 10px 0; margin-top: 10px; border-bottom: 2px solid rgba(255,215,135,0.1);">
                    <h4 style="color: var(--gold); font-size: 18px;">${groupName} (${tasks.length})</h4>
                </div>
            `;
            html += tasks.map(task => renderTaskItem(task)).join('');
        }
    } else {
        // Flat view
        html = filtered.map(task => renderTaskItem(task)).join('');
    }

    taskList.innerHTML = html;
    lucide.createIcons();
}

function renderTaskItem(task) {
    const isBlocked = blockedTasks.has(task._id);
    const isCompleted = task.status === 'Completed';
    const isActive = selectedTaskId === task._id;
    
    return `
        <article class="task-row ${isCompleted ? 'done' : ''} ${isBlocked ? 'blocked' : ''} ${isActive ? 'active-task' : ''}" 
                 onclick="selectTask('${task._id}')">
            <button class="check ${isCompleted ? 'done' : ''}" onclick="event.stopPropagation(); toggleTask('${task._id}')" ${isBlocked ? 'disabled style="opacity:0.3;cursor:not-allowed;"' : ''}>
                ${isCompleted ? '<i data-lucide="check"></i>' : ''}
            </button>

            <div>
                <h3>${escapeHtml(task.title)} ${isBlocked ? '🔒' : ''}</h3>
                <span class="category">
                    <i data-lucide="${icons[task.category] || 'folder'}"></i>
                    ${task.category || 'General'}
                </span>
                ${isBlocked ? `<span style="color:#e74c3c;font-size:12px;margin-left:10px;">⛔ Blocked</span>` : ''}
            </div>

            <span class="date">
                <i data-lucide="calendar-days"></i>
                ${new Date(task.createdAt).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric' 
                })}
            </span>

            <span class="priority ${task.priority.toLowerCase()}">
                <i data-lucide="flag"></i>
                ${task.priority}
            </span>

            <button class="row-btn" onclick="event.stopPropagation(); editTask('${task._id}')">
                <i data-lucide="pencil"></i>
            </button>

            <button class="row-btn dep-btn" onclick="event.stopPropagation(); openDependencyModal('${task._id}')" title="Manage dependencies">
                <i data-lucide="link"></i>
            </button>

            <button class="row-btn" onclick="event.stopPropagation(); openDeleteModal('${task._id}')">
                <i data-lucide="trash-2"></i>
            </button>
        </article>
    `;
}

// ==========================================
// SELECT TASK FOR FOCUS MODE
// ==========================================
function selectTask(taskId) {
    selectedTaskId = taskId;
    if (focusModeActive) {
        renderTasks();
    }
}

// ==========================================
// UPDATE COUNTS
// ==========================================
function updateCounts() {
    const total = allTasks.length;
    const completed = allTasks.filter(task => task.status === 'Completed').length;
    const pending = allTasks.filter(task => task.status === 'Pending').length;
    const important = allTasks.filter(task => task.priority === 'High').length;

    document.getElementById("allCount").textContent = total;
    document.getElementById("pendingCount").textContent = pending;
    document.getElementById("completedCount").textContent = completed;

    document.getElementById("totalStat").textContent = total;
    document.getElementById("pendingStat").textContent = pending;
    document.getElementById("completedStat").textContent = completed;
    document.getElementById("importantStat").textContent = important;
}

// ==========================================
// UPDATE CATEGORY COUNTS
// ==========================================
function updateCategoryCounts() {
    const categories = ['Work', 'Personal', 'Study', 'Shopping'];
    categories.forEach(cat => {
        const count = allTasks.filter(task => task.category === cat).length;
        const element = document.getElementById(cat.toLowerCase() + 'Count');
        if (element) element.textContent = count;
    });
}

// ==========================================
// TOGGLE TASK
// ==========================================
async function toggleTask(id) {
    const task = allTasks.find(t => t._id === id);
    if (!task) return;

    if (blockedTasks.has(id)) {
        alert('⚠️ This task is blocked by dependencies! Complete the dependent tasks first.');
        return;
    }

    const newStatus = task.status === 'Completed' ? 'Pending' : 'Completed';

    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
        });

        if (!response.ok) throw new Error('Failed to update task');
        
        // Gamification: Award XP for completing task
        if (newStatus === 'Completed') {
            const xpGain = task.priority === 'High' ? 30 : task.priority === 'Medium' ? 20 : 10;
            addXP(xpGain);
            addCoins(task.priority === 'High' ? 5 : task.priority === 'Medium' ? 3 : 1);
            showNotification(`✅ Task completed! +${xpGain} XP, +${task.priority === 'High' ? 5 : task.priority === 'Medium' ? 3 : 1} coins`);
        }
        
        await loadTasks();
    } catch (error) {
        console.error('Error updating task:', error);
        alert('Failed to update task. Make sure backend is running.');
    }
}

// ==========================================
// EDIT TASK
// ==========================================
function editTask(id) {
    const task = allTasks.find(t => t._id === id);
    if (!task) return;

    taskInput.value = task.title;
    categorySelect.value = task.category || 'Work';
    prioritySelect.value = task.priority || 'Medium';
    taskInput.focus();
    taskInput.dataset.editId = id;
    
    const submitBtn = document.querySelector('.submit-btn');
    submitBtn.textContent = 'Update Task';
    taskForm.dataset.mode = 'edit';
}

// ==========================================
// DELETE MODAL FUNCTIONS
// ==========================================
function openDeleteModal(taskId) {
    const task = allTasks.find(t => t._id === taskId);
    if (!task) return;
    
    taskToDelete = taskId;
    deleteTaskTitle.textContent = `"${escapeHtml(task.title)}"`;
    deleteModal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeDeleteModal() {
    deleteModal.classList.remove('active');
    document.body.style.overflow = '';
    taskToDelete = null;
}

async function confirmDeleteTask() {
    if (!taskToDelete) return;
    
    try {
        const response = await fetch(`${API_URL}/${taskToDelete}`, {
            method: 'DELETE'
        });

        if (!response.ok) throw new Error('Failed to delete task');
        
        delete taskDependencies[taskToDelete];
        saveDependencies();
        
        closeDeleteModal();
        await loadTasks();
    } catch (error) {
        console.error('Error deleting task:', error);
        alert('Failed to delete task. Make sure backend is running.');
        closeDeleteModal();
    }
}

// ==========================================
// DELETE MODAL EVENT LISTENERS
// ==========================================
if (cancelBtn) {
    cancelBtn.addEventListener('click', closeDeleteModal);
}

if (confirmDeleteBtn) {
    confirmDeleteBtn.addEventListener('click', confirmDeleteTask);
}

if (deleteModal) {
    deleteModal.addEventListener('click', function(e) {
        if (e.target === this) {
            closeDeleteModal();
        }
    });
}

// ==========================================
// TASK DEPENDENCIES
// ==========================================
function loadDependencies() {
    try {
        const saved = localStorage.getItem('taskDependencies');
        if (saved) {
            taskDependencies = JSON.parse(saved);
        }
    } catch (e) {
        console.error('Error loading dependencies:', e);
    }
}

function saveDependencies() {
    localStorage.setItem('taskDependencies', JSON.stringify(taskDependencies));
    updateBlockedTasks();
    renderTasks();
    renderDependencies();
}

function updateBlockedTasks() {
    blockedTasks.clear();
    for (const [taskId, deps] of Object.entries(taskDependencies)) {
        if (deps.length > 0) {
            const allCompleted = deps.every(depId => {
                const task = allTasks.find(t => t._id === depId);
                return task && task.status === 'Completed';
            });
            if (!allCompleted) {
                blockedTasks.add(taskId);
            }
        }
    }
}

function addDependency(taskId, dependencyId) {
    if (!taskDependencies[taskId]) {
        taskDependencies[taskId] = [];
    }
    if (!taskDependencies[taskId].includes(dependencyId) && taskId !== dependencyId) {
        taskDependencies[taskId].push(dependencyId);
        saveDependencies();
    }
}

function removeDependency(taskId, dependencyId) {
    if (taskDependencies[taskId]) {
        taskDependencies[taskId] = taskDependencies[taskId].filter(id => id !== dependencyId);
        if (taskDependencies[taskId].length === 0) {
            delete taskDependencies[taskId];
        }
        saveDependencies();
    }
}

function getBlockingTasks(taskId) {
    if (!taskDependencies[taskId]) return [];
    return taskDependencies[taskId]
        .map(id => allTasks.find(t => t._id === id))
        .filter(t => t);
}

function renderDependencies() {
    const container = document.getElementById('dependencyList');
    if (!container) return;
    
    const tasksWithDeps = Object.keys(taskDependencies);
    if (tasksWithDeps.length === 0) {
        container.innerHTML = `<p style="color: var(--muted);">No dependencies set. Click 🔗 on a task to manage dependencies.</p>`;
        return;
    }
    
    container.innerHTML = tasksWithDeps.map(taskId => {
        const task = allTasks.find(t => t._id === taskId);
        if (!task) return '';
        const deps = getBlockingTasks(taskId);
        const isBlocked = blockedTasks.has(taskId);
        
        return `
            <div style="display: flex; align-items: center; gap: 12px; padding: 10px; background: rgba(255,255,255,0.05); border-radius: 10px; margin-bottom: 8px; ${isBlocked ? 'border-left: 3px solid #e74c3c;' : ''}">
                <span style="color: ${isBlocked ? '#e74c3c' : 'var(--gold)'}">${isBlocked ? '🔒' : '✅'}</span>
                <span style="flex: 1;">${escapeHtml(task.title)}</span>
                <span style="color: var(--muted); font-size: 13px;">
                    ${deps.length > 0 ? `Depends on: ${deps.map(d => escapeHtml(d.title)).join(', ')}` : 'No dependencies'}
                </span>
                <button onclick="openDependencyModal('${taskId}')" class="row-btn dep-btn" style="width: 36px; height: 36px;">🔗</button>
            </div>
        `;
    }).join('');
}

// ==========================================
// DEPENDENCY MODAL
// ==========================================
function openDependencyModal(taskId) {
    currentDepTaskId = taskId;
    const task = allTasks.find(t => t._id === taskId);
    if (!task) return;
    
    depTaskName.textContent = `"${escapeHtml(task.title)}"`;
    
    depSelect.innerHTML = '<option value="">Select a task this depends on...</option>';
    const existingDeps = taskDependencies[taskId] || [];
    
    allTasks.forEach(t => {
        if (t._id !== taskId && !existingDeps.includes(t._id)) {
            const option = document.createElement('option');
            option.value = t._id;
            option.textContent = `${t.title} (${t.status})`;
            depSelect.appendChild(option);
        }
    });
    
    const deps = getBlockingTasks(taskId);
    if (deps.length > 0) {
        currentDeps.innerHTML = `
            <p style="color: var(--muted); font-size: 13px; margin-bottom: 5px;">Current dependencies:</p>
            ${deps.map(d => `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 4px 8px; background: rgba(255,255,255,0.03); border-radius: 6px; margin-bottom: 4px;">
                    <span style="font-size: 14px;">${escapeHtml(d.title)} ${d.status === 'Completed' ? '✅' : '⏳'}</span>
                    <button onclick="removeDependency('${taskId}','${d._id}'); openDependencyModal('${taskId}');" style="background: transparent; border: none; color: #e74c3c; cursor: pointer; font-size: 16px;">✕</button>
                </div>
            `).join('')}
        `;
    } else {
        currentDeps.innerHTML = '<p style="color: var(--muted); font-size: 13px;">No dependencies set.</p>';
    }
    
    dependencyModal.classList.add('active');
}

function closeDependencyModal() {
    dependencyModal.classList.remove('active');
    currentDepTaskId = null;
}

if (closeDepBtn) {
    closeDepBtn.addEventListener('click', closeDependencyModal);
}

if (addDepBtn) {
    addDepBtn.addEventListener('click', function() {
        const depId = depSelect.value;
        if (depId && currentDepTaskId) {
            addDependency(currentDepTaskId, depId);
            openDependencyModal(currentDepTaskId);
        } else {
            alert('Please select a task!');
        }
    });
}

if (dependencyModal) {
    dependencyModal.addEventListener('click', function(e) {
        if (e.target === this) {
            closeDependencyModal();
        }
    });
}

// ==========================================
// SMART TEMPLATES
// ==========================================
async function applyTemplate(templateName) {
    const template = templates[templateName] || customTemplates.find(t => t.name === templateName);
    if (!template) {
        alert('Template not found!');
        return;
    }
    
    const category = prompt('Which category should these tasks go to?', 'Work') || 'Work';
    const priority = prompt('What priority should these tasks have? (Low/Medium/High)', 'Medium') || 'Medium';
    
    let added = 0;
    for (const taskTitle of template.tasks) {
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    title: taskTitle, 
                    category,
                    priority,
                    status: 'Pending'
                })
            });
            if (response.ok) added++;
        } catch (e) {
            console.error('Error adding task:', e);
        }
    }
    
    showNotification(`✅ ${added} tasks added successfully!`);
    await loadTasks();
}

function openTemplateModal() {
    if (templateModal) {
        templateModal.classList.add('active');
    }
}

function closeTemplateModal() {
    if (templateModal) {
        templateModal.classList.remove('active');
    }
    if (templateNameInput) templateNameInput.value = '';
    if (templateTasksInput) templateTasksInput.value = '';
}

if (closeTemplateBtn) {
    closeTemplateBtn.addEventListener('click', closeTemplateModal);
}

if (templateModal) {
    templateModal.addEventListener('click', function(e) {
        if (e.target === this) {
            closeTemplateModal();
        }
    });
}

if (saveTemplateBtn) {
    saveTemplateBtn.addEventListener('click', function() {
        const name = templateNameInput ? templateNameInput.value.trim() : '';
        const tasksText = templateTasksInput ? templateTasksInput.value.trim() : '';
        const category = templateCategorySelect ? templateCategorySelect.value : 'Work';
        
        if (!name || !tasksText) {
            alert('Please enter both a name and tasks!');
            return;
        }
        
        const taskList = tasksText.split('\n')
            .filter(line => line.trim().startsWith('-') || line.trim().startsWith('•'))
            .map(line => line.replace(/^[-•]\s*/, '').trim())
            .filter(task => task.length > 0);
        
        if (taskList.length === 0) {
            alert('Please format tasks with - or • at the start of each line.');
            return;
        }
        
        if (!customTemplates) customTemplates = [];
        customTemplates.push({ name, tasks: taskList, category });
        localStorage.setItem('customTemplates', JSON.stringify(customTemplates));
        
        closeTemplateModal();
        showNotification('✅ Template saved successfully!');
        addCustomTemplateButton(name);
    });
}

function addCustomTemplateButton(name) {
    const container = document.querySelector('.templates-section');
    if (!container) return;
    
    const btnContainer = container.querySelector('div:first-child');
    if (!btnContainer) return;
    
    const existingBtns = btnContainer.querySelectorAll('.template-btn');
    const lastBtn = existingBtns[existingBtns.length - 1];
    
    if (lastBtn && lastBtn.textContent.includes('Create Template')) {
        const btn = document.createElement('button');
        btn.className = 'template-btn';
        btn.textContent = `🧩 ${name}`;
        btn.onclick = () => applyTemplate(name);
        btnContainer.insertBefore(btn, lastBtn);
    }
}

function loadCustomTemplates() {
    try {
        const saved = localStorage.getItem('customTemplates');
        if (saved) {
            customTemplates = JSON.parse(saved);
            customTemplates.forEach(t => addCustomTemplateButton(t.name));
        }
    } catch (e) {
        console.error('Error loading custom templates:', e);
    }
}

// ==========================================
// ANALYTICS DASHBOARD
// ==========================================
function updateAnalytics() {
    const total = allTasks.length;
    const completed = allTasks.filter(t => t.status === 'Completed').length;
    const pending = allTasks.filter(t => t.status === 'Pending').length;
    
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
    document.getElementById('completionRate').textContent = `${rate}%`;
    document.getElementById('analyticsTotal').textContent = total;
    
    const dayCounts = {};
    allTasks.forEach(task => {
        const date = new Date(task.createdAt);
        const day = date.toLocaleDateString('en-US', { weekday: 'long' });
        dayCounts[day] = (dayCounts[day] || 0) + 1;
    });
    
    let bestDay = '-';
    let maxCount = 0;
    for (const [day, count] of Object.entries(dayCounts)) {
        if (count > maxCount) {
            maxCount = count;
            bestDay = day;
        }
    }
    document.getElementById('bestDay').textContent = bestDay;
    
    const categoryCounts = {};
    allTasks.forEach(task => {
        const cat = task.category || 'General';
        categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    });
    
    let topCategory = '-';
    let maxCatCount = 0;
    for (const [cat, count] of Object.entries(categoryCounts)) {
        if (count > maxCatCount) {
            maxCatCount = count;
            topCategory = cat;
        }
    }
    document.getElementById('topCategory').textContent = topCategory;
    
    renderCategoryBars(categoryCounts);
}

function renderCategoryBars(categoryCounts) {
    const container = document.getElementById('categoryVisual');
    if (!container) return;
    
    const categories = ['Work', 'Personal', 'Study', 'Shopping'];
    const total = Object.values(categoryCounts).reduce((a, b) => a + b, 0);
    
    if (total === 0) {
        container.innerHTML = '<p style="color: var(--muted); text-align: center;">No data yet. Add some tasks!</p>';
        return;
    }
    
    const colors = {
        'Work': '#f39c12',
        'Personal': '#2ecc71',
        'Study': '#3498db',
        'Shopping': '#9b59b6'
    };
    
    container.innerHTML = categories.map(cat => {
        const count = categoryCounts[cat] || 0;
        const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
        const color = colors[cat] || '#f4c04d';
        
        return `
            <div class="category-bar">
                <span class="label">${cat}</span>
                <div class="bar-track">
                    <div class="bar-fill" style="width: ${percentage}%; background: ${color};"></div>
                </div>
                <span class="count">${count}</span>
            </div>
        `;
    }).join('');
}

// ==========================================
// FOCUS MODE & POMODORO
// ==========================================
focusToggle.addEventListener('click', function() {
    focusModeActive = !focusModeActive;
    this.classList.toggle('active');
    
    if (focusModeActive) {
        focusLabel.textContent = 'Exit Focus Mode';
        pomodoroDisplay.style.display = 'block';
        document.body.classList.add('focus-mode');
        
        // If no task selected, select the first pending task
        if (!selectedTaskId) {
            const firstPending = allTasks.find(t => t.status === 'Pending');
            if (firstPending) {
                selectedTaskId = firstPending._id;
            }
        }
        renderTasks();
        showNotification('🎯 Focus Mode activated! Select a task to focus on.');
    } else {
        focusLabel.textContent = '🎯 Focus Mode';
        pomodoroDisplay.style.display = 'none';
        document.body.classList.remove('focus-mode');
        selectedTaskId = null;
        renderTasks();
        stopPomodoro();
        showNotification('Focus Mode deactivated.');
    }
});

// Pomodoro Timer
pomodoroStart.addEventListener('click', function() {
    if (isPomodoroRunning) {
        stopPomodoro();
        this.textContent = '▶️';
    } else {
        startPomodoro();
        this.textContent = '⏸️';
    }
});

pomodoroReset.addEventListener('click', function() {
    stopPomodoro();
    pomodoroTime = 25 * 60;
    updatePomodoroDisplay();
    pomodoroStart.textContent = '▶️';
});

function startPomodoro() {
    if (pomodoroInterval) return;
    isPomodoroRunning = true;
    pomodoroInterval = setInterval(() => {
        pomodoroTime--;
        updatePomodoroDisplay();
        if (pomodoroTime <= 0) {
            stopPomodoro();
            showNotification('⏰ Pomodoro complete! Take a break!');
            // Award coins for completing a pomodoro
            addCoins(2);
            pomodoroStart.textContent = '▶️';
            
            // Play notification sound if available
            try {
                const audio = new Audio('data:audio/wav;base64,UklGRnoAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoAAACBhYqFhYWJhYeFhYaHhYaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGg==');
                audio.play();
            } catch(e) {}
        }
    }, 1000);
}

function stopPomodoro() {
    clearInterval(pomodoroInterval);
    pomodoroInterval = null;
    isPomodoroRunning = false;
}

function updatePomodoroDisplay() {
    const minutes = Math.floor(pomodoroTime / 60);
    const seconds = pomodoroTime % 60;
    pomodoroTimeDisplay.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

// ==========================================
// GROUPING
// ==========================================
groupSelect.addEventListener('change', function() {
    currentGroup = this.value;
    renderTasks();
});

// ==========================================
// ADD OR UPDATE TASK
// ==========================================
taskForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const title = taskInput.value.trim();
    if (!title) {
        alert('Please enter a task!');
        return;
    }

    const category = categorySelect.value;
    const priority = prioritySelect.value;
    const isEdit = taskForm.dataset.mode === 'edit';
    const editId = taskInput.dataset.editId;

    try {
        if (isEdit && editId) {
            const response = await fetch(`${API_URL}/${editId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, category, priority })
            });

            if (!response.ok) throw new Error('Failed to update task');
            showNotification('✅ Task updated successfully!');
            resetForm();
        } else {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    title, 
                    category,
                    priority,
                    status: 'Pending'
                })
            });

            if (!response.ok) throw new Error('Failed to add task');
            showNotification('✅ Task added successfully!');
            // Award coins for creating a task
            addCoins(1);
        }

        taskInput.value = "";
        taskInput.focus();
        activeFilter = "all";
        setActiveButtons("all");
        await loadTasks();
    } catch (error) {
        console.error('Error saving task:', error);
        alert('Failed to save task. Make sure backend is running.');
    }
});

// ==========================================
// RESET FORM
// ==========================================
function resetForm() {
    taskForm.dataset.mode = 'add';
    delete taskInput.dataset.editId;
    const submitBtn = document.querySelector('.submit-btn');
    if (submitBtn) submitBtn.textContent = 'Add Task';
    taskInput.value = '';
    categorySelect.value = 'Work';
    prioritySelect.value = 'Medium';
}

// ==========================================
// FILTER BUTTONS
// ==========================================
document.querySelectorAll("[data-filter]").forEach(button => {
    button.addEventListener("click", () => {
        activeFilter = button.dataset.filter;
        setActiveButtons(activeFilter);
        renderTasks();
    });
});

function setActiveButtons(filter) {
    document.querySelectorAll("[data-filter]").forEach(button => {
        button.classList.toggle("active", button.dataset.filter === filter);
    });
}

// ==========================================
// SEARCH
// ==========================================
searchInput.addEventListener("input", renderTasks);

// ==========================================
// FOCUS INPUT
// ==========================================
document.getElementById("focusInput").addEventListener("click", () => {
    taskInput.focus();
});

// ==========================================
// THEME TOGGLE
// ==========================================
document.getElementById("themeToggle").addEventListener("click", () => {
    document.body.classList.toggle("light");
    localStorage.setItem('theme', document.body.classList.contains('light') ? 'light' : 'dark');
});

// Load saved theme
if (localStorage.getItem('theme') === 'light') {
    document.body.classList.add('light');
}

// ==========================================
// ESCAPE HTML
// ==========================================
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ==========================================
// ESCAPE KEY - CLOSE ALL MODALS
// ==========================================
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeDeleteModal();
        closeDependencyModal();
        closeTemplateModal();
    }
});

// ==========================================
// VOICE INPUT (Speech Recognition)
// ==========================================
const micBtn = document.getElementById('micBtn');
let recognition = null;
let isListening = false;

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onresult = function(event) {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
                finalTranscript += transcript;
            } else {
                interimTranscript += transcript;
            }
        }

        if (finalTranscript) {
            taskInput.value = finalTranscript.trim();
            micBtn.classList.remove('listening');
            micBtn.classList.add('done');
            isListening = false;
            lucide.createIcons();
            
            setTimeout(() => {
                micBtn.classList.remove('done');
            }, 1500);
        } else if (interimTranscript) {
            taskInput.value = interimTranscript.trim();
        }
    };

    recognition.onend = function() {
        if (isListening) {
            micBtn.classList.remove('listening');
            isListening = false;
            lucide.createIcons();
            
            if (!taskInput.value.trim()) {
                taskInput.placeholder = "Didn't catch that. Try again!";
                setTimeout(() => {
                    taskInput.placeholder = "What do you want to add?";
                }, 2000);
            }
        }
    };

    recognition.onerror = function(event) {
        console.error('Speech recognition error:', event.error);
        micBtn.classList.remove('listening');
        isListening = false;
        lucide.createIcons();
        
        let errorMessage = 'Voice input failed. ';
        switch(event.error) {
            case 'not-allowed':
                errorMessage += 'Please allow microphone access.';
                break;
            case 'no-speech':
                errorMessage += 'No speech detected. Try again.';
                break;
            case 'audio-capture':
                errorMessage += 'No microphone found.';
                break;
            default:
                errorMessage += 'Please try again.';
        }
        alert(errorMessage);
    };

    micBtn.addEventListener('click', function() {
        if (!recognition) return;
        
        if (isListening) {
            recognition.stop();
            micBtn.classList.remove('listening');
            isListening = false;
        } else {
            try {
                recognition.start();
                micBtn.classList.add('listening');
                isListening = true;
                taskInput.placeholder = "Listening... 🎤";
                lucide.createIcons();
            } catch (error) {
                console.error('Error starting recognition:', error);
                if (error.message.includes('already started')) {
                    recognition.stop();
                    setTimeout(() => {
                        recognition.start();
                        micBtn.classList.add('listening');
                        isListening = true;
                        taskInput.placeholder = "Listening... 🎤";
                        lucide.createIcons();
                    }, 300);
                }
            }
        }
    });

} else {
    if (micBtn) {
        micBtn.style.opacity = '0.5';
        micBtn.style.cursor = 'not-allowed';
        micBtn.title = 'Voice input not supported in this browser';
        micBtn.addEventListener('click', function() {
            alert('Voice input is not supported in your browser. Please use Chrome, Edge, or Safari.');
        });
    }
}

// ==========================================
// KEYBOARD SHORTCUT: Ctrl+Shift+V for voice
// ==========================================
document.addEventListener('keydown', function(e) {
    if (e.ctrlKey && e.shiftKey && e.key === 'V') {
        e.preventDefault();
        if (micBtn && !micBtn.disabled) {
            micBtn.click();
        }
    }
    
    // Ctrl+Shift+F for Focus Mode
    if (e.ctrlKey && e.shiftKey && e.key === 'F') {
        e.preventDefault();
        focusToggle.click();
    }
});

// ==========================================
// INITIALIZE
// ==========================================
window.addEventListener("load", () => {
    lucide.createIcons();
    loadGamification();
    loadCustomTemplates();
    loadTasks();
    updatePomodoroDisplay();
});
