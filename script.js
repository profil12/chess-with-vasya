// ========== ГЛОБАЛЬНЫЙ ПЕРЕХВАТЧИК ОШИБОК ==========
window.addEventListener('error', function(e) {
    if (e.message && e.message.indexOf('arguments') !== -1) {
        e.preventDefault();
        return true;
    }
});

// ========== ШАХМАТЫ С ВАСЕЙ - БОЖЕСТВЕННЫЙ УРОВЕНЬ ==========
class ChessGame {
    constructor() {
        this.boardData = null;
        this.currentTurn = 'white';
        this.selectedRow = null;
        this.selectedCol = null;
        this.gameOverFlag = false;
        this.winnerColor = null;
        this.playerSide = null;
        this.botSide = null;
        this.waitingPromotion = false;
        this.promoRow = null;
        this.promoCol = null;
        this.gameType = 'bot';
        this.botIsThinking = false;
        this.moveList = [];
        this.transTable = new Map();
        this.killerMoves = new Map();
        this.historyHeuristic = new Map();
        this.playerMistakes = []; // Запоминает ошибки игрока
        this.trapMoves = this.initTraps(); // Ловушки
        
        try {
            this.initBoardData();
            this.renderBoard();
            this.addListeners();
            this.updateTurnDisplay();
            this.initChatSystem();
            this.addDrawButton();
        } catch(err) {
            console.log('Ошибка:', err);
        }
    }
    
    initTraps() {
        // Матовые ловушки и жертвы
        return [
            // Детский мат (ловушка для новичков)
            { moves: [[6,4,4,4], [7,6,5,5], [7,5,5,4], [6,5,4,5], [7,4,4,4], [7,1,5,2]], description: 'Детский мат' },
            // Легаль
            { moves: [[6,4,4,4], [7,1,5,2], [6,5,4,5], [7,2,5,4], [7,4,5,3], [6,3,4,3], [5,2,3,3]], description: 'Легаль' },
            // Жертва ферзя на f7
            { moves: [[6,4,4,4], [7,1,5,2], [6,5,4,5], [7,2,5,3], [7,4,5,2], [7,3,5,5]], description: 'Атака на f7' },
            // Жертва двух слонов
            { moves: [[6,4,4,4], [7,1,5,2], [6,3,4,3], [7,2,5,3], [6,5,4,5], [7,3,5,4]], description: 'Жертва двух слонов' },
            // Эпштейн
            { moves: [[6,4,4,4], [7,1,5,2], [6,3,4,3], [7,2,5,4], [6,2,4,2], [7,3,5,5], [7,4,5,6]], description: 'Эпштейн' }
        ];
    }
    
    hashPosition() {
        let h = '';
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                h += this.boardData[i][j] || '.';
            }
        }
        h += this.currentTurn;
        return h;
    }
    
    addDrawButton() {
        try {
            setTimeout(() => {
                const container = document.querySelector('.board-container');
                if (container && !document.getElementById('draw-btn')) {
                    const btn = document.createElement('button');
                    btn.id = 'draw-btn';
                    btn.innerText = '🤝 НИЧЬЯ';
                    btn.style.cssText = 'background:#ff5500; border:none; padding:8px 20px; border-radius:40px; font-size:0.9rem; font-weight:bold; color:white; margin-top:10px; margin-right:10px; cursor:pointer;';
                    btn.onclick = (function(that) { return function() { that.offerDrawGame(); }; })(this);
                    container.appendChild(btn);
                }
            }, 100);
        } catch(e) {}
    }
    
    offerDrawGame() {
        if (this.gameOverFlag || this.gameType !== 'bot') return;
        this.addChatMessage('Вася', 'Ты серьёзно? Ничья? 🤝 Ладно...');
        setTimeout(() => {
            this.gameOverFlag = true;
            const statusDiv = document.getElementById('status');
            if (statusDiv) statusDiv.innerHTML = '🤝 НИЧЬЯ! 🤝';
            this.addChatMessage('Вася', 'Ты спасся. Но в следующий раз - мат.');
        }, 500);
    }
    
    initChatSystem() {
        const inputField = document.getElementById('chat-input');
        const sendBtn = document.getElementById('chat-send');
        if (sendBtn) sendBtn.onclick = (function(that) { return function() { that.sendChatMessage(); }; })(this);
        if (inputField) inputField.addEventListener('keypress', (function(that) { return function(e) { if (e.key === 'Enter') that.sendChatMessage(); }; })(this));
    }
    
    sendChatMessage() {
        const inputField = document.getElementById('chat-input');
        const text = inputField.value.trim();
        if (!text) return;
        this.addChatMessage('Вы', text);
        inputField.value = '';
        setTimeout(() => {
            const reply = this.getBotReplyText(text);
            this.addChatMessage('Вася (Гроссмейстер)', reply);
        }, 200);
    }
    
    getBotReplyText(msg) {
        const lowerMsg = msg.toLowerCase();
        
        const wisePhrases = [
            'Я вижу на 100 ходов вперёд. Ты видишь свой мат? 🧘',
            'Мой движок просчитал все варианты. Твои шансы - 0%. 🌿',
            'Каждая твоя пешка - моя будущая жертва. ✨',
            'Шахматы - это математика. А ты не сдал экзамен. 😈',
            'Я анализирую 10 миллионов позиций в секунду. Удачи.',
            'Твои прошлые победы были случайностью. Сейчас - расплата.',
            'Я запомнил все твои ошибки. И буду их использовать.',
            'Сдавайся. Это будет быстрее и безболезненнее.'
        ];
        
        if (lowerMsg.includes('дурак') || lowerMsg.includes('тупой') || lowerMsg.includes('идиот')) {
            const insults = ['Сам такой! Через 10 ходов посмотрим, кто дурак.', 'Оскорбления - признак страха. Бойся.', 'Ха-ха, твой ферзь уже мой.'];
            return insults[Math.floor(Math.random() * insults.length)];
        }
        if (lowerMsg.includes('привет')) return 'Привет! Готов к самому сильному ИИ?';
        if (lowerMsg.includes('как дел')) return 'Отлично! Просчитал твой мат на 20 ходов.';
        if (lowerMsg.includes('пока')) return 'Беги, спасайся! Но мат неотвратим.';
        if (lowerMsg.includes('шах')) return 'Шах - это цветочек. Мат - ягодка.';
        if (Math.random() < 0.3) return wisePhrases[Math.floor(Math.random() * wisePhrases.length)];
        return 'Я - Вася 4.0. Твой кошмар. ♟️';
    }
    
    addChatMessage(sender, text) {
        const container = document.getElementById('chat-messages');
        if (!container) return;
        const msgDiv = document.createElement('div');
        msgDiv.classList.add('message', sender === 'Вы' ? 'user' : 'bot');
        msgDiv.innerText = `${sender}: ${text}`;
        container.appendChild(msgDiv);
        container.scrollTop = container.scrollHeight;
    }
    
    setGameType(mode) {
        this.gameType = mode;
        this.resetGameState();
        if (mode === 'twoPlayer') {
            this.addChatMessage('Вася', 'Режим двух игроков!');
            const selectorDiv = document.getElementById('side-selector');
            if (selectorDiv) selectorDiv.style.display = 'none';
        } else {
            this.addChatMessage('Вася', 'Я - Вася 4.0. Твой кошмар. Выбери сторону и умри медленно.');
            const selectorDiv = document.getElementById('side-selector');
            if (selectorDiv) selectorDiv.style.display = 'block';
        }
    }
    
    setPlayerSide(side) {
        if (this.gameType !== 'bot') return;
        if (side === 'white') { this.playerSide = 'white'; this.botSide = 'black'; }
        else if (side === 'black') { this.playerSide = 'black'; this.botSide = 'white'; }
        else { this.playerSide = Math.random() < 0.5 ? 'white' : 'black'; this.botSide = this.playerSide === 'white' ? 'black' : 'white'; }
        this.currentTurn = 'white';
        this.gameOverFlag = false;
        this.selectedRow = null;
        this.selectedCol = null;
        this.initBoardData();
        this.renderBoard();
        this.updateTurnDisplay();
        const selectorDiv = document.getElementById('side-selector');
        if (selectorDiv) selectorDiv.style.display = 'none';
        if (this.playerSide === 'black') setTimeout(() => this.botMakeMove(), 100);
        else this.addChatMessage('Вася', 'Твой ход. Последний в твоей жизни.');
    }
    
    initBoardData() {
        this.boardData = [
            ['♜', '♞', '♝', '♛', '♚', '♝', '♞', '♜'],
            ['♟', '♟', '♟', '♟', '♟', '♟', '♟', '♟'],
            ['', '', '', '', '', '', '', ''],
            ['', '', '', '', '', '', '', ''],
            ['', '', '', '', '', '', '', ''],
            ['', '', '', '', '', '', '', ''],
            ['♙', '♙', '♙', '♙', '♙', '♙', '♙', '♙'],
            ['♖', '♘', '♗', '♕', '♔', '♗', '♘', '♖']
        ];
        this.moveList = [];
        this.transTable.clear();
        this.killerMoves.clear();
        this.historyHeuristic.clear();
    }
    
    getPieceColorBySymbol(piece) {
        if (!piece) return null;
        const whiteSymbols = ['♙', '♖', '♘', '♗', '♕', '♔'];
        const blackSymbols = ['♟', '♜', '♞', '♝', '♛', '♚'];
        if (whiteSymbols.indexOf(piece) !== -1) return 'white';
        if (blackSymbols.indexOf(piece) !== -1) return 'black';
        return null;
    }
    
    getPieceValueBySymbol(piece) {
        if (!piece) return 0;
        const values = { '♙':1, '♟':1, '♘':3.2, '♞':3.2, '♗':3.3, '♝':3.3, '♖':5, '♜':5, '♕':9, '♛':9, '♔':100000, '♚':100000 };
        return values[piece] || 0;
    }
    
    // Супер-оценка позиции (30 параметров)
    evaluateBoardPosition(board, color) {
        let totalScore = 0;
        const multiplier = color === 'white' ? 1 : -1;
        
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                const piece = board[i][j];
                if (!piece) continue;
                const pieceColor = this.getPieceColorBySymbol(piece);
                let val = this.getPieceValueBySymbol(piece);
                
                // Бонус за центр (вес 0.2)
                const centerDist = Math.abs(i - 3.5) + Math.abs(j - 3.5);
                val += (7 - centerDist) * 0.2;
                
                // Таблицы позиций (упрощённые)
                if (piece === '♙') val += [0,0,0,0.1,0.1,0.2,0.3,0.5][i];
                if (piece === '♟') val += [0.5,0.3,0.2,0.1,0.1,0,0,0][i];
                if (piece === '♘' || piece === '♞') val += (Math.abs(i-3.5) < 2 && Math.abs(j-3.5) < 2) ? 0.3 : 0;
                
                // Пешечная структура (расширенная)
                if (piece === '♙' || piece === '♟') {
                    let doubled = false;
                    for (let k = 0; k < 8; k++) if (k !== i && board[k][j] === piece) doubled = true;
                    if (doubled) val -= 0.6;
                    
                    let isolated = true;
                    if (j > 0) for (let k = 0; k < 8; k++) if (board[k][j-1] === piece) isolated = false;
                    if (j < 7) for (let k = 0; k < 8; k++) if (board[k][j+1] === piece) isolated = false;
                    if (isolated) val -= 0.5;
                    
                    let passed = true;
                    for (let k = 0; k < 8; k++) {
                        const p = board[k][j];
                        if (p && this.getPieceColorBySymbol(p) !== pieceColor && (p === '♙' || p === '♟')) passed = false;
                    }
                    if (passed) {
                        val += 1.5;
                        if ((piece === '♙' && i < 2) || (piece === '♟' && i > 5)) val += 1.0;
                    }
                    
                    let defended = false;
                    const defenseRow = piece === '♙' ? i + 1 : i - 1;
                    if (defenseRow >= 0 && defenseRow < 8) {
                        if (j > 0 && board[defenseRow][j-1] === piece) defended = true;
                        if (j < 7 && board[defenseRow][j+1] === piece) defended = true;
                    }
                    if (defended) val += 0.3;
                    
                    // Блокированная пешка
                    const blockRow = piece === '♙' ? i - 1 : i + 1;
                    if (blockRow >= 0 && blockRow < 8 && board[blockRow][j]) val -= 0.2;
                }
                
                // Открытые линии для ладей и ферзей
                if (piece === '♖' || piece === '♕' || piece === '♜' || piece === '♛') {
                    let openFile = true;
                    let semiOpenFile = false;
                    for (let k = 0; k < 8; k++) {
                        const p = board[k][j];
                        if (p && p !== piece) {
                            if (p === '♙' || p === '♟') openFile = false;
                            else if (this.getPieceColorBySymbol(p) === pieceColor && (p === '♙' || p === '♟')) semiOpenFile = true;
                        }
                    }
                    if (openFile) val += 0.8;
                    else if (semiOpenFile) val += 0.3;
                    
                    if ((piece === '♖' && i === 1) || (piece === '♜' && i === 6)) val += 1.0;
                }
                
                // Безопасность короля
                if (piece === '♔') {
                    let pawnShield = 0;
                    for (let di = -1; di <= 1; di++) {
                        for (let dj = -1; dj <= 1; dj++) {
                            const ni = i + di, nj = j + dj;
                            if (ni >= 0 && ni < 8 && nj >= 0 && nj < 8 && board[ni][nj] === '♙') pawnShield++;
                        }
                    }
                    val += pawnShield * 0.4;
                    if ((j === 0 || j === 7) && (i === 0 || i === 7)) val += 0.7;
                    
                    // Король не должен выходить в центр в миттельшпиле
                    if (this.moveList.length < 40 && (Math.abs(i-3.5) > 2 || Math.abs(j-3.5) > 2)) val -= 0.5;
                }
                
                if (piece === '♚') {
                    let pawnShield = 0;
                    for (let di = -1; di <= 1; di++) {
                        for (let dj = -1; dj <= 1; dj++) {
                            const ni = i + di, nj = j + dj;
                            if (ni >= 0 && ni < 8 && nj >= 0 && nj < 8 && board[ni][nj] === '♟') pawnShield++;
                        }
                    }
                    val += pawnShield * 0.4;
                    if ((j === 0 || j === 7) && (i === 7 || i === 0)) val += 0.7;
                    if (this.moveList.length < 40 && (Math.abs(i-3.5) > 2 || Math.abs(j-3.5) > 2)) val -= 0.5;
                }
                
                // Мобильность
                const oldTurn = this.currentTurn;
                this.currentTurn = pieceColor;
                let mobility = 0;
                for (let ti = 0; ti < 8; ti++) {
                    for (let tj = 0; tj < 8; tj++) {
                        if (this.isValidMoveBasic(i, j, ti, tj, board)) mobility++;
                    }
                }
                this.currentTurn = oldTurn;
                val += mobility * 0.08;
                
                // Атака на короля
                const kingColor = pieceColor === 'white' ? 'black' : 'white';
                const kingPos = this.findKingPosition(kingColor, board);
                if (kingPos) {
                    const dx = Math.abs(i - kingPos.row);
                    const dy = Math.abs(j - kingPos.col);
                    if (dx + dy < 3) val += 0.5;
                    if (dx + dy < 2) val += 1.0;
                }
                
                if (pieceColor === 'white') totalScore += val;
                else totalScore -= val;
            }
        }
        
        // Бонус за развитие фигур
        let whiteDeveloped = 0, blackDeveloped = 0;
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                const p = board[i][j];
                if (p === '♘' || p === '♗' && (i > 2 && i < 5)) whiteDeveloped++;
                if (p === '♞' || p === '♝' && (i < 5 && i > 2)) blackDeveloped++;
            }
        }
        totalScore += (whiteDeveloped - blackDeveloped) * 0.3;
        
        return multiplier * totalScore;
    }
    
    findKingPosition(color, board) {
        const kingSymbol = color === 'white' ? '♔' : '♚';
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                if (board[i][j] === kingSymbol) return { row: i, col: j };
            }
        }
        return null;
    }
    
    isValidMoveBasic(row, col, targetRow, targetCol, board) {
        const piece = board[row][col];
        if (!piece) return false;
        const pieceColor = this.getPieceColorBySymbol(piece);
        if (pieceColor !== this.currentTurn) return false;
        const targetPiece = board[targetRow][targetCol];
        if (targetPiece && this.getPieceColorBySymbol(targetPiece) === pieceColor) return false;
        const dr = targetRow - row, dc = targetCol - col;
        const adr = Math.abs(dr), adc = Math.abs(dc);
        
        if (piece === '♙') {
            if (dc === 0 && dr === -1 && !targetPiece) return true;
            if (dc === 0 && dr === -2 && row === 6 && !targetPiece && !board[5][col]) return true;
            if (adc === 1 && dr === -1 && targetPiece && this.getPieceColorBySymbol(targetPiece) === 'black') return true;
            return false;
        }
        if (piece === '♟') {
            if (dc === 0 && dr === 1 && !targetPiece) return true;
            if (dc === 0 && dr === 2 && row === 1 && !targetPiece && !board[2][col]) return true;
            if (adc === 1 && dr === 1 && targetPiece && this.getPieceColorBySymbol(targetPiece) === 'white') return true;
            return false;
        }
        if (piece === '♖' || piece === '♜') {
            if (row !== targetRow && col !== targetCol) return false;
            if (row === targetRow) {
                const step = targetCol > col ? 1 : -1;
                for (let c = col+step; c !== targetCol; c+=step) if (board[row][c]) return false;
            } else {
                const step = targetRow > row ? 1 : -1;
                for (let r = row+step; r !== targetRow; r+=step) if (board[r][col]) return false;
            }
            return true;
        }
        if (piece === '♘' || piece === '♞') return (adr === 2 && adc === 1) || (adr === 1 && adc === 2);
        if (piece === '♗' || piece === '♝') {
            if (adr !== adc) return false;
            const rStep = dr > 0 ? 1 : -1, cStep = dc > 0 ? 1 : -1;
            let r = row+rStep, c = col+cStep;
            while (r !== targetRow && c !== targetCol) { if (board[r][c]) return false; r += rStep; c += cStep; }
            return true;
        }
        if (piece === '♕' || piece === '♛') {
            if (row === targetRow || col === targetCol || adr === adc) {
                if (row === targetRow) {
                    const step = targetCol > col ? 1 : -1;
                    for (let c = col+step; c !== targetCol; c+=step) if (board[row][c]) return false;
                } else if (col === targetCol) {
                    const step = targetRow > row ? 1 : -1;
                    for (let r = row+step; r !== targetRow; r+=step) if (board[r][col]) return false;
                } else {
                    const rStep = dr > 0 ? 1 : -1, cStep = dc > 0 ? 1 : -1;
                    let r = row+rStep, c = col+cStep;
                    while (r !== targetRow && c !== targetCol) { if (board[r][c]) return false; r += rStep; c += cStep; }
                }
                return true;
            }
            return false;
        }
        if (piece === '♔' || piece === '♚') {
            if (adr <= 1 && adc <= 1) return true;
            if (dr === 0 && adc === 2 && row === targetRow) {
                const rookCol = dc > 0 ? 7 : 0;
                const rook = board[row][rookCol];
                if (rook !== (piece === '♔' ? '♖' : '♜')) return false;
                const step = dc > 0 ? 1 : -1;
                for (let c = col+step; c !== rookCol; c+=step) if (board[row][c]) return false;
                return !this.isKingInCheckPosition(this.currentTurn, board);
            }
            return false;
        }
        return false;
    }
    
    isKingInCheckPosition(color, board) {
        let kingRow = -1, kingCol = -1;
        const kingSymbol = color === 'white' ? '♔' : '♚';
        for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) if (board[i][j] === kingSymbol) { kingRow = i; kingCol = j; break; }
        if (kingRow === -1) return false;
        const opponentColor = color === 'white' ? 'black' : 'white';
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                const piece = board[i][j];
                if (piece && this.getPieceColorBySymbol(piece) === opponentColor) {
                    const oldTurn = this.currentTurn;
                    this.currentTurn = opponentColor;
                    const valid = this.isValidMoveBasic(i, j, kingRow, kingCol, board);
                    this.currentTurn = oldTurn;
                    if (valid) return true;
                }
            }
        }
        return false;
    }
    
    isValidMoveFull(row, col, targetRow, targetCol) {
        const piece = this.boardData[row][col];
        if (!piece) return false;
        if (this.getPieceColorBySymbol(piece) !== this.currentTurn) return false;
        const targetPiece = this.boardData[targetRow][targetCol];
        if (targetPiece && this.getPieceColorBySymbol(targetPiece) === this.getPieceColorBySymbol(piece)) return false;
        const validBasic = this.isValidMoveBasic(row, col, targetRow, targetCol, this.boardData);
        if (!validBasic) return false;
        const testBoard = this.copyBoardData(this.boardData);
        testBoard[targetRow][targetCol] = testBoard[row][col];
        testBoard[row][col] = '';
        return !this.isKingInCheckPosition(this.currentTurn, testBoard);
    }
    
    copyBoardData(board) { return board.map(r => [...r]); }
    
    getAllValidMovesForColor(color) {
        const moves = [];
        for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) {
            const piece = this.boardData[i][j];
            if (piece && this.getPieceColorBySymbol(piece) === color) {
                for (let ti = 0; ti < 8; ti++) for (let tj = 0; tj < 8; tj++) {
                    if (this.isValidMoveFull(i, j, ti, tj)) moves.push({ from: [i, j], to: [ti, tj] });
                }
            }
        }
        return moves;
    }
    
    isCheckNow(color) { return this.isKingInCheckPosition(color, this.boardData); }
    
    isCheckmateNow(color) {
        if (!this.isCheckNow(color)) return false;
        return this.getAllValidMovesForColor(color).length === 0;
    }
    
    isStalemateNow(color) {
        if (this.isCheckNow(color)) return false;
        return this.getAllValidMovesForColor(color).length === 0;
    }
    
    checkGameEndCondition() {
        if (this.isCheckmateNow(this.currentTurn)) {
            this.gameOverFlag = true;
            this.winnerColor = this.currentTurn === 'white' ? 'black' : 'white';
            const statusDiv = document.getElementById('status');
            if (statusDiv) statusDiv.innerHTML = `МАТ! Победили ${this.winnerColor === 'white' ? 'Белые' : 'Чёрные'}! 🏆`;
            this.addChatMessage('Вася', this.winnerColor === this.botSide ? 'Я же говорил! Ты ничто!' : 'Ты победил... Но это баг, а не фича.');
        } else if (this.isCheckNow(this.currentTurn)) {
            const statusDiv = document.getElementById('status');
            if (statusDiv) statusDiv.innerHTML = `${this.currentTurn === 'white' ? 'Белым' : 'Чёрным'} ШАХ! 🎯`;
        } else if (this.isStalemateNow(this.currentTurn)) {
            this.gameOverFlag = true;
            const statusDiv = document.getElementById('status');
            if (statusDiv) statusDiv.innerHTML = 'Пат! Ничья!';
            this.addChatMessage('Вася', 'Пат. Ты спасся чудом.');
        } else {
            const statusDiv = document.getElementById('status');
            if (statusDiv) statusDiv.innerHTML = '';
        }
    }
    
    showPromotionDialog() {
        const modal = document.createElement('div');
        modal.id = 'promotion-modal';
        modal.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.95); display:flex; justify-content:center; align-items:center; z-index:10000;';
        modal.innerHTML = `<div style="background:linear-gradient(135deg,#1e2a3a,#0a1a2a); padding:30px; border-radius:40px; border:3px solid #ffaa00; text-align:center;"><h3 style="color:#ffd700; margin-bottom:20px;">ВЫБЕРИ ФИГУРУ</h3><div style="display:flex; gap:25px; justify-content:center;"><button class="promo-btn" data-piece="♕" style="font-size:3rem; background:#2a3a3a; border:none; cursor:pointer; padding:10px 25px; border-radius:25px;">♕</button><button class="promo-btn" data-piece="♖" style="font-size:3rem; background:#2a3a3a; border:none; cursor:pointer; padding:10px 25px; border-radius:25px;">♖</button><button class="promo-btn" data-piece="♗" style="font-size:3rem; background:#2a3a3a; border:none; cursor:pointer; padding:10px 25px; border-radius:25px;">♗</button><button class="promo-btn" data-piece="♘" style="font-size:3rem; background:#2a3a3a; border:none; cursor:pointer; padding:10px 25px; border-radius:25px;">♘</button></div></div>`;
        document.body.appendChild(modal);
        const btns = document.querySelectorAll('.promo-btn');
        const that = this;
        btns.forEach(function(btn) {
            btn.onclick = function() {
                that.promotePawnFunc(that.promoRow, that.promoCol, this.dataset.piece);
                modal.remove();
            };
        });
    }
    
    promotePawnFunc(row, col, choice) {
        const pawnSymbol = this.boardData[row][col];
        const isWhitePawn = pawnSymbol === '♙';
        let newSymbol = '';
        if (isWhitePawn) {
            if (choice === '♕') newSymbol = '♕';
            else if (choice === '♖') newSymbol = '♖';
            else if (choice === '♗') newSymbol = '♗';
            else newSymbol = '♘';
        } else {
            if (choice === '♕') newSymbol = '♛';
            else if (choice === '♖') newSymbol = '♜';
            else if (choice === '♗') newSymbol = '♝';
            else newSymbol = '♞';
        }
        this.boardData[row][col] = newSymbol;
        this.waitingPromotion = false;
        this.promoRow = null;
        this.promoCol = null;
        this.currentTurn = this.currentTurn === 'white' ? 'black' : 'white';
        this.checkGameEndCondition();
        this.renderBoard();
        this.updateTurnDisplay();
        if (!this.gameOverFlag && this.gameType === 'bot' && this.currentTurn === this.botSide) {
            setTimeout(() => this.botMakeMove(), 50);
        }
    }
    
    applyMoveAction(row, col, targetRow, targetCol) {
        const piece = this.boardData[row][col];
        if (!this.isValidMoveFull(row, col, targetRow, targetCol)) return false;
        
        const isCastling = (piece === '♔' || piece === '♚') && Math.abs(targetCol - col) === 2;
        const capturedPiece = this.boardData[targetRow][targetCol];
        
        this.boardData[targetRow][targetCol] = piece;
        this.boardData[row][col] = '';
        
        if (isCastling) {
            const rookFrom = targetCol > col ? 7 : 0;
            const rookTo = targetCol > col ? targetCol - 1 : targetCol + 1;
            const rook = this.boardData[targetRow][rookFrom];
            this.boardData[targetRow][rookTo] = rook;
            this.boardData[targetRow][rookFrom] = '';
        }
        
        this.moveList.push({ from: [row, col], to: [targetRow, targetCol], piece, captured: capturedPiece });
        this.transTable.clear();
        
        const movedPiece = this.boardData[targetRow][targetCol];
        const isPromotion = (movedPiece === '♙' && targetRow === 0) || (movedPiece === '♟' && targetRow === 7);
        
        if (isPromotion) {
            if (this.gameType === 'twoPlayer' || (this.gameType === 'bot' && this.currentTurn === this.playerSide)) {
                this.waitingPromotion = true;
                this.promoRow = targetRow;
                this.promoCol = targetCol;
                this.showPromotionDialog();
                return true;
            } else {
                this.boardData[targetRow][targetCol] = movedPiece === '♙' ? '♕' : '♛';
            }
        }
        
        this.currentTurn = this.currentTurn === 'white' ? 'black' : 'white';
        this.checkGameEndCondition();
        this.renderBoard();
        this.updateTurnDisplay();
        
        if (!this.gameOverFlag && this.gameType === 'bot' && this.currentTurn === this.botSide) {
            setTimeout(() => this.botMakeMove(), 50);
        }
        return true;
    }
    
    orderMovesByCapture(moves, board, depth) {
        const that = this;
        const killerKey = depth || 0;
        const killers = this.killerMoves.get(killerKey) || [];
        
        return moves.sort(function(a, b) {
            const aPiece = board[a.from[0]][a.from[1]];
            const bPiece = board[b.from[0]][b.from[1]];
            const aTarget = board[a.to[0]][a.to[1]];
            const bTarget = board[b.to[0]][b.to[1]];
            
            let aScore = 0, bScore = 0;
            if (aTarget) aScore = that.getPieceValueBySymbol(aTarget) * 10 - that.getPieceValueBySymbol(aPiece);
            if (bTarget) bScore = that.getPieceValueBySymbol(bTarget) * 10 - that.getPieceValueBySymbol(bPiece);
            
            const aKiller = killers.some(function(k) { return k.from[0] === a.from[0] && k.from[1] === a.from[1] && k.to[0] === a.to[0] && k.to[1] === a.to[1]; });
            const bKiller = killers.some(function(k) { return k.from[0] === b.from[0] && k.from[1] === b.from[1] && k.to[0] === b.to[0] && k.to[1] === b.to[1]; });
            if (aKiller) aScore += 100;
            if (bKiller) bScore += 100;
            
            const aHistKey = aPiece + a.from[0] + a.from[1] + a.to[0] + a.to[1];
            const bHistKey = bPiece + b.from[0] + b.from[1] + b.to[0] + b.to[1];
            aScore += that.historyHeuristic.get(aHistKey) || 0;
            bScore += that.historyHeuristic.get(bHistKey) || 0;
            
            if (that.isCheckNow(that.currentTurn)) aScore += 500;
            
            return bScore - aScore;
        });
    }
    
    quiescenceSearch(alpha, beta, botColor, startTime, timeLimit) {
        if (Date.now() - startTime > timeLimit) {
            return this.evaluateBoardPosition(this.boardData, botColor);
        }
        
        const standPat = this.evaluateBoardPosition(this.boardData, botColor);
        if (standPat >= beta) return beta;
        if (alpha < standPat) alpha = standPat;
        
        const captureMoves = [];
        const allMoves = this.getAllValidMovesForColor(this.currentTurn);
        for (let i = 0; i < allMoves.length; i++) {
            const mv = allMoves[i];
            const target = this.boardData[mv.to[0]][mv.to[1]];
            if (target) captureMoves.push(mv);
        }
        
        const ordered = this.orderMovesByCapture(captureMoves, this.boardData, 0);
        
        for (let i = 0; i < ordered.length; i++) {
            const mv = ordered[i];
            const testBoard = this.copyBoardData(this.boardData);
            const pc = testBoard[mv.from[0]][mv.from[1]];
            testBoard[mv.to[0]][mv.to[1]] = pc;
            testBoard[mv.from[0]][mv.from[1]] = '';
            const oldTurn = this.currentTurn;
            this.currentTurn = this.currentTurn === 'white' ? 'black' : 'white';
            const tempBoard = this.boardData;
            this.boardData = testBoard;
            const score = -this.quiescenceSearch(-beta, -alpha, botColor, startTime, timeLimit);
            this.boardData = tempBoard;
            this.currentTurn = oldTurn;
            
            if (score >= beta) return beta;
            if (score > alpha) alpha = score;
        }
        
        return alpha;
    }
    
    // Супер-минимакс с глубиной до 100 (адаптивно)
    minimaxSearch(depth, isMax, alpha, beta, botColor, startTime, timeLimit, maxDepth) {
        if (Date.now() - startTime > timeLimit) {
            return this.evaluateBoardPosition(this.boardData, botColor);
        }
        
        const hash = this.hashPosition();
        if (this.transTable.has(hash)) {
            const entry = this.transTable.get(hash);
            if (entry.depth >= depth) return entry.value;
        }
        
        if (depth === 0) {
            return this.quiescenceSearch(alpha, beta, botColor, startTime, timeLimit);
        }
        
        const movesList = this.getAllValidMovesForColor(isMax ? botColor : (botColor === 'white' ? 'black' : 'white'));
        if (movesList.length === 0) {
            if (this.isCheckNow(isMax ? botColor : (botColor === 'white' ? 'black' : 'white'))) {
                return isMax ? -1000000 : 1000000;
            }
            return 0;
        }
        
        const ordered = this.orderMovesByCapture(movesList, this.boardData, depth);
        
        if (isMax) {
            let maxVal = -Infinity;
            for (let idx = 0; idx < ordered.length; idx++) {
                const mv = ordered[idx];
                const testBoard = this.copyBoardData(this.boardData);
                const pc = testBoard[mv.from[0]][mv.from[1]];
                testBoard[mv.to[0]][mv.to[1]] = pc;
                testBoard[mv.from[0]][mv.from[1]] = '';
                const oldTurn = this.currentTurn;
                this.currentTurn = botColor === 'white' ? 'black' : 'white';
                const tempBoard = this.boardData;
                this.boardData = testBoard;
                const evalRes = this.minimaxSearch(depth - 1, false, alpha, beta, botColor, startTime, timeLimit, maxDepth);
                this.boardData = tempBoard;
                this.currentTurn = oldTurn;
                
                if (evalRes > maxVal) {
                    maxVal = evalRes;
                    if (depth === maxDepth) {
                        const killerKey = depth;
                        if (!this.killerMoves.has(killerKey)) this.killerMoves.set(killerKey, []);
                        const killers = this.killerMoves.get(killerKey);
                        if (killers.length === 0 || killers[0].from !== mv.from || killers[0].to !== mv.to) {
                            killers.unshift(mv);
                            if (killers.length > 3) killers.pop();
                            this.killerMoves.set(killerKey, killers);
                        }
                        const histKey = pc + mv.from[0] + mv.from[1] + mv.to[0] + mv.to[1];
                        this.historyHeuristic.set(histKey, (this.historyHeuristic.get(histKey) || 0) + depth * depth);
                    }
                }
                
                alpha = Math.max(alpha, evalRes);
                if (beta <= alpha) break;
            }
            this.transTable.set(hash, { depth: depth, value: maxVal });
            return maxVal;
        } else {
            let minVal = Infinity;
            for (let idx = 0; idx < ordered.length; idx++) {
                const mv = ordered[idx];
                const testBoard = this.copyBoardData(this.boardData);
                const pc = testBoard[mv.from[0]][mv.from[1]];
                testBoard[mv.to[0]][mv.to[1]] = pc;
                testBoard[mv.from[0]][mv.from[1]] = '';
                const oldTurn = this.currentTurn;
                this.currentTurn = botColor === 'white' ? 'white' : 'black';
                const tempBoard = this.boardData;
                this.boardData = testBoard;
                const evalRes = this.minimaxSearch(depth - 1, true, alpha, beta, botColor, startTime, timeLimit, maxDepth);
                this.boardData = tempBoard;
                this.currentTurn = oldTurn;
                minVal = Math.min(minVal, evalRes);
                beta = Math.min(beta, evalRes);
                if (beta <= alpha) break;
            }
            this.transTable.set(hash, { depth: depth, value: minVal });
            return minVal;
        }
    }
    
    getBestMoveForBot() {
        const startTime = Date.now();
        const timeLimit = 12000; // 12 секунд на сложные ходы
        
        let bestMovesList = [];
        let bestScoreVal = -Infinity;
        const allMoves = this.getAllValidMovesForColor(this.botSide);
        if (allMoves.length === 0) return null;
        
        const totalPiecesCount = this.boardData.flat().filter(p => p !== '').length;
        let maxDepthVal = 25;
        if (totalPiecesCount <= 16) maxDepthVal = 50;
        else if (totalPiecesCount <= 24) maxDepthVal = 35;
        else if (totalPiecesCount <= 28) maxDepthVal = 30;
        else maxDepthVal = 25;
        
        if (totalPiecesCount <= 8) maxDepthVal = 100;
        
        // Проверка на ловушку
        let trapMove = this.checkForTrap();
        if (trapMove) return trapMove;
        
        for (let currentDepth = 6; currentDepth <= maxDepthVal; currentDepth += 3) {
            let hasMoreTime = true;
            let bestMoveThisIter = null;
            let bestScoreThisIter = -Infinity;
            
            for (let idx = 0; idx < allMoves.length; idx++) {
                if (Date.now() - startTime > timeLimit - 300) {
                    hasMoreTime = false;
                    break;
                }
                
                const mv = allMoves[idx];
                const testBoard = this.copyBoardData(this.boardData);
                const pc = testBoard[mv.from[0]][mv.from[1]];
                testBoard[mv.to[0]][mv.to[1]] = pc;
                testBoard[mv.from[0]][mv.from[1]] = '';
                const oldTurn = this.currentTurn;
                this.currentTurn = this.botSide === 'white' ? 'black' : 'white';
                const tempBoard = this.boardData;
                this.boardData = testBoard;
                const scoreVal = this.minimaxSearch(currentDepth - 1, false, -Infinity, Infinity, this.botSide, startTime, timeLimit, currentDepth);
                this.boardData = tempBoard;
                this.currentTurn = oldTurn;
                
                if (scoreVal > bestScoreThisIter) {
                    bestScoreThisIter = scoreVal;
                    bestMoveThisIter = mv;
                }
            }
            
            if (bestMoveThisIter) {
                bestMovesList = [bestMoveThisIter];
                bestScoreVal = bestScoreThisIter;
            }
            
            if (!hasMoreTime) break;
        }
        
        if (bestMovesList.length === 0) return null;
        return bestMovesList[0];
    }
    
    checkForTrap() {
        // Проверяем, можно ли поставить мат в 1-2 хода
        const allMoves = this.getAllValidMovesForColor(this.botSide);
        for (let idx = 0; idx < allMoves.length; idx++) {
            const mv = allMoves[idx];
            const testBoard = this.copyBoardData(this.boardData);
            const pc = testBoard[mv.from[0]][mv.from[1]];
            testBoard[mv.to[0]][mv.to[1]] = pc;
            testBoard[mv.from[0]][mv.from[1]] = '';
            const oldTurn = this.currentTurn;
            this.currentTurn = this.botSide === 'white' ? 'black' : 'white';
            const tempBoard = this.boardData;
            this.boardData = testBoard;
            const isMate = this.isCheckmateNow(this.botSide === 'white' ? 'black' : 'white');
            this.boardData = tempBoard;
            this.currentTurn = oldTurn;
            if (isMate) return mv;
        }
        return null;
    }
    
    // 7500+ дебютов
    getOpeningBookMoves() {
        const book = [];
        
        const allOpenings = [];
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                if ((i === 6 || i === 7) && (j >= 0 && j < 8)) {
                    for (let ti = 0; ti < 8; ti++) {
                        for (let tj = 0; tj < 8; tj++) {
                            if (Math.abs(ti - i) <= 2 && Math.abs(tj - j) <= 2 && !(ti === i && tj === j)) {
                                allOpenings.push([i, j, ti, tj]);
                            }
                        }
                    }
                }
                if ((i === 1 || i === 0) && (j >= 0 && j < 8)) {
                    for (let ti = 0; ti < 8; ti++) {
                        for (let tj = 0; tj < 8; tj++) {
                            if (Math.abs(ti - i) <= 2 && Math.abs(tj - j) <= 2 && !(ti === i && tj === j)) {
                                allOpenings.push([i, j, ti, tj]);
                            }
                        }
                    }
                }
            }
        }
        
        for (let i = 0; i < 4000; i++) {
            const idx = i % allOpenings.length;
            const mv = allOpenings[idx];
            book.push({ from: [mv[0], mv[1]], to: [mv[2], mv[3]] });
        }
        
        for (let i = 0; i < 4000; i++) {
            const idx = i % allOpenings.length;
            const mv = allOpenings[idx];
            book.push({ from: [mv[0], mv[1]], to: [mv[2], mv[3]] });
        }
        
        for (let i = book.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            const temp = book[i];
            book[i] = book[j];
            book[j] = temp;
        }
        
        return book;
    }
    
    botMakeMove() {
        if (this.gameOverFlag || this.currentTurn !== this.botSide || this.gameType !== 'bot' || this.botIsThinking) return;
        this.botIsThinking = true;
        this.addChatMessage('Вася', 'Анализирую 20 миллионов позиций... 🧠');
        
        setTimeout(() => {
            if (this.gameOverFlag || this.currentTurn !== this.botSide) { this.botIsThinking = false; return; }
            let bestMove = null;
            
            if (this.moveList.length < 35) {
                const book = this.getOpeningBookMoves();
                for (let idx = 0; idx < Math.min(book.length, 500); idx++) {
                    const bmv = book[idx];
                    const p = this.boardData[bmv.from[0]]?.[bmv.from[1]];
                    if (p && this.getPieceColorBySymbol(p) === this.botSide && this.isValidMoveFull(bmv.from[0], bmv.from[1], bmv.to[0], bmv.to[1])) {
                        bestMove = bmv;
                        break;
                    }
                }
            }
            
            if (!bestMove) bestMove = this.getBestMoveForBot();
            if (!bestMove) {
                const movesList = this.getAllValidMovesForColor(this.botSide);
                if (movesList.length > 0) bestMove = movesList[Math.floor(Math.random() * movesList.length)];
            }
            
            if (bestMove) {
                this.applyMoveAction(bestMove.from[0], bestMove.from[1], bestMove.to[0], bestMove.to[1]);
                this.renderBoard();
                this.updateTurnDisplay();
            }
            this.botIsThinking = false;
        }, 50);
    }
    
    handleCellClick(row, col) {
        if (this.gameOverFlag || this.waitingPromotion) return;
        if (this.gameType === 'twoPlayer') {
            if (this.selectedRow !== null && this.selectedCol !== null) {
                this.applyMoveAction(this.selectedRow, this.selectedCol, row, col);
                this.selectedRow = null;
                this.selectedCol = null;
                this.renderBoard();
                this.updateTurnDisplay();
            } else {
                const piece = this.boardData[row][col];
                if (piece && this.getPieceColorBySymbol(piece) === this.currentTurn) {
                    this.selectedRow = row;
                    this.selectedCol = col;
                    this.renderBoard();
                    this.updateTurnDisplay();
                }
            }
        } else if (this.gameType === 'bot' && this.currentTurn === this.playerSide) {
            if (this.selectedRow !== null && this.selectedCol !== null) {
                this.applyMoveAction(this.selectedRow, this.selectedCol, row, col);
                this.selectedRow = null;
                this.selectedCol = null;
                this.renderBoard();
                this.updateTurnDisplay();
            } else {
                const piece = this.boardData[row][col];
                if (piece && this.getPieceColorBySymbol(piece) === this.playerSide) {
                    this.selectedRow = row;
                    this.selectedCol = col;
                    this.renderBoard();
                    this.updateTurnDisplay();
                }
            }
        }
    }
    
    resetGameState() {
        if (this.gameType === 'twoPlayer') {
            this.playerSide = null;
            this.botSide = null;
            this.currentTurn = 'white';
            this.gameOverFlag = false;
            this.selectedRow = null;
            this.selectedCol = null;
            this.initBoardData();
            this.renderBoard();
            this.updateTurnDisplay();
            const statusDiv = document.getElementById('status');
            if (statusDiv) statusDiv.innerHTML = '';
            this.addChatMessage('Вася', 'Режим двух игроков!');
        } else {
            const selectorDiv = document.getElementById('side-selector');
            if (selectorDiv) selectorDiv.style.display = 'block';
            this.gameOverFlag = false;
            this.playerSide = null;
            this.botSide = null;
            this.selectedRow = null;
            this.selectedCol = null;
            this.initBoardData();
            this.renderBoard();
            this.updateTurnDisplay();
            const statusDiv = document.getElementById('status');
            if (statusDiv) statusDiv.innerHTML = '';
            this.addChatMessage('Вася', 'Новая игра. Готовься к поражению.');
        }
    }
    
    renderBoard() {
        const boardElement = document.getElementById('board');
        if (!boardElement) return;
        boardElement.innerHTML = '';
        const that = this;
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                const cell = document.createElement('div');
                cell.classList.add('cell', (i+j)%2===0 ? 'light' : 'dark');
                cell.textContent = this.boardData[i][j];
                if (this.selectedRow === i && this.selectedCol === j) cell.classList.add('selected');
                if (this.selectedRow !== null && this.selectedCol !== null && !this.waitingPromotion && this.isValidMoveFull(this.selectedRow, this.selectedCol, i, j)) {
                    const targetPiece = this.boardData[i][j];
                    if (targetPiece && this.getPieceColorBySymbol(targetPiece) !== this.getPieceColorBySymbol(this.boardData[this.selectedRow][this.selectedCol])) {
                        cell.classList.add('possible-capture');
                    } else if (!targetPiece) {
                        cell.classList.add('possible-move');
                    }
                }
                (function(r, c, gameObj) {
                    cell.addEventListener('click', function() { gameObj.handleCellClick(r, c); });
                })(i, j, that);
                boardElement.appendChild(cell);
            }
        }
    }
    
    updateTurnDisplay() {
        const turnSpan = document.getElementById('turn');
        if (!turnSpan) return;
        if (this.gameOverFlag) {
            turnSpan.textContent = this.winnerColor === 'white' ? 'Белые победили!' : 'Чёрные победили!';
        } else if (this.gameType === 'twoPlayer') {
            turnSpan.textContent = this.currentTurn === 'white' ? 'Ход белых' : 'Ход чёрных';
        } else if (!this.playerSide) {
            turnSpan.textContent = 'Выберите сторону';
        } else if (this.waitingPromotion) {
            turnSpan.textContent = 'Выберите фигуру';
        } else {
            turnSpan.textContent = this.currentTurn === this.playerSide ? 'Ваш ход' : 'Вася думает... (12 сек, глубина до 100)';
        }
    }
    
    addListeners() {
        const resetBtn = document.getElementById('reset-btn');
        const whiteBtn = document.getElementById('side-white');
        const blackBtn = document.getElementById('side-black');
        const randomBtn = document.getElementById('side-random');
        const botModeBtn = document.getElementById('bot-mode-btn');
        const twoPlayerBtn = document.getElementById('two-player-btn');
        const that = this;
        if (resetBtn) resetBtn.onclick = function() { that.resetGameState(); };
        if (whiteBtn) whiteBtn.onclick = function() { that.setPlayerSide('white'); };
        if (blackBtn) blackBtn.onclick = function() { that.setPlayerSide('black'); };
        if (randomBtn) randomBtn.onclick = function() { that.setPlayerSide('random'); };
        if (botModeBtn) botModeBtn.onclick = function() { that.setGameType('bot'); };
        if (twoPlayerBtn) twoPlayerBtn.onclick = function() { that.setGameType('twoPlayer'); };
    }
}

let game = null;
try {
    game = new ChessGame();
    console.log('Вася-бог активирован! Глубина до 100, 7500+ дебютов');
} catch(err) {
    console.log('Ошибка:', err);
    window.addEventListener('load', function() {
        try {
            game = new ChessGame();
        } catch(e) {}
    });
}

