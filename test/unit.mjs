// Unit test: Board.tryExitArrow & solvability semua level generator
import { test } from 'node:test';
import assert from 'node:assert';
import { Board } from '../js/board.js';
import { DIRECTIONS } from '../js/arrow.js';
import { generateLevel, generateBossLevel, generateEndlessLevel, generateDailyChallenge } from '../js/level.js';

test('arrow bebas bisa keluar & grid dibersihkan', () => {
    const b = new Board(4);
    const a = b.placeArrow(1, 1, DIRECTIONS.UP);
    const r = b.tryExitArrow(a);
    assert.strictEqual(r.success, true);
    assert.strictEqual(b.getArrow(1, 1), null);
    // panah aktif hilang seketika; objek tetap ada di exitFx untuk animasi
    assert.strictEqual(b.arrows.length, 0);
    assert.strictEqual(b.exitFx.length, 1);
    assert.strictEqual(b.isEmpty(), true);
});

test('arrow terblokir gagal keluar', () => {
    const b = new Board(4);
    // panah di (0,1) UP menghalangi jalur panah di (3,1) UP
    b.placeArrow(0, 1, DIRECTIONS.UP);
    const a = b.placeArrow(3, 1, DIRECTIONS.UP);
    const r = b.tryExitArrow(a);
    assert.strictEqual(r.success, false);
    assert.strictEqual(b.arrows.length, 2);
});

const toBoard = (data) => {
    if (data instanceof Board) return data;
    const b = new Board(data.size);
    data.arrows.forEach(a => b.placeArrow(a.row, a.col, a.direction, a.element));
    return b;
};
const solvableGreedy = (board) => {
    let progress = true;
    while (board.arrows.length > 0 && progress) {
        progress = false;
        for (const a of [...board.arrows]) {
            if (board.tryExitArrow(a).success) { progress = true; break; }
        }
    }
    return board.arrows.length === 0;
};

test('50 level campaign menghasilkan papan terisi & greedy-solvable', () => {
    const bad = [];
    for (let lv = 1; lv <= 50; lv++) {
        const data = generateLevel(lv);
        if (!data || !data.arrows || data.arrows.length === 0) { bad.push(lv + '(kosong)'); continue; }
        if (!solvableGreedy(toBoard(data))) bad.push(lv);
    }
    assert.deepStrictEqual(bad, [], 'level bermasalah: ' + bad.join(','));
});

test('generator boss/endless/daily tidak crash', () => {
    assert.ok(generateBossLevel(10));
    const e = generateEndlessLevel(); assert.ok(e.arrows.length > 0);
    const d = generateDailyChallenge(); assert.ok(d.arrows.length > 0);
});
