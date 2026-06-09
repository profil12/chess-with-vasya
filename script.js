// ========== ШАХМАТЫ С ВАСЕЙ — ULTRA (платные анимации + 2 игрока) ==========
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
        this.isThinking = false;
        this.gameMode = 'bot'; // 'bot' или 'twoPlayer'
        this.animating = false;
        
        this.initBoard();
        this.render();
        this.addEventListeners();
        this.updateUI();
        
        this.botName = 'Вася (IQ 250)';
        this.initChat();
        this.lastLostPiece = null;
    }
    
    initChat() {
        const input = document.getElementById('chat-input');
        const sendBtn = document.getElementById('chat-send');
        if (sendBtn) sendBtn.addEventListener('click', () => this.sendMessage());
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
            this.addMessage(this.botName, reply);
        }, 100);
    }
    
    getBotReply(userMessage) {
        const msg = userMessage.toLowerCase();
        const replies = {
            'привет': ['Привет! Сыграем?', 'Здравствуй!', 'О, привет!'],
            'как дел': ['Отлично! А у тебя?', 'Хорошо!', 'Нормально!'],
            'пока': ['Пока! Заходи ещё!', 'До встречи!', 'Удачи!'],
            'молодец': ['Спасибо!', 'Стараюсь!', 'Приятно!'],
            'дурак': ['Сам такой!', 'Эй!', 'Обижаешь...'],
            'шах': ['Осторожно! Шах!', 'Шах — серьёзно!', 'Король под ударом!'],
            'мат': ['Мат! Поздравляю!', 'Красиво!', 'Я сдаюсь...'],
            'сдаю': ['Принимаю!', 'Спасибо за игру!', 'В следующий раз лучше!']
        };
        for (const [key, arr] of Object.entries(replies)) {
            if (msg.includes(key)) return arr[Math.floor(Math.random() * arr.length)];
        }
        if (this.lastLostPiece && (msg.includes('жалко') || msg.includes('потерял'))) {
            const pieceNames = { '♙':'пешку','♟':'пешку','♘':'коня','♞':'коня','♗':'слона','♝':'слона','♖':'ладью','♜':'ладью','♕':'ферзя','♛':'ферзя' };
            return `Да, жалко ${pieceNames[this.lastLostPiece] || 'фигуру'}... Но я отыграюсь!`;
        }
        const defaultReplies = [
            'Интересный ход! ♟️', 'Думаю... 🤔', 'Неплохо!', 'Сейчас я покажу класс!',
            'Так-так...', 'Хороший ход!', 'Анализирую...'
        ];
        return defaultReplies[Math.floor(Math.random() * defaultReplies.length)];
    }
    
    addMessage(sender, text) {
        const messagesDiv = document.getElementById('chat-messages');
        if (!messagesDiv) return;
        const msgDiv = document.createElement('div');
        msgDiv.classList.add('message', sender === 'Вы' ? 'user' : 'bot');
        msgDiv.innerText = `${sender}: ${text}`;
        messagesDiv.appendChild(msgDiv);
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }
    
    setGameMode(mode) {
        this.gameMode = mode;
        this.resetGame();
        if (mode === 'twoPlayer') {
            this.addMessage('Вася', 'Режим двух игроков! Белые ходят первыми.');
            this.playerColor = null;
            this.botColor = null;
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
        this.winner = null;
        this.selectedRow = null;
        this.selectedCol = null;
        this.initBoard();
        this.render();
        this.updateUI();
        document.getElementById('side-selector').style.display = 'none';
        if (this.gameMode === 'bot' && this.playerColor === 'black') setTimeout(() => this.botMove(), 50);
        else if (this.gameMode === 'bot') this.addMessage(this.botName, 'Твой ход! ♟️');
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
        const whitePieces = ['♙', '♖', '♘', '♗', '♕', '♔'];
        const blackPieces = ['♟', '♜', '♞', '♝', '♛', '♚'];
        if (whitePieces.includes(piece)) return 'white';
        if (blackPieces.includes(piece)) return 'black';
        return null;
    }
    
    getPieceValue(piece) {
        const values = { '♙': 1, '♟': 1, '♘': 3, '♞': 3, '♗': 3, '♝': 3, '♖': 5, '♜': 5, '♕': 9, '♛': 9, '♔': 100, '♚': 100 };
        return values[piece] || 0;
    }
    
    isValidMove(row, col, targetRow, targetCol) {
        const piece = this.board[row][col];
        if (!piece) return false;
        const pieceColor = this.getPieceColor(piece);
        if (pieceColor !== this.currentTurn) return false;
        const targetPiece = this.board[targetRow][targetCol];
        const targetColor = this.getPieceColor(targetPiece);
        if (targetColor === pieceColor) return false;
        const deltaRow = targetRow - row;
        const deltaCol = targetCol - col;
        const absDeltaRow = Math.abs(deltaRow);
        const absDeltaCol = Math.abs(deltaCol);
        
        if (piece === '♙') {
            if (deltaCol === 0 && deltaRow === -1 && !targetPiece) return true;
            if (deltaCol === 0 && deltaRow === -2 && row === 6 && !targetPiece && !this.board[5][col]) return true;
            if (absDeltaCol === 1 && deltaRow === -1 && targetColor === 'black') return true;
            return false;
        }
        if (piece === '♟') {
            if (deltaCol === 0 && deltaRow === 1 && !targetPiece) return true;
            if (deltaCol === 0 && deltaRow === 2 && row === 1 && !targetPiece && !this.board[2][col]) return true;
            if (absDeltaCol === 1 && deltaRow === 1 && targetColor === 'white') return true;
            return false;
        }
        
        if (piece === '♖' || piece === '♜') {
            if (row !== targetRow && col !== targetCol) return false;
            if (row === targetRow) {
                const step = col < targetCol ? 1 : -1;
                for (let c = col + step; c !== targetCol; c += step) if (this.board[row][c]) return false;
            } else {
                const step = row < targetRow ? 1 : -1;
                for (let r = row + step; r !== targetRow; r += step) if (this.board[r][col]) return false;
            }
            return true;
        }
        
        if (piece === '♘' || piece === '♞') return (absDeltaRow === 2 && absDeltaCol === 1) || (absDeltaRow === 1 && absDeltaCol === 2);
        
        if (piece === '♗' || piece === '♝') {
            if (absDeltaRow !== absDeltaCol) return false;
            const rowStep = deltaRow > 0 ? 1 : -1;
            const colStep = deltaCol > 0 ? 1 : -1;
            let r = row + rowStep, c = col + colStep;
            while (r !== targetRow && c !== targetCol) { if (this.board[r][c]) return false; r += rowStep; c += colStep; }
            return true;
        }
        
        if (piece === '♕' || piece === '♛') {
            if (row === targetRow || col === targetCol || absDeltaRow === absDeltaCol) {
                if (row === targetRow) {
                    const step = col < targetCol ? 1 : -1;
                    for (let c = col + step; c !== targetCol; c += step) if (this.board[row][c]) return false;
                } else if (col === targetCol) {
                    const step = row < targetRow ? 1 : -1;
                    for (let r = row + step; r !== targetRow; r += step) if (this.board[r][col]) return false;
                } else {
                    const rowStep = deltaRow > 0 ? 1 : -1;
                    const colStep = deltaCol > 0 ? 1 : -1;
                    let r = row + rowStep, c = col + colStep;
                    while (r !== targetRow && c !== targetCol) { if (this.board[r][c]) return false; r += rowStep; c += colStep; }
                }
                return true;
            }
            return false;
        }
        
        if (piece === '♔' || piece === '♚') {
            if (absDeltaRow <= 1 && absDeltaCol <= 1) {
                const testBoard = this.copyBoard();
                testBoard[targetRow][targetCol] = piece;
                testBoard[row][col] = '';
                if (this.isKingInCheck(this.currentTurn, testBoard)) return false;
                return true;
            }
            if (deltaRow === 0 && absDeltaCol === 2 && row === targetRow) {
                const rookCol = deltaCol > 0 ? 7 : 0;
                const rookRow = row;
                const rookPiece = this.board[rookRow][rookCol];
                if (rookPiece !== (piece === '♔' ? '♖' : '♜')) return false;
                const step = deltaCol > 0 ? 1 : -1;
                for (let c = col + step; c !== rookCol; c += step) if (this.board[row][c]) return false;
                const testBoard = this.copyBoard();
                testBoard[targetRow][targetCol] = piece;
                testBoard[row][col] = '';
                if (this.isKingInCheck(this.currentTurn, testBoard)) return false;
                const midCol = (col + targetCol) / 2;
                const testBoardMid = this.copyBoard();
                testBoardMid[row][midCol] = piece;
                testBoardMid[row][col] = '';
                if (this.isKingInCheck(this.currentTurn, testBoardMid)) return false;
                return true;
            }
            return false;
        }
        return false;
    }
    
    copyBoard() { return this.board.map(row => [...row]); }
    
    isKingInCheck(color, board = this.board) {
        let kingRow, kingCol;
        const kingSymbol = color === 'white' ? '♔' : '♚';
        for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) if (board[i][j] === kingSymbol) { kingRow = i; kingCol = j; break; }
        const opponentColor = color === 'white' ? 'black' : 'white';
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                const piece = board[i][j];
                if (piece && this.getPieceColor(piece) === opponentColor) {
                    if (this.isValidMoveWithoutSelfCheck(piece, i, j, kingRow, kingCol, board)) return true;
                }
            }
        }
        return false;
    }
    
    isValidMoveWithoutSelfCheck(piece, row, col, tr, tc, board) {
        const dr = tr - row, dc = tc - col;
        const adr = Math.abs(dr), adc = Math.abs(dc);
        if (piece === '♙') {
            if (dc === 0 && dr === -1 && !board[tr][tc]) return true;
            if (dc === 0 && dr === -2 && row === 6 && !board[tr][tc] && !board[5][col]) return true;
            if (adc === 1 && dr === -1 && board[tr][tc] && this.getPieceColor(board[tr][tc]) === 'black') return true;
            return false;
        }
        if (piece === '♟') {
            if (dc === 0 && dr === 1 && !board[tr][tc]) return true;
            if (dc === 0 && dr === 2 && row === 1 && !board[tr][tc] && !board[2][col]) return true;
            if (adc === 1 && dr === 1 && board[tr][tc] && this.getPieceColor(board[tr][tc]) === 'white') return true;
            return false;
        }
        if (piece === '♖' || piece === '♜') {
            if (row !== tr && col !== tc) return false;
            if (row === tr) {
                const step = tc > col ? 1 : -1;
                for (let c = col+step; c !== tc; c+=step) if (board[row][c]) return false;
            } else {
                const step = tr > row ? 1 : -1;
                for (let r = row+step; r !== tr; r+=step) if (board[r][col]) return false;
            }
            return true;
        }
        if (piece === '♘' || piece === '♞') return (adr === 2 && adc === 1) || (adr === 1 && adc === 2);
        if (piece === '♗' || piece === '♝') {
            if (adr !== adc) return false;
            const rStep = dr > 0 ? 1 : -1;
            const cStep = dc > 0 ? 1 : -1;
            let r = row+rStep, c = col+cStep;
            while (r !== tr && c !== tc) { if (board[r][c]) return false; r += rStep; c += cStep; }
            return true;
        }
        if (piece === '♕' || piece === '♛') {
            if (row === tr || col === tc || adr === adc) {
                if (row === tr) {
                    const step = tc > col ? 1 : -1;
                    for (let c = col+step; c !== tc; c+=step) if (board[row][c]) return false;
                } else if (col === tc) {
                    const step = tr > row ? 1 : -1;
                    for (let r = row+step; r !== tr; r+=step) if (board[r][col]) return false;
                } else {
                    const rStep = dr > 0 ? 1 : -1;
                    const cStep = dc > 0 ? 1 : -1;
                    let r = row+rStep, c = col+cStep;
                    while (r !== tr && c !== tc) { if (board[r][c]) return false; r += rStep; c += cStep; }
                }
                return true;
            }
            return false;
        }
        if (piece === '♔' || piece === '♚') return adr <= 1 && adc <= 1;
        return false;
    }
    
    getAllValidMoves(color) {
        const moves = [];
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                const piece = this.board[i][j];
                if (piece && this.getPieceColor(piece) === color) {
                    for (let ti = 0; ti < 8; ti++) {
                        for (let tj = 0; tj < 8; tj++) {
                            if (this.isValidMove(i, j, ti, tj)) moves.push({ from: [i, j], to: [ti, tj] });
                        }
                    }
                }
            }
        }
        return moves;
    }
    
    isCheck(color) { return this.isKingInCheck(color, this.board); }
    
    isCheckmate(color) {
        if (!this.isCheck(color)) return false;
        const moves = this.getAllValidMoves(color);
        for (const move of moves) {
            const [row, col] = move.from;
            const [tr, tc] = move.to;
            const piece = this.board[row][col];
            const targetPiece = this.board[tr][tc];
            this.board[tr][tc] = piece;
            this.board[row][col] = '';
            const stillInCheck = this.isCheck(color);
            this.board[row][col] = piece;
            this.board[tr][tc] = targetPiece;
            if (!stillInCheck) return false;
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
            this.addMessage(this.botName, this.winner === this.botColor ? 'Я победил! ♟️' : 'Ты победил! Поздравляю!');
        } else if (this.isCheck(this.currentTurn)) {
            document.getElementById('status').innerHTML = `${this.currentTurn === 'white' ? 'Белым' : 'Чёрным'} ШАХ! 🎯`;
            if (this.currentTurn === this.botColor) this.addMessage(this.botName, 'ШАХ! Защищаюсь! 👑');
            else this.addMessage(this.botName, 'ШАХ! Попробуй уйти!');
        } else if (this.isStalemate(this.currentTurn)) {
            this.gameOver = true;
            document.getElementById('status').innerHTML = 'Пат! Ничья!';
            this.addMessage(this.botName, 'Пат. Ничья!');
        } else {
            document.getElementById('status').innerHTML = '';
        }
    }
    
    showPromotionModal() {
        const modal = document.createElement('div');
        modal.id = 'promotion-modal';
        modal.style.cssText = `position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.85); display:flex; justify-content:center; align-items:center; z-index:1000;`;
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
        let newPiece;
        if (this.promotionColor === 'white') newPiece = choice;
        else {
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
        if (!this.gameOver && this.currentTurn === this.botColor && this.gameMode === 'bot') setTimeout(() => this.botMove(), 30);
    }
    
    async animateMove(fromRow, fromCol, toRow, toCol) {
        this.animating = true;
        const fromCell = document.querySelector(`.cell[data-row="${fromRow}"][data-col="${fromCol}"]`);
        const toCell = document.querySelector(`.cell[data-row="${toRow}"][data-col="${toCol}"]`);
        if (!fromCell || !toCell) { this.animating = false; return; }
        const fromRect = fromCell.getBoundingClientRect();
        const toRect = toCell.getBoundingClientRect();
        const clone = fromCell.cloneNode(true);
        clone.style.position = 'fixed';
        clone.style.top = `${fromRect.top}px`;
        clone.style.left = `${fromRect.left}px`;
        clone.style.width = `${fromRect.width}px`;
        clone.style.height = `${fromRect.height}px`;
        clone.style.fontSize = window.getComputedStyle(fromCell).fontSize;
        clone.style.zIndex = '1000';
        clone.style.transition = 'all 0.2s ease-out';
        clone.style.pointerEvents = 'none';
        document.body.appendChild(clone);
        requestAnimationFrame(() => {
            clone.style.top = `${toRect.top}px`;
            clone.style.left = `${toRect.left}px`;
            clone.style.width = `${toRect.width}px`;
            clone.style.height = `${toRect.height}px`;
        });
        await new Promise(resolve => setTimeout(resolve, 200));
        clone.remove();
        this.animating = false;
    }
    
    applyMove(row, col, tr, tc) {
        const piece = this.board[row][col];
        const targetPiece = this.board[tr][tc];
        if (this.currentTurn === this.botColor && targetPiece) this.lastLostPiece = targetPiece;
        else this.lastLostPiece = null;
        if (!this.isValidMove(row, col, tr, tc)) return false;
        const isCastling = (piece === '♔' || piece === '♚') && Math.abs(tc - col) === 2;
        this.board[tr][tc] = piece;
        this.board[row][col] = '';
        if (isCastling) {
            const rookFromCol = tc > col ? 7 : 0;
            const rookToCol = tc > col ? tc - 1 : tc + 1;
            const rookPiece = this.board[tr][rookFromCol];
            this.board[tr][rookToCol] = rookPiece;
            this.board[tr][rookFromCol] = '';
        }
        if (this.isKingInCheck(this.currentTurn)) {
            this.board[row][col] = piece;
            this.board[tr][tc] = targetPiece;
            if (isCastling) {
                const rookFromCol = tc > col ? 7 : 0;
                const rookToCol = tc > col ? tc - 1 : tc + 1;
                const rookPiece = this.board[tr][rookToCol];
                this.board[tr][rookFromCol] = rookPiece;
                this.board[tr][rookToCol] = '';
            }
            return false;
        }
        this.animateMove(row, col, tr, tc);
        const movedPiece = this.board[tr][tc];
        const isPawnPromotion = (movedPiece === '♙' && tr === 0) || (movedPiece === '♟' && tr === 7);
        if (isPawnPromotion) {
            if (this.gameMode === 'twoPlayer' || this.currentTurn === this.playerColor) {
                this.waitingForPromotion = true;
                this.promotionRow = tr;
                this.promotionCol = tc;
                this.promotionColor = this.currentTurn;
                this.showPromotionModal();
                return true;
            } else {
                this.board[tr][tc] = this.currentTurn === 'white' ? '♕' : '♛';
            }
        }
        this.currentTurn = this.currentTurn === 'white' ? 'black' : 'white';
        this.checkGameEnd();
        this.render();
        this.updateUI();
        if (!this.gameOver && this.currentTurn === this.botColor && this.gameMode === 'bot') setTimeout(() => this.botMove(), 30);
        return true;
    }
    
    botMove() {
        if (this.gameOver || this.waitingForPromotion || this.currentTurn !== this.botColor || this.gameMode !== 'bot') return;
        if (this.isThinking) return;
        this.isThinking = true;
        setTimeout(() => {
            if (this.gameOver || this.waitingForPromotion || this.currentTurn !== this.botColor) { this.isThinking = false; return; }
            let moves = this.getAllValidMoves(this.botColor);
            if (moves.length === 0) { this.isThinking = false; this.checkGameEnd(); return; }
            const isInCheck = this.isCheck(this.botColor);
            if (isInCheck) {
                const safeMoves = [];
                for (const move of moves) {
                    const [row, col] = move.from;
                    const [tr, tc] = move.to;
                    const piece = this.board[row][col];
                    const targetPiece = this.board[tr][tc];
                    this.board[tr][tc] = piece;
                    this.board[row][col] = '';
                    const stillInCheck = this.isCheck(this.botColor);
                    this.board[row][col] = piece;
                    this.board[tr][tc] = targetPiece;
                    if (!stillInCheck) safeMoves.push(move);
                }
                if (safeMoves.length === 0) { this.isThinking = false; this.checkGameEnd(); return; }
                moves = safeMoves;
            }
            if (moves.length === 0) { this.isThinking = false; return; }
            let bestMove = null;
            let bestScore = -Infinity;
            const pieceValues = { '♙': 1, '♟': 1, '♘': 3, '♞': 3, '♗': 3, '♝': 3, '♖': 5, '♜': 5, '♕': 9, '♛': 9 };
            for (const move of moves) {
                const [row, col] = move.from;
                const [tr, tc] = move.to;
                const targetPiece = this.board[tr][tc];
                let score = 0;
                if (targetPiece) score += pieceValues[targetPiece] * 10;
                if (this.board[row][col]) score += pieceValues[this.board[row][col]] * 0.5;
                const centerDist = Math.abs(tr - 3.5) + Math.abs(tc - 3.5);
                score += (7 - centerDist) * 0.5;
                const boardAfter = this.copyBoard();
                const pieceMoved = boardAfter[row][col];
                boardAfter[tr][tc] = pieceMoved;
                boardAfter[row][col] = '';
                let opponentThreat = 0;
                for (let i = 0; i < 8; i++) {
                    for (let j = 0; j < 8; j++) {
                        const p = boardAfter[i][j];
                        if (p && this.getPieceColor(p) === (this.botColor === 'white' ? 'black' : 'white')) {
                            for (let ti = 0; ti < 8; ti++) {
                                for (let tj = 0; tj < 8; tj++) {
                                    if (this.isValidMoveWithoutSelfCheck(p, i, j, ti, tj, boardAfter) && boardAfter[ti][tj] && this.getPieceValue(boardAfter[ti][tj]) > 0) {
                                        opponentThreat += this.getPieceValue(boardAfter[ti][tj]) * 2;
                                    }
                                }
                            }
                        }
                    }
                }
                score -= opponentThreat * 0.3;
                score += Math.random() * 0.8;
                if (score > bestScore) { bestScore = score; bestMove = move; }
            }
            if (bestMove) {
                const [row, col] = bestMove.from;
                const [tr, tc] = bestMove.to;
                this.applyMove(row, col, tr, tc);
                this.render();
                this.updateUI();
            }
            this.isThinking = false;
        }, 20);
    }
    
    handleCellClick(row, col) {
        if (this.gameOver || this.waitingForPromotion || this.animating) return;
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
            document.getElementById('side-selector').style.display = 'none';
            this.playerColor = null;
            this.botColor = null;
            this.currentTurn = 'white';
            this.gameOver = false;
            this.winner = null;
            this.selectedRow = null;
            this.selectedCol = null;
            this.initBoard();
            this.render();
            this.updateUI();
            document.getElementById('status').innerHTML = '';
            this.addMessage('Вася', 'Режим двух игроков! Белые ходят первыми.');
        } else {
            document.getElementById('side-selector').style.display = 'block';
            this.gameOver = false;
            this.waitingForPromotion = false;
            this.playerColor = null;
            this.botColor = null;
            this.selectedRow = null;
            this.selectedCol = null;
            this.lastLostPiece = null;
            this.initBoard();
            this.render();
            this.updateUI();
            document.getElementById('status').innerHTML = '';
            this.addMessage(this.botName, 'Новая игра! Выбери сторону! ♟️');
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
                cell.setAttribute('data-row', i);
                cell.setAttribute('data-col', j);
                if (this.selectedRow === i && this.selectedCol === j) cell.classList.add('selected');
                if (this.selectedRow !== null && this.selectedCol !== null && !this.waitingForPromotion && this.isValidMove(this.selectedRow, this.selectedCol, i, j)) {
                    const targetPiece = this.board[i][j];
                    if (targetPiece && this.getPieceColor(targetPiece) !== this.getPieceColor(this.board[this.selectedRow][this.selectedCol])) cell.classList.add('possible-capture');
                    else if (!targetPiece) cell.classList.add('possible-move');
                }
                cell.addEventListener('click', ((r, c) => () => this.handleCellClick(r, c))(i, j));
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
        document.getElementById('reset-btn').onclick = () => this.resetGame();
        document.getElementById('side-white').onclick = () => this.setPlayerSide('white');
        document.getElementById('side-black').onclick = () => this.setPlayerSide('black');
        document.getElementById('side-random').onclick = () => this.setPlayerSide('random');
        document.getElementById('two-player-btn').onclick = () => this.setGameMode('twoPlayer');
        document.getElementById('bot-mode-btn').onclick = () => this.setGameMode('bot');
    }
}

const game = new ChessGame();
