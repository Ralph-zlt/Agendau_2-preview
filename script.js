// ==========================================================
// DAYVET-GESTÃO — script.js
// Backend futuro (decisão 2026-09-22): SQL via Supabase
// (Postgres + Auth + RLS) — projeto ainda NÃO criado.
// Hoje: mocks em memória. Bypass 1/2/3 intencional p/ teste
// do usuário final (protótipo sem dados reais).
// Mapa de seções: [1] Mock DB · [2] Permissões RBAC ·
// [3] Autenticação/Login · [4] Toasts · [5] Navegação/Tabs ·
// [6] Agendamentos · [7] Tutores & Pets · [8] Clínico ·
// [9] Relatórios · [10] Usuários · [11] Gráficos ·
// [12] Tema · [13] Inicialização
// ==========================================================

// ==========================================================
// SEÇÃO 1: DADOS MOCK (simula banco de dados em memória)
// ==========================================================

// TODO [INTEGRAÇÃO SUPABASE]:
// Tabela `administradores` — dados do profissional responsável
// pela clínica (CRMV, validade). Relacionado à tabela `users`
// via id. Futuramente: GET /api/profissional/:id
// TODO [INTEGRAÇÃO SUPABASE]:
// Tabela `tutores` — CHAVE PRIMÁRIA = `cpf` (decisão 2026-09-22: o tutor
// registrado é identificado pelo CPF em todo o sistema, inclusive no
// módulo clínico). Futuramente: tabela `tutores` com PK em `cpf`.
// via id. Futuramente: GET /api/profissional/:id
let administradores = [
    { id: "admin1", nome: "Dr. Douglas Ferreira", cpf: "111.111.111-11", profissao: "veterinario", crm: "CRM-SP 45678", crmValidade: "2029-10-12", senha: "admin" }
];

let tutores = [
    { nome: "Douglas Silva Ferreira", tel: "(11) 98765-4321", cpf: "111.222.333-44", email: "douglas.ferreira@dayvetgestao.com", endereco: "Rua do Pet, 120 - Pilar do Sul", senha: "123" },
    { nome: "Laís Vieira de Oliveira", tel: "(11) 97777-8888", cpf: "222.333.444-55", email: "lais.oliveira@dayvetgestao.com", endereco: "Av. Veterinária, 350 - Pilar do Sul", senha: "123" }
];

let pets = [
    { id: "101", tutorCpf: "111.222.333-44", nome: "Rex", especie: "Canino", raca: "Golden Retriever", sexo: "Macho", peso: 32.5, comportamento: "Dócil e sociável.", alergias: "Nenhuma registrada." },
    { id: "102", tutorCpf: "222.333.444-55", nome: "Mingau", especie: "Felino", raca: "Persa", sexo: "Fêmea", peso: 4.2, comportamento: "Muito dócil e preguiçoso.", alergias: "Sensibilidade a certos medicamentos." }
];

// O QUE: Catálogos do cadastro de pets (ROADMAP §1 item 10).
// PORQUÊ: Espécie, raça e sexo como listas de seleção; peso em kg (opcional).
// TODO [INTEGRAÇÃO SUPABASE - DB SQL]: tabela `pets` com `especie` (enum),
//   `raca` (varchar), `sexo` (enum Macho/Fêmea), `peso` (decimal NULL).
const ESPECIES_PET = ["Canino", "Felino", "Equino", "Bovino", "Suíno", "Ovino", "Outro"];
const SEXOS_PET = ["Macho", "Fêmea"];
// O QUE: Catálogo de raças por espécie — gerenciado por funcionário/admin (como tipos de vacina).
// PORQUÊ: Raça como lista de seleção no cadastro/edição de pet.
// TODO [INTEGRAÇÃO SUPABASE - DB SQL]: tabela `raca_tipos` (id, especie, nome, ativo).
let racasPorEspecie = {
    "Canino": ["Labrador Retriever", "Golden Retriever", "Poodle", "Bulldog", "Pastor Alemão", "SRD", "Outra"],
    "Felino": ["Persa", "Siamês", "Maine Coon", "SRD", "Outra"],
    "Equino": ["Quarto de Milha", "Mangalarga", "Árabe", "Puro-Sangue Inglês", "Outra"],
    "Bovino": ["Nelore", "Gir", "Holandesa", "Angus", "Outra"],
    "Suíno": ["Large White", "Landrace", "Duroc", "Outra"],
    "Ovino": ["Santa Inês", "Dorper", "Suffolk", "Outra"],
    "Outro": ["Outra"]
};
// Compat: código antigo lia RACAS_POR_ESPECIE fixo — agora é mutável via racasPorEspecie.
const RACAS_POR_ESPECIE = racasPorEspecie;

// O QUE: Data ISO deslocada N dias a partir de hoje (mocks sempre com exemplos ativos + expirados).
function isoDeslocado(dias) {
    const d = new Date();
    d.setDate(d.getDate() + dias);
    return d.toISOString().slice(0, 10);
}

// O QUE: Vínculo do agendamento com o veterinário (dashboard do vet filtra por vetId).
// TODO [INTEGRAÇÃO SUPABASE - DB SQL]: coluna `vetId` FK → `users(id)` em `agendamentos`.
let agendamentos = [
    { id: "201", petId: "101", tutorCpf: "111.222.333-44", vetId: "u2", servico: "Consulta Veterinária", data: isoDeslocado(1), hora: "09:30", valor: 150.00, status: "confirmado" },
    { id: "202", petId: "102", tutorCpf: "222.333.444-55", vetId: "u2", servico: "Exame Clínico", data: isoDeslocado(0), hora: "14:00", valor: 90.00, status: "confirmado" },
    { id: "203", petId: "101", tutorCpf: "111.222.333-44", vetId: "u2", servico: "Vacinação", vacinaTipo: "Antirrábica", data: isoDeslocado(2), hora: "10:00", valor: 110.00, status: "confirmado" },
    { id: "204", petId: "102", tutorCpf: "222.333.444-55", vetId: "u2", servico: "Consulta Veterinária", data: isoDeslocado(3), hora: "11:00", valor: 150.00, status: "pendente" },
    { id: "205", petId: "101", tutorCpf: "111.222.333-44", vetId: "u2", servico: "Consulta Veterinária", data: isoDeslocado(-2), hora: "09:00", valor: 150.00, status: "cancelado" },
    { id: "206", petId: "102", tutorCpf: "222.333.444-55", vetId: "u2", servico: "Vacinação", vacinaTipo: "V10", data: isoDeslocado(-1), hora: "15:00", valor: 120.00, status: "concluido" },
    { id: "207", petId: "101", tutorCpf: "111.222.333-44", vetId: "u2", servico: "Exame Clínico", data: isoDeslocado(-20), hora: "10:30", valor: 90.00, status: "concluido" },
    { id: "208", petId: "102", tutorCpf: "222.333.444-55", vetId: "u2", servico: "Consulta Veterinária", data: "2026-03-10", hora: "09:00", valor: 150.00, status: "concluido" },
    { id: "209", petId: "101", tutorCpf: "111.222.333-44", vetId: "u2", servico: "Vacinação", vacinaTipo: "V8", data: "2026-03-18", hora: "11:00", valor: 110.00, status: "cancelado" }
];

// O QUE: Catálogo de tipos de vacina (select) — gerenciado pelo funcionário (ROADMAP §1 item 7).
// PORQUÊ: Vacinação deve informar o tipo (agendamento + clínico + relatórios); funcionário faz CRUD, vet/admin só listam.
// TODO [INTEGRAÇÃO SUPABASE - DB SQL]: tabela `vacina_tipos` (id, nome, ativo) + coluna
//   `vacinaTipo` em `agendamentos` e `historico_clinico`.
let tiposVacina = ["Antirrábica", "V8", "V10", "V12", "Tríplice Felina", "Quádrupla Felina", "Giárdia", "Tosse dos Canis", "Leishmaniose", "Outra"];
// Compat: código antigo lia TIPOS_VACINA fixo — agora é mutável via tiposVacina.
const TIPOS_VACINA = tiposVacina;

let historicoClinico = [
    { id: "402", petId: "102", tutorCpf: "222.333.444-55", tipo: "receita", data: "2026-05-12", detalhe: "PRESCRIÇÃO: Dipirona Gotas (1 gota por kg a cada 12 horas por 3 dias)." },
    { id: "403", petId: "101", tutorCpf: "111.222.333-44", tipo: "guia", data: "2026-05-10", detalhe: "GUIA DE ENCAMINHAMENTO: Solicitação de Ecocardiograma Veterinário de rotina." }
];

// O QUE: Anexos do módulo clínico (exames, documentos) — protótipo em memória.
// PORQUÊ: Área de upload junto ao criar (Receita/Guia); some ao recarregar.
// DEMO (mock): Guarda só metadados (nome/tipo/tamanho/data/vínculos).
// TODO [INTEGRAÇÃO SUPABASE - DB SQL] (storage + tabela documentos):
//   POST /api/documentos (multipart) → Supabase Storage; metadados em
//   `documentos {id, petId, tutorCpf, clinicoId, nome, tipo, tamanho, url}`.
let anexosClinicos = [];

// O QUE: Estoque mock de usuários com campos estendidos para auth empresarial.
// PORQUÊ: Simula tabela `users` com autenticação por CPF/e-mail + senha,
//   flag mustChange para troca forçada e controle de ativação.
// DEMO (mock): Senhas salvas em plaintext em password_demo (nunca logadas).
// TODO [INTEGRAÇÃO SUPABASE - DB SQL] (tabela users + endpoint + bcrypt/LGPD):
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
    // TODO [INTEGRAÇÃO SUPABASE - DB SQL] (tabela users): mustChange persistido no banco; após troca → false permanente.
    // CONTAS TESTE 1/2/3: bypass troca p/ prototipação — REMOVER EM PRODUÇÃO
    // TODO [SECURITY]: remover bypass demo antes da produção
    { id: 'u2', nome: 'Dr. Carlos Silva', cpf: '333.333.333-33', email: 'carlos@dayvet.com', role: 'veterinario', password_demo: '2', mustChange: false, active: true, criadoPor: 'sistema', criadoEm: '2026-01-01' },
    { id: 'u3', nome: 'Lucas Atendente', cpf: '444.444.444-44', email: 'lucas@dayvet.com', role: 'funcionario', password_demo: '3', mustChange: false, active: true, criadoPor: 'sistema', criadoEm: '2026-01-01' }
];

let currentUser = { id: "1", nome: "Dr. Douglas Ferreira", role: "admin", profissao: "admin" };
let currentRole = 'admin';
let configRestricao = "comercial";
let filtroAgendamentosStatus = "todos";
// O QUE: Flag de remarcação (volta como pendente) + estado do histórico de Expirados.
// PORQUÊ: Expirados abre colapsado (só Últimos 7 dias); pesquisa por mês/ano filtra o histórico.
let remarcandoAgendamento = false;
let expiradosExpandido = false;
let pesquisaMesExpirados = '';

let financeChartRef = null;
let consultasChartRef = null;

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
// TODO [INTEGRAÇÃO SUPABASE]:
// A tabela `users` armazena o campo `role` do usuário.
// Na autenticação, o backend valida o CPF e retorna o role.
// O frontend apenas consulta PERMISSOES[currentRole] para
// habilitar/desabilitar botões e abas na interface.
const PERMISSOES = {
    admin: ['*'],
    veterinario: [
        'clinica_criar', 'clinica_editar', 'clinica_excluir', 'clinica_imprimir',
        'consulta_agendar', 'consulta_editar', 'consulta_cancelar', 'consulta_confirmar',
        'vacinacao_agendar', 'vacinacao_editar', 'vacinacao_cancelar', 'vacinacao_confirmar',
        'vacina_tipos_criar', 'vacina_tipos_editar', 'vacina_tipos_excluir', 'vacina_tipos_listar',
        'raca_tipos_listar',
        'relatorios_gerar'
    ],
    funcionario: [
        // Sem modo clínico (decisão 2026-09-25): sem clinica_* e sem vacina_tipos_*.
        // Agendamentos só-leitura; mantém ver + relatórios, tutor/pet incluir e tipos de raça.
        'raca_tipos_criar', 'raca_tipos_editar', 'raca_tipos_excluir', 'raca_tipos_listar',
        'relatorios_gerar', 'tutor_incluir', 'pet_incluir'
    ]
};

function temPermissao(acao) {
    const perms = PERMISSOES[currentRole] || [];
    return perms.includes('*') || perms.includes(acao);
}

// ==========================================================
// SEÇÃO 3: AUTENTICAÇÃO E LOGIN (identificação por CPF)
// ==========================================================

// TODO [INTEGRAÇÃO SUPABASE]:
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
// TODO [INTEGRAÇÃO SUPABASE - DB SQL] (tabela users + endpoint + bcrypt/LGPD):
//   Não será necessário no backend — o login real busca por CPF/email
//   na tabela `users` e valida bcrypt. Este mapa é exclusivo do protótipo.
// TODO [SECURITY]: remover bypass demo antes da produção
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
// TODO [INTEGRAÇÃO SUPABASE - DB SQL] (tabela users + endpoint + bcrypt/LGPD):
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

// O QUE: Acessos temporários do protótipo (estilo "login salvo").
// PORQUÊ: Facilita o teste pelo usuário final sem decorar CPFs 1/2/3:
//   digitar qualquer coisa no campo usuário exibe Administrador,
//   Veterinário e Funcionário; clicar preenche usuário+senha e acessa.
// DEMO (mock): Atalhos por apelido (admin/vet/fun) + CPFs curtos 1/2/3.
// TODO [INTEGRAÇÃO SUPABASE - DB SQL]: remover todo este bloco —
//   o login real identifica o perfil pelo CPF/e-mail na tabela `users`.
// TODO [SECURITY]: remover acessos temporários antes da produção
const ACESSOS_TEMPORARIOS = [
    { role: 'admin', rotulo: 'Administrador', icone: 'shield-check', apelidos: ['admin', 'administrador', '1', '111'] },
    { role: 'veterinario', rotulo: 'Veterinário', icone: 'stethoscope', apelidos: ['vet', 'veterinario', 'veterinário', '2', '222'] },
    { role: 'funcionario', rotulo: 'Funcionário', icone: 'clipboard-list', apelidos: ['fun', 'func', 'funcionario', 'funcionário', '3', '333'] }
];

const CPF_DEMO_POR_ROLE = { admin: '1', veterinario: '2', funcionario: '3' };

// O QUE: Filtra e exibe as sugestões de acesso temporário conforme o digitado.
// PORQUÊ: Experiência próxima ao login salvo do navegador.
// DEMO (mock): Filtro por substring nos apelidos/rótulos; sem backend.
function filtrarSugestoesLogin() {
    const box = document.getElementById('login-sugestoes');
    if (!box) return;
    const termo = document.getElementById('login-cpf').value.trim().toLowerCase();
    const visiveis = ACESSOS_TEMPORARIOS.filter(a =>
        !termo || a.rotulo.toLowerCase().includes(termo) ||
        a.apelidos.some(ap => ap.includes(termo))
    );
    if (!visiveis.length) { box.classList.add('hidden'); box.innerHTML = ''; return; }
    box.innerHTML = visiveis.map(a =>
        `<button type="button" onclick="preencherLoginTemporario('${a.role}')" ` +
        `class="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 ` +
        `hover:border-brand-lime text-left transition-all group">` +
        `<i data-lucide="${a.icone}" class="w-4 h-4 text-slate-500 group-hover:text-brand-lime"></i>` +
        `<span><span class="block text-xs font-bold text-slate-200">${a.rotulo}</span>` +
        `<span class="block text-[10px] text-slate-500">acesso temporário — toque para entrar</span></span>` +
        `</button>`
    ).join('');
    box.classList.remove('hidden');
    if (window.lucide) lucide.createIcons();
}

// O QUE: Preenche usuário+senha do acesso temporário e acessa automaticamente.
// PORQUÊ: Um toque equivale ao "login salvo" do navegador no protótipo.
// DEMO (mock): Usa os CPFs curtos 1/2/3 via perfisTestes; sem backend.
function preencherLoginTemporario(role) {
    const cpf = CPF_DEMO_POR_ROLE[role];
    if (!cpf) return;
    const demoUser = perfisTestes[cpf];
    if (!demoUser) return;
    document.getElementById('login-cpf').value = cpf;
    document.getElementById('login-password').value = demoUser.password_demo || '';
    const box = document.getElementById('login-sugestoes');
    if (box) { box.classList.add('hidden'); box.innerHTML = ''; }
    handleAuthSubmit(null);
}

// O QUE: Valida CPF brasileiro (dígito verificador x10 e x11).
// PORQUÊ: Impede cadastro de CPFs inventados no formulário de criação de usuário.
// DEMO (mock): Algoritmo padrão da Receita Federal; sem consulta externa.
// TODO [INTEGRAÇÃO SUPABASE - DB SQL] (tabela users + endpoint + bcrypt/LGPD):
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
// TODO [INTEGRAÇÃO SUPABASE - DB SQL] (tabela users + endpoint + bcrypt/LGPD):
//   Validacao server-side com biblioteca (ex: validator.js) + envio de email
//   de confirmacao para verificar titularidade.
function validarEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// O QUE: Valida politica de senha forte (8+ chars, 1 maiuscula, 1 numero, 1 especial).
// PORQUÊ: Garante seguranca minima para contas empresariais.
// DEMO (mock): Regex local; no backend usaria mesma regra antes de bcrypt.hash().
// TODO [INTEGRAÇÃO SUPABASE - DB SQL] (tabela users + endpoint + bcrypt/LGPD):
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
    const podeClinica = (currentRole === 'admin' || currentRole === 'veterinario'); // Funcionário sem modo clínico (decisão 2026-09-25)
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
    // Visões restritas de catálogos: tipos de vacina = admin/vet; tipos de raça = admin/funcionário.
    // (Admin cobre via '*' — paridade: tudo que os demais podem, o admin também pode.)
    toggleEl('tipos-vacina-card-func', temPermissao('vacina_tipos_criar'));
    toggleEl('racas-card-gerenciar', temPermissao('raca_tipos_criar'));
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
    if (tabId === 'clinica' && currentRole === 'funcionario') {
        showToast("Acesso restrito: perfil sem permissão para o Módulo Clínico.", "error");
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
    const bodyA = document.getElementById('agendamentos-table-body');
    const bodyE = document.getElementById('expirados-table-body');
    if (!bodyA || !bodyE) return;
    bodyA.innerHTML = '';
    bodyE.innerHTML = '';

    // Ativos em cima (ordem crescente), Expirados abaixo (mais recentes primeiro, agrupados).
    const porStatus = (a) => filtroAgendamentosStatus === 'todos' || a.status === filtroAgendamentosStatus;
    const ord = (x, y) => String(x.data + x.hora).localeCompare(String(y.data + y.hora));
    const ativos = agendamentos.filter(a => !agExpirado(a) && porStatus(a)).sort(ord);
    const expirados = agendamentos.filter(a => agExpirado(a) && porStatus(a)).sort((x, y) => ord(y, x));

    ativos.forEach(a => { bodyA.innerHTML += linhaAgendamento(a, false); });

    const limite7d = isoDeslocado(-7);
    const mesAtual = hojeISO().slice(0, 7);
    let grupoAtual = '';
    let listaExpirados = expirados;
    // Pesquisa por mês/ano mostra resultados direto (colapsado ou não).
    if (pesquisaMesExpirados) {
        listaExpirados = expirados.filter(a => (a.data || '').slice(0, 7) === pesquisaMesExpirados);
    } else if (!expiradosExpandido) {
        // Colapsado: só Últimos 7 dias.
        listaExpirados = expirados.filter(a => (a.data || '') >= limite7d);
    }
    listaExpirados.forEach(a => {
        const grupo = grupoExpirado(a.data, limite7d, mesAtual);
        if (grupo !== grupoAtual) {
            grupoAtual = grupo;
            bodyE.innerHTML += `<tr class='bg-slate-900/60'><td colspan='6' class='py-2 px-6 text-[11px] font-black uppercase tracking-wider text-slate-400'>${grupo}</td></tr>`;
        }
        bodyE.innerHTML += linhaAgendamento(a, true);
    });

    document.getElementById('agendamento-counter').innerText = "Exibindo " + ativos.length + " compromissos";
    const totalExp = expirados.length;
    document.getElementById('expirados-counter').innerText = pesquisaMesExpirados
        ? `Exibindo ${listaExpirados.length} de ${totalExp} (${pesquisaMesExpirados.slice(5, 7)}/${pesquisaMesExpirados.slice(0, 4)})`
        : (!expiradosExpandido && totalExp > listaExpirados.length
            ? `Últimos 7 dias (${listaExpirados.length} de ${totalExp}) — carregue mais antigas`
            : `Exibindo ${listaExpirados.length} no histórico`);
    const btnExp = document.getElementById('btn-expandir-expirados');
    if (btnExp) {
        btnExp.classList.toggle('hidden', !!pesquisaMesExpirados);
        btnExp.innerHTML = expiradosExpandido ? 'Mostrar menos' : 'Carregar mais antigas';
    }
    const btnLimpar = document.getElementById('btn-limpar-pesquisa-mes');
    if (btnLimpar) btnLimpar.classList.toggle('hidden', !pesquisaMesExpirados);
    lucide.createIcons();
}

// O QUE: Expande/recolhe o histórico de Expirados.
function alternarExpiradosExpandido() {
    expiradosExpandido = !expiradosExpandido;
    renderizarAgendamentos();
}

// O QUE: Pesquisa Expirados por mês/ano via seleção (só leitura — funcionário também pesquisa).
// PORQUÊ: <input type=month> não abre seleção em todos os navegadores — selects funcionam sempre.
function inicializarPesquisaMes() {
    const selM = document.getElementById('pesquisa-mes-sel');
    const selA = document.getElementById('pesquisa-ano-sel');
    if (!selM || !selA || selM.options.length) return;
    MESES_PT.forEach((m, i) => {
        selM.innerHTML += `<option value="${String(i + 1).padStart(2, '0')}">${m}</option>`;
    });
    const anoAtual = new Date().getFullYear();
    for (let a = anoAtual - 3; a <= anoAtual + 1; a++) {
        selA.innerHTML += `<option value="${a}">${a}</option>`;
    }
    selM.value = String(new Date().getMonth() + 1).padStart(2, '0');
    selA.value = String(anoAtual);
}
function pesquisarMesExpirados() {
    const mes = document.getElementById('pesquisa-mes-sel')?.value || '';
    const ano = document.getElementById('pesquisa-ano-sel')?.value || '';
    pesquisaMesExpirados = (/^\d{2}$/.test(mes) && /^\d{4}$/.test(ano)) ? `${ano}-${mes}` : '';
    renderizarAgendamentos();
}
function limparPesquisaMesExpirados() {
    pesquisaMesExpirados = '';
    inicializarPesquisaMesReset();
    renderizarAgendamentos();
}
function inicializarPesquisaMesReset() {
    const selM = document.getElementById('pesquisa-mes-sel');
    const selA = document.getElementById('pesquisa-ano-sel');
    if (!selM || !selA) return;
    selM.value = String(new Date().getMonth() + 1).padStart(2, '0');
    selA.value = String(new Date().getFullYear());
}

// O QUE: Linha da tabela de agendamentos (usada nas duas seções: Ativos e Expirados).
function linhaAgendamento(a, expirado) {
    const pet = pets.find(p => p.id === a.petId);
    const tutor = tutores.find(t => t.cpf === a.tutorCpf);

    let badge = "";
    if (a.status === 'confirmado') {
        badge = "<span class='bg-brand-lime/10 text-brand-lime border border-brand-lime/20 text-xs font-bold px-2.5 py-1 rounded-full'>Confirmado</span>";
    } else if (a.status === 'cancelado') {
        badge = "<span class='bg-red-950/40 text-rose-400 border border-rose-800/40 text-xs font-bold px-2.5 py-1 rounded-full'>Cancelado</span>";
    } else if (a.status === 'concluido') {
        badge = "<span class='bg-brand-blue/10 text-brand-blue border border-brand-blue/20 text-xs font-bold px-2.5 py-1 rounded-full'>Concluído</span>";
    } else {
        badge = "<span class='bg-brand-yellow/10 text-brand-yellow border border-brand-yellow/20 text-xs font-bold px-2.5 py-1 rounded-full'>Pendente</span>";
    }

    const ehVacinacao = /vacin/i.test(a.servico);
    const permAgendar = ehVacinacao ? 'vacinacao_agendar' : 'consulta_agendar';
    const permEditar = ehVacinacao ? 'vacinacao_editar' : 'consulta_editar';
    const permCancelar = ehVacinacao ? 'vacinacao_cancelar' : 'consulta_cancelar';
    const permConfirmar = ehVacinacao ? 'vacinacao_confirmar' : 'consulta_confirmar';

    const btnRegistrarValor = temPermissao('valores_registrar')
        ? `<button onclick="abrirModalRegistrarValor('${a.id}', ${a.valor})" class='ml-2 text-[10px] text-brand-lime hover:underline'>[Registrar Valor]</button>`
        : '';
    const btnEditar = temPermissao(permEditar)
        ? `<button onclick="editarAgendamentoPrompt('${a.id}')" class='text-brand-blue hover:opacity-80 font-bold text-xs bg-brand-blue/10 px-2 py-1 rounded-lg'>Editar</button>` : '';
    let acoes = '';
    if (expirado) {
        if (a.status === 'concluido') {
            // Concluído: marcar nova consulta (novo agendamento com mesmos dados).
            acoes = temPermissao(permAgendar)
                ? `<button onclick="marcarNovaConsulta('${a.id}')" class='text-brand-lime hover:opacity-80 font-bold text-xs bg-brand-lime/10 px-2 py-1 rounded-lg'>Nova consulta</button>` : '';
        } else if (a.status === 'cancelado') {
            acoes = temPermissao(permEditar)
                ? `<button onclick="remarcarAgendamento('${a.id}')" class='text-brand-lime hover:opacity-80 font-bold text-xs bg-brand-lime/10 px-2 py-1 rounded-lg'>Remarcar</button>` : '';
        } else {
            // Pendente/confirmado vencido: pode cancelar ou remarcar (Editar também permite).
            const btnRemarcar = temPermissao(permEditar)
                ? `<button onclick="remarcarAgendamento('${a.id}')" class='text-brand-lime hover:opacity-80 font-bold text-xs bg-brand-lime/10 px-2 py-1 rounded-lg'>Remarcar</button>` : '';
            const btnCancelar = temPermissao(permCancelar)
                ? `<button onclick="alterarStatusAgendamento('${a.id}', 'cancelado')" class='text-rose-400 hover:opacity-80 font-bold text-xs bg-rose-500/10 px-2 py-1 rounded-lg'>Cancelar</button>` : '';
            acoes = btnRemarcar + btnEditar + btnCancelar;
        }
    } else {
        const btnConfirmar = (a.status !== 'confirmado' && a.status !== 'concluido' && temPermissao(permConfirmar))
            ? `<button onclick="alterarStatusAgendamento('${a.id}', 'confirmado')" class='text-brand-lime hover:opacity-80 font-bold text-xs bg-brand-lime/10 px-2 py-1 rounded-lg'>Confirmar</button>` : '';
        const btnConcluir = (a.status !== 'concluido' && temPermissao(permConfirmar))
            ? `<button onclick="alterarStatusAgendamento('${a.id}', 'concluido')" class='text-brand-blue hover:opacity-80 font-bold text-xs bg-brand-blue/10 px-2 py-1 rounded-lg'>Concluir</button>` : '';
        const btnCancelar = (a.status !== 'cancelado' && a.status !== 'concluido' && temPermissao(permCancelar))
            ? `<button onclick="alterarStatusAgendamento('${a.id}', 'cancelado')" class='text-rose-400 hover:opacity-80 font-bold text-xs bg-rose-500/10 px-2 py-1 rounded-lg'>Cancelar</button>` : '';
        acoes = btnConfirmar + btnConcluir + btnEditar + btnCancelar;
    }

    return `
        <tr class='hover:bg-slate-900/60 transition-all border-b border-slate-800/50'>
            <td class='py-4 px-6'>
                <div class='font-bold text-slate-200'>${pet ? pet.nome : 'N/A'}</div>
                <div class='text-xs text-slate-500'>${tutor ? tutor.nome : 'N/A'}</div>
            </td>
            <td class='py-4 px-6 text-slate-300 font-semibold'>${a.servico}${/vacin/i.test(a.servico) && a.vacinaTipo ? ' — ' + a.vacinaTipo : ''}</td>
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
                ${acoes}
                ${!acoes ? `<span class='text-slate-600 text-[11px] italic'>Sem ações disponíveis</span>` : ''}
            </td>
        </tr>
    `;
}

// O QUE: Novo agendamento a partir de um concluído (mesmos pet/tutor/serviço, data em aberto).
function marcarNovaConsulta(id) {
    const ag = agendamentos.find(a => a.id === id);
    if (!ag) return;
    const permAgendar = /vacin/i.test(ag.servico) ? 'vacinacao_agendar' : 'consulta_agendar';
    if (!temPermissao(permAgendar)) {
        showToast("Acesso restrito: perfil somente leitura em agendamentos.", "error");
        return;
    }
    abrirModalAgendamento();
    // Título acompanha o serviço de origem: vacinação → "Agendar Vacinação".
    document.getElementById('modal-agendamento-titulo').innerText = /vacin/i.test(ag.servico || '') ? "Agendar Vacinação" : "Agendar Consulta";
    document.getElementById('agend-tutor-select').value = ag.tutorCpf;
    popularPetsDoTutor();
    document.getElementById('agend-pet-select').value = ag.petId;
    document.getElementById('agend-tipo').value = ag.servico;
    popularVacinaTiposAg(ag.vacinaTipo || '');
    document.getElementById('agend-vacina-novo-nome').value = '';
    atualizarVisibilidadeVacinaAg();
    document.getElementById('agend-valor').value = ag.valor;
    document.getElementById('agend-data').value = '';
    document.getElementById('agend-hora').value = '';
}

function abrirModalSolicitarAgendamento(tipoServico) {
    if (!temPermissao('consulta_agendar') && !temPermissao('vacinacao_agendar')) {
        showToast("Acesso restrito: perfil somente leitura em agendamentos.", "error");
        return;
    }
    abrirModalAgendamento();
    // Título dinâmico: vacinação abre como "Agendar Vacinação", não "Agendar Consulta".
    document.getElementById('modal-agendamento-titulo').innerText = "Agendar Vacinação";
    document.getElementById('agend-tipo').value = tipoServico;
    atualizarVisibilidadeVacinaAg();
}

// O QUE: Preenche o select de tipos de vacina do agendamento.
// PORQUÊ: Vacinação exige informar o tipo (lê tiposVacina mutável — CRUD do funcionário).
function popularVacinaTiposAg(selecionado) {
    const select = document.getElementById('agend-vacina-tipo');
    if (!select) return;
    select.innerHTML = '<option value="">Selecione o tipo...</option>';
    tiposVacina.forEach(t => {
        select.innerHTML += `<option value="${t}"${t === selecionado ? ' selected' : ''}>${t}</option>`;
    });
}

// O QUE: Exibe o campo de tipo de vacina só quando o serviço é vacinação (+ campo novo-tipo se "Outro").
function atualizarVisibilidadeVacinaAg() {
    const servico = document.getElementById('agend-tipo').value || '';
    const bloco = document.getElementById('agend-vacina-bloco');
    if (!bloco) return;
    bloco.classList.toggle('hidden', !/vacin/i.test(servico));
    const novo = document.getElementById('agend-vacina-novo-bloco');
    if (novo) {
        const tipo = document.getElementById('agend-vacina-tipo')?.value || '';
        novo.classList.toggle('hidden', tipo !== 'Outro');
    }
}

function editarAgendamentoPrompt(id) {
    const ag = agendamentos.find(a => a.id === id);
    if (!ag) return;
    const permEditar = /vacin/i.test(ag.servico) ? 'vacinacao_editar' : 'consulta_editar';
    if (!temPermissao(permEditar)) {
        showToast("Acesso restrito: perfil somente leitura em agendamentos.", "error");
        return;
    }
    abrirModalAgendamento();
    document.getElementById('edit-agend-id').value = ag.id;
    document.getElementById('modal-agendamento-titulo').innerText = "Editar Agendamento";
    document.getElementById('agend-tutor-select').value = ag.tutorCpf;
    popularPetsDoTutor();
    document.getElementById('agend-pet-select').value = ag.petId;
    document.getElementById('agend-tipo').value = ag.servico;
    popularVacinaTiposAg(ag.vacinaTipo || '');
    document.getElementById('agend-vacina-novo-nome').value = '';
    atualizarVisibilidadeVacinaAg();
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
    if (!item) return;
    const ehVacinacao = /vacin/i.test(item.servico || '');
    const perm = (status === 'confirmado' || status === 'concluido')
        ? (ehVacinacao ? 'vacinacao_confirmar' : 'consulta_confirmar')
        : (ehVacinacao ? 'vacinacao_cancelar' : 'consulta_cancelar');
    if (!temPermissao(perm)) {
        showToast("Acesso restrito: perfil somente leitura em agendamentos.", "error");
        return;
    }
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

// O QUE: Seções Ativos × Expirados da aba Agendamentos (uma abaixo da outra).
// PORQUÊ: Vencidos/cancelados/concluídos ficam no histórico abaixo; remarcar volta como pendente.
// TODO [INTEGRAÇÃO SUPABASE]: filtrar por `data` + `status` no backend.
function hojeISO() { return new Date().toISOString().slice(0, 10); }
function agVencido(a) { return (a.data || '') < hojeISO() && (a.status === 'pendente' || a.status === 'confirmado'); }
function agExpirado(a) { return agVencido(a) || a.status === 'cancelado' || a.status === 'concluido'; }

// O QUE: Faixa do histórico de Expirados — Últimos 7 dias, Este mês, depois um grupo por mês.
const MESES_PT = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
function nomeMesAno(dataISO) {
    const ano = dataISO.slice(0, 4);
    const mes = parseInt(dataISO.slice(5, 7), 10);
    return (MESES_PT[mes - 1] || 'Mês') + ' de ' + ano;
}
function grupoExpirado(data, limite7d, mesAtual) {
    if ((data || '') >= limite7d) return 'Últimos 7 dias';
    if ((data || '').slice(0, 7) === mesAtual) return 'Este mês';
    return nomeMesAno(data || '');
}

// O QUE: Reabre o agendamento expirado para nova data (volta como pendente → "sobe").
function remarcarAgendamento(id) {
    const ag = agendamentos.find(a => a.id === id);
    if (!ag) return;
    const permEditar = /vacin/i.test(ag.servico) ? 'vacinacao_editar' : 'consulta_editar';
    if (!temPermissao(permEditar)) {
        showToast("Acesso restrito: perfil somente leitura em agendamentos.", "error");
        return;
    }
    abrirModalAgendamento();
    document.getElementById('edit-agend-id').value = ag.id;
    document.getElementById('modal-agendamento-titulo').innerText = "Remarcar Agendamento";
    document.getElementById('agend-tutor-select').value = ag.tutorCpf;
    popularPetsDoTutor();
    document.getElementById('agend-pet-select').value = ag.petId;
    document.getElementById('agend-tipo').value = ag.servico;
    popularVacinaTiposAg(ag.vacinaTipo || '');
    document.getElementById('agend-vacina-novo-nome').value = '';
    atualizarVisibilidadeVacinaAg();
    document.getElementById('agend-valor').value = ag.valor;
    document.getElementById('agend-data').value = '';
    document.getElementById('agend-hora').value = '';
    remarcandoAgendamento = true;
}

function abrirModalAgendamento() {
    if (!temPermissao('consulta_agendar') && !temPermissao('vacinacao_agendar')) {
        showToast("Acesso restrito: perfil somente leitura em agendamentos.", "error");
        return;
    }
    const selectT = document.getElementById('agend-tutor-select');
    selectT.innerHTML = '';
    tutores.forEach(t => selectT.innerHTML += `<option value="${t.cpf}">${t.nome} (CPF ${t.cpf})</option>`);
    popularPetsDoTutor();

    // Reseta o formulário para modo "novo agendamento"
    document.getElementById('edit-agend-id').value = '';
    remarcandoAgendamento = false;
    document.getElementById('modal-agendamento-titulo').innerText = 'Agendar Consulta';
    document.getElementById('agend-tipo').value = '';
    popularVacinaTiposAg('');
    document.getElementById('agend-vacina-novo-nome').value = '';
    atualizarVisibilidadeVacinaAg();
    document.getElementById('agend-valor').value = '';
    document.getElementById('agend-data').value = '';
    document.getElementById('agend-hora').value = '';

    document.getElementById('modal-agendamento').classList.remove('hidden');
}
function fecharModalAgendamento() { document.getElementById('modal-agendamento').classList.add('hidden'); }

function popularPetsDoTutor() {
    const tutorCpf = document.getElementById('agend-tutor-select').value;
    const selectP = document.getElementById('agend-pet-select');
    selectP.innerHTML = '';
    pets.filter(p => p.tutorCpf === tutorCpf).forEach(p => {
        selectP.innerHTML += `<option value="${p.id}">${p.nome}</option>`;
    });
}

function salvarAgendamento(e) {
    e.preventDefault();
    const editId = document.getElementById('edit-agend-id').value;
    const tutorCpf = document.getElementById('agend-tutor-select').value;
    const petId = document.getElementById('agend-pet-select').value;
    const servico = document.getElementById('agend-tipo').value;
    const ehVacinacao = /vacin/i.test(servico);
    const permNecessaria = editId
        ? (ehVacinacao ? 'vacinacao_editar' : 'consulta_editar')
        : (ehVacinacao ? 'vacinacao_agendar' : 'consulta_agendar');
    if (!temPermissao(permNecessaria)) {
        showToast("Acesso restrito: perfil somente leitura em agendamentos.", "error");
        return;
    }
    const valor = parseFloat(document.getElementById('agend-valor').value);
    const data = document.getElementById('agend-data').value;
    const hora = document.getElementById('agend-hora').value;
    // RF-05: agendamentos somente na janela 07h–19h.
    // TODO [INTEGRAÇÃO SUPABASE]: CHECK (hora BETWEEN '07:00' AND '19:00') no backend.
    if (!hora || hora < "07:00" || hora > "19:00") {
        showToast("Agendamento fora da janela de atendimento (07h–19h).", "error");
        return;
    }
    let vacinaTipo = document.getElementById('agend-vacina-tipo').value || '';
    if (ehVacinacao && !vacinaTipo) {
        showToast("Informe o tipo de vacinação.", "error");
        return;
    }
    // Quick-add: se tipo "Outro" + novo nome informado, adiciona ao catálogo (atalho opcional — vazio mantém "Outro").
    // Catálogo de vacinas é do admin/vet; o de raças, do admin/funcionário.
    // TODO [INTEGRAÇÃO SUPABASE]: INSERT em `vacina_tipos` com auditoria de quem sugeriu.
    if (ehVacinacao && vacinaTipo === 'Outro') {
        const novo = (document.getElementById('agend-vacina-novo-nome').value || '').trim();
        if (novo) {
            if (temPermissao('vacina_tipos_criar') || currentRole === 'veterinario') {
                if (!tiposVacina.some(t => t.toLowerCase() === novo.toLowerCase())) {
                    tiposVacina.push(novo);
                    showToast(`Tipo "${novo}" adicionado ao catálogo!`);
                }
                vacinaTipo = novo;
            }
        }
    }

    if (editId) {
        const ag = agendamentos.find(a => a.id === editId);
        if (ag) {
            ag.tutorCpf = tutorCpf;
            ag.petId = petId;
            ag.servico = servico;
            ag.vacinaTipo = ehVacinacao ? vacinaTipo : '';
            ag.valor = valor;
            ag.data = data;
            ag.hora = hora;
            if (remarcandoAgendamento) {
                if (data < hojeISO()) {
                    showToast("Escolha uma data futura para remarcar.", "error");
                    return;
                }
                ag.status = 'pendente';
            }
        }
        showToast(remarcandoAgendamento ? "Agendamento remarcado!" : "Agendamento atualizado com sucesso!");
        remarcandoAgendamento = false;
    } else {
        agendamentos.unshift({ id: Date.now().toString(), tutorCpf, petId, servico, vacinaTipo: ehVacinacao ? vacinaTipo : '', valor, data, hora, status: "confirmado", vetId: (currentUser && currentUser.id) || '' });
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
        const petsDoTutor = pets.filter(p => p.tutorCpf === t.cpf);
        let petsHTML = '';
        const btnEditarTutor = temPermissao('tutor_editar')
            ? `<button onclick="abrirModalEditarTutor('${t.cpf}')" class='text-[10px] text-brand-blue font-bold hover:underline flex items-center gap-1'>
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
                    <p class='text-xs text-slate-400 font-semibold'>${p.raca}${p.sexo ? ' · ' + p.sexo : ''}${p.peso ? ' · ' + p.peso + ' kg' : ''}</p>
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

// O QUE: Valida telefone com 11 dígitos (RF-02: DDD + 9 dígitos do celular).
// PORQUÊ: RF-02 restante — garante cadastro com celular válido (só dígitos contam).
// TODO [INTEGRAÇÃO SUPABASE]: mesma regra no backend (CHECK length(regexp_replace(tel,'\D','','g'))=11).
function telefoneTem11Digitos(tel) {
    return (String(tel || '').replace(/\D/g, '')).length === 11;
}

function salvarTutor(e) {
    e.preventDefault();
    const nome = document.getElementById('tutor-nome').value;
    const cpf = document.getElementById('tutor-cpf').value;
    const tel = document.getElementById('tutor-tel').value;
    const email = document.getElementById('tutor-email').value;
    const endereco = document.getElementById('tutor-endereco').value;

    if (tutores.some(t => t.cpf === cpf)) {
        showToast("CPF já cadastrado para outro tutor.", "error");
        return;
    }
    if (!telefoneTem11Digitos(tel)) {
        showToast("Telefone deve ter 11 dígitos (DDD + número do celular).", "error");
        return;
    }

    tutores.push({ nome, cpf, tel, email, endereco });
    fecharModalTutor();
    renderizarTutores();
    showToast("Tutor cadastrado!");
}

function abrirModalEditarTutor(tutorCpf) {
    const tutor = tutores.find(t => t.cpf === tutorCpf);
    if (!tutor) return;
    document.getElementById('edit-tutor-id').value = tutor.cpf;
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
    const cpfAntigo = document.getElementById('edit-tutor-id').value;
    const tutor = tutores.find(t => t.cpf === cpfAntigo);
    if (tutor) {
        const cpfNovo = document.getElementById('edit-tutor-cpf').value;
        const telNovo = document.getElementById('edit-tutor-tel').value;
        if (!telefoneTem11Digitos(telNovo)) {
            showToast("Telefone deve ter 11 dígitos (DDD + número do celular).", "error");
            return;
        }
        // CPF é a chave primária: se alterado, propaga para pets, agendamentos e histórico clínico
        if (cpfNovo !== cpfAntigo) {
            if (tutores.some(t => t.cpf === cpfNovo)) {
                showToast("CPF já cadastrado para outro tutor.", "error");
                return;
            }
            pets.forEach(p => { if (p.tutorCpf === cpfAntigo) p.tutorCpf = cpfNovo; });
            agendamentos.forEach(a => { if (a.tutorCpf === cpfAntigo) a.tutorCpf = cpfNovo; });
            historicoClinico.forEach(h => { if (h.tutorCpf === cpfAntigo) h.tutorCpf = cpfNovo; });
        }
        tutor.nome = document.getElementById('edit-tutor-nome').value;
        tutor.cpf = cpfNovo;
        tutor.tel = telNovo;
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
    tutores.forEach(t => select.innerHTML += `<option value="${t.cpf}">${t.nome} (CPF ${t.cpf})</option>`);
    popularRacasPet('');
    document.getElementById('modal-pet').classList.remove('hidden');
}
function fecharModalPet() { document.getElementById('modal-pet').classList.add('hidden'); }

// O QUE: Preenche raça conforme a espécie (selects do cadastro/edição de pet).
function popularRacasPet(prefixo, selecionada) {
    const selEsp = document.getElementById(prefixo + 'pet-especie');
    const selRaca = document.getElementById(prefixo + 'pet-raca');
    if (!selEsp || !selRaca) return;
    const racas = racasPorEspecie[selEsp.value] || ["Outra"];
    selRaca.innerHTML = '';
    racas.forEach(r => {
        selRaca.innerHTML += `<option value="${r}"${r === selecionada ? ' selected' : ''}>${r}</option>`;
    });
}

function salvarPet(e) {
    e.preventDefault();
    const tutorCpf = document.getElementById('pet-tutor-select').value;
    const nome = document.getElementById('pet-nome').value;
    const especie = document.getElementById('pet-especie').value;
    const raca = document.getElementById('pet-raca').value;
    const sexo = document.getElementById('pet-sexo').value;
    const pesoRaw = (document.getElementById('pet-peso').value || '').trim();
    const comportamento = document.getElementById('pet-comportamento').value;
    const alergias = document.getElementById('pet-alergias').value;

    // RF: peso opcional, mas se informado deve ser > 0.
    let peso = '';
    if (pesoRaw !== '') {
        peso = parseFloat(pesoRaw.replace(',', '.'));
        if (!(peso > 0)) { showToast("Peso deve ser maior que zero.", "error"); return; }
    }

    // RF-02 restante: máximo 10 pets por tutor.
    // TODO [INTEGRAÇÃO SUPABASE]: CHECK (SELECT count(*) FROM pets WHERE tutor_cpf=...) ou regra no backend.
    if (pets.filter(p => p.tutorCpf === tutorCpf).length >= 10) {
        showToast("Limite de 10 pets por tutor atingido.", "error");
        return;
    }
    pets.push({ id: Date.now().toString(), tutorCpf, nome, especie, raca, sexo, peso, comportamento, alergias });
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
    popularRacasPet('edit-', pet.raca);
    document.getElementById('edit-pet-sexo').value = pet.sexo || '';
    document.getElementById('edit-pet-peso').value = (pet.peso === '' || pet.peso == null) ? '' : pet.peso;
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
        pet.sexo = document.getElementById('edit-pet-sexo').value;
        const pesoRaw = (document.getElementById('edit-pet-peso').value || '').trim();
        if (pesoRaw === '') { pet.peso = ''; }
        else {
            const peso = parseFloat(pesoRaw.replace(',', '.'));
            if (!(peso > 0)) { showToast("Peso deve ser maior que zero.", "error"); return; }
            pet.peso = peso;
        }
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
        const tutor = tutores.find(t => t.cpf === (h.tutorCpf || (pet ? pet.tutorCpf : null)));
        let tipoTagColor = "text-brand-lime";
        let docLabel = "RECEITA";
        if (h.tipo === 'guia') { tipoTagColor = "text-brand-pink"; docLabel = "GUIA DE ENCAMINHAMENTO"; }
        if (h.tipo === 'vacina') { tipoTagColor = "text-brand-blue"; docLabel = "VACINA" + (h.vacinaTipo ? " — " + h.vacinaTipo.toUpperCase() : ""); }

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
                    <span class='text-xs font-bold ${tipoTagColor} uppercase'>${docLabel} - ${pet ? pet.nome : 'N/A'}${tutor ? ' · ' + tutor.nome : ''}</span>
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
    if (tipo === 'guia') label.innerText = "Instruções e Encaminhamento da Guia";
    else if (tipo === 'receita') label.innerText = "Prescrição e Posologia de Medicamentos";
    else label.innerText = "Detalhamento / Vacina";
    // Tipo de vacina só aparece no Registro de Imunização
    const bloco = document.getElementById('clinica-vacina-bloco');
    if (bloco) {
        bloco.classList.toggle('hidden', tipo !== 'vacina');
        if (tipo === 'vacina') popularVacinaTiposClinica(document.getElementById('clinica-vacina-tipo').value || '');
    }
}

// O QUE: Preenche o select de tipos de vacina do form clínico (lê tiposVacina mutável).
function popularVacinaTiposClinica(selecionado) {
    const select = document.getElementById('clinica-vacina-tipo');
    if (!select) return;
    select.innerHTML = '<option value="">Selecione o tipo...</option>';
    tiposVacina.forEach(t => {
        select.innerHTML += `<option value="${t}"${t === selecionado ? ' selected' : ''}>${t}</option>`;
    });
}

// O QUE: CRUD de tipos de vacina — admin e veterinário.
// PORQUÊ: Reaproveita nome/estética do "Módulo clínico" em visão restrita (funcionário sem acesso).
// TODO [INTEGRAÇÃO SUPABASE - DB SQL]: tabela `vacina_tipos` (id, nome, ativo).
function renderizarTiposVacina() {
    const lista = document.getElementById('lista-tipos-vacina');
    if (!lista) return;
    const rotulo = tiposVacina.length + (tiposVacina.length === 1 ? " tipo" : " tipos");
    document.getElementById('tipos-vacina-count').innerText = rotulo;
    const countCard = document.getElementById('tipos-vacina-count-card');
    if (countCard) countCard.innerText = rotulo;
    lista.innerHTML = '';
    tiposVacina.forEach((t, idx) => {
        lista.innerHTML += `
            <div class='flex items-center justify-between gap-2 bg-slate-900/80 px-3.5 py-2.5 rounded-xl border border-slate-800'>
                <span class='text-xs font-bold text-slate-200'>${t}</span>
                <div class='flex items-center gap-2 shrink-0'>
                    ${temPermissao('vacina_tipos_editar') ? `<button onclick="editarTipoVacinaPrompt(${idx})" class='text-[11px] text-brand-blue font-bold hover:underline'>Editar</button>` : ''}
                    ${temPermissao('vacina_tipos_excluir') ? `<button onclick="excluirTipoVacina(${idx})" class='text-[11px] text-rose-400 font-bold hover:underline'>Excluir</button>` : ''}
                </div>
            </div>
        `;
    });
    lucide.createIcons();
}

function abrirModalTiposVacina() {
    if (!temPermissao('vacina_tipos_listar')) {
        showToast("Acesso restrito: perfil sem permissão para tipos de vacina.", "error");
        return;
    }
    document.getElementById('edit-tipo-vacina-idx').value = '';
    document.getElementById('input-tipo-vacina-nome').value = '';
    modoFormTipoVacina(false);
    renderizarTiposVacina();
    document.getElementById('modal-tipos-vacina').classList.remove('hidden');
}
function fecharModalTiposVacina() { document.getElementById('modal-tipos-vacina').classList.add('hidden'); }

// O QUE: Alterna o form entre "Adicionar" e "Salvar alterações" (modo edição).
function modoFormTipoVacina(edicao) {
    document.getElementById('modal-tipos-vacina-titulo').innerText = edicao ? "Editar Tipo de Vacina" : "Gerenciar Tipos de Vacina";
    document.getElementById('btn-salvar-tipo-vacina').innerText = edicao ? "Salvar alterações" : "Adicionar vacina";
    document.getElementById('btn-cancelar-edit-tipo-vacina').classList.toggle('hidden', !edicao);
}
function cancelarEdicaoTipoVacina() {
    document.getElementById('edit-tipo-vacina-idx').value = '';
    document.getElementById('input-tipo-vacina-nome').value = '';
    modoFormTipoVacina(false);
}

function salvarTipoVacina(e) {
    e.preventDefault();
    if (!temPermissao('vacina_tipos_criar') && !temPermissao('vacina_tipos_editar')) {
        showToast("Acesso restrito: perfil sem permissão para salvar tipos.", "error");
        return;
    }
    const idxRaw = document.getElementById('edit-tipo-vacina-idx').value;
    const nome = (document.getElementById('input-tipo-vacina-nome').value || '').trim();
    if (!nome) { showToast("Informe o nome do tipo de vacina.", "error"); return; }
    if (idxRaw === '') {
        if (!temPermissao('vacina_tipos_criar')) { showToast("Acesso restrito: sem permissão para criar.", "error"); return; }
        if (tiposVacina.some(t => t.toLowerCase() === nome.toLowerCase())) { showToast("Tipo já cadastrado.", "error"); return; }
        tiposVacina.push(nome);
        showToast("Tipo de vacina cadastrado!");
    } else {
        if (!temPermissao('vacina_tipos_editar')) { showToast("Acesso restrito: sem permissão para editar.", "error"); return; }
        const idx = parseInt(idxRaw, 10);
        if (tiposVacina.some((t, i) => i !== idx && t.toLowerCase() === nome.toLowerCase())) { showToast("Tipo já cadastrado.", "error"); return; }
        tiposVacina[idx] = nome;
        showToast("Tipo de vacina atualizado!");
    }
    document.getElementById('edit-tipo-vacina-idx').value = '';
    document.getElementById('input-tipo-vacina-nome').value = '';
    modoFormTipoVacina(false);
    renderizarTiposVacina();
    popularVacinaTiposAg(document.getElementById('agend-vacina-tipo')?.value || '');
    popularVacinaTiposClinica(document.getElementById('clinica-vacina-tipo')?.value || '');
}

function editarTipoVacinaPrompt(idx) {
    if (!temPermissao('vacina_tipos_editar')) { showToast("Acesso restrito.", "error"); return; }
    document.getElementById('edit-tipo-vacina-idx').value = String(idx);
    document.getElementById('input-tipo-vacina-nome').value = tiposVacina[idx] || '';
    modoFormTipoVacina(true);
    document.getElementById('input-tipo-vacina-nome').focus();
}

function excluirTipoVacina(idx) {
    if (!temPermissao('vacina_tipos_excluir')) { showToast("Acesso restrito.", "error"); return; }
    tiposVacina.splice(idx, 1);
    renderizarTiposVacina();
    popularVacinaTiposAg('');
    popularVacinaTiposClinica('');
    showToast("Tipo de vacina excluído!");
}

// O QUE: CRUD de tipos de raça por espécie — funcionário e admin (como tipos de vacina).
// PORQUÊ: Raça como lista de seleção precisa de catálogo gerenciável; vet só lista nos selects.
// TODO [INTEGRAÇÃO SUPABASE - DB SQL]: tabela `raca_tipos` (id, especie, nome, ativo).
function renderizarTiposRaca() {
    const esp = document.getElementById('filtro-tipo-raca-especie')?.value || ESPECIES_PET[0];
    const lista = document.getElementById('lista-tipos-raca');
    if (!lista) return;
    const racas = racasPorEspecie[esp] || [];
    document.getElementById('tipos-raca-count').innerText = racas.length + (racas.length === 1 ? " raça" : " raças");
    const countCard = document.getElementById('tipos-raca-count-card');
    if (countCard) countCard.innerText = racas.length + (racas.length === 1 ? " raça" : " raças");
    lista.innerHTML = '';
    racas.forEach((r, idx) => {
        lista.innerHTML += `
            <div class='flex items-center justify-between gap-2 bg-slate-900/80 px-3.5 py-2.5 rounded-xl border border-slate-800'>
                <span class='text-xs font-bold text-slate-200'>${r}</span>
                <div class='flex items-center gap-2 shrink-0'>
                    ${temPermissao('raca_tipos_editar') ? `<button onclick="editarTipoRacaPrompt(${idx})" class='text-[11px] text-brand-blue font-bold hover:underline'>Editar</button>` : ''}
                    ${temPermissao('raca_tipos_excluir') ? `<button onclick="excluirTipoRaca(${idx})" class='text-[11px] text-rose-400 font-bold hover:underline'>Excluir</button>` : ''}
                </div>
            </div>
        `;
    });
    lucide.createIcons();
}

function abrirModalTiposRaca() {
    if (!temPermissao('raca_tipos_listar')) {
        showToast("Acesso restrito: perfil sem permissão para tipos de raça.", "error");
        return;
    }
    const selFiltro = document.getElementById('filtro-tipo-raca-especie');
    if (selFiltro && !selFiltro.options.length) {
        ESPECIES_PET.forEach(e => { selFiltro.innerHTML += `<option value="${e}">${e}</option>`; });
    }
    const selForm = document.getElementById('select-tipo-raca-especie');
    if (selForm && !selForm.options.length) {
        ESPECIES_PET.forEach(e => { selForm.innerHTML += `<option value="${e}">${e}</option>`; });
    }
    document.getElementById('edit-tipo-raca-idx').value = '';
    document.getElementById('input-tipo-raca-nome').value = '';
    modoFormTipoRaca(false);
    renderizarTiposRaca();
    document.getElementById('modal-tipos-raca').classList.remove('hidden');
}
function fecharModalTiposRaca() { document.getElementById('modal-tipos-raca').classList.add('hidden'); }

// O QUE: Alterna o form entre "Adicionar" e "Salvar alterações" (modo edição).
function modoFormTipoRaca(edicao) {
    document.getElementById('modal-tipos-raca-titulo').innerText = edicao ? "Editar Tipo de Raça" : "Gerenciar Tipos de Raça";
    document.getElementById('btn-salvar-tipo-raca').innerText = edicao ? "Salvar alterações" : "Adicionar raça";
    document.getElementById('btn-cancelar-edit-tipo-raca').classList.toggle('hidden', !edicao);
}
function cancelarEdicaoTipoRaca() {
    document.getElementById('edit-tipo-raca-idx').value = '';
    document.getElementById('input-tipo-raca-nome').value = '';
    modoFormTipoRaca(false);
}

function filtrarTiposRaca() {
    const esp = document.getElementById('filtro-tipo-raca-especie').value;
    document.getElementById('select-tipo-raca-especie').value = esp;
    renderizarTiposRaca();
}

function salvarTipoRaca(e) {
    e.preventDefault();
    if (!temPermissao('raca_tipos_criar') && !temPermissao('raca_tipos_editar')) {
        showToast("Acesso restrito: perfil sem permissão para salvar raças.", "error");
        return;
    }
    const esp = document.getElementById('select-tipo-raca-especie').value;
    const idxRaw = document.getElementById('edit-tipo-raca-idx').value;
    const nome = (document.getElementById('input-tipo-raca-nome').value || '').trim();
    if (!nome) { showToast("Informe o nome da raça.", "error"); return; }
    if (!racasPorEspecie[esp]) racasPorEspecie[esp] = [];
    if (idxRaw === '') {
        if (!temPermissao('raca_tipos_criar')) { showToast("Acesso restrito: sem permissão para criar.", "error"); return; }
        if (racasPorEspecie[esp].some(r => r.toLowerCase() === nome.toLowerCase())) { showToast("Raça já cadastrada.", "error"); return; }
        racasPorEspecie[esp].push(nome);
        showToast("Raça cadastrada!");
    } else {
        if (!temPermissao('raca_tipos_editar')) { showToast("Acesso restrito: sem permissão para editar.", "error"); return; }
        const idx = parseInt(idxRaw, 10);
        if (racasPorEspecie[esp].some((r, i) => i !== idx && r.toLowerCase() === nome.toLowerCase())) { showToast("Raça já cadastrada.", "error"); return; }
        racasPorEspecie[esp][idx] = nome;
        showToast("Raça atualizada!");
    }
    document.getElementById('edit-tipo-raca-idx').value = '';
    document.getElementById('input-tipo-raca-nome').value = '';
    modoFormTipoRaca(false);
    renderizarTiposRaca();
    popularRacasPet('');
    popularRacasPet('edit-');
}

function editarTipoRacaPrompt(idx) {
    if (!temPermissao('raca_tipos_editar')) { showToast("Acesso restrito.", "error"); return; }
    const esp = document.getElementById('filtro-tipo-raca-especie').value;
    document.getElementById('select-tipo-raca-especie').value = esp;
    document.getElementById('edit-tipo-raca-idx').value = String(idx);
    document.getElementById('input-tipo-raca-nome').value = (racasPorEspecie[esp] || [])[idx] || '';
    modoFormTipoRaca(true);
    document.getElementById('input-tipo-raca-nome').focus();
}

function excluirTipoRaca(idx) {
    if (!temPermissao('raca_tipos_excluir')) { showToast("Acesso restrito.", "error"); return; }
    const esp = document.getElementById('filtro-tipo-raca-especie').value;
    (racasPorEspecie[esp] || []).splice(idx, 1);
    renderizarTiposRaca();
    popularRacasPet('');
    popularRacasPet('edit-');
    showToast("Raça excluída!");
}

function editarDocumentoClinico(id) {
    const doc = historicoClinico.find(h => h.id === id);
    if (!doc) return;
    document.getElementById('clinica-edit-id').value = doc.id;
    const pet = pets.find(p => p.id === doc.petId);
    const tutorCpf = doc.tutorCpf || (pet ? pet.tutorCpf : '');
    document.getElementById('clinica-tutor-select').value = tutorCpf;
    filtrarPetsClinicaPorTutor();
    document.getElementById('clinica-pet-select').value = doc.petId;
    document.getElementById('clinica-tipo').value = doc.tipo;
    popularVacinaTiposClinica(doc.vacinaTipo || '');
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

// O QUE: Recebe arquivos do <input type="file"> e registra metadados.
// PORQUÊ: Upload de exames/documentos vinculados ao tutor+pet do form.
// DEMO (mock): Não envia nem persiste — some ao recarregar (sem banco).
function lidarUploadAnexos(e) {
    if (!temPermissao('clinica_criar')) {
        showToast("Acesso restrito: perfil sem permissão para anexar.", "error");
        e.target.value = '';
        return;
    }
    const arquivos = Array.from(e.target.files || []);
    if (!arquivos.length) return;
    const tutorCpf = document.getElementById('clinica-tutor-select').value || '';
    const petId = document.getElementById('clinica-pet-select').value || '';
    arquivos.forEach(f => {
        anexosClinicos.unshift({
            id: Date.now().toString() + Math.floor(Math.random() * 1000),
            tutorCpf, petId,
            nome: f.name,
            tipo: f.type || 'arquivo',
            tamanhoKb: Math.max(1, Math.round(f.size / 1024)),
            data: new Date().toISOString().slice(0, 10)
        });
    });
    e.target.value = '';
    renderizarAnexos();
    showToast(arquivos.length + " documento(s) anexado(s)!");
}

function renderizarAnexos() {
    const lista = document.getElementById('lista-anexos');
    if (!lista) return;
    document.getElementById('anexos-count').innerText = anexosClinicos.length + (anexosClinicos.length === 1 ? " arquivo" : " arquivos");
    if (!anexosClinicos.length) {
        lista.innerHTML = '<p class="text-xs text-slate-500 italic">Nenhum documento anexado.</p>';
        return;
    }
    lista.innerHTML = '';
    anexosClinicos.forEach(a => {
        const pet = pets.find(p => p.id === a.petId);
        const tutor = tutores.find(t => t.cpf === a.tutorCpf);
        lista.innerHTML += `
            <div class='flex items-center justify-between gap-2 bg-slate-900/80 px-3.5 py-2.5 rounded-xl border border-slate-800'>
                <div class='flex items-center gap-2.5 min-w-0'>
                    <i data-lucide='paperclip' class='w-4 h-4 text-brand-blue shrink-0'></i>
                    <div class='min-w-0'>
                        <p class='text-xs font-bold text-slate-200 truncate'>${a.nome}</p>
                        <p class='text-[10px] text-slate-500'>${a.tamanhoKb} KB · ${a.data}${pet ? ' · ' + pet.nome : ''}${tutor ? ' · ' + tutor.nome : ''}</p>
                    </div>
                </div>
                ${temPermissao('clinica_excluir') ? `<button onclick="excluirAnexo('${a.id}')" class='text-[11px] text-rose-400 font-bold hover:underline shrink-0'>Excluir</button>` : ''}
            </div>
        `;
    });
    lucide.createIcons();
}

function excluirAnexo(id) {
    anexosClinicos = anexosClinicos.filter(a => a.id !== id);
    renderizarAnexos();
    showToast("Anexo excluído!");
}

function resetarFormClinico() {
    document.getElementById('clinica-edit-id').value = '';
    document.getElementById('clinica-tutor-select').value = '';
    filtrarPetsClinicaPorTutor();
    document.getElementById('clinica-detalhe').value = '';
    document.getElementById('clinica-form-title').innerText = "Novo Documento Clínico";
    document.getElementById('btn-cancelar-edit-clinico').classList.add('hidden');
}

function salvarRegistroClinico(e) {
    e.preventDefault();
    const editId = document.getElementById('clinica-edit-id').value;
    const tutorCpf = document.getElementById('clinica-tutor-select').value;
    const petId = document.getElementById('clinica-pet-select').value;
    const tipo = document.getElementById('clinica-tipo').value;
    const data = document.getElementById('clinica-data').value;
    const detalhe = document.getElementById('clinica-detalhe').value;
    const vacinaTipo = tipo === 'vacina' ? (document.getElementById('clinica-vacina-tipo').value || '') : '';
    if (tipo === 'vacina' && !vacinaTipo) {
        showToast("Informe o tipo de vacinação.", "error");
        return;
    }

    if (editId) {
        const doc = historicoClinico.find(h => h.id === editId);
        if (doc) {
            doc.tutorCpf = tutorCpf;
            doc.petId = petId;
            doc.tipo = tipo;
            doc.vacinaTipo = vacinaTipo;
            doc.data = data;
            doc.detalhe = detalhe;
            showToast("Documento atualizado com sucesso!");
        }
    } else {
        historicoClinico.unshift({ id: Date.now().toString(), tutorCpf, petId, tipo, vacinaTipo, data, detalhe });
        showToast("Novo documento registrado!");
    }

    resetarFormClinico();
    renderizarHistoricoClinico();
}

function imprimirDocumentoGenerico(id) {
    const doc = historicoClinico.find(h => h.id === id);
    if (!doc) return;
    const pet = pets.find(p => p.id === doc.petId);
    const tutor = tutores.find(t => t.cpf === (doc.tutorCpf || (pet ? pet.tutorCpf : null)));

    let titulos = {
        receita: "Prescrição Médica Veterinária (Receituário)",
        guia: "Guia de Encaminhamento Veterinário",
        vacina: "Comprovante de Imunização"
    };

    document.getElementById('doc-titulo-tipo').innerText = titulos[doc.tipo] || "Documento Clínico";
    if (doc.tipo === 'vacina' && doc.vacinaTipo) {
        document.getElementById('doc-titulo-tipo').innerText += " — " + doc.vacinaTipo;
    }
    document.getElementById('doc-nome-pet').innerText = (pet ? pet.nome : 'N/A') + " (" + (pet ? pet.raca : '') + ")";
    document.getElementById('doc-nome-tutor').innerText = tutor ? (tutor.nome + " (CPF " + tutor.cpf + ")") : 'N/A';
    document.getElementById('doc-data').innerText = doc.data;
    document.getElementById('doc-conteudo').innerText = doc.detalhe;
    // RF-08 ILUSTRATIVO (protótipo): mostra como ficará nome+CRMV do vet.
    // PREP pós-banco: prefere CRMV do veterinário logado (currentUser.crm) com fallback no mock.
    // TODO [INTEGRAÇÃO SUPABASE - DB SQL]: buscar nome+CRMV do veterinário
    //   logado (users JOIN profissional) + assinatura digital (pós-banco/LGPD).
    const vetRef = (administradores && administradores[0]) || { nome: '—', crm: '—' };
    const vetNome = (currentUser && currentUser.nome) || vetRef.nome;
    const vetCrm = (currentUser && currentUser.crm) || vetRef.crm;
    document.getElementById('doc-vet-nome').innerText = vetNome;
    document.getElementById('doc-vet-crmv').innerText = vetCrm;
    document.getElementById('doc-assinatura-nome').innerText = vetNome;
    document.getElementById('doc-assinatura-crmv').innerText = vetCrm;

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
        const chave = /vacin/i.test(a.servico) && a.vacinaTipo ? a.servico + ' — ' + a.vacinaTipo : a.servico;
        if (!grupos[chave]) {
            grupos[chave] = { qtde: 0, confirmados: 0, receita: 0 };
        }
        grupos[chave].qtde += 1;
        grupos[chave].receita += a.valor;
        if (a.status === 'confirmado') grupos[chave].confirmados += 1;
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
        const agendamentosDoTutor = agendamentos.filter(a => a.tutorCpf === t.cpf);
        const petsDoTutor = pets.filter(p => p.tutorCpf === t.cpf);
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
        const tutor = tutores.find(t => t.cpf === a.tutorCpf);
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
// TODO [INTEGRAÇÃO SUPABASE - DB SQL] (tabela users + endpoint + bcrypt/LGPD):
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
    // TODO [INTEGRAÇÃO SUPABASE - DB SQL] Gerar senha temporaria aleatoria no backend + enviar por email
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
    // TODO [INTEGRAÇÃO SUPABASE]:
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
// TODO [INTEGRAÇÃO SUPABASE - DB SQL] (tabela users + endpoint + bcrypt/LGPD):
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
// TODO [INTEGRAÇÃO SUPABASE - DB SQL] Invalidar token de reset se modal for fechado.
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
// TODO [INTEGRAÇÃO SUPABASE - DB SQL] (tabela users + endpoint + bcrypt/LGPD):
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
// TODO [INTEGRAÇÃO SUPABASE - DB SQL] (tabela users + endpoint + bcrypt/LGPD):
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
// TODO [INTEGRAÇÃO SUPABASE - DB SQL] (tabela users + endpoint + bcrypt/LGPD):
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
// TODO [INTEGRAÇÃO SUPABASE - DB SQL] Mesma lógica aplicável no frontend do formulário de reset via email.
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
// TODO [INTEGRAÇÃO SUPABASE - DB SQL] Componente reutilizavel no frontend.
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

// Popular dropdowns de tutores (por CPF) e pets filtrados para a aba clínica
function popularTutoresClinicos() {
    const selectT = document.getElementById('clinica-tutor-select');
    if (!selectT) return;
    const atual = selectT.value;
    selectT.innerHTML = '<option value="">Selecione o tutor (CPF)...</option>';
    tutores.forEach(t => {
        selectT.innerHTML += `<option value="${t.cpf}">${t.nome} (CPF ${t.cpf})</option>`;
    });
    if (atual) selectT.value = atual;
    filtrarPetsClinicaPorTutor();
}

// O QUE: Filtra os pets do tutor selecionado (por CPF) no form clínico.
// PORQUÊ: O atendimento parte do tutor registrado (chave primária CPF).
function filtrarPetsClinicaPorTutor() {
    const selectT = document.getElementById('clinica-tutor-select');
    const selectP = document.getElementById('clinica-pet-select');
    if (!selectT || !selectP) return;
    const tutorCpf = selectT.value;
    selectP.innerHTML = tutorCpf
        ? '<option value="">Selecione o paciente...</option>'
        : '<option value="">Selecione o tutor primeiro...</option>';
    pets.filter(p => p.tutorCpf === tutorCpf).forEach(p => {
        selectP.innerHTML += `<option value="${p.id}">${p.nome} (${p.especie} - ${p.raca})</option>`;
    });
}

// Popular dropdowns de pets para a aba clínica
function popularPetsDropdowns() {
    popularTutoresClinicos();
}

// ==========================================================
// SEÇÃO 11: GRÁFICOS (Chart.js)
// ==========================================================

function inicializarGraficos() {
    const ctx1 = document.getElementById('financeChart')?.getContext('2d');

    if (ctx1) {
        if (financeChartRef) financeChartRef.destroy();
        const periodo = document.getElementById('periodo-faturamento')?.value || 'mensal';
        const dados = DADOS_FATURAMENTO[periodo] || DADOS_FATURAMENTO.mensal;
        financeChartRef = new Chart(ctx1, {
            type: 'line',
            data: {
                labels: dados.labels,
                datasets: [{
                    label: 'Receita (R$)',
                    data: dados.valores,
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
        atualizarKpiFaturamento(periodo);
    }
}

// O QUE: Datasets ilustrativos do faturamento por período (dashboard).
// PORQUÊ: O select #periodo-faturamento chamava atualizarPeriodoFaturamento(), que não existia.
// DEMO (mock): valores ilustrativos; com banco, agregar `agendamentos` por data.
// TODO [INTEGRAÇÃO SUPABASE - DB SQL]: SELECT date_trunc + sum(valor) FROM agendamentos WHERE status='confirmado'.
const DADOS_FATURAMENTO = {
    mensal: { labels: ['01/Mai', '05/Mai', '10/Mai', '15/Mai', '18/Mai'], valores: [1800, 3200, 5400, 8900, 12850], kpi: 'R$ 12.850,00', nota: '+18.4% vs mês anterior' },
    semanal: { labels: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'], valores: [450, 700, 520, 980, 1200, 1650, 900], kpi: 'R$ 6.400,00', nota: '+9.2% vs semana anterior' },
    anual: { labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'], valores: [42000, 48500, 51200, 47800, 55900, 60100], kpi: 'R$ 305.500,00', nota: '+12.6% vs semestre anterior' }
};

function atualizarKpiFaturamento(periodo) {
    const dados = DADOS_FATURAMENTO[periodo] || DADOS_FATURAMENTO.mensal;
    const kpi = document.getElementById('kpi-faturamento');
    if (kpi) kpi.innerText = dados.kpi;
    const nota = document.getElementById('kpi-faturamento-nota');
    if (nota) nota.innerHTML = `<i data-lucide='trending-up' class='w-3.5 h-3.5'></i> ${dados.nota}`;
}

// O QUE: Troca o período do gráfico + KPI de faturamento do dashboard.
function atualizarPeriodoFaturamento() {
    const periodo = document.getElementById('periodo-faturamento')?.value || 'mensal';
    const dados = DADOS_FATURAMENTO[periodo] || DADOS_FATURAMENTO.mensal;
    if (financeChartRef) {
        financeChartRef.data.labels = dados.labels;
        financeChartRef.data.datasets[0].data = dados.valores;
        financeChartRef.update();
    } else {
        inicializarGraficos();
        return;
    }
    atualizarKpiFaturamento(periodo);
    lucide.createIcons();
}

// ==========================================================
// DASHBOARD POR PERFIL (ROADMAP item 16)
// ==========================================================
// O QUE: Vet não vê receita/faturamento — vê Próxima Consulta + consultas/vacinas do dia.
// PORQUÊ: Dashboard operacional p/ veterinário; financeiro segue só do admin.
// TODO [INTEGRAÇÃO SUPABASE]: filtrar por `vetId` + `data` no backend.
function atualizarDashboardPorPerfil() {
    const ehVet = currentRole === 'veterinario';
    document.getElementById('dash-titulo').innerText = ehVet ? 'Minha Agenda do Dia' : 'Resumo Financeiro e Operacional';
    document.getElementById('dash-subtitulo').innerText = ehVet
        ? 'Próxima consulta e movimento de hoje.'
        : 'Acompanhamento consolidado de vendas, atendimentos e fluxo de clínica.';
    toggleEl('card-faturamento', !ehVet);
    toggleEl('periodo-faturamento', !ehVet);
    toggleEl('grafico-receita-card', !ehVet);
    toggleEl('bloco-vet', ehVet);
    if (ehVet) {
        renderizarProximaConsulta();
        inicializarConsultasChart();
    } else {
        if (consultasChartRef) { consultasChartRef.destroy(); consultasChartRef = null; }
        inicializarGraficos();
    }
    lucide.createIcons();
}

// O QUE: Card da próxima consulta do veterinário logado (data/hora futura, pendente/confirmado).
function renderizarProximaConsulta() {
    const box = document.getElementById('prox-consulta-conteudo');
    if (!box) return;
    const agora = hojeISO() + 'T' + new Date().toTimeString().slice(0, 5);
    const proximos = agendamentos
        .filter(a => (a.vetId || '') === (currentUser && currentUser.id) && (a.status === 'pendente' || a.status === 'confirmado') && String(a.data + 'T' + a.hora) >= agora)
        .sort((x, y) => String(x.data + x.hora).localeCompare(String(y.data + y.hora)));
    if (!proximos.length) {
        box.innerHTML = `<p class='text-xs text-slate-500 italic'>Nenhuma consulta agendada.</p>`;
        return;
    }
    const a = proximos[0];
    const pet = pets.find(p => p.id === a.petId);
    const tutor = tutores.find(t => t.cpf === a.tutorCpf);
    box.innerHTML = `
        <div class='flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-900/80 p-4 rounded-xl border border-slate-800'>
            <div class='space-y-1'>
                <p class='font-bold text-slate-100 text-sm'>${pet ? pet.nome : 'N/A'} <span class='text-xs text-slate-400 font-semibold'>· ${a.servico}${a.vacinaTipo ? ' — ' + a.vacinaTipo : ''}</span></p>
                <p class='text-xs text-slate-400'>${tutor ? tutor.nome : 'N/A'} · ${a.data} às ${a.hora}</p>
            </div>
            <button onclick="switchTab('agendamentos')" class='px-4 py-2 bg-brand-blue text-xs font-bold text-white rounded-xl shrink-0'>Ver agenda</button>
        </div>
    `;
}

// O QUE: Barras por hora (07–19h) — consultas × vacinações de hoje do veterinário logado.
function inicializarConsultasChart() {
    const ctx = document.getElementById('consultasChart')?.getContext('2d');
    if (!ctx) return;
    const hoje = hojeISO();
    const horas = [];
    for (let h = 7; h <= 19; h++) horas.push(String(h).padStart(2, '0') + 'h');
    const consultas = horas.map(() => 0);
    const vacinas = horas.map(() => 0);
    agendamentos
        .filter(a => (a.vetId || '') === (currentUser && currentUser.id) && a.data === hoje && a.status !== 'cancelado')
        .forEach(a => {
            const h = parseInt(String(a.hora).slice(0, 2), 10);
            if (h >= 7 && h <= 19) {
                if (/vacin/i.test(a.servico)) vacinas[h - 7]++;
                else consultas[h - 7]++;
            }
        });
    if (consultasChartRef) consultasChartRef.destroy();
    consultasChartRef = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: horas,
            datasets: [
                { label: 'Consultas', data: consultas, backgroundColor: '#0066ff' },
                { label: 'Vacinações', data: vacinas, backgroundColor: '#ccff00' }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { labels: { color: '#94a3b8', boxWidth: 12 } } },
            scales: {
                x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8' } },
                y: { beginAtZero: true, ticks: { stepSize: 1, color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } }
            }
        }
    });
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

// O QUE: Tooltip instantâneo do botão info do login (ROADMAP §1 item 6).
// PORQUÊ: Substitui o title= nativo (delay 1–2s) por exibição imediata via
//   CSS (hover/foco) + toque no mobile e teclado (Enter/Espaço alterna, Esc fecha).
// DEMO (mock): Sem backend; apenas alterna visibilidade do #tooltip-info-login.
function inicializarTooltipInfoLogin() {
    const btn = document.getElementById('btn-info-login');
    const dica = document.getElementById('tooltip-info-login');
    if (!btn || !dica) return;
    const visivel = () => btn.getAttribute('aria-expanded') === 'true';
    const mostrar = (estado) => {
        btn.setAttribute('aria-expanded', estado ? 'true' : 'false');
        dica.classList.toggle('tooltip-visivel', estado);
    };
    btn.addEventListener('click', () => mostrar(!visivel()));
    btn.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') mostrar(false);
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && visivel()) mostrar(false);
    });
    document.addEventListener('click', (e) => {
        if (visivel() && !btn.contains(e.target)) mostrar(false);
    });
}

// ==========================================================
// SEÇÃO 13: INICIALIZAÇÃO
// ==========================================================

window.onload = function() {
    inicializarTema();
    inicializarTooltipInfoLogin();
    lucide.createIcons();
    atualizarPermissoesNavegacao();
    inicializarPesquisaMes();
    renderizarAgendamentos();
    renderizarTutores();
    renderizarHistoricoClinico();
    renderizarAnexos();
    renderizarUsuarios();
    inicializarGraficos();
};
