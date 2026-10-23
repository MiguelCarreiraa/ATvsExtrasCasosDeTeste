const {
  VALORES,
  NAIPES,
  calcularManilha,
  ehManilha,
  compararCartas,
} = require('../src/cartas');
const { c } = require('./helpers');

describe('Constantes das cartas', () => {
  test('VALORES está em ordem crescente de força (sem 8, 9 e 10)', () => {
    expect(VALORES).toEqual(['4', '5', '6', '7', 'Q', 'J', 'K', 'A', '2', '3']);
  });

  test('NAIPES está em ordem crescente de força das manilhas', () => {
    expect(NAIPES).toEqual(['ouros', 'espadas', 'copas', 'paus']);
  });
});

describe('calcularManilha (carta seguinte à vira)', () => {
  test.each([
    ['4', '5'],
    ['5', '6'],
    ['6', '7'],
    ['7', 'Q'],
    ['Q', 'J'],
    ['J', 'K'],
    ['K', 'A'],
    ['A', '2'],
    ['2', '3'],
  ])('vira %s => manilha %s', (vira, manilha) => {
    expect(calcularManilha(c(vira, 'ouros'))).toBe(manilha);
  });

  test('a sequência é circular: vira 3 => manilha 4', () => {
    expect(calcularManilha(c('3', 'copas'))).toBe('4');
  });

  test('o naipe da vira não influencia a manilha', () => {
    expect(calcularManilha(c('7', 'paus'))).toBe(calcularManilha(c('7', 'ouros')));
  });
});

describe('ehManilha', () => {
  const vira = c('6', 'espadas');

  test('as 4 cartas com o valor seguinte à vira são manilhas', () => {
    NAIPES.forEach((naipe) => {
      expect(ehManilha(c('7', naipe), vira)).toBe(true);
    });
  });

  test('cartas de outro valor não são manilhas', () => {
    expect(ehManilha(c('6', 'paus'), vira)).toBe(false);
    expect(ehManilha(c('3', 'paus'), vira)).toBe(false);
  });
});

describe('compararCartas (retorna > 0 se a primeira for mais forte, < 0 se mais fraca, 0 se empatar)', () => {
  const vira = c('4', 'copas'); // manilha = 5

  test('3 é a carta comum mais forte e 4 a mais fraca', () => {
    expect(compararCartas(c('3', 'ouros'), c('2', 'paus'), vira)).toBeGreaterThan(0);
    expect(compararCartas(c('4', 'paus'), c('6', 'ouros'), vira)).toBeLessThan(0);
  });

  test('ordem das cartas comuns: 3 > 2 > A > K > J > Q > 7 > 6 > 4', () => {
    const ordem = ['3', '2', 'A', 'K', 'J', 'Q', '7', '6', '4'];
    for (let i = 0; i < ordem.length - 1; i++) {
      expect(compararCartas(c(ordem[i], 'ouros'), c(ordem[i + 1], 'ouros'), vira)).toBeGreaterThan(0);
    }
  });

  test('J é mais forte que Q (particularidade do truco)', () => {
    expect(compararCartas(c('J', 'ouros'), c('Q', 'paus'), vira)).toBeGreaterThan(0);
  });

  test('cartas comuns de mesmo valor e naipes diferentes empatam', () => {
    expect(compararCartas(c('3', 'paus'), c('3', 'ouros'), vira)).toBe(0);
  });

  test('qualquer manilha vence o 3', () => {
    expect(compararCartas(c('5', 'ouros'), c('3', 'paus'), vira)).toBeGreaterThan(0);
  });

  test('manilhas: paus (zap) > copas (copilha) > espadas (espadilha) > ouros (pica-fumo)', () => {
    expect(compararCartas(c('5', 'paus'), c('5', 'copas'), vira)).toBeGreaterThan(0);
    expect(compararCartas(c('5', 'copas'), c('5', 'espadas'), vira)).toBeGreaterThan(0);
    expect(compararCartas(c('5', 'espadas'), c('5', 'ouros'), vira)).toBeGreaterThan(0);
  });

  test('a manilha muda conforme a vira (vira 2 => 3 vira manilha e o 4 fica fraco)', () => {
    const vira3 = c('3', 'ouros'); // manilha = 4
    expect(compararCartas(c('4', 'ouros'), c('3', 'paus'), vira3)).toBeGreaterThan(0);
  });

  test('a carta de mesmo valor da vira não é manilha', () => {
    expect(compararCartas(c('4', 'paus'), c('6', 'ouros'), vira)).toBeLessThan(0);
  });
});
