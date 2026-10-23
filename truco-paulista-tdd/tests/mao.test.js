const { Mao } = require('../src/mao');
const { c } = require('./helpers');

// Vira 4 de copas => manilha é o 5 (nenhum jogador tem manilha nas mãos padrão)
const VIRA = c('4', 'copas');

// Times: jogadores 0 e 2 = time A; jogadores 1 e 3 = time B
// Ordem de jogo: 0 -> 1 -> 2 -> 3 -> 0 ...
function maosPadrao() {
  return [
    [c('3', 'ouros'), c('K', 'ouros'), c('6', 'ouros')], // jogador 0 (A)
    [c('2', 'paus'), c('Q', 'paus'), c('7', 'paus')], // jogador 1 (B)
    [c('A', 'copas'), c('J', 'copas'), c('6', 'copas')], // jogador 2 (A)
    [c('4', 'espadas'), c('Q', 'espadas'), c('7', 'espadas')], // jogador 3 (B)
  ];
}

function novaMao(opcoes = {}) {
  return new Mao({ maos: maosPadrao(), vira: VIRA, ...opcoes });
}

// Cada um dos 4 jogadores joga a primeira carta que tem na mão, respeitando a vez
function jogarRodada(mao) {
  for (let i = 0; i < 4; i++) {
    mao.jogarCarta(mao.jogadorDaVez, 0);
  }
}

describe('Mao - estado inicial', () => {
  test('começa valendo 1 ponto', () => {
    expect(novaMao().valor).toBe(1);
  });

  test('começa pelo jogador inicial informado (padrão 0)', () => {
    expect(novaMao().jogadorDaVez).toBe(0);
    expect(novaMao({ jogadorInicial: 2 }).jogadorDaVez).toBe(2);
  });

  test('não está encerrada, não tem vencedor e não tem rodadas jogadas', () => {
    const mao = novaMao();
    expect(mao.encerrada).toBe(false);
    expect(mao.vencedor).toBeNull();
    expect(mao.rodadas).toEqual([]);
    expect(mao.apostaPendente).toBeNull();
  });

  test('cada jogador começa com 3 cartas', () => {
    const mao = novaMao();
    [0, 1, 2, 3].forEach((j) => expect(mao.cartasDoJogador(j)).toHaveLength(3));
  });
});

describe('Mao - jogar cartas', () => {
  test('a carta jogada sai da mão do jogador', () => {
    const mao = novaMao();
    mao.jogarCarta(0, 1);
    expect(mao.cartasDoJogador(0)).toEqual([c('3', 'ouros'), c('6', 'ouros')]);
  });

  test('após jogar, a vez passa para o próximo jogador no sentido horário', () => {
    const mao = novaMao({ jogadorInicial: 3 });
    mao.jogarCarta(3, 0);
    expect(mao.jogadorDaVez).toBe(0);
  });

  test('uma rodada inteira segue a ordem 2 -> 3 -> 0 -> 1, alternando as duplas', () => {
    const mao = novaMao({ jogadorInicial: 2 });
    const ordem = [];
    for (let i = 0; i < 4; i++) {
      ordem.push(mao.jogadorDaVez);
      mao.jogarCarta(mao.jogadorDaVez, 0);
    }
    expect(ordem).toEqual([2, 3, 0, 1]);
  });

  test('não é possível jogar fora da sua vez', () => {
    const mao = novaMao();
    expect(() => mao.jogarCarta(1, 0)).toThrow();
  });

  test('não é possível jogar uma carta que não existe na mão', () => {
    const mao = novaMao();
    expect(() => mao.jogarCarta(0, 3)).toThrow();
    expect(() => mao.jogarCarta(0, -1)).toThrow();
  });

  test('após os 4 jogarem, o resultado da rodada é registrado', () => {
    const mao = novaMao();
    jogarRodada(mao); // 3 (A) x 2 (B) x A (A) x 4 (B) => A
    expect(mao.rodadas).toEqual(['A']);
  });

  test('quem jogou a carta vencedora começa a próxima rodada', () => {
    const mao = novaMao({ jogadorInicial: 1 });
    jogarRodada(mao); // 2 (j1), A (j2), 4 (j3), 3 (j0) => jogador 0 vence
    expect(mao.jogadorDaVez).toBe(0);
  });

  test('em caso de empate, quem começou a rodada empatada começa a próxima', () => {
    const maos = [
      [c('3', 'ouros'), c('K', 'ouros'), c('4', 'ouros')],
      [c('3', 'paus'), c('Q', 'paus'), c('4', 'paus')],
      [c('6', 'ouros'), c('6', 'copas'), c('7', 'ouros')],
      [c('6', 'paus'), c('7', 'copas'), c('7', 'espadas')],
    ];
    const mao = new Mao({ maos, vira: VIRA, jogadorInicial: 1 });
    jogarRodada(mao); // 3 (j1) x 6 x 6 x 3 (j0) => empate
    expect(mao.rodadas).toEqual(['empate']);
    expect(mao.jogadorDaVez).toBe(1);
  });

  test('pode jogar carta coberta, que perde para qualquer carta aberta', () => {
    const mao = novaMao();
    mao.jogarCarta(0, 0, { coberta: true }); // 3 coberto não vale nada
    mao.jogarCarta(1, 2); // 7
    mao.jogarCarta(2, 2); // 6
    mao.jogarCarta(3, 0); // 4
    expect(mao.rodadas).toEqual(['B']);
  });
});

describe('Mao - fim da mão', () => {
  test('o time que vence 2 rodadas vence a mão e leva o valor dela', () => {
    const mao = novaMao();
    jogarRodada(mao); // A
    jogarRodada(mao); // K (A) x Q x J x Q => A
    expect(mao.encerrada).toBe(true);
    expect(mao.vencedor).toBe('A');
    expect(mao.pontos).toBe(1);
  });

  test('não é possível jogar cartas depois que a mão terminou', () => {
    const mao = novaMao();
    jogarRodada(mao);
    jogarRodada(mao);
    expect(() => mao.jogarCarta(mao.jogadorDaVez, 0)).toThrow();
  });

  test('empate na 1ª rodada: quem vence a 2ª leva a mão', () => {
    const maos = [
      [c('3', 'ouros'), c('K', 'ouros'), c('4', 'ouros')],
      [c('3', 'paus'), c('Q', 'paus'), c('4', 'paus')],
      [c('6', 'ouros'), c('6', 'copas'), c('7', 'ouros')],
      [c('6', 'paus'), c('7', 'copas'), c('7', 'espadas')],
    ];
    const mao = new Mao({ maos, vira: VIRA });
    jogarRodada(mao); // empate
    jogarRodada(mao); // K (A) vence
    expect(mao.encerrada).toBe(true);
    expect(mao.vencedor).toBe('A');
  });

  test('três rodadas empatadas: ninguém pontua', () => {
    const maos = [
      [c('3', 'ouros'), c('K', 'ouros'), c('7', 'ouros')],
      [c('3', 'paus'), c('K', 'paus'), c('7', 'paus')],
      [c('4', 'ouros'), c('4', 'espadas'), c('6', 'ouros')],
      [c('4', 'paus'), c('6', 'espadas'), c('6', 'paus')],
    ];
    const mao = new Mao({ maos, vira: VIRA });
    jogarRodada(mao);
    jogarRodada(mao);
    jogarRodada(mao);
    expect(mao.encerrada).toBe(true);
    expect(mao.vencedor).toBe('empate');
    expect(mao.pontos).toBe(0);
  });
});

describe('Mao - truco', () => {
  test('o jogador da vez pode pedir truco, criando uma aposta pendente de 3 pontos', () => {
    const mao = novaMao();
    mao.pedirTruco(0);
    expect(mao.apostaPendente).toEqual({ valorProposto: 3, timeQuePediu: 'A', timeQueResponde: 'B' });
    expect(mao.valor).toBe(1);
  });

  test('não é possível pedir truco fora da sua vez', () => {
    const mao = novaMao();
    expect(() => mao.pedirTruco(1)).toThrow();
  });

  test('não é possível jogar carta enquanto há aposta pendente', () => {
    const mao = novaMao();
    mao.pedirTruco(0);
    expect(() => mao.jogarCarta(0, 0)).toThrow();
  });

  test('só o time adversário pode responder ao truco', () => {
    const mao = novaMao();
    mao.pedirTruco(0);
    expect(() => mao.responderTruco(2, 'aceitar')).toThrow();
  });

  test('resposta inválida gera erro', () => {
    const mao = novaMao();
    mao.pedirTruco(0);
    expect(() => mao.responderTruco(1, 'talvez')).toThrow();
  });

  test('aceitar: a mão passa a valer 3 e o jogo continua com o mesmo jogador', () => {
    const mao = novaMao();
    mao.pedirTruco(0);
    mao.responderTruco(1, 'aceitar');
    expect(mao.valor).toBe(3);
    expect(mao.apostaPendente).toBeNull();
    expect(mao.jogadorDaVez).toBe(0);
    expect(mao.encerrada).toBe(false);
  });

  test('a mão trucada e vencida vale 3 pontos', () => {
    const mao = novaMao();
    mao.pedirTruco(0);
    mao.responderTruco(3, 'aceitar');
    jogarRodada(mao);
    jogarRodada(mao);
    expect(mao.vencedor).toBe('A');
    expect(mao.pontos).toBe(3);
  });

  test('correr: quem pediu vence a mão e leva o valor atual (1 ponto)', () => {
    const mao = novaMao();
    mao.pedirTruco(0);
    mao.responderTruco(1, 'correr');
    expect(mao.encerrada).toBe(true);
    expect(mao.vencedor).toBe('A');
    expect(mao.pontos).toBe(1);
  });

  test('aumentar: quem recebeu o truco pede 6 e agora o outro time responde', () => {
    const mao = novaMao();
    mao.pedirTruco(0);
    mao.responderTruco(1, 'aumentar');
    expect(mao.apostaPendente).toEqual({ valorProposto: 6, timeQuePediu: 'B', timeQueResponde: 'A' });
  });

  test('correr do 6: o time que pediu 6 leva 3 pontos', () => {
    const mao = novaMao();
    mao.pedirTruco(0);
    mao.responderTruco(1, 'aumentar');
    mao.responderTruco(2, 'correr');
    expect(mao.vencedor).toBe('B');
    expect(mao.pontos).toBe(3);
  });

  test('correr do 9: o time que pediu 9 leva 6 pontos', () => {
    const mao = novaMao();
    mao.pedirTruco(0); // 3
    mao.responderTruco(1, 'aumentar'); // 6
    mao.responderTruco(0, 'aumentar'); // 9
    mao.responderTruco(3, 'correr');
    expect(mao.vencedor).toBe('A');
    expect(mao.pontos).toBe(6);
  });

  test('aceitar o 6: a mão passa a valer 6', () => {
    const mao = novaMao();
    mao.pedirTruco(0); // 3
    mao.responderTruco(1, 'aumentar'); // 6
    mao.responderTruco(0, 'aceitar');
    expect(mao.valor).toBe(6);
    expect(mao.apostaPendente).toBeNull();
  });

  test('aceitar o 9: a mão passa a valer 9', () => {
    const mao = novaMao();
    mao.pedirTruco(0); // 3
    mao.responderTruco(1, 'aumentar'); // 6
    mao.responderTruco(0, 'aumentar'); // 9
    mao.responderTruco(1, 'aceitar');
    expect(mao.valor).toBe(9);
    expect(mao.apostaPendente).toBeNull();
  });

  test('correr do 12: o time que pediu 12 leva 9 pontos', () => {
    const mao = novaMao();
    mao.pedirTruco(0); // 3
    mao.responderTruco(1, 'aumentar'); // 6
    mao.responderTruco(0, 'aumentar'); // 9
    mao.responderTruco(1, 'aumentar'); // 12 pedido pelo time B
    mao.responderTruco(0, 'correr');
    expect(mao.encerrada).toBe(true);
    expect(mao.vencedor).toBe('B');
    expect(mao.pontos).toBe(9);
  });

  test.each([
    [6, 1], // truco, 6 -> aceita
    [9, 2], // truco, 6, 9 -> aceita
    [12, 3], // truco, 6, 9, 12 -> aceita
  ])('vencer nas cartas uma mão valendo %i (após %i aumento(s)) dá esses pontos ao vencedor', (valor, aumentos) => {
    const mao = novaMao();
    mao.pedirTruco(0);
    let quemResponde = 1;
    for (let i = 0; i < aumentos; i++) {
      mao.responderTruco(quemResponde, 'aumentar');
      quemResponde = quemResponde === 1 ? 0 : 1;
    }
    mao.responderTruco(quemResponde, 'aceitar');
    expect(mao.valor).toBe(valor);
    jogarRodada(mao);
    jogarRodada(mao);
    expect(mao.vencedor).toBe('A');
    expect(mao.pontos).toBe(valor);
  });

  test('a aposta sobe na sequência 3, 6, 9, 12 e para no 12', () => {
    const mao = novaMao();
    mao.pedirTruco(0); // 3
    mao.responderTruco(1, 'aumentar'); // 6
    mao.responderTruco(0, 'aumentar'); // 9
    mao.responderTruco(1, 'aumentar'); // 12
    expect(mao.apostaPendente.valorProposto).toBe(12);
    expect(() => mao.responderTruco(0, 'aumentar')).toThrow();
    mao.responderTruco(0, 'aceitar');
    expect(mao.valor).toBe(12);
  });

  test('o mesmo time não pode pedir aumento duas vezes seguidas', () => {
    const mao = novaMao();
    mao.pedirTruco(0);
    mao.responderTruco(1, 'aceitar');
    // vez ainda é do jogador 0 (time A), que acabou de trucar
    expect(() => mao.pedirTruco(0)).toThrow();
  });

  test('depois do truco aceito, só o outro time pode pedir 6 (na sua vez)', () => {
    const mao = novaMao();
    mao.pedirTruco(0);
    mao.responderTruco(1, 'aceitar');
    mao.jogarCarta(0, 0);
    mao.pedirTruco(1);
    expect(mao.apostaPendente).toEqual({ valorProposto: 6, timeQuePediu: 'B', timeQueResponde: 'A' });
  });

  test('não é possível pedir truco depois que a mão terminou', () => {
    const mao = novaMao();
    jogarRodada(mao);
    jogarRodada(mao);
    expect(() => mao.pedirTruco(mao.jogadorDaVez)).toThrow();
  });
});

describe('Mao - mão de onze', () => {
  test('começa valendo 3 pontos', () => {
    expect(novaMao({ maoDeOnze: 'A' }).valor).toBe(3);
  });

  test('ninguém joga antes do time com 11 decidir se joga ou corre', () => {
    const mao = novaMao({ maoDeOnze: 'A' });
    expect(() => mao.jogarCarta(0, 0)).toThrow();
  });

  test('só o time que está com 11 pode decidir', () => {
    const mao = novaMao({ maoDeOnze: 'A' });
    expect(() => mao.decidirMaoDeOnze('B', 'jogar')).toThrow();
  });

  test('correr na mão de onze dá 1 ponto ao adversário', () => {
    const mao = novaMao({ maoDeOnze: 'A' });
    mao.decidirMaoDeOnze('A', 'correr');
    expect(mao.encerrada).toBe(true);
    expect(mao.vencedor).toBe('B');
    expect(mao.pontos).toBe(1);
  });

  test('jogar a mão de onze: o vencedor leva 3 pontos', () => {
    const mao = novaMao({ maoDeOnze: 'A' });
    mao.decidirMaoDeOnze('A', 'jogar');
    jogarRodada(mao);
    jogarRodada(mao);
    expect(mao.vencedor).toBe('A');
    expect(mao.pontos).toBe(3);
  });

  test('quem pedir truco na mão de onze faz o adversário ganhar a partida', () => {
    const mao = novaMao({ maoDeOnze: 'B' });
    mao.decidirMaoDeOnze('B', 'jogar');
    mao.pedirTruco(0);
    expect(mao.encerrada).toBe(true);
    expect(mao.vencedor).toBe('B');
    expect(mao.vitoriaDaPartida).toBe(true);
  });
});

describe('Mao - mão de ferro (os dois times com 11)', () => {
  test('vale 1 ponto e os jogadores não podem ver as próprias cartas', () => {
    const mao = novaMao({ maoDeFerro: true });
    expect(mao.valor).toBe(1);
    expect(mao.cartasVisiveis).toBe(false);
  });

  test('em uma mão normal, as cartas são visíveis', () => {
    expect(novaMao().cartasVisiveis).toBe(true);
  });

  test('pode jogar normalmente sem precisar decidir antes', () => {
    const mao = novaMao({ maoDeFerro: true });
    expect(() => mao.jogarCarta(0, 0)).not.toThrow();
  });
});
