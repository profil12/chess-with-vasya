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
        
        this.initBoard();
        this.render();
        this.addEventListeners();
        this.updateUI();
        
        this.initChat();
    }
    
    initChat() {
        const input = document.getElementById('chat-input');
        const sendBtn = document.getElementById('chat-send');
        
        if (sendBtn) {
            sendBtn.onclick = () => this.sendMessage();
        }
        if (input) {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.sendMessage();
            });
        }
    }
    
    sendMessage() {
        const input = document.getElementById('chat-input');
        const text = input.value.trim();
        if (!text) return;
        
        this.addMessage('Вы', text);
        input.value = '';
        
        setTimeout(() => {
            const reply = this.getBotReply(text);
            this.addMessage('Вася', reply);
        }, 300);
    }
    
    getBotReply(msg) {
        const lower = msg.toLowerCase();
        const replies = {
            'привет': ['Привет! Сыграем?', 'Здравствуй!', 'О, привет!'],
            'как дел': ['Отлично! А у тебя?', 'Хорошо!', 'Нормально!'],
            'пока': ['Пока! Заходи ещё!', 'До встречи!', 'Удачи!'],
            'молодец': ['Спасибо!', 'Стараюсь!', 'Приятно!'],
            'дурак': ['Сам такой!', 'Эй!', 'Обижаешь...'],
            'шах': ['Осторожно! Шах!', 'Шах — серьёзно!', 'Король под ударом!'],
            'мат': ['Мат! Поздравляю!', 'Красиво!', 'Я сдаюсь...']
        };
        for (const [key, arr] of Object.entries(replies)) {
            if (lower.includes(key)) {
                return arr[Math.floor(Math.random() * arr.length)];
            }
        }
        const defaults = [
            'Интересный ход! ♟️',
            'Думаю... 🤔',
            'Неплохо!',
            'Хороший ход!'
        ];
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
        if (side === 'white') {
            this.playerColor = 'white';
            this.botColor = 'black';
        } else if (side === 'black') {
            this.playerColor = 'black';
            this.botColor = 'white';
        } else {
            this.playerColor = Math.random() < 0.5 ? 'white' : 'black';
            this.botColor = this.playerColor === 'white' ? 'black' : 'white';
        }
        this.currentTurn = 'white';
        this.gameOver = false;
        this.selectedRow = null;
        this.selectedCol = null;
        this.initBoard();
        this.render();
        this.updateUI();
        document.getElementById('side-selector').style.display = 'none';
        if (this.playerColor === 'black') {
            setTimeout(() => this.botMove(), 100);
        } else {
            this.addMessage('Вася', 'Твой ход! ♟️');
        }
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
    }
    
    getPieceColor(piece) {
        if (!piece) return null;
        const white = ['♙', '♖', '♘', '♗', '♕', '♔'];
        const black = ['♟', '♜', '♞', '♝', '♛', '♚'];
        if (white.includes(piece)) return 'white';
        if (black.includes(piece)) return 'black';
        return null;
    }
    
    isValidMove(row, col, tr, tc) {
        const piece = this.board[row][col];
        if (!piece) return false;
        if (this.getPieceColor(piece) !== this.currentTurn) return false;
        
        const targetPiece = this.board[tr][tc];
        if (targetPiece && this.getPieceColor(targetPiece) === this.currentTurn) return false;
        
        const dr = tr - row;
        const dc = tc - col;
        const adr = Math.abs(dr);
        const adc = Math.abs(dc);
        
        // Пешки
        if (piece === '♙') {
            if (dc === 0 && dr === -1 && !targetPiece) return true;
            if (dc === 0 && dr === -2 && row === 6 && !targetPiece && !this.board[5][col]) return true;
            if (adc === 1 && dr === -1 && targetPiece && this.getPieceColor(targetPiece) === 'black') return true;
            return false;
        }
        if (piece === '♟') {
            if (dc === 0 && dr === 1 && !targetPiece) return true;
            if (dc === 0 && dr === 2 && row === 1 && !targetPiece && !this.board[2][col]) return true;
            if (adc === 1 && dr === 1 && targetPiece && this.getPieceColor(targetPiece) === 'white') return true;
            return false;
        }
        
        // Ладья
        if (piece === '♖' || piece === '♜') {
            if (row !== tr && col !== tc) return false;
            if (row === tr) {
                const step = tc > col ? 1 : -1;
                for (let c = col + step; c !== tc; c += step) if (this.board[row][c]) return false;
            } else {
                const step = tr > row ? 1 : -1;
                for (let r = row + step; r !== tr; r += step) if (this.board[r][col]) return false;
            }
            return true;
        }
        
        // Конь
        if (piece === '♘' || piece === '♞') {
            return (adr === 2 && adc === 1) || (adr === 1 && adc === 2);
        }
        
        // Слон
        if (piece === '♗' || piece === '♝') {
            if (adr !== adc) return false;
            const rStep = dr > 0 ? 1 : -1;
            const cStep = dc > 0 ? 1 : -1;
            let r = row + rStep;
            let c = col + cStep;
            while (r !== tr && c !== tc) {
                if (this.board[r][c]) return false;
                r += rStep;
                c += cStep;
            }
            return true;
        }
        
        // Ферзь
        if (piece === '♕' || piece === '♛') {
            if (row === tr || col === tc || adr === adc) {
                if (row === tr) {
                    const step = tc > col ? 1 : -1;
                    for (let c = col + step; c !== tc; c += step) if (this.board[row][c]) return false;
                } else if (col === tc) {
                    const step = tr > row ? 1 : -1;
                    for (let r = row + step; r !== tr; r += step) if (this.board[r][col]) return false;
                } else {
                    const rStep = dr > 0 ? 1 : -1;
                    const cStep = dc > 0 ? 1 : -1;
                    let r = row + rStep;
                    let c = col + cStep;
                    while (r !== tr && c !== tc) {
                        if (this.board[r][c]) return false;
                        r += rStep;
                        c += cStep;
                    }
                }
                return true;
            }
            return false;
        }
        
        // Король
        if (piece === '♔' || piece === '♚') {
            if (adr <= 1 && adc <= 1) return true;
            // Рокировка
            if (dr === 0 && adc === 2) {
                const rookCol = dc > 0 ? 7 : 0;
                const rookRow = row;
                const rook = this.board[rookRow][rookCol];
                if (rook !== (piece === '♔' ? '♖' : '♜')) return false;
                const step = dc > 0 ? 1 : -1;
                for (let c = col + step; c !== rookCol; c += step) {
                    if (this.board[row][c]) return false;
                }
                return true;
            }
            return false;
        }
        return false;
    }
    
    isKingInCheck(color) {
        let kingRow, kingCol;
        const king = color === 'white' ? '♔' : '♚';
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                if (this.board[i][j] === king) {
                    kingRow = i;
                    kingCol = j;
                    break;
                }
            }
        }
        const opp = color === 'white' ? 'black' : 'white';
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                const p = this.board[i][j];
                if (p && this.getPieceColor(p) === opp) {
                    if (this.isValidMoveWithoutCheck(i, j, kingRow, kingCol)) {
                        return true;
                    }
                }
            }
        }
        return false;
    }
    
    isValidMoveWithoutCheck(row, col, tr, tc) {
        const piece = this.board[row][col];
        if (!piece) return false;
        const targetPiece = this.board[tr][tc];
        if (targetPiece && this.getPieceColor(targetPiece) === this.getPieceColor(piece)) return false;
        
        const dr = tr - row;
        const dc = tc - col;
        const adr = Math.abs(dr);
        const adc = Math.abs(dc);
        
        if (piece === '♙') {
            if (dc === 0 && dr === -1 && !targetPiece) return true;
            if (adc === 1 && dr === -1 && targetPiece && this.getPieceColor(targetPiece) === 'black') return true;
            return false;
        }
        if (piece === '♟') {
            if (dc === 0 && dr === 1 && !targetPiece) return true;
            if (adc === 1 && dr === 1 && targetPiece && this.getPieceColor(targetPiece) === 'white') return true;
            return false;
        }
        if (piece === '♖' || piece === '♜') {
            if (row !== tr && col !== tc) return false;
            if (row === tr) {
                const step = tc > col ? 1 : -1;
                for (let c = col + step; c !== tc; c += step) if (this.board[row][c]) return false;
            } else {
                const step = tr > row ? 1 : -1;
                for (let r = row + step; r !== tr; r += step) if (this.board[r][col]) return false;
            }
            return true;
        }
        if (piece === '♘' || piece === '♞') {
            return (adr === 2 && adc === 1) || (adr === 1 && adc === 2);
        }
        if (piece === '♗' || piece === '♝') {
            if (adr !== adc) return false;
            const rStep = dr > 0 ? 1 : -1;
            const cStep = dc > 0 ? 1 : -1;
            let r = row + rStep;
            let c = col + cStep;
            while (r !== tr && c !== tc) {
                if (this.board[r][c]) return false;
                r += rStep;
                c += cStep;
            }
            return true;
        }
        if (piece === '♕' || piece === '♛') {
            if (row === tr || col === tc || adr === adc) {
                if (row === tr) {
                    const step = tc > col ? 1 : -1;
                    for (let c = col + step; c !== tc; c += step) if (this.board[row][c]) return false;
                } else if (col === tc) {
                    const step = tr > row ? 1 : -1;
                    for (let r = row + step; r !== tr; r += step) if (this.board[r][col]) return false;
                } else {
                    const rStep = dr > 0 ? 1 : -1;
                    const cStep = dc > 0 ? 1 : -1;
                    let r = row + rStep;
                    let c = col + cStep;
                    while (r !== tr && c !== tc) {
                        if (this.board[r][c]) return false;
                        r += rStep;
                        c += cStep;
                    }
                }
                return true;
            }
            return false;
        }
        if (piece === '♔' || piece === '♚') {
            return adr <= 1 && adc <= 1;
        }
        return false;
    }
    
    getAllValidMoves(color) {
        const moves = [];
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                const p = this.board[i][j];
                if (p && this.getPieceColor(p) === color) {
                    for (let ti = 0; ti < 8; ti++) {
                        for (let tj = 0; tj < 8; tj++) {
                            if (this.isValidMove(i, j, ti, tj)) {
                                moves.push({ from: [i, j], to: [ti, tj] });
                            }
                        }
                    }
                }
            }
        }
        return moves;
    }
    
    isCheck(color) {
        return this.isKingInCheck(color);
    }
    
    isCheckmate(color) {
        if (!this.isCheck(color)) return false;
        const moves = this.getAllValidMoves(color);
        for (const move of moves) {
            const [row, col] = move.from;
            const [tr, tc] = move.to;
            const piece = this.board[row][col];
            const target = this.board[tr][tc];
            this.board[tr][tc] = piece;
            this.board[row][col] = '';
            const still = this.isCheck(color);
            this.board[row][col] = piece;
            this.board[tr][tc] = target;
            if (!still) return false;
        }
        return true;
    }
    
    isStalemate(color) {
        if (this.isCheck(color)) return false;
        return this.getAllValidMoves(color).length === 0;
    }
    
    checkGameEnd() {
        if (this.isCheckmate(this.currentTurn)) {
            this.gameOver = true;
            this.winner = this.currentTurn === 'white' ? 'black' : 'white';
            document.getElementById('status').innerHTML = `МАТ! Победили ${this.winner === 'white' ? 'Белые' : 'Чёрные'}! 🏆`;
            this.addMessage('Вася', this.winner === this.botColor ? 'Я победил! ♟️' : 'Ты победил! Поздравляю!');
        } else if (this.isCheck(this.currentTurn)) {
            document.getElementById('status').innerHTML = `${this.currentTurn === 'white' ? 'Белым' : 'Чёрным'} ШАХ! 🎯`;
            if (this.currentTurn === this.botColor) {
                this.addMessage('Вася', 'ШАХ! Защищаюсь! 👑');
            } else {
                this.addMessage('Вася', 'ШАХ! Попробуй уйти!');
            }
        } else if (this.isStalemate(this.currentTurn)) {
            this.gameOver = true;
            document.getElementById('status').innerHTML = 'Пат! Ничья!';
            this.addMessage('Вася', 'Пат. Ничья!');
        } else {
            document.getElementById('status').innerHTML = '';
        }
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
        
        if (this.isKingInCheck(this.currentTurn)) {
            this.board[row][col] = piece;
            this.board[tr][tc] = target;
            if (isCastling) {
                const rookFrom = tc > col ? 7 : 0;
                const rookTo = tc > col ? tc - 1 : tc + 1;
                const rook = this.board[tr][rookTo];
                this.board[tr][rookFrom] = rook;
                this.board[tr][rookTo] = '';
            }
            return false;
        }
        
        this.currentTurn = this.currentTurn === 'white' ? 'black' : 'white';
        this.checkGameEnd();
        this.render();
        this.updateUI();
        
        if (!this.gameOver && this.currentTurn === this.botColor && this.gameMode === 'bot') {
            setTimeout(() => this.botMove(), 50);
        }
        return true;
    }
    
    botMove() {
        if (this.gameOver || this.waitingForPromotion || this.currentTurn !== this.botColor || this.gameMode !== 'bot') return;
        
        setTimeout(() => {
            const moves = this.getAllValidMoves(this.botColor);
            if (moves.length === 0) {
                this.checkGameEnd();
                return;
            }
            
            const isInCheck = this.isCheck(this.botColor);
            let safeMoves = moves;
            
            if (isInCheck) {
                safeMoves = [];
                for (const move of moves) {
                    const [row, col] = move.from;
                    const [tr, tc] = move.to;
                    const piece = this.board[row][col];
                    const target = this.board[tr][tc];
                    this.board[tr][tc] = piece;
                    this.board[row][col] = '';
                    const still = this.isCheck(this.botColor);
                    this.board[row][col] = piece;
                    this.board[tr][tc] = target;
                    if (!still) safeMoves.push(move);
                }
            }
            
            if (safeMoves.length === 0) {
                this.checkGameEnd();
                return;
            }
            
            const pieceVal = { '♙':1, '♟':1, '♘':3, '♞':3, '♗':3, '♝':3, '♖':5, '♜':5, '♕':9, '♛':9 };
            let best = null;
            let bestScore = -Infinity;
            
            for (const move of safeMoves) {
                const [row, col] = move.from;
                const [tr, tc] = move.to;
                const target = this.board[tr][tc];
                let score = 0;
                if (target) score += pieceVal[target] * 10;
                const center = Math.abs(tr - 3.5) + Math.abs(tc - 3.5);
                score += (7 - center) * 0.5;
                score += Math.random() * 1;
                if (score > bestScore) {
                    bestScore = score;
                    best = move;
                }
            }
            
            if (best) {
                const [row, col] = best.from;
                const [tr, tc] = best.to;
                this.applyMove(row, col, tr, tc);
                this.render();
                this.updateUI();
            }
        }, 50);
    }
    
    handleCellClick(row, col) {
        if (this.gameOver || this.waitingForPromotion) return;
        if (this.gameMode === 'twoPlayer') {
            if (this.selectedRow !== null && this.selectedCol !== null) {
                this.applyMove(this.selectedRow, this.selectedCol, row, col);
                this.selectedRow = null;
                this.selectedCol = null;
                this.render();
                this.updateUI();
            } else {
                const piece = this.board[row][col];
                if (piece && this.getPieceColor(piece) === this.currentTurn) {
                    this.selectedRow = row;
                    this.selectedCol = col;
                    this.render();
                    this.updateUI();
                }
            }
        } else if (this.gameMode === 'bot' && this.currentTurn === this.playerColor) {
            if (this.selectedRow !== null && this.selectedCol !== null) {
                this.applyMove(this.selectedRow, this.selectedCol, row, col);
                this.selectedRow = null;
                this.selectedCol = null;
                this.render();
                this.updateUI();
            } else {
                const piece = this.board[row][col];
                if (piece && this.getPieceColor(piece) === this.playerColor) {
                    this.selectedRow = row;
                    this.selectedCol = col;
                    this.render();
                    this.updateUI();
                }
            }
        }
    }
    
        resetGame() {
        if (this.gameMode === 'twoPlayer') {
            this.playerColor = null;
            this.botColor = null;
            this.currentTurn = 'white';
            this.gameOver = false;
            this.selectedRow = null;
            this.selectedCol = null;
            this.initBoard();
            this.render();
            this.updateUI();
            document.getElementById('status').innerHTML = '';
            this.addMessage('Вася', 'Режим двух игроков! Белые ходят первыми.');
        } else {
            // Показываем выбор стороны
            const selector = document.getElementById('side-selector');
            if (selector) selector.style.display = 'block';
            this.gameOver = false;
            this.playerColor = null;
            this.botColor = null;
            this.selectedRow = null;
            this.selectedCol = null;
            this.currentTurn = 'white';
            this.initBoard();
            this.render();
            this.updateUI();
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
                cell.classList.add('cell', (i + j) % 2 === 0 ? 'light' : 'dark');
                cell.textContent = this.board[i][j];
                if (this.selectedRow === i && this.selectedCol === j) {
                    cell.classList.add('selected');
                }
                if (this.selectedRow !== null && this.selectedCol !== null && !this.waitingForPromotion && this.isValidMove(this.selectedRow, this.selectedCol, i, j)) {
                    const target = this.board[i][j];
                    if (target && this.getPieceColor(target) !== this.getPieceColor(this.board[this.selectedRow][this.selectedCol])) {
                        cell.classList.add('possible-capture');
                    } else if (!target) {
                        cell.classList.add('possible-move');
                    }
                }
                cell.addEventListener('click', ((r, c) => () => this.handleCellClick(r, c))(i, j));
                boardEl.appendChild(cell);
            }
        }
    }
    
    updateUI() {
        const turnSpan = document.getElementById('turn');
        if (!turnSpan) return;
        if (this.gameOver) {
            turnSpan.textContent = this.winner === 'white' ? 'Белые победили!' : 'Чёрные победили!';
        } else if (this.gameMode === 'twoPlayer') {
            turnSpan.textContent = this.currentTurn === 'white' ? 'Ход белых' : 'Ход чёрных';
        } else if (!this.playerColor) {
            turnSpan.textContent = 'Выберите сторону';
        } else {
            turnSpan.textContent = this.currentTurn === this.playerColor ? 'Ваш ход' : 'Вася думает...';
        }
    }
    
    addEventListeners() {
        const reset = document.getElementById('reset-btn');
        const white = document.getElementById('side-white');
        const black = document.getElementById('side-black');
        const random = document.getElementById('side-random');
        const bot = document.getElementById('bot-mode-btn');
        const two = document.getElementById('two-player-btn');
        
        if (reset) reset.onclick = () => this.resetGame();
        if (white) white.onclick = () => this.setPlayerSide('white');
        if (black) black.onclick = () => this.setPlayerSide('black');
        if (random) random.onclick = () => this.setPlayerSide('random');
        if (bot) bot.onclick = () => this.setGameMode('bot');
        if (two) two.onclick = () => this.setGameMode('twoPlayer');
    }
}

const game = new ChessGame();
