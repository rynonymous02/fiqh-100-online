// Load environment variables
require('dotenv').config();

const WebSocket = require('ws');
const http = require('http');
const express = require('express');
const session = require('express-session');
const path = require('path');

// Create Express app
const app = express();

// Session configuration for authentication
app.use(session({
    secret: process.env.SESSION_SECRET || 'family100-secret-key-2024',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: process.env.NODE_ENV === 'production' && process.env.VERCEL_URL,
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Parse JSON bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// User database with specific roles
const users = {
    // Admin account
    'admin': {
        password: process.env.ADMIN_PASSWORD || 'admin123',
        role: 'admin'
    },
    // Host account
    'host': {
        password: process.env.HOST_PASSWORD || 'host123',
        role: 'host'
    },
    // Player accounts
    'player1': {
        password: process.env.PLAYER1_PASSWORD || 'player123',
        role: 'player'
    },
    'player2': {
        password: process.env.PLAYER2_PASSWORD || 'player123',
        role: 'player'
    },
    'player3': {
        password: process.env.PLAYER3_PASSWORD || 'player123',
        role: 'player'
    },
    'player4': {
        password: process.env.PLAYER4_PASSWORD || 'player123',
        role: 'player'
    }
};

// Authentication middleware
function requireAuth(req, res, next) {
    if (req.session && req.session.authenticated) {
        return next();
    } else {
        return res.redirect('/login.html');
    }
}

// Role-based access middleware
function requireRole(allowedRoles) {
    return (req, res, next) => {
        if (!req.session || !req.session.authenticated) {
            return res.redirect('/login.html');
        }
        
        if (allowedRoles.includes(req.session.role)) {
            return next();
        } else {
            return res.status(403).send('Access denied: Insufficient permissions');
        }
    };
}

// Authentication routes
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
        return res.status(400).json({ success: false, message: 'Username and password are required' });
    }
    
    const user = users[username.toLowerCase()];
    
    if (user && user.password === password) {
        req.session.authenticated = true;
        req.session.username = username.toLowerCase();
        req.session.role = user.role;
        
        res.json({ 
            success: true, 
            role: user.role,
            message: 'Login successful'
        });
    } else {
        res.status(401).json({ 
            success: false, 
            message: 'Invalid username or password' 
        });
    }
});

app.post('/api/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Could not log out' });
        }
        res.json({ success: true, message: 'Logged out successfully' });
    });
});

// Check authentication status
app.get('/api/auth-status', (req, res) => {
    if (req.session && req.session.authenticated) {
        res.json({
            authenticated: true,
            username: req.session.username,
            role: req.session.role
        });
    } else {
        res.json({ authenticated: false });
    }
});

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Root route - redirect to login if not authenticated
app.get('/', (req, res) => {
    if (req.session && req.session.authenticated) {
        // Redirect based on role
        if (req.session.role === 'admin' || req.session.role === 'host') {
            res.redirect('/host');
        } else {
            res.redirect('/player');
        }
    } else {
        res.redirect('/login.html');
    }
});

// Protected routes with role-based access
app.get('/family', requireRole(['admin', 'host']), (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'family.html'));
});

app.get('/host', requireRole(['admin', 'host']), (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'host.html'));
});

app.get('/player', requireAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'player.html'));
});

// Create HTTP server
const server = http.createServer(app);

// Create WebSocket server
const wss = new WebSocket.Server({ server });

// Game state with fiqh/thaharah questions
let gameState = {
    currentQuestion: "Sebutkan macam macam najis",
    answers: [
        { text: "Najis Mukhofafah", points: 30 },
        { text: "Najis Mutawasitho", points: 25 },
        { text: "Najis Mughaladah", points: 20 },
    ],
    team1: { points: 0, strikes: 0 },
    team2: { points: 0, strikes: 0 },
    currentRound: 1,
    roundPoints: 0,
    buzzerEnabled: false,
    activeTeam: null
};

// Database pertanyaan fiqh/thaharah
const questionsDatabase = [
    {
        question: "Apa saja rukun sholat",
        answers: [
            { text: "Niat", points: 10 },
            { text: "Takbiratul Ihram", points: 10 },
            { text: "Membaca Al-Fatihah", points: 10 },
            { text: "Rukuk", points: 10 },
            { text: "I'tidal", points: 10 },
            { text: "Dua Sujud", points: 10 },
            { text: "Duduk Diantara Dua Sujud", points: 10 },
            { text: "Membaca Tasyahud", points: 10 },
        ]
    },
    {
        question: "Apa saja najis mutawasitho?",
        answers: [
            { text: "Kotoran", points: 10 },
            { text: "Air Kencing", points: 10 },
            { text: "Darah", points: 10 },
            { text: "Bangkai", points: 10 },
        ]
    },
    {
        question: "Apa saja penyebab batal wudhu",
        answers: [
            { text: "Buang air kecil/besar", points: 10 },
            { text: "Kentut", points: 10 },
            { text: "Tidur", points: 10 },
            { text: "Mabuk/Pink Sun", points: 10 },
            { text: "Menyentuh #$@$@%", points: 10 },
            { text: "Tidur dengan posisi berbaring", points: 10 },
            { text: "Bersentuhnya antara dua kulit lawan jenis", points: 10 },
        ]
    },
    {
        question: "Apa saja rukun wudhu?",
        answers: [
            { text: "Niat", points: 10 },
            { text: "Membasuh Muka", points: 10 },
            { text: "Membasuh kedua tangan", points: 10 },
            { text: "Mengusap sebagian rambut", points: 10 },
            { text: "Membasuh kedua kaki", points: 10 },
        ]
    },
    {
        question: "Apa saja huruf-huruf idgham bighunnah?",
        answers: [
            { text: "Ya'", points: 10 },
            { text: "Wau", points: 10 },
            { text: "Mim", points: 10 },
            { text: "Nun", points: 10 },
        ]
    },
    {
        question: "Apa saja jenis-jenis idgham?",
        answers: [
            { text: "Idgham Bighunnah", points: 10 },
            { text: "Idgham Bilaghunnah", points: 10 },
            { text: "Idgham Mimi", points: 10 },
            { text: "Idgham Mutamatsilain", points: 10 },
            { text: "Idgham Mutaqarribain", points: 10 },
            { text: "Idgham Mutajanissain", points: 10 },
        ]
    },
    {
        question: "Apa saja rukun islam?",
        answers: [
            { text: "Syahadat", points: 10 },
            { text: "Sholat", points: 10 },
            { text: "Zakat", points: 10 },
            { text: "Puasa Ramadhan", points: 10 },
            { text: "Haji Bagi Mampu", points: 10 },
        ]
    },
    
    
];

let currentQuestionIndex = 0;

// Store connected clients
const clients = new Set();
let displayHost = null; // family.html
let gameHost = null;    // host.html
const players = new Set();
let isBuzzActive = false;

// Handle WebSocket connections
wss.on('connection', (ws, req) => {
    console.log('Client connected');
    
    // Parse session from request (for WebSocket authentication)
    // Note: In production, implement proper WebSocket authentication
    ws.isAuthenticated = false;
    ws.userRole = null;
    ws.username = null;
    
    clients.add(ws);

    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            
            switch (data.type) {
                case 'authenticate':
                    // Authenticate WebSocket connection
                    const user = users[data.username];
                    if (user && user.password === data.password) {
                        ws.isAuthenticated = true;
                        ws.userRole = user.role;
                        ws.username = data.username;
                        ws.send(JSON.stringify({
                            type: 'authResult',
                            success: true,
                            role: user.role
                        }));
                        console.log(`WebSocket authenticated: ${data.username} (${user.role})`);
                    } else {
                        ws.send(JSON.stringify({
                            type: 'authResult',
                            success: false,
                            message: 'Invalid credentials'
                        }));
                        ws.close();
                    }
                    break;

                case 'identify':
                    if (!ws.isAuthenticated) {
                        ws.send(JSON.stringify({
                            type: 'error',
                            message: 'Authentication required'
                        }));
                        ws.close();
                        return;
                    }
                    
                    if (data.role === 'host' && (ws.userRole === 'admin' || ws.userRole === 'host')) {
                        gameHost = ws;
                        console.log('Game Host registered');
                        // Send initial game state
                        ws.send(JSON.stringify({
                            type: 'gameState',
                            state: gameState
                        }));
                    }
                    break;

                case 'register':
                    if (!ws.isAuthenticated) {
                        ws.send(JSON.stringify({
                            type: 'error',
                            message: 'Authentication required'
                        }));
                        ws.close();
                        return;
                    }
                    
                    if (data.role === 'display' && (ws.userRole === 'admin' || ws.userRole === 'host')) {
                        displayHost = ws;
                        console.log('Display Host registered');
                        // Send filtered game state
                        sendFilteredGameState(ws);
                    } else if (data.role === 'player' && ws.userRole === 'player') {
                        players.add(ws);
                        ws.playerName = data.playerName || ws.username;
                        ws.team = data.team;
                        broadcastPlayers();
                        console.log(`Player ${ws.playerName} registered for Team ${data.team}`);
                    }
                    break;

                case 'answer':
                    if (ws === gameHost && (ws.userRole === 'admin' || ws.userRole === 'host')) {
                        handleAnswer(data);
                        // Send sound trigger to display based on answer correctness
                        if (displayHost) {
                            displayHost.send(JSON.stringify({
                                type: 'playSound',
                                sound: data.correct ? 'correct' : 'wrong'
                            }));
                        }
                        
                        // Additional event for wrong answers
                        if (!data.correct && displayHost) {
                            displayHost.send(JSON.stringify({
                                type: 'wrong',
                                team: data.team
                            }));
                        }
                    }
                    break;

                case 'buzz':
                    if (players.has(ws) && ws.userRole === 'player' && !isBuzzActive && gameState.buzzerEnabled) {
                        isBuzzActive = true;
                        gameState.activeTeam = ws.team;
                        
                        // Notify game host
                        if (gameHost) {
                            gameHost.send(JSON.stringify({
                                type: 'buzz',
                                playerName: ws.playerName,
                                team: ws.team
                            }));
                        }

                        // Notify display host
                        if (displayHost) {
                            displayHost.send(JSON.stringify({
                                type: 'playerBuzzed',
                                playerName: ws.playerName,
                                team: ws.team
                            }));
                        }

                        // Notify all players
                        broadcastToPlayers({
                            type: 'buzzLocked',
                            playerName: ws.playerName,
                            team: ws.team
                        });
                    }
                    break;

                case 'toggleBuzzer':
                    if (ws === gameHost && (ws.userRole === 'admin' || ws.userRole === 'host')) {
                        gameState.buzzerEnabled = data.enabled;
                        isBuzzActive = false;
                        broadcastGameState();
                        broadcastToPlayers({
                            type: 'buzzerState',
                            enabled: data.enabled
                        });
                    }
                    break;

                case 'switchTeam':
                    if (ws === gameHost && (ws.userRole === 'admin' || ws.userRole === 'host')) {
                        gameState.activeTeam = data.team;
                        broadcastGameState();
                    }
                    break;

                case 'nextQuestion':
                    if (ws === gameHost && (ws.userRole === 'admin' || ws.userRole === 'host')) {
                        // Move to next question index
                        currentQuestionIndex = (currentQuestionIndex + 1) % questionsDatabase.length;
                        
                        // Create new game state with next question but preserve scores
                        gameState = {
                            currentQuestion: questionsDatabase[currentQuestionIndex].question,
                            answers: questionsDatabase[currentQuestionIndex].answers.map(a => ({...a, revealed: false})),
                            team1: { ...gameState.team1 },
                            team2: { ...gameState.team2 },
                            currentRound: gameState.currentRound + 1,
                            roundPoints: 0,
                            buzzerEnabled: false,
                            activeTeam: null
                        };
                        
                        // Reset game control flags
                        isBuzzActive = false;
                        
                        // Send reset notification and play sound
                        if (displayHost) {
                            displayHost.send(JSON.stringify({
                                type: 'playSound',
                                sound: 'start'
                            }));
                        }
                        
                        // Broadcast new state to all clients
                        broadcastGameState();
                    }
                    break;

                case 'resetRound':
                    if (ws === gameHost && (ws.userRole === 'admin' || ws.userRole === 'host')) {
                        resetRound(data.resetAll);
                    }
                    break;

                case 'showAllAnswers':
                    if (ws === gameHost && (ws.userRole === 'admin' || ws.userRole === 'host')) {
                        showAllAnswers();
                    }
                    break;
            }
        } catch (error) {
            console.error('Error processing message:', error);
        }
    });

    ws.on('close', () => {
        console.log('Client disconnected');
        clients.delete(ws);
        if (ws === displayHost) {
            displayHost = null;
            console.log('Display Host disconnected');
        }
        if (ws === gameHost) {
            gameHost = null;
            console.log('Game Host disconnected');
        }
        if (players.has(ws)) {
            players.delete(ws);
            broadcastPlayers();
            console.log(`Player ${ws.playerName} disconnected`);
        }
    });
});

function handleAnswer(data) {
    // Special case for wrong answer (index = -1)
    if (data.index === -1 && !data.correct) {
        // Add strike to the active team
        if (gameState.activeTeam === '1') {
            gameState.team1.strikes++;
        } else if (gameState.activeTeam === '2') {
            gameState.team2.strikes++;
        }
        
        // Send wrong answer event to family.html
        if (displayHost) {
            displayHost.send(JSON.stringify({
                type: 'answer',
                correct: false,
                team: gameState.activeTeam
            }));
        }
        
        // Force immediate state update
        broadcastGameState();
        return;
    }

    // Normal case for revealing answers
    const answer = gameState.answers[data.index];
    if (answer && !answer.revealed) {
        answer.revealed = true;
        answer.correct = data.correct;  // Track if answer was correct
        if (data.correct) {
            // Add points to the active team
            if (gameState.activeTeam === '1') {
                gameState.team1.points += answer.points;
            } else if (gameState.activeTeam === '2') {
                gameState.team2.points += answer.points;
            }
            gameState.roundPoints += answer.points;
        } else {
            // Add strike to the active team
            if (gameState.activeTeam === '1') {
                gameState.team1.strikes++;
            } else if (gameState.activeTeam === '2') {
                gameState.team2.strikes++;
            }
            
            // Send wrong answer event to family.html
            if (displayHost) {
                displayHost.send(JSON.stringify({
                    type: 'answer',
                    correct: false,
                    team: gameState.activeTeam
                }));
            }
        }
        // Force immediate state update
        broadcastGameState();
    }
}

function resetRound(resetAll = true) {
    // Move to next question index
    currentQuestionIndex = (currentQuestionIndex + 1) % questionsDatabase.length;
    
    // Create fresh game state with next question
    gameState = {
        currentQuestion: questionsDatabase[currentQuestionIndex].question,
        answers: questionsDatabase[currentQuestionIndex].answers.map(a => ({...a, revealed: false})),
        team1: resetAll ? { points: 0, strikes: 0 } : { ...gameState.team1 },
        team2: resetAll ? { points: 0, strikes: 0 } : { ...gameState.team2 },
        currentRound: gameState.currentRound + 1,
        roundPoints: 0,
        buzzerEnabled: false,
        activeTeam: null
    };
    
    // Reset game control flags
    isBuzzActive = false;
    
    // Send reset notification and play sound
    if (displayHost) {
        displayHost.send(JSON.stringify({
            type: 'playSound',
            sound: 'start'
        }));
    }
    
    // Force update all clients with the new state
    if (gameHost) {
        gameHost.send(JSON.stringify({
            type: 'forceReset',
            state: gameState
        }));
    }
    
    // Broadcast to other clients
    broadcastGameState();
    broadcastToPlayers({ 
        type: 'roundReset',
        resetAll: resetAll
    });
}

function showAllAnswers() {
    gameState.answers.forEach(answer => answer.revealed = true);
    broadcastGameState();
}

function sendFilteredGameState(ws) {
    // Send a filtered version of game state to the display host
    const displayState = {
        ...gameState,
        answers: gameState.answers.map(a => ({
            ...a,
            text: (a.revealed && a.correct) ? a.text : '',
            points: (a.revealed && a.correct) ? a.points : ''
        }))
    };
    ws.send(JSON.stringify({
        type: 'gameState',
        state: displayState
    }));
}

function broadcastGameState() {
    // Send full state to game host
    if (gameHost) {
        gameHost.send(JSON.stringify({
            type: 'gameState',
            state: gameState
        }));
    }
    // Send filtered state to display host
    if (displayHost) {
        sendFilteredGameState(displayHost);
    }
}

function broadcastPlayers() {
    if (displayHost) {
        const playersList = Array.from(players).map(player => ({
            name: player.playerName,
            team: player.team
        }));
        displayHost.send(JSON.stringify({
            type: 'playerJoined',
            players: playersList
        }));
    }
}

function broadcastToPlayers(data) {
    players.forEach(player => {
        player.send(JSON.stringify(data));
    });
}

// Start server
const PORT = process.env.PORT || 3000;

// Only start server if not in Vercel environment
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL_URL) {
    server.listen(PORT, () => {
        console.log(`🚀 Family 100 Server running on port ${PORT}`);
        console.log(`📱 Family display: http://localhost:${PORT}/family`);
        console.log(`👨‍💼 Host interface: http://localhost:${PORT}/host`);
        console.log(`🎮 Player interface: http://localhost:${PORT}/player`);
        console.log(`🔐 Login page: http://localhost:${PORT}/login.html`);
        console.log('\n🔑 Demo accounts:');
        console.log('   Admin: admin / admin123');
        console.log('   Host: host / host123');
        console.log('   Players: player1-4 / player123');
    });
} else {
    console.log('🔧 Running in Vercel environment');
}

// Export for Vercel
module.exports = app;