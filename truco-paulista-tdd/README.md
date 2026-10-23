# Truco Paulista — Casos de Teste (TDD)

Testes escritos **antes** do código (TDD) para um jogo de Truco Paulista em JavaScript.
A pasta `src/` ainda não existe: o código deve ser criado até todos os testes passarem.

Regras baseadas em: https://www.megajogos.com.br/truco-online/regras

## Como rodar

```bash
npm install
npm test
```

## Contrato esperado (o que o código precisa exportar)

Módulos em CommonJS (`module.exports`). Carta = `{ valor, naipe }`, com
`valor` em `'4' '5' '6' '7' 'Q' 'J' 'K' 'A' '2' '3'` e
`naipe` em `'ouros' 'espadas' 'copas' 'paus'`.
Jogadores são `0..3`; jogadores 0 e 2 formam o time `'A'`, jogadores 1 e 3 o time `'B'`.
A ordem de jogo é 0 → 1 → 2 → 3 → 0.

| Arquivo | Exporta |
|---|---|
| `src/cartas.js` | `VALORES`, `NAIPES`, `calcularManilha(vira)`, `ehManilha(carta, vira)`, `compararCartas(a, b, vira)` |
| `src/baralho.js` | `criarBaralho()`, `embaralhar(baralho, rng?)`, `distribuir(baralho)` → `{ maos, vira, monte }` |
| `src/rodadas.js` | `timeDoJogador(j)`, `vencedorDaRodada(jogadas, vira)`, `vencedorDaMao(resultados)` |
| `src/mao.js` | classe `Mao` |
| `src/partida.js` | classe `Partida` |

### `Mao`

`new Mao({ maos, vira, jogadorInicial = 0, maoDeOnze = null, maoDeFerro = false })`

- Propriedades: `vira`, `valor`, `jogadorDaVez`, `rodadas`, `encerrada`, `vencedor` (`'A' | 'B' | 'empate' | null`),
  `pontos`, `apostaPendente` (`null` ou `{ valorProposto, timeQuePediu, timeQueResponde }`),
  `vitoriaDaPartida`, `maoDeOnze`, `maoDeFerro`, `cartasVisiveis`
- Métodos: `cartasDoJogador(j)`, `jogarCarta(j, indice, { coberta })`, `pedirTruco(j)`,
  `responderTruco(j, 'aceitar' | 'correr' | 'aumentar')`, `decidirMaoDeOnze(time, 'jogar' | 'correr')`
- Ações inválidas (fora da vez, mão encerrada, etc.) devem lançar erro (`throw`).

### `Partida`

`new Partida({ rng? })`

- Propriedades: `placar` (`{ A, B }`), `vencedor`, `encerrada`
- Métodos: `novaMao()` (retorna uma `Mao` já distribuída), `registrarMao(mao)`

## Regras cobertas

- Baralho de 40 cartas (sem 8, 9, 10 e coringa), 3 cartas por jogador e uma vira
- Manilha = carta seguinte à vira (4 5 6 7 Q J K A 2 3, circular)
- Força: manilhas (paus > copas > espadas > ouros) > 3 > 2 > A > K > J > Q > 7 > 6 > 5 > 4
- Melhor de 3 rodadas e todas as regras de empate
- Carta coberta não vale nada
- Truco (3) → 6 → 9 → 12, aceitar / correr / aumentar, sem o mesmo time aumentar duas vezes seguidas
- Mão de onze (vale 3, pode correr dando 1 ponto, pedir truco perde a partida)
- Mão de ferro (os dois com 11, cartas no escuro)
- Partida até 12 pontos

## Convenções escolhidas (o site não define)

- Após uma rodada empatada, quem começou essa rodada começa a próxima.
- Quem começa cada mão gira a cada nova mão (0, 1, 2, 3, 0...).
- Mão de ferro vale 1 ponto.
