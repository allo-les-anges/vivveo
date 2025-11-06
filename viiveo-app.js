// Configuration
const CONFIG = {
    API_BASE_URL: 'https://gaetano1747.gm-harchies.workers.dev',
    DEBUG: true
};

// State global
let appState = {
    isLoggedIn: false,
    currentUser: null,
    missions: []
};

// Éléments DOM
const DOM = {
    loginSection: null,
    missionsSection: null,
    loginForm: null,
    missionsContainer: null,
    loaderMissions: null,
    emptyMissions: null,
    userInfo: null,
    userName: null,
    fullScreenLoader: null,
    statusMessage: null,
    loginButton: null
};

// Initialisation de l'application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    log('DEBUG: Initialisation de l application...');
    
    // Initialisation des éléments DOM
    initializeDOMElements();
    
    // Vérifier si les conteneurs de missions existent, sinon les créer
    ensureMissionContainers();
    
    // Initialisation du formulaire de login
    initializeLoginForm();
    
    // Initialisation des écouteurs de modals
    initializeModalListeners();
    
    // Vérifier l'état de connexion au chargement
    checkLoginStatus();
    
    log('DEBUG: Application initialisée');
}

function initializeDOMElements() {
    DOM.loginSection = document.getElementById('loginSection');
    DOM.missionsSection = document.getElementById('missionsSection');
    DOM.loginForm = document.getElementById('loginForm');
    DOM.missionsContainer = document.getElementById('missionsContainer');
    DOM.loaderMissions = document.getElementById('loaderMissions');
    DOM.emptyMissions = document.getElementById('emptyMissions');
    DOM.userInfo = document.getElementById('userInfo');
    DOM.userName = document.getElementById('userName');
    DOM.fullScreenLoader = document.getElementById('fullScreenLoader');
    DOM.statusMessage = document.getElementById('statusMessage');
    DOM.loginButton = document.querySelector('#loginForm button[type="submit"]');
    
    log('DEBUG: Éléments DOM initialisés');
}

function ensureMissionContainers() {
    // S'assurer que les conteneurs de missions existent
    if (!DOM.missionsContainer) {
        const missionsSection = document.getElementById('missionsSection');
        if (missionsSection) {
            // Créer les conteneurs manquants
            DOM.loaderMissions = document.createElement('div');
            DOM.loaderMissions.id = 'loaderMissions';
            DOM.loaderMissions.className = 'loader';
            DOM.loaderMissions.style.display = 'none';
            DOM.loaderMissions.innerHTML = `
                <div class="spinner"></div>
                <p>Chargement des missions...</p>
            `;
            
            DOM.missionsContainer = document.createElement('div');
            DOM.missionsContainer.id = 'missionsContainer';
            DOM.missionsContainer.className = 'missions-container';
            
            DOM.emptyMissions = document.createElement('div');
            DOM.emptyMissions.id = 'emptyMissions';
            DOM.emptyMissions.className = 'empty-state';
            DOM.emptyMissions.style.display = 'none';
            DOM.emptyMissions.innerHTML = '<p>Aucune mission disponible pour le moment.</p>';
            
            missionsSection.appendChild(DOM.loaderMissions);
            missionsSection.appendChild(DOM.missionsContainer);
            missionsSection.appendChild(DOM.emptyMissions);
            
            log('DEBUG: Conteneurs de missions créés dynamiquement');
        }
    }
}

function initializeLoginForm() {
    if (!DOM.loginForm) {
        log('ERROR: Formulaire de login non trouvé');
        return;
    }
    
    log('DEBUG initializeLoginForm: loginForm element:', DOM.loginForm);
    log('DEBUG initializeLoginForm: typeof window.handleLogin:', typeof handleLogin);
    
    // Supprimer les écouteurs existants pour éviter les doublons
    DOM.loginForm.removeEventListener('submit', handleLoginSubmit);
    
    // Ajouter le nouvel écouteur
    DOM.loginForm.addEventListener('submit', handleLoginSubmit);
    log('DEBUG: Écouteur de soumission ajouté au formulaire de connexion.');
}

function handleLoginSubmit(event) {
    event.preventDefault();
    log('LOGIN: Fonction handleLogin() appelée.');
    handleLogin();
}

function initializeModalListeners() {
    log('DEBUG: initializeModalListeners appelée.');
    
    if (!DOM.fullScreenLoader) {
        log('WARN: fullScreenLoader non trouvé, création dynamique...');
        createFullScreenLoader();
    } else {
        log('DEBUG initializeModalListeners: fullScreenLoader element found: true');
    }
}

function createFullScreenLoader() {
    DOM.fullScreenLoader = document.createElement('div');
    DOM.fullScreenLoader.id = 'fullScreenLoader';
    DOM.fullScreenLoader.className = 'full-screen-loader';
    DOM.fullScreenLoader.style.display = 'none';
    DOM.fullScreenLoader.innerHTML = `
        <div class="loader-content">
            <div class="spinner"></div>
            <p>Chargement...</p>
        </div>
    `;
    document.body.appendChild(DOM.fullScreenLoader);
    log('DEBUG: FullScreenLoader créé dynamiquement');
}

// Gestion de la connexion
window.handleLogin = function() {
    log('LOGIN: Fonction handleLogin() appelée.');
    
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();
    
    if (!email || !password) {
        showStatus('Veuillez remplir tous les champs', 'error');
        return;
    }
    
    log(`LOGIN: Tentative de connexion avec email: ${email}`);
    
    // Désactiver le bouton pendant la requête
    if (DOM.loginButton) {
        DOM.loginButton.disabled = true;
        DOM.loginButton.textContent = 'Connexion...';
    }
    
    // Appel API de connexion
    login(email, password);
};

function login(email, password) {
    const apiUrl = `${CONFIG.API_BASE_URL}?type=loginpresta&email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`;
    log(`LOGIN: URL d'API générée: ${apiUrl}`);
    
    // Utiliser JSONP pour contourner les problèmes CORS
    jsonpRequest(apiUrl, 'cbLogin', function(response) {
        log('LOGIN: Réponse de l API de login:', response);
        
        // Réactiver le bouton
        if (DOM.loginButton) {
            DOM.loginButton.disabled = false;
            DOM.loginButton.textContent = 'Se connecter';
        }
        
        if (response.success) {
            handleLoginSuccess(response, email);
        } else {
            handleLoginFailure(response);
        }
    });
}

function handleLoginSuccess(response, email) {
    appState.isLoggedIn = true;
    appState.currentUser = {
        email: email,
        prenom: response.prenom,
        nom: response.nom
    };
    
    // Sauvegarder en localStorage
    localStorage.setItem('viiveo_user', JSON.stringify(appState.currentUser));
    
    // Mettre à jour l'interface
    updateUIAfterLogin();
    
    // Afficher le message de succès
    const userName = `${response.prenom} ${response.nom}`;
    showStatus(`Connexion réussie - Bienvenue ${userName}`, 'success');
    
    // Charger les missions
    log('LOGIN: Chargement des missions après connexion réussie...');
    loadMissions();
    
    log('LOGIN: Fonction login() terminée.');
}

function handleLoginFailure(response) {
    const errorMessage = response.message || 'Échec de la connexion. Vérifiez vos identifiants.';
    showStatus(errorMessage, 'error');
    appState.isLoggedIn = false;
    appState.currentUser = null;
    localStorage.removeItem('viiveo_user');
}

function updateUIAfterLogin() {
    // Masquer la section login, afficher la section missions
    if (DOM.loginSection) DOM.loginSection.style.display = 'none';
    if (DOM.missionsSection) DOM.missionsSection.style.display = 'block';
    
    // Mettre à jour les infos utilisateur
    if (DOM.userInfo && DOM.userName && appState.currentUser) {
        DOM.userName.textContent = `${appState.currentUser.prenom} ${appState.currentUser.nom}`;
        DOM.userInfo.style.display = 'flex';
    }
}

// Gestion des missions
window.loadMissions = function() {
    log('LOAD MISSIONS: Chargement des missions...');
    
    // S'assurer que les conteneurs existent
    ensureMissionContainers();
    
    if (!DOM.missionsContainer || !DOM.loaderMissions || !DOM.emptyMissions) {
        log('ERROR: Un ou plusieurs conteneurs de missions/loader sont introuvables dans le DOM');
        showStatus('Erreur lors du chargement des missions', 'error');
        return;
    }
    
    // Afficher le loader, masquer le conteneur et l'état vide
    DOM.loaderMissions.style.display = 'block';
    DOM.missionsContainer.style.display = 'none';
    DOM.emptyMissions.style.display = 'none';
    
    // Simuler le chargement des missions (à remplacer par l'appel API réel)
    setTimeout(() => {
        // Ici, vous appelleriez votre API pour récupérer les missions
        // Pour l'instant, on simule des données
        const mockMissions = [
            {
                id: 1,
                titre: "Installation fibre optique",
                client: "Client A",
                adresse: "123 Rue Example, Paris",
                date: "2024-01-15",
                statut: "planifiée"
            },
            {
                id: 2,
                titre: "Dépannage réseau",
                client: "Client B", 
                adresse: "456 Avenue Test, Lyon",
                date: "2024-01-16",
                statut: "en cours"
            }
        ];
        
        displayMissions(mockMissions);
    }, 1000);
};

function displayMissions(missions) {
    if (!DOM.missionsContainer || !DOM.loaderMissions || !DOM.emptyMissions) {
        log('ERROR: Impossible d afficher les missions - conteneurs manquants');
        return;
    }
    
    // Masquer le loader
    DOM.loaderMissions.style.display = 'none';
    
    if (missions && missions.length > 0) {
        appState.missions = missions;
        
        // Afficher les missions
        DOM.missionsContainer.innerHTML = missions.map(mission => `
            <div class="mission-card" data-mission-id="${mission.id}">
                <h3>${mission.titre}</h3>
                <div class="mission-info">
                    <p><strong>Client:</strong> ${mission.client}</p>
                    <p><strong>Adresse:</strong> ${mission.adresse}</p>
                    <p><strong>Date:</strong> ${mission.date}</p>
                    <p><strong>Statut:</strong> <span class="status-${mission.statut}">${mission.statut}</span></p>
                </div>
            </div>
        `).join('');
        
        DOM.missionsContainer.style.display = 'grid';
        DOM.emptyMissions.style.display = 'none';
    } else {
        // Aucune mission
        DOM.missionsContainer.style.display = 'none';
        DOM.emptyMissions.style.display = 'block';
    }
}

function refreshMissions() {
    showStatus('Actualisation des missions...', 'info');
    loadMissions();
}

// Gestion de la déconnexion
window.logout = function() {
    appState.isLoggedIn = false;
    appState.currentUser = null;
    appState.missions = [];
    
    // Réinitialiser l'interface
    if (DOM.loginSection) DOM.loginSection.style.display = 'flex';
    if (DOM.missionsSection) DOM.missionsSection.style.display = 'none';
    if (DOM.userInfo) DOM.userInfo.style.display = 'none';
    if (DOM.loginForm) DOM.loginForm.reset();
    
    // Nettoyer le localStorage
    localStorage.removeItem('viiveo_user');
    
    showStatus('Déconnexion réussie', 'success');
};

// Utilitaires JSONP
function jsonpRequest(url, prefix, callback) {
    const callbackName = prefix + Date.now();
    const script = document.createElement('script');
    
    window[callbackName] = function(data) {
        delete window[callbackName];
        document.body.removeChild(script);
        callback(data);
    };
    
    const fullUrl = url + (url.includes('?') ? '&' : '?') + 'callback=' + callbackName;
    script.src = fullUrl;
    
    log(`JSONP: Requête lancée pour ${fullUrl} avec callback ${callbackName}`);
    
    document.body.appendChild(script);
}

// Gestion des messages de statut
function showStatus(message, type = 'info') {
    if (!DOM.statusMessage) {
        console.log(`STATUS [${type}]: ${message}`);
        return;
    }
    
    DOM.statusMessage.textContent = message;
    DOM.statusMessage.className = `status-message ${type} show`;
    
    setTimeout(() => {
        DOM.statusMessage.classList.remove('show');
    }, 3000);
}

// Vérification du statut de connexion
function checkLoginStatus() {
    const savedUser = localStorage.getItem('viiveo_user');
    if (savedUser) {
        try {
            const user = JSON.parse(savedUser);
            // Auto-reconnecter l'utilisateur
            appState.isLoggedIn = true;
            appState.currentUser = user;
            updateUIAfterLogin();
            loadMissions();
            showStatus(`Reconnexion automatique - Bienvenue ${user.prenom} ${user.nom}`, 'success');
        } catch (e) {
            localStorage.removeItem('viiveo_user');
        }
    }
}

// Fonction de logging pour le debug
function log(message, data = null) {
    if (CONFIG.DEBUG) {
        if (data) {
            console.log(`[Viiveo] ${message}`, data);
        } else {
            console.log(`[Viiveo] ${message}`);
        }
    }
}

// Gestion des erreurs globales
window.addEventListener('error', function(e) {
    log('ERREUR GLOBALE:', e.error);
    showStatus('Une erreur est survenue', 'error');
});

// Exposer les fonctions globales
window.initializeApp = initializeApp;
window.handleLogin = handleLogin;
window.loadMissions = loadMissions;
window.logout = logout;
window.refreshMissions = refreshMissions;
