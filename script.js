class ChessGame {
    constructor() {
        this.board = null;
        this.currentTurn = 'white';
        this.selectedRow = null;
        this.selectedCol = null;
        this.gameOver = false;
        this.winner = null;
        this.playerColor = null;
        this.botColor = null;
        this.waitingForPromotion = false;
        this.promotionRow = null;
        this.promotionCol = null;
        this.promotionColor = null;
        this.gameMode = 'bot';
        this.botThinking = false;
        this.moveHistory = [];
        
        this.initBoard();
        this.render();
        this.addEventListeners();
        this.updateUI();
        this.initChat();
        this.addDrawButton();
    }
    
    addDrawButton() {
        setTimeout(() => {
            const container = document.querySelector('.board-container');
            if (container && !document.getElementById('draw-btn')) {
                const btn = document.createElement('button');
                btn.id = 'draw-btn';
                btn.innerText = '🤝 НИЧЬЯ';
                btn.style.cssText = 'background:#ff5500; border:none; padding:8px 20px; border-radius:40px; font-size:0.9rem; font-weight:bold; color:white; margin-top:10px; margin-right:10px; cursor:pointer;';
                btn.onclick = () => this.offerDraw();
                container.appendChild(btn);
            }
        }, 100);
    }
    
    offerDraw() {
        if (this.gameOver || this.gameMode !== 'bot') return;
        this.addMessage('Вася', 'Предлагаю ничью 🤝');
        setTimeout(() => {
            this.gameOver = true;
            document.getElementById('status').innerHTML = '🤝 НИЧЬЯ! 🤝';
            this.addMessage('Вася', 'Согласен! 🤝');
        }, 500);
    }
    
    initChat() {
        const input = document.getElementById('chat-input');
        const sendBtn = document.getElementById('chat-send');
        if (sendBtn) sendBtn.onclick = () => this.sendMessage();
        if (input) input.addEventListener('keypress', (e) => { if (e.key === 'Enter') this.sendMessage(); });
    }
    
    sendMessage() {
        const input = document.getElementById('chat-input');
        const text = input.value.trim();
        if (!text) return;
        this.addMessage('Вы', text);
        input.value = '';
        setTimeout(() => {
            const reply = this.getBotReply(text);
            this.addMessage('Вася (Гроссмейстер)', reply);
        }, 200);
    }
    
    getBotReply(msg) {
        const lower = msg.toLowerCase();
        const replies = {
            'привет': ['Привет! Я гроссмейстер Вася!', 'Здравствуй!', 'О, привет!'],
            'как дел': ['Отлично!', 'Хорошо!', 'Нормально!'],
            'пока': ['Пока!', 'До встречи!', 'Удачи!'],
            'молодец': ['Спасибо!', 'Приятно!', 'Спасибо!'],
            'дурак': ['Сам такой!', 'Эй!', 'Обижаешь...'],
            'шах': ['Шах!', 'Осторожно!', 'Король под ударом!'],
            'мат': ['Мат!', 'Красиво!', 'Сдавайся!']
        };
        for (const [key, arr] of Object.entries(replies)) {
            if (lower.includes(key)) return arr[Math.floor(Math.random() * arr.length)];
        }
        const defaults = ['Интересный ход! ♟️', 'Думаю... 🤔', 'Неплохо!', 'Хороший ход!'];
        return defaults[Math.floor(Math.random() * defaults.length)];
    }
    
    addMessage(sender, text) {
        const container = document.getElementById('chat-messages');
        if (!container) return;
        const div = document.createElement('div');
        div.classList.add('message', sender === 'Вы' ? 'user' : 'bot');
        div.innerText = `${sender}: ${text}`;
        container.appendChild(div);
        container.scrollTop = container.scrollHeight;
    }
    
    setGameMode(mode) {
        this.gameMode = mode;
        this.resetGame();
        if (mode === 'twoPlayer') {
            this.addMessage('Вася', 'Режим двух игроков! Белые ходят первыми.');
            document.getElementById('side-selector').style.display = 'none';
        } else {
            this.addMessage('Вася', 'Режим игры с ботом. Выбери сторону!');
            document.getElementById('side-selector').style.display = 'block';
        }
    }
    
    setPlayerSide(side) {
        if (this.gameMode !== 'bot') return;
        if (side === 'white') { this.playerColor = 'white'; this.botColor = 'black'; }
        else if (side === 'black') { this.playerColor = 'black'; this.botColor = 'white'; }
        else { this.playerColor = Math.random() < 0.5 ? 'white' : 'black'; this.botColor = this.playerColor === 'white' ? 'black' : 'white'; }
        this.currentTurn = 'white';
        this.gameOver = false;
        this.selectedRow = null;
        this.selectedCol = null;
        this.initBoard();
        this.render();
        this.updateUI();
        document.getElementById('side-selector').style.display = 'none';
        if (this.playerColor === 'black') setTimeout(() => this.botMove(), 100);
        else this.addMessage('Вася', 'Твой ход! ♟️');
    }
    
    initBoard() {
        this.board = [
            ['♜', '♞', '♝', '♛', '♚', '♝', '♞', '♜'],
            ['♟', '♟', '♟', '♟', '♟', '♟', '♟', '♟'],
            ['', '', '', '', '', '', '', ''],
            ['', '', '', '', '', '', '', ''],
            ['', '', '', '', '', '', '', ''],
            ['', '', '', '', '', '', '', ''],
            ['♙', '♙', '♙', '♙', '♙', '♙', '♙', '♙'],
            ['♖', '♘', '♗', '♕', '♔', '♗', '♘', '♖']
        ];
        this.moveHistory = [];
    }
    
    getPieceColor(piece) {
        if (!piece) return null;
        const white = ['♙', '♖', '♘', '♗', '♕', '♔'];
        const black = ['♟', '♜', '♞', '♝', '♛', '♚'];
        if (white.includes(piece)) return 'white';
        if (black.includes(piece)) return 'black';
        return null;
    }
    
    getPieceValue(piece) {
        if (!piece) return 0;
        const values = { '♙':1, '♟':1, '♘':3, '♞':3, '♗':3, '♝':3, '♖':5, '♜':5, '♕':9, '♛':9 };
        return values[piece] || 0;
    }
    
    isOnlyKingsLeft() {
        let whiteKing = false, blackKing = false;
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                const p = this.board[i][j];
                if (p === '♔') whiteKing = true;
                else if (p === '♚') blackKing = true;
                else if (p !== '') return false;
            }
        }
        return whiteKing && blackKing;
    }
    
    isValidMoveBasic(row, col, tr, tc, board) {
        const piece = board[row][col];
        if (!piece) return false;
        const pieceColor = this.getPieceColor(piece);
        if (pieceColor !== this.currentTurn) return false;
        const targetPiece = board[tr][tc];
        if (targetPiece && this.getPieceColor(targetPiece) === pieceColor) return false;
        const dr = tr - row, dc = tc - col, adr = Math.abs(dr), adc = Math.abs(dc);
        
        if (piece === '♙') {
            if (dc === 0 && dr === -1 && !targetPiece) return true;
            if (dc === 0 && dr === -2 && row === 6 && !targetPiece && !board[5][col]) return true;
            if (adc === 1 && dr === -1 && targetPiece && this.getPieceColor(targetPiece) === 'black') return true;
            return false;
        }
        if (piece === '♟') {
            if (dc === 0 && dr === 1 && !targetPiece) return true;
            if (dc === 0 && dr === 2 && row === 1 && !targetPiece && !board[2][col]) return true;
            if (adc === 1 && dr === 1 && targetPiece && this.getPieceColor(targetPiece) === 'white') return true;
            return false;
        }
        if (piece === '♖' || piece === '♜') {
            if (row !== tr && col !== tc) return false;
            if (row === tr) { const step = tc > col ? 1 : -1; for (let c = col+step; c !== tc; c+=step) if (board[row][c]) return false; }
            else { const step = tr > row ? 1 : -1; for (let r = row+step; r !== tr; r+=step) if (board[r][col]) return false; }
            return true;
        }
        if (piece === '♘' || piece === '♞') return (adr === 2 && adc === 1) || (adr === 1 && adc === 2);
        if (piece === '♗' || piece === '♝') {
            if (adr !== adc) return false;
            const rStep = dr > 0 ? 1 : -1, cStep = dc > 0 ? 1 : -1;
            let r = row+rStep, c = col+cStep;
            while (r !== tr && c !== tc) { if (board[r][c]) return false; r += rStep; c += cStep; }
            return true;
        }
        if (piece === '♕' || piece === '♛') {
            if (row === tr || col === tc || adr === adc) {
                if (row === tr) { const step = tc > col ? 1 : -1; for (let c = col+step; c !== tc; c+=step) if (board[row][c]) return false; }
                else if (col === tc) { const step = tr > row ? 1 : -1; for (let r = row+step; r !== tr; r+=step) if (board[r][col]) return false; }
                else { const rStep = dr > 0 ? 1 : -1, cStep = dc > 0 ? 1 : -1; let r = row+rStep, c = col+cStep; while (r !== tr && c !== tc) { if (board[r][c]) return false; r += rStep; c += cStep; } }
                return true;
            }
            return false;
        }
        if (piece === '♔' || piece === '♚') {
            if (adr <= 1 && adc <= 1) return true;
            if (dr === 0 && adc === 2 && row === tr) {
                const rookCol = dc > 0 ? 7 : 0;
                const rook = board[row][rookCol];
                if (rook !== (piece === '♔' ? '♖' : '♜')) return false;
                const step = dc > 0 ? 1 : -1;
                for (let c = col+step; c !== rookCol; c+=step) if (board[row][c]) return false;
                return !this.isKingInCheck(this.currentTurn, board);
            }
            return false;
        }
        return false;
    }
    
    isKingInCheck(color, board) {
        let kingRow = -1, kingCol = -1;
        const kingSymbol = color === 'white' ? '♔' : '♚';
        for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) if (board[i][j] === kingSymbol) { kingRow = i; kingCol = j; break; }
        if (kingRow === -1) return false;
        const opponentColor = color === 'white' ? 'black' : 'white';
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                const piece = board[i][j];
                if (piece && this.getPieceColor(piece) === opponentColor) {
                    const oldTurn = this.currentTurn;
                    this.currentTurn = opponentColor;
                    const isValid = this.isValidMoveBasic(i, j, kingRow, kingCol, board);
                    this.currentTurn = oldTurn;
                    if (isValid) return true;
                }
            }
        }
        return false;
    }
    
    isValidMove(row, col, tr, tc) {
        const piece = this.board[row][col];
        if (!piece) return false;
        if (this.getPieceColor(piece) !== this.currentTurn) return false;
        const targetPiece = this.board[tr][tc];
        if (targetPiece && this.getPieceColor(targetPiece) === this.getPieceColor(piece)) return false;
        const isValidBasic = this.isValidMoveBasic(row, col, tr, tc, this.board);
        if (!isValidBasic) return false;
        const testBoard = this.copyBoard(this.board);
        testBoard[tr][tc] = testBoard[row][col];
        testBoard[row][col] = '';
        return !this.isKingInCheck(this.currentTurn, testBoard);
    }
    
    copyBoard(board) { return board.map(row => [...row]); }
    
    getAllValidMoves(color) {
        const moves = [];
        for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) {
            const piece = this.board[i][j];
            if (piece && this.getPieceColor(piece) === color) {
                for (let ti = 0; ti < 8; ti++) for (let tj = 0; tj < 8; tj++) {
                    if (this.isValidMove(i, j, ti, tj)) moves.push({ from: [i, j], to: [ti, tj] });
                }
            }
        }
        return moves;
    }
    
    isCheck(color) { return this.isKingInCheck(color, this.board); }
    
    isCheckmate(color) {
        if (!this.isCheck(color)) return false;
        return this.getAllValidMoves(color).length === 0;
    }
    
    isStalemate(color) {
        if (this.isCheck(color)) return false;
        if (this.isOnlyKingsLeft()) return true;
        return this.getAllValidMoves(color).length === 0;
    }
    
    checkGameEnd() {
        if (this.isOnlyKingsLeft()) {
            this.gameOver = true;
            document.getElementById('status').innerHTML = '🤝 Только короли! Ничья! 🤝';
            this.addMessage('Вася', 'Ничья!');
            return;
        }
        if (this.isCheckmate(this.currentTurn)) {
            this.gameOver = true;
            this.winner = this.currentTurn === 'white' ? 'black' : 'white';
            document.getElementById('status').innerHTML = `МАТ! Победили ${this.winner === 'white' ? 'Белые' : 'Чёрные'}! 🏆`;
            this.addMessage('Вася', this.winner === this.botColor ? 'Я победил! ♟️' : 'Ты победил! Поздравляю!');
        } else if (this.isCheck(this.currentTurn)) {
            document.getElementById('status').innerHTML = `${this.currentTurn === 'white' ? 'Белым' : 'Чёрным'} ШАХ! 🎯`;
        } else if (this.isStalemate(this.currentTurn)) {
            this.gameOver = true;
            document.getElementById('status').innerHTML = 'Пат! Ничья!';
            this.addMessage('Вася', 'Пат. Ничья!');
        } else {
            document.getElementById('status').innerHTML = '';
        }
    }
    
    showPromotionModal() {
        const modal = document.createElement('div');
        modal.id = 'promotion-modal';
        modal.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.85); display:flex; justify-content:center; align-items:center; z-index:1000;';
        modal.innerHTML = `<div style="background:linear-gradient(135deg,#1a2a3a,#0a1a2a); padding:30px; border-radius:40px; border:2px solid #ffaa00; text-align:center;"><h3 style="color:#ffd700; margin-bottom:20px;">ВЫБЕРИТЕ ФИГУРУ</h3><div style="display:flex; gap:20px; justify-content:center;"><button class="promo-btn" data-piece="♕" style="font-size:2.5rem; background:#333; border:none; cursor:pointer; padding:10px 20px; border-radius:20px;">♕</button><button class="promo-btn" data-piece="♖" style="font-size:2.5rem; background:#333; border:none; cursor:pointer; padding:10px 20px; border-radius:20px;">♖</button><button class="promo-btn" data-piece="♗" style="font-size:2.5rem; background:#333; border:none; cursor:pointer; padding:10px 20px; border-radius:20px;">♗</button><button class="promo-btn" data-piece="♘" style="font-size:2.5rem; background:#333; border:none; cursor:pointer; padding:10px 20px; border-radius:20px;">♘</button></div></div>`;
        document.body.appendChild(modal);
        document.querySelectorAll('.promo-btn').forEach(btn => {
            btn.onclick = (e) => {
                this.promotePawn(this.promotionRow, this.promotionCol, e.target.dataset.piece);
                modal.remove();
            };
        });
    }
    
    promotePawn(row, col, choice) {
        const pawnPiece = this.board[row][col];
        const isWhitePawn = pawnPiece === '♙';
        let newPiece;
        if (isWhitePawn) {
            if (choice === '♕') newPiece = '♕';
            else if (choice === '♖') newPiece = '♖';
            else if (choice === '♗') newPiece = '♗';
            else newPiece = '♘';
        } else {
            if (choice === '♕') newPiece = '♛';
            else if (choice === '♖') newPiece = '♜';
            else if (choice === '♗') newPiece = '♝';
            else newPiece = '♞';
        }
        this.board[row][col] = newPiece;
        this.waitingForPromotion = false;
        this.promotionRow = null;
        this.promotionCol = null;
        this.promotionColor = null;
        this.currentTurn = this.currentTurn === 'white' ? 'black' : 'white';
        this.checkGameEnd();
        this.render();
        this.updateUI();
        if (!this.gameOver && this.currentTurn === this.botColor && this.gameMode === 'bot') setTimeout(() => this.botMove(), 50);
    }
    
    applyMove(row, col, tr, tc) {
        const piece = this.board[row][col];
        const target = this.board[tr][tc];
        if (!this.isValidMove(row, col, tr, tc)) return false;
        const isCastling = (piece === '♔' || piece === '♚') && Math.abs(tc - col) === 2;
        this.board[tr][tc] = piece;
        this.board[row][col] = '';
        if (isCastling) {
            const rookFrom = tc > col ? 7 : 0;
            const rookTo = tc > col ? tc - 1 : tc + 1;
            const rook = this.board[tr][rookFrom];
            this.board[tr][rookTo] = rook;
            this.board[tr][rookFrom] = '';
        }
        this.moveHistory.push({ from: [row, col], to: [tr, tc], piece });
        this.currentTurn = this.currentTurn === 'white' ? 'black' : 'white';
        const movedPiece = this.board[tr][tc];
        const isPawnPromotion = (movedPiece === '♙' && tr === 0) || (movedPiece === '♟' && tr === 7);
        if (isPawnPromotion) {
            if (this.gameMode === 'twoPlayer' || (this.gameMode === 'bot' && this.currentTurn === this.playerColor)) {
                this.waitingForPromotion = true;
                this.promotionRow = tr;
                this.promotionCol = tc;
                this.promotionColor = this.currentTurn;
                this.showPromotionModal();
                return true;
            } else {
                // ПРАВИЛЬНОЕ ПРЕВРАЩЕНИЕ: ♙ → ♕, ♟ → ♛
                const newPiece = movedPiece === '♙' ? '♕' : '♛';
                this.board[tr][tc] = newPiece;
            }
        }
        this.checkGameEnd();
        this.render();
        this.updateUI();
        if (!this.gameOver && this.currentTurn === this.botColor && this.gameMode === 'bot') setTimeout(() => this.botMove(), 50);
        return true;
    }
    
    // ГЕНИАЛЬНЫЙ ВАСЯ (дебютная книга + 100+ ходов)
    botMove() {
        if (this.gameOver || this.currentTurn !== this.botColor || this.gameMode !== 'bot' || this.botThinking) return;
        this.botThinking = true;
        
        setTimeout(() => {
            if (this.gameOver || this.currentTurn !== this.botColor) { this.botThinking = false; return; }
            
            const moveCount = this.moveHistory.length;
            
            // ДЕБЮТНАЯ КНИГА (первые 18 ходов)
            const openingBook = this.getOpeningBook();
            if (moveCount < 20) {
                for (const bookMove of openingBook) {
                    const piece = this.board[bookMove.from[0]]?.[bookMove.from[1]];
                    if (piece && this.getPieceColor(piece) === this.botColor && this.isValidMove(bookMove.from[0], bookMove.from[1], bookMove.to[0], bookMove.to[1])) {
                        this.applyMove(bookMove.from[0], bookMove.from[1], bookMove.to[0], bookMove.to[1]);
                        this.render();
                        this.updateUI();
                        this.botThinking = false;
                        return;
                    }
                }
            }
            
            let moves = this.getAllValidMoves(this.botColor);
            if (moves.length === 0) { this.botThinking = false; this.checkGameEnd(); return; }
            
            let bestMove = null;
            let bestScore = -Infinity;
            
            for (const move of moves) {
                const [row, col] = move.from;
                const [tr, tc] = move.to;
                const targetPiece = this.board[tr][tc];
                const ourPiece = this.board[row][col];
                let score = 0;
                
                // Взятие фигуры (главный приоритет)
                if (targetPiece) {
                    const targetVal = this.getPieceValue(targetPiece);
                    const ourVal = this.getPieceValue(ourPiece);
                    if (targetVal > ourVal) score += targetVal * 60;
                    else if (targetVal === ourVal) score += targetVal * 35;
                    else score += targetVal * 20;
                    if (targetPiece === '♕' || targetPiece === '♛') score += 600;
                }
                
                // Защита своих фигур
                let underAttack = false;
                for (let i = 0; i < 8; i++) {
                    for (let j = 0; j < 8; j++) {
                        const p = this.board[i][j];
                        if (p && this.getPieceColor(p) === (this.botColor === 'white' ? 'black' : 'white')) {
                            if (this.isValidMoveBasic(i, j, tr, tc, this.board)) underAttack = true;
                        }
                    }
                }
                if (underAttack && ourPiece && !targetPiece) score -= this.getPieceValue(ourPiece) * 50;
                
                // Контроль центра
                const centerDist = Math.abs(tr - 3.5) + Math.abs(tc - 3.5);
                score += (7 - centerDist) * 8;
                
                // Развитие фигур
                if (moveCount < 40 && (ourPiece === '♘' || ourPiece === '♞' || ourPiece === '♗' || ourPiece === '♝')) score += 18;
                
                // Превращение пешки
                if ((ourPiece === '♙' && tr === 0) || (ourPiece === '♟' && tr === 7)) score += 400;
                
                // Рокировка
                if ((ourPiece === '♔' || ourPiece === '♚') && Math.abs(tc - col) === 2) score += 80;
                
                // Уход от шаха
                if (this.isCheck(this.botColor)) {
                    const testBoard = this.copyBoard(this.board);
                    testBoard[tr][tc] = testBoard[row][col];
                    testBoard[row][col] = '';
                    if (!this.isKingInCheck(this.botColor, testBoard)) score += 8000;
                }
                
                // Шах противнику
                const oldTurn = this.currentTurn;
                this.currentTurn = this.botColor;
                const pieceBefore = this.board[row][col];
                const targetBefore = this.board[tr][tc];
                this.board[tr][tc] = pieceBefore;
                this.board[row][col] = '';
                const givesCheck = this.isCheck(this.playerColor);
                this.board[row][col] = pieceBefore;
                this.board[tr][tc] = targetBefore;
                this.currentTurn = oldTurn;
                if (givesCheck) score += 200;
                
                // Дальность хода (для эндшпиля)
                if (moveCount > 50) {
                    score += (8 - Math.abs(tr - 3.5)) * 2;
                }
                
                score += Math.random() * 3;
                
                if (score > bestScore) {
                    bestScore = score;
                    bestMove = move;
                }
            }
            
            if (bestMove) {
                const [row, col] = bestMove.from;
                const [tr, tc] = bestMove.to;
                this.applyMove(row, col, tr, tc);
                this.render();
                this.updateUI();
            }
            this.botThinking = false;
        }, 80);
    }
    
    getOpeningBook() {
        return [
            { from: [6,4], to: [4,4] }, { from: [6,3], to: [4,3] }, { from: [7,1], to: [5,2] },
            { from: [7,6], to: [5,5] }, { from: [7,5], to: [5,5] }, { from: [7,2], to: [5,3] },
            { from: [0,4], to: [2,4] }, { from: [1,4], to: [3,4] }, { from: [0,3], to: [2,3] },
            { from: [1,3], to: [3,3] }, { from: [0,6], to: [2,5] }, { from: [0,1], to: [2,2] },
            { from: [0,5], to: [2,6] }, { from: [1,5], to: [2,5] }, { from: [7,4], to: [5,4] },
            { from: [6,0], to: [5,0] }, { from: [1,2], to: [3,2] }, { from: [0,2], to: [2,2] },
            { from: [8,0], to: [6,0] }, { from: [1,5], to: [3,5] }, { from: [1,2], to: [3,2] },
            { from: [1,4], to: [3,4] }, { from: [7,1], to: [5,2] }, { from: [0,4], to: [2,4] },
            { from: [7,6], to: [5,5] }, { from: [0,5], to: [2,6] }, { from: [1,2], to: [3,2] },
            { from: [7,1], to: [5,2] }, { from: [0,5], to: [2,6] }, { from: [1,4], to: [3,4] },
            { from: [6,4], to: [4,4] }, { from: [1,4], to: [3,4] }, { from: [7,1], to: [5,2] },
            { from: [0,6], to: [2,5] }, { from: [6,3], to: [4,3] }, { from: [1,5], to: [3,5] },
            { from: [1,2], to: [3,2] }, { from: [7,1], to: [5,2] }, { from: [0,4], to: [2,4] },
            { from: [7,6], to: [5,5] }, { from: [1,1], to: [3,1] }, { from: [6,3], to: [4,3] },
            { from: [7,1], to: [5,2] }, { from: [1,2], to: [3,2] }, { from: [0,4], to: [2,4] },
        ];
    }
    
    handleCellClick(row, col) {
        if (this.gameOver || this.waitingForPromotion) return;
        if (this.gameMode === 'twoPlayer') {
            if (this.selectedRow !== null && this.selectedCol !== null) {
                this.applyMove(this.selectedRow, this.selectedCol, row, col);
                this.selectedRow = null; this.selectedCol = null;
                this.render(); this.updateUI();
            } else {
                const piece = this.board[row][col];
                if (piece && this.getPieceColor(piece) === this.currentTurn) {
                    this.selectedRow = row; this.selectedCol = col;
                    this.render(); this.updateUI();
                }
            }
        } else if (this.gameMode === 'bot' && this.currentTurn === this.playerColor) {
            if (this.selectedRow !== null && this.selectedCol !== null) {
                this.applyMove(this.selectedRow, this.selectedCol, row, col);
                this.selectedRow = null; this.selectedCol = null;
                this.render(); this.updateUI();
            } else {
                const piece = this.board[row][col];
                if (piece && this.getPieceColor(piece) === this.playerColor) {
                    this.selectedRow = row; this.selectedCol = col;
                    this.render(); this.updateUI();
                }
            }
        }
    }
    
    resetGame() {
        if (this.gameMode === 'twoPlayer') {
            this.playerColor = null; this.botColor = null;
            this.currentTurn = 'white'; this.gameOver = false;
            this.selectedRow = null; this.selectedCol = null;
            this.initBoard(); this.render(); this.updateUI();
            document.getElementById('status').innerHTML = '';
            this.addMessage('Вася', 'Режим двух игроков! Белые ходят первыми.');
        } else {
            const selector = document.getElementById('side-selector');
            if (selector) selector.style.display = 'block';
            this.gameOver = false; this.playerColor = null; this.botColor = null;
            this.selectedRow = null; this.selectedCol = null;
            this.initBoard(); this.render(); this.updateUI();
            document.getElementById('status').innerHTML = '';
            this.addMessage('Вася', 'Новая игра! Выбери сторону! ♟️');
        }
    }
    
    render() {
        const boardEl = document.getElementById('board');
        if (!boardEl) return;
        boardEl.innerHTML = '';
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                const cell = document.createElement('div');
                cell.classList.add('cell', (i+j)%2===0 ? 'light' : 'dark');
                cell.textContent = this.board[i][j];
                if (this.selectedRow === i && this.selectedCol === j) cell.classList.add('selected');
                if (this.selectedRow !== null && this.selectedCol !== null && !this.waitingForPromotion && this.isValidMove(this.selectedRow, this.selectedCol, i, j)) {
                    const target = this.board[i][j];
                    if (target && this.getPieceColor(target) !== this.getPieceColor(this.board[this.selectedRow][this.selectedCol])) cell.classList.add('possible-capture');
                    else if (!target) cell.classList.add('possible-move');
                }
                cell.addEventListener('click', ((r,c) => () => this.handleCellClick(r,c))(i,j));
                boardEl.appendChild(cell);
            }
        }
    }
    
    updateUI() {
        const turnSpan = document.getElementById('turn');
        if (!turnSpan) return;
        if (this.gameOver) turnSpan.textContent = this.winner === 'white' ? 'Белые победили!' : 'Чёрные победили!';
        else if (this.gameMode === 'twoPlayer') turnSpan.textContent = this.currentTurn === 'white' ? 'Ход белых' : 'Ход чёрных';
        else if (!this.playerColor) turnSpan.textContent = 'Выберите сторону';
        else if (this.waitingForPromotion) turnSpan.textContent = 'Выберите фигуру';
        else turnSpan.textContent = this.currentTurn === this.playerColor ? 'Ваш ход' : 'Вася думает...';
    }
    
    addEventListeners() {
        const reset = document.getElementById('reset-btn');
        const white = document.getElementById('side-white');
        const black = document.getElementById('side-black');
        const random = document.getElementById('side-random');
        const botMode = document.getElementById('bot-mode-btn');
        const twoPlayer = document.getElementById('two-player-btn');
        if (reset) reset.onclick = () => this.resetGame();
        if (white) white.onclick = () => this.setPlayerSide('white');
        if (black) black.onclick = () => this.setPlayerSide('black');
        if (random) random.onclick = () => this.setPlayerSide('random');
        if (botMode) botMode.onclick = () => this.setGameMode('bot');
        if (twoPlayer) twoPlayer.onclick = () => this.setGameMode('twoPlayer');
    }
}

const game = new ChessGame();
