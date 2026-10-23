const { Partida } = require('../src/partida');
const { Mao } = require('../src/mao');

// Simula o resultado de uma mão já encerrada, sem precisar jogar carta por carta
const maoEncerrada = (vencedor, pontos, extras = {}) => ({ encerrada: true, vencedor, pontos, ...extras });

function pontuar(partida, time, pontos) {
  partida.registrarMao(maoEncerrada(time, pontos));
}

describe('Partida - placar', () => {
  test('começa 0 a 0, sem vencedor', () => {
    const partida = new Partida();
    expect(partida.placar).toEqual({ A: 0, B: 0 });
    expect(partida.vencedor).toBeNull();
    expect(partida.encerrada).toBe(false);
  });

  test('registrar uma mão soma os pontos ao time vencedor', () => {
    const partida = new Partida();
    pontuar(partida, 'A', 1);
    pontuar(partida, 'B', 3);
    pontuar(partida, 'A', 6);
    expect(partida.placar).toEqual({ A: 7, B: 3 });
  });

  test('mão empatada não dá ponto para ninguém', () => {
    const partida = new Partida();
    partida.registrarMao(maoEncerrada('empate', 0));
    expect(partida.placar).toEqual({ A: 0, B: 0 });
  });

  test('não é possível registrar uma mão que ainda não terminou', () => {
    const partida = new Partida();
    expect(() => partida.registrarMao({ encerrada: false, vencedor: null, pontos: 0 })).toThrow();
  });
});

describe('Partida - fim de jogo', () => {
  test('o time que chega a 12 pontos vence a partida', () => {
    const partida = new Partida();
    pontuar(partida, 'B', 9);
    pontuar(partida, 'B', 3);
    expect(partida.vencedor).toBe('B');
    expect(partida.encerrada).toBe(true);
  });

  test('passar de 12 também encerra a partida', () => {
    const partida = new Partida();
    pontuar(partida, 'A', 10);
    pontuar(partida, 'A', 3);
    expect(partida.vencedor).toBe('A');
  });

  test('11 pontos ainda não vence', () => {
    const partida = new Partida();
    pontuar(partida, 'A', 11);
    expect(partida.vencedor).toBeNull();
  });

  test('uma mão com vitoriaDaPartida encerra o jogo na hora (truco na mão de onze)', () => {
    const partida = new Partida();
    pontuar(partida, 'A', 11);
    partida.registrarMao(maoEncerrada('B', 0, { vitoriaDaPartida: true }));
    expect(partida.vencedor).toBe('B');
    expect(partida.encerrada).toBe(true);
  });

  test('não é possível registrar mãos nem iniciar nova mão depois do fim', () => {
    const partida = new Partida();
    pontuar(partida, 'A', 12);
    expect(() => pontuar(partida, 'B', 1)).toThrow();
    expect(() => partida.novaMao()).toThrow();
  });
});

describe('Partida - novaMao', () => {
  test('cria uma Mao com 3 cartas para cada jogador e uma vira', () => {
    const mao = new Partida().novaMao();
    expect(mao).toBeInstanceOf(Mao);
    [0, 1, 2, 3].forEach((j) => expect(mao.cartasDoJogador(j)).toHaveLength(3));
    expect(mao.vira).toEqual(expect.objectContaining({ valor: expect.any(String), naipe: expect.any(String) }));
  });

  test('o jogador que começa a mão gira a cada nova mão', () => {
    const partida = new Partida();
    expect(partida.novaMao().jogadorDaVez).toBe(0);
    expect(partida.novaMao().jogadorDaVez).toBe(1);
    expect(partida.novaMao().jogadorDaVez).toBe(2);
    expect(partida.novaMao().jogadorDaVez).toBe(3);
    expect(partida.novaMao().jogadorDaVez).toBe(0);
  });

  test('usa o gerador aleatório informado (mesmo rng => mesmas cartas)', () => {
    const criarRng = () => {
      let seed = 42;
      return () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    };
    const mao1 = new Partida({ rng: criarRng() }).novaMao();
    const mao2 = new Partida({ rng: criarRng() }).novaMao();
    expect(mao1.vira).toEqual(mao2.vira);
    expect(mao1.cartasDoJogador(0)).toEqual(mao2.cartasDoJogador(0));
  });

  test('quando só um time tem 11 pontos, a nova mão é mão de onze valendo 3', () => {
    const partida = new Partida();
    pontuar(partida, 'B', 11);
    pontuar(partida, 'A', 5);
    const mao = partida.novaMao();
    expect(mao.maoDeOnze).toBe('B');
    expect(mao.valor).toBe(3);
  });

  test('quando os dois times têm 11 pontos, a nova mão é mão de ferro', () => {
    const partida = new Partida();
    pontuar(partida, 'A', 11);
    pontuar(partida, 'B', 11);
    const mao = partida.novaMao();
    expect(mao.maoDeFerro).toBe(true);
    expect(mao.maoDeOnze).toBeNull();
    expect(mao.cartasVisiveis).toBe(false);
  });

  test('em uma mão comum, maoDeOnze é null e maoDeFerro é false', () => {
    const mao = new Partida().novaMao();
    expect(mao.maoDeOnze).toBeNull();
    expect(mao.maoDeFerro).toBe(false);
  });
});

describe('Partida - fluxo completo com uma mão real', () => {
  test('jogar uma mão até o fim e registrar atualiza o placar', () => {
    const partida = new Partida();
    const mao = partida.novaMao();
    mao.pedirTruco(mao.jogadorDaVez);
    const quemResponde = (mao.jogadorDaVez + 1) % 4;
    mao.responderTruco(quemResponde, 'correr');
    partida.registrarMao(mao);
    expect(partida.placar).toEqual({ A: 1, B: 0 });
  });

  test('uma mão que subiu até 12 e teve fuga soma 9 pontos no placar', () => {
    const partida = new Partida();
    const mao = partida.novaMao(); // primeira mão começa pelo jogador 0 (time A)
    mao.pedirTruco(0); // 3
    mao.responderTruco(1, 'aumentar'); // 6
    mao.responderTruco(0, 'aumentar'); // 9
    mao.responderTruco(1, 'aumentar'); // 12
    mao.responderTruco(0, 'correr');
    partida.registrarMao(mao);
    expect(partida.placar).toEqual({ A: 0, B: 9 });
  });
});
