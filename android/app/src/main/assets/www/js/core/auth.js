/* ============================================================
   PLANEJAMENTO DIMAN-BHZ — Core: Authentication
   ============================================================ */

window.Auth = (() => {
  const USERS_KEY = 'diman_users';
  const SESSION_KEY = 'diman_session';
  const AUDIT_KEY = 'diman_audit';

  // Hash password with SHA-256 via Web Crypto API with pure JS fallback for non-secure contexts
  async function hashPassword(password) {
    try {
      if (typeof crypto !== 'undefined' && crypto.subtle && typeof TextEncoder !== 'undefined') {
        const msgBuffer = new TextEncoder().encode(password);
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      }
    } catch (e) {
      console.warn("Falha no Web Crypto API, usando fallback em JS puro:", e);
    }
    return sha256_fallback(password);
  }

  function sha256_fallback(ascii) {
    function rightRotate(value, amount) {
      return (value >>> amount) | (value << (32 - amount));
    }
    
    var mathPow = Math.pow;
    var maxWord = mathPow(2, 32);
    var lengthProperty = 'length';
    var i, j;
    var result = '';
    var words = [];
    var asciiLength = ascii[lengthProperty] * 8;
    
    var hash = sha256_fallback.h = sha256_fallback.h || [];
    var k = sha256_fallback.k = sha256_fallback.k || [];
    var primeCounter = k[lengthProperty];

    var isComposite = {};
    for (var candidate = 2; primeCounter < 64; candidate++) {
      if (!isComposite[candidate]) {
        for (i = 0; i < 313; i += candidate) {
          isComposite[i] = 1;
        }
        hash[primeCounter] = (mathPow(candidate, .5) * maxWord) | 0;
        k[primeCounter++] = (mathPow(candidate, 1/3) * maxWord) | 0;
      }
    }
    
    ascii += '\x80';
    while (ascii[lengthProperty] % 64 - 56) {
      ascii += '\x00';
    }
    for (i = 0; i < ascii[lengthProperty]; i++) {
      j = ascii.charCodeAt(i);
      if (j >> 8) return;
      words[i >> 2] |= j << (24 - (i % 4) * 8);
    }
    words[words[lengthProperty]] = ((asciiLength / maxWord) | 0);
    words[words[lengthProperty]] = (asciiLength | 0);
    
    for (j = 0; j < words[lengthProperty];) {
      var w = words.slice(j, j += 16);
      var oldHash = hash.slice(0);
      
      hash = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
      if (j > 16) {
         for (i=0; i<8; i++) hash[i] = oldHash[i];
      }

      for (i = 0; i < 64; i++) {
        var wItem = w[i];
        if (i >= 16) {
          var s0 = rightRotate(w[i - 15], 7) ^ rightRotate(w[i - 15], 18) ^ (w[i - 15] >>> 3);
          var s1 = rightRotate(w[i - 2], 17) ^ rightRotate(w[i - 2], 19) ^ (w[i - 2] >>> 10);
          wItem = w[i] = (w[i - 16] + s0 + w[i - 7] + s1) | 0;
        }
        
        var ch = (hash[4] & hash[5]) ^ (~hash[4] & hash[6]);
        var maj = (hash[0] & hash[1]) ^ (hash[0] & hash[2]) ^ (hash[1] & hash[2]);
        var temp1 = hash[7] + (rightRotate(hash[4], 6) ^ rightRotate(hash[4], 11) ^ rightRotate(hash[4], 25)) + ch + k[i] + wItem;
        var temp2 = (rightRotate(hash[0], 2) ^ rightRotate(hash[0], 13) ^ rightRotate(hash[0], 22)) + maj;
        
        hash = [(temp1 + temp2) | 0].concat(hash);
        hash[4] = (hash[4] + temp1) | 0;
        hash[8] = 0;
        hash.pop();
      }
      
      for (i = 0; i < 8; i++) {
        hash[i] = (hash[i] + oldHash[i]) | 0;
      }
    }
    
    for (i = 0; i < 8; i++) {
      var val = hash[i] >>> 0;
      result += (val.toString(16).padStart(8, '0'));
    }
    return result;
  }

  function normalizeMatricula(mat) {
    if (!mat) return '';
    return String(mat).trim().replace(/^0+/, '');
  }

  function matchMatricula(m1, m2) {
    if (!m1 || !m2) return false;
    const s1 = String(m1).trim();
    const s2 = String(m2).trim();
    if (s1 === s2) return true;
    const n1 = s1.replace(/^0+/, '');
    const n2 = s2.replace(/^0+/, '');
    return n1.length > 0 && n1 === n2;
  }

  function getUsers() {
    const data = localStorage.getItem(USERS_KEY);
    let users = data ? JSON.parse(data) : [];
    
    // Filter deleted users first
    try {
      const blacklist = JSON.parse(localStorage.getItem('diman_deleted_users') || '[]');
      if (blacklist.length > 0) {
        users = users.filter(u => !blacklist.includes(u.id) && !blacklist.includes(u.matricula));
      }
    } catch(e) {}
    
    // Deduplicate by normalized matricula
    const unique = {};
    users.forEach(u => {
      if (!u.matricula) return;
      const key = normalizeMatricula(u.matricula) || String(u.matricula).trim();
      u.id = 'u-' + (normalizeMatricula(u.matricula) || u.matricula);

      if (!unique[key]) {
        unique[key] = u;
      } else {
        const exist = unique[key];
        const existTime = exist.updatedAt ? new Date(exist.updatedAt).getTime() : 0;
        const newTime = u.updatedAt ? new Date(u.updatedAt).getTime() : 0;

        // Se um usuário já cadastrou sua senha pessoal (senhaInicial === false),
        // NUNCA permita que um registro antigo com senhaInicial === true sobrescreva!
        if (exist.senhaInicial === false && u.senhaInicial === true) {
          // Mantém exist (já cadastrou a senha pessoal)
        } else if (exist.senhaInicial === true && u.senhaInicial === false) {
          unique[key] = u; // Atualiza para o que já tem senha cadastrada
        } else if (newTime > existTime) {
          unique[key] = u;
        }
      }
    });
    const finalUsers = Object.values(unique);
    finalUsers.forEach(u => {
      if (matchMatricula(u.matricula, '013429') || matchMatricula(u.matricula, '13429')) {
        u.perfil = 'Desenvolvedor';
        u.cargo = 'Desenvolvedor do Sistema';
        u.isPro = true;
      }
    });
    return finalUsers;
  }

  function saveUsers(users) {
    users.forEach(u => {
      if (!u.id) {
        u.id = 'u-' + (normalizeMatricula(u.matricula) || u.matricula || Date.now());
      }
      if (!u.updatedAt) {
        u.updatedAt = new Date().toISOString();
      }
    });
    
    try {
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
    } catch (e) {
      if (e.name === 'QuotaExceededError' || e.code === 22) {
        console.warn('Quota exceeded. Cleaning up local logs to free space...');
        localStorage.removeItem('diman_audit');
        localStorage.removeItem('diman_solicitacoes');
        localStorage.removeItem('diman_notifications');
        try {
          localStorage.setItem(USERS_KEY, JSON.stringify(users));
        } catch (retryErr) {
          console.error('Storage still full after cleanup', retryErr);
          throw new Error('Armazenamento do dispositivo cheio. Limpe o cache do navegador.');
        }
      } else {
        throw e;
      }
    }
    
    if (window.DB && window.DB.syncToSupabase) {
      window.DB.syncToSupabase(USERS_KEY, users);
    }
  }

  async function initSuperAdmin() {
    const users = getUsers();
    const hasAdmin = users.some(u => matchMatricula(u.matricula, '013429') || matchMatricula(u.matricula, '13429'));
    if (!hasAdmin) {
      const hashed = await hashPassword('35215415');
      users.push({
        id: 'u-13429',
        matricula: '013429',
        nome: 'Desenvolvedor do Sistema',
        email: 'admin@diman-bhz.com',
        telefone: '',
        cargo: 'Desenvolvedor do Sistema',
        disciplina: 'TI',
        perfil: 'Desenvolvedor',
        senhaHash: hashed,
        senhaInicial: false,
        status: 'Ativo',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        permissions: getAllPermissions()
      });
      saveUsers(users);
    }
  }

  function getAllPermissions() {
    return {
      dashboard: true, equipment: true, tasks: true, gantt: true,
      criticalPath: true, parts: true, workforce: true, planning: true,
      timeline: true, impacts: true, kpi: true, ai: true,
      reports: true, audit: true, users: true, restrictions: true,
      workshop: true, lessons: true, costs: true, meetingMode: true,
      history: true, managerDashboard: true, simulator: true, workerPanel: true
    };
  }

  function getPermissionsForProfile(profile) {
    const p = (profile || '').trim().toLowerCase();
    switch(p) {
      case 'desenvolvedor pro':
      case 'desenvolvedor':
      case 'gerente':
        return getAllPermissions();
      case 'planejador':
      case 'planejador compras':
        return { ...getAllPermissions(), users: false };
      case 'coordenador':
      case 'cordenador':
      case 'supervisor':
      case 'encarregado':
        return { ...getAllPermissions(), users: false };
      case 'executante':
        return { dashboard: false, equipment: false, tasks: false, gantt: false, parts: false, workforce: false, workshop: false, restrictions: false, timeline: false, kpi: false, ai: false, reports: false, audit: false, users: false, planning: false, impacts: false, costs: false, lessons: false, criticalPath: false, meetingMode: false, history: false, managerDashboard: false, simulator: false, workerPanel: true };
      case 'cliente':
        return { dashboard: true, equipment: true, tasks: false, gantt: true, parts: false, workforce: false, workshop: true, restrictions: false, timeline: true, kpi: true, ai: false, reports: true, audit: false, users: false, planning: false, impacts: true, costs: false, lessons: false, criticalPath: false, meetingMode: false, history: true, managerDashboard: false, simulator: false, workerPanel: false };
      default:
        return getAllPermissions();
    }
  }

  async function login(matricula, senha) {
    let users = getUsers();
    const cleanMat = String(matricula || '').trim();

    let user = users.find(u => matchMatricula(u.matricula, cleanMat));
    
    // Auto-create user from workforce if they don't exist
    if (!user && window.DB && DB.workforce) {
      const wList = DB.workforce.list();
      const wUser = wList.find(w => matchMatricula(w.matricula, cleanMat));
      if (wUser) {
        const createRes = await createUser({
          matricula: wUser.matricula,
          nome: wUser.nome,
          disciplina: wUser.disciplina,
          perfil: 'Executante',
          senhaInicial: '123456'
        });
        if (createRes && createRes.user) {
          user = createRes.user;
          users = getUsers();
        }
      }
    }

    if (!user) return { success: false, error: 'Matrícula não encontrada.' };
    if (user.status === 'Inativo') return { success: false, error: 'Usuário inativo. Contate o administrador.' };
    
    const hash = await hashPassword(senha);
    const isDefaultPwd = (senha === '123456' && user.senhaInicial === true);
    
    if (hash !== user.senhaHash && !isDefaultPwd) {
      return { success: false, error: 'Senha incorreta.' };
    }

    const session = {
      userId: user.id,
      matricula: user.matricula,
      nome: user.nome,
      perfil: user.perfil,
      disciplina: user.disciplina,
      permissions: user.permissions || getPermissionsForProfile(user.perfil),
      loginAt: new Date().toISOString(),
      mustChangePassword: user.senhaInicial === true
    };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    addAuditLog('LOGIN', `Usuário ${user.nome} fez login`, null);
    
    const finalSession = getSession() || session;
    return { success: true, session: finalSession, mustChangePassword: user.senhaInicial === true };
  }

  function logout() {
    const session = getSession();
    if (session) addAuditLog('LOGOUT', `Usuário ${session.nome} fez logout`, null);
    sessionStorage.removeItem(SESSION_KEY);
    localStorage.removeItem('diman_last_route');
  }

  function getSession() {
    try {
      const s = JSON.parse(sessionStorage.getItem(SESSION_KEY));
      if (s) {
        let changed = false;
        let p = (s.perfil || '').trim().toLowerCase();
        if (p === 'administrador' || p === 'administrador do sistema') {
          s.perfil = 'Desenvolvedor';
          changed = true;
        }
        if (s.cargo && /administrador/i.test(s.cargo)) {
           s.cargo = s.cargo.replace(/Administrador/gi, 'Desenvolvedor');
           changed = true;
        }
        if (s.nome && /administrador/i.test(s.nome)) {
           s.nome = s.nome.replace(/Administrador/gi, 'Desenvolvedor');
           changed = true;
        }
        if (s.perfil === 'Desenvolvedor PRO') {
           s.perfil = 'Desenvolvedor';
           s.isPro = true;
           changed = true;
        }
        if (s.matricula === '013429') {
           if (!s.isPro || s.perfil !== 'Desenvolvedor') {
               s.isPro = true;
               s.perfil = 'Desenvolvedor';
               s.cargo = 'Desenvolvedor do Sistema';
               changed = true;
           }
        }
        
        if (changed) {
          sessionStorage.setItem(SESSION_KEY, JSON.stringify(s));
          
          // Also update the user in the database
          const users = getUsers();
          const uIndex = users.findIndex(u => u.id === s.userId);
          if (uIndex !== -1) {
            users[uIndex].perfil = s.perfil;
            if (users[uIndex].cargo) users[uIndex].cargo = users[uIndex].cargo.replace(/Administrador/gi, 'Desenvolvedor');
            if (users[uIndex].nome) users[uIndex].nome = users[uIndex].nome.replace(/Administrador/gi, 'Desenvolvedor');
            saveUsers(users);
          }
        }
      }
      
      if (!s) return null;
      
      // Validação em tempo real: se o usuário foi deletado ou inativado, derruba a sessão
      const users = getUsers();
      if (users.length > 0) {
        const user = users.find(u => u.matricula === s.matricula);
        if (!user || user.status === 'Inativo') {
          sessionStorage.removeItem(SESSION_KEY);
          return null;
        }
      }
      
      return s;
    } catch { return null; }
  }

  function isLoggedIn() {
    return getSession() !== null;
  }

  function hasPermission(perm) {
    const s = getSession();
    if (!s) return false;
    const p = (s.perfil || '').trim().toLowerCase();
    if (p === 'desenvolvedor' || p === 'desenvolvedor pro') return true;
    return s.permissions?.[perm] === true;
  }

  async function changePassword(matricula, novaSenha, nome = null) {
    const users = getUsers();
    const cleanMat = String(matricula || '').trim();
    const idx = users.findIndex(u => matchMatricula(u.matricula, cleanMat));
    if (idx === -1) return false;

    users[idx].senhaHash = await hashPassword(novaSenha);
    users[idx].senhaInicial = false;
    if (nome) users[idx].nome = nome;
    users[idx].updatedAt = new Date().toISOString();
    saveUsers(users);

    // Update session
    const session = getSession();
    if (session) {
      session.mustChangePassword = false;
      if (nome) session.nome = nome;
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    }
    addAuditLog('CHANGE_PASSWORD', `Usuário ${users[idx].nome} alterou a senha`, null);
    return true;
  }

  async function createUser(data) {
    const users = getUsers();
    const cleanMat = String(data.matricula || '').trim();
    if (users.find(u => matchMatricula(u.matricula, cleanMat))) {
      return { success: false, error: 'Matrícula já cadastrada.' };
    }
    const hashed = await hashPassword(data.senhaInicial || '123456');
    const norm = normalizeMatricula(cleanMat) || cleanMat;
    const user = {
      id: 'u-' + norm,
      matricula: cleanMat,
      nome: data.nome,
      email: data.email || '',
      telefone: data.telefone || '',
      cargo: data.cargo || '',
      disciplina: data.disciplina || '',
      perfil: data.perfil || 'Executante',
      senhaHash: hashed,
      senhaInicial: true,
      status: data.status || 'Ativo',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      permissions: data.permissions || getPermissionsForProfile(data.perfil)
    };
    users.push(user);
    saveUsers(users);
    addAuditLog('CREATE_USER', `Usuário ${user.nome} (${user.matricula}) criado`, null);
    return { success: true, user };
  }

  function updateUser(id, data) {
    const users = getUsers();
    const idx = users.findIndex(u => u.id === id);
    if (idx === -1) return false;
    const old = { ...users[idx] };
    Object.assign(users[idx], data);
    saveUsers(users);
    addAuditLog('UPDATE_USER', `Usuário ${users[idx].nome} atualizado`, { before: old, after: users[idx] });
    return true;
  }

  function deleteUser(id) {
    const users = getUsers();
    const user = users.find(u => u.id === id);
    if (!user) return false;
    
    try {
      const blacklist = JSON.parse(localStorage.getItem('diman_deleted_users') || '[]');
      if (!blacklist.includes(id)) {
        blacklist.push(id);
        localStorage.setItem('diman_deleted_users', JSON.stringify(blacklist));
      }
    } catch(e) {}

    const filtered = users.filter(u => u.id !== id);
    saveUsers(filtered);
    if (window.DB && window.DB.deleteFromSupabase) {
      window.DB.deleteFromSupabase(USERS_KEY, id);
    }
    addAuditLog('DELETE_USER', `Usuário ${user.nome} removido`, null);
    return true;
  }

  function listUsers() {
    return getUsers().filter(u => (!matchMatricula(u.matricula, '013429') && !matchMatricula(u.matricula, '13429')) || getSession()?.isPro || getSession()?.perfil === 'Desenvolvedor');
  }

  function addAuditLog(action, description, changes) {
    try {
      const session = getSession();
      const logs = JSON.parse(localStorage.getItem(AUDIT_KEY) || '[]');
      logs.unshift({
        id: 'al-' + Date.now() + '-' + Math.random().toString(36).slice(2),
        action,
        description,
        changes,
        user: session ? { id: session.userId, nome: session.nome, matricula: session.matricula } : null,
        timestamp: new Date().toISOString()
      });
      // Keep last 5000 entries
      if (logs.length > 5000) logs.splice(5000);
      localStorage.setItem(AUDIT_KEY, JSON.stringify(logs));
    } catch (e) {
      console.error("Failed to write audit log:", e);
    }
  }

  function getAuditLogs(filters = {}) {
    let logs = JSON.parse(localStorage.getItem(AUDIT_KEY) || '[]');
    if (filters.action) logs = logs.filter(l => l.action === filters.action);
    if (filters.user)   logs = logs.filter(l => l.user?.matricula === filters.user);
    if (filters.from)   logs = logs.filter(l => l.timestamp >= filters.from);
    if (filters.to)     logs = logs.filter(l => l.timestamp <= filters.to);
    return logs;
  }

  return {
    init: initSuperAdmin,
    login, logout, getSession, isLoggedIn, hasPermission,
    changePassword, createUser, updateUser, deleteUser, listUsers,
    addAuditLog, getAuditLogs,
    getPermissionsForProfile, getAllPermissions, hashPassword
  };
})();
