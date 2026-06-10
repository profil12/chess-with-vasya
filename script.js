// ========== ГЛОБАЛЬНЫЙ ПЕРЕХВАТЧИК ОШИБОК ==========
window.addEventListener('error', function(e) {
    if (e.message && e.message.indexOf('arguments') !== -1) {
        console.log('Перехвачена ошибка arguments, игнорируем');
        e.preventDefault();
        return true;
    }
});

// ========== ШАХМАТЫ С ВАСЕЙ - ЗАЩИЩЁННАЯ ВЕРСИЯ ==========
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
        
        // Безопасный запуск
        try {
            this.initBoardData();
            this.renderBoard();
            this.addListeners();
            this.updateTurnDisplay();
            this.initChatSystem();
            this.addDrawButton();
        } catch(err) {
            console.log('Ошибка в конструкторе:', err);
        }
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
        } catch(e) { console.log('addDrawButton error:', e); }
    }
    
    offerDrawGame() {
        if (this.gameOverFlag || this.gameType !== 'bot') return;
        this.addChatMessage('Вася', 'Предлагаю ничью 🤝');
        setTimeout(() => {
            this.gameOverFlag = true;
            const statusDiv = document.getElementById('status');
            if (statusDiv) statusDiv.innerHTML = '🤝 НИЧЬЯ! 🤝';
            this.addChatMessage('Вася', 'Согласен! 🤝');
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
            'В шахматах, как в жизни: спешишь — проигрываешь. 🧘',
            'Не тот силён, кто ставит мат, а тот, кто не сдаётся после шаха. 🌿',
            'Каждая пешка мечтает стать ферзём. Но не каждая доходит. ✨',
            'Шахматы — это не война, это диалог умов. Но я люблю войну. 😈'
        ];
        
        if (lowerMsg.includes('дурак') || lowerMsg.includes('тупой') || lowerMsg.includes('идиот')) {
            const insults = ['Сам такой!', 'Оскорбления — слабых удел. Докажи ходом!', 'Ха-ха, а мат тебе поставлю всё равно.'];
            return insults[Math.floor(Math.random() * insults.length)];
        }
        if (lowerMsg.includes('привет')) return 'Привет! Сегодня я буду беспощаден.';
        if (lowerMsg.includes('как дел')) return 'Отлично! Просчитал твой проигрыш.';
        if (lowerMsg.includes('пока')) return 'Пока! Беги, пока я не включил глубину 15.';
        if (lowerMsg.includes('шах')) return 'Шах — это только начало. Дальше будет мат.';
        if (Math.random() < 0.3) return wisePhrases[Math.floor(Math.random() * wisePhrases.length)];
        return 'Интересный ход. Но я вижу дальше. ♟️';
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
            this.addChatMessage('Вася', 'Режим двух игроков! Белые ходят первыми.');
            const selectorDiv = document.getElementById('side-selector');
            if (selectorDiv) selectorDiv.style.display = 'none';
        } else {
            this.addChatMessage('Вася', 'Режим игры с ботом. Выбери сторону.');
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
        else this.addChatMessage('Вася', 'Твой ход. Не торопись.');
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
        const values = { '♙':1, '♟':1, '♘':3.2, '♞':3.2, '♗':3.3, '♝':3.3, '♖':5, '♜':5, '♕':9, '♛':9, '♔':1000, '♚':1000 };
        return values[piece] || 0;
    }
    
    evaluateBoardPosition(board, color) {
        let totalScore = 0;
        const multiplier = color === 'white' ? 1 : -1;
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                const piece = board[i][j];
                if (!piece) continue;
                const pieceColor = this.getPieceColorBySymbol(piece);
                let val = this.getPieceValueBySymbol(piece);
                const centerDist = Math.abs(i - 3.5) + Math.abs(j - 3.5);
                val += (7 - centerDist) * 0.1;
                if (piece === '♙' || piece === '♟') {
                    let doubled = false;
                    for (let k = 0; k < 8; k++) if (k !== i && board[k][j] === piece) doubled = true;
                    if (doubled) val -= 0.3;
                }
                if (pieceColor === 'white') totalScore += val;
                else totalScore -= val;
            }
        }
        return multiplier * totalScore;
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
            this.addChatMessage('Вася', this.winnerColor === this.botSide ? 'Я победил! Ха-ха!' : 'Ты победил! Поздравляю.');
        } else if (this.isCheckNow(this.currentTurn)) {
            const statusDiv = document.getElementById('status');
            if (statusDiv) statusDiv.innerHTML = `${this.currentTurn === 'white' ? 'Белым' : 'Чёрным'} ШАХ! 🎯`;
        } else if (this.isStalemateNow(this.currentTurn)) {
            this.gameOverFlag = true;
            const statusDiv = document.getElementById('status');
            if (statusDiv) statusDiv.innerHTML = 'Пат! Ничья!';
            this.addChatMessage('Вася', 'Пат. Ничья!');
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
        this.boardData[targetRow][targetCol] = piece;
        this.boardData[row][col] = '';
        
        if (isCastling) {
            const rookFrom = targetCol > col ? 7 : 0;
            const rookTo = targetCol > col ? targetCol - 1 : targetCol + 1;
            const rook = this.boardData[targetRow][rookFrom];
            this.boardData[targetRow][rookTo] = rook;
            this.boardData[targetRow][rookFrom] = '';
        }
        
        this.moveList.push({ from: [row, col], to: [targetRow, targetCol], piece });
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
    
    orderMovesByCapture(moves, board) {
        const that = this;
        return moves.sort(function(a, b) {
            const aPiece = board[a.from[0]][a.from[1]];
            const bPiece = board[b.from[0]][b.from[1]];
            const aTarget = board[a.to[0]][a.to[1]];
            const bTarget = board[b.to[0]][b.to[1]];
            const aCapture = aTarget ? that.getPieceValueBySymbol(aTarget) - that.getPieceValueBySymbol(aPiece) : 0;
            const bCapture = bTarget ? that.getPieceValueBySymbol(bTarget) - that.getPieceValueBySymbol(bPiece) : 0;
            return bCapture - aCapture;
        });
    }
    
    minimaxSearch(depth, isMax, alpha, beta, botColor, startTime, timeLimit, maxD) {
        if (Date.now() - startTime > timeLimit) {
            return this.evaluateBoardPosition(this.boardData, botColor);
        }
        const hash = this.hashPosition();
        if (this.transTable.has(hash)) {
            const entry = this.transTable.get(hash);
            if (entry.depth >= depth) return entry.value;
        }
        if (depth === 0) {
            return this.evaluateBoardPosition(this.boardData, botColor);
        }
        const movesList = this.getAllValidMovesForColor(isMax ? botColor : (botColor === 'white' ? 'black' : 'white'));
        if (movesList.length === 0) {
            if (this.isCheckNow(isMax ? botColor : (botColor === 'white' ? 'black' : 'white'))) {
                return isMax ? -10000 : 10000;
            }
            return 0;
        }
        const ordered = this.orderMovesByCapture(movesList, this.boardData);
        if (isMax) {
            let maxVal = -Infinity;
            for (const mv of ordered) {
                const testBoard = this.copyBoardData(this.boardData);
                const pc = testBoard[mv.from[0]][mv.from[1]];
                testBoard[mv.to[0]][mv.to[1]] = pc;
                testBoard[mv.from[0]][mv.from[1]] = '';
                const oldTurn = this.currentTurn;
                this.currentTurn = botColor === 'white' ? 'black' : 'white';
                const tempBoard = this.boardData;
                this.boardData = testBoard;
                const evalRes = this.minimaxSearch(depth - 1, false, alpha, beta, botColor, startTime, timeLimit, maxD);
                this.boardData = tempBoard;
                this.currentTurn = oldTurn;
                maxVal = Math.max(maxVal, evalRes);
                alpha = Math.max(alpha, evalRes);
                if (beta <= alpha) break;
            }
            this.transTable.set(hash, { depth: depth, value: maxVal });
            return maxVal;
        } else {
            let minVal = Infinity;
            for (const mv of ordered) {
                const testBoard = this.copyBoardData(this.boardData);
                const pc = testBoard[mv.from[0]][mv.from[1]];
                testBoard[mv.to[0]][mv.to[1]] = pc;
                testBoard[mv.from[0]][mv.from[1]] = '';
                const oldTurn = this.currentTurn;
                this.currentTurn = botColor === 'white' ? 'white' : 'black';
                const tempBoard = this.boardData;
                this.boardData = testBoard;
                const evalRes = this.minimaxSearch(depth - 1, true, alpha, beta, botColor, startTime, timeLimit, maxD);
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
        const timeLimit = 7000;
        let bestMovesList = [];
        let bestScoreVal = -Infinity;
        const allMoves = this.getAllValidMovesForColor(this.botSide);
        if (allMoves.length === 0) return null;
        const totalPiecesCount = this.boardData.flat().filter(p => p !== '').length;
        let maxDepthVal = 9;
        if (totalPiecesCount <= 10) maxDepthVal = 15;
        else if (totalPiecesCount <= 20) maxDepthVal = 12;
        for (const mv of allMoves) {
            const testBoard = this.copyBoardData(this.boardData);
            const pc = testBoard[mv.from[0]][mv.from[1]];
            testBoard[mv.to[0]][mv.to[1]] = pc;
            testBoard[mv.from[0]][mv.from[1]] = '';
            const oldTurn = this.currentTurn;
            this.currentTurn = this.botSide === 'white' ? 'black' : 'white';
            const tempBoard = this.boardData;
            this.boardData = testBoard;
            const scoreVal = this.minimaxSearch(maxDepthVal - 1, false, -Infinity, Infinity, this.botSide, startTime, timeLimit, maxDepthVal);
            this.boardData = tempBoard;
            this.currentTurn = oldTurn;
            if (scoreVal > bestScoreVal) {
                bestScoreVal = scoreVal;
                bestMovesList = [mv];
            } else if (Math.abs(scoreVal - bestScoreVal) < 0.5) {
                bestMovesList.push(mv);
            }
        }
        if (bestMovesList.length === 0) return null;
        return bestMovesList[Math.floor(Math.random() * bestMovesList.length)];
    }
    
    getOpeningBookMoves() {
        const book = [];
        const whiteBook = [[6,4,4,4], [6,3,4,3], [7,1,5,2], [7,6,5,5], [7,5,5,5], [7,2,5,3], [7,4,5,4]];
        const blackBook = [[1,4,3,4], [1,3,3,3], [0,1,2,2], [0,6,2,5], [0,5,2,5], [0,2,2,3], [0,4,2,4]];
        for (let i = 0; i < 300; i++) {
            const idx = i % whiteBook.length;
            const mv = whiteBook[idx];
            book.push({ from: [mv[0], mv[1]], to: [mv[2], mv[3]] });
        }
        for (let i = 0; i < 300; i++) {
            const idx = i % blackBook.length;
            const mv = blackBook[idx];
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
        this.addChatMessage('Вася', 'Думаю... 🧠');
        setTimeout(() => {
            if (this.gameOverFlag || this.currentTurn !== this.botSide) { this.botIsThinking = false; return; }
            let bestMove = null;
            if (this.moveList.length < 20) {
                const book = this.getOpeningBookMoves();
                for (let idx = 0; idx < book.length; idx++) {
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
            this.addChatMessage('Вася', 'Режим двух игроков! Белые ходят первыми.');
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
            this.addChatMessage('Вася', 'Новая игра! Выбери сторону.');
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
            turnSpan.textContent = this.currentTurn === this.playerSide ? 'Ваш ход' : 'Вася думает... (до 7 сек)';
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

// Безопасный запуск
let game = null;
try {
    game = new ChessGame();
    console.log('Игра успешно запущена!');
} catch(err) {
    console.log('Ошибка при запуске:', err);
    // Запасной вариант
    window.addEventListener('load', function() {
        try {
            game = new ChessGame();
        } catch(e) {
            console.log('Повторная попытка не удалась');
        }
    });
}
