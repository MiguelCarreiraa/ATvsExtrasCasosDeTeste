const { criarBaralho, embaralhar, distribuir } = require('../src/baralho');

const chave = (carta) => `${carta.valor}-${carta.naipe}`;

describe('criarBaralho', () => {
  test('tem 40 cartas', () => {
    expect(criarBaralho()).toHaveLength(40);
  });

  test('não tem 8, 9, 10 nem coringa', () => {
    const valores = criarBaralho().map((carta) => carta.valor);
    ['8', '9', '10', 'coringa'].forEach((v) => expect(valores).not.toContain(v));
  });

  test('tem 10 cartas de cada um dos 4 naipes', () => {
    const baralho = criarBaralho();
    ['paus', 'copas', 'espadas', 'ouros'].forEach((naipe) => {
      expect(baralho.filter((carta) => carta.naipe === naipe)).toHaveLength(10);
    });
  });

  test('não tem cartas repetidas', () => {
    const chaves = criarBaralho().map(chave);
    expect(new Set(chaves).size).toBe(40);
  });
});

describe('embaralhar', () => {
  test('mantém as mesmas 40 cartas', () => {
    const baralho = criarBaralho();
    const embaralhado = embaralhar(baralho);
    expect(embaralhado.map(chave).sort()).toEqual(baralho.map(chave).sort());
  });

  test('não altera o baralho original', () => {
    const baralho = criarBaralho();
    const copia = baralho.map(chave);
    embaralhar(baralho);
    expect(baralho.map(chave)).toEqual(copia);
  });

  test('aceita um gerador de números aleatórios para ser determinístico', () => {
    const rng = () => 0.5;
    expect(embaralhar(criarBaralho(), rng)).toEqual(embaralhar(criarBaralho(), rng));
  });

  test('altera a ordem das cartas', () => {
    let seed = 1;
    const rng = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const baralho = criarBaralho();
    expect(embaralhar(baralho, rng).map(chave)).not.toEqual(baralho.map(chave));
  });
});

describe('distribuir', () => {
  test('entrega 3 cartas para cada um dos 4 jogadores', () => {
    const { maos } = distribuir(criarBaralho());
    expect(maos).toHaveLength(4);
    maos.forEach((mao) => expect(mao).toHaveLength(3));
  });

  test('distribui uma carta por vez, a partir do jogador 0, e vira a 13ª carta', () => {
    const baralho = criarBaralho();
    const { maos, vira } = distribuir(baralho);
    expect(maos[0]).toEqual([baralho[0], baralho[4], baralho[8]]);
    expect(maos[1]).toEqual([baralho[1], baralho[5], baralho[9]]);
    expect(maos[3]).toEqual([baralho[3], baralho[7], baralho[11]]);
    expect(vira).toEqual(baralho[12]);
  });

  test('nenhuma carta se repete entre as mãos e a vira', () => {
    const { maos, vira } = distribuir(embaralhar(criarBaralho()));
    const todas = [...maos.flat(), vira].map(chave);
    expect(new Set(todas).size).toBe(13);
  });

  test('sobram 27 cartas no monte', () => {
    const { monte } = distribuir(criarBaralho());
    expect(monte).toHaveLength(27);
  });
});
