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
        this.openingMoves = [
            { from: [6,4], to: [4,4] },  // e4
            { from: [6,3], to: [4,3] },  // d4
            { from: [7,1], to: [5,2] },  // Nc3
            { from: [7,6], to: [5,5] },  // Nf3
            { from: [0,4], to: [2,4] },  // e5 (для чёрных)
            { from: [0,3], to: [2,3] }   // d5 (для чёрных)
        ];
        
        this.initBoard();
        this.render();
        this.addEventListeners();
        this.updateUI();
        
        this.initChat();
    }
    
    initChat() {
        const input = document.getElementById('chat-input');
        const sendBtn = document.getElementById('chat-send');
        if (sendBtn) sendBtn.onclick = () => this.sendMessage();
        if (input) input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendMessage();
        });
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
            'привет': [
                'Привет! Я гроссмейстер Вася, мои партии изучают в шахматных школах! ♟️',
                'Здравствуй! Готов проиграть? Мой рейтинг 2850 ELO!',
                'О, привет! Слышал, ты хочешь проверить свои силы? Ну давай, я буду милосерден!'
            ],
            'как дел': [
                'Отлично! Только что обыграл Stockfish в блиц!',
                'Хорошо! Просчитываю варианты на 8 ходов вперёд!',
                'Нормально, разбираю партию Каспарова против Deep Blue.'
            ],
            'пока': [
                'Пока! Заходи ещё, я всегда готов дать тебе урок шахмат!',
                'До встречи! Не забудь потренироваться перед следующей партией!',
                'Удачи! Помни: шахматы — игра гениев, а я их король!'
            ],
            'молодец': [
                'Спасибо! Я тренируюсь по 10 часов в день!',
                'Приятно слышать от такого сильного соперника!',
                'Стараюсь быть лучше с каждым ходом!'
            ],
            'дурак': [
                'Сам такой! У меня рейтинг 2800 ELO!',
                'Эй, полегче! Я между прочим учусь у гроссмейстеров!',
                'Обижаешь...'
            ],
            'шах': [
                'Шах! Ловушка захлопывается!',
                'Осторожно, король под ударом! Это только начало...',
                'Шах! Посмотрим, как ты выкрутишься!'
            ],
            'мат': [
                'Мат! Поздравляю с поражением! Ещё партию?',
                'Красивая комбинация, не правда ли? ♟️',
                'Сдавайся, это был мат в 3 хода!'
            ],
            'сдаю': [
                'Мудрое решение! Я бы тоже сдался на твоём месте.',
                'Принимаю! Хорошая партия, но я был сильнее.',
                'Спасибо за игру! Жду реванша!'
            ]
        };
        for (const [key, arr] of Object.entries(replies)) {
            if (lower.includes(key)) return arr[Math.floor(Math.random() * arr.length)];
        }
        const defaults = [
            'Интересный ход! Просчитываю контратаку... 🤔',
            'Так-так... Вижу твою слабость!',
            'Хм, неплохо. Но я вижу мат в 4 хода!',
            'Атакуешь? Осторожно, я мастер защиты!',
            'Это всё, на что ты способен?',
            'Просчитываю варианты на 8 ходов вперёд...',
            'Знаешь, Бобби Фишер играл не лучше тебя!',
            'Великие гроссмейстеры плакали бы от такой партии!',
            'Твоя стратегия предсказуема, как у новичка!',
            'Я вижу твою ошибку уже сейчас...'
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
            this.addMessage('Вася', 'Твой ход! Жду с нетерпением ♟️');
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
    
    getPieceValue(piece) {
        if (!piece) return 0;
        const values = { '♙':1, '♟':1, '♘':3, '♞':3, '♗':3, '♝':3, '♖':5, '♜':5, '♕':9, '♛':9 };
        return values[piece] || 0;
    }
    
    isOnlyKingsLeft() {
        let whiteKing = false, blackKing = false;
        let otherPieces = false;
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                const p = this.board[i][j];
                if (p === '♔') whiteKing = true;
                else if (p === '♚') blackKing = true;
                else if (p !== '') otherPieces = true;
            }
        }
        return whiteKing && blackKing && !otherPieces;
    }
    
    isValidMoveBasic(row, col, tr, tc, board) {
        const piece = board[row][col];
        if (!piece) return false;
        const pieceColor = this.getPieceColor(piece);
        if (pieceColor !== this.currentTurn) return false;
        
        const targetPiece = board[tr][tc];
        if (targetPiece && this.getPieceColor(targetPiece) === pieceColor) return false;
        
        const dr = tr - row;
        const dc = tc - col;
        const adr = Math.abs(dr);
        const adc = Math.abs(dc);
        
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
            if (row === tr) {
                const step = tc > col ? 1 : -1;
                for (let c = col + step; c !== tc; c += step) if (board[row][c]) return false;
            } else {
                const step = tr > row ? 1 : -1;
                for (let r = row + step; r !== tr; r += step) if (board[r][col]) return false;
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
            let r = row + rStep, c = col + cStep;
            while (r !== tr && c !== tc) {
                if (board[r][c]) return false;
                r += rStep;
                c += cStep;
            }
            return true;
        }
        
        if (piece === '♕' || piece === '♛') {
            if (row === tr || col === tc || adr === adc) {
                if (row === tr) {
                    const step = tc > col ? 1 : -1;
                    for (let c = col + step; c !== tc; c += step) if (board[row][c]) return false;
                } else if (col === tc) {
                    const step = tr > row ? 1 : -1;
                    for (let r = row + step; r !== tr; r += step) if (board[r][col]) return false;
                } else {
                    const rStep = dr > 0 ? 1 : -1;
                    const cStep = dc > 0 ? 1 : -1;
                    let r = row + rStep, c = col + cStep;
                    while (r !== tr && c !== tc) {
                        if (board[r][c]) return false;
                        r += rStep;
                        c += cStep;
                    }
                }
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
                for (let c = col + step; c !== rookCol; c += step) {
                    if (board[row][c]) return false;
                }
                return !this.isKingInCheck(this.currentTurn, board);
            }
            return false;
        }
        return false;
    }
    
    isKingInCheck(color, board) {
        let kingRow = -1, kingCol = -1;
        const kingSymbol = color === 'white' ? '♔' : '♚';
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                if (board[i][j] === kingSymbol) {
                    kingRow = i;
                    kingCol = j;
                    break;
                }
            }
        }
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
        const pieceColor = this.getPieceColor(piece);
        if (pieceColor !== this.currentTurn) return false;
        
        const targetPiece = this.board[tr][tc];
        if (targetPiece && this.getPieceColor(targetPiece) === pieceColor) return false;
        
        const oldTurn = this.currentTurn;
        const isValidBasic = this.isValidMoveBasic(row, col, tr, tc, this.board);
        if (!isValidBasic) return false;
        
        const testBoard = this.copyBoard(this.board);
        testBoard[tr][tc] = testBoard[row][col];
        testBoard[row][col] = '';
        
        return !this.isKingInCheck(this.currentTurn, testBoard);
    }
    
    copyBoard(board) {
        return board.map(row => [...row]);
    }
    
    getAllValidMoves(color) {
        const moves = [];
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                const piece = this.board[i][j];
                if (piece && this.getPieceColor(piece) === color) {
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
        return this.isKingInCheck(color, this.board);
    }
    
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
            document.getElementById('status').innerHTML = 'Пат! Только короли на доске! Ничья!';
            this.addMessage('Вася', 'Только короли остались! Ничья. Хорошая партия!');
            return;
        }
        if (this.isCheckmate(this.currentTurn)) {
            this.gameOver = true;
            this.winner = this.currentTurn === 'white' ? 'black' : 'white';
            document.getElementById('status').innerHTML = `МАТ! Победили ${this.winner === 'white' ? 'Белые' : 'Чёрные'}! 🏆`;
            this.addMessage('Вася', this.winner === this.botColor ? 'Мат! Я гений! Ещё партию? ♟️' : 'Ты победил! Поздравляю! Но в реванше я буду серьёзнее!');
        } else if (this.isCheck(this.currentTurn)) {
            document.getElementById('status').innerHTML = `${this.currentTurn === 'white' ? 'Белым' : 'Чёрным'} ШАХ! 🎯`;
            if (this.currentTurn === this.botColor) {
                this.addMessage('Вася', 'ШАХ! Я защищу своего короля! 👑');
            } else {
                this.addMessage('Вася', 'ШАХ! Посмотрим, как ты выкрутишься...');
            }
        } else if (this.isStalemate(this.currentTurn)) {
            this.gameOver = true;
            document.getElementById('status').innerHTML = 'Пат! Ничья!';
            this.addMessage('Вася', 'Пат! Ты достоин уважения. Ничья.');
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
            newPiece = choice;
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
        if (!this.gameOver && this.currentTurn === this.botColor && this.gameMode === 'bot') {
            setTimeout(() => this.botMove(), 50);
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
        
        this.currentTurn = this.currentTurn === 'white' ? 'black' : 'white';
        
        const movedPiece = this.board[tr][tc];
        const isPawnPromotion = (movedPiece === '♙' && tr === 0) || (movedPiece === '♟' && tr === 7);
        
        if (isPawnPromotion) {
            if (this.gameMode === 'twoPlayer' || (this.gameMode === 'bot' && this.currentTurn !== this.botColor)) {
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
        
        this.checkGameEnd();
        this.render();
        this.updateUI();
        
        if (!this.gameOver && this.currentTurn === this.botColor && this.gameMode === 'bot') {
            setTimeout(() => this.botMove(), 50);
        }
        return true;
    }
    
    botMove() {
        if (this.gameOver) return;
        if (this.currentTurn !== this.botColor) return;
        if (this.gameMode !== 'bot') return;
        if (this.botThinking) return;
        
        this.botThinking = true;
        
        setTimeout(() => {
            if (this.gameOver || this.currentTurn !== this.botColor) {
                this.botThinking = false;
                return;
            }
            
            let moves = this.getAllValidMoves(this.botColor);
            if (moves.length === 0) {
                this.botThinking = false;
                this.checkGameEnd();
                return;
            }
            
            // В начале игры (первые 8 ходов) — разнообразие дебюта
            const totalMoves = this.getAllValidMoves('white').length + this.getAllValidMoves('black').length;
            let bestMove = null;
            let bestScore = -Infinity;
            
            for (const move of moves) {
                const [row, col] = move.from;
                const [tr, tc] = move.to;
                const targetPiece = this.board[tr][tc];
                const ourPiece = this.board[row][col];
                let score = 0;
                
                // В дебюте — бонус за разные фигуры
                if (totalMoves < 20) {
                    if (ourPiece === '♘' || ourPiece === '♞') score += 2;
                    if (ourPiece === '♗' || ourPiece === '♝') score += 2;
                    if (ourPiece === '♙' && tr < 5) score += 1;
                }
                
                // Взятие фигуры
                if (targetPiece) {
                    const targetValue = this.getPieceValue(targetPiece);
                    score += targetValue * 20;
                    if (targetPiece === '♕' || targetPiece === '♛') score += 100;
                }
                
                // Защита своих фигур под ударом
                let ourPieceUnderAttack = false;
                let attackerValue = 0;
                for (let i = 0; i < 8; i++) {
                    for (let j = 0; j < 8; j++) {
                        const p = this.board[i][j];
                        if (p && this.getPieceColor(p) === (this.botColor === 'white' ? 'black' : 'white')) {
                            if (this.isValidMoveBasic(i, j, row, col, this.board)) {
                                ourPieceUnderAttack = true;
                                attackerValue = this.getPieceValue(p);
                            }
                        }
                    }
                }
                if (ourPieceUnderAttack && ourPiece) {
                    const ourValue = this.getPieceValue(ourPiece);
                    if (ourValue > attackerValue) {
                        score += ourValue * 8;
                    }
                }
                
                // Контроль центра
                const centerDist = Math.abs(tr - 3.5) + Math.abs(tc - 3.5);
                score += (7 - centerDist) * 2;
                
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
                if (givesCheck) {
                    score += 25;
                }
                
                // Рокировка
                if ((ourPiece === '♔' || ourPiece === '♚') && Math.abs(tc - col) === 2) {
                    score += 15;
                }
                
                // Превращение пешки
                if ((ourPiece === '♙' && tr === 0) || (ourPiece === '♟' && tr === 7)) {
                    score += 40;
                }
                
                // Уход от шаха
                if (this.isCheck(this.botColor)) {
                    const testBoard = this.copyBoard(this.board);
                    testBoard[tr][tc] = testBoard[row][col];
                    testBoard[row][col] = '';
                    if (!this.isKingInCheck(this.botColor, testBoard)) {
                        score += 200;
                    }
                }
                
                // Тактический бонус: двойной удар, вилка и т.д.
                let tacticalBonus = 0;
                for (let i = 0; i < 8; i++) {
                    for (let j = 0; j < 8; j++) {
                        if (this.board[i][j] && this.getPieceColor(this.board[i][j]) === this.playerColor) {
                            if (this.isValidMoveBasic(tr, tc, i, j, this.board)) {
                                tacticalBonus += this.getPieceValue(this.board[i][j]);
                            }
                        }
                    }
                }
                score += tacticalBonus * 2;
                
                score += Math.random() * 0.5;
                
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
            this.addMessage('Вася', 'Новая игра! Выбери сторону. Готовься проиграть ♟️');
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
        } else if (this.waitingForPromotion) {
            turnSpan.textContent = 'Выберите фигуру';
        } else {
            turnSpan.textContent = this.currentTurn === this.playerColor ? 'Ваш ход' : 'Вася думает...';
        }
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
