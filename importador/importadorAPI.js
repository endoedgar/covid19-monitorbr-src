const fetch = require("node-fetch");
const fs = require("fs");
const { from } = require("rxjs");
const {
  groupBy,
  mergeMap,
  toArray,
  pairwise,
  scan,
  map,
  filter,
  startWith
} = require("rxjs/operators");

async function pegar(url) {
  let respostaTotal = [];
  try {
    do {
      const response = await fetch(url);
      const json = await response.json();
      respostaTotal = respostaTotal.concat(json.results);
      url = json.next;
    } while (url != null);
  } catch (err) {
    console.error(err);
  }
  respostaTotal = respostaTotal.sort((a, b) => {
    a = Date.parse(a.date);
    b = Date.parse(b.date);
    if (!a) return -1;
    if (!b) return 1;
    return a - b;
  });
  from(respostaTotal)
    .pipe(
      //filter(citycase => citycase.city_ibge_code == 3550308),
      groupBy(citycase => citycase.city_ibge_code),
      mergeMap(city =>
        city.pipe(
          startWith({deaths: 0, confirmed: 0}),
          scan(
            (acc, value) => {
              const newValue = { ...value };
              newValue.deaths = Math.max(acc.deaths, value.deaths);
              newValue.confirmed = Math.max(acc.confirmed, value.confirmed);
              return newValue;
            },
            { deaths: 0, confirmed: 0 }
          ),
          pairwise(),
          map(pair => {
            return {
              ...pair[1],
              confirmeddiff: pair[1].confirmed - pair[0].confirmed,
              deathsdiff: pair[1].deaths - pair[0].deaths
            };
          })
        )
      ),
      toArray()
    )
    .subscribe(vetor => {
      fs.writeFileSync(
        `${new Date().toISOString()}.json`,
        JSON.stringify(vetor)
      );
    });
}
pegar("https://brasil.io/api/dataset/covid19/caso/data");
