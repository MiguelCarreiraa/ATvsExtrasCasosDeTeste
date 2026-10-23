const { timeDoJogador, vencedorDaRodada, vencedorDaMao } = require('../src/rodadas');
const { c } = require('./helpers');

describe('timeDoJogador', () => {
  test('jogadores 0 e 2 são do time A; 1 e 3 do time B', () => {
    expect(timeDoJogador(0)).toBe('A');
    expect(timeDoJogador(2)).toBe('A');
    expect(timeDoJogador(1)).toBe('B');
    expect(timeDoJogador(3)).toBe('B');
  });
});

describe('vencedorDaRodada', () => {
  const vira = c('4', 'copas'); // manilha = 5

  test('o time de quem jogou a carta mais alta vence a rodada', () => {
    const jogadas = [
      { jogador: 0, carta: c('K', 'ouros') },
      { jogador: 1, carta: c('3', 'ouros') },
      { jogador: 2, carta: c('7', 'paus') },
      { jogador: 3, carta: c('6', 'copas') },
    ];
    expect(vencedorDaRodada(jogadas, vira)).toBe('B');
  });

  test('manilha vence a rodada', () => {
    const jogadas = [
      { jogador: 0, carta: c('5', 'ouros') },
      { jogador: 1, carta: c('3', 'ouros') },
      { jogador: 2, carta: c('4', 'paus') },
      { jogador: 3, carta: c('3', 'paus') },
    ];
    expect(vencedorDaRodada(jogadas, vira)).toBe('A');
  });

  test('empata quando as cartas mais altas de times diferentes têm a mesma força', () => {
    const jogadas = [
      { jogador: 0, carta: c('3', 'ouros') },
      { jogador: 1, carta: c('3', 'espadas') },
      { jogador: 2, carta: c('7', 'paus') },
      { jogador: 3, carta: c('6', 'copas') },
    ];
    expect(vencedorDaRodada(jogadas, vira)).toBe('empate');
  });

  test('não é empate quando as duas cartas mais altas são do mesmo time', () => {
    const jogadas = [
      { jogador: 0, carta: c('3', 'ouros') },
      { jogador: 1, carta: c('2', 'espadas') },
      { jogador: 2, carta: c('3', 'paus') },
      { jogador: 3, carta: c('6', 'copas') },
    ];
    expect(vencedorDaRodada(jogadas, vira)).toBe('A');
  });

  test('carta coberta não vale nada e perde para qualquer carta aberta', () => {
    const jogadas = [
      { jogador: 0, carta: c('5', 'paus'), coberta: true },
      { jogador: 1, carta: c('4', 'ouros') },
      { jogador: 2, carta: c('4', 'espadas'), coberta: true },
      { jogador: 3, carta: c('4', 'copas'), coberta: true },
    ];
    expect(vencedorDaRodada(jogadas, vira)).toBe('B');
  });
});

describe('vencedorDaMao (melhor de 3 rodadas, retorna null se ainda não decidiu)', () => {
  test.each([
    [[], null],
    [['A'], null],
    [['A', 'A'], 'A'],
    [['B', 'B'], 'B'],
    [['A', 'B'], null],
    [['A', 'B', 'B'], 'B'],
    [['B', 'A', 'A'], 'A'],
  ])('rodadas %j => %s', (rodadas, esperado) => {
    expect(vencedorDaMao(rodadas)).toBe(esperado);
  });

  test('empate na 1ª rodada: quem ganhar a 2ª leva a mão', () => {
    expect(vencedorDaMao(['empate', 'A'])).toBe('A');
    expect(vencedorDaMao(['empate', 'B'])).toBe('B');
  });

  test('empate na 1ª e na 2ª: quem ganhar a 3ª leva a mão', () => {
    expect(vencedorDaMao(['empate', 'empate'])).toBeNull();
    expect(vencedorDaMao(['empate', 'empate', 'B'])).toBe('B');
  });

  test('empate na 2ª rodada: quem ganhou a 1ª leva a mão', () => {
    expect(vencedorDaMao(['A', 'empate'])).toBe('A');
    expect(vencedorDaMao(['B', 'empate'])).toBe('B');
  });

  test('empate na 3ª rodada: quem ganhou a 1ª leva a mão', () => {
    expect(vencedorDaMao(['A', 'B', 'empate'])).toBe('A');
    expect(vencedorDaMao(['B', 'A', 'empate'])).toBe('B');
  });

  test('três empates: ninguém leva a mão', () => {
    expect(vencedorDaMao(['empate', 'empate', 'empate'])).toBe('empate');
  });
});
