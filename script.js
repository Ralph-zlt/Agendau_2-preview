// ==========================================================
// DAYVET-GESTÃO — script.js
// Mapa de seções: [1] Mock DB · [2] Permissões RBAC ·
// [3] Autenticação/Login · [4] Toasts · [5] Navegação/Tabs ·
// [6] Agendamentos · [7] Tutores & Pets · [8] Clínico ·
// [9] Relatórios · [10] Usuários · [11] Gráficos ·
// [12] Tema · [13] Inicialização
// ==========================================================

// ==========================================================
// SEÇÃO 1: DADOS MOCK (simula banco de dados em memória)
// ==========================================================

// TODO [INTEGRAÇÃO BANCO DE DADOS FUTURA]:
// Tabela `administradores` — dados do profissional responsável
// pela clínica (CRMV, validade). Relacionado à tabela `users`
// via id. Futuramente: GET /api/profissional/:id
let administradores = [
    { id: "admin1", nome: "Dr. Douglas Ferreira", cpf: "111.111.111-11", profissao: "veterinario", crm: "CRM-SP 45678", crmValidade: "2029-10-12", senha: "admin" }
];

let tutores = [
    { id: "1", nome: "Douglas Silva Ferreira", tel: "(11) 98765-4321", cpf: "111.222.333-44", email: "douglas.ferreira@dayvetgestao.com", endereco: "Rua do Pet, 120 - Pilar do Sul", senha: "123" },
    { id: "2", nome: "Laís Vieira de Oliveira", tel: "(11) 97777-8888", cpf: "222.333.444-55", email: "lais.oliveira@dayvetgestao.com", endereco: "Av. Veterinária, 350 - Pilar do Sul", senha: "123" }
];

let pets = [
    { id: "101", tutorId: "1", nome: "Rex", especie: "Cachorro", raca: "Golden Retriever", comportamento: "Dócil e sociável.", alergias: "Nenhuma registrada." },
    { id: "102", tutorId: "2", nome: "Mingau", especie: "Gato", raca: "Persa", comportamento: "Muito dócil e preguiçoso.", alergias: "Sensibilidade a certos medicamentos." }
];

let agendamentos = [
    { id: "201", petId: "101", tutorId: "1", servico: "Consulta Veterinária", data: "2026-05-18", hora: "09:30", valor: 150.00, status: "confirmado" },
    { id: "202", petId: "102", tutorId: "2", servico: "Exame Clínico", data: "2026-05-18", hora: "14:00", valor: 90.00, status: "confirmado" },
    { id: "203", petId: "101", tutorId: "1", servico: "Vacinação", data: "2026-05-17", hora: "10:00", valor: 110.00, status: "confirmado" },
    { id: "204", petId: "102", tutorId: "2", servico: "Consulta Veterinária", data: "2026-05-19", hora: "11:00", valor: 150.00, status: "pendente" }
];

// DEMO (mock): expedientes de HOJE gerados com a data atual para que o
// painel do veterinário e o filtro "Hoje" tenham conteúdo ao abrir o demo.
// TODO [DB] (tabela agendamentos): virão de SELECT WHERE data = CURRENT_DATE.
const hojeISO = new Date().toISOString().slice(0, 10);
agendamentos.push(
    { id: "205", petId: "101", tutorId: "1", servico: "Consulta Veterinária", data: hojeISO, hora: "09:00", valor: 150.00, status: "confirmado" },
    { id: "206", petId: "102", tutorId: "2", servico: "Vacinação", data: hojeISO, hora: "10:30", valor: 110.00, status: "pendente" },
    { id: "207", petId: "101", tutorId: "1", servico: "Retorno Clínico", data: hojeISO, hora: "15:00", valor: 80.00, status: "pendente" }
);

let historicoClinico = [
    { id: "401", petId: "101", tipo: "laudo", data: "2026-05-15", detalhe: "LAUDO DIAGNÓSTICO: Ultrassonografia abdominal sem alterações hepáticas ou renais significativas. Animal em ótimas condições gerais." },
    { id: "402", petId: "102", tipo: "receita", data: "2026-05-12", detalhe: "PRESCRIÇÃO: Dipirona Gotas (1 gota por kg a cada 12 horas por 3 dias)." },
    { id: "403", petId: "101", tipo: "guia", data: "2026-05-10", detalhe: "GUIA DE ENCAMINHAMENTO: Solicitação de Ecocardiograma Veterinário de rotina." }
];

// O QUE: Estoque mock de usuários com campos estendidos para auth empresarial.
// PORQUÊ: Simula tabela `users` com autenticação por CPF/e-mail + senha,
//   flag mustChange para troca forçada e controle de ativação.
// DEMO (mock): Senhas salvas em plaintext em password_demo (nunca logadas).
// TODO [DB] (tabela users + endpoint + bcrypt/LGPD):
//   CREATE TABLE users (id UUID PK, nome VARCHAR, cpf VARCHAR UNIQUE,
//   email VARCHAR UNIQUE, role VARCHAR, password_hash VARCHAR,
//   mustChange BOOLEAN DEFAULT true, active BOOLEAN DEFAULT true,
//   criadoPor UUID FK, criadoEm TIMESTAMP);
//   Senhas armazenadas com bcrypt; LGPD exige minimização de dados.
let usuariosMock = [
    { id: 'u1', nome: 'Dr. Douglas Ferreira', cpf: '111.111.111-11', email: 'douglas@dayvet.com', role: 'admin', password_demo: '1', mustChange: false, active: true, criadoPor: 'sistema', criadoEm: '2026-01-01' },
    // mustChange: true — primeiro acesso obrigatório: usuários criados pelo sistema devem
    // definir senha forte (8+ chars, 1 maiúscula, 1 número, 1 especial) antes de entrar.
    // DEMO (mock): flag reseta a cada F5 pois não há banco. Comportamento esperado e documentado.
    // TODO [DB] (tabela users): mustChange persistido no banco; após troca → false permanente.
    { id: 'u2', nome: 'Dr. Carlos Silva', cpf: '333.333.333-33', email: 'carlos@dayvet.com', role: 'veterinario', password_demo: '2', mustChange: true, active: true, criadoPor: 'sistema', criadoEm: '2026-01-01' },
    { id: 'u3', nome: 'Lucas Atendente', cpf: '444.444.444-44', email: 'lucas@dayvet.com', role: 'funcionario', password_demo: '3', mustChange: true, active: true, criadoPor: 'sistema', criadoEm: '2026-01-01' }
];

let currentUser = { id: "1", nome: "Dr. Douglas Ferreira", role: "admin", profissao: "admin" };
let currentRole = 'admin';
let configRestricao = "comercial";
let filtroAgendamentosStatus = "todos";
let filtroAgendamentosData = "todos"; // todos | hoje | proximos7 | passados

let financeChartRef = null;

// ==========================================================
// SEÇÃO 2: MATRIZ DE PERMISSÕES POR PERFIL (RBAC)
// ==========================================================
// O cargo 'gestor' foi removido. Todas as funções que antes
// pertenciam ao gestor (valores_registrar, usuarios_criar,
// usuarios_editar, usuarios_excluir, horario_alterar) agora
// são cobertas pelo admin via acesso irrestrito ('*').
//
// Perfis válidos: admin, veterinario, funcionario.
//
// TODO [INTEGRAÇÃO BANCO DE DADOS FUTURA]:
// A tabela `users` armazena o campo `role` do usuário.
// Na autenticação, o backend valida o CPF e retorna o role.
// O frontend apenas consulta PERMISSOES[currentRole] para
// habilitar/desabilitar botões e abas na interface.
const PERMISSOES = {
    admin: ['*'],
    veterinario: [
        'clinica_criar', 'clinica_editar', 'clinica_excluir', 'clinica_imprimir',
        'consulta_agendar', 'consulta_editar', 'consulta_cancelar', 'consulta_confirmar',
        'relatorios_gerar'
    ],
    funcionario: [
        'consulta_agendar', 'consulta_editar', 'consulta_cancelar',
        'vacinacao_agendar', 'vacinacao_editar', 'vacinacao_cancelar',
        'relatorios_gerar', 'tutor_incluir', 'pet_incluir', 'clinica_imprimir'
        // Sem 'consulta_confirmar' / 'vacinacao_confirmar': Funcionário não pode confirmar agendamentos.
    ]
};

function temPermissao(acao) {
    const perms = PERMISSOES[currentRole] || [];
    return perms.includes('*') || perms.includes(acao);
}

// ==========================================================
// SEÇÃO 3: AUTENTICAÇÃO E LOGIN (identificação por CPF)
// ==========================================================

// TODO [INTEGRAÇÃO BANCO DE DADOS FUTURA]:
// O mapeamento CPF -> role será feito pelo backend.
// Fluxo esperado:
//   1. Usuário informa CPF + senha no formulário.
//   2. Frontend envia POST /api/login { cpf, senha }.
//   3. Backend valida credenciais, retorna { user: { id, nome, role, profissao } }.
//   4. Frontend chama realizarLogin(userObj, userObj.role).
//   5. Para sessões futuras: GET /api/me com Bearer token.

// O QUE: Mapa de atalhos demo (CPF curto → objeto de login).
// PORQUÊ: Permite login rápido digitando 1, 2 ou 3 (atalho de teste).
// DEMO (mock): Atalhos bypassam validação de senha para conveniência do demo.
// TODO [DB] (tabela users + endpoint + bcrypt/LGPD):
//   Não será necessário no backend — o login real busca por CPF/email
//   na tabela `users` e valida bcrypt. Este mapa é exclusivo do protótipo.
const perfisTestes = {
    "1":   { id: "u1", nome: "Dr. Douglas Ferreira", role: "admin", profissao: "admin", password_demo: "1" },
    "111": { id: "u1", nome: "Dr. Douglas Ferreira", role: "admin", profissao: "admin", password_demo: "1" },
    "2":   { id: "u2", nome: "Dr. Carlos Silva", role: "veterinario", profissao: "veterinario", crm: "CRM-SP 12345", password_demo: "2" },
    "222": { id: "u2", nome: "Dr. Carlos Silva", role: "veterinario", profissao: "veterinario", crm: "CRM-SP 12345", password_demo: "2" },
    "3":   { id: "u3", nome: "Lucas Atendente", role: "funcionario", profissao: "funcionario", password_demo: "3" },
    "333": { id: "u3", nome: "Lucas Atendente", role: "funcionario", profissao: "funcionario", password_demo: "3" }
};

// O QUE: Handler de login — aceita CPF (atalho demo 1/2/3) ou CPF/email + senha.
// PORQUÊ: Fluxo unificado: atalhos demo bypassam senha para teste rápido;
//   login real busca em usuariosMock por CPF ou email, valida password_demo.
//   Erro único "Credenciais inválidas" para não revelar existência de contas.
// DEMO (mock): Senhas são password_demo em texto plano; no backend seria bcrypt.
// TODO [DB] (tabela users + endpoint + bcrypt/LGPD):
//   POST /api/login { identifier, senha } → backend busca users WHERE cpf=?
//   ou email=?, valida com bcrypt.compare(), retorna JWT + mustChange flag.
//   Rate-limit por IP/CPF para brute-force. LGPD: log de tentativas sem
//   expor dados pessoais em logs de erro.
function handleAuthSubmit(e) {
    if (e) e.preventDefault();
    const input = document.getElementById('login-cpf').value.trim();
    const senha = document.getElementById('login-password').value;

    // Atalho demo: digitar 1/111/2/222/3/333 faz login rápido (bypassa senha)
    const demoUser = perfisTestes[input];
    if (demoUser) {
        const mockEntry = usuariosMock.find(u => u.id === demoUser.id);
        // Verifica se a conta está ativa (mesmo para atalhos demo)
        if (mockEntry && !mockEntry.active) {
            showToast("Credenciais inválidas", "error");
            return;
        }
        // Se mustChange está ativo, força troca de senha antes de entrar
        if (mockEntry && mockEntry.mustChange) {
            showToast("Você deve alterar sua senha antes de prosseguir.", "error");
            abrirModalForcarTrocaSenha(mockEntry);
            return;
        }
        realizarLogin(demoUser, demoUser.role);
        return;
    }

    // Login real: busca por CPF (formato completo) ou e-mail em usuariosMock
    const user = usuariosMock.find(u =>
        u.cpf === input || u.email.toLowerCase() === input.toLowerCase()
    );

    // Validação: erro único sem revelar se usuário existe, senha errada ou inativo
    if (!user || user.password_demo !== senha || !user.active) {
        showToast("Credenciais inválidas", "error");
        return;
    }

    // Se mustChange, redireciona para troca obrigatória de senha
    if (user.mustChange) {
        showToast("Você deve alterar sua senha antes de prosseguir.", "error");
        abrirModalForcarTrocaSenha(user);
        return;
    }

    const userObj = { id: user.id, nome: user.nome, role: user.role, profissao: user.role };
    realizarLogin(userObj, user.role);
}

function formatarCargo(role) {
    const mapa = {
        admin: 'Administrador',
        veterinario: 'Veterinário',
        funcionario: 'Funcionário'
    };
    return mapa[role] || role;
}

// O QUE: Valida CPF brasileiro (dígito verificador x10 e x11).
// PORQUÊ: Impede cadastro de CPFs inventados no formulário de criação de usuário.
// DEMO (mock): Algoritmo padrão da Receita Federal; sem consulta externa.
// TODO [DB] (tabela users + endpoint + bcrypt/LGPD):
//   Validação pode ocorrer no backend via endpoint dedicado ou biblioteca server-side.
//   LGPD: CPF é dado sensível — validação sem armazenar em logs.
function validarCPF(cpf) {
    const limpo = cpf.replace(/\D/g, '');
    if (limpo.length !== 11 || /^(\d)\1{10}$/.test(limpo)) return false;

    let soma = 0;
    for (let i = 0; i < 9; i++) soma += parseInt(limpo[i]) * (10 - i);
    let resto = (soma * 10) % 11;
    if (resto === 10) resto = 0;
    if (resto !== parseInt(limpo[9])) return false;

    soma = 0;
    for (let i = 0; i < 10; i++) soma += parseInt(limpo[i]) * (11 - i);
    resto = (soma * 10) % 11;
    if (resto === 10) resto = 0;
    return resto === parseInt(limpo[10]);
}

// O QUE: Valida formato de e-mail com regex (nivel mais basico).
// PORQUÊ: Evita cadastro de emails invalidos no formulario de criacao de usuario.
// DEMO (mock): Apenas verifica presenca de @ e dominio; sem validacao DNS.
// TODO [DB] (tabela users + endpoint + bcrypt/LGPD):
//   Validacao server-side com biblioteca (ex: validator.js) + envio de email
//   de confirmacao para verificar titularidade.
function validarEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// O QUE: Valida politica de senha forte (8+ chars, 1 maiuscula, 1 numero, 1 especial).
// PORQUÊ: Garante seguranca minima para contas empresariais.
// DEMO (mock): Regex local; no backend usaria mesma regra antes de bcrypt.hash().
// TODO [DB] (tabela users + endpoint + bcrypt/LGPD):
//   Aplicar mesma regra no backend antes de armazenar com bcrypt.
//   Historico de ultimas N senhas para evitar reutilizacao.
//   LGPD: senha nunca aparece em logs ou mensagens de erro.
function validarSenhaForte(senha) {
    const tem8Chars = senha.length >= 8;
    const temMaiuscula = /[A-Z]/.test(senha);
    const temNumero = /[0-9]/.test(senha);
    const temEspecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(senha);
    return tem8Chars && temMaiuscula && temNumero && temEspecial;
}

function realizarLogin(userObj, role) {
    currentUser = userObj;
    currentRole = role;
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('header-user-name').innerText = userObj.nome;
    document.getElementById('header-user-role').innerText = 'Profissão: ' + formatarCargo(userObj.profissao || userObj.role);
    document.getElementById('current-user-role-label').innerText = formatarCargo(role);

    atualizarPermissoesNavegacao();
    atualizarDashboardPorPerfil();

    showToast("Sessão iniciada como " + userObj.nome);
    switchTab(role === 'funcionario' ? 'agendamentos' : 'dashboard');
}

function handleLogout() {
    document.getElementById('login-screen').classList.remove('hidden');
    showToast("Você saiu do sistema.");
}

// ==========================================================
// SEÇÃO 4: TOASTS (notificações)
// ==========================================================

function showToast(mensagem, tipo) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');

    let bgClass = "bg-slate-900 border-brand-lime/40 text-slate-100";
    let icon = "<i data-lucide='check-circle-2' class='w-4 h-4 text-brand-lime shrink-0'></i>";
    if (tipo === 'error') {
        bgClass = "bg-slate-900 border-rose-500/40 text-slate-100";
        icon = "<i data-lucide='alert-triangle' class='w-4 h-4 text-rose-400 shrink-0'></i>";
    }

    toast.className = "flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-2xl pointer-events-auto transition-all duration-300 transform translate-y-5 opacity-0 " + bgClass;
    toast.innerHTML = icon + " <span class='text-xs font-semibold'>" + mensagem + "</span>";
    container.appendChild(toast);
    lucide.createIcons();
    setTimeout(() => toast.classList.remove('translate-y-5', 'opacity-0'), 10);
    setTimeout(() => {
        toast.classList.add('translate-y-5', 'opacity-0');
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

// ==========================================================
// SEÇÃO 5: NAVEGAÇÃO E TABS
// ==========================================================

function atualizarPermissoesNavegacao() {
    // Admin assume todas as funções que eram do gestor (acesso irrestrito via '*')
    const podeUsuarios = (currentRole === 'admin');
    const podeRelatorios = (currentRole === 'admin');
    const podeClinica = true; // Todos os perfis podem acessar o Módulo Clínico
    const podeClientes = (currentRole === 'admin' || currentRole === 'funcionario');
    const podeDashboard = (currentRole === 'admin' || currentRole === 'veterinario');

    // Abas de navegação
    toggleEl('nav-usuarios', podeUsuarios);
    toggleEl('nav-relatorios', podeRelatorios);
    toggleEl('nav-clinica', podeClinica);
    toggleEl('nav-clientes', podeClientes);
    toggleEl('nav-dashboard', podeDashboard);

    // Header: Alterar horário de funcionamento (Admin)
    toggleEl('horario-restricao-control', temPermissao('horario_alterar'));

    // Dashboard: Gerar Relatórios (Veterinário, Funcionário, Admin)
    toggleEl('btn-gerar-relatorios-dashboard', temPermissao('relatorios_gerar'));

    // Agendamentos: "Solicitar Vacinação" é exclusivo do Administrador; "Agendar" exige consulta_agendar
    toggleEl('btn-solicitar-vacinacao', currentRole === 'admin');
    toggleEl('btn-agendar-consulta', temPermissao('consulta_agendar'));

    // Tutores & Pets: Novo Tutor (Funcionário/Admin) e Novo Pet (só Admin)
    toggleEl('btn-novo-tutor', temPermissao('tutor_incluir'));
    toggleEl('btn-novo-pet', temPermissao('pet_incluir'));

    // Módulo Clínico: só quem cria/edita documentos vê o formulário e os botões de "Incluir"
    const podeCriarClinico = temPermissao('clinica_criar');
    toggleEl('clinica-form-coluna', podeCriarClinico);
    document.querySelectorAll('.btn-incluir-doc-clinico').forEach(btn => {
        btn.classList.toggle('hidden', !podeCriarClinico);
    });
    const colunaTimeline = document.getElementById('clinica-timeline-coluna');
    if (colunaTimeline) {
        colunaTimeline.classList.toggle('lg:col-span-2', podeCriarClinico);
        colunaTimeline.classList.toggle('lg:col-span-3', !podeCriarClinico);
    }

    // Reaplica as regras em conteúdos já renderizados dinamicamente
    renderizarAgendamentos();
    renderizarTutores();
    renderizarHistoricoClinico();
}

function toggleEl(id, mostrar) {
    const el = document.getElementById(id);
    if (el) el.classList.toggle('hidden', !mostrar);
}

function switchTab(tabId) {
    if (tabId === 'usuarios' && currentRole !== 'admin') {
        showToast("Acesso restrito: perfil sem permissão para gerenciar usuários.", "error");
        return;
    }
    if (tabId === 'clientes' && currentRole === 'veterinario') {
        showToast("Acesso restrito: perfil sem permissão para Tutores & Pets.", "error");
        return;
    }
    if (tabId === 'dashboard' && currentRole === 'funcionario') {
        showToast("Acesso restrito: perfil sem permissão para o Dashboard.", "error");
        return;
    }
    if (tabId === 'relatorios' && currentRole !== 'admin') {
        showToast("Acesso restrito: perfil sem permissão para a Central de Relatórios.", "error");
        return;
    }

    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.add('hidden'));
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('bg-slate-900', 'text-white');
        btn.classList.add('text-slate-400');
    });

    const targetTab = document.getElementById("tab-" + tabId);
    if (targetTab) targetTab.classList.remove('hidden');

    const activeBtn = document.getElementById("nav-" + tabId);
    if (activeBtn) {
        activeBtn.classList.add('bg-slate-900', 'text-white');
        activeBtn.classList.remove('text-slate-400');
    }

    if (tabId === 'dashboard') {
        atualizarDashboardPorPerfil();
        inicializarGraficos();
    } else if (tabId === 'agendamentos') {
        renderizarAgendamentos();
    } else if (tabId === 'clientes') {
        renderizarTutores();
    } else if (tabId === 'clinica') {
        renderizarHistoricoClinico();
        popularPetsDropdowns();
    } else if (tabId === 'relatorios') {
        switchRelatorioTab('servicos');
    } else if (tabId === 'usuarios') {
        renderizarUsuarios();
    }
}

function alterarRestricaoHoraria() {
    configRestricao = document.getElementById('config-horario').value;
    showToast("Modo de Restrição: " + (configRestricao === 'comercial' ? 'Horário Comercial' : 'Livre 24h'));
}

// ==========================================================
// SEÇÃO 6: AGENDAMENTOS
// ==========================================================

function renderizarAgendamentos() {
    const body = document.getElementById('agendamentos-table-body');
    if (!body) return;
    body.innerHTML = '';

    let filtrados = agendamentos;
    if (filtroAgendamentosStatus !== 'todos') {
        filtrados = filtrados.filter(a => a.status === filtroAgendamentosStatus);
    }

    // O QUE: Filtro por período (todos os dias, hoje, próximos 7 dias, passados).
    // PORQUÊ (Fase 5): a aba exibia todos os registros sem ordenação nem filtro
    //   temporal; agora o padrão lista todos os dias ordenados por data/hora.
    // DEMO (mock): compara strings ISO "YYYY-MM-DD" — funciona sem Date pesado.
    // TODO [DB] (tabela agendamentos): virará WHERE + ORDER BY no backend.
    const hoje = new Date().toISOString().slice(0, 10);
    if (filtroAgendamentosData === 'hoje') {
        filtrados = filtrados.filter(a => a.data === hoje);
    } else if (filtroAgendamentosData === 'proximos7') {
        filtrados = filtrados.filter(a => a.data >= hoje);
    } else if (filtroAgendamentosData === 'passados') {
        filtrados = filtrados.filter(a => a.data < hoje);
    }
    filtrados = filtrados.slice().sort((a, b) =>
        (a.data + ' ' + a.hora).localeCompare(b.data + ' ' + b.hora));

    document.getElementById('agendamento-counter').innerText = "Exibindo " + filtrados.length + " compromissos";

    filtrados.forEach(a => {
        const pet = pets.find(p => p.id === a.petId);
        const tutor = tutores.find(t => t.id === a.tutorId);

        let badge = "";
        if (a.status === 'confirmado') {
            badge = "<span class='bg-brand-lime/10 text-brand-lime border border-brand-lime/20 text-xs font-bold px-2.5 py-1 rounded-full'>Confirmado</span>";
        } else if (a.status === 'cancelado') {
            badge = "<span class='bg-red-950/40 text-rose-400 border border-rose-800/40 text-xs font-bold px-2.5 py-1 rounded-full'>Cancelado</span>";
        } else {
            badge = "<span class='bg-brand-yellow/10 text-brand-yellow border border-brand-yellow/20 text-xs font-bold px-2.5 py-1 rounded-full'>Pendente</span>";
        }

        const ehVacinacao = /vacin/i.test(a.servico);
        const permEditar = ehVacinacao ? 'vacinacao_editar' : 'consulta_editar';
        const permCancelar = ehVacinacao ? 'vacinacao_cancelar' : 'consulta_cancelar';
        const permConfirmar = ehVacinacao ? 'vacinacao_confirmar' : 'consulta_confirmar';

        const btnRegistrarValor = temPermissao('valores_registrar')
            ? `<button onclick="abrirModalRegistrarValor('${a.id}', ${a.valor})" class='ml-2 text-[10px] text-brand-lime hover:underline'>[Registrar Valor]</button>`
            : '';
        const btnConfirmar = (a.status !== 'confirmado' && temPermissao(permConfirmar))
            ? `<button onclick="alterarStatusAgendamento('${a.id}', 'confirmado')" class='text-brand-lime hover:opacity-80 font-bold text-xs bg-brand-lime/10 px-2 py-1 rounded-lg'>Confirmar</button>` : '';
        const btnEditar = temPermissao(permEditar)
            ? `<button onclick="editarAgendamentoPrompt('${a.id}')" class='text-brand-blue hover:opacity-80 font-bold text-xs bg-brand-blue/10 px-2 py-1 rounded-lg'>Editar</button>` : '';
        const btnCancelar = (a.status !== 'cancelado' && temPermissao(permCancelar))
            ? `<button onclick="alterarStatusAgendamento('${a.id}', 'cancelado')" class='text-rose-400 hover:opacity-80 font-bold text-xs bg-rose-500/10 px-2 py-1 rounded-lg'>Cancelar</button>` : '';
        const semAcoes = !btnConfirmar && !btnEditar && !btnCancelar;

        body.innerHTML += `
            <tr class='hover:bg-slate-900/60 transition-all border-b border-slate-800/50'>
                <td class='py-4 px-6'>
                    <div class='font-bold text-slate-200'>${pet ? pet.nome : 'N/A'}</div>
                    <div class='text-xs text-slate-500'>${tutor ? tutor.nome : 'N/A'}</div>
                </td>
                <td class='py-4 px-6 text-slate-300 font-semibold'>${a.servico}</td>
                <td class='py-4 px-6 text-slate-300'>
                    <div>${a.data}</div>
                    <div class='text-xs text-brand-pink font-bold'>${a.hora}</div>
                </td>
                <td class='py-4 px-6 font-bold text-slate-200'>
                    <span>R$ ${a.valor.toFixed(2)}</span>
                    ${btnRegistrarValor}
                </td>
                <td class='py-4 px-6'>${badge}</td>
                <td class='py-4 px-6 text-right space-x-1.5'>
                    ${btnConfirmar}${btnEditar}${btnCancelar}
                    ${semAcoes ? `<span class='text-slate-600 text-[11px] italic'>Sem ações disponíveis</span>` : ''}
                </td>
            </tr>
        `;
    });
    lucide.createIcons();
}

function abrirModalSolicitarAgendamento(tipoServico) {
    abrirModalAgendamento();
    document.getElementById('agend-tipo').value = tipoServico;
}

function editarAgendamentoPrompt(id) {
    const ag = agendamentos.find(a => a.id === id);
    if (!ag) return;
    abrirModalAgendamento();
    document.getElementById('edit-agend-id').value = ag.id;
    document.getElementById('modal-agendamento-titulo').innerText = "Editar Agendamento";
    document.getElementById('agend-tutor-select').value = ag.tutorId;
    popularPetsDoTutor();
    document.getElementById('agend-pet-select').value = ag.petId;
    document.getElementById('agend-tipo').value = ag.servico;
    document.getElementById('agend-valor').value = ag.valor;
    document.getElementById('agend-data').value = ag.data;
    document.getElementById('agend-hora').value = ag.hora;
}

function abrirModalRegistrarValor(id, valorAtual) {
    document.getElementById('valor-agend-id').value = id;
    document.getElementById('valor-agend-input').value = valorAtual;
    document.getElementById('modal-registrar-valor').classList.remove('hidden');
}
function fecharModalRegistrarValor() { document.getElementById('modal-registrar-valor').classList.add('hidden'); }

function salvarRegistroValor(e) {
    e.preventDefault();
    const id = document.getElementById('valor-agend-id').value;
    const novoValor = parseFloat(document.getElementById('valor-agend-input').value);
    const ag = agendamentos.find(a => a.id === id);
    if (ag) {
        ag.valor = novoValor;
        renderizarAgendamentos();
        showToast("Valor do agendamento registrado/atualizado!");
    }
    fecharModalRegistrarValor();
}

function alterarStatusAgendamento(id, status) {
    const item = agendamentos.find(a => a.id === id);
    if (item) {
        item.status = status;
        renderizarAgendamentos();
        showToast("Agendamento atualizado com sucesso!");
    }
}

function filtrarAgendamentos(status) {
    filtroAgendamentosStatus = status;
    renderizarAgendamentos();
}

// O QUE: Troca o filtro temporal da aba Agendamentos (select#filtro-data-ag).
// PORQUÊ (Fase 5): exibir todos os dias por padrão, com opções hoje/próximos/passados.
function filtrarAgendamentosData(periodo) {
    filtroAgendamentosData = periodo;
    renderizarAgendamentos();
}

// ==========================================================
// PAINEL DO VETERINÁRIO (Fase 5) — agenda do dia no Dashboard
// ==========================================================

// O QUE: Alterna o Dashboard por perfil — veterinário vê agenda do dia,
//   demais perfis mantêm o painel financeiro/operacional.
// PORQUÊ (Fase 5): KPIs financeiros não são relevantes para o veterinário;
//   ele precisa de hora/pet/tutor/serviço/status do dia + contadores.
// DEMO (mock): lê o array `agendamentos` em memória.
// TODO [DB] (tabela agendamentos): GET /api/agendamentos?data=hoje&vet=currentUser.
function atualizarDashboardPorPerfil() {
    const ehVet = (currentRole === 'veterinario');
    toggleEl('painel-vet-hoje', ehVet);
    toggleEl('painel-financeiro', !ehVet);
    if (ehVet) renderizarPainelVet();
}

function renderizarPainelVet() {
    const lista = document.getElementById('lista-vet-hoje');
    if (!lista) return;
    const hoje = new Date().toISOString().slice(0, 10);
    const doDia = agendamentos
        .filter(a => a.data === hoje)
        .sort((a, b) => a.hora.localeCompare(b.hora));
    const nConf = doDia.filter(a => a.status === 'confirmado').length;
    const nPend = doDia.filter(a => a.status === 'pendente').length;

    const elTotal = document.getElementById('vet-hoje-total');
    const elConf = document.getElementById('vet-hoje-confirmados');
    const elPend = document.getElementById('vet-hoje-pendentes');
    if (elTotal) elTotal.innerText = doDia.length + (doDia.length === 1 ? ' atendimento' : ' atendimentos');
    if (elConf) elConf.innerText = nConf + ' confirmados';
    if (elPend) elPend.innerText = nPend + ' pendentes';

    lista.innerHTML = '';
    if (!doDia.length) {
        lista.innerHTML = `<div class='p-6 text-center text-sm text-slate-400 font-semibold'>Nenhum atendimento marcado para hoje.</div>`;
    }
    doDia.forEach(a => {
        const pet = pets.find(p => p.id === a.petId);
        const tutor = tutores.find(t => t.id === a.tutorId);
        const badge = a.status === 'confirmado'
            ? "<span class='bg-brand-lime/10 text-brand-lime border border-brand-lime/20 text-xs font-bold px-2.5 py-1 rounded-full'>Confirmado</span>"
            : a.status === 'cancelado'
                ? "<span class='bg-red-950/40 text-rose-400 border border-rose-800/40 text-xs font-bold px-2.5 py-1 rounded-full'>Cancelado</span>"
                : "<span class='bg-brand-yellow/10 text-brand-yellow border border-brand-yellow/20 text-xs font-bold px-2.5 py-1 rounded-full'>Pendente</span>";
        lista.innerHTML += `
            <div class='flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 p-4 border-b border-slate-800/50'>
                <div class='text-lg font-black text-brand-pink w-14'>${a.hora}</div>
                <div class='flex-1'>
                    <div class='font-bold text-slate-200'>${pet ? pet.nome : 'N/A'} <span class='text-xs font-semibold text-slate-400'>· ${tutor ? tutor.nome : 'N/A'}</span></div>
                    <div class='text-xs text-slate-400 font-semibold'>${a.servico}</div>
                </div>
                <div>${badge}</div>
            </div>`;
    });
    lucide.createIcons();
}

function abrirModalAgendamento() {
    const selectT = document.getElementById('agend-tutor-select');
    selectT.innerHTML = '';
    tutores.forEach(t => selectT.innerHTML += `<option value="${t.id}">${t.nome}</option>`);
    popularPetsDoTutor();

    // Reseta o formulário para modo "novo agendamento"
    document.getElementById('edit-agend-id').value = '';
    document.getElementById('modal-agendamento-titulo').innerText = 'Agendar Consulta';
    document.getElementById('agend-tipo').value = '';
    document.getElementById('agend-valor').value = '';
    document.getElementById('agend-data').value = '';
    document.getElementById('agend-hora').value = '';

    document.getElementById('modal-agendamento').classList.remove('hidden');
}
function fecharModalAgendamento() { document.getElementById('modal-agendamento').classList.add('hidden'); }

function popularPetsDoTutor() {
    const tutorId = document.getElementById('agend-tutor-select').value;
    const selectP = document.getElementById('agend-pet-select');
    selectP.innerHTML = '';
    pets.filter(p => p.tutorId === tutorId).forEach(p => {
        selectP.innerHTML += `<option value="${p.id}">${p.nome}</option>`;
    });
}

function salvarAgendamento(e) {
    e.preventDefault();
    const editId = document.getElementById('edit-agend-id').value;
    const tutorId = document.getElementById('agend-tutor-select').value;
    const petId = document.getElementById('agend-pet-select').value;
    const servico = document.getElementById('agend-tipo').value;
    const valor = parseFloat(document.getElementById('agend-valor').value);
    const data = document.getElementById('agend-data').value;
    const hora = document.getElementById('agend-hora').value;

    if (editId) {
        const ag = agendamentos.find(a => a.id === editId);
        if (ag) {
            ag.tutorId = tutorId;
            ag.petId = petId;
            ag.servico = servico;
            ag.valor = valor;
            ag.data = data;
            ag.hora = hora;
        }
        showToast("Agendamento atualizado com sucesso!");
    } else {
        agendamentos.unshift({ id: Date.now().toString(), tutorId, petId, servico, valor, data, hora, status: "confirmado" });
        showToast("Agendamento criado!");
    }
    fecharModalAgendamento();
    renderizarAgendamentos();
}

// ==========================================================
// SEÇÃO 7: TUTORES & PETS
// ==========================================================

function renderizarTutores() {
    const grid = document.getElementById('tutores-grid');
    if (!grid) return;
    grid.innerHTML = '';

    tutores.forEach(t => {
        const petsDoTutor = pets.filter(p => p.tutorId === t.id);
        let petsHTML = '';
        const btnEditarTutor = temPermissao('tutor_editar')
            ? `<button onclick="abrirModalEditarTutor('${t.id}')" class='text-[10px] text-brand-blue font-bold hover:underline flex items-center gap-1'>
                        <i data-lucide='edit-3' class='w-3 h-3'></i> Editar Tutor
                    </button>` : '';

        petsDoTutor.forEach(p => {
            const btnEditarPet = temPermissao('pet_editar')
                ? `<button onclick="abrirModalEditarPet('${p.id}')" class='text-[10px] text-brand-blue font-bold hover:underline flex items-center gap-1'>
                            <i data-lucide='edit-3' class='w-3 h-3'></i> Editar Pet
                        </button>` : '';
            petsHTML += `
                <div class='bg-slate-950 border border-slate-800 p-3.5 rounded-xl space-y-2'>
                    <div class='flex justify-between items-center'>
                        <span class='text-[10px] font-black uppercase text-brand-lime'>${p.especie}</span>
                        ${btnEditarPet}
                    </div>
                    <h5 class='font-bold text-slate-100 text-sm flex items-center gap-1.5'>
                        <i data-lucide='paw-print' class='w-4 h-4 text-brand-lime'></i> ${p.nome}
                    </h5>
                    <p class='text-xs text-slate-400 font-semibold'>${p.raca}</p>
                </div>
            `;
        });

        grid.innerHTML += `
            <div class='bg-slate-950 rounded-2xl border border-slate-850 p-5 flex flex-col md:flex-row gap-4'>
                <div class='md:w-1/3 space-y-2 border-b md:border-b-0 md:border-r border-slate-800 pb-4 md:pb-0 md:pr-4'>
                    <div class='flex items-center justify-between gap-2'>
                        <h4 class='font-bold text-slate-100 text-base'>${t.nome}</h4>
                        ${btnEditarTutor}
                    </div>
                    <p class='text-xs text-slate-400'>CPF: ${t.cpf}</p>
                    <p class='text-xs text-slate-400'>Tel: ${t.tel}</p>
                    <p class='text-xs text-slate-400'>${t.endereco}</p>
                </div>
                <div class='md:w-2/3 space-y-2'>
                    <span class='text-xs font-bold text-slate-400 uppercase'>Pets Vinculados (${petsDoTutor.length})</span>
                    <div class='grid grid-cols-1 sm:grid-cols-2 gap-2'>
                        ${petsHTML || '<p class="text-xs text-slate-500 italic">Nenhum pet cadastrado.</p>'}
                    </div>
                </div>
            </div>
        `;
    });
    lucide.createIcons();
}

function abrirModalTutor() { document.getElementById('modal-tutor').classList.remove('hidden'); }
function fecharModalTutor() { document.getElementById('modal-tutor').classList.add('hidden'); }

function salvarTutor(e) {
    e.preventDefault();
    const nome = document.getElementById('tutor-nome').value;
    const cpf = document.getElementById('tutor-cpf').value;
    const tel = document.getElementById('tutor-tel').value;
    const email = document.getElementById('tutor-email').value;
    const endereco = document.getElementById('tutor-endereco').value;

    tutores.push({ id: Date.now().toString(), nome, cpf, tel, email, endereco });
    fecharModalTutor();
    renderizarTutores();
    showToast("Tutor cadastrado!");
}

function abrirModalEditarTutor(tutorId) {
    const tutor = tutores.find(t => t.id === tutorId);
    if (!tutor) return;
    document.getElementById('edit-tutor-id').value = tutor.id;
    document.getElementById('edit-tutor-nome').value = tutor.nome;
    document.getElementById('edit-tutor-cpf').value = tutor.cpf;
    document.getElementById('edit-tutor-tel').value = tutor.tel;
    document.getElementById('edit-tutor-email').value = tutor.email || '';
    document.getElementById('edit-tutor-endereco').value = tutor.endereco || '';
    document.getElementById('modal-editar-tutor').classList.remove('hidden');
}
function fecharModalEditarTutor() { document.getElementById('modal-editar-tutor').classList.add('hidden'); }

function salvarEdicaoTutor(e) {
    e.preventDefault();
    const tutorId = document.getElementById('edit-tutor-id').value;
    const tutor = tutores.find(t => t.id === tutorId);
    if (tutor) {
        tutor.nome = document.getElementById('edit-tutor-nome').value;
        tutor.cpf = document.getElementById('edit-tutor-cpf').value;
        tutor.tel = document.getElementById('edit-tutor-tel').value;
        tutor.email = document.getElementById('edit-tutor-email').value;
        tutor.endereco = document.getElementById('edit-tutor-endereco').value;
        renderizarTutores();
        showToast("Cadastro do tutor alterado com sucesso!");
    }
    fecharModalEditarTutor();
}

function abrirModalPet() {
    const select = document.getElementById('pet-tutor-select');
    select.innerHTML = '';
    tutores.forEach(t => select.innerHTML += `<option value="${t.id}">${t.nome}</option>`);
    document.getElementById('modal-pet').classList.remove('hidden');
}
function fecharModalPet() { document.getElementById('modal-pet').classList.add('hidden'); }

function salvarPet(e) {
    e.preventDefault();
    const tutorId = document.getElementById('pet-tutor-select').value;
    const nome = document.getElementById('pet-nome').value;
    const especie = document.getElementById('pet-especie').value;
    const raca = document.getElementById('pet-raca').value;
    const comportamento = document.getElementById('pet-comportamento').value;
    const alergias = document.getElementById('pet-alergias').value;

    pets.push({ id: Date.now().toString(), tutorId, nome, especie, raca, comportamento, alergias });
    fecharModalPet();
    renderizarTutores();
    showToast("Pet cadastrado com sucesso!");
}

function abrirModalEditarPet(petId) {
    const pet = pets.find(p => p.id === petId);
    if (!pet) return;
    document.getElementById('edit-pet-id').value = pet.id;
    document.getElementById('edit-pet-nome').value = pet.nome;
    document.getElementById('edit-pet-especie').value = pet.especie;
    document.getElementById('edit-pet-raca').value = pet.raca;
    document.getElementById('edit-pet-comportamento').value = pet.comportamento || '';
    document.getElementById('edit-pet-alergias').value = pet.alergias || '';
    document.getElementById('modal-editar-pet').classList.remove('hidden');
}
function fecharModalEditarPet() { document.getElementById('modal-editar-pet').classList.add('hidden'); }

function salvarEdicaoPet(e) {
    e.preventDefault();
    const petId = document.getElementById('edit-pet-id').value;
    const pet = pets.find(p => p.id === petId);
    if (pet) {
        pet.nome = document.getElementById('edit-pet-nome').value;
        pet.especie = document.getElementById('edit-pet-especie').value;
        pet.raca = document.getElementById('edit-pet-raca').value;
        pet.comportamento = document.getElementById('edit-pet-comportamento').value;
        pet.alergias = document.getElementById('edit-pet-alergias').value;
        renderizarTutores();
        popularPetsDropdowns();
        showToast("Cadastro do pet alterado com sucesso!");
    }
    fecharModalEditarPet();
}

// ==========================================================
// SEÇÃO 8: MÓDULO CLÍNICO
// ==========================================================

function renderizarHistoricoClinico() {
    const container = document.getElementById('clinica-timeline');
    if (!container) return;
    container.innerHTML = '';
    document.getElementById('prontuario-count').innerText = historicoClinico.length + " registros";

    historicoClinico.forEach(h => {
        const pet = pets.find(p => p.id === h.petId);
        let tipoTagColor = "text-brand-lime";
        let docLabel = "RECEITA";
        if (h.tipo === 'laudo') { tipoTagColor = "text-brand-blue"; docLabel = "LAUDO DIAGNÓSTICO"; }
        if (h.tipo === 'guia') { tipoTagColor = "text-brand-pink"; docLabel = "GUIA DE ENCAMINHAMENTO"; }

        const btnImprimir = temPermissao('clinica_imprimir')
            ? `<button onclick="imprimirDocumentoGenerico('${h.id}')" class='text-[11px] text-brand-blue font-bold flex items-center gap-1 hover:underline'>
                        <i data-lucide='printer' class='w-3 h-3'></i> Imprimir ${docLabel}
                    </button>` : `<span></span>`;
        const btnEditar = temPermissao('clinica_editar')
            ? `<button onclick="editarDocumentoClinico('${h.id}')" class='text-[11px] text-brand-lime font-bold hover:underline'>Editar</button>` : '';
        const btnExcluir = temPermissao('clinica_excluir')
            ? `<button onclick="excluirDocumentoClinico('${h.id}')" class='text-[11px] text-rose-400 font-bold hover:underline'>Excluir</button>` : '';

        container.innerHTML += `
            <div class='bg-slate-900/80 p-4 rounded-xl border border-slate-800 space-y-2'>
                <div class='flex items-center justify-between'>
                    <span class='text-xs font-bold ${tipoTagColor} uppercase'>${docLabel} - ${pet ? pet.nome : 'N/A'}</span>
                    <span class='text-xs text-slate-400'>${h.data}</span>
                </div>
                <p class='text-xs text-slate-200 leading-relaxed whitespace-pre-line'>${h.detalhe}</p>
                <div class='flex items-center justify-between pt-1 border-t border-slate-800/60'>
                    ${btnImprimir}
                    <div class='flex items-center gap-2'>
                        ${btnEditar}${btnExcluir}
                    </div>
                </div>
            </div>
        `;
    });
    lucide.createIcons();
}

function prepararNovoDocumentoClinico(tipoDoc) {
    resetarFormClinico();
    document.getElementById('clinica-tipo').value = tipoDoc;
    atualizarLabelDocumento();
    switchTab('clinica');
}

function atualizarLabelDocumento() {
    const tipo = document.getElementById('clinica-tipo').value;
    const label = document.getElementById('clinica-detalhe-label');
    if (tipo === 'laudo') label.innerText = "Detalhamento do Laudo Médico / Exame";
    else if (tipo === 'guia') label.innerText = "Instruções e Encaminhamento da Guia";
    else if (tipo === 'receita') label.innerText = "Prescrição e Posologia de Medicamentos";
    else label.innerText = "Detalhamento / Vacina";
}

function editarDocumentoClinico(id) {
    const doc = historicoClinico.find(h => h.id === id);
    if (!doc) return;
    document.getElementById('clinica-edit-id').value = doc.id;
    document.getElementById('clinica-pet-select').value = doc.petId;
    document.getElementById('clinica-tipo').value = doc.tipo;
    document.getElementById('clinica-data').value = doc.data;
    document.getElementById('clinica-detalhe').value = doc.detalhe;
    document.getElementById('clinica-form-title').innerText = "Editar Documento";
    document.getElementById('btn-cancelar-edit-clinico').classList.remove('hidden');
    atualizarLabelDocumento();
}

function excluirDocumentoClinico(id) {
    historicoClinico = historicoClinico.filter(h => h.id !== id);
    renderizarHistoricoClinico();
    showToast("Documento excluído!");
}

function resetarFormClinico() {
    document.getElementById('clinica-edit-id').value = '';
    document.getElementById('clinica-detalhe').value = '';
    document.getElementById('clinica-form-title').innerText = "Novo Documento Clínico";
    document.getElementById('btn-cancelar-edit-clinico').classList.add('hidden');
}

function salvarRegistroClinico(e) {
    e.preventDefault();
    const editId = document.getElementById('clinica-edit-id').value;
    const petId = document.getElementById('clinica-pet-select').value;
    const tipo = document.getElementById('clinica-tipo').value;
    const data = document.getElementById('clinica-data').value;
    const detalhe = document.getElementById('clinica-detalhe').value;

    if (editId) {
        const doc = historicoClinico.find(h => h.id === editId);
        if (doc) {
            doc.petId = petId;
            doc.tipo = tipo;
            doc.data = data;
            doc.detalhe = detalhe;
            showToast("Documento atualizado com sucesso!");
        }
    } else {
        historicoClinico.unshift({ id: Date.now().toString(), petId, tipo, data, detalhe });
        showToast("Novo documento registrado!");
    }

    resetarFormClinico();
    renderizarHistoricoClinico();
}

function imprimirDocumentoGenerico(id) {
    const doc = historicoClinico.find(h => h.id === id);
    if (!doc) return;
    const pet = pets.find(p => p.id === doc.petId);
    const tutor = tutores.find(t => t.id === (pet ? pet.tutorId : null));

    let titulos = {
        receita: "Prescrição Médica Veterinária (Receituário)",
        laudo: "Laudo Médico Veterinário / Diagnóstico",
        guia: "Guia de Encaminhamento Veterinário",
        vacina: "Comprovante de Imunização"
    };

    document.getElementById('doc-titulo-tipo').innerText = titulos[doc.tipo] || "Documento Clínico";
    document.getElementById('doc-nome-pet').innerText = (pet ? pet.nome : 'N/A') + " (" + (pet ? pet.raca : '') + ")";
    document.getElementById('doc-nome-tutor').innerText = tutor ? tutor.nome : 'N/A';
    document.getElementById('doc-data').innerText = doc.data;
    document.getElementById('doc-conteudo').innerText = doc.detalhe;

    document.getElementById('modal-impressao-documento').classList.remove('hidden');
}

// ==========================================================
// SEÇÃO 9: RELATÓRIOS
// ==========================================================

function switchRelatorioTab(tipo) {
    document.querySelectorAll('.relatorio-conteudo').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('.relatorio-tab-btn').forEach(btn => {
        btn.classList.remove('bg-slate-800', 'text-white', 'border-slate-700');
        btn.classList.add('bg-slate-950', 'text-slate-400', 'border-slate-850');
    });

    const conteudo = document.getElementById('rel-conteudo-' + tipo);
    if (conteudo) conteudo.classList.remove('hidden');

    const btn = document.getElementById('rel-tab-' + tipo);
    if (btn) {
        btn.classList.add('bg-slate-800', 'text-white', 'border-slate-700');
        btn.classList.remove('bg-slate-950', 'text-slate-400', 'border-slate-850');
    }

    if (tipo === 'servicos') renderizarRelatorioServicos();
    else if (tipo === 'tutor') renderizarRelatorioTutor();
    else if (tipo === 'periodo') renderizarRelatorioPeriodo();

    lucide.createIcons();
}

function formatarMoeda(valor) {
    return "R$ " + valor.toFixed(2).replace('.', ',');
}

function renderizarRelatorioServicos() {
    const body = document.getElementById('rel-servicos-table-body');
    if (!body) return;
    body.innerHTML = '';

    const grupos = {};
    agendamentos.forEach(a => {
        if (!grupos[a.servico]) {
            grupos[a.servico] = { qtde: 0, confirmados: 0, receita: 0 };
        }
        grupos[a.servico].qtde += 1;
        grupos[a.servico].receita += a.valor;
        if (a.status === 'confirmado') grupos[a.servico].confirmados += 1;
    });

    const servicos = Object.keys(grupos).sort((a, b) => grupos[b].receita - grupos[a].receita);
    let receitaTotalGeral = 0;
    let atendimentosTotalGeral = 0;

    servicos.forEach(nome => {
        const g = grupos[nome];
        const pctConfirmados = g.qtde > 0 ? Math.round((g.confirmados / g.qtde) * 100) : 0;
        const ticketMedio = g.qtde > 0 ? g.receita / g.qtde : 0;
        receitaTotalGeral += g.receita;
        atendimentosTotalGeral += g.qtde;

        body.innerHTML += `
            <tr class='hover:bg-slate-900/60 border-b border-slate-800/50'>
                <td class='py-3.5 px-6 font-bold text-slate-200'>${nome}</td>
                <td class='py-3.5 px-6 text-slate-300'>${g.qtde}</td>
                <td class='py-3.5 px-6 text-slate-300'>${pctConfirmados}%</td>
                <td class='py-3.5 px-6 font-bold text-brand-lime'>${formatarMoeda(g.receita)}</td>
                <td class='py-3.5 px-6 text-slate-300'>${formatarMoeda(ticketMedio)}</td>
            </tr>
        `;
    });

    if (servicos.length === 0) {
        body.innerHTML = `<tr><td colspan='5' class='py-6 px-6 text-center text-slate-500 italic text-xs'>Nenhum agendamento registrado.</td></tr>`;
    }

    document.getElementById('rel-serv-distintos').innerText = servicos.length;
    document.getElementById('rel-serv-total-atend').innerText = atendimentosTotalGeral;
    document.getElementById('rel-serv-receita-total').innerText = formatarMoeda(receitaTotalGeral);
}

function renderizarRelatorioTutor() {
    const body = document.getElementById('rel-tutor-table-body');
    if (!body) return;
    body.innerHTML = '';

    let receitaTotalGeral = 0;
    let tutoresAtivos = 0;

    const linhas = tutores.map(t => {
        const agendamentosDoTutor = agendamentos.filter(a => a.tutorId === t.id);
        const petsDoTutor = pets.filter(p => p.tutorId === t.id);
        const valorTotal = agendamentosDoTutor.reduce((soma, a) => soma + a.valor, 0);
        const ultimaData = agendamentosDoTutor.length > 0
            ? agendamentosDoTutor.map(a => a.data).sort().reverse()[0]
            : null;

        if (agendamentosDoTutor.length > 0) tutoresAtivos += 1;
        receitaTotalGeral += valorTotal;

        return {
            nome: t.nome,
            pets: petsDoTutor.length,
            qtde: agendamentosDoTutor.length,
            valorTotal,
            ultimaData
        };
    }).sort((a, b) => b.valorTotal - a.valorTotal);

    linhas.forEach(l => {
        body.innerHTML += `
            <tr class='hover:bg-slate-900/60 border-b border-slate-800/50'>
                <td class='py-3.5 px-6 font-bold text-slate-200'>${l.nome}</td>
                <td class='py-3.5 px-6 text-slate-300'>${l.pets}</td>
                <td class='py-3.5 px-6 text-slate-300'>${l.qtde}</td>
                <td class='py-3.5 px-6 font-bold text-brand-lime'>${formatarMoeda(l.valorTotal)}</td>
                <td class='py-3.5 px-6 text-slate-300'>${l.ultimaData || '—'}</td>
            </tr>
        `;
    });

    if (linhas.length === 0) {
        body.innerHTML = `<tr><td colspan='5' class='py-6 px-6 text-center text-slate-500 italic text-xs'>Nenhum tutor cadastrado.</td></tr>`;
    }

    document.getElementById('rel-tutor-ativos').innerText = tutoresAtivos;
    document.getElementById('rel-tutor-ticket-medio').innerText = formatarMoeda(agendamentos.length > 0 ? receitaTotalGeral / agendamentos.length : 0);
    document.getElementById('rel-tutor-receita-total').innerText = formatarMoeda(receitaTotalGeral);
}

function renderizarRelatorioPeriodo() {
    const body = document.getElementById('rel-periodo-table-body');
    if (!body) return;
    body.innerHTML = '';

    const inicio = document.getElementById('rel-periodo-inicio').value;
    const fim = document.getElementById('rel-periodo-fim').value;

    let filtrados = [...agendamentos];
    if (inicio) filtrados = filtrados.filter(a => a.data >= inicio);
    if (fim) filtrados = filtrados.filter(a => a.data <= fim);
    filtrados.sort((a, b) => (a.data + a.hora).localeCompare(b.data + b.hora));

    let receitaTotal = 0;

    filtrados.forEach(a => {
        const pet = pets.find(p => p.id === a.petId);
        const tutor = tutores.find(t => t.id === a.tutorId);
        receitaTotal += a.valor;

        let badge = "";
        if (a.status === 'confirmado') {
            badge = "<span class='bg-brand-lime/10 text-brand-lime border border-brand-lime/20 text-[10px] font-bold px-2 py-0.5 rounded-full'>Confirmado</span>";
        } else if (a.status === 'cancelado') {
            badge = "<span class='bg-red-950/40 text-rose-400 border border-rose-800/40 text-[10px] font-bold px-2 py-0.5 rounded-full'>Cancelado</span>";
        } else {
            badge = "<span class='bg-brand-yellow/10 text-brand-yellow border border-brand-yellow/20 text-[10px] font-bold px-2 py-0.5 rounded-full'>Pendente</span>";
        }

        body.innerHTML += `
            <tr class='hover:bg-slate-900/60 border-b border-slate-800/50'>
                <td class='py-3.5 px-6 text-slate-300'>
                    <div>${a.data}</div>
                    <div class='text-[10px] text-brand-pink font-bold'>${a.hora}</div>
                </td>
                <td class='py-3.5 px-6'>
                    <div class='font-bold text-slate-200'>${pet ? pet.nome : 'N/A'}</div>
                    <div class='text-[10px] text-slate-500'>${tutor ? tutor.nome : 'N/A'}</div>
                </td>
                <td class='py-3.5 px-6 text-slate-300 font-semibold'>${a.servico}</td>
                <td class='py-3.5 px-6'>${badge}</td>
                <td class='py-3.5 px-6 font-bold text-slate-200'>${formatarMoeda(a.valor)}</td>
            </tr>
        `;
    });

    if (filtrados.length === 0) {
        body.innerHTML = `<tr><td colspan='5' class='py-6 px-6 text-center text-slate-500 italic text-xs'>Nenhum agendamento encontrado no período selecionado.</td></tr>`;
    }

    document.getElementById('rel-periodo-qtde').innerText = filtrados.length;
    document.getElementById('rel-periodo-receita').innerText = formatarMoeda(receitaTotal);
    document.getElementById('rel-periodo-ticket').innerText = formatarMoeda(filtrados.length > 0 ? receitaTotal / filtrados.length : 0);
}

function limparFiltroPeriodo() {
    document.getElementById('rel-periodo-inicio').value = '';
    document.getElementById('rel-periodo-fim').value = '';
    renderizarRelatorioPeriodo();
}

function abrirModalGerarRelatorios() { document.getElementById('modal-gerar-relatorios').classList.remove('hidden'); }
function fecharModalGerarRelatorios() { document.getElementById('modal-gerar-relatorios').classList.add('hidden'); }

function executarGeracaoRelatorio() {
    const tipo = document.getElementById('relatorio-tipo').value;
    fecharModalGerarRelatorios();
    showToast("Relatório (" + tipo + ") gerado com sucesso! Abrindo janela de impressão...");
    setTimeout(() => window.print(), 500);
}

// ==========================================================
// SEÇÃO 10: USUÁRIOS & PERMISSÕES
// ==========================================================

function renderizarUsuarios() {
    const body = document.getElementById('usuarios-table-body');
    if (!body) return;
    body.innerHTML = '';

    usuariosMock.forEach(u => {
        body.innerHTML += `
            <tr class='hover:bg-slate-900/60 border-b border-slate-800/50'>
                <td class='py-3.5 px-6 font-bold text-slate-200'>${u.nome}</td>
                <td class='py-3.5 px-6 text-brand-lime font-bold uppercase text-[11px]'>${formatarCargo(u.role)}</td>
                <td class='py-3.5 px-6 text-slate-400'>${u.cpf}</td>
                <td class='py-3.5 px-6 text-right space-x-2'>
                    <button onclick="abrirModalEditarPermissao('${u.id}', '${u.role}')" class='text-brand-blue font-bold hover:underline text-xs'>Editar Permissão</button>
                    <button onclick="excluirUsuarioLogin('${u.id}')" class='text-rose-400 font-bold hover:underline text-xs'>Excluir Login</button>
                </td>
            </tr>
        `;
    });
}

function abrirModalUsuario() { document.getElementById('modal-usuario').classList.remove('hidden'); }
function fecharModalUsuario() { document.getElementById('modal-usuario').classList.add('hidden'); }

// O QUE: Cria novo usuario com validacao de CPF, email e unicidade.
// PORQUÊ: Garante dados obrigatorios validos antes de inserir no mock.
// DEMO (mock): Insercao direta em usuariosMock; senhas geradas por admins.
// TODO [DB] (tabela users + endpoint + bcrypt/LGPD):
//   POST /api/users { nome, cpf, email, role } — backend valida CPF com
//   algoritmo RF, unicidade UNIQUE constraints, e retorna senha temporaria
//   gerada por crypto.randomBytes(). Senha temporaria enviada por email.
//   mustChange=true por padrao. LGPD: log de criacao com criadoPor.
function salvarNovoUsuario(e) {
    e.preventDefault();
    const nome = document.getElementById('user-new-nome').value.trim();
    const cpf = document.getElementById('user-new-cpf').value.trim();
    const email = document.getElementById('user-new-email').value.trim().toLowerCase();
    const role = document.getElementById('user-new-role').value;

    // Valida CPF: apenas digitos + dígito verificador
    if (!validarCPF(cpf)) {
        showToast("CPF inválido. Informe um CPF com dígitos verificadores válidos.", "error");
        return;
    }

    // Valida formato de e-mail
    if (!validarEmail(email)) {
        showToast("E-mail inválido. Informe um endereço como exemplo@dominio.com.", "error");
        return;
    }

    // Verifica unicidade de CPF (sem revelar qual campo duplicou)
    if (usuariosMock.some(u => u.cpf === cpf)) {
        showToast("Credenciais inválidas", "error");
        return;
    }

    // Verifica unicidade de e-mail
    if (usuariosMock.some(u => u.email.toLowerCase() === email)) {
        showToast("Credenciais inválidas", "error");
        return;
    }

    // Senha padrao e mustChange=true: obriga usuario a trocar no primeiro login
    // TODO [DB] Gerar senha temporaria aleatoria no backend + enviar por email
    const senhaTemp = cpf.replace(/\D/g, '').slice(-4) + 'Temp1!';

    usuariosMock.push({
        id: Date.now().toString(),
        nome,
        cpf,
        email,
        role,
        password_demo: senhaTemp,
        mustChange: true,
        active: true,
        criadoPor: currentUser ? currentUser.id : 'sistema',
        criadoEm: new Date().toISOString().slice(0, 10)
    });

    fecharModalUsuario();
    renderizarUsuarios();
    showToast("Novo usuário criado com sucesso!");
}

function abrirModalEditarPermissao(id, roleAtual) {
    document.getElementById('permissao-user-id').value = id;
    document.getElementById('permissao-user-role').value = roleAtual;
    document.getElementById('modal-editar-permissao').classList.remove('hidden');
}
function fecharModalEditarPermissao() { document.getElementById('modal-editar-permissao').classList.add('hidden'); }

function salvarPermissaoUsuario(e) {
    e.preventDefault();
    const id = document.getElementById('permissao-user-id').value;
    const novaRole = document.getElementById('permissao-user-role').value;
    const user = usuariosMock.find(u => u.id === id);
    if (user) {
        user.role = novaRole;
        renderizarUsuarios();
        showToast("Permissão de login alterada!");
    }
    fecharModalEditarPermissao();
}

function excluirUsuarioLogin(id) {
    // TODO [INTEGRAÇÃO BANCO DE DADOS FUTURA]:
    // Enviar DELETE /api/users/:id para remover o registro.
    usuariosMock = usuariosMock.filter(u => u.id !== id);
    renderizarUsuarios();
    showToast("Login excluído do sistema!");
}

// ==========================================================
// SEÇÃO 3b: RECUPERAÇÃO DE SENHA (fluxo demo)
// ==========================================================

// O QUE: Abre modal de recuperar senha na etapa 1 (informar CPF/email).
// PORQUÊ: Permite ao usuario iniciar fluxo de reset quando esqueceu a senha.
// DEMO (mock): Modal HTML simples; etapa 1 visivel, etapa 2 oculta.
// TODO [DB] (tabela users + endpoint + bcrypt/LGPD):
//   POST /api/password-reset/request { identifier } → gera token JWT
//   com expiração de 15 min, envia email com link de reset.
//   Rate-limit: max 3 requests por hora por identificador.
function abrirModalRecuperarSenha() {
    document.getElementById('modal-recuperar-senha').classList.remove('hidden');
    document.getElementById('recuperar-etapa-1').classList.remove('hidden');
    document.getElementById('recuperar-etapa-2').classList.add('hidden');
    document.getElementById('btn-recuperar-proximo').classList.remove('hidden');
    document.getElementById('btn-recuperar-confirmar').classList.add('hidden');
    document.getElementById('recuperar-cpf').value = '';
    document.getElementById('recuperar-nova-senha').value = '';
    document.getElementById('recuperar-confirmar-senha').value = '';
    atualizarIndicadoresRegraSenha('');
}

// O QUE: Fecha modal de recuperar senha e reseta campos.
// PORQUÊ: Limpa estado do modal para proxima abertura.
// DEMO (mock): Apenas esconde o modal e limpa inputs.
// TODO [DB] Invalidar token de reset se modal for fechado.
function fecharModalRecuperarSenha() {
    document.getElementById('modal-recuperar-senha').classList.add('hidden');
    document.getElementById('recuperar-cpf').value = '';
    document.getElementById('recuperar-nova-senha').value = '';
    document.getElementById('recuperar-confirmar-senha').value = '';
}

// O QUE: Avanca para etapa 2 (definir nova senha) apos informar CPF/email.
// PORQUÊ: Simula envio de email de verificacao; sempre mostra toast "demo".
//   Se usuario nao existir, mesma mensagem (nao revela existencia).
// DEMO (mock): Sempre avanca para etapa 2 independente do CPF/email informado.
// TODO [DB] (tabela users + endpoint + bcrypt/LGPD):
//   Backend verifica se identifier existe na tabela users. Se existir,
//   gera token de reset e envia email. Resposta sempre 200 OK (mesmo se
//   identifier nao existe) para prevenir enumerate accounts via timing.
function recuperarSenhaProximo() {
    const identifier = document.getElementById('recuperar-cpf').value.trim();

    if (!identifier) {
        showToast("Informe seu CPF ou e-mail.", "error");
        return;
    }

    // Toast "demo" — sempre exibe independente de o usuario existir
    showToast("E-mail de verificação enviado (demo)! Verifique sua caixa de entrada.", "info");

    // Avanca para etapa 2
    document.getElementById('recuperar-etapa-1').classList.add('hidden');
    document.getElementById('recuperar-etapa-2').classList.remove('hidden');
    document.getElementById('btn-recuperar-proximo').classList.add('hidden');
    document.getElementById('btn-recuperar-confirmar').classList.remove('hidden');
}

// O QUE: Valida e aplica nova senha, atualizando usuariosMock.
// PORQUÊ: Fecha ciclo de recuperacao com politica de senha forte.
// DEMO (mock): Atualiza password_demo e mustChange=false no array.
// TODO [DB] (tabela users + endpoint + bcrypt/LGPD):
//   POST /api/password-reset/confirm { token, novaSenha }
//   → backend valida token JWT, aplica bcrypt.hash(novaSenha, 12),
//   atualiza password_hash e mustChange=false. Token invalidado apos uso.
//   LGPD: historico de senhas N ultimas para evitar reutilizacao.
function recuperarSenhaConfirmar() {
    const novaSenha = document.getElementById('recuperar-nova-senha').value;
    const confirmarSenha = document.getElementById('recuperar-confirmar-senha').value;
    const identifier = document.getElementById('recuperar-cpf').value.trim();

    if (!novaSenha || !confirmarSenha) {
        showToast("Preencha os dois campos de senha.", "error");
        return;
    }

    if (novaSenha !== confirmarSenha) {
        showToast("As senhas não coincidem.", "error");
        return;
    }

    if (!validarSenhaForte(novaSenha)) {
        showToast("Senha não atende à política: 8+ caracteres, 1 maiúscula, 1 número, 1 especial.", "error");
        return;
    }

    // Busca usuario por CPF ou email para atualizar senha
    const user = usuariosMock.find(u =>
        u.cpf === identifier || u.email.toLowerCase() === identifier.toLowerCase()
    );

    // Se usuario nao existe no mock, apenas mostra sucesso (demo)
    if (user) {
        user.password_demo = novaSenha;
        user.mustChange = false;
    }

    fecharModalRecuperarSenha();
    showToast("Senha alterada com sucesso! Faça login com a nova senha.");
}

// ==========================================================
// SEÇÃO 3c: TROCA FORÇADA DE SENHA (mustChange=true)
// ==========================================================

// O QUE: Abre modal de troca forçada quando mustChange=true no login.
// PORQUÊ: Obriga usuario a definir senha forte antes de acessar o sistema.
// DEMO (mock): Modal simples com campos de nova senha e confirmacao.
// TODO [DB] (tabela users + endpoint + bcrypt/LGPD):
//   Endpoint POST /api/users/:id/change-password com Bearer token.
//   Após mustChange=false, emitir novo JWT. LGPD: logs de alteracao
//   de senha com timestamp e IP (sem expor hash).
let _mustChangeUser = null;
function abrirModalForcarTrocaSenha(user) {
    _mustChangeUser = user;
    document.getElementById('forcar-senha-etapa').classList.remove('hidden');
    document.getElementById('forcar-senha-nova').value = '';
    document.getElementById('forcar-senha-confirmar').value = '';
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('forcar-senha-etapa').querySelector('p').textContent =
        'Olá ' + user.nome + '! Você deve definir uma nova senha para acessar o sistema.';
    atualizarIndicadoresForcarSenha('');
}

function fecharModalForcarTrocaSenha() {
    document.getElementById('forcar-senha-etapa').classList.add('hidden');
    document.getElementById('login-screen').classList.remove('hidden');
    _mustChangeUser = null;
}

function confirmarForcarTrocaSenha() {
    const novaSenha = document.getElementById('forcar-senha-nova').value;
    const confirmarSenha = document.getElementById('forcar-senha-confirmar').value;

    if (!novaSenha || !confirmarSenha) {
        showToast("Preencha os dois campos de senha.", "error");
        return;
    }

    if (novaSenha !== confirmarSenha) {
        showToast("As senhas não coincidem.", "error");
        return;
    }

    if (!validarSenhaForte(novaSenha)) {
        showToast("Senha não atende à política: 8+ caracteres, 1 maiúscula, 1 número, 1 especial.", "error");
        return;
    }

    if (_mustChangeUser) {
        // Atualiza no mock
        const user = usuariosMock.find(u => u.id === _mustChangeUser.id);
        if (user) {
            user.password_demo = novaSenha;
            user.mustChange = false;
        }

        fecharModalForcarTrocaSenha();

        // Login automatico apos troca
        const userObj = { id: _mustChangeUser.id, nome: _mustChangeUser.nome, role: _mustChangeUser.role, profissao: _mustChangeUser.role };
        realizarLogin(userObj, _mustChangeUser.role);
        showToast("Senha alterada com sucesso!");
    }
}

// O QUE: Atualiza indicadores visuais (○/●) das regras de senha no modal de recuperação.
// PORQUÊ: Feedback em tempo real das regras de validação para o usuário.
// DEMO (mock): Atualiza classes CSS dos elementos #regra-* conforme input.
// TODO [DB] Mesma lógica aplicável no frontend do formulário de reset via email.
function atualizarIndicadoresRegraSenha(senha) {
    const mapa = {
        'regra-tamanho': senha.length >= 8,
        'regra-simbolo': /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(senha),
        'regra-letras': (senha.match(/[a-zA-Z]/g) || []).length >= 3,
        'regra-numeros': (senha.match(/[0-9]/g) || []).length >= 3
    };
    Object.entries(mapa).forEach(([id, ok]) => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = '<span class="inline-block w-3 mr-1">' + (ok ? '●' : '○') + '</span> ' + el.textContent.replace(/^[●○]\s*/, '');
    });
}

// O QUE: Atualiza indicadores visuais das regras no modal de troca forçada.
// PORQUÊ: Feedback em tempo real durante primeiro login (mustChange).
// DEMO (mock): Mesma logica dos indicadores de recuperacao.
// TODO [DB] Componente reutilizavel no frontend.
function atualizarIndicadoresForcarSenha(senha) {
    const mapa = {
        'forcar-regra-tamanho': senha.length >= 8,
        'forcar-regra-simbolo': /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(senha),
        'forcar-regra-letras': (senha.match(/[a-zA-Z]/g) || []).length >= 3,
        'forcar-regra-numeros': (senha.match(/[0-9]/g) || []).length >= 3
    };
    Object.entries(mapa).forEach(([id, ok]) => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = '<span class="inline-block w-3 mr-1">' + (ok ? '●' : '○') + '</span> ' + el.textContent.replace(/^[●○]\s*/, '');
    });
}

function abrirModalHorarioFuncionamento() { document.getElementById('modal-horario-funcionamento').classList.remove('hidden'); }
function fecharModalHorarioFuncionamento() { document.getElementById('modal-horario-funcionamento').classList.add('hidden'); }

function salvarHorarioFuncionamento(e) {
    e.preventDefault();
    const ab = document.getElementById('horario-abertura').value;
    const fech = document.getElementById('horario-fechamento').value;
    fecharModalHorarioFuncionamento();
    showToast("Horário de funcionamento atualizado para (" + ab + " às " + fech + ")!");
}

// Popular dropdowns de pets para a aba clínica
function popularPetsDropdowns() {
    const select = document.getElementById('clinica-pet-select');
    if (!select) return;
    select.innerHTML = '<option value="">Selecione um Paciente...</option>';
    pets.forEach(p => {
        select.innerHTML += `<option value="${p.id}">${p.nome} (${p.especie} - ${p.raca})</option>`;
    });
}

// ==========================================================
// SEÇÃO 11: GRÁFICOS (Chart.js)
// ==========================================================

function inicializarGraficos() {
    const ctx1 = document.getElementById('financeChart')?.getContext('2d');

    if (ctx1) {
        if (financeChartRef) financeChartRef.destroy();
        financeChartRef = new Chart(ctx1, {
            type: 'line',
            data: {
                labels: ['01/Mai', '05/Mai', '10/Mai', '15/Mai', '18/Mai'],
                datasets: [{
                    label: 'Receita (R$)',
                    data: [1800, 3200, 5400, 8900, 12850],
                    borderColor: '#0066ff',
                    backgroundColor: 'rgba(0, 102, 255, 0.1)',
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8' } },
                    y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8' } }
                }
            }
        });
    }
}

// ==========================================================
// SEÇÃO 12: TEMA CLARO/ESCURO
// ==========================================================

function aplicarTema(theme) {
    document.documentElement.setAttribute('data-theme', theme);
}

function temaSistema() {
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

function inicializarTema() {
    const salvo = localStorage.getItem('dayvet-tema');
    if (salvo) {
        aplicarTema(salvo);
    } else {
        aplicarTema(temaSistema());
        window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', function(e) {
            if (!localStorage.getItem('dayvet-tema')) {
                aplicarTema(e.matches ? 'light' : 'dark');
                atualizarIconeTema();
            }
        });
    }
    atualizarIconeTema();
}

function alternarTema() {
    const atual = document.documentElement.getAttribute('data-theme');
    const novo = atual === 'dark' ? 'light' : 'dark';
    localStorage.setItem('dayvet-tema', novo);
    aplicarTema(novo);
    atualizarIconeTema();
    lucide.createIcons();
}

// O QUE: Atualiza ícone sol/lua nos botões de tema (header principal e login).
// PORQUÊ: Dois botões exibem o tema atual — header (pós-login) e login screen.
//   No modo escuro mostra sol (clicar vai para claro); no claro mostra lua (clicar vai para escuro).
function atualizarIconeTema() {
    const tema = document.documentElement.getAttribute('data-theme');
    const novoIcone = tema === 'dark' ? 'sun' : 'moon';

    // Botão do header principal (visível pós-login)
    const btn = document.getElementById('btn-tema');
    if (btn) {
        const icone = btn.querySelector('i');
        if (icone) icone.setAttribute('data-lucide', novoIcone);
    }

    // Botão do login screen (visível antes do login)
    const btnLogin = document.getElementById('btn-tema-login');
    if (btnLogin) {
        const iconeLogin = btnLogin.querySelector('i');
        if (iconeLogin) iconeLogin.setAttribute('data-lucide', novoIcone);
    }
}

// ==========================================================
// SEÇÃO 13: INICIALIZAÇÃO
// ==========================================================

window.onload = function() {
    inicializarTema();
    lucide.createIcons();
    atualizarPermissoesNavegacao();
    renderizarAgendamentos();
    renderizarTutores();
    renderizarHistoricoClinico();
    renderizarUsuarios();
    inicializarGraficos();
};
