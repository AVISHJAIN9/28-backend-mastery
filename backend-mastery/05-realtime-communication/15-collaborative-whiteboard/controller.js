class WhiteboardController {
  constructor(io) { this.io = io; this.boards = new Map(); }
  createBoard(boardId) {
    this.boards.set(boardId, { elements: [], cursors: new Map() });
  }
  addElement(boardId, element) {
    const board = this.boards.get(boardId);
    if (!board) return;
    element.id = `elem_${Date.now()}_${Math.random()}`;
    board.elements.push(element);
    this.io.emit('draw:element', { boardId, element });
  }
  updateCursor(boardId, userId, x, y) {
    const board = this.boards.get(boardId);
    if (!board) return;
    board.cursors.set(userId, { x, y, timestamp: Date.now() });
    this.io.emit('cursor:moved', { boardId, userId, x, y });
  }
  getBoard(boardId) { return this.boards.get(boardId); }
}
module.exports = WhiteboardController;