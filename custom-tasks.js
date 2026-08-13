(() => {
  const STORAGE = 'pc-custom-tasks-v1';
  const DONE = 'pc-custom-done-v1';
  const load = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); } catch { return fallback; } };
  let customTasks = load(STORAGE, []);
  let customDone = load(DONE, {});

  const style = document.createElement('style');
  style.textContent = `
    .task-form{background:#fff;border:1px solid var(--line);border-radius:18px;padding:22px;display:grid;grid-template-columns:2fr 1fr 1fr;gap:14px;box-shadow:0 5px 16px #5d364508}
    .task-form label{display:grid;gap:7px;color:#856d77;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.08em}.task-form .wide{grid-column:1/-1}.task-form input,.task-form select,.task-form textarea{width:100%;border:1px solid #ddcfd5;border-radius:10px;padding:11px 12px;background:#fff;color:var(--ink);outline:none;font:inherit;font-size:13px}.task-form textarea{min-height:75px;resize:vertical}.task-form input:focus,.task-form select:focus,.task-form textarea:focus{border-color:var(--wine2);box-shadow:0 0 0 3px #812b4c12}.form-actions{grid-column:1/-1;display:flex;justify-content:flex-end}.primary{border:0;border-radius:10px;background:var(--wine2);color:#fff;padding:12px 18px;font-weight:700;cursor:pointer}.custom-list{display:grid;gap:10px}.custom-empty{background:#fff;border:1px dashed #d8c7ce;border-radius:16px;padding:30px;text-align:center;color:var(--muted);font-size:13px}.delete-task{border:0;background:#fbf1f4;color:#a43759;border-radius:9px;padding:8px 10px;cursor:pointer;font-size:11px}.custom-date{color:#9a878f;font-size:10px;margin-top:6px}.nav button[data-view="nova"]{white-space:nowrap}@media(max-width:800px){.task-form{grid-template-columns:1fr}.task-form .wide,.form-actions{grid-column:1}.form-actions .primary{width:100%}}
  `;
  document.head.appendChild(style);

  const nav = document.querySelector('.nav');
  const content = document.querySelector('.content');
  const button = document.createElement('button');
  button.dataset.view = 'nova';
  button.textContent = '＋ Nova tarefa';
  nav.appendChild(button);

  const view = document.createElement('div');
  view.id = 'nova';
  view.className = 'hidden';
  view.innerHTML = `
    <div class="title"><div><p class="eyebrow">ORGANIZAÇÃO DA OPERAÇÃO</p><h2>Criar nova tarefa</h2></div><span class="count" id="custom-count">0 tarefa(s)</span></div>
    <form class="task-form" id="custom-form">
      <label>Título da tarefa<input name="title" maxlength="100" required placeholder="Ex.: Conferir notas fiscais"></label>
      <label>Área<select name="area"><option>Salão</option><option>Atacado</option><option>Financeiro</option><option>Gestão</option></select></label>
      <label>Frequência<select name="frequency"><option>Única</option><option>Diária</option><option>Semanal</option><option>Quinzenal</option><option>Mensal</option></select></label>
      <label>Data ou referência<input name="when" maxlength="60" placeholder="Ex.: toda terça-feira"></label>
      <label class="wide">Descrição ou observação<textarea name="description" maxlength="300" placeholder="Detalhes importantes para realizar a tarefa"></textarea></label>
      <div class="form-actions"><button class="primary" type="submit">Adicionar tarefa</button></div>
    </form>
    <div class="title"><div><p class="eyebrow">TAREFAS PERSONALIZADAS</p><h2>Minhas tarefas</h2></div></div>
    <div class="custom-list" id="custom-list"></div>`;
  content.appendChild(view);

  function persist() {
    localStorage.setItem(STORAGE, JSON.stringify(customTasks));
    localStorage.setItem(DONE, JSON.stringify(customDone));
  }
  function renderCustom() {
    const list = document.querySelector('#custom-list');
    document.querySelector('#custom-count').textContent = `${customTasks.length} tarefa(s)`;
    if (!customTasks.length) {
      list.innerHTML = '<div class="custom-empty">Nenhuma tarefa criada ainda. Use o formulário acima para começar.</div>';
      return;
    }
    list.innerHTML = customTasks.map(task => `
      <article class="card ${customDone[task.id] ? 'done' : ''}" data-custom-id="${task.id}">
        <button class="check custom-check">${customDone[task.id] ? '✓' : ''}</button>
        <div class="copy"><div class="meta">${task.area} · ${task.frequency}</div><h3>${escapeHtml(task.title)}</h3>${task.description ? `<p>${escapeHtml(task.description)}</p>` : ''}<div class="custom-date">${escapeHtml(task.when || 'Sem data definida')}</div></div>
        <button class="delete-task" title="Excluir tarefa">Excluir</button>
      </article>`).join('');
    list.querySelectorAll('.custom-check').forEach(item => item.onclick = () => {
      const id = item.closest('[data-custom-id]').dataset.customId;
      customDone[id] = !customDone[id]; persist(); renderCustom();
    });
    list.querySelectorAll('.delete-task').forEach(item => item.onclick = () => {
      const id = item.closest('[data-custom-id]').dataset.customId;
      customTasks = customTasks.filter(task => task.id !== id); delete customDone[id]; persist(); renderCustom();
    });
  }
  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  }

  document.querySelector('#custom-form').addEventListener('submit', event => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    customTasks.unshift({
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      title: data.get('title').trim(), area: data.get('area'), frequency: data.get('frequency'),
      when: data.get('when').trim(), description: data.get('description').trim(), createdAt: new Date().toISOString()
    });
    persist(); event.currentTarget.reset(); renderCustom();
  });

  document.querySelectorAll('.nav button').forEach(navButton => navButton.onclick = () => {
    document.querySelectorAll('.nav button').forEach(item => item.classList.remove('on'));
    navButton.classList.add('on');
    ['geral','rotinas','calendario','nova'].forEach(id => document.querySelector(`#${id}`).classList.toggle('hidden', id !== navButton.dataset.view));
    document.querySelector('#heading').textContent = navButton.textContent.replace(/[⌂✓□＋]/, '').trim();
  });
  renderCustom();
})();

